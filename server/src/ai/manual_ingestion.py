"""
Ingestion manuelle de documents pour PhoenixCare
Upload et traitement de PDFs, URLs et documents locaux
"""

import asyncio
import aiofiles
from pathlib import Path
from typing import List, Dict, Any, Optional, Union
import logging
from datetime import datetime
import hashlib
import mimetypes
import PyPDF2
import requests
from urllib.parse import urlparse
import tempfile
import os

from .document_ingestion import DocumentChunk, DocumentProcessor, DocumentType

logger = logging.getLogger(__name__)

class ManualDocumentIngestion:
    """
    Service d'ingestion manuelle pour documents juridiques
    """

    def __init__(self):
        self.processor = DocumentProcessor()
        self.upload_dir = Path("data/uploads")
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def ingest_pdf_file(
        self,
        file_path: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[DocumentChunk]:
        """
        Ingère un fichier PDF local
        """
        logger.info(f"Début ingestion PDF: {file_path}")

        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"Fichier non trouvé: {file_path}")

        # Extraction du texte du PDF
        text_content = await self._extract_pdf_text(file_path)

        if not text_content.strip():
            raise ValueError("Le PDF ne contient pas de texte extractible")

        # Métadonnées automatiques
        auto_metadata = {
            'file_name': file_path.name,
            'file_size': file_path.stat().st_size,
            'file_path': str(file_path.absolute()),
            'ingestion_method': 'manual_pdf',
            'last_modified': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
            'content_hash': self._calculate_content_hash(text_content)
        }

        # Fusion avec métadonnées fournies
        if metadata:
            auto_metadata.update(metadata)

        # Traitement du document
        chunks = await self.processor.process_document(
            content=text_content,
            metadata=auto_metadata,
            source_url=f"file://{file_path.absolute()}"
        )

        logger.info(f"PDF ingéré avec succès: {len(chunks)} chunks créés")
        return chunks

    async def ingest_from_url(
        self,
        url: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[DocumentChunk]:
        """
        Ingère un document depuis une URL
        """
        logger.info(f"Début ingestion URL: {url}")

        # Téléchargement du document
        temp_file = await self._download_document(url)

        try:
            # Détection du type de fichier
            mime_type, _ = mimetypes.guess_type(url)

            if mime_type == 'application/pdf':
                chunks = await self.ingest_pdf_file(temp_file, metadata)
            else:
                # Pour d'autres types (HTML, etc.)
                chunks = await self._process_web_content(url, metadata)

            return chunks

        finally:
            # Nettoyage du fichier temporaire
            if temp_file and os.path.exists(temp_file):
                os.unlink(temp_file)

    async def ingest_batch_urls(
        self,
        urls: List[str],
        common_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, List[DocumentChunk]]:
        """
        Ingère une liste d'URLs en batch
        """
        logger.info(f"Début ingestion batch: {len(urls)} URLs")

        results = {}

        # Traitement en parallèle (max 3 simultanés pour éviter le rate limiting)
        semaphore = asyncio.Semaphore(3)

        async def process_url(url: str):
            async with semaphore:
                try:
                    chunks = await self.ingest_from_url(url, common_metadata)
                    return url, chunks
                except Exception as e:
                    logger.error(f"Erreur ingestion {url}: {e}")
                    return url, []

        # Lancement des tâches
        tasks = [process_url(url) for url in urls]
        completed_tasks = await asyncio.gather(*tasks, return_exceptions=True)

        # Compilation des résultats
        for result in completed_tasks:
            if isinstance(result, tuple):
                url, chunks = result
                results[url] = chunks

        logger.info(f"Batch terminé: {len(results)} URLs traitées")
        return results

    async def ingest_directory(
        self,
        directory_path: str,
        file_pattern: str = "*.pdf",
        recursive: bool = True
    ) -> Dict[str, List[DocumentChunk]]:
        """
        Ingère tous les fichiers d'un répertoire
        """
        logger.info(f"Début ingestion répertoire: {directory_path}")

        directory = Path(directory_path)
        if not directory.exists():
            raise FileNotFoundError(f"Répertoire non trouvé: {directory}")

        # Recherche des fichiers
        if recursive:
            files = list(directory.rglob(file_pattern))
        else:
            files = list(directory.glob(file_pattern))

        logger.info(f"Trouvé {len(files)} fichiers à traiter")

        results = {}
        for file_path in files:
            try:
                chunks = await self.ingest_pdf_file(str(file_path))
                results[str(file_path)] = chunks
            except Exception as e:
                logger.error(f"Erreur traitement {file_path}: {e}")
                results[str(file_path)] = []

        return results

    async def _extract_pdf_text(self, file_path: Path) -> str:
        """
        Extrait le texte d'un fichier PDF
        """
        text_content = ""

        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)

                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text.strip():
                            text_content += f"\n--- Page {page_num + 1} ---\n"
                            text_content += page_text + "\n"
                    except Exception as e:
                        logger.warning(f"Erreur extraction page {page_num + 1}: {e}")
                        continue

        except Exception as e:
            logger.error(f"Erreur lecture PDF {file_path}: {e}")
            raise

        return text_content

    async def _download_document(self, url: str) -> str:
        """
        Télécharge un document depuis une URL
        """
        try:
            response = requests.get(url, timeout=30, stream=True)
            response.raise_for_status()

            # Création d'un fichier temporaire
            temp_file = tempfile.NamedTemporaryFile(delete=False)

            # Téléchargement par chunks
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    temp_file.write(chunk)

            temp_file.close()
            return temp_file.name

        except Exception as e:
            logger.error(f"Erreur téléchargement {url}: {e}")
            raise

    async def _process_web_content(
        self,
        url: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[DocumentChunk]:
        """
        Traite le contenu web (HTML, etc.)
        """
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()

            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')

            # Nettoyage du HTML
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()

            text_content = soup.get_text()

            # Métadonnées automatiques
            auto_metadata = {
                'source_url': url,
                'content_type': 'html',
                'ingestion_method': 'manual_url',
                'title': soup.title.string if soup.title else 'Sans titre',
                'last_modified': datetime.utcnow().isoformat(),
                'content_hash': self._calculate_content_hash(text_content)
            }

            if metadata:
                auto_metadata.update(metadata)

            # Traitement
            chunks = await self.processor.process_document(
                content=text_content,
                metadata=auto_metadata,
                source_url=url
            )

            return chunks

        except Exception as e:
            logger.error(f"Erreur traitement contenu web {url}: {e}")
            raise

    def _calculate_content_hash(self, content: str) -> str:
        """
        Calcule un hash du contenu pour détecter les doublons (SHA256 pour sécurité)
        """
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    async def get_ingestion_stats(self) -> Dict[str, Any]:
        """
        Retourne les statistiques d'ingestion
        """
        stats = {
            'upload_directory': str(self.upload_dir.absolute()),
            'upload_directory_exists': self.upload_dir.exists(),
            'supported_formats': ['PDF', 'HTML', 'URL'],
            'max_file_size': '50MB',  # Configurable
            'batch_size_limit': 10    # Configurable
        }

        if self.upload_dir.exists():
            files = list(self.upload_dir.iterdir())
            stats.update({
                'files_in_upload_dir': len(files),
                'total_upload_size': sum(f.stat().st_size for f in files if f.is_file())
            })

        return stats

# Interface de commande pour tests
class IngestionCLI:
    """
    Interface en ligne de commande pour l'ingestion manuelle
    """

    def __init__(self):
        self.ingestion = ManualDocumentIngestion()

    async def run_interactive(self):
        """
        Mode interactif pour tester l'ingestion
        """
        print("=== PhoenixCare - Ingestion manuelle ===")
        print("1. Ingérer un PDF local")
        print("2. Ingérer depuis une URL")
        print("3. Ingérer un répertoire")
        print("4. Statistiques")

        choice = input("Votre choix (1-4): ")

        if choice == "1":
            await self._ingest_pdf_interactive()
        elif choice == "2":
            await self._ingest_url_interactive()
        elif choice == "3":
            await self._ingest_directory_interactive()
        elif choice == "4":
            await self._show_stats()
        else:
            print("Choix invalide")

    async def _ingest_pdf_interactive(self):
        file_path = input("Chemin vers le PDF: ")
        try:
            chunks = await self.ingestion.ingest_pdf_file(file_path)
            print(f"✅ Succès: {len(chunks)} chunks créés")
        except Exception as e:
            print(f"❌ Erreur: {e}")

    async def _ingest_url_interactive(self):
        url = input("URL du document: ")
        try:
            chunks = await self.ingestion.ingest_from_url(url)
            print(f"✅ Succès: {len(chunks)} chunks créés")
        except Exception as e:
            print(f"❌ Erreur: {e}")

    async def _ingest_directory_interactive(self):
        directory = input("Chemin du répertoire: ")
        try:
            results = await self.ingestion.ingest_directory(directory)
            total_chunks = sum(len(chunks) for chunks in results.values())
            print(f"✅ Succès: {len(results)} fichiers, {total_chunks} chunks total")
        except Exception as e:
            print(f"❌ Erreur: {e}")

    async def _show_stats(self):
        stats = await self.ingestion.get_ingestion_stats()
        print("\n=== Statistiques ===")
        for key, value in stats.items():
            print(f"{key}: {value}")

# Script principal pour test
if __name__ == "__main__":
    import asyncio

    async def main():
        cli = IngestionCLI()
        await cli.run_interactive()

    asyncio.run(main())