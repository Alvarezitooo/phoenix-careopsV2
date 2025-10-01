"""
API conversationnelle PhoenixCare avec RAG intégré
Endpoint intelligent pour répondre aux questions sur le handicap
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, AsyncGenerator
import logging
import json
import asyncio
from datetime import datetime
import uuid

from ...ai.phoenix_rag_gemini import phoenix_rag
from ...ai.vectorization_service import create_vectorization_service
from ...ai.document_ingestion import DocumentIngestionPipeline
from ...utils.errors import APIError
from ...middlewares.auth import get_current_user

logger = logging.getLogger(__name__)

# Initialisation des services IA
vectorizer, search_engine = create_vectorization_service()

router = APIRouter(prefix="/api/chat", tags=["Chat IA"])

# Modèles Pydantic
class ChatMessage(BaseModel):
    role: str = Field(..., description="Rôle du message: 'user' ou 'assistant'")
    content: str = Field(..., description="Contenu du message")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Question de l'utilisateur")
    conversation_id: Optional[str] = Field(None, description="ID de conversation pour le contexte")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Contexte additionnel")
    stream: bool = Field(default=False, description="Réponse en streaming")

class LegalSource(BaseModel):
    id: str
    title: str
    type: str
    article: Optional[str] = None
    date: str
    url: Optional[str] = None
    excerpt: str
    confidence: float
    department: Optional[str] = None

class ActionableItem(BaseModel):
    id: str
    type: str
    title: str
    description: str
    priority: str
    deadline: Optional[str] = None
    url: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: str
    response: str
    sources: List[LegalSource]
    actionables: List[ActionableItem]
    confidence: float
    processing_time: float
    follow_up_questions: List[str]
    related_topics: List[str]
    metadata: Dict[str, Any]

class ConversationContext:
    """
    Gestionnaire de contexte conversationnel
    """

    def __init__(self):
        self.conversations: Dict[str, List[ChatMessage]] = {}
        self.max_context_length = 10  # Derniers 10 messages

    def get_context(self, conversation_id: str) -> List[ChatMessage]:
        return self.conversations.get(conversation_id, [])

    def add_message(self, conversation_id: str, message: ChatMessage):
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = []

        self.conversations[conversation_id].append(message)

        # Limitation de la taille du contexte
        if len(self.conversations[conversation_id]) > self.max_context_length:
            self.conversations[conversation_id] = self.conversations[conversation_id][-self.max_context_length:]

    def create_contextual_prompt(self, conversation_id: str, current_message: str) -> str:
        """
        Crée un prompt enrichi avec le contexte conversationnel
        """
        context = self.get_context(conversation_id)

        if not context:
            return current_message

        context_str = "\n".join([
            f"{msg.role}: {msg.content}" for msg in context[-3:]  # 3 derniers échanges
        ])

        enriched_prompt = f"""
Contexte de la conversation précédente:
{context_str}

Question actuelle: {current_message}

