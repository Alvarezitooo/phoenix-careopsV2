"""
Stratégie de scraping sélectif pour PhoenixCare
Approche graduée basée sur l'analyse robots.txt
"""

from typing import Dict, List, Any, Tuple
import logging
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class ScrapingPermissionLevel(Enum):
    VERY_PERMISSIVE = "very_permissive"
    MODERATELY_PERMISSIVE = "moderately_permissive"
    RESTRICTIVE = "restrictive"
    FORBIDDEN = "forbidden"

@dataclass
class GovernmentSite:
    domain: str
    name: str
    permission_level: ScrapingPermissionLevel
    allowed_paths: List[str]
    forbidden_paths: List[str]
    content_types: List[str]
    priority: int  # 1=high, 5=low
    legal_notes: str
    contact_email: str = ""

class SelectiveScrapingStrategy:
    """
    Gestionnaire de stratégie de scraping sélectif
    """

    def __init__(self):
        self.government_sites = self._initialize_site_configs()

    def _initialize_site_configs(self) -> Dict[str, GovernmentSite]:
        """
        Configuration des sites gouvernementaux par niveau de permission
        """
        return {
            "legifrance.gouv.fr": GovernmentSite(
                domain="legifrance.gouv.fr",
                name="Légifrance",
                permission_level=ScrapingPermissionLevel.VERY_PERMISSIVE,
                allowed_paths=[
                    "/codes/texte_lc/LEGITEXT000006074069",  # Code action sociale
                    "/codes/article_lc/",  # Articles codes
                    "/jorf/",  # Journal officiel
                    "/eli/",  # Identifiants européens
                ],
                forbidden_paths=["/download/"],
                content_types=["Code CASF", "Jurisprudence", "Décrets", "Arrêtés"],
                priority=1,
                legal_notes="Très permissif - seul /download/ interdit. Données juridiques publiques.",
                contact_email="contact@legifrance.gouv.fr"
            ),

            "service-public.fr": GovernmentSite(
                domain="service-public.fr",
                name="Service Public",
                permission_level=ScrapingPermissionLevel.MODERATELY_PERMISSIVE,
                allowed_paths=[
                    "/particuliers/vosdroits/",  # Fiches droits
                    "/associations/",  # Guides associations
                    "/professionnels/",  # Info pros
                ],
                forbidden_paths=[
                    "/compte/", "/contact/", "/recherche/",
                    "/*?xtor=",  # Tracking URLs
                ],
                content_types=["Fiches pratiques", "Guides démarches", "FAQ"],
                priority=2,
                legal_notes="Modérément permissif - éviter admin/tracking. Fiches publiques OK.",
                contact_email="contact@service-public.fr"
            ),

            "handicap.gouv.fr": GovernmentSite(
                domain="handicap.gouv.fr",
                name="Secrétariat Handicap",
                permission_level=ScrapingPermissionLevel.MODERATELY_PERMISSIVE,
                allowed_paths=[
                    "/actualites/",
                    "/droits-et-aides/",
                    "/scolarite-et-handicap/",
                    "/emploi-et-handicap/"
                ],
                forbidden_paths=["/admin/", "/user/"],
                content_types=["Actualités", "Guides droits", "Scolarité", "Emploi"],
                priority=1,
                legal_notes="Site spécialisé handicap - contenu très pertinent. Pas de robots.txt strict.",
                contact_email="contact@handicap.gouv.fr"
            ),


            "caf.fr": GovernmentSite(
                domain="caf.fr",
                name="CAF",
                permission_level=ScrapingPermissionLevel.RESTRICTIVE,
                allowed_paths=["/particuliers/aides-et-demarches/"],
                forbidden_paths=["/mon-compte/", "/simulateur/"],
                content_types=["Aides familiales", "AEEH"],
                priority=3,
                legal_notes="Restrictif - éviter simulateurs/comptes. Infos aides OK.",
                contact_email="contact@caf.fr"
            )
        }

    def get_scraping_strategy(self) -> Dict[str, Any]:
        """
        Retourne la stratégie de scraping recommandée
        """
        strategy = {
            "phase_1_immediate": {
                "manual_ingestion": {
                    "priority": "HIGH",
                    "sources": [
                        "PDFs MDPH locaux",
                        "Guides associations (UNAPEI, APF, etc.)",
                        "Formulaires téléchargés manuellement",
                        "Documentation administrative existante"
                    ],
                    "estimated_documents": "50-100",
                    "timeline": "1-2 semaines"
                },
                "permissive_scraping": {
                    "sites": ["legifrance.gouv.fr", "service-public.fr", "handicap.gouv.fr"],
                    "estimated_pages": "500-1000",
                    "timeline": "2-3 semaines",
                    "legal_risk": "TRÈS FAIBLE"
                }
            },

            "phase_2_selective": {
                "moderate_sites": {
                    "sites": ["caf.fr"],
                    "approach": "Contenu HTML uniquement, pas de docs",
                    "timeline": "1 semaine",
                    "legal_risk": "FAIBLE"
                }
            },

            "phase_3_expansion": {
                "additional_sources": {
                    "approach": "Upload manuel documents spécialisés",
                    "sources": ["Associations partenaires", "MDPH départementales", "Guides terrain"],
                    "timeline": "Continu",
                    "legal_risk": "NUL"
                }
            }
        }
        return strategy

    def get_immediate_scraping_list(self) -> List[GovernmentSite]:
        """
        Sites à scraper immédiatement (faible risque)
        """
        safe_sites = []

        for site in self.government_sites.values():
            if site.permission_level in [
                ScrapingPermissionLevel.VERY_PERMISSIVE,
                ScrapingPermissionLevel.MODERATELY_PERMISSIVE
            ] and site.priority <= 2:
                safe_sites.append(site)

        # Tri par priorité
        safe_sites.sort(key=lambda x: x.priority)
        return safe_sites

    def get_contact_list_for_authorization(self) -> List[Dict[str, str]]:
        """
        Liste des contacts pour demandes d'autorisation
        """
        contact_list = []

        restrictive_sites = [
            site for site in self.government_sites.values()
            if site.permission_level == ScrapingPermissionLevel.RESTRICTIVE
        ]

        for site in restrictive_sites:
            contact_list.append({
                "domain": site.domain,
                "name": site.name,
                "email": site.contact_email,
                "priority_content": ", ".join(site.content_types),
                "email_template": self._generate_email_template(site)
            })

        return contact_list

    def _generate_email_template(self, site: GovernmentSite) -> str:
        """
        Génère un template d'email de demande d'autorisation
        """
        return f"""
Objet : Demande d'autorisation - Indexation données publiques - Projet PhoenixCare

Madame, Monsieur,

PhoenixCare développe une assistance IA gratuite et open-source destinée à
accompagner les familles d'enfants en situation de handicap dans leurs
démarches administratives complexes.

Nous sollicitons votre autorisation pour indexer automatiquement les contenus
publics de {site.name} ({site.domain}), spécifiquement :
{chr(10).join(f"- {content}" for content in site.content_types)}

Notre approche technique respecte :
- Rate limiting (1 requête/3 secondes)
- Robots.txt et CGU
- Pas de données personnelles
- Usage exclusivement social/éducatif

Objectif : Permettre aux familles d'accéder rapidement aux bonnes informations
juridiques via IA conversationnelle, réduisant ainsi les délais et erreurs
dans les démarches.

Seriez-vous disponible pour un échange téléphonique afin de présenter le projet ?

Cordialement,
[Nom]
PhoenixCare - Assistance IA pour l'inclusion
[Email] - [Téléphone]
        """

    def generate_scraping_config(self) -> Dict[str, Any]:
        """
        Génère la configuration technique pour le scraping sélectif
        """
        immediate_sites = self.get_immediate_scraping_list()

        config = {
            "immediate_scraping": {
                "enabled_domains": [site.domain for site in immediate_sites],
                "rate_limits": {
                    site.domain: {
                        "requests_per_second": 0.33,  # 1 req/3s
                        "concurrent_requests": 1,
                        "respect_robots_txt": True
                    } for site in immediate_sites
                },
                "allowed_paths": {
                    site.domain: site.allowed_paths for site in immediate_sites
                },
                "forbidden_paths": {
                    site.domain: site.forbidden_paths for site in immediate_sites
                }
            },
            "manual_ingestion": {
                "upload_directory": "data/manual_uploads/",
                "supported_formats": [".pdf", ".doc", ".docx", ".txt"],
                "max_file_size": "50MB",
                "batch_processing": True
            },
            "monitoring": {
                "compliance_logging": True,
                "performance_tracking": True,
                "legal_audit_trail": True
            }
        }

        return config

# Instance globale pour utilisation
scraping_strategy = SelectiveScrapingStrategy()

# Exemple d'utilisation
if __name__ == "__main__":
    strategy = scraping_strategy.get_scraping_strategy()
    print("=== STRATÉGIE DE SCRAPING SÉLECTIF ===")

    print("\n🟢 Phase 1 - Immédiat (Faible risque):")
    immediate_sites = scraping_strategy.get_immediate_scraping_list()
    for site in immediate_sites:
        print(f"- {site.name} ({site.domain}) - {site.permission_level.value}")

    print("\n📧 Sites nécessitant autorisation:")
    contacts = scraping_strategy.get_contact_list_for_authorization()
    for contact in contacts:
        print(f"- {contact['name']} : {contact['email']}")

    print("\n⚙️ Configuration technique générée ✓")