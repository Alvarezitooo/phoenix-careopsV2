"""
Configuration finale d'ingestion PhoenixCare - Sans CNSA
Stratégie optimisée et sécurisée juridiquement
"""

from typing import Dict, List, Any
from dataclasses import dataclass
import os

@dataclass
class IngestionConfig:
    """Configuration complète d'ingestion PhoenixCare"""

    # Phase 1: Sources immédiates (0 risque juridique)
    IMMEDIATE_SOURCES = {
        "legifrance.gouv.fr": {
            "priority": 1,
            "legal_risk": "TRÈS FAIBLE",
            "rate_limit": 3,  # secondes entre requêtes
            "target_paths": [
                "/codes/texte_lc/LEGITEXT000006074069",  # Code action sociale
                "/codes/section_lc/LEGISCTA000006157614",  # AEEH
                "/codes/section_lc/LEGISCTA000006178389",  # PCH
                "/eli/decret/",  # Décrets récents
                "/jorf/id/",  # Journal officiel
            ],
            "content_types": [
                "Articles Code CASF",
                "Décrets handicap",
                "Arrêtés ministériels",
                "Jurisprudence AEEH/PCH"
            ],
            "estimated_documents": 200,
            "robots_txt_status": "TRÈS PERMISSIF"
        },

        "service-public.fr": {
            "priority": 1,
            "legal_risk": "TRÈS FAIBLE",
            "rate_limit": 3,
            "target_paths": [
                "/particuliers/vosdroits/F14809",  # AEEH
                "/particuliers/vosdroits/F14202",  # PCH
                "/particuliers/vosdroits/F33948",  # Scolarisation
                "/particuliers/vosdroits/N19811",  # Handicap enfant
                "/associations/",  # Guides associations
            ],
            "content_types": [
                "Fiches pratiques AEEH/PCH",
                "Guides démarches administratives",
                "FAQ scolarisation handicap",
                "Simulateurs et outils"
            ],
            "estimated_documents": 150,
            "robots_txt_status": "MODÉRÉMENT PERMISSIF"
        },

        "handicap.gouv.fr": {
            "priority": 1,
            "legal_risk": "TRÈS FAIBLE",
            "rate_limit": 3,
            "target_paths": [
                "/droits-et-aides/",
                "/scolarite-et-handicap/",
                "/emploi-et-handicap/",
                "/actualites/",
                "/dossiers/"
            ],
            "content_types": [
                "Guides droits actualisés",
                "Politiques publiques handicap",
                "Actualités réglementaires",
                "Dossiers thématiques"
            ],
            "estimated_documents": 100,
            "robots_txt_status": "PERMISSIF"
        }
    }

    # Phase 2: Upload manuel (0 risque juridique)
    MANUAL_INGESTION = {
        "priority_documents": [
            "Guides MDPH départementaux",
            "Formulaires Cerfa actualisés",
            "Guides associatifs (UNAPEI, APF, FNASEPH)",
            "Circulaires DGCS importantes",
            "Barèmes et tarifs 2024-2025"
        ],
        "upload_directory": "data/manual_uploads/",
        "supported_formats": [".pdf", ".doc", ".docx", ".txt", ".html"],
        "max_file_size": "50MB",
        "processing": {
            "auto_metadata_extraction": True,
            "duplicate_detection": True,
            "content_validation": True
        },
        "estimated_documents": 200
    }

    # Sources complémentaires (faible priorité)
    SUPPLEMENTARY_SOURCES = {
        "caf.fr": {
            "priority": 3,
            "approach": "HTML pages only (no documents)",
            "target_paths": ["/particuliers/aides-et-demarches/enfance-et-jeunesse/"],
            "content_types": ["Infos AEEH", "Démarches CAF"],
            "legal_risk": "FAIBLE"
        },
        "education.gouv.fr": {
            "priority": 3,
            "target_paths": ["/ecole-inclusive/"],
            "content_types": ["Scolarisation inclusive", "AESH"],
            "legal_risk": "FAIBLE"
        }
    }

    # Configuration technique
    TECHNICAL_CONFIG = {
        "scraping": {
            "user_agent": "PhoenixCare-Bot/1.0 (+https://phoenixcare.fr/robot)",
            "respect_robots_txt": True,
            "default_delay": 3,  # secondes
            "timeout": 30,
            "retry_attempts": 3,
            "concurrent_limit": 1  # 1 seule requête simultanée
        },
        "processing": {
            "chunk_size": 1000,  # caractères par chunk
            "overlap": 200,  # caractères de chevauchement
            "language": "fr",
            "extract_metadata": True
        },
        "storage": {
            "vector_dimension": 1024,
            "similarity_threshold": 0.7,
            "max_results": 10
        },
        "monitoring": {
            "log_all_requests": True,
            "compliance_tracking": True,
            "performance_metrics": True,
            "legal_audit_trail": True
        }
    }

