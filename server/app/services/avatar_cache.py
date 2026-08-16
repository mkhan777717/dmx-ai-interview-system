"""
avatar_cache.py — Redis-backed cache for avatar TTS+viseme payloads
Key:   avatar:{sha256(normalized_text)}
TTL:   7 days (604800 seconds)
Fallback: in-memory dict if Redis is unavailable at startup.
"""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any

log = logging.getLogger("avatar_cache")

_redis_client: "redis.asyncio.Redis | None" = None   # type: ignore[name-defined]
_memory_cache: dict[str, dict[str, Any]] = {}
_use_redis = False

CACHE_TTL = 60 * 60 * 24 * 7    # 7 days in seconds
CACHE_PREFIX = "avatar:"


async def init_cache(redis_url: str = "redis://localhost:6379") -> None:
    """Call once at application startup.  Silently falls back to memory on error."""
    global _redis_client, _use_redis
    try:
        import redis.asyncio as aioredis
        client = aioredis.from_url(redis_url, decode_responses=False, socket_connect_timeout=2)
        await client.ping()
        _redis_client = client
        _use_redis = True
        log.info("Avatar cache: connected to Redis at %s", redis_url)
    except Exception as exc:
        log.warning("Avatar cache: Redis unavailable (%s) — using in-memory fallback", exc)
        _use_redis = False


def _make_key(text: str) -> str:
    digest = hashlib.sha256(text.strip().lower().encode()).hexdigest()
    return f"{CACHE_PREFIX}{digest}"


async def cache_get(text: str) -> dict[str, Any] | None:
    """Return cached payload dict or None on miss."""
    key = _make_key(text)
    if _use_redis and _redis_client:
        try:
            raw = await _redis_client.get(key)
            if raw:
                return json.loads(raw)
        except Exception as exc:
            log.debug("Redis GET error: %s", exc)
    else:
        return _memory_cache.get(key)
    return None


async def cache_set(text: str, payload: dict[str, Any]) -> None:
    """Store payload in cache (Redis with TTL, or memory)."""
    key = _make_key(text)
    if _use_redis and _redis_client:
        try:
            await _redis_client.setex(key, CACHE_TTL, json.dumps(payload))
        except Exception as exc:
            log.debug("Redis SET error: %s", exc)
    else:
        # Cap memory cache at 256 entries to avoid unbounded growth
        if len(_memory_cache) >= 256:
            oldest = next(iter(_memory_cache))
            del _memory_cache[oldest]
        _memory_cache[key] = payload
