"""
Service Mémoire - Gestion mémoire conversationnelle et mémoires long terme
Extrait de simple_rag_server.py
"""
import os
from datetime import datetime
import requests
from typing import Optional, Dict, Any, List # Added for type hints
from .rag import sanitize_input

# Configuration Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') # Added for server-to-server operations

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

def save_last_guided_state(user_id: str, situation: str, priority: str, next_step: str):
    """
    💾 Sauvegarde le dernier état guidé de l'utilisateur dans Supabase.
    Utilise la clé service_role pour bypasser RLS si nécessaire (opérations serveur-à-serveur).
    """
    try:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            print("⚠️ Supabase service role key non configurée - état guidé non sauvegardé")
            return

        headers = {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates' # Pour upsert
        }

        data = {
            "user_id": user_id,
            "situation": situation,
            "priority": priority,
            "next_step": next_step
        }

        # Tente d'insérer ou de mettre à jour l'état guidé
        # Utilise 'on_conflict' pour gérer l'upsert sur user_id
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/user_guided_states",
            headers=headers,
            json=data,
            params={'on_conflict': 'user_id'}, # Upsert sur user_id
            timeout=5
        )

        if response.status_code in [200, 201, 204, 409]: # 409 Conflict pour upsert si déjà existant
            print(f"✅ État guidé sauvegardé pour {user_id}")
        else:
            print(f"❌ Erreur sauvegarde état guidé ({response.status_code}): {response.text}")

    except Exception as e:
        print(f"⚠️ Erreur save_last_guided_state: {e}")

def get_last_guided_state(user_id: str) -> Optional[Dict[str, str]]:
    """
    Retrieves the last guided state for a user from Supabase.
    """
    try:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            return None

        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        }

        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/user_guided_states?user_id=eq.{user_id}&select=situation,priority,next_step&limit=1",
            headers=headers,
            timeout=2
        )

        if response.status_code == 200 and response.json():
            state = response.json()[0]
            print(f"🧠 État guidé récupéré pour {user_id}: {state}")
            return state
        else:
            return None

    except Exception as e:
        print(f"⚠️ Erreur get_last_guided_state: {e}")
        return None
