"""
🚀 PHOENIXCARE FASTAPI SERVER
Migration progressive de Flask vers FastAPI
"""
from fastapi import FastAPI, HTTPException, Request, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
from datetime import datetime
import re

# Import config et models
from config.settings import settings
from models.schemas import (
    ChatRequest, ChatResponse,
    HealthResponse, CacheStats, MemoryStats,
    FeedbackRequest, FeedbackResponse
)
from core.cache import cache

# Import services modulaires
from services.rag import (
    find_relevant_documents,
    generate_with_gemini,
    extract_suggestions,
    sanitize_input,
    validate_context,
    PROMPTS,
    knowledge_base
)
from services.memory import (
    get_conversation_history,
    add_to_conversation,
    fetch_user_memories,
    conversation_memory,
    MAX_MEMORY_MESSAGES
)
from services.supabase import save_conversation_to_supabase
from services.analytics import (
    log_chat_interaction,
    get_top_questions,
    get_knowledge_gaps,
    get_cache_performance,
    get_user_stats,
    get_overall_stats,
    submit_feedback
)


# ===== LIFECYCLE =====
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie de l'application"""
    print("=" * 60)
    print("🚀 SERVEUR FASTAPI PHOENIX - VERSION 2.0")
    print("=" * 60)
    print(f"📚 Base de connaissances: {len(knowledge_base)} documents")
    print(f"🔑 Gemini API: {'✅' if settings.gemini_api_key else '❌'}")
    print(f"🔐 Supabase: {'✅' if settings.supabase_url else '❌'}")

    # Connexion Redis
    await cache.connect()
    cache_stats = await cache.get_stats()
    print(f"💾 Cache: {cache_stats['backend'].upper()} - TTL {settings.cache_ttl_hours}h")

    print(f"📝 Prompts: {len(PROMPTS)} templates chargés")
    print("=" * 60)
    print(f"📍 Listening on: {settings.host}:{settings.port}")
    print("=" * 60)

    yield

    print("\n🛑 Arrêt du serveur...")
    await cache.disconnect()


# ===== APP =====
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan
)

# ===== CORS =====
# Combine allowed origins + Vercel regex pattern
origins = settings.allowed_origins_list
vercel_pattern = re.compile(settings.vercel_pattern)

def is_allowed_origin(origin: str) -> bool:
    """Vérifie si l'origine est autorisée"""
    if origin in origins:
        return True
    if vercel_pattern.match(origin):
        return True
    return False

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=settings.vercel_pattern,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== RATE LIMITING REDIS =====
async def check_rate_limit(request: Request):
    """🚦 Rate limiting avec Redis (sliding window)"""
    client_ip = request.client.host
    user_id = getattr(request.state, 'user_id', client_ip)

    # Check rate limit via Redis/memory cache
    is_limited = await cache.check_rate_limit(
        user_id=user_id,
        max_requests=settings.rate_limit_requests,
        window_seconds=settings.rate_limit_window
    )

    if is_limited:
        raise HTTPException(
            status_code=429,
            detail=f"⏱️ Rate limit dépassé. Max {settings.rate_limit_requests} requêtes par {settings.rate_limit_window}s. Réessayez dans quelques instants."
        )


# ===== AUTH MIDDLEWARE =====
from services.auth import get_current_user, get_current_user_optional, require_admin


# ===== ENDPOINTS =====

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """🏥 Health check"""
    stats = await cache.get_stats()

    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        gemini_available=bool(settings.gemini_api_key),
        supabase_available=bool(settings.supabase_url),
        cache_stats=stats
    )


