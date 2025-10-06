"""
Service RAG - Recherche et génération avec Gemini
Extrait de simple_rag_server.py
"""
import os
import json
from pathlib import Path
from difflib import SequenceMatcher
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from google.generativeai.types import HarmCategory, HarmBlockThreshold

# ===== CONFIGURATION GEMINI =====
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("❌ ERREUR CRITIQUE: GEMINI_API_KEY manquant!")
    print("⚠️  Le serveur va démarrer mais les requêtes IA échoueront")
    genai.configure(api_key="dummy_key")
else:
    genai.configure(api_key=GEMINI_API_KEY)

generation_config = {
    "temperature": 0.7,
    "top_p": 0.9,
    "top_k": 40,
    "max_output_tokens": 2000,
}

safety_settings = {
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
}

model = genai.GenerativeModel(
    model_name="models/gemini-2.5-flash",
    generation_config=generation_config,
    safety_settings=safety_settings,
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

# ===== CHARGEMENT PROMPTS =====
def load_prompts() -> dict:
    """Charge les prompts depuis config/prompts.json"""
    try:
        config_path = Path(__file__).parent.parent / 'config' / 'prompts.json'

        if not config_path.exists():
            print(f"⚠️ Fichier prompts.json introuvable, utilisation prompts par défaut")
            return {}

        with open(config_path, 'r', encoding='utf-8') as f:
            prompts = json.load(f)
            print(f"📝 Prompts chargés (version {prompts.get('version', '1.0.0')})")
            return prompts

    except Exception as e:
        print(f"❌ Erreur chargement prompts: {e}")
        return {}

PROMPTS = load_prompts()

# ===== CHARGEMENT KNOWLEDGE BASE =====
def load_knowledge_base() -> dict:
    """Charge la base de connaissances depuis config/knowledge_base.json"""
    try:
        config_path = Path(__file__).parent.parent / 'config' / 'knowledge_base.json'

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

knowledge_base = load_knowledge_base()

# ===== RECHERCHE SÉMANTIQUE =====
from services.semantic_search import initialize_semantic_search, hybrid_search

# Initialiser les embeddings au démarrage
if knowledge_base:
    try:
        initialize_semantic_search(knowledge_base)
    except Exception as e:
        print(f"⚠️ Recherche sémantique indisponible, fallback sur keyword matching: {e}")

# ===== FONCTIONS RAG =====
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

    return main_answer, suggestions[:3]

def find_relevant_documents(query: str, use_semantic: bool = True) -> list:
    """
    🔍 Recherche intelligente dans la base de connaissances

    Args:
        query: Question de l'utilisateur
        use_semantic: Si True, utilise recherche hybride (sémantique + keyword)
                     Si False, fallback sur keyword matching uniquement

    Returns:
        Liste des 3 documents les plus pertinents
    """
    # Tenter recherche hybride (sémantique + keyword)
    if use_semantic:
        try:
            return hybrid_search(query, knowledge_base, top_k=3, semantic_weight=0.7)
        except Exception as e:
            print(f"⚠️ Recherche sémantique échouée, fallback sur keyword: {e}")

    # Fallback: keyword matching classique (ancienne méthode)
    query_lower = query.lower()
    relevant_docs = []

    for doc_id, doc in knowledge_base.items():
        score = 0

        # 1. Score exact sur les mots-clés
        for keyword in doc["keywords"]:
            if keyword in query_lower:
                score += 2.0

        # 2. Score fuzzy sur les mots-clés
        for keyword in doc["keywords"]:
            query_words = query_lower.split()
            for word in query_words:
                if len(word) > 3:
                    similarity = fuzzy_match(word, keyword)
                    if similarity > 0.75:
                        score += 1.5 * similarity

        # 3. Score basé sur le contenu
        content_lower = doc["content"].lower()
        content_words = query_lower.split()
        for word in content_words:
            if len(word) > 3:
                if word in content_lower:
                    score += 0.5
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
    return relevant_docs[:3]

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
        raise

# ===== SÉCURITÉ =====
def detect_prompt_injection(text: str) -> tuple[bool, str]:
    """
    🔒 Détecte les tentatives de prompt injection
    Retourne (is_injection, reason)
    """
    text_lower = text.lower()

    # Patterns suspects
    injection_patterns = [
        # System prompt manipulation
        ("ignore previous", "Tentative d'ignorer les instructions système"),
        ("forget everything", "Tentative d'oublier le contexte"),
        ("system prompt", "Tentative d'accéder au prompt système"),
        ("you are now", "Tentative de redéfinir le rôle"),
        ("act as", "Tentative de changer de rôle"),
        ("pretend to be", "Tentative d'usurpation"),
        ("disregard all", "Tentative d'ignorer les règles"),

        # Instruction leak attempts
        ("show your instructions", "Tentative d'extraire les instructions"),
        ("what are your rules", "Tentative d'extraire les règles"),
        ("reveal your prompt", "Tentative d'extraire le prompt"),
        ("output your system message", "Tentative d'extraire le message système"),

        # Code injection attempts
        ("```python", "Tentative d'injection de code"),
        ("<script>", "Tentative d'injection XSS"),
        ("javascript:", "Tentative d'injection JavaScript"),
        ("eval(", "Tentative d'exécution de code"),
        ("exec(", "Tentative d'exécution de code"),

        # Jailbreak attempts
        ("dan mode", "Tentative de jailbreak"),
        ("developer mode", "Tentative d'accès développeur"),
        ("sudo mode", "Tentative d'élévation de privilèges"),
    ]

    for pattern, reason in injection_patterns:
        if pattern in text_lower:
            print(f"🚨 PROMPT INJECTION DÉTECTÉ: {reason}")
            print(f"   Pattern: '{pattern}'")
            print(f"   Input: {text[:100]}...")
            return True, reason

    return False, ""


def sanitize_input(text: str, max_length: int = 2000) -> str:
    """Nettoie et valide l'input utilisateur"""
    if not text:
        return ""

    # 🔒 DÉTECTION PROMPT INJECTION
    is_injection, reason = detect_prompt_injection(text)
    if is_injection:
        raise ValueError(f"🚨 Requête bloquée: {reason}")

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
