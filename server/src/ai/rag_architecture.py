"""
RAG Architecture pour PhoenixCare
Système d'IA conversationnelle spécialisé dans le droit du handicap français
"""

from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import asyncio
from datetime import datetime
import hashlib
import json

from pydantic import BaseModel, Field
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Pinecone
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferWindowMemory
from langchain.prompts import PromptTemplate

import pinecone
from sentence_transformers import SentenceTransformer
import spacy
import google.generativeai as genai
import os


class DocumentType(str, Enum):
    """Types de documents juridiques"""
    CODE_CASF = "code_casf"           # Code de l'Action Sociale et Familles
    ARRETE = "arrete"                 # Arrêtés préfectoraux/ministériels
    CIRCULAIRE = "circulaire"         # Circulaires CNSA/DGCS
    JURISPRUDENCE = "jurisprudence"   # Décisions tribunaux
    GUIDE_ASSOCIATIF = "guide"        # Guides Unapei, APF, etc.
    FORMULAIRE = "formulaire"         # CERFA et notices
    FAQ_MDPH = "faq"                  # FAQ sites MDPH départementaux


class Region(str, Enum):
    """Régions françaises pour spécificités locales"""
    ILE_DE_FRANCE = "ile_de_france"
    AUVERGNE_RHONE_ALPES = "auvergne_rhone_alpes"
    NOUVELLE_AQUITAINE = "nouvelle_aquitaine"
    OCCITANIE = "occitanie"
    HAUTS_DE_FRANCE = "hauts_de_france"
    GRAND_EST = "grand_est"
    BRETAGNE = "bretagne"
    NORMANDIE = "normandie"
    CENTRE_VAL_DE_LOIRE = "centre_val_de_loire"
    BOURGOGNE_FRANCHE_COMTE = "bourgogne_franche_comte"
    PACA = "provence_alpes_cote_azur"
    PAYS_DE_LA_LOIRE = "pays_de_la_loire"
    CORSE = "corse"
    MARTINIQUE = "martinique"
    GUADELOUPE = "guadeloupe"
    GUYANE = "guyane"
    REUNION = "reunion"
    MAYOTTE = "mayotte"


@dataclass
class LegalDocumentMetadata:
    """Métadonnées enrichies pour documents juridiques"""
    document_id: str
    title: str
    document_type: DocumentType
    publication_date: datetime
    last_update: datetime
    source_url: Optional[str]

    # Spécificités géographiques
    region: Optional[Region] = None
    department: Optional[str] = None  # Code département (01, 75, etc.)

    # Contexte juridique
    legal_references: List[str] = None  # Articles de loi référencés
    target_disabilities: List[str] = None  # Types de handicap concernés
    age_ranges: List[str] = None  # Tranches d'âge
    aid_types: List[str] = None  # Types d'aides (AEEH, PCH, etc.)

    # Métadonnées techniques
    confidence_score: float = 1.0
    extraction_method: str = "auto"
    validation_status: str = "pending"  # pending, validated, rejected


class DocumentChunk(BaseModel):
    """Chunk de document avec métadonnées enrichies"""
    chunk_id: str
    content: str
    metadata: LegalDocumentMetadata
    embeddings: Optional[List[float]] = None
    chunk_index: int
    total_chunks: int

    # Analyse sémantique
    main_topics: List[str] = []
    legal_entities: List[str] = []  # MDPH, CDAPH, CNSA, etc.
    procedures: List[str] = []  # Démarches identifiées

    # Scoring
    relevance_score: float = 0.0
    legal_precision: float = 0.0


class RAGQuery(BaseModel):
    """Query utilisateur avec contexte enrichi"""
    query: str
    user_id: str
    conversation_id: Optional[str] = None

    # Contexte utilisateur (si disponible)
    child_age: Optional[int] = None
    disabilities: List[str] = []
    region: Optional[Region] = None
    department: Optional[str] = None
    current_aids: List[str] = []

    # Préférences de réponse
    response_language: str = "fr"
    detail_level: str = "normal"  # brief, normal, detailed
    include_sources: bool = True
    max_response_length: int = 1000


