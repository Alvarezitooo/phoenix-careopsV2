"""
Configuration de stockage optimisée PhoenixCare
Mode léger pour développement local
"""

import os
from pathlib import Path

# Configuration recommandée pour développement
PHOENIX_STORAGE_CONFIG = {
    "mode": "light",  # Mode léger par défaut
    "max_storage_mb": 100,  # Limite à 100 MB
    "auto_cleanup": True,   # Nettoyage automatique

    "document_processing": {
        "keep_source_files": False,      # ❌ Supprime PDFs après traitement
        "compress_embeddings": True,     # ✅ Compresse les vecteurs
        "extract_text_only": True,      # ✅ Texte seul (pas d'images)
        "deduplicate": True             # ✅ Évite les doublons
    },

    "retention": {
        "processed_documents": "7 days",    # Garde 7 jours
        "cache_files": "2 days",           # Cache court
        "temp_files": "1 day"              # Nettoyage quotidien
    },

    "cloud_fallback": {
        "enabled": False,        # Pour plus tard si besoin
        "provider": "google",    # Google Cloud Storage
        "bucket": "phoenixcare-docs"
    }
}

def get_storage_path() -> Path:
    """Chemin de stockage optimisé"""
    # Utilise un dossier dans le home si possible
    home_path = Path.home() / ".phoenixcare"
    project_path = Path(__file__).parent.parent.parent / "data"

    # Préfère home si espace suffisant
    return home_path if home_path.parent.exists() else project_path

def estimate_space_usage() -> dict:
    """Estimation de l'espace nécessaire"""
    return {
        "mode_normal": {
            "documents": 500,  # MB
            "vectors": 30,     # MB
            "cache": 20,       # MB
            "total": 550       # MB
        },
        "mode_light": {
            "documents": 0,    # MB (supprimés après traitement)
            "vectors": 15,     # MB (compressés)
            "cache": 5,        # MB (minimal)
            "total": 20        # MB seulement !
        },
        "mode_cloud": {
            "documents": 0,    # MB (cloud)
            "vectors": 5,      # MB (index local minimal)
            "cache": 2,        # MB
            "total": 7         # MB ultra-minimal
        }
    }

def print_storage_options():
    """Affiche les options de stockage"""
    estimates = estimate_space_usage()

    print("🗄️  OPTIONS DE STOCKAGE PHOENIXCARE")
    print("=" * 50)

    for mode, usage in estimates.items():
        mode_name = mode.replace('mode_', '').upper()
        print(f"\n📁 {mode_name}:")
        print(f"   Total: {usage['total']} MB")
        print(f"   Documents: {usage['documents']} MB")
        print(f"   Vecteurs: {usage['vectors']} MB")
        print(f"   Cache: {usage['cache']} MB")

        if mode == 'mode_light':
            print("   ⭐ RECOMMANDÉ pour développement")
        elif mode == 'mode_cloud':
            print("   ☁️  Pour production")

if __name__ == "__main__":
    print_storage_options()
    print(f"\n📍 Chemin stockage: {get_storage_path()}")
    print(f"🔧 Config actuelle: {PHOENIX_STORAGE_CONFIG['mode'].upper()}")