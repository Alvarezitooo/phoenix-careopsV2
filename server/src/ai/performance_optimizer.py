"""
Optimiseur de performance pour le système RAG PhoenixCare
Améliore la pertinence et la précision des réponses
"""

import numpy as np
from typing import List, Dict, Any, Tuple, Optional
import logging
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import json
import asyncio
import pickle
from pathlib import Path

from .rag_architecture import PhoenixRAGSystem
from .vectorization_service import FrenchLegalVectorizer, HybridSearchEngine
from .document_ingestion import DocumentChunk

logger = logging.getLogger(__name__)

class QueryAnalyzer:
    """
    Analyseur de requêtes pour comprendre les patterns et améliorer les résultats
    """

    def __init__(self):
        self.query_patterns = defaultdict(int)
        self.success_metrics = defaultdict(list)
        self.user_feedback = defaultdict(list)

    def analyze_query_complexity(self, query: str) -> Dict[str, Any]:
        """
        Analyse la complexité d'une requête
        """
        words = query.lower().split()

        analysis = {
            'word_count': len(words),
            'complexity_score': 0.0,
            'query_type': 'simple',
            'technical_terms': 0,
            'question_indicators': 0,
            'specificity_score': 0.0
        }

        # Détection de termes techniques
        technical_terms = [
            'aeeh', 'pch', 'mdph', 'cdaph', 'aesh', 'pps', 'pai', 'cnsa',
            'allocation', 'prestation', 'orientation', 'reconnaissance',
            'taux', 'complément', 'majoration', 'renouvellement'
        ]

        for term in technical_terms:
            if term in query.lower():
                analysis['technical_terms'] += 1

        # Détection d'indicateurs de questions
        question_words = ['comment', 'quand', 'où', 'pourquoi', 'combien', 'que', 'quoi']
        for word in question_words:
            if word in words:
                analysis['question_indicators'] += 1

        # Calcul de la complexité
        complexity = (
            analysis['word_count'] * 0.1 +
            analysis['technical_terms'] * 0.3 +
            analysis['question_indicators'] * 0.2
        )

        analysis['complexity_score'] = min(1.0, complexity / 10.0)

        # Type de requête
        if analysis['complexity_score'] > 0.7:
            analysis['query_type'] = 'complex'
        elif analysis['complexity_score'] > 0.4:
            analysis['query_type'] = 'medium'

        # Score de spécificité
        specific_indicators = ['formulaire', 'document', 'démarche', 'procédure']
        specificity = sum(1 for indicator in specific_indicators if indicator in query.lower())
        analysis['specificity_score'] = min(1.0, specificity / 4.0)

        return analysis

    def track_query_pattern(self, query: str, results_quality: float):
        """
        Enregistre les patterns de requêtes pour l'optimisation
        """
        query_hash = hash(query.lower())
        self.query_patterns[query_hash] += 1
        self.success_metrics[query_hash].append(results_quality)

    def get_optimization_insights(self) -> Dict[str, Any]:
        """
        Génère des insights pour l'optimisation
        """
        insights = {
            'total_queries': sum(self.query_patterns.values()),
            'unique_queries': len(self.query_patterns),
            'average_success_rate': 0.0,
            'low_performing_patterns': [],
            'high_performing_patterns': []
        }

        if not self.success_metrics:
            return insights

        all_scores = []
        pattern_scores = {}

        for query_hash, scores in self.success_metrics.items():
            avg_score = np.mean(scores)
            pattern_scores[query_hash] = avg_score
            all_scores.extend(scores)

        insights['average_success_rate'] = np.mean(all_scores)

        # Identification des patterns performants et non-performants
        threshold_low = np.percentile(list(pattern_scores.values()), 25)
        threshold_high = np.percentile(list(pattern_scores.values()), 75)

        for query_hash, score in pattern_scores.items():
            if score < threshold_low:
                insights['low_performing_patterns'].append({
                    'hash': query_hash,
                    'score': score,
                    'frequency': self.query_patterns[query_hash]
                })
            elif score > threshold_high:
                insights['high_performing_patterns'].append({
                    'hash': query_hash,
                    'score': score,
                    'frequency': self.query_patterns[query_hash]
                })

        return insights

