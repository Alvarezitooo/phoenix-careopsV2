"""
Pipeline d'ingestion des documents juridiques pour PhoenixCare RAG
Système automatisé de collecte, traitement et indexation des sources officielles
"""

import asyncio
import aiofiles
import aiohttp
from typing import List, Dict, Optional, AsyncGenerator
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path
import hashlib
import json
import re
import logging
from urllib.parse import urljoin, urlparse

import PyMuPDF as fitz  # PyMuPDF pour PDFs
from bs4 import BeautifulSoup
import requests
from celery import Celery
import schedule
import time

from rag_architecture import (
    LegalDocumentMetadata, DocumentType, Region,
    LegalRAGSystem, DocumentChunk
)


# Configuration Celery pour tâches asynchrones
celery_app = Celery('document_ingestion')
celery_app.conf.update(
    broker_url='redis://localhost:6379/0',
    result_backend='redis://localhost:6379/0',
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Europe/Paris',
    enable_utc=True,
)


@dataclass
class DocumentSource:
    """Source de documents à surveiller"""
    name: str
    base_url: str
    source_type: DocumentType
    update_frequency: str  # daily, weekly, monthly
    css_selectors: Dict[str, str]  # Sélecteurs pour extraction
    region: Optional[Region] = None
    department: Optional[str] = None
    active: bool = True