@app.post("/api/chat/send", response_model=ChatResponse)
async def chat_send(
    chat_request: ChatRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user_optional),
    rate_limit_check = Depends(check_rate_limit)
):
    """🚀 Endpoint principal pour le chat RAG (ASYNC)"""
    start_time = time.time()

    try:
        # Sanitize input
        message = sanitize_input(chat_request.message, max_length=2000)

        # Use authenticated user ID if available, else fallback to request user_id
        user_id = current_user["id"] if current_user else chat_request.user_id

        print(f"📨 Requête reçue: {message[:50]}... (user: {user_id})")

        # 🚀 VÉRIFIER LE CACHE D'ABORD (ASYNC)
        cached_response = await cache.get(message)
        if cached_response:
            print(f"⚡ Réponse depuis le cache!")
            return ChatResponse(
                response=cached_response['answer'],
                sources=cached_response.get('sources', []),
                suggestions=cached_response.get('suggestions', []),
                cached=True
            )

        # 💭 Récupérer l'historique de conversation
        conversation_history = get_conversation_history(user_id)
        has_history = len(conversation_history) > 0

        # 🧠 Récupérer les mémoires à long terme
        user_memories = fetch_user_memories(user_id, limit=5)

        # Recherche documents pertinents
        relevant_docs = find_relevant_documents(message)

        # 📝 CONSTRUCTION DU PROMPT
        if relevant_docs:
            sources_list = "\n".join([
                f"- {doc['title']} (pertinence: {doc['score']})"
                for doc in relevant_docs
            ])

            context = "\n\n---\n\n".join([
                f"📄 SOURCE: {doc['title']}\n\n{doc['content']}"
                for doc in relevant_docs
            ])

            # Historique
            history_text = ""
            if has_history:
                history_text = "\n💭 HISTORIQUE RÉCENT DE LA CONVERSATION:\n"
                for idx, exchange in enumerate(conversation_history[-3:], 1):
                    history_text += f"{idx}. Utilisateur: {exchange['user']}\n"
                    history_text += f"   Toi: {exchange['assistant'][:100]}...\n\n"

            # Mémoires
            memories_text = ""
            if user_memories:
                memories_text = "\n🧠 CE QUE JE SAIS SUR CET UTILISATEUR :\n"
                for idx, memory in enumerate(user_memories, 1):
                    memory_content = memory.get('memory_content', '')
                    memory_type = memory.get('memory_type', 'general')
                    importance = memory.get('importance_score', 5)
                    memories_text += f"{idx}. [{memory_type}] {memory_content} (importance: {importance}/10)\n"
                memories_text += "\n⚠️ UTILISE CES MÉMOIRES pour personnaliser tes réponses !\n"

            prompt_template = PROMPTS.get('chat_with_sources', "Tu es PhoenixIA...")
            prompt = prompt_template.format(
                history_text=history_text,
                memories_text=memories_text,
                context_text="",
                sources_list=sources_list,
                context=context,
                message=message
            )
        else:
            # Sans sources
            history_text = ""
            if has_history:
                history_text = "\n💭 HISTORIQUE RÉCENT:\n"
                for idx, exchange in enumerate(conversation_history[-3:], 1):
                    history_text += f"{idx}. Utilisateur: {exchange['user']}\n"
                    history_text += f"   Toi: {exchange['assistant'][:100]}...\n\n"

            memories_text = ""
            if user_memories:
                memories_text = "\n🧠 CE QUE JE SAIS SUR CET UTILISATEUR :\n"
                for idx, memory in enumerate(user_memories, 1):
                    memories_text += f"{idx}. {memory.get('memory_content', '')}\n"

            prompt_template = PROMPTS.get('chat_without_sources', "Tu es PhoenixIA...")
            prompt = prompt_template.format(
                history_text=history_text,
                memories_text=memories_text,
                message=message
            )

        # 🔐 Génération avec Gemini (encore sync, à migrer plus tard)
        try:
            full_response = generate_with_gemini(prompt, max_retries=3)
        except Exception as e:
            print(f"❌ Échec Gemini: {e}")
            full_response = """Je rencontre des difficultés techniques.

Voici ce que je recommande :
1. **Réessayez dans quelques instants**
2. **Contactez votre MDPH** au 0 800 360 360
3. **Visitez service-public.fr**

SUGGESTIONS:
- Quelles sont les coordonnées de ma MDPH ?
- Comment faire une réclamation ?
- Où trouver de l'aide ?"""

        # Extraire suggestions
        answer, suggestions = extract_suggestions(full_response)

        # Sources utilisées
        sources = [doc['title'] for doc in relevant_docs] if relevant_docs else []

        processing_time = round(time.time() - start_time, 2)

        result = {
            "answer": answer,
            "sources": sources,
            "suggestions": suggestions,
            "processing_time": processing_time,
            "timestamp": datetime.now().isoformat(),
            "from_cache": False
        }

        # 💾 STOCKER DANS LE CACHE (ASYNC)
        await cache.set(message, result)

        # 💭 AJOUTER À LA MÉMOIRE
        add_to_conversation(user_id, message, answer)

        # 💾 SAUVEGARDER DANS SUPABASE (BACKGROUND TASK - non-bloquant)
        background_tasks.add_task(
            save_conversation_to_supabase,
            user_id, message, answer, sources
        )

        # 📊 LOG ANALYTICS (BACKGROUND TASK - non-bloquant)
        background_tasks.add_task(
            log_chat_interaction,
            user_id, message, answer, sources, suggestions,
            False,  # cached (on log que les non-cached pour l'instant)
            int(processing_time * 1000)  # Convert to ms
        )

        print(f"✅ Réponse générée: {len(answer)} chars, {processing_time}s")

        return ChatResponse(
            response=answer,
            sources=sources,
            suggestions=suggestions,
            cached=False
        )

    except Exception as e:
        print(f"❌ Erreur RAG: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la génération: {str(e)}"
        )