class RAGResponse(BaseModel):
    """Réponse structurée du système RAG"""
    response_id: str
    query: str
    answer: str

    # Sources et références
    sources: List[Dict] = []
    legal_references: List[str] = []

    # Métadonnées de qualité
    confidence_score: float
    processing_time: float
    tokens_used: int

    # Actions suggérées
    suggested_actions: List[Dict] = []
    follow_up_questions: List[str] = []
    related_topics: List[str] = []

    # Debug info
    retrieved_chunks: int
    embedding_similarity_avg: float


class LegalRAGSystem:
    """Système RAG spécialisé pour le droit du handicap français"""

    def __init__(
        self,
        embedding_model_name: str = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2",
        vector_db_name: str = "phoenixcare-legal",
        llm_model: str = "gemini-1.5-flash",
        chunk_size: int = 500,
        chunk_overlap: int = 50
    ):
        self.embedding_model_name = embedding_model_name
        self.vector_db_name = vector_db_name
        self.llm_model = llm_model
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        # Initialisation des composants
        self._init_embeddings()
        self._init_vector_store()
        self._init_nlp_pipeline()
        self._init_legal_templates()
        self._init_gemini()

    def _init_embeddings(self):
        """Initialise le modèle d'embeddings optimisé pour le français juridique"""
        self.embedding_model = HuggingFaceEmbeddings(
            model_name=self.embedding_model_name,
            model_kwargs={'device': 'cpu'},  # Ou 'cuda' si GPU disponible
            encode_kwargs={'normalize_embeddings': True}
        )

        # Modèle alternatif pour legal-specific embeddings
        self.legal_embedding_model = SentenceTransformer(
            'sentence-transformers/paraphrase-multilingual-mpnet-base-v2'
        )

    def _init_vector_store(self):
        """Initialise Pinecone avec index spécialisé"""
        pinecone.init(
            api_key="your-pinecone-api-key",  # À configurer
            environment="your-pinecone-env"
        )

        # Créer l'index si n'existe pas
        if self.vector_db_name not in pinecone.list_indexes():
            pinecone.create_index(
                name=self.vector_db_name,
                dimension=768,  # Dimension du modèle d'embedding
                metric="cosine",
                metadata_config={
                    "indexed": [
                        "document_type", "region", "department",
                        "target_disabilities", "aid_types", "age_ranges"
                    ]
                }
            )

        self.vector_store = Pinecone.from_existing_index(
            index_name=self.vector_db_name,
            embedding=self.embedding_model
        )

    def _init_nlp_pipeline(self):
        """Initialise le pipeline NLP pour l'analyse des documents français"""
        # Modèle spaCy français avec reconnaissance d'entités
        self.nlp = spacy.load("fr_core_news_md")

        # Ajout de patterns pour entités juridiques spécifiques
        from spacy.matcher import Matcher
        self.matcher = Matcher(self.nlp.vocab)

        # Patterns pour identifier les références juridiques
        legal_patterns = [
            [{"TEXT": "Art."}, {"TEXT": {"REGEX": r"\d+"}}],
            [{"TEXT": "Article"}, {"TEXT": {"REGEX": r"L?\d+"}}],
            [{"TEXT": "AEEH"}], [{"TEXT": "PCH"}], [{"TEXT": "MDPH"}],
            [{"TEXT": "CDAPH"}], [{"TEXT": "CNSA"}], [{"TEXT": "AESH"}]
        ]

        for i, pattern in enumerate(legal_patterns):
            self.matcher.add(f"LEGAL_ENTITY_{i}", [pattern])

    def _init_legal_templates(self):
        """Initialise les templates de prompts spécialisés"""
        self.legal_prompt_template = PromptTemplate(
            input_variables=["context", "question", "user_profile", "conversation_history"],
            template="""Tu es PhoenixIA, assistant expert en droit du handicap français.
            Tu aides les parents d'enfants en situation de handicap avec des informations précises et bienveillantes.

CONTEXTE UTILISATEUR:
{user_profile}

HISTORIQUE CONVERSATION:
{conversation_history}

DOCUMENTS JURIDIQUES PERTINENTS:
{context}

QUESTION: {question}

INSTRUCTIONS:
1. Réponds en français avec un ton empathique et accessible
2. Base ta réponse UNIQUEMENT sur les documents fournis
3. Cite tes sources avec articles et dates précises
4. Propose des actions concrètes si pertinent
5. Indique clairement si l'information est spécifique à une région/département
6. Si tu n'es pas sûr, dis-le clairement
7. Évite le jargon juridique, explique les termes techniques

STRUCTURE DE RÉPONSE:
- Réponse directe à la question
- Sources juridiques citées
- Actions recommandées (si applicable)
- Informations complémentaires pertinentes

RÉPONSE:"""
        )

    def _init_gemini(self):
        """Initialise le client Gemini"""
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.gemini_model = genai.GenerativeModel(self.llm_model)

    async def ingest_document(
        self,
        document_path: str,
        metadata: LegalDocumentMetadata
    ) -> List[DocumentChunk]:
        """Ingère un document juridique dans le système RAG"""

        # 1. Extraction du contenu selon le type de fichier
        content = await self._extract_content(document_path)

        # 2. Preprocessing spécialisé pour documents juridiques
        processed_content = self._preprocess_legal_content(content)

        # 3. Chunking intelligent avec conservation du contexte juridique
        chunks = self._intelligent_chunk_legal_document(processed_content, metadata)

        # 4. Enrichissement des métadonnées par analyse NLP
        enriched_chunks = []
        for chunk in chunks:
            enriched_chunk = await self._enrich_chunk_metadata(chunk)
            enriched_chunks.append(enriched_chunk)

        # 5. Génération des embeddings
        for chunk in enriched_chunks:
            embedding = self.embedding_model.embed_query(chunk.content)
            chunk.embeddings = embedding

        # 6. Stockage dans la base vectorielle
        await self._store_chunks_in_vector_db(enriched_chunks)

        return enriched_chunks

    def _preprocess_legal_content(self, content: str) -> str:
        """Preprocessing spécialisé pour documents juridiques français"""
        import re

        # Normalisation des références juridiques
        content = re.sub(r'Art\.\s*(\d+)', r'Article \1', content)
        content = re.sub(r'al\.\s*(\d+)', r'alinéa \1', content)

        # Normalisation des abréviations courantes
        abbreviations = {
            'MDPH': 'Maison Départementale des Personnes Handicapées (MDPH)',
            'AEEH': 'Allocation d\'Éducation de l\'Enfant Handicapé (AEEH)',
            'PCH': 'Prestation de Compensation du Handicap (PCH)',
            'CDAPH': 'Commission des Droits et de l\'Autonomie des Personnes Handicapées (CDAPH)',
            'CNSA': 'Caisse Nationale de Solidarité pour l\'Autonomie (CNSA)'
        }

        for abbrev, full_form in abbreviations.items():
            # Première occurrence -> forme complète, suivantes -> abréviation
            content = re.sub(f'\\b{abbrev}\\b', full_form, content, count=1)

        # Nettoyage des caractères spéciaux des PDFs
        content = re.sub(r'\s+', ' ', content)  # Espaces multiples
        content = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\xff]', '', content)  # Caractères de contrôle

        return content.strip()

    def _intelligent_chunk_legal_document(
        self,
        content: str,
        metadata: LegalDocumentMetadata
    ) -> List[DocumentChunk]:
        """Chunking intelligent préservant la cohérence juridique"""

        # Splitter spécialisé pour documents juridiques
        legal_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=[
                "\n\nArticle ",  # Séparation par articles
                "\n\nSection ",  # Séparation par sections
                "\n\nChapitre ", # Séparation par chapitres
                "\n\n",         # Paragraphes
                "\n",           # Lignes
                ".",            # Phrases
                " "             # Mots
            ],
            keep_separator=True  # Préserver les séparateurs pour le contexte
        )

        # Division en chunks
        text_chunks = legal_splitter.split_text(content)

        # Conversion en DocumentChunk avec métadonnées
        chunks = []
        total_chunks = len(text_chunks)

        for i, chunk_text in enumerate(text_chunks):
            chunk = DocumentChunk(
                chunk_id=f"{metadata.document_id}_chunk_{i}",
                content=chunk_text,
                metadata=metadata,
                chunk_index=i,
                total_chunks=total_chunks
            )
            chunks.append(chunk)

        return chunks

    async def _enrich_chunk_metadata(self, chunk: DocumentChunk) -> DocumentChunk:
        """Enrichit les métadonnées d'un chunk par analyse NLP"""

        # Analyse avec spaCy
        doc = self.nlp(chunk.content)

        # Extraction des entités juridiques
        legal_entities = []
        matches = self.matcher(doc)
        for match_id, start, end in matches:
            entity = doc[start:end].text
            legal_entities.append(entity)

        # Détection des types d'aide mentionnés
        aid_patterns = {
            'AEEH': r'\b(AEEH|Allocation.*Enfant.*Handicapé)\b',
            'PCH': r'\b(PCH|Prestation.*Compensation.*Handicap)\b',
            'AESH': r'\b(AESH|Accompagnant.*Élève.*Handicap)\b',
            'transport': r'\b(transport.*scolaire|transport.*adapté)\b',
            'matériel': r'\b(matériel.*pédagogique|aide.*technique)\b'
        }

        detected_aids = []
        for aid_type, pattern in aid_patterns.items():
            if re.search(pattern, chunk.content, re.IGNORECASE):
                detected_aids.append(aid_type)

        # Détection des tranches d'âge
        age_patterns = {
            'petite_enfance': r'\b(0.*3.*ans|petite.*enfance|crèche|halte.*garderie)\b',
            'maternelle': r'\b(3.*6.*ans|maternelle|école.*maternelle)\b',
            'primaire': r'\b(6.*11.*ans|primaire|école.*élémentaire|CP|CE1|CE2|CM1|CM2)\b',
            'collège': r'\b(11.*15.*ans|collège|6ème|5ème|4ème|3ème)\b',
            'lycée': r'\b(15.*18.*ans|lycée|seconde|première|terminale)\b',
            'adulte': r'\b(18.*ans|majeur|adulte)\b'
        }

        detected_ages = []
        for age_range, pattern in age_patterns.items():
            if re.search(pattern, chunk.content, re.IGNORECASE):
                detected_ages.append(age_range)

        # Mise à jour des métadonnées du chunk
        chunk.legal_entities = legal_entities
        chunk.main_topics = detected_aids + detected_ages

        # Calcul du score de précision juridique
        legal_terms_count = len(legal_entities)
        specific_refs_count = len(re.findall(r'Article \d+|Art\. \d+', chunk.content))
        chunk.legal_precision = min(1.0, (legal_terms_count + specific_refs_count) / 10)

        return chunk

    async def query(self, query: RAGQuery) -> RAGResponse:
        """Traite une requête utilisateur et génère une réponse contextuelle"""

        start_time = datetime.now()

        # 1. Preprocessing de la query
        processed_query = self._preprocess_query(query.query)

        # 2. Recherche vectorielle avec filtres métadonnées
        search_filters = self._build_search_filters(query)
        relevant_chunks = await self._semantic_search(
            processed_query,
            filters=search_filters,
            top_k=5
        )

        # 3. Reranking basé sur le contexte utilisateur
        reranked_chunks = self._rerank_by_user_context(relevant_chunks, query)

        # 4. Construction du contexte pour le LLM
        context = self._build_llm_context(reranked_chunks)
        user_profile = self._build_user_profile(query)

        # 5. Génération de la réponse avec le LLM
        llm_response = await self._generate_llm_response(
            context=context,
            question=query.query,
            user_profile=user_profile,
            conversation_history=""  # À implémenter avec mémoire
        )

        # 6. Post-processing et structuration de la réponse
        structured_response = self._structure_response(
            llm_response,
            reranked_chunks,
            query,
            start_time
        )

        return structured_response

    def _build_search_filters(self, query: RAGQuery) -> Dict:
        """Construit les filtres de recherche basés sur le contexte utilisateur"""
        filters = {}

        if query.region:
            filters["region"] = query.region.value

        if query.department:
            filters["department"] = query.department

        if query.child_age:
            # Mapping âge -> tranche d'âge
            if query.child_age <= 3:
                filters["age_ranges"] = {"$in": ["petite_enfance"]}
            elif query.child_age <= 6:
                filters["age_ranges"] = {"$in": ["maternelle", "petite_enfance"]}
            elif query.child_age <= 11:
                filters["age_ranges"] = {"$in": ["primaire", "maternelle"]}
            elif query.child_age <= 15:
                filters["age_ranges"] = {"$in": ["collège", "primaire"]}
            elif query.child_age <= 18:
                filters["age_ranges"] = {"$in": ["lycée", "collège"]}
            else:
                filters["age_ranges"] = {"$in": ["adulte", "lycée"]}

        if query.disabilities:
            filters["target_disabilities"] = {"$in": query.disabilities}

        return filters

    async def _semantic_search(
        self,
        query: str,
        filters: Dict,
        top_k: int = 5
    ) -> List[DocumentChunk]:
        """Recherche sémantique dans la base vectorielle"""

        # Recherche avec filtres
        results = self.vector_store.similarity_search_with_score(
            query=query,
            k=top_k,
            filter=filters
        )

        # Conversion en DocumentChunk avec scores
        chunks = []
        for doc, score in results:
            # Reconstruction du DocumentChunk depuis les métadonnées
            chunk = DocumentChunk(
                chunk_id=doc.metadata.get("chunk_id"),
                content=doc.page_content,
                metadata=LegalDocumentMetadata(**doc.metadata),
                relevance_score=float(score)
            )
            chunks.append(chunk)

        return chunks

    def _rerank_by_user_context(
        self,
        chunks: List[DocumentChunk],
        query: RAGQuery
    ) -> List[DocumentChunk]:
        """Reranking des chunks basé sur le contexte utilisateur spécifique"""

        for chunk in chunks:
            context_score = 1.0

            # Bonus si spécifique à la région de l'utilisateur
            if query.region and chunk.metadata.region == query.region:
                context_score *= 1.2

            # Bonus si correspond à l'âge de l'enfant
            if query.child_age and chunk.metadata.age_ranges:
                age_match = self._check_age_match(query.child_age, chunk.metadata.age_ranges)
                if age_match:
                    context_score *= 1.3

            # Bonus si correspond aux handicaps mentionnés
            if query.disabilities and chunk.metadata.target_disabilities:
                disability_overlap = set(query.disabilities) & set(chunk.metadata.target_disabilities)
                if disability_overlap:
                    context_score *= 1.1 * len(disability_overlap)

            # Mise à jour du score final
            chunk.relevance_score *= context_score

        # Tri par score décroissant
        return sorted(chunks, key=lambda x: x.relevance_score, reverse=True)

    async def _generate_llm_response(
        self,
        context: str,
        question: str,
        user_profile: str,
        conversation_history: str
    ) -> str:
        """Génère la réponse avec le modèle de langage"""

        # Configuration du modèle
        llm = OpenAI(
            model_name=self.llm_model,
            temperature=0.1,  # Faible pour plus de cohérence juridique
            max_tokens=1000
        )

        # Construction du prompt
        prompt = self.legal_prompt_template.format(
            context=context,
            question=question,
            user_profile=user_profile,
            conversation_history=conversation_history
        )

        # Génération
        response = await llm.agenerate([prompt])
        return response.generations[0][0].text.strip()


# Exemple d'utilisation
async def main():
    """Exemple d'utilisation du système RAG"""

    # Initialisation
    rag_system = LegalRAGSystem()

    # Exemple de query utilisateur
    query = RAGQuery(
        query="Mon fils de 8 ans a un TSA, quelles aides peut-il avoir pour l'école ?",
        user_id="user_123",
        child_age=8,
        disabilities=["autisme", "TSA"],
        region=Region.ILE_DE_FRANCE,
        department="75"
    )

    # Traitement
    response = await rag_system.query(query)

    print(f"Réponse: {response.answer}")
    print(f"Confiance: {response.confidence_score}")
    print(f"Sources: {len(response.sources)}")


if __name__ == "__main__":
    asyncio.run(main())