def get_production_config() -> Dict[str, Any]:
    """
    Configuration de production optimisée
    """
    config = IngestionConfig()

    return {
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "legal_compliance": {
            "robots_txt_respect": True,
            "rate_limiting_enabled": True,
            "audit_logging": True,
            "gdpr_compliant": True
        },
        "sources": {
            "immediate": config.IMMEDIATE_SOURCES,
            "manual": config.MANUAL_INGESTION,
            "supplementary": config.SUPPLEMENTARY_SOURCES
        },
        "technical": config.TECHNICAL_CONFIG,
        "estimated_total_documents": 650,
        "estimated_processing_time": "2-3 semaines",
        "legal_risk_assessment": "TRÈS FAIBLE",
        "business_justification": "Intérêt public - Aide aux familles handicap"
    }

def get_startup_sequence() -> List[Dict[str, Any]]:
    """
    Séquence optimale de démarrage de l'ingestion
    """
    return [
        {
            "step": 1,
            "name": "Setup infrastructure",
            "actions": [
                "Initialiser les services RAG",
                "Configurer le monitoring",
                "Valider la conformité légale"
            ],
            "duration": "1 jour"
        },
        {
            "step": 2,
            "name": "Manual ingestion",
            "actions": [
                "Upload documents MDPH existants",
                "Traiter guides associatifs",
                "Ingérer formulaires Cerfa"
            ],
            "duration": "3-5 jours",
            "priority": "HIGH"
        },
        {
            "step": 3,
            "name": "Légifrance scraping",
            "actions": [
                "Code action sociale complet",
                "Décrets handicap 2023-2024",
                "Jurisprudence AEEH/PCH"
            ],
            "duration": "1 semaine",
            "legal_risk": "TRÈS FAIBLE"
        },
        {
            "step": 4,
            "name": "Service-public scraping",
            "actions": [
                "Fiches pratiques handicap",
                "Guides démarches",
                "FAQ scolarisation"
            ],
            "duration": "3-4 jours",
            "legal_risk": "TRÈS FAIBLE"
        },
        {
            "step": 5,
            "name": "Handicap.gouv scraping",
            "actions": [
                "Actualités réglementaires",
                "Dossiers thématiques",
                "Guides spécialisés"
            ],
            "duration": "2-3 jours",
            "legal_risk": "TRÈS FAIBLE"
        },
        {
            "step": 6,
            "name": "Vectorization & optimization",
            "actions": [
                "Vectoriser tous les documents",
                "Optimiser la recherche",
                "Tests de performance"
            ],
            "duration": "2-3 jours"
        },
        {
            "step": 7,
            "name": "Production deployment",
            "actions": [
                "Déploiement API conversationnelle",
                "Monitoring en continu",
                "Feedback utilisateurs"
            ],
            "duration": "1 jour"
        }
    ]

# Export de la configuration
PHOENIX_INGESTION_CONFIG = get_production_config()

if __name__ == "__main__":
    config = get_production_config()
    sequence = get_startup_sequence()

    print("🚀 CONFIGURATION FINALE PHOENIXCARE")
    print("=" * 50)

    print(f"\n📊 RÉSUMÉ:")
    print(f"- Documents estimés: {config['estimated_total_documents']}")
    print(f"- Durée traitement: {config['estimated_processing_time']}")
    print(f"- Risque juridique: {config['legal_risk_assessment']}")

    print(f"\n🎯 SOURCES PRINCIPALES:")
    for source, details in config['sources']['immediate'].items():
        print(f"- {source}: {details['estimated_documents']} docs ({details['legal_risk']})")

    print(f"\n📋 SÉQUENCE DE DÉMARRAGE:")
    total_duration = 0
    for step in sequence:
        print(f"Étape {step['step']}: {step['name']} ({step['duration']})")

    print(f"\n✅ Configuration prête pour déploiement!")