"""
🚀 PHOENIXCARE FASTAPI SERVER
Migration progressive de Flask vers FastAPI
"""
from fastapi import FastAPI, HTTPException, Request, Depends
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
    HealthResponse, CacheStats, MemoryStats
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
    print(f"💾 Cache: TTL {settings.cache_ttl_hours}h, Max {settings.cache_max_size} entrées")
    print(f"📝 Prompts: {len(PROMPTS)} templates chargés")
    print("=" * 60)
    print(f"📍 Listening on: {settings.host}:{settings.port}")
    print("=" * 60)

    yield

    print("\n🛑 Arrêt du serveur...")


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


# ===== RATE LIMITING SIMPLE =====
from collections import defaultdict
from datetime import datetime, timedelta

rate_limit_store = defaultdict(list)

async def check_rate_limit(request: Request):
    """Rate limiting simple (to be replaced by Redis)"""
    client_ip = request.client.host
    user_id = getattr(request.state, 'user_id', client_ip)

    now = datetime.now()
    window_start = now - timedelta(seconds=settings.rate_limit_window)

    # Clean old requests
    rate_limit_store[user_id] = [
        req_time for req_time in rate_limit_store[user_id]
        if req_time > window_start
    ]

    # Check limit
    if len(rate_limit_store[user_id]) >= settings.rate_limit_requests:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit dépassé. Max {settings.rate_limit_requests} requêtes par {settings.rate_limit_window}s"
        )

    rate_limit_store[user_id].append(now)


# ===== AUTH MIDDLEWARE (simplifié pour l'instant) =====
async def get_user_from_token(request: Request):
    """Extraction user_id depuis le token (simplifié)"""
    # TODO: Implémenter vraie validation JWT
    auth_header = request.headers.get("Authorization", "")

    if auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        # Pour l'instant, on accepte tout et on retourne un user_id basique
        # À remplacer par vraie validation JWT
        return {"id": "user_from_token", "email": "user@example.com"}

    # Fallback pour dev
    return {"id": "anonymous", "email": None}


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
    rate_limit_check = Depends(check_rate_limit)
):
    """🚀 Endpoint principal pour le chat RAG (ASYNC)"""
    start_time = time.time()

    try:
        # Sanitize input
        message = sanitize_input(chat_request.message, max_length=2000)
        user_id = chat_request.user_id

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

        # 💾 SAUVEGARDER DANS SUPABASE (non-bloquant)
        try:
            save_conversation_to_supabase(user_id, message, answer, sources)
        except Exception as e:
            print(f"⚠️ Erreur sauvegarde Supabase: {e}")

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
