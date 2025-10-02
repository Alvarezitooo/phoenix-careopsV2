"""
💾 Système de cache asynchrone (Redis-ready)
"""
import hashlib
from datetime import datetime, timedelta
from collections import OrderedDict
from typing import Optional, Dict, Any


class AsyncCache:
    """Cache in-memory async-compatible (migration Redis facile)"""

    def __init__(self, ttl_hours: int = 24, max_size: int = 1000):
        self.cache: OrderedDict = OrderedDict()
        self.ttl = timedelta(hours=ttl_hours)
        self.max_size = max_size
        self.hits = 0
        self.misses = 0

    def _normalize_query(self, query: str) -> str:
        """Normalise la requête pour améliorer le cache hit"""
        return query.lower().strip()

    def _get_hash(self, query: str) -> str:
        """Hash SHA256 de la requête"""
        normalized = self._normalize_query(query)
        return hashlib.sha256(normalized.encode()).hexdigest()

    async def get(self, query: str) -> Optional[Dict[str, Any]]:
        """Récupère depuis le cache si valide (async pour compatibilité Redis)"""
        cache_key = self._get_hash(query)

        if cache_key in self.cache:
            entry = self.cache[cache_key]
            if datetime.now() < entry['expires_at']:
                self.hits += 1
                self.cache.move_to_end(cache_key)  # LRU
                print(f"✅ Cache HIT ({self.hits} hits, {self.misses} misses)")
                return entry['data']
            else:
                del self.cache[cache_key]

        self.misses += 1
        print(f"❌ Cache MISS ({self.hits} hits, {self.misses} misses)")
        return None

    async def set(self, query: str, data: Dict[str, Any]) -> None:
        """Stocke dans le cache avec TTL (async pour compatibilité Redis)"""
        cache_key = self._get_hash(query)

        # Cleanup si trop grand (LRU)
        if len(self.cache) >= self.max_size:
            self.cache.popitem(last=False)  # Remove oldest

        self.cache[cache_key] = {
            'data': data,
            'expires_at': datetime.now() + self.ttl,
            'created_at': datetime.now()
        }

    async def clear(self) -> None:
        """Vide le cache"""
        self.cache.clear()
        self.hits = 0
        self.misses = 0

    async def get_stats(self) -> Dict[str, Any]:
        """Statistiques du cache"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0

        return {
            "hits": self.hits,
            "misses": self.misses,
            "size": len(self.cache),
            "hit_rate": round(hit_rate, 2)
        }


# Instance globale
cache = AsyncCache()