class RelevanceOptimizer:
    """
    Optimiseur de pertinence des résultats de recherche
    """

    def __init__(self, vectorizer: FrenchLegalVectorizer):
        self.vectorizer = vectorizer
        self.relevance_feedback = defaultdict(list)
        self.document_popularity = defaultdict(int)
        self.context_weights = self._load_context_weights()

    def _load_context_weights(self) -> Dict[str, float]:
        """
        Charge les poids contextuels pour différents types de contenu
        """
        return {
            'recent_documents': 1.2,  # Bonus pour documents récents
            'official_sources': 1.3,  # Bonus pour sources officielles
            'user_department': 1.4,   # Bonus pour département de l'utilisateur
            'popular_documents': 1.1, # Bonus pour documents populaires
            'exact_aid_match': 1.5,   # Bonus pour correspondance exacte d'aide
            'procedural_content': 1.2  # Bonus pour contenu procédural
        }

    async def optimize_search_results(
        self,
        query: str,
        initial_results: List[Dict[str, Any]],
        user_context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Optimise les résultats de recherche avec des signaux contextuels
        """
        if not initial_results:
            return initial_results

        optimized_results = []

        for result in initial_results:
            enhanced_result = result.copy()

            # Score de base
            base_score = result.get('final_score', result.get('confidence', 0.5))

            # Application des optimisations contextuelles
            context_bonus = self._calculate_context_bonus(result, user_context)
            popularity_bonus = self._calculate_popularity_bonus(result)
            recency_bonus = self._calculate_recency_bonus(result)

            # Score final optimisé
            enhanced_result['optimized_score'] = min(1.0,
                base_score + context_bonus + popularity_bonus + recency_bonus
            )

            # Ajout des détails d'optimisation
            enhanced_result['optimization_details'] = {
                'base_score': base_score,
                'context_bonus': context_bonus,
                'popularity_bonus': popularity_bonus,
                'recency_bonus': recency_bonus
            }

            optimized_results.append(enhanced_result)

        # Tri par score optimisé
        optimized_results.sort(key=lambda x: x['optimized_score'], reverse=True)

        # Diversification des résultats
        diversified_results = self._diversify_results(optimized_results)

        return diversified_results

    def _calculate_context_bonus(
        self,
        result: Dict[str, Any],
        user_context: Optional[Dict[str, Any]]
    ) -> float:
        """
        Calcule le bonus contextuel pour un résultat
        """
        bonus = 0.0
        metadata = result.get('metadata', {})

        if not user_context:
            return bonus

        # Bonus pour département de l'utilisateur
        user_dept = user_context.get('department')
        if user_dept and metadata.get('department') == user_dept:
            bonus += self.context_weights['user_department'] * 0.1

        # Bonus pour type d'aide recherchée
        user_aid_interest = user_context.get('aid_interests', [])
        detected_aids = metadata.get('detected_aids', [])
        for aid in user_aid_interest:
            if aid in detected_aids:
                bonus += self.context_weights['exact_aid_match'] * 0.15

        # Bonus pour sources officielles
        if metadata.get('is_official_source', False):
            bonus += self.context_weights['official_sources'] * 0.1

        return min(0.3, bonus)  # Limite le bonus contextuel

    def _calculate_popularity_bonus(self, result: Dict[str, Any]) -> float:
        """
        Calcule le bonus de popularité basé sur l'utilisation passée
        """
        content_index = result.get('content_index', 0)
        popularity_count = self.document_popularity.get(content_index, 0)

        if popularity_count == 0:
            return 0.0

        # Bonus logarithmique pour éviter la sur-pondération
        popularity_bonus = min(0.1, np.log(popularity_count + 1) * 0.02)
        return popularity_bonus

    def _calculate_recency_bonus(self, result: Dict[str, Any]) -> float:
        """
        Calcule le bonus de récence pour les documents récents
        """
        metadata = result.get('metadata', {})
        last_modified = metadata.get('last_modified')

        if not last_modified:
            return 0.0

        try:
            doc_date = datetime.fromisoformat(last_modified)
            days_old = (datetime.utcnow() - doc_date).days

            if days_old < 30:  # Moins d'un mois
                return 0.05
            elif days_old < 180:  # Moins de 6 mois
                return 0.03
            elif days_old < 365:  # Moins d'un an
                return 0.01

        except:
            pass

        return 0.0

    def _diversify_results(self, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Diversifie les résultats pour éviter la redondance
        """
        if len(results) <= 3:
            return results

        diversified = [results[0]]  # Garde le meilleur résultat
        used_types = {results[0].get('metadata', {}).get('document_type')}
        used_sources = {results[0].get('metadata', {}).get('source_url')}

        for result in results[1:]:
            metadata = result.get('metadata', {})
            doc_type = metadata.get('document_type')
            source_url = metadata.get('source_url')

            # Favorise la diversité des types de documents
            diversity_bonus = 0.0
            if doc_type not in used_types:
                diversity_bonus += 0.05
                used_types.add(doc_type)

            if source_url not in used_sources:
                diversity_bonus += 0.03
                used_sources.add(source_url)

            # Ajuste le score avec le bonus de diversité
            result['optimized_score'] += diversity_bonus
            diversified.append(result)

            if len(diversified) >= 10:  # Limite la taille des résultats
                break

        return diversified

    def record_user_feedback(
        self,
        query: str,
        result_index: int,
        feedback_type: str,
        feedback_score: Optional[float] = None
    ):
        """
        Enregistre le feedback utilisateur pour l'amélioration
        """
        feedback_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'query': query,
            'result_index': result_index,
            'feedback_type': feedback_type,  # 'helpful', 'not_helpful', 'irrelevant'
            'score': feedback_score
        }

        self.relevance_feedback[query].append(feedback_entry)

        # Mise à jour de la popularité
        if feedback_type == 'helpful':
            self.document_popularity[result_index] += 1