@app.get("/api/cache/stats", response_model=CacheStats)
async def get_cache_stats():
    """📊 Statistiques du cache"""
    stats = await cache.get_stats()
    return CacheStats(**stats)


@app.get("/api/memory/stats", response_model=MemoryStats)
async def get_memory_stats():
    """💭 Statistiques de la mémoire conversationnelle"""
    total_users = len(conversation_memory)
    total_messages = sum(len(msgs) for msgs in conversation_memory.values())
    avg = total_messages / total_users if total_users > 0 else 0

    return MemoryStats(
        total_users=total_users,
        total_messages=total_messages,
        avg_messages_per_user=round(avg, 2)
    )


@app.delete("/api/memory/clear/{user_id}")
async def clear_memory(user_id: str):
    """🗑️ Effacer la mémoire conversationnelle d'un utilisateur"""
    if user_id in conversation_memory:
        del conversation_memory[user_id]
        return {"message": f"Mémoire effacée pour {user_id}"}
    return {"message": "Aucune mémoire trouvée"}


# ===== ANALYTICS ENDPOINTS =====

@app.get("/api/analytics/overview")
async def analytics_overview():
    """📊 Vue d'ensemble des analytics (dashboard summary)"""
    return get_overall_stats()


@app.get("/api/analytics/top-questions")
async def analytics_top_questions(limit: int = 20):
    """📈 Top questions les plus posées"""
    return get_top_questions(limit=limit)


@app.get("/api/analytics/knowledge-gaps")
async def analytics_knowledge_gaps(limit: int = 20):
    """🔍 Questions sans sources (gaps knowledge base)"""
    return get_knowledge_gaps(limit=limit)


@app.get("/api/analytics/cache-performance")
async def analytics_cache_perf(days: int = 30):
    """⚡ Performance du cache par jour"""
    return get_cache_performance(days=days)


@app.get("/api/analytics/user-stats")
async def analytics_users():
    """👥 Statistiques par utilisateur"""
    return get_user_stats()


# ===== FEEDBACK ENDPOINT =====

@app.post("/api/chat/feedback", response_model=FeedbackResponse)
async def chat_feedback(feedback: FeedbackRequest):
    """
    💬 Soumettre un feedback utilisateur sur une réponse

    Body:
    {
        "user_id": "user123",
        "question": "Comment obtenir l'AEEH ?",
        "response": "L'AEEH est...",
        "rating": 5,
        "comment": "Très utile !"
    }
    """
    try:
        feedback_id = submit_feedback(
            user_id=feedback.user_id,
            question=feedback.question,
            response=feedback.response,
            rating=feedback.rating,
            comment=feedback.comment
        )

        if feedback_id:
            return FeedbackResponse(
                success=True,
                message="Merci pour votre feedback !",
                feedback_id=feedback_id
            )
        else:
            return FeedbackResponse(
                success=False,
                message="Impossible d'enregistrer le feedback (interaction non trouvée)",
                feedback_id=None
            )

    except Exception as e:
        print(f"❌ Erreur feedback endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'enregistrement du feedback: {str(e)}"
        )


# ===== FALLBACK =====
@app.get("/")
async def root():
    """🏠 Page d'accueil"""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level="info"
    )
