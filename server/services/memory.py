"""
Service Mémoire - Gestion mémoire conversationnelle et mémoires long terme
Extrait de simple_rag_server.py
"""
import os
from datetime import datetime
import requests
from .rag import sanitize_input

# Configuration Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')

# ===== MÉMOIRE DE CONVERSATION =====
conversation_memory = {}  # Format: {user_id: [messages]}
MAX_MEMORY_MESSAGES = 10
MAX_USERS_IN_MEMORY = 1000

def get_conversation_history(user_id: str) -> list:
    """Récupère l'historique de conversation (derniers 10 messages)"""
    return conversation_memory.get(user_id, [])[-MAX_MEMORY_MESSAGES:]

def add_to_conversation(user_id: str, message: str, response: str):
    """Ajoute un échange à l'historique avec limite globale"""
    # Cleanup si trop d'utilisateurs en mémoire
    if len(conversation_memory) >= MAX_USERS_IN_MEMORY:
        # Supprimer l'utilisateur le plus ancien
        if conversation_memory:
            oldest_user = min(
                conversation_memory.items(),
                key=lambda x: x[1][-1].get('timestamp', '') if x[1] else ''
            )[0]
            del conversation_memory[oldest_user]
            print(f"🧹 Cleanup mémoire: suppression user {oldest_user}")

    if user_id not in conversation_memory:
        conversation_memory[user_id] = []

    conversation_memory[user_id].append({
        'user': sanitize_input(message, 500),
        'assistant': sanitize_input(response, 1000),
        'timestamp': datetime.now().isoformat()
    })

    # Cleanup si trop grand (garder dernier 10)
    if len(conversation_memory[user_id]) > MAX_MEMORY_MESSAGES:
        conversation_memory[user_id] = conversation_memory[user_id][-MAX_MEMORY_MESSAGES:]

# ===== MÉMOIRES LONG TERME (SUPABASE) =====
def fetch_user_memories(user_id: str, limit: int = 5) -> list:
    """🧠 Récupère les mémoires à long terme de l'utilisateur depuis Supabase"""
    try:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            return []

        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        }

        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/user_memories?user_id=eq.{user_id}&order=importance_score.desc,created_at.desc&limit={limit}",
            headers=headers,
            timeout=2
        )

        if response.status_code == 200:
            memories = response.json()
            print(f"🧠 {len(memories)} mémoires récupérées pour {user_id}")
            return memories
        else:
            return []

    except Exception as e:
        print(f"⚠️ Erreur fetch_user_memories: {e}")
        return []
