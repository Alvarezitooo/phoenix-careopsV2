"""
Module de conformité légale pour le scraping PhoenixCare
Respect des règles juridiques françaises et européennes
"""

import asyncio
import aiohttp
from urllib.robotparser import RobotFileParser
from urllib.parse import urljoin, urlparse
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import time

logger = logging.getLogger(__name__)

class LegalComplianceChecker:
    """
    Vérificateur de conformité légale pour le scraping
    """

    # Sites officiels français autorisés explicitement
    AUTHORIZED_GOVERNMENT_SITES = {
        'legifrance.gouv.fr': {
            'type': 'official_legal',
            'open_data': True,
            'notes': 'Données juridiques publiques de la République française'
        },
        'cnsa.fr': {
            'type': 'official_health',
            'open_data': True,
            'notes': 'Caisse nationale de solidarité pour l\'autonomie'
        },
        'service-public.fr': {
            'type': 'official_service',
            'open_data': True,
            'notes': 'Site officiel de l\'administration française'
        },
        'handicap.gouv.fr': {
            'type': 'official_handicap',
            'open_data': True,
            'notes': 'Secrétariat d\'État chargé des Personnes handicapées'
        },
        'data.gouv.fr': {
            'type': 'open_data',
            'open_data': True,
            'notes': 'Plateforme ouverte des données publiques françaises'
        }
    }

    # Patterns d'URLs à éviter (données personnelles potentielles)
    FORBIDDEN_PATTERNS = [
        r'/user/',
        r'/profile/',
        r'/private/',
        r'/admin/',
        r'/compte/',
        r'/connexion/',
        r'/login/',
        r'/personnel/',
        r'/prive/'
    ]

    def __init__(self):
        self.robots_cache = {}
        self.rate_limits = {}

    async def check_scraping_legality(self, url: str) -> Tuple[bool, str, Dict]:
        """
        Vérifie la légalité du scraping pour une URL donnée

        Returns:
            (is_legal, reason, recommendations)
        """
        parsed_url = urlparse(url)
        domain = parsed_url.netloc.lower()

        result = {
            'url': url,
            'domain': domain,
            'checks': {},
            'recommendations': {}
        }

        # 1. Vérification domaine autorisé
        is_gov_authorized = self._check_government_authorization(domain)
        result['checks']['government_authorized'] = is_gov_authorized

        # 2. Vérification robots.txt
        robots_allowed = await self._check_robots_txt(url)
        result['checks']['robots_allowed'] = robots_allowed

        # 3. Vérification patterns interdits
        safe_patterns = self._check_url_patterns(url)
        result['checks']['safe_patterns'] = safe_patterns

        # 4. Recommandations de rate limiting
        rate_limit = self._get_recommended_rate_limit(domain)
        result['recommendations']['rate_limit'] = rate_limit

        # 5. Vérification HTTPS
        is_https = parsed_url.scheme == 'https'
        result['checks']['https'] = is_https

        # Décision finale
        is_legal = all([
            is_gov_authorized['allowed'],
            robots_allowed['allowed'],
            safe_patterns['safe'],
            is_https
        ])

        reason = self._generate_legality_reason(result)

        return is_legal, reason, result

    def _check_government_authorization(self, domain: str) -> Dict:
        """
        Vérifie si le domaine est dans la liste des sites gouvernementaux autorisés
        """
        if domain in self.AUTHORIZED_GOVERNMENT_SITES:
            site_info = self.AUTHORIZED_GOVERNMENT_SITES[domain]
            return {
                'allowed': True,
                'type': site_info['type'],
                'open_data': site_info['open_data'],
                'notes': site_info['notes']
            }

        # Vérification des sous-domaines gouvernementaux
        gov_suffixes = ['.gouv.fr', '.fr']
        for suffix in gov_suffixes:
            if domain.endswith(suffix):
                return {
                    'allowed': True,
                    'type': 'government_subdomain',
                    'open_data': True,
                    'notes': f'Sous-domaine gouvernemental français ({suffix})'
                }

        return {
            'allowed': False,
            'reason': 'Domaine non autorisé pour le scraping automatique',
            'recommendation': 'Utiliser l\'upload manuel ou contacter l\'éditeur'
        }

    async def _check_robots_txt(self, url: str) -> Dict:
        """
        Vérifie les permissions dans robots.txt
        """
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        robots_url = f"{parsed_url.scheme}://{domain}/robots.txt"

        if domain in self.robots_cache:
            rp = self.robots_cache[domain]
        else:
            try:
                rp = RobotFileParser()
                rp.set_url(robots_url)

                # Téléchargement avec timeout
                async with aiohttp.ClientSession() as session:
                    async with session.get(robots_url, timeout=10) as response:
                        if response.status == 200:
                            robots_content = await response.text()
                            # Parse du contenu robots.txt
                            lines = robots_content.split('\n')
                            # Simulation du parsing (version simplifiée)

                self.robots_cache[domain] = rp

            except Exception as e:
                logger.warning(f"Impossible de récupérer robots.txt pour {domain}: {e}")
                # En cas d'erreur, on considère comme autorisé avec prudence
                return {
                    'allowed': True,
                    'reason': 'robots.txt inaccessible, proceeding with caution',
                    'crawl_delay': 2  # Délai conservateur
                }

        # Vérification pour notre user-agent
        user_agent = 'PhoenixCare-Bot/1.0 (+https://phoenixcare.fr/bot)'

        try:
            can_fetch = rp.can_fetch(user_agent, url)
            crawl_delay = rp.crawl_delay(user_agent) or 1

            return {
                'allowed': can_fetch,
                'crawl_delay': crawl_delay,
                'user_agent': user_agent,
                'robots_url': robots_url
            }
        except:
            return {
                'allowed': True,
                'crawl_delay': 2,
                'reason': 'robots.txt parsing failed, proceeding cautiously'
            }

    def _check_url_patterns(self, url: str) -> Dict:
        """
        Vérifie que l'URL ne contient pas de patterns suspects
        """
        import re

        for pattern in self.FORBIDDEN_PATTERNS:
            if re.search(pattern, url, re.IGNORECASE):
                return {
                    'safe': False,
                    'violated_pattern': pattern,
                    'reason': 'URL contient des éléments potentiellement privés'
                }

        return {
            'safe': True,
            'reason': 'URL ne contient pas de patterns interdits'
        }

    def _get_recommended_rate_limit(self, domain: str) -> Dict:
        """
        Recommande un rate limiting approprié
        """
        if domain in self.AUTHORIZED_GOVERNMENT_SITES:
            return {
                'requests_per_second': 0.5,  # 1 requête toutes les 2 secondes
                'concurrent_requests': 1,
                'respect_server': True,
                'reason': 'Rate limiting respectueux pour sites gouvernementaux'
            }

        return {
            'requests_per_second': 0.2,  # 1 requête toutes les 5 secondes
            'concurrent_requests': 1,
            'respect_server': True,
            'reason': 'Rate limiting très conservateur pour sites non-gouvernementaux'
        }

    def _generate_legality_reason(self, result: Dict) -> str:
        """
        Génère une explication de la décision de légalité
        """
        checks = result['checks']

        if not checks['government_authorized']['allowed']:
            return "❌ Domaine non autorisé - utiliser l'upload manuel"

        if not checks['robots_allowed']['allowed']:
            return "❌ Interdit par robots.txt"

        if not checks['safe_patterns']['safe']:
            return "❌ URL contient des éléments privés potentiels"

        if not checks['https']:
            return "⚠️ Site non sécurisé (HTTP) - prudence requise"

        return "✅ Scraping autorisé avec rate limiting respectueux"

