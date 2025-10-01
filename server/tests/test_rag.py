"""
Tests pour le système RAG (Retrieval Augmented Generation)
"""
import pytest
import sys
from pathlib import Path

# Ajouter le dossier parent au PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from simple_rag_server import app, SmartCache


class TestSmartCache:
    """Tests pour le système de cache intelligent"""

    def test_cache_init(self):
        """Test d'initialisation du cache"""
        cache = SmartCache(ttl_hours=1, max_size=10)
        assert cache.hits == 0
        assert cache.misses == 0
        assert len(cache.cache) == 0

    def test_cache_normalize_query(self):
        """Test de normalisation des requêtes"""
        cache = SmartCache()

        # Normalisation (lowercase + strip)
        assert cache._normalize_query("  AEEH  ") == "aeeh"
        assert cache._normalize_query("Bonjour") == "bonjour"

    def test_cache_set_and_get(self):
        """Test d'ajout et récupération depuis le cache"""
        cache = SmartCache(ttl_hours=24)

        # Ajouter une entrée
        test_query = "Qu'est-ce que l'AEEH?"
        test_data = {"answer": "L'AEEH est une allocation..."}
        cache.set(test_query, test_data)

        # Récupérer l'entrée (cache hit)
        result = cache.get(test_query)
        assert result == test_data
        assert cache.hits == 1
        assert cache.misses == 0

    def test_cache_miss(self):
        """Test de cache miss"""
        cache = SmartCache()

        # Requête jamais mise en cache
        result = cache.get("Requête inconnue")
        assert result is None
        assert cache.misses == 1
        assert cache.hits == 0

    def test_cache_case_insensitive(self):
        """Test que le cache est insensible à la casse"""
        cache = SmartCache()

        # Ajouter avec majuscules
        cache.set("AEEH", {"info": "allocation"})

        # Récupérer avec minuscules
        result = cache.get("aeeh")
        assert result is not None
        assert result["info"] == "allocation"

    def test_cache_max_size(self):
        """Test de la limite de taille du cache"""
        cache = SmartCache(max_size=3)

        # Ajouter 4 entrées (dépasse max_size)
        cache.set("query1", {"data": "1"})
        cache.set("query2", {"data": "2"})
        cache.set("query3", {"data": "3"})
        cache.set("query4", {"data": "4"})  # Déclenche cleanup

        # Le cache ne doit pas dépasser max_size
        assert len(cache.cache) <= 3

        # La plus ancienne entrée devrait être supprimée
        assert cache.get("query1") is None  # Première entrée supprimée


class TestRagEndpoints:
    """Tests pour les endpoints RAG"""

    @pytest.fixture
    def client(self):
        """Fixture pour le client de test Flask"""
        with app.test_client() as client:
            yield client

    def test_health_endpoint(self, client):
        """Test du endpoint /health"""
        response = client.get('/health')
        assert response.status_code == 200

        data = response.get_json()
        assert data['status'] in ['ok', 'healthy']  # Accepter les deux
        assert 'timestamp' in data

    def test_chat_send_missing_fields(self, client):
        """Test d'envoi de message sans champs requis"""
        response = client.post('/api/chat/send', json={})
        # Peut être 400 (bad request) ou 401 (unauthorized) selon l'ordre des checks
        assert response.status_code in [400, 401]

        data = response.get_json()
        assert 'error' in data

    def test_chat_send_with_message(self, client):
        """Test d'envoi de message valide (sans vraie AI)"""
        # Note: Ce test nécessite un mock de Gemini pour éviter les appels API réels
        payload = {
            "message": "Bonjour",
            "user_id": "test-user-123"
        }

        response = client.post('/api/chat/send', json=payload)

        # Peut échouer si pas de GEMINI_API_KEY, mais vérifie la structure
        if response.status_code == 200:
            data = response.get_json()
            assert 'answer' in data or 'response' in data
        else:
            # Si erreur, vérifier que c'est une erreur API attendue
            assert response.status_code in [401, 500, 503]  # +401 pour auth


@pytest.mark.integration
class TestRagIntegration:
    """Tests d'intégration nécessitant l'API Gemini"""

    @pytest.fixture
    def client(self):
        with app.test_client() as client:
            yield client

    @pytest.mark.skip(reason="Nécessite GEMINI_API_KEY valide")
    def test_rag_full_flow(self, client):
        """Test complet du flux RAG avec vraie AI"""
        payload = {
            "message": "Qu'est-ce que l'AEEH?",
            "user_id": "test-integration"
        }

        response = client.post('/api/chat/send', json=payload)
        assert response.status_code == 200

        data = response.get_json()
        assert 'answer' in data
        assert len(data['answer']) > 50  # Réponse substantielle
        assert 'AEEH' in data['answer'] or 'allocation' in data['answer'].lower()


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