class DocumentIngestionPipeline:
    """Pipeline complet d'ingestion des documents juridiques"""

    def __init__(self, rag_system: LegalRAGSystem):
        self.rag_system = rag_system
        self.logger = logging.getLogger(__name__)
        self.session: Optional[aiohttp.ClientSession] = None

        # Répertoires de stockage
        self.raw_docs_dir = Path("data/raw_documents")
        self.processed_docs_dir = Path("data/processed_documents")
        self.metadata_dir = Path("data/metadata")

        # Création des répertoires
        for dir_path in [self.raw_docs_dir, self.processed_docs_dir, self.metadata_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)

        # Sources officielles configurées
        self.document_sources = self._configure_official_sources()

    def _configure_official_sources(self) -> List[DocumentSource]:
        """Configuration des sources officielles à surveiller"""

        sources = [
            # CNSA - Source nationale principale
            DocumentSource(
                name="CNSA Circulaires",
                base_url="https://www.cnsa.fr/documentation/circulaires",
                source_type=DocumentType.CIRCULAIRE,
                update_frequency="weekly",
                css_selectors={
                    "documents": ".document-item",
                    "title": ".document-title",
                    "date": ".document-date",
                    "pdf_link": ".pdf-download"
                }
            ),

            # Code de l'action sociale et des familles
            DocumentSource(
                name="Légifrance CASF",
                base_url="https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006074069",
                source_type=DocumentType.CODE_CASF,
                update_frequency="monthly",
                css_selectors={
                    "articles": ".article",
                    "title": ".article-title",
                    "content": ".article-content"
                }
            ),

            # Sites MDPH départementaux (exemples)
            DocumentSource(
                name="MDPH Paris",
                base_url="https://www.mdph.paris.fr/documents",
                source_type=DocumentType.FAQ_MDPH,
                update_frequency="weekly",
                css_selectors={
                    "documents": ".faq-item",
                    "question": ".faq-question",
                    "answer": ".faq-answer"
                },
                region=Region.ILE_DE_FRANCE,
                department="75"
            ),

            # Formulaires CERFA
            DocumentSource(
                name="Service Public Formulaires",
                base_url="https://www.service-public.fr/particuliers/vosdroits/R19993",
                source_type=DocumentType.FORMULAIRE,
                update_frequency="monthly",
                css_selectors={
                    "forms": ".formulaire-item",
                    "title": ".formulaire-title",
                    "pdf_link": ".telecharger-pdf"
                }
            ),

            # Guides associatifs
            DocumentSource(
                name="Unapei Guides",
                base_url="https://www.unapei.org/ressources/guides",
                source_type=DocumentType.GUIDE_ASSOCIATIF,
                update_frequency="monthly",
                css_selectors={
                    "guides": ".guide-item",
                    "title": ".guide-title",
                    "download": ".guide-download"
                }
            )
        ]

        return [source for source in sources if source.active]

    async def __aenter__(self):
        """Context manager pour session HTTP"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={
                'User-Agent': 'PhoenixCare Document Crawler - Legal Research Bot'
            }
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Fermeture session HTTP"""
        if self.session:
            await self.session.close()

    async def crawl_all_sources(self) -> Dict[str, int]:
        """Lance le crawling de toutes les sources configurées"""

        results = {}

        async with self:
            tasks = []
            for source in self.document_sources:
                task = self.crawl_source(source)
                tasks.append(task)

            crawl_results = await asyncio.gather(*tasks, return_exceptions=True)

            for source, result in zip(self.document_sources, crawl_results):
                if isinstance(result, Exception):
                    self.logger.error(f"Erreur crawling {source.name}: {result}")
                    results[source.name] = 0
                else:
                    results[source.name] = result

        return results

    async def crawl_source(self, source: DocumentSource) -> int:
        """Crawle une source spécifique et retourne le nombre de docs traités"""

        self.logger.info(f"Début crawling: {source.name}")
        documents_processed = 0

        try:
            # Récupération de la page principale
            async with self.session.get(source.base_url) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status} pour {source.base_url}")

                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')

            # Extraction des liens de documents selon le type de source
            if source.source_type == DocumentType.CODE_CASF:
                documents_processed = await self._process_legifrance_articles(soup, source)
            elif source.source_type == DocumentType.CIRCULAIRE:
                documents_processed = await self._process_cnsa_circulaires(soup, source)
            elif source.source_type == DocumentType.FAQ_MDPH:
                documents_processed = await self._process_mdph_faq(soup, source)
            elif source.source_type == DocumentType.FORMULAIRE:
                documents_processed = await self._process_formulaires(soup, source)
            elif source.source_type == DocumentType.GUIDE_ASSOCIATIF:
                documents_processed = await self._process_guides_associatifs(soup, source)

        except Exception as e:
            self.logger.error(f"Erreur crawling {source.name}: {e}")
            raise

        self.logger.info(f"Crawling terminé: {source.name} - {documents_processed} documents")
        return documents_processed

    async def _process_cnsa_circulaires(self, soup: BeautifulSoup, source: DocumentSource) -> int:
        """Traite les circulaires CNSA"""

        documents_processed = 0
        circulaire_items = soup.select(source.css_selectors["documents"])

        for item in circulaire_items:
            try:
                # Extraction métadonnées
                title_elem = item.select_one(source.css_selectors["title"])
                date_elem = item.select_one(source.css_selectors["date"])
                pdf_elem = item.select_one(source.css_selectors["pdf_link"])

                if not all([title_elem, date_elem, pdf_elem]):
                    continue

                title = title_elem.get_text(strip=True)
                date_str = date_elem.get_text(strip=True)
                pdf_url = urljoin(source.base_url, pdf_elem.get('href'))

                # Parsing de la date
                pub_date = self._parse_french_date(date_str)

                # Vérification si document déjà traité
                doc_id = self._generate_document_id(pdf_url)
                if await self._is_document_already_processed(doc_id):
                    continue

                # Téléchargement du PDF
                pdf_path = await self._download_pdf(pdf_url, doc_id)
                if not pdf_path:
                    continue

                # Création des métadonnées
                metadata = LegalDocumentMetadata(
                    document_id=doc_id,
                    title=title,
                    document_type=source.source_type,
                    publication_date=pub_date,
                    last_update=datetime.now(),
                    source_url=pdf_url,
                    region=source.region,
                    department=source.department
                )

                # Ingestion dans le RAG
                await self.rag_system.ingest_document(str(pdf_path), metadata)
                documents_processed += 1

                # Sauvegarde métadonnées
                await self._save_document_metadata(doc_id, metadata)

            except Exception as e:
                self.logger.error(f"Erreur traitement circulaire: {e}")
                continue

        return documents_processed

    async def _process_legifrance_articles(self, soup: BeautifulSoup, source: DocumentSource) -> int:
        """Traite les articles du CASF depuis Légifrance"""

        documents_processed = 0
        articles = soup.select(source.css_selectors["articles"])

        for article in articles:
            try:
                title_elem = article.select_one(source.css_selectors["title"])
                content_elem = article.select_one(source.css_selectors["content"])

                if not all([title_elem, content_elem]):
                    continue

                title = title_elem.get_text(strip=True)
                content = content_elem.get_text(strip=True)

                # Extraction numéro d'article
                article_match = re.search(r'Article (L?\d+(?:-\d+)*)', title)
                article_number = article_match.group(1) if article_match else "Unknown"

                doc_id = f"casf_article_{article_number}".replace('-', '_')

                # Vérification si déjà traité
                if await self._is_document_already_processed(doc_id):
                    continue

                # Sauvegarde du contenu
                article_path = self.raw_docs_dir / f"{doc_id}.txt"
                async with aiofiles.open(article_path, 'w', encoding='utf-8') as f:
                    await f.write(f"# {title}\n\n{content}")

                # Métadonnées
                metadata = LegalDocumentMetadata(
                    document_id=doc_id,
                    title=title,
                    document_type=source.source_type,
                    publication_date=datetime.now(),  # À améliorer avec vraie date
                    last_update=datetime.now(),
                    source_url=source.base_url,
                    legal_references=[f"Article {article_number}"]
                )

                # Ingestion
                await self.rag_system.ingest_document(str(article_path), metadata)
                documents_processed += 1

                await self._save_document_metadata(doc_id, metadata)

            except Exception as e:
                self.logger.error(f"Erreur traitement article CASF: {e}")
                continue

        return documents_processed

    async def _process_mdph_faq(self, soup: BeautifulSoup, source: DocumentSource) -> int:
        """Traite les FAQ des sites MDPH départementaux"""

        documents_processed = 0
        faq_items = soup.select(source.css_selectors["documents"])

        for item in faq_items:
            try:
                question_elem = item.select_one(source.css_selectors["question"])
                answer_elem = item.select_one(source.css_selectors["answer"])

                if not all([question_elem, answer_elem]):
                    continue

                question = question_elem.get_text(strip=True)
                answer = answer_elem.get_text(strip=True)

                doc_id = self._generate_document_id(f"{question}_{answer}")

                if await self._is_document_already_processed(doc_id):
                    continue

                # Sauvegarde Q&A
                qa_content = f"Q: {question}\n\nR: {answer}"
                qa_path = self.raw_docs_dir / f"{doc_id}.txt"

                async with aiofiles.open(qa_path, 'w', encoding='utf-8') as f:
                    await f.write(qa_content)

                # Détection automatique des topics
                detected_aids = self._detect_aid_types(qa_content)
                detected_ages = self._detect_age_ranges(qa_content)
                detected_disabilities = self._detect_disability_types(qa_content)

                metadata = LegalDocumentMetadata(
                    document_id=doc_id,
                    title=f"FAQ: {question[:100]}...",
                    document_type=source.source_type,
                    publication_date=datetime.now(),
                    last_update=datetime.now(),
                    source_url=source.base_url,
                    region=source.region,
                    department=source.department,
                    aid_types=detected_aids,
                    age_ranges=detected_ages,
                    target_disabilities=detected_disabilities
                )

                await self.rag_system.ingest_document(str(qa_path), metadata)
                documents_processed += 1

                await self._save_document_metadata(doc_id, metadata)

            except Exception as e:
                self.logger.error(f"Erreur traitement FAQ MDPH: {e}")
                continue

        return documents_processed

    async def _download_pdf(self, pdf_url: str, doc_id: str) -> Optional[Path]:
        """Télécharge un PDF et retourne le chemin local"""

        try:
            async with self.session.get(pdf_url) as response:
                if response.status != 200:
                    return None

                pdf_content = await response.read()
                pdf_path = self.raw_docs_dir / f"{doc_id}.pdf"

                async with aiofiles.open(pdf_path, 'wb') as f:
                    await f.write(pdf_content)

                return pdf_path

        except Exception as e:
            self.logger.error(f"Erreur téléchargement PDF {pdf_url}: {e}")
            return None

    def _generate_document_id(self, content: str) -> str:
        """Génère un ID unique pour un document (SHA256 pour sécurité)"""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    async def _is_document_already_processed(self, doc_id: str) -> bool:
        """Vérifie si un document a déjà été traité"""
        metadata_path = self.metadata_dir / f"{doc_id}.json"
        return metadata_path.exists()

    async def _save_document_metadata(self, doc_id: str, metadata: LegalDocumentMetadata):
        """Sauvegarde les métadonnées d'un document"""
        metadata_path = self.metadata_dir / f"{doc_id}.json"

        # Conversion en dict sérialisable
        metadata_dict = asdict(metadata)
        metadata_dict['publication_date'] = metadata.publication_date.isoformat()
        metadata_dict['last_update'] = metadata.last_update.isoformat()

        async with aiofiles.open(metadata_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(metadata_dict, indent=2, ensure_ascii=False))

    def _parse_french_date(self, date_str: str) -> datetime:
        """Parse les dates en format français"""
        # Patterns courants de dates françaises
        patterns = [
            r'(\d{1,2})/(\d{1,2})/(\d{4})',  # 01/12/2024
            r'(\d{1,2})-(\d{1,2})-(\d{4})',  # 01-12-2024
            r'(\d{1,2}) (\w+) (\d{4})',      # 1 décembre 2024
        ]

        for pattern in patterns:
            match = re.search(pattern, date_str)
            if match:
                try:
                    if len(match.groups()) == 3:
                        day, month_or_name, year = match.groups()

                        # Si le mois est un nom
                        if month_or_name.isalpha():
                            french_months = {
                                'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4,
                                'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8,
                                'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
                            }
                            month = french_months.get(month_or_name.lower(), 1)
                        else:
                            month = int(month_or_name)

                        return datetime(int(year), month, int(day))
                except ValueError:
                    continue

        # Si aucun pattern ne marche, retour date actuelle
        return datetime.now()

    def _detect_aid_types(self, content: str) -> List[str]:
        """Détecte automatiquement les types d'aides mentionnés"""
        aids = []
        content_lower = content.lower()

        aid_patterns = {
            'AEEH': ['aeeh', 'allocation éducation enfant handicapé'],
            'PCH': ['pch', 'prestation compensation handicap'],
            'AESH': ['aesh', 'accompagnant élève', 'auxiliaire vie scolaire'],
            'transport': ['transport scolaire', 'transport adapté'],
            'matériel': ['matériel pédagogique', 'aide technique'],
            'RQTH': ['rqth', 'reconnaissance qualité travailleur handicapé']
        }

        for aid_type, patterns in aid_patterns.items():
            if any(pattern in content_lower for pattern in patterns):
                aids.append(aid_type)

        return aids

    def _detect_age_ranges(self, content: str) -> List[str]:
        """Détecte les tranches d'âge concernées"""
        ages = []
        content_lower = content.lower()

        age_patterns = {
            'petite_enfance': ['0-3', 'petite enfance', 'crèche', 'bébé'],
            'maternelle': ['3-6', 'maternelle', 'école maternelle'],
            'primaire': ['6-11', 'primaire', 'élémentaire', 'cp', 'ce1', 'ce2', 'cm1', 'cm2'],
            'collège': ['11-15', 'collège', '6ème', '5ème', '4ème', '3ème'],
            'lycée': ['15-18', 'lycée', 'seconde', 'première', 'terminale'],
            'adulte': ['18+', 'adulte', 'majeur']
        }

        for age_range, patterns in age_patterns.items():
            if any(pattern in content_lower for pattern in patterns):
                ages.append(age_range)

        return ages

    def _detect_disability_types(self, content: str) -> List[str]:
        """Détecte les types de handicap mentionnés"""
        disabilities = []
        content_lower = content.lower()

        disability_patterns = {
            'autisme': ['autisme', 'tsa', 'asperger', 'ted'],
            'déficience_intellectuelle': ['déficience intellectuelle', 'retard mental', 'trisomie'],
            'déficience_motrice': ['déficience motrice', 'paralysie', 'myopathie', 'spina bifida'],
            'déficience_sensorielle': ['déficience sensorielle', 'surdité', 'cécité', 'malvoyant'],
            'troubles_dys': ['dyslexie', 'dyspraxie', 'dysorthographie', 'dyscalculie'],
            'polyhandicap': ['polyhandicap', 'handicap sévère']
        }

        for disability, patterns in disability_patterns.items():
            if any(pattern in content_lower for pattern in patterns):
                disabilities.append(disability)

        return disabilities


