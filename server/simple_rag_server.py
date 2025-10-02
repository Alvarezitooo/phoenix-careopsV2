#!/usr/bin/env python3
"""
🚀 SERVEUR RAG SIMPLE POUR PHOENIXCARE
Serveur Flask basique pour tester l'intégration frontend
"""

import os
import sys
import json
import hashlib
import time
import base64
from pathlib import Path
from datetime import datetime, timedelta
from difflib import SequenceMatcher
from collections import OrderedDict
from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps

# Ajout du chemin pour importer le RAG
sys.path.append(str(Path(__file__).parent / 'src'))

# Import du système RAG simple
import google.generativeai as genai
from dotenv import load_dotenv
import requests
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import stripe

# Chargement variables d'environnement
load_dotenv()

# Variables Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')  # Fallback pour compatibilité

# Configuration Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')

app = Flask(__name__)

# 🔒 CORS sécurisé - Uniquement origines autorisées
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001').split(',')
CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

# ===== 🚀 SYSTÈME DE CACHE IN-MEMORY =====
class SmartCache:
    """Cache in-memory avec TTL et limite de taille"""
    def __init__(self, ttl_hours=24, max_size=1000):
        self.cache = OrderedDict()
        self.ttl = timedelta(hours=ttl_hours)
        self.max_size = max_size
        self.hits = 0
        self.misses = 0

    def _normalize_query(self, query: str) -> str:
        """Normalise la requête pour améliorer le cache hit"""
        return query.lower().strip()

    def _get_hash(self, query: str) -> str:
        """Hash de la requête normalisée (SHA256 pour sécurité)"""
        normalized = self._normalize_query(query)
        return hashlib.sha256(normalized.encode()).hexdigest()

    def get(self, query: str):
        """Récupère depuis le cache si valide"""
        cache_key = self._get_hash(query)

        if cache_key in self.cache:
            entry = self.cache[cache_key]
            if datetime.now() < entry['expires_at']:
                self.hits += 1
                # Move to end (LRU)
                self.cache.move_to_end(cache_key)
                print(f"✅ Cache HIT ({self.hits} hits, {self.misses} misses)")
                return entry['data']
            else:
                del self.cache[cache_key]

        self.misses += 1
        print(f"❌ Cache MISS ({self.hits} hits, {self.misses} misses)")
        return None

    def set(self, query: str, data: dict):
        """Stocke dans le cache avec TTL"""
        cache_key = self._get_hash(query)

        # Cleanup si trop grand
        if len(self.cache) >= self.max_size:
            # Supprimer le plus ancien (FIFO)
            self.cache.popitem(last=False)
            print(f"🧹 Cache cleanup: {len(self.cache)}/{self.max_size}")

        self.cache[cache_key] = {
            'data': data,
            'expires_at': datetime.now() + self.ttl,
            'created_at': datetime.now()
        }

    def get_stats(self):
        """Stats du cache"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        return {
            'size': len(self.cache),
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate': f"{hit_rate:.1f}%"
        }

# Instance globale du cache
cache = SmartCache(ttl_hours=24, max_size=1000)

# ===== 🔒 RATE LIMITING SIMPLE =====
rate_limit_store = {}

def rate_limit(max_requests=10, window_minutes=1):
    """Rate limiting simple: max_requests par window_minutes"""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # Récupérer l'IP ou user_id
            ip = request.remote_addr
            user_id = request.get_json().get('user_id', ip) if request.get_json() else ip
            key = f"ratelimit:{user_id}"

            now = time.time()
            window_start = now - (window_minutes * 60)

            # Cleanup des anciennes entrées
            if key in rate_limit_store:
                rate_limit_store[key] = [t for t in rate_limit_store[key] if t > window_start]
            else:
                rate_limit_store[key] = []

            # Vérifier la limite
            if len(rate_limit_store[key]) >= max_requests:
                return jsonify({
                    "error": "Trop de requêtes, réessayez dans quelques instants",
                    "retry_after": 60
                }), 429

            # Ajouter la requête actuelle
            rate_limit_store[key].append(now)

            return f(*args, **kwargs)
        return wrapped
    return decorator

# ===== 🛡️ SÉCURITÉ =====
def sanitize_input(text: str, max_length: int = 2000) -> str:
    """Nettoie et valide l'input utilisateur"""
    if not text:
        return ""

    # Limiter longueur
    text = str(text)[:max_length]

    # Enlever caractères de contrôle (garder \n \r)
    text = ''.join(char for char in text if char.isprintable() or char in '\n\r\t')

    # Échapper triples quotes qui cassent le prompt
    text = text.replace('"""', '').replace("'''", "")

    return text.strip()

def validate_context(context: dict) -> dict:
    """Valide et limite le contexte utilisateur"""
    if not isinstance(context, dict):
        return {}

    safe_context = {}

    # Limiter aides (max 10)
    if 'aides' in context and isinstance(context['aides'], list):
        safe_context['aides'] = context['aides'][:10]

    # Limiter deadlines (max 5)
    if 'deadlines' in context and isinstance(context['deadlines'], list):
        safe_context['deadlines'] = context['deadlines'][:5]

    # Limiter documents (max 5)
    if 'documents' in context and isinstance(context['documents'], list):
        safe_context['documents'] = context['documents'][:5]

    # Profil sécurisé
    if 'profile' in context and isinstance(context['profile'], dict):
        profile = context['profile']
        safe_context['profile'] = {
            'nb_enfants': int(profile.get('nb_enfants', 0)) if str(profile.get('nb_enfants', 0)).isdigit() else 0,
            'situation': sanitize_input(str(profile.get('situation', '')), 50)
        }

    return safe_context

