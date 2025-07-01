import json
import functools
from typing import Callable, Any

from config import redis_client, logger

def cached(ttl: int = 300) -> Callable[..., Callable[..., Any]]:
    """
    Decorator to cache function results in Redis.

    Args:
        ttl (int): Time-to-live for the cache in seconds. Defaults to 300 (5 minutes).
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Generate a cache key based on function name and arguments
            cache_key_parts = [func.__name__]
            for arg in args:
                cache_key_parts.append(str(arg))
            for k, v in sorted(kwargs.items()):
                cache_key_parts.append(f"{k}={v}")
            cache_key = ":".join(cache_key_parts)

            # Try to get data from cache
            try:
                cached_data = await redis_client.get(cache_key)
                if cached_data:
                    logger.info(f"Cache hit for key: {cache_key}")
                    return json.loads(cached_data)
            except Exception as e:
                logger.warning(f"Error accessing Redis cache: {e}")

            # If not in cache, call the original function
            result = await func(*args, **kwargs)

            # Cache the result
            try:
                await redis_client.setex(cache_key, ttl, json.dumps(result))
                logger.info(f"Cache set for key: {cache_key}")
            except Exception as e:
                logger.warning(f"Error setting Redis cache: {e}")

            return result
        return wrapper
    return decorator