Réponds en tenant compte du contexte de la conversation pour une réponse cohérente et personnalisée.
"""
        return enriched_prompt

# Instance globale du gestionnaire de contexte
context_manager = ConversationContext()

class QuestionAnalyzer:
    """
    Analyseur de questions pour déterminer le type de réponse nécessaire
    """

    @staticmethod
    def analyze_intent(message: str) -> Dict[str, Any]:
        """
        Analyse l'intention de la question
        """
        message_lower = message.lower()

        intent_analysis = {
            'primary_intent': 'information',  # Par défaut
            'urgency': 'normal',
            'requires_documents': False,
            'requires_calculation': False,
            'is_procedural': False,
            'detected_keywords': []
        }

        # Détection d'urgence
        urgent_keywords = ['urgent', 'rapidement', 'immédiatement', 'problème', 'refus']
        if any(keyword in message_lower for keyword in urgent_keywords):
            intent_analysis['urgency'] = 'high'

        # Détection de demande de documents
        doc_keywords = ['formulaire', 'document', 'dossier', 'télécharger', 'imprimer']
        if any(keyword in message_lower for keyword in doc_keywords):
            intent_analysis['requires_documents'] = True
            intent_analysis['primary_intent'] = 'document_request'

        # Détection de questions procédurales
        proc_keywords = ['comment faire', 'démarche', 'procédure', 'étapes', 'où s\'adresser']
        if any(keyword in message_lower for keyword in proc_keywords):
            intent_analysis['is_procedural'] = True
            intent_analysis['primary_intent'] = 'procedure'

        # Détection de calculs/montants
        calc_keywords = ['combien', 'montant', 'calculer', 'simulation', 'tarif']
        if any(keyword in message_lower for keyword in calc_keywords):
            intent_analysis['requires_calculation'] = True
            intent_analysis['primary_intent'] = 'calculation'

        # Extraction des mots-clés spécialisés
        specialized_keywords = [
            'AEEH', 'PCH', 'MDPH', 'CDAPH', 'AESH', 'PPS', 'PAI', 'CNSA',
            'allocation', 'prestation', 'orientation', 'reconnaissance', 'taux'
        ]

        for keyword in specialized_keywords:
            if keyword.lower() in message_lower:
                intent_analysis['detected_keywords'].append(keyword)

        return intent_analysis

@router.post("/send", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user)
):
    """
    Endpoint principal pour envoyer un message au chat IA
    """
    start_time = datetime.utcnow()

    try:
        # Génération d'un ID de conversation si nécessaire
        conversation_id = request.conversation_id or str(uuid.uuid4())

        # Ajout du message utilisateur au contexte
        user_message = ChatMessage(role="user", content=request.message)
        context_manager.add_message(conversation_id, user_message)

        # Analyse de l'intention
        intent_analysis = QuestionAnalyzer.analyze_intent(request.message)

        # Création du prompt contextualisé
        contextual_prompt = context_manager.create_contextual_prompt(
            conversation_id, request.message
        )

        # Recherche dans la base de connaissances
        search_results = await search_engine.hybrid_search(
            contextual_prompt,
            top_k=5,
            filters=request.context.get('filters')
        )

        # Génération de la réponse avec RAG
        rag_response = await phoenix_rag.generate_response(
            query=contextual_prompt,
            search_results=search_results,
            intent_analysis=intent_analysis,
            user_context=request.context
        )

        # Conversion des sources
        sources = [
            LegalSource(
                id=src.get('id', str(uuid.uuid4())),
                title=src.get('title', 'Document juridique'),
                type=src.get('type', 'unknown'),
                article=src.get('article'),
                date=src.get('date', ''),
                url=src.get('url'),
                excerpt=src.get('excerpt', ''),
                confidence=src.get('confidence', 0.5),
                department=src.get('department')
            ) for src in rag_response.get('sources', [])
        ]

        # Génération d'actions recommandées
        actionables = await _generate_actionables(
            request.message, intent_analysis, search_results
        )

        # Questions de suivi personnalisées
        follow_up_questions = _generate_follow_up_questions(
            request.message, intent_analysis, rag_response
        )

        # Sujets connexes
        related_topics = _extract_related_topics(search_results, rag_response)

        # Calcul du temps de traitement
        processing_time = (datetime.utcnow() - start_time).total_seconds()

        # Création de la réponse
        response = ChatResponse(
            conversation_id=conversation_id,
            response=rag_response.get('answer', 'Je n\'ai pas pu générer une réponse satisfaisante.'),
            sources=sources,
            actionables=actionables,
            confidence=rag_response.get('confidence', 0.5),
            processing_time=processing_time,
            follow_up_questions=follow_up_questions,
            related_topics=related_topics,
            metadata={
                'intent_analysis': intent_analysis,
                'search_result_count': len(search_results),
                'user_id': current_user.get('id'),
                'timestamp': start_time.isoformat()
            }
        )

        # Ajout de la réponse au contexte
        assistant_message = ChatMessage(role="assistant", content=response.response)
        context_manager.add_message(conversation_id, assistant_message)

        # Logging de la conversation
        background_tasks.add_task(
            _log_conversation,
            conversation_id,
            request.message,
            response.response,
            current_user.get('id'),
            processing_time
        )

        return response

    except Exception as e:
        logger.error(f"Erreur lors du traitement du message: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erreur interne lors du traitement de votre question"
        )

@router.post("/stream")
async def stream_message(
    request: ChatRequest,
    current_user: Dict = Depends(get_current_user)
):
    """
    Endpoint pour streaming de réponse en temps réel
    """

    async def generate_stream() -> AsyncGenerator[str, None]:
        try:
            conversation_id = request.conversation_id or str(uuid.uuid4())

            # Analyse rapide
            intent_analysis = QuestionAnalyzer.analyze_intent(request.message)

            yield f"data: {json.dumps({'type': 'thinking', 'message': 'Analyse de votre question...'})}\n\n"

            # Recherche
            search_results = await search_engine.hybrid_search(
                request.message, top_k=3
            )

            yield f"data: {json.dumps({'type': 'searching', 'message': f'Recherche dans {len(search_results)} documents...'})}\n\n"

            # Génération de la réponse par chunks
            async for chunk in phoenix_rag.stream_response(
                request.message, search_results, intent_analysis
            ):
                yield f"data: {json.dumps({'type': 'content', 'content': chunk})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            logger.error(f"Erreur lors du streaming: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': 'Erreur lors de la génération'})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )

@router.get("/conversations/{conversation_id}")
async def get_conversation_history(
    conversation_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    Récupère l'historique d'une conversation
    """
    context = context_manager.get_context(conversation_id)

    return {
        'conversation_id': conversation_id,
        'messages': [msg.dict() for msg in context],
        'message_count': len(context)
    }

