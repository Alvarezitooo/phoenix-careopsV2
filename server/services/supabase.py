"""
Service Supabase - Sauvegarde conversations et persistance
Extrait de simple_rag_server.py
"""
import os
from datetime import datetime
import requests

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def save_conversation_to_supabase(user_id: str, message: str, response: str, sources: list):
    """💾 Sauvegarde ou met à jour la conversation dans Supabase"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return

    try:
        headers = {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }

        # 1. Chercher si une conversation existe déjà pour cet utilisateur
        search_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/conversations?user_id=eq.{user_id}&select=id,messages",
            headers=headers,
            timeout=3
        )

        existing_conversations = search_response.json() if search_response.status_code == 200 else []

        # Créer le nouveau message
        new_message = {
            'role': 'user',
            'content': message,
            'timestamp': datetime.now().isoformat()
        }

        new_response_msg = {
            'role': 'assistant',
            'content': response,
            'sources': sources,
            'timestamp': datetime.now().isoformat()
        }

        if existing_conversations and len(existing_conversations) > 0:
            # 2. UPDATE : Ajouter les messages à la conversation existante
            conversation = existing_conversations[0]
            conversation_id = conversation['id']
            existing_messages = conversation.get('messages', [])

            # Ajouter les nouveaux messages
            existing_messages.append(new_message)
            existing_messages.append(new_response_msg)

            # Limiter à 100 derniers messages
            if len(existing_messages) > 100:
                existing_messages = existing_messages[-100:]

            update_data = {
                'messages': existing_messages,
                'updated_at': datetime.now().isoformat()
            }

            update_response = requests.patch(
                f"{SUPABASE_URL}/rest/v1/conversations?id=eq.{conversation_id}",
                headers=headers,
                json=update_data,
                timeout=3
            )

            if update_response.status_code in [200, 204]:
                print(f"💾 Conversation mise à jour ({len(existing_messages)} messages)")
            else:
                print(f"⚠️ Erreur update Supabase: {update_response.status_code}")

        else:
            # 3. INSERT : Créer une nouvelle conversation
            insert_data = {
                'user_id': user_id,
                'messages': [new_message, new_response_msg],
                'context': {},
                'created_at': datetime.now().isoformat()
            }

            insert_response = requests.post(
                f"{SUPABASE_URL}/rest/v1/conversations",
                headers=headers,
                json=insert_data,
                timeout=3
            )

            if insert_response.status_code in [200, 201]:
                print(f"💾 Nouvelle conversation créée dans Supabase")
            else:
                print(f"⚠️ Erreur insert Supabase: {insert_response.status_code}")

    except Exception as e:
        print(f"⚠️ Erreur sauvegarde Supabase: {e}")