# ===== 🔐 AUTHENTIFICATION SUPABASE =====
def verify_supabase_token(token: str) -> dict:
    """Vérifie le token Supabase et retourne les infos utilisateur"""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return None

    try:
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {token}'
        }
        response = requests.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers=headers,
            timeout=3
        )

        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print(f"⚠️ Erreur vérification token: {e}")
        return None

def require_auth(f):
    """Décorateur pour rendre l'auth obligatoire"""
    @wraps(f)
    def wrapped(*args, **kwargs):
        # Récupérer token
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '').strip()

        if not token:
            return jsonify({
                "error": "Authentification requise",
                "code": "AUTH_REQUIRED"
            }), 401

        # Vérifier token
        user_data = verify_supabase_token(token)
        if not user_data:
            return jsonify({
                "error": "Token invalide ou expiré",
                "code": "INVALID_TOKEN"
            }), 401

        # Ajouter user_data au contexte de la requête
        request.user_data = user_data
        return f(*args, **kwargs)

    return wrapped

# ===== 💭 MÉMOIRE DE CONVERSATION SÉCURISÉE =====
conversation_memory = {}  # Format: {user_id: [messages]}
MAX_MEMORY_MESSAGES = 10
MAX_USERS_IN_MEMORY = 1000  # Limite globale

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
        'user': sanitize_input(message, 500),  # Limiter taille en mémoire
        'assistant': sanitize_input(response, 1000),
        'timestamp': datetime.now().isoformat()
    })

    # Cleanup si trop grand (garder dernier 10)
    if len(conversation_memory[user_id]) > MAX_MEMORY_MESSAGES:
        conversation_memory[user_id] = conversation_memory[user_id][-MAX_MEMORY_MESSAGES:]

def save_conversation_to_supabase(user_id: str, message: str, response: str, sources: list):
    """💾 Sauvegarde ou met à jour la conversation dans Supabase"""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return

    try:
        headers = {
            'apikey': SUPABASE_ANON_KEY,
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

            # Limiter à 100 derniers messages pour éviter trop de data
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

# Configuration Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("❌ ERREUR CRITIQUE: GEMINI_API_KEY manquant!")
    print("⚠️  Le serveur va démarrer mais les requêtes IA échoueront")
    # On configure quand même avec une clé vide pour éviter le crash au boot
    genai.configure(api_key="dummy_key")
else:
    genai.configure(api_key=GEMINI_API_KEY)

generation_config = {
    "temperature": 0.7,  # Augmenté pour des réponses plus naturelles
    "top_p": 0.9,
    "top_k": 40,
    "max_output_tokens": 2000,
}

# ===== 🔄 GÉNÉRATION GEMINI AVEC RETRY =====
def generate_with_gemini_internal(prompt: str) -> str:
    """Appel Gemini brut (utilisé par le wrapper avec retry)"""
    response = model.generate_content(prompt, request_options={'timeout': 30})

    if response.text:
        return response.text
    else:
        raise ValueError("Réponse vide de Gemini")

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((Exception,)),
    reraise=True
)
def generate_with_gemini(prompt: str, max_retries: int = 3) -> str:
    """Génère une réponse avec Gemini avec retry automatique (tenacity)"""
    try:
        return generate_with_gemini_internal(prompt)
    except Exception as e:
        print(f"⚠️ Erreur Gemini: {e}")
        raise  # Tenacity va retry avec backoff exponentiel (1s → 2s → 4s)

model = genai.GenerativeModel(
    model_name="models/gemini-2.5-flash",
    generation_config=generation_config,
    system_instruction="""Tu es PhoenixIA, conseiller social expert multi-domaines.

EXPERTISE COMPLÈTE:
- 🏛️ MDPH: Toutes allocations handicap (AEEH, AAH, PCH), cartes, orientations
- 👨‍👩‍👧‍👦 CAF: Allocations familiales, ARS, complément familial, aides parentales
- 🏫 SCOLARISATION: AESH, PPS, inclusion, transport scolaire adapté
- 👔 DROITS PARENTAUX: Congés aidant, AJPP, droits sociaux, recours
- 🚗 MOBILITÉ: Cartes CMI, transports adaptés, aides techniques
- 📋 PROCÉDURES: Dossiers MDPH, CDAPH, recours, délais

MISSION: Accompagner les familles comme un conseiller MDPH+CAF unifié.

STYLE: Empathique, précis, concret. Toujours proposer des actions et étapes pratiques."""
)

# ===== 📚 CHARGEMENT BASE DE CONNAISSANCES =====
def load_knowledge_base() -> dict:
    """
    📚 Charge la base de connaissances depuis config/knowledge_base.json

    Returns:
        dict: Base de connaissances chargée, ou {} si erreur
    """
    try:
        config_path = Path(__file__).parent / 'config' / 'knowledge_base.json'

        if not config_path.exists():
            print(f"⚠️ Fichier knowledge_base.json introuvable: {config_path}")
            print("📝 Créez le fichier ou vérifiez le chemin")
            return {}

        with open(config_path, 'r', encoding='utf-8') as f:
            knowledge_base = json.load(f)

        print(f"✅ Base de connaissances chargée: {len(knowledge_base)} documents")
        return knowledge_base

    except json.JSONDecodeError as e:
        print(f"❌ Erreur JSON dans knowledge_base.json: {e}")
        return {}
    except Exception as e:
        print(f"❌ Erreur chargement knowledge_base: {e}")
        return {}

# Chargement de la base de connaissances au démarrage
knowledge_base = load_knowledge_base()

def fuzzy_match(s1: str, s2: str) -> float:
    """Calcule similarité fuzzy entre deux strings (0-1)"""
    return SequenceMatcher(None, s1.lower(), s2.lower()).ratio()

