"""
🔐 Client Supabase pour Python Backend
Permet d'interroger la base de données Supabase avec RLS
"""

import os
from supabase import create_client, Client
from typing import Optional, Dict, List
from dotenv import load_dotenv

load_dotenv()

# Credentials Supabase
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("❌ SUPABASE_URL et SUPABASE_ANON_KEY sont requis dans .env")

# Client Supabase global
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def get_supabase_client_with_auth(access_token: str) -> Client:
    """
    Crée un client Supabase avec authentification utilisateur
    (nécessaire pour RLS - Row Level Security)
    """
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    # Set auth token pour RLS
    client.postgrest.auth(access_token)

    return client


# ====== SERVICES DE DONNÉES ======

class DocumentsService:
    """Service pour gérer les documents utilisateur"""

    @staticmethod
    def get_user_documents(user_id: str, access_token: str) -> List[Dict]:
        """Récupère tous les documents d'un utilisateur"""
        try:
            client = get_supabase_client_with_auth(access_token)

            response = client.table('user_documents') \
                .select('*') \
                .eq('user_id', user_id) \
                .order('created_at', desc=True) \
                .execute()

            return response.data if response.data else []

        except Exception as e:
            print(f"❌ Erreur récupération documents: {e}")
            return []


class AidesService:
    """Service pour gérer les aides utilisateur"""

    @staticmethod
    def get_user_aides(user_id: str, access_token: str) -> List[Dict]:
        """Récupère toutes les aides d'un utilisateur"""
        try:
            client = get_supabase_client_with_auth(access_token)

            response = client.table('user_aides') \
                .select('*') \
                .eq('user_id', user_id) \
                .order('created_at', desc=True) \
                .execute()

            return response.data if response.data else []

        except Exception as e:
            print(f"❌ Erreur récupération aides: {e}")
            return []


class DeadlinesService:
    """Service pour gérer les échéances utilisateur"""

    @staticmethod
    def get_user_deadlines(user_id: str, access_token: str) -> List[Dict]:
        """Récupère toutes les échéances d'un utilisateur"""
        try:
            client = get_supabase_client_with_auth(access_token)

            response = client.table('user_deadlines') \
                .select('*') \
                .eq('user_id', user_id) \
                .order('date', desc=False) \
                .execute()

            return response.data if response.data else []

        except Exception as e:
            print(f"❌ Erreur récupération échéances: {e}")
            return []


class FamilyService:
    """Service pour gérer le profil famille"""

    @staticmethod
    def get_family_profile(user_id: str, access_token: str) -> Optional[Dict]:
        """Récupère le profil famille d'un utilisateur"""
        try:
            client = get_supabase_client_with_auth(access_token)

            response = client.table('family_profiles') \
                .select('*') \
                .eq('user_id', user_id) \
                .single() \
                .execute()

            return response.data if response.data else None

        except Exception as e:
            print(f"❌ Erreur récupération profil famille: {e}")
            return None

    @staticmethod
    def get_children(family_id: str, access_token: str) -> List[Dict]:
        """Récupère les enfants d'une famille"""
        try:
            client = get_supabase_client_with_auth(access_token)

            response = client.table('children') \
                .select('*') \
                .eq('family_id', family_id) \
                .order('created_at', desc=False) \
                .execute()

            return response.data if response.data else []

        except Exception as e:
            print(f"❌ Erreur récupération enfants: {e}")
            return []


# Export des services
__all__ = [
    'supabase',
    'get_supabase_client_with_auth',
    'DocumentsService',
    'AidesService',
    'DeadlinesService',
    'FamilyService'
]
