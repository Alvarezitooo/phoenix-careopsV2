"""
Service de vectorisation intelligent pour documents juridiques PhoenixCare
Optimisé pour la recherche sémantique dans le domaine du handicap
"""

import numpy as np
import faiss
from typing import List, Dict, Any, Optional, Tuple
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import spacy
import logging
from datetime import datetime
import asyncio
import aiohttp
from pathlib import Path
import pickle
import json
import hashlib

from .document_ingestion import DocumentChunk

logger = logging.getLogger(__name__)

class FrenchLegalVectorizer:
    """
    Vectoriseur spécialisé pour les documents juridiques français
    Combine embeddings sémantiques et analyse linguistique
    """

    def __init__(self, model_name: str = "dangvantuan/sentence-camembert-large"):
        self.embedding_model = SentenceTransformer(model_name)
        self.nlp = spacy.load("fr_core_news_lg")
        self.tfidf = TfidfVectorizer(
            max_features=10000,
            ngram_range=(1, 3),
            stop_words='french'
        )

        # Index FAISS pour recherche rapide
        self.dimension = 1024  # Dimension du modèle CamemBERT
        self.index = faiss.IndexFlatIP(self.dimension)  # Inner product pour cosine similarity

        # Cache et métadonnées
        self.document_cache = {}
        self.metadata_cache = {}

    def preprocess_legal_text(self, text: str) -> str:
        """
        Préprocessing spécialisé pour textes juridiques français
        """
        # Normalisation des références juridiques
        text = self._normalize_legal_references(text)

        # Extraction des entités juridiques importantes
        doc = self.nlp(text)

        # Enrichissement avec contexte juridique
        enhanced_text = self._enhance_with_legal_context(text, doc)

        return enhanced_text

    def _normalize_legal_references(self, text: str) -> str:
        """Normalise les références aux codes et lois"""
        import re

        # Normalisation des références aux codes
        patterns = [
            (r'L\.\s*(\d+)-(\d+)', r'L.\1-\2'),  # Code de l'action sociale
            (r'R\.\s*(\d+)-(\d+)', r'R.\1-\2'),  # Partie réglementaire
            (r'D\.\s*(\d+)-(\d+)', r'D.\1-\2'),  # Décrets
        ]

        for pattern, replacement in patterns:
            text = re.sub(pattern, replacement, text)

        return text

    def _enhance_with_legal_context(self, text: str, doc) -> str:
        """
        Enrichit le texte avec le contexte juridique détecté
        """
        # Extraction des entités importantes
        legal_entities = []

        for ent in doc.ents:
            if ent.label_ in ['ORG', 'MISC']:  # Organisations et termes spécialisés
                if any(term in ent.text.upper() for term in [
                    'MDPH', 'CDAPH', 'CNSA', 'AEEH', 'PCH', 'AESH'
                ]):
                    legal_entities.append(ent.text)

        # Ajout du contexte en fin de texte
        if legal_entities:
            context = f" [ENTITÉS: {', '.join(set(legal_entities))}]"
            text += context

        return text

    async def vectorize_documents(self, chunks: List[DocumentChunk]) -> Dict[str, Any]:
        """
        Vectorise une liste de chunks de documents
        """
        logger.info(f"Début vectorisation de {len(chunks)} chunks")

        # Préparation des textes
        texts = []
        metadatas = []

        for chunk in chunks:
            processed_text = self.preprocess_legal_text(chunk.content)
            texts.append(processed_text)
            metadatas.append(chunk.metadata)

        # Génération des embeddings
        embeddings = self._generate_embeddings(texts)

        # Construction de l'index FAISS
        index_id = self._build_faiss_index(embeddings, metadatas)

        # TF-IDF pour recherche hybride
        tfidf_matrix = self.tfidf.fit_transform(texts)

        vectorization_result = {
            'index_id': index_id,
            'embedding_count': len(embeddings),
            'tfidf_features': self.tfidf.get_feature_names_out().tolist(),
            'metadata_count': len(metadatas),
            'created_at': datetime.utcnow().isoformat()
        }

        logger.info(f"Vectorisation terminée: {len(embeddings)} embeddings générés")
        return vectorization_result

    def _generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Génère les embeddings pour une liste de textes
        """
        # Batch processing pour optimiser la performance
        batch_size = 32
        all_embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_embeddings = self.embedding_model.encode(
                batch,
                convert_to_numpy=True,
                normalize_embeddings=True  # Important pour cosine similarity
            )
            all_embeddings.append(batch_embeddings)

        return np.vstack(all_embeddings)

    def _build_faiss_index(self, embeddings: np.ndarray, metadatas: List[Dict]) -> str:
        """
        Construit l'index FAISS avec les embeddings
        """
        # Réinitialisation de l'index
        self.index = faiss.IndexFlatIP(self.dimension)

        # Ajout des vecteurs
        self.index.add(embeddings.astype('float32'))

        # Génération d'un ID unique pour cette version de l'index (SHA256 pour sécurité)
        index_id = hashlib.sha256(
            str(datetime.utcnow().timestamp()).encode()
        ).hexdigest()[:8]

        # Sauvegarde des métadonnées
        self.metadata_cache[index_id] = metadatas

        # Sauvegarde de l'index
        index_path = f"data/indexes/faiss_index_{index_id}.bin"
        Path(index_path).parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, index_path)

        return index_id

    async def semantic_search(
        self,
        query: str,
        top_k: int = 10,
        confidence_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Recherche sémantique dans les documents vectorisés
        """
        # Préprocessing de la requête
        processed_query = self.preprocess_legal_text(query)

        # Génération de l'embedding de la requête
        query_embedding = self.embedding_model.encode(
            [processed_query],
            convert_to_numpy=True,
            normalize_embeddings=True
        )

        # Recherche dans l'index FAISS
        scores, indices = self.index.search(
            query_embedding.astype('float32'),
            top_k * 2  # On récupère plus pour filtrer après
        )

        # Filtrage par seuil de confiance
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if score >= confidence_threshold and idx != -1:
                # Récupération des métadonnées
                metadata = self._get_metadata_for_index(idx)

                result = {
                    'content_index': int(idx),
                    'similarity_score': float(score),
                    'confidence': self._calculate_confidence(score, query, metadata),
                    'metadata': metadata,
                    'match_type': 'semantic'
                }
                results.append(result)

        # Tri par score de confiance
        results.sort(key=lambda x: x['confidence'], reverse=True)

        return results[:top_k]

    def _get_metadata_for_index(self, index: int) -> Dict[str, Any]:
        """
        Récupère les métadonnées pour un index donné
        """
        # Recherche dans le cache des métadonnées
        for index_id, metadatas in self.metadata_cache.items():
            if index < len(metadatas):
                return metadatas[index]

        return {}

    def _calculate_confidence(
        self,
        similarity_score: float,
        query: str,
        metadata: Dict[str, Any]
    ) -> float:
        """
        Calcule un score de confiance basé sur plusieurs facteurs
        """
        base_confidence = similarity_score

        # Bonus pour correspondance de type de document
        doc_type_bonus = 0.0
        query_lower = query.lower()

        if metadata.get('document_type'):
            doc_type = metadata['document_type'].lower()
            if any(term in query_lower for term in [doc_type, 'guide', 'formulaire']):
                doc_type_bonus = 0.1

        # Bonus pour correspondance d'aide spécifique
        aid_bonus = 0.0
        detected_aids = metadata.get('detected_aids', [])
        for aid in detected_aids:
            if aid.lower() in query_lower:
                aid_bonus = 0.15
                break

        # Bonus pour récence du document
        recency_bonus = 0.0
        if metadata.get('last_modified'):
            try:
                doc_date = datetime.fromisoformat(metadata['last_modified'])
                days_old = (datetime.utcnow() - doc_date).days
                if days_old < 365:  # Document de moins d'un an
                    recency_bonus = 0.05
            except:
                pass

        # Calcul final
        total_confidence = min(1.0, base_confidence + doc_type_bonus + aid_bonus + recency_bonus)

        return total_confidence