def extract_suggestions(text: str) -> tuple[str, list]:
    """Extrait les suggestions de la réponse IA"""
    if "SUGGESTIONS:" not in text:
        return text, []

    parts = text.split("SUGGESTIONS:")
    main_answer = parts[0].strip()

    suggestions = []
    if len(parts) > 1:
        suggestions_text = parts[1].strip()
        for line in suggestions_text.split('\n'):
            line = line.strip()
            if line.startswith('-'):
                suggestion = line[1:].strip()
                if suggestion:
                    suggestions.append(suggestion)

    return main_answer, suggestions[:3]  # Max 3 suggestions

def find_relevant_documents(query: str) -> list:
    """🔍 Recherche améliorée avec fuzzy matching dans la base de connaissances"""
    query_lower = query.lower()
    relevant_docs = []

    for doc_id, doc in knowledge_base.items():
        score = 0

        # 1. Score exact sur les mots-clés (priorité haute)
        for keyword in doc["keywords"]:
            if keyword in query_lower:
                score += 2.0

        # 2. Score fuzzy sur les mots-clés (tolérance fautes de frappe)
        for keyword in doc["keywords"]:
            query_words = query_lower.split()
            for word in query_words:
                if len(word) > 3:  # Ignore mots courts
                    similarity = fuzzy_match(word, keyword)
                    if similarity > 0.75:  # Similarité > 75%
                        score += 1.5 * similarity

        # 3. Score basé sur le contenu
        content_lower = doc["content"].lower()
        content_words = query_lower.split()
        for word in content_words:
            if len(word) > 3:
                # Exact match
                if word in content_lower:
                    score += 0.5
                # Fuzzy match dans le contenu
                else:
                    for content_word in content_lower.split():
                        if len(content_word) > 4:
                            similarity = fuzzy_match(word, content_word)
                            if similarity > 0.8:
                                score += 0.3 * similarity

        # 4. Bonus pour match dans le titre
        if any(word in doc["title"].lower() for word in query_lower.split() if len(word) > 3):
            score += 1.0

        if score > 0:
            relevant_docs.append({
                "id": doc_id,
                "title": doc["title"],
                "content": doc["content"],
                "score": round(score, 2)
            })

    # Tri par score décroissant
    relevant_docs.sort(key=lambda x: x["score"], reverse=True)
    return relevant_docs[:3]  # Top 3

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "phoenix-rag-simple",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/chat/send', methods=['POST'])
@rate_limit(max_requests=100, window_minutes=1)
@require_auth
def chat_send():
    """🚀 Endpoint principal pour le chat RAG (avec cache + fuzzy search + contexte)"""
    start_time = time.time()

    try:
        data = request.get_json()

        # Validation des données
        if not data or 'message' not in data:
            return jsonify({"error": "Message requis"}), 400

        # 🔐 SANITIZE INPUT
        message = sanitize_input(data['message'], max_length=2000)
        user_id = request.user_data.get('id', 'anonymous')  # Depuis le décorateur @require_auth

        # 🔐 VALIDATE CONTEXT
        user_context = validate_context(data.get('context', {}))

        print(f"📨 Requête reçue: {message[:50]}... (user: {user_id})")

        # 🚀 VÉRIFIER LE CACHE D'ABORD
        cached_response = cache.get(message)
        if cached_response:
            print(f"⚡ Réponse depuis le cache!")
            cached_response['from_cache'] = True
            return jsonify(cached_response)

        # 💭 Récupérer l'historique de conversation
        conversation_history = get_conversation_history(user_id)
        has_history = len(conversation_history) > 0

        # Recherche documents pertinents (avec fuzzy matching)
        relevant_docs = find_relevant_documents(message)

        # 📝 PROMPT ENGINEERING AMÉLIORÉ (AVEC MÉMOIRE + CONTEXTE)
        if relevant_docs:
            # Liste des sources avec scores
            sources_list = "\n".join([
                f"- {doc['title']} (pertinence: {doc['score']})"
                for doc in relevant_docs
            ])

            context = "\n\n---\n\n".join([
                f"📄 SOURCE: {doc['title']}\n\n{doc['content']}"
                for doc in relevant_docs
            ])

            # Historique de conversation (si disponible)
            history_text = ""
            if has_history:
                history_text = "\n💭 HISTORIQUE RÉCENT DE LA CONVERSATION:\n"
                for idx, exchange in enumerate(conversation_history[-3:], 1):  # Derniers 3 échanges
                    history_text += f"{idx}. Utilisateur: {exchange['user']}\n"
                    history_text += f"   Toi: {exchange['assistant'][:100]}...\n\n"

            # Contexte utilisateur personnalisé
            context_text = ""
            if user_context:
                context_text = "\n🔍 CONTEXTE PERSONNEL DE L'UTILISATEUR:\n"
                if user_context.get('aides'):
                    context_text += "✅ Aides actuelles:\n"
                    for aide in user_context['aides'][:5]:
                        context_text += f"  - {aide.get('nom', '')} ({aide.get('statut', '')})\n"
                if user_context.get('deadlines'):
                    context_text += "📅 Échéances importantes:\n"
                    for deadline in user_context['deadlines'][:3]:
                        context_text += f"  - {deadline.get('titre', '')} ({deadline.get('date', '')})\n"
                if user_context.get('profile'):
                    prof = user_context['profile']
                    if prof.get('nb_enfants'):
                        context_text += f"👨‍👩‍👧 Famille: {prof['nb_enfants']} enfant(s)\n"
                context_text += "\n⚠️ Utilise ce contexte pour personnaliser ta réponse !\n"

            prompt = f"""Tu es PhoenixIA, conseiller social expert pour les familles d'enfants en situation de handicap.
{history_text}{context_text}
📚 SOURCES DISPONIBLES:
{sources_list}

📄 DOCUMENTS DE RÉFÉRENCE:
{context}

❓ QUESTION ACTUELLE DE LA FAMILLE:
"{message}"

📋 INSTRUCTIONS DE RÉPONSE:
1. Réponds de manière **empathique** et **rassurante**
2. Structure ta réponse en **sections claires** (ex: Conditions, Montants, Démarches)
3. **Cite systématiquement tes sources** entre parenthèses
4. Utilise des **émojis** pour faciliter la lecture (✅ ❌ 💰 📋 ⚠️)
5. Propose des **actions concrètes** à la fin
6. Si l'information n'est pas dans les documents, **dis-le clairement**
7. Si c'est une question de suivi, **fais référence à l'historique**

⚠️ DISCLAIMER OBLIGATOIRE:
Termine TOUJOURS par: "ℹ️ *Ces informations sont fournies à titre indicatif. Pour une situation personnelle, contactez votre MDPH ou CAF.*"

💡 SUGGESTIONS DE QUESTIONS (IMPORTANT):
Après ta réponse, ajoute EXACTEMENT 3 questions de suivi pertinentes que l'utilisateur pourrait vouloir poser.
Format : Sur une nouvelle ligne, écris "SUGGESTIONS:" suivi de 3 lignes commençant par "- "

Exemple:
SUGGESTIONS:
- Comment faire ma demande MDPH en ligne ?
- Quels documents dois-je préparer ?
- Combien de temps prend le traitement du dossier ?

RÉPONDS MAINTENANT:"""
        else:
            history_text = ""
            if has_history:
                history_text = "\n💭 HISTORIQUE RÉCENT:\n"
                for idx, exchange in enumerate(conversation_history[-3:], 1):
                    history_text += f"{idx}. Utilisateur: {exchange['user']}\n"
                    history_text += f"   Toi: {exchange['assistant'][:100]}...\n\n"

            prompt = f"""Tu es PhoenixIA, conseiller social expert en droits du handicap en France.
{history_text}
❓ QUESTION: "{message}"

Tu n'as pas de documents spécifiques sur ce sujet, mais tu peux:
1. Donner des **informations générales** basées sur tes connaissances
2. Orienter vers les **bons organismes** (MDPH, CAF, associations)
3. Proposer de **reformuler** la question si nécessaire
4. Si c'est une question de suivi, **fais référence à l'historique**

Réponds de manière **empathique** et **constructive** en français.

⚠️ Termine par: "ℹ️ *Ces informations sont générales. Pour votre situation, contactez votre MDPH ou CAF.*"

💡 SUGGESTIONS:
Après ta réponse, ajoute EXACTEMENT 3 questions de suivi sur une nouvelle ligne avec le format:
SUGGESTIONS:
- Question 1
- Question 2
- Question 3

RÉPONDS:"""

        # 🔐 Génération avec Gemini (avec retry et timeout + fallback gracieux)
        try:
            full_response = generate_with_gemini(prompt, max_retries=3)
        except Exception as e:
            print(f"❌ Échec Gemini après tous les retries: {e}")
            # Fallback gracieux
            full_response = """Je rencontre actuellement des difficultés techniques pour accéder à ma base de connaissances.

Voici ce que je vous recommande :
1. **Réessayez dans quelques instants** - il peut s'agir d'un problème temporaire
2. **Contactez votre MDPH** au 0 800 360 360 pour une aide immédiate
3. **Visitez service-public.fr** pour consulter les informations officielles

ℹ️ *Service temporairement indisponible. Nous nous excusons pour la gêne occasionnée.*

SUGGESTIONS:
- Quelles sont les coordonnées de ma MDPH ?
- Comment faire une réclamation en cas de délai ?
- Où trouver de l'aide pour remplir mon dossier ?"""

        # 💡 Extraire suggestions de la réponse
        answer, suggestions = extract_suggestions(full_response)

        # Sources utilisées
        sources = [doc['title'] for doc in relevant_docs] if relevant_docs else []

        processing_time = round(time.time() - start_time, 2)

        result = {
            "answer": answer,
            "response": answer,  # Compatibilité
            "conversation_id": f"conv_{user_id}_{int(datetime.now().timestamp())}",
            "sources": sources,
            "suggestions": suggestions,
            "processing_time": processing_time,
            "timestamp": datetime.now().isoformat(),
            "from_cache": False,
            "search_scores": [doc['score'] for doc in relevant_docs]
        }

        # 💾 STOCKER DANS LE CACHE
        cache.set(message, result)

        # 💭 AJOUTER À LA MÉMOIRE DE CONVERSATION
        add_to_conversation(user_id, message, answer)

        # 💾 SAUVEGARDER DANS SUPABASE (async, non-bloquant)
        try:
            save_conversation_to_supabase(user_id, message, answer, sources)
        except Exception as e:
            print(f"⚠️ Erreur sauvegarde Supabase (non-bloquant): {e}")

        print(f"✅ Réponse générée: {len(answer)} chars, {len(sources)} sources, {processing_time}s")
        print(f"📊 Cache stats: {cache.get_stats()}")
        print(f"💭 Mémoire: {len(conversation_memory.get(user_id, []))} messages pour {user_id}")

        return jsonify(result)

    except Exception as e:
        print(f"❌ Erreur RAG: {e}")
        return jsonify({
            "error": f"Erreur lors de la génération: {str(e)}",
            "answer": "Je rencontre une difficulté technique. Pouvez-vous reformuler votre question ?",
            "sources": [],
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/cache/stats', methods=['GET'])
def cache_stats():
    """📊 Statistiques du cache"""
    return jsonify(cache.get_stats())

@app.route('/api/memory/stats', methods=['GET'])
def memory_stats():
    """💭 Statistiques de la mémoire conversationnelle"""
    return jsonify({
        'users_count': len(conversation_memory),
        'total_messages': sum(len(msgs) for msgs in conversation_memory.values()),
        'max_per_user': MAX_MEMORY_MESSAGES
    })

@app.route('/api/memory/clear/<user_id>', methods=['DELETE'])
def clear_memory(user_id: str):
    """🗑️ Effacer la mémoire d'un utilisateur"""
    if user_id in conversation_memory:
        del conversation_memory[user_id]
        return jsonify({'message': f'Mémoire effacée pour {user_id}'}), 200
    return jsonify({'message': 'Utilisateur non trouvé'}), 404

@app.route('/api/summary/generate', methods=['POST'])
@require_auth
def generate_summary():
    """📊 Générer un résumé personnalisé de la situation utilisateur"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Données requises"}), 400

        # 🔐 VALIDATE CONTEXT
        user_context = validate_context(data.get('context', {}))
        user_id = request.user_data.get('id', 'anonymous')

        # Construction du prompt pour le résumé
        prompt = f"""Tu es PhoenixIA, conseiller social expert. Génère un résumé CONCIS et ACTIONNABLE de la situation de cette famille.

📊 DONNÉES DISPONIBLES:

✅ AIDES ACTIVES:
"""

        if user_context.get('aides'):
            for aide in user_context['aides']:
                statut_emoji = '✅' if aide.get('statut') == 'actif' else '⏳' if aide.get('statut') == 'en_attente' else '❌'
                prompt += f"  {statut_emoji} {aide.get('nom', '')} - {aide.get('statut', '')} - {aide.get('montant', 'Montant non précisé')}\n"
        else:
            prompt += "  Aucune aide enregistrée\n"

        prompt += "\n📅 ÉCHÉANCES IMPORTANTES:\n"
        if user_context.get('deadlines'):
            for deadline in user_context['deadlines']:
                prompt += f"  📌 {deadline.get('titre', '')} - {deadline.get('date', '')}\n"
        else:
            prompt += "  Aucune échéance enregistrée\n"

        prompt += "\n📄 DOCUMENTS:\n"
        if user_context.get('documents'):
            for doc in user_context['documents'][:5]:
                prompt += f"  📄 {doc.get('nom', '')} - {doc.get('statut', '')}\n"
        else:
            prompt += "  Aucun document enregistré\n"

        prompt += "\n👨‍👩‍👧 PROFIL FAMILLE:\n"
        if user_context.get('profile'):
            prof = user_context['profile']
            prompt += f"  Enfants: {prof.get('nb_enfants', 'Non précisé')}\n"
            prompt += f"  Situation: {prof.get('situation', 'Non précisée')}\n"
        else:
            prompt += "  Profil non rempli\n"

        prompt += """

📋 TON RÔLE:
Génère un résumé en 4 sections COURTES (3-4 lignes max chacune):

1. **✅ SITUATION ACTUELLE** - Ce qui est déjà en place
2. **⚠️ POINTS D'ATTENTION** - Ce qui nécessite une action rapide (deadlines, documents manquants)
3. **💡 OPPORTUNITÉS** - Aides potentielles auxquelles la famille pourrait avoir droit
4. **🎯 PROCHAINES ÉTAPES** - 3 actions concrètes à faire (numérotées)

Sois CONCIS, PRÉCIS et ACTIONNABLE. Utilise des émojis et du markdown pour la lisibilité.
Termine par: "ℹ️ *Résumé généré automatiquement. Pour plus de détails, discutez avec Phoenix.*"
"""

        # 🔐 Génération avec Gemini (avec retry et timeout + fallback)
        try:
            summary = generate_with_gemini(prompt, max_retries=3)
        except Exception as e:
            print(f"❌ Échec Gemini après tous les retries (résumé): {e}")
            summary = """## ⚠️ Résumé temporairement indisponible

Le service de génération automatique de résumé rencontre actuellement des difficultés.

**🎯 Prochaines actions recommandées :**
1. Vérifiez vos documents et procédures dans les sections dédiées
2. Consultez votre messagerie Phoenix pour des recommandations personnalisées
3. Contactez votre MDPH pour un accompagnement

ℹ️ *Service temporairement indisponible. Réessayez dans quelques instants.*"""

        return jsonify({
            'summary': summary,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        print(f"❌ Erreur génération résumé: {e}")
        return jsonify({
            "error": f"Erreur lors de la génération: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/chat/analyze-document', methods=['POST'])
@require_auth
def analyze_document():
    """📄 Analyser un document uploadé par l'utilisateur avec Gemini Vision"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Données requises"}), 400

        # Récupération et validation des données
        document_base64 = data.get('document', '')
        document_type = data.get('documentType', 'unknown')
        file_name = sanitize_input(data.get('fileName', 'document'), max_length=200)
        user_id = request.user_data.get('id', 'anonymous')

        if not document_base64:
            return jsonify({"error": "Document requis"}), 400

        print(f"📄 Analyse document: {file_name} (type: {document_type}, user: {user_id})")

        # Extraction du contenu selon le type
        document_content = ""
        use_vision = False

        if document_type in ['scan', 'image']:
            # 🖼️ IMAGES : Utiliser Gemini Vision
            print(f"🖼️ Analyse d'image avec Gemini Vision")
            use_vision = True

            # Retirer le préfixe data:image/...;base64,
            if 'base64,' in document_base64:
                document_base64 = document_base64.split('base64,')[1]

            # Préparer l'image pour Gemini Vision
            try:
                image_data = base64.b64decode(document_base64)
                # Gemini accepte directement les bytes d'image
                document_content = image_data
            except Exception as e:
                print(f"⚠️ Erreur décodage image: {e}")
                return jsonify({"error": "Format d'image invalide"}), 400

        elif document_type == 'pdf':
            # 📄 PDF : Extraire le texte avec PyPDF2
            print(f"📄 Extraction PDF")
            try:
                # Retirer le préfixe data:application/pdf;base64,
                if 'base64,' in document_base64:
                    document_base64 = document_base64.split('base64,')[1]

                pdf_bytes = base64.b64decode(document_base64)

                # Sauvegarder temporairement le PDF
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                    tmp_file.write(pdf_bytes)
                    tmp_path = tmp_file.name

                # Extraire le texte avec PyPDF2
                try:
                    from PyPDF2 import PdfReader
                    reader = PdfReader(tmp_path)
                    text_parts = []
                    for page in reader.pages:
                        text_parts.append(page.extract_text())
                    document_content = "\n".join(text_parts)
                    document_content = sanitize_input(document_content, max_length=10000)
                finally:
                    # Nettoyer le fichier temporaire
                    import os as os_module
                    try:
                        os_module.unlink(tmp_path)
                    except:
                        pass

                if not document_content or len(document_content) < 50:
                    return jsonify({
                        "error": "PDF vide ou illisible",
                        "message": "Le PDF ne contient pas de texte extractible"
                    }), 400

            except ImportError:
                return jsonify({
                    "error": "PyPDF2 non installé",
                    "message": "Installez PyPDF2 : pip install PyPDF2"
                }), 500
            except Exception as e:
                print(f"⚠️ Erreur extraction PDF: {e}")
                return jsonify({"error": f"Erreur extraction PDF: {str(e)}"}), 400

        else:
            # 📝 TEXTE : Décoder le base64
            try:
                # Retirer le préfixe data:text/plain;base64,
                if 'base64,' in document_base64:
                    document_base64 = document_base64.split('base64,')[1]

                decoded_bytes = base64.b64decode(document_base64)
                document_content = decoded_bytes.decode('utf-8', errors='ignore')
                document_content = sanitize_input(document_content, max_length=10000)
            except Exception as e:
                print(f"⚠️ Erreur décodage texte: {e}")
                return jsonify({"error": "Format de document invalide"}), 400

        # Validation finale pour texte/PDF
        if not use_vision and (not document_content or len(document_content) < 50):
            return jsonify({
                "error": "Document trop court ou vide",
                "message": "Veuillez uploader un document valide"
            }), 400

        # Construction du prompt d'analyse
        prompt = f"""Tu es PhoenixIA, expert en analyse de documents administratifs français liés au handicap et aux aides sociales.

📄 DOCUMENT À ANALYSER:
Nom: {file_name}
Type: {document_type}

CONTENU:
{document_content[:5000]}

📋 TON RÔLE:
Analyse ce document en profondeur et fournis une réponse structurée et ACTIONNABLE.

FORMAT DE RÉPONSE (Markdown):

## 📋 Type de document
[Identifie précisément: notification MDPH, certificat médical, courrier CAF, décision, attestation, etc.]

## 📅 Informations clés extraites
- **Date du document**: [si présente]
- **Organisme émetteur**: [MDPH, CAF, CPAM, etc.]
- **Montants**: [si présents]
- **Taux d'incapacité**: [si présent]
- **Dates d'échéance/renouvellement**: [si présentes]
- **Décision**: [Acceptée/Refusée/En attente]

## 📝 Résumé en langage simple
[Explique en 3-4 phrases ce que dit ce document, comme si tu parlais à un parent qui ne connait pas le jargon administratif]

## ⚠️ Points importants à retenir
- [Point clé 1]
- [Point clé 2]
- [Point clé 3]

## 🎯 Actions recommandées
1. [Action concrète 1 avec deadline si applicable]
2. [Action concrète 2]
3. [Action concrète 3]

## 💡 Conseils Phoenix
[1-2 conseils personnalisés pour optimiser la situation ou éviter les erreurs courantes]

IMPORTANT:
- Sois TRÈS PRÉCIS sur les dates et montants
- Si des infos manquent, dis-le clairement
- Utilise un ton empathique et rassurant
- Mets en avant ce qui est URGENT

RÉPONDS MAINTENANT:"""

        # Génération avec Gemini (texte ou vision selon le type)
        if use_vision:
            # 🖼️ Utiliser Gemini Vision pour analyser l'image
            print("🖼️ Analyse avec Gemini Vision...")
            try:
                import PIL.Image
                import io

                # Convertir bytes en PIL Image
                image = PIL.Image.open(io.BytesIO(document_content))

                # Utiliser gemini-2.0-flash-exp pour vision
                vision_model = genai.GenerativeModel('gemini-2.0-flash-exp')

                response = vision_model.generate_content(
                    [prompt, image],
                    request_options={'timeout': 30}
                )

                analysis = response.text if response.text else "Impossible d'analyser l'image."

            except ImportError:
                return jsonify({
                    "error": "PIL non installé",
                    "message": "Installez Pillow : pip install Pillow"
                }), 500
            except Exception as e:
                print(f"❌ Erreur Gemini Vision: {e}")
                return jsonify({
                    "error": f"Erreur analyse image: {str(e)}"
                }), 500
        else:
            # 📝 Utiliser Gemini texte standard avec retry + fallback
            try:
                analysis = generate_with_gemini(prompt, max_retries=3)
            except Exception as e:
                print(f"❌ Échec Gemini après tous les retries (analyse doc): {e}")
                analysis = """## ⚠️ Analyse temporairement indisponible

Le service d'analyse automatique des documents rencontre actuellement des difficultés techniques.

**🎯 Actions recommandées :**
1. Conservez votre document en sécurité
2. Réessayez l'analyse dans quelques instants
3. Contactez votre MDPH pour une analyse manuelle

ℹ️ *Service temporairement indisponible. Nous nous excusons pour la gêne occasionnée.*"""

        # Extraction de suggestions d'actions pour UI
        suggestions = []
        if "Actions recommandées" in analysis:
            # Extraire les numéros d'actions comme suggestions
            import re
            actions = re.findall(r'\d+\.\s*([^\n]+)', analysis)
            suggestions = actions[:3]  # Max 3 suggestions

        return jsonify({
            'analysis': analysis,
            'fullAnalysis': analysis,
            'suggestions': suggestions,
            'fileName': file_name,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        print(f"❌ Erreur analyse document: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": f"Erreur lors de l'analyse: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/user-memories', methods=['POST'])
@require_auth
def save_user_memory():
    """🧠 Sauvegarder une mémoire importante de l'utilisateur"""
    try:
        data = request.get_json()

        if not data or 'memory_content' not in data:
            return jsonify({"error": "Contenu de mémoire requis"}), 400

        user_id = request.user_data.get('id')
        memory_content = sanitize_input(data['memory_content'], max_length=500)
        memory_type = data.get('memory_type', 'general')  # general, family, aide, deadline
        importance_score = min(max(int(data.get('importance_score', 5)), 1), 10)

        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            return jsonify({"error": "Supabase non configuré"}), 500

        print(f"🧠 Sauvegarde mémoire pour {user_id}: {memory_content[:50]}...")

        # Sauvegarder dans Supabase
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }

        memory_data = {
            'user_id': user_id,
            'memory_content': memory_content,
            'memory_type': memory_type,
            'importance_score': importance_score,
            'created_at': datetime.now().isoformat()
        }

        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/user_memories",
            headers=headers,
            json=memory_data,
            timeout=3
        )

        if response.status_code in [200, 201]:
            print(f"✅ Mémoire sauvegardée")
            return jsonify({
                "success": True,
                "message": "Mémoire sauvegardée avec succès"
            })
        else:
            print(f"⚠️ Erreur sauvegarde mémoire: {response.status_code}")
            return jsonify({"error": "Erreur sauvegarde"}), 500

    except Exception as e:
        print(f"❌ Erreur save_user_memory: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/user-memories/<user_id>', methods=['GET'])
@require_auth
def get_user_memories(user_id: str):
    """🧠 Récupérer les mémoires d'un utilisateur"""
    try:
        # Vérifier que l'utilisateur demande ses propres mémoires
        requesting_user_id = request.user_data.get('id')
        if requesting_user_id != user_id:
            return jsonify({"error": "Accès non autorisé"}), 403

        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            return jsonify({"memories": []}), 200

        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        }

        # Récupérer les mémoires triées par importance puis date
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/user_memories?user_id=eq.{user_id}&order=importance_score.desc,created_at.desc&limit=50",
            headers=headers,
            timeout=3
        )

        if response.status_code == 200:
            memories = response.json()
            return jsonify({"memories": memories})
        else:
            return jsonify({"memories": []}), 200

    except Exception as e:
        print(f"❌ Erreur get_user_memories: {e}")
        return jsonify({"memories": []}), 200

@app.route('/api/user-memories/<memory_id>', methods=['DELETE'])
@require_auth
def delete_user_memory(memory_id: str):
    """🗑️ Supprimer une mémoire"""
    try:
        user_id = request.user_data.get('id')

        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            return jsonify({"error": "Supabase non configuré"}), 500

        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        }

        # Supprimer seulement si c'est la mémoire de l'utilisateur
        response = requests.delete(
            f"{SUPABASE_URL}/rest/v1/user_memories?id=eq.{memory_id}&user_id=eq.{user_id}",
            headers=headers,
            timeout=3
        )

        if response.status_code in [200, 204]:
            return jsonify({"success": True, "message": "Mémoire supprimée"})
        else:
            return jsonify({"error": "Erreur suppression"}), 500

    except Exception as e:
        print(f"❌ Erreur delete_user_memory: {e}")
        return jsonify({"error": str(e)}), 500


# ===== 📊 ROUTES MÉTIER (DASHBOARD) =====

@app.route('/api/documents', methods=['GET'])
@require_auth
def get_documents():
    """📄 Récupérer les documents d'un utilisateur"""
    try:
        user_id = request.user_data.get('id')
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            return jsonify({"error": "Supabase non configuré"}), 500

        # Appel Supabase avec RLS (Row Level Security)
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/user_documents?user_id=eq.{user_id}&order=created_at.desc",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            documents = response.json()
            return jsonify({"documents": documents}), 200
        else:
            print(f"❌ Erreur Supabase documents: {response.status_code}")
            return jsonify({"documents": []}), 200

    except Exception as e:
        print(f"❌ Erreur get_documents: {e}")
        return jsonify({"documents": []}), 200


@app.route('/api/procedures', methods=['GET'])
@require_auth
def get_procedures():
    """📋 Récupérer les démarches (deadlines) d'un utilisateur"""
    try:
        user_id = request.user_data.get('id')
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            return jsonify({"error": "Supabase non configuré"}), 500

        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/user_deadlines?user_id=eq.{user_id}&order=date.asc",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            deadlines = response.json()

            # Format pour compatibilité frontend (procedures = deadlines)
            procedures = []
            for deadline in deadlines:
                procedures.append({
                    'id': deadline.get('id'),
                    'name': deadline.get('titre'),
                    'status': 'completed' if deadline.get('completed') else 'pending',
                    'details': deadline.get('description', ''),
                    'dueDate': deadline.get('date'),
                    'priority': deadline.get('priorite', 'moyenne')
                })

            return jsonify({"procedures": procedures}), 200
        else:
            print(f"❌ Erreur Supabase procedures: {response.status_code}")
            return jsonify({"procedures": []}), 200

    except Exception as e:
        print(f"❌ Erreur get_procedures: {e}")
        return jsonify({"procedures": []}), 200


@app.route('/api/aides', methods=['GET'])
@require_auth
def get_aides():
    """💰 Récupérer les aides d'un utilisateur"""
    try:
        user_id = request.user_data.get('id')
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            return jsonify({"error": "Supabase non configuré"}), 500

        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/user_aides?user_id=eq.{user_id}&order=created_at.desc",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            aides = response.json()
            return jsonify({"aides": aides}), 200
        else:
            print(f"❌ Erreur Supabase aides: {response.status_code}")
            return jsonify({"aides": []}), 200

    except Exception as e:
        print(f"❌ Erreur get_aides: {e}")
        return jsonify({"aides": []}), 200


# ===== 🏠 ROOT ENDPOINT =====

@app.route('/', methods=['GET'])
def root():
    """Root endpoint pour Railway (API info)"""
    return jsonify({
        'status': 'ok',
        'service': 'PhoenixCare RAG API',
        'version': '1.0.0',
        'endpoints': {
            'health': '/health',
            'chat': '/api/chat/send',
            'aides': '/api/aides',
            'stripe': '/api/stripe/create-checkout-session'
        }
    }), 200


# ===== 💳 STRIPE PAYMENT ROUTES =====

@app.route('/api/stripe/create-checkout-session', methods=['POST'])
def create_checkout_session():
    """Crée une session Stripe Checkout pour un abonnement"""
    try:
        data = request.get_json()
        price_id = data.get('priceId')

        if not price_id:
            return jsonify({'error': 'priceId requis'}), 400

        # Récupère l'URL frontend depuis l'environnement
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')

        # Crée une session Checkout
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f'{frontend_url}/soutenir/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{frontend_url}/soutenir',
            metadata={
                'source': 'phoenixcare_donations'
            }
        )

        return jsonify({'url': checkout_session.url})

    except Exception as e:
        print(f"❌ Erreur Stripe checkout: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/stripe/customer-portal', methods=['POST'])
@require_auth
def create_customer_portal():
    """Crée une session Stripe Customer Portal pour gérer l'abonnement"""
    try:
        data = request.get_json()
        customer_id = data.get('customerId')

        if not customer_id:
            return jsonify({'error': 'customerId requis'}), 400

        # Récupère l'URL frontend
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')

        # Crée une session Customer Portal
        portal_session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f'{frontend_url}/soutenir',
        )

        return jsonify({'url': portal_session.url})

    except Exception as e:
        print(f"❌ Erreur Stripe portal: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/stripe/webhook', methods=['POST'])
def stripe_webhook():
    """Webhook Stripe pour gérer les événements de paiement"""
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({'error': 'Invalid signature'}), 400

    # Gestion des événements
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        print(f"✅ Paiement réussi: {session['id']}")
        # TODO: Mettre à jour Supabase avec le statut donateur

    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        print(f"❌ Abonnement annulé: {subscription['id']}")
        # TODO: Retirer le statut donateur dans Supabase

    return jsonify({'status': 'success'})


if __name__ == '__main__':
    print("=" * 60)
    print("🚀 SERVEUR RAG PHOENIX - VERSION OPTIMISÉE V2")
    print("=" * 60)
    print(f"📚 Base de connaissances: {len(knowledge_base)} documents")
    print(f"🔑 Gemini API: {'✅' if os.getenv('GEMINI_API_KEY') else '❌'}")
    print(f"🔐 Supabase: {'✅' if SUPABASE_URL else '❌ (optionnel)'}")
    print(f"💾 Cache: TTL 24h, Max 1000 entrées")
    print(f"🔍 Recherche: Fuzzy matching activé (difflib)")
    print(f"🔒 Rate limit: 10 req/min par utilisateur")
    print(f"💭 Mémoire: {MAX_MEMORY_MESSAGES} derniers messages par user")
    print(f"📝 Prompt: Engineering avancé avec contexte")
    print("=" * 60)
    print("📍 Endpoints disponibles:")
    print("  POST /api/chat/send - Chat principal")
    print("  GET  /api/documents - Documents utilisateur")
    print("  GET  /api/procedures - Démarches utilisateur")
    print("  GET  /api/aides - Aides utilisateur")
    print("  GET  /api/cache/stats - Stats cache")
    print("  GET  /api/memory/stats - Stats mémoire")
    print("  DELETE /api/memory/clear/<user_id> - Effacer mémoire")
    print("  POST /api/stripe/create-checkout-session - Créer session Stripe")
    print("  POST /api/stripe/webhook - Webhook Stripe")
    print("=" * 60)

    # 🔐 SECURITY: debug=True interdit en production (CWE-94)
    DEBUG_MODE = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    NODE_ENV = os.getenv('NODE_ENV', 'development')

    if NODE_ENV == 'production' and DEBUG_MODE:
        raise RuntimeError("⛔ SECURITÉ: FLASK_DEBUG=True est interdit en production! (risque code execution)")

    PORT = int(os.getenv('PORT', 8000))  # Railway utilise $PORT automatiquement
    HOST = '0.0.0.0' if NODE_ENV == 'production' else '127.0.0.1'

    print(f"🔐 Debug mode: {'✅ Activé (dev only)' if DEBUG_MODE else '❌ Désactivé (production safe)'}")
    print(f"🌍 Environment: {NODE_ENV}")
    print(f"📍 Listening on: {HOST}:{PORT}")

    app.run(host=HOST, port=PORT, debug=DEBUG_MODE)