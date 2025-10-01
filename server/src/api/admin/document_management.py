"""
API d'administration pour la gestion des documents PhoenixCare
Upload, ingestion et gestion de la base de connaissances
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
import tempfile
import os
from pathlib import Path

from ...ai.manual_ingestion import ManualDocumentIngestion
from ...ai.document_ingestion import DocumentIngestionPipeline
from ...ai.vectorization_service import create_vectorization_service
from ...middlewares.auth import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/documents", tags=["Admin - Documents"])

# Services
manual_ingestion = ManualDocumentIngestion()
pipeline = DocumentIngestionPipeline()
vectorizer, search_engine = create_vectorization_service()

# Modèles Pydantic
class DocumentUploadResponse(BaseModel):
    success: bool
    document_id: str
    chunks_created: int
    message: str
    processing_time: float

class BulkUrlRequest(BaseModel):
    urls: List[str] = Field(..., description="Liste d'URLs à ingérer")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class DocumentMetadata(BaseModel):
    title: str
    document_type: str
    department: Optional[str] = None
    source_organization: str = "PhoenixCare"
    tags: List[str] = Field(default_factory=list)
    priority: str = "normal"

@router.post("/upload-pdf", response_model=DocumentUploadResponse)
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    document_type: str = Form(...),
    department: Optional[str] = Form(None),
    tags: str = Form(""),
    current_admin = Depends(require_admin)
):
    """
    Upload et ingestion d'un fichier PDF
    """
    start_time = datetime.utcnow()

    # Validation du fichier
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Seuls les fichiers PDF sont acceptés"
        )

    if file.size > 50 * 1024 * 1024:  # 50MB max
        raise HTTPException(
            status_code=400,
            detail="Fichier trop volumineux (max 50MB)"
        )

    try:
        # Sauvegarde temporaire
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Métadonnées
        metadata = {
            'title': title,
            'document_type': document_type,
            'department': department,
            'tags': [tag.strip() for tag in tags.split(',') if tag.strip()],
            'uploaded_by': current_admin.get('id'),
            'upload_timestamp': datetime.utcnow().isoformat(),
            'original_filename': file.filename
        }

        # Ingestion
        chunks = await manual_ingestion.ingest_pdf_file(
            temp_file_path,
            metadata
        )

        # Vectorisation en arrière-plan
        background_tasks.add_task(
            _vectorize_chunks_background,
            chunks
        )

        # Nettoyage
        os.unlink(temp_file_path)

        processing_time = (datetime.utcnow() - start_time).total_seconds()

        return DocumentUploadResponse(
            success=True,
            document_id=chunks[0].metadata.get('document_id', 'unknown'),
            chunks_created=len(chunks),
            message=f"Document '{title}' ingéré avec succès",
            processing_time=processing_time
        )

    except Exception as e:
        logger.error(f"Erreur upload PDF: {e}")
        # Nettoyage en cas d'erreur
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'ingestion: {str(e)}"
        )

@router.post("/ingest-urls")
async def ingest_bulk_urls(
    request: BulkUrlRequest,
    background_tasks: BackgroundTasks,
    current_admin = Depends(require_admin)
):
    """
    Ingestion en lot depuis des URLs
    """
    if len(request.urls) > 20:
        raise HTTPException(
            status_code=400,
            detail="Maximum 20 URLs par batch"
        )

    try:
        # Métadonnées enrichies
        enriched_metadata = {
            **request.metadata,
            'ingested_by': current_admin.get('id'),
            'batch_timestamp': datetime.utcnow().isoformat()
        }

        # Lancement de l'ingestion en arrière-plan
        background_tasks.add_task(
            _ingest_urls_background,
            request.urls,
            enriched_metadata
        )

        return {
            'success': True,
            'message': f'Ingestion de {len(request.urls)} URLs lancée en arrière-plan',
            'urls_count': len(request.urls)
        }

    except Exception as e:
        logger.error(f"Erreur ingestion URLs: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du lancement de l'ingestion: {str(e)}"
        )

@router.post("/crawl-sources")
async def trigger_automatic_crawling(
    background_tasks: BackgroundTasks,
    source_names: Optional[List[str]] = None,
    current_admin = Depends(require_admin)
):
    """
    Déclenche le crawling automatique des sources officielles
    """
    try:
        # Lancement du crawling en arrière-plan
        background_tasks.add_task(
            _run_automatic_crawling,
            source_names,
            current_admin.get('id')
        )

        return {
            'success': True,
            'message': 'Crawling automatique lancé en arrière-plan',
            'triggered_by': current_admin.get('id'),
            'timestamp': datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Erreur lancement crawling: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du lancement du crawling: {str(e)}"
        )

@router.get("/ingestion-status")
async def get_ingestion_status(current_admin = Depends(require_admin)):
    """
    Statut de l'ingestion et statistiques
    """
    try:
        # Statistiques d'ingestion manuelle
        manual_stats = await manual_ingestion.get_ingestion_stats()

        # Statistiques du pipeline automatique
        auto_stats = await pipeline.get_pipeline_status()

        # Statistiques de vectorisation
        # TODO: Implémenter dans vectorization_service

        return {
            'manual_ingestion': manual_stats,
            'automatic_pipeline': auto_stats,
            'last_updated': datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Erreur récupération statut: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération du statut"
        )

@router.get("/document-sources")
async def list_document_sources(current_admin = Depends(require_admin)):
    """
    Liste des sources de documents configurées
    """
    try:
        sources = await pipeline.get_configured_sources()

        return {
            'sources': [
                {
                    'name': source.name,
                    'base_url': source.base_url,
                    'type': source.source_type.value,
                    'crawl_frequency': source.crawl_frequency,
                    'last_crawled': source.last_crawled,
                    'active': source.active
                }
                for source in sources
            ],
            'total_sources': len(sources)
        }

    except Exception as e:
        logger.error(f"Erreur liste sources: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération des sources"
        )

@router.post("/reindex-documents")
async def reindex_all_documents(
    background_tasks: BackgroundTasks,
    current_admin = Depends(require_admin)
):
    """
    Relance la vectorisation de tous les documents
    """
    try:
        background_tasks.add_task(
            _reindex_documents_background,
            current_admin.get('id')
        )

        return {
            'success': True,
            'message': 'Réindexation lancée en arrière-plan',
            'triggered_by': current_admin.get('id')
        }

    except Exception as e:
        logger.error(f"Erreur réindexation: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors du lancement de la réindexation"
        )

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    current_admin = Depends(require_admin)
):
    """
    Supprime un document de la base de connaissances
    """
    try:
        # TODO: Implémenter la suppression dans les services
        # await document_service.delete_document(document_id)

        return {
            'success': True,
            'message': f'Document {document_id} supprimé',
            'deleted_by': current_admin.get('id')
        }

    except Exception as e:
        logger.error(f"Erreur suppression document: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la suppression"
        )

# Tâches en arrière-plan

async def _vectorize_chunks_background(chunks):
    """
    Vectorise les chunks en arrière-plan
    """
    try:
        await vectorizer.vectorize_documents(chunks)
        logger.info(f"Vectorisation terminée: {len(chunks)} chunks")
    except Exception as e:
        logger.error(f"Erreur vectorisation background: {e}")

async def _ingest_urls_background(urls: List[str], metadata: Dict[str, Any]):
    """
    Ingère les URLs en arrière-plan
    """
    try:
        results = await manual_ingestion.ingest_batch_urls(urls, metadata)
        total_chunks = sum(len(chunks) for chunks in results.values())
        logger.info(f"Ingestion URLs terminée: {len(urls)} URLs, {total_chunks} chunks")

        # Vectorisation des chunks
        all_chunks = []
        for chunks in results.values():
            all_chunks.extend(chunks)

        if all_chunks:
            await vectorizer.vectorize_documents(all_chunks)

    except Exception as e:
        logger.error(f"Erreur ingestion URLs background: {e}")

async def _run_automatic_crawling(source_names: Optional[List[str]], admin_id: str):
    """
    Lance le crawling automatique en arrière-plan
    """
    try:
        results = await pipeline.run_full_ingestion(source_names)
        logger.info(f"Crawling automatique terminé par {admin_id}: {results}")
    except Exception as e:
        logger.error(f"Erreur crawling background: {e}")

async def _reindex_documents_background(admin_id: str):
    """
    Réindexe tous les documents en arrière-plan
    """
    try:
        # TODO: Récupérer tous les documents et relancer la vectorisation
        logger.info(f"Réindexation lancée par {admin_id}")
    except Exception as e:
        logger.error(f"Erreur réindexation background: {e}")