# Tâches Celery pour automatisation
@celery_app.task
def scheduled_crawl_all_sources():
    """Tâche programmée pour crawler toutes les sources"""
    async def run_crawl():
        rag_system = LegalRAGSystem()
        pipeline = DocumentIngestionPipeline(rag_system)
        results = await pipeline.crawl_all_sources()
        return results

    return asyncio.run(run_crawl())

@celery_app.task
def scheduled_crawl_source(source_name: str):
    """Tâche programmée pour crawler une source spécifique"""
    async def run_crawl():
        rag_system = LegalRAGSystem()
        pipeline = DocumentIngestionPipeline(rag_system)

        # Trouver la source
        source = next((s for s in pipeline.document_sources if s.name == source_name), None)
        if not source:
            raise ValueError(f"Source {source_name} non trouvée")

        result = await pipeline.crawl_source(source)
        return result

    return asyncio.run(run_crawl())


# Scheduler pour automatisation
def setup_crawling_schedule():
    """Configure le planning de crawling automatique"""

    # Crawling quotidien sources critiques
    schedule.every().day.at("02:00").do(
        lambda: scheduled_crawl_source.delay("CNSA Circulaires")
    )

    # Crawling hebdomadaire FAQ MDPH
    schedule.every().monday.at("03:00").do(
        lambda: scheduled_crawl_all_sources.delay()
    )

    # Crawling mensuel sources moins fréquentes
    schedule.every().month.do(
        lambda: scheduled_crawl_source.delay("Légifrance CASF")
    )


if __name__ == "__main__":
    # Test du pipeline
    async def test_pipeline():
        rag_system = LegalRAGSystem()
        pipeline = DocumentIngestionPipeline(rag_system)

        # Test crawling d'une source
        results = await pipeline.crawl_all_sources()
        print(f"Documents traités: {results}")

    asyncio.run(test_pipeline())