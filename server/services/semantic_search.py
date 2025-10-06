"""
🔍 Recherche sémantique avec Gemini Embeddings
Remplace le keyword matching par une vraie compréhension du sens
"""
import os
import json
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple
import google.generativeai as genai

# Configuration Gemini (réutilise la clé existante)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Cache des embeddings pour éviter de recalculer à chaque requête
EMBEDDINGS_CACHE = {}
EMBEDDINGS_CACHE_FILE = Path(__file__).parent.parent / 'config' / 'embeddings_cache.json'


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calcule la similarité cosinus entre deux vecteurs"""
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)

    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return float(dot_product / (norm1 * norm2))


def get_embedding(text: str, task_type: str = "RETRIEVAL_DOCUMENT") -> List[float]:
    """
    Génère un embedding avec Gemini text-embedding-004

    task_type options:
    - RETRIEVAL_DOCUMENT: Pour indexer les documents (knowledge base)
    - RETRIEVAL_QUERY: Pour les requêtes utilisateur
    """
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type=task_type,
            title=text[:100] if task_type == "RETRIEVAL_DOCUMENT" else None
        )
        return result['embedding']
    except Exception as e:
        print(f"❌ Erreur embedding Gemini: {e}")
        # Fallback: retourner un vecteur aléatoire pour éviter le crash
        return [0.0] * 768  # text-embedding-004 fait 768 dimensions


def load_embeddings_cache() -> Dict[str, List[float]]:
    """Charge le cache des embeddings depuis le fichier JSON"""
    global EMBEDDINGS_CACHE

    if EMBEDDINGS_CACHE_FILE.exists():
        try:
            with open(EMBEDDINGS_CACHE_FILE, 'r', encoding='utf-8') as f:
                EMBEDDINGS_CACHE = json.load(f)
            print(f"📦 Embeddings cache chargé: {len(EMBEDDINGS_CACHE)} documents")
        except Exception as e:
            print(f"⚠️ Erreur chargement cache embeddings: {e}")
            EMBEDDINGS_CACHE = {}

    return EMBEDDINGS_CACHE


def save_embeddings_cache():
    """Sauvegarde le cache des embeddings dans un fichier JSON"""
    try:
        EMBEDDINGS_CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(EMBEDDINGS_CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(EMBEDDINGS_CACHE, f, ensure_ascii=False, indent=2)
        print(f"💾 Cache embeddings sauvegardé: {len(EMBEDDINGS_CACHE)} documents")
    except Exception as e:
        print(f"❌ Erreur sauvegarde cache: {e}")


def create_knowledge_base_embeddings(knowledge_base: Dict[str, Dict]) -> Dict[str, List[float]]:
    """
    Crée les embeddings pour toute la knowledge base
    Utilise le cache pour éviter de recalculer
    """
    load_embeddings_cache()

    new_embeddings_count = 0

    for doc_id, doc in knowledge_base.items():
        # Vérifier si embedding déjà en cache
        if doc_id in EMBEDDINGS_CACHE:
            continue

        # Créer le texte à encoder (titre + contenu pour meilleure précision)
        text_to_embed = f"{doc['title']}\n\n{doc['content']}"

        # Générer l'embedding
        embedding = get_embedding(text_to_embed, task_type="RETRIEVAL_DOCUMENT")
        EMBEDDINGS_CACHE[doc_id] = embedding
        new_embeddings_count += 1

        print(f"🔄 Embedding créé pour: {doc['title']}")

    # Sauvegarder le cache si de nouveaux embeddings ont été créés
    if new_embeddings_count > 0:
        save_embeddings_cache()
        print(f"✅ {new_embeddings_count} nouveaux embeddings créés")

    return EMBEDDINGS_CACHE


def semantic_search(
    query: str,
    knowledge_base: Dict[str, Dict],
    top_k: int = 3,
    threshold: float = 0.3
) -> List[Dict]:
    """
    🎯 Recherche sémantique dans la knowledge base

    Args:
        query: Question de l'utilisateur
        knowledge_base: Base de connaissances complète
        top_k: Nombre de documents à retourner
        threshold: Seuil de similarité minimum (0-1)

    Returns:
        Liste de documents triés par pertinence avec scores
    """
    # S'assurer que les embeddings existent
    if not EMBEDDINGS_CACHE:
        print("📊 Création des embeddings de la knowledge base...")
        create_knowledge_base_embeddings(knowledge_base)

    # Générer l'embedding de la requête
    query_embedding = get_embedding(query, task_type="RETRIEVAL_QUERY")

    # Calculer les similarités
    similarities = []
    for doc_id, doc in knowledge_base.items():
        if doc_id not in EMBEDDINGS_CACHE:
            # Créer embedding manquant
            text_to_embed = f"{doc['title']}\n\n{doc['content']}"
            EMBEDDINGS_CACHE[doc_id] = get_embedding(text_to_embed, task_type="RETRIEVAL_DOCUMENT")

        doc_embedding = EMBEDDINGS_CACHE[doc_id]
        similarity = cosine_similarity(query_embedding, doc_embedding)

        # Filtrer par seuil
        if similarity >= threshold:
            similarities.append({
                "id": doc_id,
                "title": doc["title"],
                "content": doc["content"],
                "score": round(similarity, 3),
                "similarity": similarity  # Pour debug
            })

    # Trier par score décroissant
    similarities.sort(key=lambda x: x["score"], reverse=True)

    # Retourner top K
    results = similarities[:top_k]

    if results:
        print(f"🔍 Recherche sémantique: {len(results)} documents trouvés (seuil: {threshold})")
        for i, doc in enumerate(results, 1):
            print(f"  {i}. [{doc['score']:.3f}] {doc['title']}")

    return results


def keyword_search_internal(query: str, knowledge_base: Dict[str, Dict]) -> List[Dict]:
    """Recherche keyword interne (copie pour éviter import circulaire)"""
    from difflib import SequenceMatcher

    def fuzzy_match(s1: str, s2: str) -> float:
        return SequenceMatcher(None, s1.lower(), s2.lower()).ratio()

    query_lower = query.lower()
    relevant_docs = []

    for doc_id, doc in knowledge_base.items():
        score = 0

        # Score exact keywords
        for keyword in doc.get("keywords", []):
            if keyword in query_lower:
                score += 2.0

        # Fuzzy keywords
        for keyword in doc.get("keywords", []):
            for word in query_lower.split():
                if len(word) > 3:
                    similarity = fuzzy_match(word, keyword)
                    if similarity > 0.75:
                        score += 1.5 * similarity

        if score > 0:
            relevant_docs.append({
                "id": doc_id,
                "title": doc["title"],
                "content": doc["content"],
                "score": round(score, 2)
            })

    relevant_docs.sort(key=lambda x: x["score"], reverse=True)
    return relevant_docs[:5]


def hybrid_search(
    query: str,
    knowledge_base: Dict[str, Dict],
    top_k: int = 3,
    semantic_weight: float = 0.7
) -> List[Dict]:
    """
    🚀 Recherche hybride : combine sémantique + keyword matching

    Args:
        query: Question utilisateur
        knowledge_base: Base de connaissances
        top_k: Nombre de résultats
        semantic_weight: Poids de la recherche sémantique (0-1)

    Returns:
        Meilleurs documents combinant les deux approches
    """

    # 1. Recherche sémantique
    semantic_results = semantic_search(query, knowledge_base, top_k=top_k * 2)

    # 2. Recherche keyword (méthode interne)
    keyword_results = keyword_search_internal(query, knowledge_base)

    # 3. Fusionner les scores
    combined_scores = {}

    # Normaliser les scores sémantiques (déjà entre 0-1)
    for doc in semantic_results:
        doc_id = doc["id"]
        combined_scores[doc_id] = {
            "doc": doc,
            "semantic_score": doc["score"],
            "keyword_score": 0.0
        }

    # Normaliser les scores keyword (peuvent être > 1)
    max_keyword_score = max([d["score"] for d in keyword_results], default=1.0)
    for doc in keyword_results:
        doc_id = doc["id"]
        normalized_score = doc["score"] / max_keyword_score if max_keyword_score > 0 else 0

        if doc_id in combined_scores:
            combined_scores[doc_id]["keyword_score"] = normalized_score
        else:
            combined_scores[doc_id] = {
                "doc": doc,
                "semantic_score": 0.0,
                "keyword_score": normalized_score
            }

    # 4. Calculer score final hybride
    final_results = []
    for doc_id, scores in combined_scores.items():
        hybrid_score = (
            semantic_weight * scores["semantic_score"] +
            (1 - semantic_weight) * scores["keyword_score"]
        )

        doc = scores["doc"]
        doc["score"] = round(hybrid_score, 3)
        doc["semantic"] = round(scores["semantic_score"], 3)
        doc["keyword"] = round(scores["keyword_score"], 3)
        final_results.append(doc)

    # Trier par score hybride
    final_results.sort(key=lambda x: x["score"], reverse=True)

    print(f"🎯 Recherche hybride (semantic={semantic_weight}, keyword={1-semantic_weight}):")
    for i, doc in enumerate(final_results[:top_k], 1):
        print(f"  {i}. [{doc['score']:.3f}] {doc['title']} (sem:{doc['semantic']:.2f} kw:{doc['keyword']:.2f})")

    return final_results[:top_k]


# ===== INITIALISATION AU DÉMARRAGE =====
def initialize_semantic_search(knowledge_base: Dict[str, Dict]):
    """
    À appeler au démarrage du serveur pour pré-calculer les embeddings
    """
    print("🚀 Initialisation recherche sémantique...")
    create_knowledge_base_embeddings(knowledge_base)
    print("✅ Recherche sémantique prête !")