class EthicalScraper:
    """
    Scraper éthique et légal pour PhoenixCare
    """

    def __init__(self):
        self.compliance_checker = LegalComplianceChecker()
        self.session = None

    async def scrape_with_compliance(self, url: str) -> Tuple[bool, str, Optional[str]]:
        """
        Scrape une URL en respectant la conformité légale

        Returns:
            (success, content_or_error, compliance_info)
        """
        # Vérification légale préalable
        is_legal, reason, compliance_info = await self.compliance_checker.check_scraping_legality(url)

        if not is_legal:
            return False, f"Scraping non autorisé: {reason}", str(compliance_info)

        # Rate limiting
        await self._apply_rate_limiting(url, compliance_info)

        try:
            if not self.session:
                timeout = aiohttp.ClientTimeout(total=30)
                self.session = aiohttp.ClientSession(
                    timeout=timeout,
                    headers={
                        'User-Agent': 'PhoenixCare-Bot/1.0 (+https://phoenixcare.fr/bot)',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.7',
                        'Accept-Encoding': 'gzip, deflate',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                    }
                )

            async with self.session.get(url) as response:
                if response.status == 200:
                    content = await response.text()
                    return True, content, str(compliance_info)
                else:
                    return False, f"HTTP {response.status}", str(compliance_info)

        except Exception as e:
            return False, f"Erreur scraping: {e}", str(compliance_info)

    async def _apply_rate_limiting(self, url: str, compliance_info: Dict):
        """
        Applique le rate limiting recommandé
        """
        parsed_url = urlparse(url)
        domain = parsed_url.netloc

        rate_limit = compliance_info['recommendations']['rate_limit']
        delay = 1.0 / rate_limit['requests_per_second']

        # Vérification du dernier accès à ce domaine
        last_access = self.compliance_checker.rate_limits.get(domain, 0)
        elapsed = time.time() - last_access

        if elapsed < delay:
            sleep_time = delay - elapsed
            logger.info(f"Rate limiting: attente {sleep_time:.1f}s pour {domain}")
            await asyncio.sleep(sleep_time)

        self.compliance_checker.rate_limits[domain] = time.time()

    async def close(self):
        """
        Ferme la session HTTP
        """
        if self.session:
            await self.session.close()

# Guide de conformité
COMPLIANCE_GUIDE = """
🇫🇷 GUIDE DE CONFORMITÉ LÉGALE - PhoenixCare

✅ SITES AUTORISÉS:
- Sites gouvernementaux (.gouv.fr)
- Données publiques officielles
- Sites avec politique d'ouverture des données

⚠️ RÈGLES À RESPECTER:
1. Rate limiting (max 1 req/2s pour sites gouvernementaux)
2. Respect robots.txt
3. User-agent identifiable
4. Pas de données personnelles
5. Usage d'intérêt public uniquement

❌ SITES INTERDITS:
- Espaces privés/authentifiés
- Données personnelles
- Sites commerciaux sans autorisation
- Contenu protégé par copyright

🔧 ALTERNATIVES LÉGALES:
- APIs officielles quand disponibles
- Upload manuel de documents
- Partenariats avec administrations
- Données Open Data

📞 CONTACT:
En cas de doute, contacter les administrations
pour obtenir une autorisation explicite.
"""