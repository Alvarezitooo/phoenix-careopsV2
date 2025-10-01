"""
Optimiseur de stockage pour PhoenixCare
Gestion intelligente de l'espace disque
"""

import os
import gzip
import shutil
import hashlib
from pathlib import Path
from typing import Dict, List, Any, Optional
import logging
import json
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class StorageOptimizer:
    """
    Gestionnaire optimisé du stockage PhoenixCare
    """

    def __init__(self,
                 base_dir: str = "data/phoenixcare",
                 max_storage_mb: int = 500,
                 light_mode: bool = False):
        self.base_dir = Path(base_dir)
        self.max_storage_bytes = max_storage_mb * 1024 * 1024
        self.light_mode = light_mode

        # Structure des dossiers
        self.dirs = {
            'documents': self.base_dir / 'documents',
            'vectors': self.base_dir / 'vectors',
            'cache': self.base_dir / 'cache',
            'temp': self.base_dir / 'temp',
            'compressed': self.base_dir / 'compressed'
        }

        self._ensure_directories()

    def _ensure_directories(self):
        """Crée la structure de dossiers"""
        for dir_path in self.dirs.values():
            dir_path.mkdir(parents=True, exist_ok=True)

    def get_storage_stats(self) -> Dict[str, Any]:
        """Statistiques d'utilisation du stockage"""
        stats = {
            'total_size_mb': 0,
            'by_category': {},
            'file_count': 0,
            'compression_ratio': 0,
            'storage_limit_mb': self.max_storage_bytes / (1024 * 1024)
        }

        for category, dir_path in self.dirs.items():
            if dir_path.exists():
                size_bytes = sum(f.stat().st_size for f in dir_path.rglob('*') if f.is_file())
                file_count = len(list(dir_path.rglob('*')))

                stats['by_category'][category] = {
                    'size_mb': round(size_bytes / (1024 * 1024), 2),
                    'file_count': file_count
                }
                stats['total_size_mb'] += size_bytes / (1024 * 1024)
                stats['file_count'] += file_count

        stats['total_size_mb'] = round(stats['total_size_mb'], 2)
        stats['usage_percent'] = round((stats['total_size_mb'] / (self.max_storage_bytes / (1024 * 1024))) * 100, 1)

        return stats

    async def store_document(self,
                           content: str,
                           metadata: Dict[str, Any],
                           source_file: Optional[str] = None) -> str:
        """
        Stocke un document de manière optimisée
        """
        doc_id = self._generate_document_id(content, metadata)

        # Mode léger : ne garde que l'essentiel
        if self.light_mode:
            return await self._store_light_mode(doc_id, content, metadata)

        # Mode normal : stockage compressé
        return await self._store_normal_mode(doc_id, content, metadata, source_file)

    async def _store_light_mode(self, doc_id: str, content: str, metadata: Dict[str, Any]) -> str:
        """
        Stockage ultra-léger : juste métadonnées + hash
        """
        # Hash du contenu pour dédoublonnage (SHA256 pour sécurité)
        content_hash = hashlib.sha256(content.encode()).hexdigest()

        light_doc = {
            'id': doc_id,
            'content_hash': content_hash,
            'metadata': metadata,
            'content_length': len(content),
            'stored_at': datetime.utcnow().isoformat(),
            'mode': 'light'
        }

        # Stockage ultra-compact
        doc_file = self.dirs['cache'] / f"{doc_id}.json.gz"
        with gzip.open(doc_file, 'wt', encoding='utf-8') as f:
            json.dump(light_doc, f, ensure_ascii=False)

        logger.info(f"Document {doc_id} stocké en mode léger ({doc_file.stat().st_size} bytes)")
        return doc_id

    async def _store_normal_mode(self, doc_id: str, content: str, metadata: Dict[str, Any], source_file: Optional[str]) -> str:
        """
        Stockage normal avec compression intelligente
        """
        # Structure du document
        document = {
            'id': doc_id,
            'content': content,
            'metadata': metadata,
            'stored_at': datetime.utcnow().isoformat(),
            'source_file': source_file,
            'mode': 'normal'
        }

        # Stockage compressé
        doc_file = self.dirs['documents'] / f"{doc_id}.json.gz"
        with gzip.open(doc_file, 'wt', encoding='utf-8') as f:
            json.dump(document, f, ensure_ascii=False)

        # Si fichier source volumineux, le compresser séparément
        if source_file and Path(source_file).exists():
            await self._compress_source_file(source_file, doc_id)

        logger.info(f"Document {doc_id} stocké normalement ({doc_file.stat().st_size} bytes)")
        return doc_id

    async def _compress_source_file(self, source_file: str, doc_id: str):
        """
        Compresse les fichiers sources volumineux
        """
        source_path = Path(source_file)
        if source_path.stat().st_size > 1024 * 1024:  # > 1MB

            compressed_path = self.dirs['compressed'] / f"{doc_id}_{source_path.name}.gz"

            with open(source_path, 'rb') as f_in:
                with gzip.open(compressed_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)

            # Supprime l'original si compression efficace
            original_size = source_path.stat().st_size
            compressed_size = compressed_path.stat().st_size
            compression_ratio = compressed_size / original_size

            if compression_ratio < 0.8:  # Si compression > 20%
                logger.info(f"Fichier {source_file} compressé : {original_size} → {compressed_size} bytes ({compression_ratio:.1%})")
                # On peut supprimer l'original en production
            else:
                compressed_path.unlink()  # Compression pas efficace
                logger.info(f"Compression de {source_file} non efficace, fichier original conservé")

    def _generate_document_id(self, content: str, metadata: Dict[str, Any]) -> str:
        """
        Génère un ID unique basé sur le contenu
        """
        content_sample = content[:500] + str(metadata.get('source_url', ''))
        return hashlib.sha256(content_sample.encode()).hexdigest()[:16]

    async def cleanup_storage(self) -> Dict[str, Any]:
        """
        Nettoyage automatique du stockage
        """
        stats_before = self.get_storage_stats()

        cleanup_results = {
            'files_removed': 0,
            'space_freed_mb': 0,
            'actions': []
        }

        # 1. Suppression fichiers temporaires anciens
        temp_cleaned = await self._cleanup_temp_files()
        cleanup_results['actions'].append(f"Nettoyage fichiers temp: {temp_cleaned} fichiers")

        # 2. Suppression cache ancien
        cache_cleaned = await self._cleanup_old_cache()
        cleanup_results['actions'].append(f"Nettoyage cache: {cache_cleaned} fichiers")

        # 3. Dédoublonnage
        dedupe_saved = await self._deduplicate_documents()
        cleanup_results['actions'].append(f"Dédoublonnage: {dedupe_saved} MB économisés")

        # 4. Si toujours trop volumineux, mode d'urgence
        if self.get_storage_stats()['total_size_mb'] > self.max_storage_bytes / (1024 * 1024):
            emergency_cleaned = await self._emergency_cleanup()
            cleanup_results['actions'].append(f"Nettoyage d'urgence: {emergency_cleaned} fichiers")

        stats_after = self.get_storage_stats()
        cleanup_results['space_freed_mb'] = round(stats_before['total_size_mb'] - stats_after['total_size_mb'], 2)

        return cleanup_results

    async def _cleanup_temp_files(self) -> int:
        """Supprime les fichiers temporaires anciens"""
        count = 0
        cutoff_date = datetime.utcnow() - timedelta(hours=24)

        for temp_file in self.dirs['temp'].rglob('*'):
            if temp_file.is_file():
                file_time = datetime.fromtimestamp(temp_file.stat().st_mtime)
                if file_time < cutoff_date:
                    temp_file.unlink()
                    count += 1

        return count

    async def _cleanup_old_cache(self) -> int:
        """Supprime les caches anciens"""
        count = 0
        cutoff_date = datetime.utcnow() - timedelta(days=7)

        for cache_file in self.dirs['cache'].rglob('*.json.gz'):
            if cache_file.is_file():
                file_time = datetime.fromtimestamp(cache_file.stat().st_mtime)
                if file_time < cutoff_date:
                    cache_file.unlink()
                    count += 1

        return count

    async def _deduplicate_documents(self) -> float:
        """Dédoublonne les documents identiques"""
        # TODO: Implémenter algorithme de dédoublonnage par hash
        return 0.0

    async def _emergency_cleanup(self) -> int:
        """Nettoyage d'urgence si espace insuffisant"""
        count = 0
        # Garde seulement les 100 documents les plus récents
        all_docs = list(self.dirs['documents'].rglob('*.json.gz'))
        all_docs.sort(key=lambda x: x.stat().st_mtime, reverse=True)

        for old_doc in all_docs[100:]:  # Supprime après les 100 premiers
            old_doc.unlink()
            count += 1

        logger.warning(f"Nettoyage d'urgence: {count} documents supprimés")
        return count

    def get_recommended_config(self) -> Dict[str, Any]:
        """
        Recommandations de configuration selon l'espace disponible
        """
        stats = self.get_storage_stats()

        if stats['total_size_mb'] < 100:
            return {
                'mode': 'normal',
                'compression': 'standard',
                'retention_days': 30,
                'recommendation': 'Espace suffisant - mode normal'
            }
        elif stats['total_size_mb'] < 300:
            return {
                'mode': 'compressed',
                'compression': 'high',
                'retention_days': 14,
                'recommendation': 'Activer compression haute'
            }
        else:
            return {
                'mode': 'light',
                'compression': 'maximum',
                'retention_days': 7,
                'recommendation': 'Mode léger recommandé'
            }

# Instance globale
storage_optimizer = StorageOptimizer()

# Fonction d'utilité
def get_storage_summary() -> str:
    """Résumé rapide du stockage"""
    stats = storage_optimizer.get_storage_stats()

    return f"""
📊 STOCKAGE PHOENIXCARE

💾 Utilisation: {stats['total_size_mb']} MB / {stats['storage_limit_mb']} MB ({stats['usage_percent']}%)
📁 Fichiers: {stats['file_count']} documents

Par catégorie:
{''.join(f"  {cat}: {data['size_mb']} MB ({data['file_count']} fichiers)\n" for cat, data in stats['by_category'].items())}

Recommandation: {storage_optimizer.get_recommended_config()['recommendation']}
"""

if __name__ == "__main__":
    # Test du stockage
    print(get_storage_summary())