@router.delete("/conversations/{conversation_id}")
async def clear_conversation(
    conversation_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    Efface l'historique d'une conversation
    """
    if conversation_id in context_manager.conversations:
        del context_manager.conversations[conversation_id]

    return {'status': 'cleared', 'conversation_id': conversation_id}

# Fonctions utilitaires

async def _generate_actionables(
    message: str,
    intent_analysis: Dict[str, Any],
    search_results: List[Dict]
) -> List[ActionableItem]:
    """
    Génère des actions recommandées basées sur la question
    """
    actionables = []

    # Actions basées sur l'intention
    if intent_analysis['requires_documents']:
        actionables.append(ActionableItem(
            id=str(uuid.uuid4()),
            type='document',
            title='Télécharger les formulaires',
            description='Accédez aux formulaires officiels pour votre démarche',
            priority='medium',
            url='/documents/forms'
        ))

    if intent_analysis['is_procedural']:
        actionables.append(ActionableItem(
            id=str(uuid.uuid4()),
            type='appointment',
            title='Contacter votre MDPH',
            description='Prenez rendez-vous pour un accompagnement personnalisé',
            priority='high',
            url='/contact/mdph'
        ))

    if intent_analysis['urgency'] == 'high':
        actionables.append(ActionableItem(
            id=str(uuid.uuid4()),
            type='contact',
            title='Assistance urgente',
            description='Contactez notre équipe pour une aide immédiate',
            priority='urgent',
            url='/contact/urgent'
        ))

    return actionables

def _generate_follow_up_questions(
    message: str,
    intent_analysis: Dict[str, Any],
    rag_response: Dict[str, Any]
) -> List[str]:
    """
    Génère des questions de suivi pertinentes
    """
    questions = []

    # Questions basées sur l'intention
    if 'AEEH' in intent_analysis['detected_keywords']:
        questions.extend([
            "Quels sont les différents taux d'AEEH disponibles ?",
            "Comment faire une demande de complément d'AEEH ?",
            "Quand renouveler ma demande d'AEEH ?"
        ])

    if 'PCH' in intent_analysis['detected_keywords']:
        questions.extend([
            "Suis-je éligible à la PCH ?",
            "Comment calculer le montant de ma PCH ?",
            "Quelles dépenses sont couvertes par la PCH ?"
        ])

    if intent_analysis['is_procedural']:
        questions.extend([
            "Quels documents dois-je préparer ?",
            "Combien de temps prend cette démarche ?",
            "Que faire en cas de refus ?"
        ])

    # Limitation à 3 questions maximum
    return questions[:3]

def _extract_related_topics(
    search_results: List[Dict],
    rag_response: Dict[str, Any]
) -> List[str]:
    """
    Extrait les sujets connexes des résultats de recherche
    """
    topics = set()

    for result in search_results[:3]:  # Top 3 résultats
        metadata = result.get('metadata', {})

        # Ajout des aides détectées
        for aid in metadata.get('detected_aids', []):
            topics.add(aid)

        # Ajout du type de document
        if metadata.get('document_type'):
            topics.add(metadata['document_type'])

    return list(topics)[:5]  # Maximum 5 sujets

async def _log_conversation(
    conversation_id: str,
    user_message: str,
    assistant_response: str,
    user_id: str,
    processing_time: float
):
    """
    Log la conversation pour analyse et amélioration
    """
    log_data = {
        'conversation_id': conversation_id,
        'user_id': user_id,
        'user_message_length': len(user_message),
        'response_length': len(assistant_response),
        'processing_time': processing_time,
        'timestamp': datetime.utcnow().isoformat()
    }

    logger.info(f"Conversation logged: {json.dumps(log_data)}")