class PerformanceMonitor:
    """
    Moniteur de performance pour le système RAG
    """

    def __init__(self):
        self.metrics = defaultdict(list)
        self.response_times = []
        self.accuracy_scores = []
        self.user_satisfaction = []

    async def track_response_quality(
        self,
        query: str,
        response: str,
        sources: List[Dict],
        processing_time: float,
        user_feedback: Optional[Dict] = None
    ):
        """
        Suit la qualité des réponses pour optimisation continue
        """
        quality_metrics = {
            'timestamp': datetime.utcnow().isoformat(),
            'query_length': len(query),
            'response_length': len(response),
            'source_count': len(sources),
            'processing_time': processing_time,
            'avg_source_confidence': np.mean([s.get('confidence', 0) for s in sources]) if sources else 0
        }

        if user_feedback:
            quality_metrics.update(user_feedback)

        self.metrics['response_quality'].append(quality_metrics)
        self.response_times.append(processing_time)

        # Nettoyage périodique des anciennes métriques
        await self._cleanup_old_metrics()

    async def _cleanup_old_metrics(self):
        """
        Nettoie les métriques trop anciennes
        """
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        cutoff_iso = cutoff_date.isoformat()

        for metric_type, entries in self.metrics.items():
            self.metrics[metric_type] = [
                entry for entry in entries
                if entry.get('timestamp', '9999') > cutoff_iso
            ]

    def get_performance_report(self) -> Dict[str, Any]:
        """
        Génère un rapport de performance
        """
        if not self.response_times:
            return {'status': 'no_data'}

        report = {
            'total_queries': len(self.response_times),
            'avg_response_time': np.mean(self.response_times),
            'p95_response_time': np.percentile(self.response_times, 95),
            'p99_response_time': np.percentile(self.response_times, 99),
            'response_time_trend': self._calculate_trend(self.response_times),
        }

        # Métriques de qualité
        quality_metrics = self.metrics.get('response_quality', [])
        if quality_metrics:
            confidences = [m.get('avg_source_confidence', 0) for m in quality_metrics]
            report.update({
                'avg_confidence': np.mean(confidences),
                'confidence_trend': self._calculate_trend(confidences),
                'source_utilization': np.mean([m.get('source_count', 0) for m in quality_metrics])
            })

        return report

    def _calculate_trend(self, values: List[float], window_size: int = 10) -> str:
        """
        Calcule la tendance d'une série de valeurs
        """
        if len(values) < window_size:
            return 'insufficient_data'

        recent = values[-window_size:]
        older = values[-window_size*2:-window_size] if len(values) >= window_size*2 else values[:-window_size]

        if not older:
            return 'insufficient_data'

        recent_avg = np.mean(recent)
        older_avg = np.mean(older)

        change_percent = (recent_avg - older_avg) / older_avg * 100

        if change_percent > 5:
            return 'improving'
        elif change_percent < -5:
            return 'declining'
        else:
            return 'stable'

# Factory pour créer l'optimiseur complet
def create_performance_optimizer(
    vectorizer: FrenchLegalVectorizer
) -> Tuple[QueryAnalyzer, RelevanceOptimizer, PerformanceMonitor]:
    """
    Factory pour créer tous les composants d'optimisation
    """
    query_analyzer = QueryAnalyzer()
    relevance_optimizer = RelevanceOptimizer(vectorizer)
    performance_monitor = PerformanceMonitor()

    return query_analyzer, relevance_optimizer, performance_monitor