"""
📊 Service Analytics pour PhoenixCare
Tracking et métriques des interactions RAG
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from config.settings import settings
from supabase import create_client, Client


# Client Supabase
supabase: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    """Lazy load Supabase client"""
    global supabase
    if supabase is None and settings.supabase_url and settings.supabase_anon_key:
        supabase = create_client(settings.supabase_url, settings.supabase_anon_key)
    return supabase


def log_chat_interaction(
    user_id: str,
    question: str,
    response: str,
    sources: List[str],
    suggestions: List[str],
    cached: bool,
    processing_time_ms: int
) -> bool:
    """
    📝 Log une interaction chat dans Supabase Analytics

    Args:
        user_id: ID de l'utilisateur
        question: Question posée
        response: Réponse générée
        sources: Sources utilisées
        suggestions: Suggestions retournées
        cached: Vrai si depuis le cache
        processing_time_ms: Temps de traitement en ms

    Returns:
        True si succès, False sinon
    """
    client = get_supabase_client()
    if not client:
        print("⚠️  Supabase non configuré - analytics non loggé")
        return False

    try:
        data = {
            "user_id": user_id,
            "question": question,
            "question_length": len(question),
            "response": response,
            "response_length": len(response),
            "sources_used": sources,
            "num_sources": len(sources),
            "cached": cached,
            "processing_time_ms": processing_time_ms,
            "has_suggestions": len(suggestions) > 0,
            "num_suggestions": len(suggestions),
        }

        result = client.table("chat_analytics").insert(data).execute()

        if result.data:
            print(f"📊 Analytics logged: {user_id[:8]}... - {len(question)} chars")
            return True
        else:
            print(f"⚠️  Analytics insert failed: {result}")
            return False

    except Exception as e:
        print(f"❌ Erreur analytics logging: {e}")
        return False


def get_top_questions(limit: int = 20, days: int = 30) -> List[Dict[str, Any]]:
    """
    📈 Récupère les questions les plus posées

    Args:
        limit: Nombre de résultats
        days: Période en jours

    Returns:
        Liste des top questions avec stats
    """
    client = get_supabase_client()
    if not client:
        return []

    try:
        # Utilise la vue créée dans la migration
        result = client.table("top_questions").select("*").limit(limit).execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"❌ Erreur get_top_questions: {e}")
        return []


def get_knowledge_gaps(limit: int = 20) -> List[Dict[str, Any]]:
    """
    🔍 Identifie les questions sans sources (gaps knowledge base)

    Returns:
        Questions sans bonnes réponses
    """
    client = get_supabase_client()
    if not client:
        return []

    try:
        result = client.table("questions_without_sources").select("*").limit(limit).execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"❌ Erreur get_knowledge_gaps: {e}")
        return []


def get_cache_performance(days: int = 30) -> List[Dict[str, Any]]:
    """
    ⚡ Statistiques de performance du cache

    Args:
        days: Période en jours

    Returns:
        Stats cache par jour
    """
    client = get_supabase_client()
    if not client:
        return []

    try:
        result = client.table("cache_performance").select("*").limit(days).execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"❌ Erreur get_cache_performance: {e}")
        return []


def get_user_stats() -> List[Dict[str, Any]]:
    """
    👥 Statistiques par utilisateur

    Returns:
        Stats agrégées par user
    """
    client = get_supabase_client()
    if not client:
        return []

    try:
        result = client.table("user_stats").select("*").limit(100).execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"❌ Erreur get_user_stats: {e}")
        return []


def get_overall_stats() -> Dict[str, Any]:
    """
    📊 Statistiques globales (dashboard summary)

    Returns:
        Métriques clés agrégées
    """
    client = get_supabase_client()
    if not client:
        return {}

    try:
        # Total interactions (last 30 days)
        result_count = client.table("chat_analytics") \
            .select("*", count="exact") \
            .gte("created_at", f"now() - interval '30 days'") \
            .execute()

        total_interactions = result_count.count if result_count.count else 0

        # Avg cache hit rate
        cache_perf = get_cache_performance(days=30)
        avg_cache_hit_rate = (
            sum(row.get("cache_hit_rate", 0) for row in cache_perf) / len(cache_perf)
            if cache_perf else 0
        )

        # Avg response time
        result_avg_time = client.table("chat_analytics") \
            .select("processing_time_ms") \
            .gte("created_at", f"now() - interval '30 days'") \
            .execute()

        avg_response_time = 0
        if result_avg_time.data:
            times = [row.get("processing_time_ms", 0) for row in result_avg_time.data if row.get("processing_time_ms")]
            avg_response_time = sum(times) / len(times) if times else 0

        # Unique users
        result_users = client.table("chat_analytics") \
            .select("user_id", count="exact") \
            .gte("created_at", f"now() - interval '30 days'") \
            .execute()

        unique_users = len(set(row["user_id"] for row in result_users.data)) if result_users.data else 0

        return {
            "total_interactions_30d": total_interactions,
            "unique_users_30d": unique_users,
            "avg_cache_hit_rate": round(avg_cache_hit_rate, 2),
            "avg_response_time_ms": round(avg_response_time, 0),
        }

    except Exception as e:
        print(f"❌ Erreur get_overall_stats: {e}")
        return {}
