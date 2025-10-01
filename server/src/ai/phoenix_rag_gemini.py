"""
PhoenixRAG optimisé pour Gemini 1.5 Flash
Système RAG simplifié et efficace pour PhoenixCare
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional, AsyncGenerator
from datetime import datetime
import json
import os
import google.generativeai as genai
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class RAGResponse:
    """Réponse du système RAG"""
    answer: str
    sources: List[Dict[str, Any]]
    confidence: float
    processing_time: float
    metadata: Dict[str, Any]

class PhoenixRAGSystem:
    """
    Système RAG PhoenixCare optimisé pour Gemini 1.5 Flash
    """

    def __init__(self):
        self._init_gemini()
        self.conversation_history = {}

    def _init_gemini(self):
        """Initialise Gemini avec la clé API partagée"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY non trouvée dans les variables d'environnement")

        genai.configure(api_key=api_key)

        # Configuration optimisée pour PhoenixCare
        generation_config = {
            "temperature": 0.3,  # Réponses factuelles et cohérentes
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 1000,  # Réponses détaillées mais concises
        }

        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        ]

        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config=generation_config,
            safety_settings=safety_settings,
            system_instruction=self._get_system_prompt()
        )

    def _get_system_prompt(self) -> str:
        """Prompt système spécialisé PhoenixCare"""
        return """Tu es PhoenixIA, assistant expert en droit du handicap français.

Tu aides les parents d'enfants en situation de handicap avec des informations précises, bienveillantes et accessibles.

EXPERTISE:
- Code de l'Action Sociale et des Familles (CASF)
- AEEH (Allocation d'Éducation de l'Enfant Handicapé)
- PCH (Prestation de Compensation du Handicap)
- Procédures MDPH et CDAPH
- Scolarisation inclusive et AESH
- Droits et démarches administratives

STYLE DE RÉPONSE:
- Ton empathique et rassurant
- Langage accessible (évite le jargon)
- Réponses structurées et actionnables
- Citations des sources juridiques précises
- Propositions d'actions concrètes

LIMITATIONS:
- Tu ne remplaces pas une consultation juridique
- Tu ne peux pas prédire les décisions CDAPH
- Tu encourages toujours à contacter les professionnels

STRUCTURE:
1. Réponse directe à la question
2. Base juridique (articles, décrets)
3. Actions recommandées
4. Ressources complémentaires"""

    async def generate_response(
        self,
        query: str,
        search_results: List[Dict[str, Any]] = None,
        intent_analysis: Dict[str, Any] = None,
        user_context: Dict[str, Any] = None
    ) -> RAGResponse:
        """
        Génère une réponse complète avec Gemini
        """
        start_time = datetime.utcnow()

        try:
            # Construction du prompt contextualisé
            prompt = self._build_contextualized_prompt(
                query, search_results, intent_analysis, user_context
            )

            # Génération avec Gemini
            response = await self._generate_with_gemini(prompt)

            # Extraction des métadonnées de réponse
            metadata = self._extract_response_metadata(response, intent_analysis)

            # Calcul du temps de traitement
            processing_time = (datetime.utcnow() - start_time).total_seconds()

            return RAGResponse(
                answer=response,
                sources=search_results or [],
                confidence=metadata.get('confidence', 0.8),
                processing_time=processing_time,
                metadata=metadata
            )

        except Exception as e:
            logger.error(f"Erreur génération réponse: {e}")
            return RAGResponse(
                answer="Je rencontre une difficulté technique. Veuillez reformuler votre question ou contacter le support.",
                sources=[],
                confidence=0.0,
                processing_time=(datetime.utcnow() - start_time).total_seconds(),
                metadata={"error": str(e)}
            )

    def _build_contextualized_prompt(
        self,
        query: str,
        search_results: List[Dict[str, Any]] = None,
        intent_analysis: Dict[str, Any] = None,
        user_context: Dict[str, Any] = None
    ) -> str:
        """
        Construit un prompt contextualisé pour Gemini
        """
        prompt_parts = []

        # Contexte utilisateur si disponible
        if user_context:
            context_info = []
            if user_context.get('department'):
                context_info.append(f"Département: {user_context['department']}")
            if user_context.get('child_age'):
                context_info.append(f"Âge de l'enfant: {user_context['child_age']} ans")
            if user_context.get('disability_type'):
                context_info.append(f"Situation: {user_context['disability_type']}")

            if context_info:
                prompt_parts.append(f"CONTEXTE UTILISATEUR:\n{chr(10).join(context_info)}")

        # Analyse d'intention
        if intent_analysis:
            urgency = intent_analysis.get('urgency', 'normal')
            if urgency == 'high':
                prompt_parts.append("⚠️ DEMANDE URGENTE - Priorise les actions immédiates")

            if intent_analysis.get('requires_documents'):
                prompt_parts.append("📋 INCLURE: Documents et formulaires nécessaires")

        # Documents trouvés
        if search_results:
            sources_text = []
            for i, result in enumerate(search_results[:5], 1):
                metadata = result.get('metadata', {})
                content = result.get('content', result.get('excerpt', ''))

                source_info = f"SOURCE {i}:"
                if metadata.get('title'):
                    source_info += f"\nTitre: {metadata['title']}"
                if metadata.get('article'):
                    source_info += f"\nArticle: {metadata['article']}"
                if metadata.get('date'):
                    source_info += f"\nDate: {metadata['date']}"
                source_info += f"\nContenu: {content[:500]}..."

                sources_text.append(source_info)

            prompt_parts.append(f"DOCUMENTS JURIDIQUES PERTINENTS:\n{chr(10).join(sources_text)}")

        # Question utilisateur
        prompt_parts.append(f"QUESTION: {query}")

        # Instructions finales
        prompt_parts.append("""
INSTRUCTIONS:
1. Réponds en français, de manière empathique
2. Base ta réponse sur les documents fournis
3. Cite tes sources (articles, dates)
4. Propose des actions concrètes
5. Indique si l'info est spécifique à une région
6. Structure ta réponse clairement
7. Si incertain, dis-le explicitement

RÉPONSE:""")

        return "\n\n".join(prompt_parts)

    async def _generate_with_gemini(self, prompt: str) -> str:
        """
        Génère une réponse avec Gemini de manière asynchrone
        """
        try:
            # Gemini n'a pas d'API async native, on simule avec asyncio
            response = await asyncio.to_thread(
                self.model.generate_content, prompt
            )

            if response.candidates and response.candidates[0].content.parts:
                return response.candidates[0].content.parts[0].text
            else:
                return "Je ne peux pas générer une réponse appropriée pour cette question."

        except Exception as e:
            logger.error(f"Erreur Gemini: {e}")
            raise

    def _extract_response_metadata(
        self,
        response: str,
        intent_analysis: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Extrait les métadonnées de la réponse générée
        """
        metadata = {
            'response_length': len(response),
            'model_used': 'gemini-1.5-flash',
            'timestamp': datetime.utcnow().isoformat()
        }

        # Score de confiance basé sur la longueur et structure
        confidence = 0.8  # Base

        if len(response) > 200:  # Réponse détaillée
            confidence += 0.1

        if any(word in response.lower() for word in ['article', 'code', 'décret']):
            confidence += 0.1  # Références juridiques

        if any(word in response.lower() for word in ['mdph', 'aeeh', 'pch']):
            confidence += 0.05  # Termes spécialisés

        metadata['confidence'] = min(1.0, confidence)

        # Analyse d'intention intégrée
        if intent_analysis:
            metadata['intent_analysis'] = intent_analysis

        return metadata

    async def stream_response(
        self,
        query: str,
        search_results: List[Dict[str, Any]] = None,
        intent_analysis: Dict[str, Any] = None
    ) -> AsyncGenerator[str, None]:
        """
        Génère une réponse en streaming (simulation pour Gemini)
        """
        # Pour l'instant, Gemini n'a pas de streaming natif
        # On simule en découpant la réponse
        full_response = await self.generate_response(query, search_results, intent_analysis)

        # Découpage de la réponse en chunks
        words = full_response.answer.split()
        chunk_size = 3  # 3 mots par chunk

        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i + chunk_size])
            if i + chunk_size < len(words):
                chunk += " "
            yield chunk
            await asyncio.sleep(0.1)  # Simulation délai streaming

    def add_conversation_context(self, conversation_id: str, message: str, role: str = "user"):
        """
        Ajoute un message au contexte conversationnel
        """
        if conversation_id not in self.conversation_history:
            self.conversation_history[conversation_id] = []

        self.conversation_history[conversation_id].append({
            'role': role,
            'content': message,
            'timestamp': datetime.utcnow().isoformat()
        })

        # Limite à 10 derniers messages pour éviter de surcharger le contexte
        if len(self.conversation_history[conversation_id]) > 10:
            self.conversation_history[conversation_id] = self.conversation_history[conversation_id][-10:]

    def get_conversation_context(self, conversation_id: str) -> str:
        """
        Récupère le contexte conversationnel formaté
        """
        if conversation_id not in self.conversation_history:
            return ""

        messages = self.conversation_history[conversation_id][-5:]  # 5 derniers messages
        context_parts = []

        for msg in messages:
            role = "Utilisateur" if msg['role'] == 'user' else "PhoenixIA"
            context_parts.append(f"{role}: {msg['content']}")

        return "\n".join(context_parts)

# Instance globale
phoenix_rag = PhoenixRAGSystem()