class HybridSearchEngine:
    """
    Moteur de recherche hybride combinant recherche sémantique et par mots-clés
    """

    def __init__(self, vectorizer: FrenchLegalVectorizer):
        self.vectorizer = vectorizer
        self.keyword_weight = 0.3
        self.semantic_weight = 0.7

    async def hybrid_search(
        self,
        query: str,
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Recherche hybride combinant sémantique et mots-clés
        """
        # Recherche sémantique
        semantic_results = await self.vectorizer.semantic_search(
            query, top_k=top_k * 2
        )

        # Recherche par mots-clés (TF-IDF)
        keyword_results = self._keyword_search(query, top_k * 2)

        # Fusion des résultats
        combined_results = self._combine_results(
            semantic_results,
            keyword_results,
            query
        )

        # Application des filtres
        if filters:
            combined_results = self._apply_filters(combined_results, filters)

        return combined_results[:top_k]

    def _keyword_search(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        """
        Recherche par mots-clés utilisant TF-IDF
        """
        # Cette méthode sera implémentée quand on aura plus de documents
        # Pour l'instant, on retourne une liste vide
        return []

    def _combine_results(
        self,
        semantic_results: List[Dict],
        keyword_results: List[Dict],
        query: str
    ) -> List[Dict[str, Any]]:
        """
        Combine les résultats sémantiques et par mots-clés
        """
        # Index des résultats par content_index pour éviter les doublons
        result_map = {}

        # Ajout des résultats sémantiques
        for result in semantic_results:
            content_idx = result['content_index']
            result['final_score'] = result['confidence'] * self.semantic_weight
            result_map[content_idx] = result

        # Ajout des résultats par mots-clés
        for result in keyword_results:
            content_idx = result['content_index']
            if content_idx in result_map:
                # Combinaison des scores
                result_map[content_idx]['final_score'] += (
                    result['confidence'] * self.keyword_weight
                )
                result_map[content_idx]['match_type'] = 'hybrid'
            else:
                result['final_score'] = result['confidence'] * self.keyword_weight
                result['match_type'] = 'keyword'
                result_map[content_idx] = result

        # Tri par score final
        combined = list(result_map.values())
        combined.sort(key=lambda x: x['final_score'], reverse=True)

        return combined

    def _apply_filters(
        self,
        results: List[Dict[str, Any]],
        filters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Applique les filtres sur les résultats
        """
        filtered_results = []

        for result in results:
            metadata = result.get('metadata', {})

            # Filtre par type de document
            if 'document_type' in filters:
                if metadata.get('document_type') != filters['document_type']:
                    continue

            # Filtre par département
            if 'department' in filters:
                if metadata.get('department') != filters['department']:
                    continue

            # Filtre par aide détectée
            if 'aid_type' in filters:
                detected_aids = metadata.get('detected_aids', [])
                if filters['aid_type'] not in detected_aids:
                    continue

            # Filtre par tranche d'âge
            if 'age_range' in filters:
                age_ranges = metadata.get('age_ranges', [])
                if filters['age_range'] not in age_ranges:
                    continue

            filtered_results.append(result)

        return filtered_results

# Factory pour créer le service de vectorisation
def create_vectorization_service() -> Tuple[FrenchLegalVectorizer, HybridSearchEngine]:
    """
    Factory pour créer le service de vectorisation configuré
    """
    vectorizer = FrenchLegalVectorizer()
    search_engine = HybridSearchEngine(vectorizer)

    return vectorizer, search_engine