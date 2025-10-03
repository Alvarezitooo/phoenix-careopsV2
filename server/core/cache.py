"""
💾 Système de cache Redis asynchrone
Fallback vers in-memory si Redis non disponible
"""
import hashlib
import json
from datetime import datetime, timedelta
from collections import OrderedDict
from typing import Optional, Dict, Any
import redis.asyncio as redis
from config.settings import settings


class RedisCache:
    """Cache Redis async avec fallback in-memory"""

    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.use_redis = False
        self.ttl_seconds = settings.cache_ttl_hours * 3600

        # Fallback in-memory
        self.memory_cache: OrderedDict = OrderedDict()
        self.max_size = settings.cache_max_size

        # Stats
        self.hits = 0
        self.misses = 0

    async def connect(self):
        """Connexion à Redis (appelé au startup de l'app)"""
        if not settings.redis_url:
            print("⚠️  REDIS_URL non configuré - utilisation du cache in-memory")
            return

        try:
            self.redis_client = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
            )
            # Test connexion
            await self.redis_client.ping()
            self.use_redis = True
            print(f"✅ Redis connecté: {settings.redis_url[:20]}...")
        except Exception as e:
            print(f"⚠️  Redis connexion échouée: {e}")
            print("→ Fallback vers cache in-memory")
            self.redis_client = None
            self.use_redis = False

    async def disconnect(self):
        """Ferme la connexion Redis"""
        if self.redis_client:
            await self.redis_client.close()

    def _normalize_query(self, query: str) -> str:
        """Normalise la requête pour améliorer le cache hit"""
        return query.lower().strip()

    def _get_hash(self, query: str) -> str:
        """Hash SHA256 de la requête"""
        normalized = self._normalize_query(query)
        return f"cache:{hashlib.sha256(normalized.encode()).hexdigest()}"

    async def get(self, query: str) -> Optional[Dict[str, Any]]:
        """Récupère depuis le cache"""
        cache_key = self._get_hash(query)

        # Redis mode
        if self.use_redis and self.redis_client:
            try:
                cached = await self.redis_client.get(cache_key)
                if cached:
                    self.hits += 1
                    print(f"⚡ Redis HIT ({self.hits} hits, {self.misses} misses)")
                    return json.loads(cached)
                else:
                    self.misses += 1
                    print(f"❌ Redis MISS ({self.hits} hits, {self.misses} misses)")
                    return None
            except Exception as e:
                print(f"⚠️  Redis GET error: {e} - fallback in-memory")
                # Fallback to memory on error
                self.use_redis = False

        # In-memory fallback
        if cache_key in self.memory_cache:
            entry = self.memory_cache[cache_key]
            if datetime.now() < entry['expires_at']:
                self.hits += 1
                self.memory_cache.move_to_end(cache_key)  # LRU
                print(f"✅ Memory Cache HIT ({self.hits} hits, {self.misses} misses)")
                return entry['data']
            else:
                del self.memory_cache[cache_key]

        self.misses += 1
        print(f"❌ Memory Cache MISS ({self.hits} hits, {self.misses} misses)")
        return None

    async def set(self, query: str, data: Dict[str, Any]) -> None:
        """Stocke dans le cache avec TTL"""
        cache_key = self._get_hash(query)

        # Redis mode
        if self.use_redis and self.redis_client:
            try:
                await self.redis_client.setex(
                    cache_key,
                    self.ttl_seconds,
                    json.dumps(data, ensure_ascii=False)
                )
                print(f"💾 Stored in Redis (TTL: {settings.cache_ttl_hours}h)")
                return
            except Exception as e:
                print(f"⚠️  Redis SET error: {e} - fallback in-memory")
                self.use_redis = False

        # In-memory fallback
        if len(self.memory_cache) >= self.max_size:
            self.memory_cache.popitem(last=False)  # Remove oldest

        self.memory_cache[cache_key] = {
            'data': data,
            'expires_at': datetime.now() + timedelta(hours=settings.cache_ttl_hours),
            'created_at': datetime.now()
        }
        print(f"💾 Stored in memory (TTL: {settings.cache_ttl_hours}h)")

    async def clear(self) -> None:
        """Vide le cache"""
        if self.use_redis and self.redis_client:
            try:
                # Clear all cache keys
                async for key in self.redis_client.scan_iter("cache:*"):
                    await self.redis_client.delete(key)
                print("🗑️  Redis cache cleared")
            except Exception as e:
                print(f"⚠️  Redis CLEAR error: {e}")

        # Clear memory cache
        self.memory_cache.clear()
        self.hits = 0
        self.misses = 0
        print("🗑️  Memory cache cleared")

    async def get_stats(self) -> Dict[str, Any]:
        """Statistiques du cache"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0

        stats = {
            "backend": "redis" if self.use_redis else "memory",
            "connected": self.use_redis,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": round(hit_rate, 2)
        }

        if self.use_redis and self.redis_client:
            try:
                info = await self.redis_client.info("stats")
                stats["redis_keys"] = await self.redis_client.dbsize()
                stats["redis_memory"] = info.get("used_memory_human", "N/A")
            except:
                pass
        else:
            stats["size"] = len(self.memory_cache)

        return stats


# Instance globale
cache = RedisCache()
