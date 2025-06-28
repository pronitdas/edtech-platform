from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from typing import Optional, AsyncGenerator
import json
import time
import uuid
import os
import aiohttp
import redis.asyncio as redis
from datetime import datetime, timedelta

from src.models.v2_models import LLMRequest, LLMResponse
from routes.auth import get_current_user
from database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v2/llm", tags=["llm-v2"])

# Redis for caching and rate limiting
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

# LLM Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
ANTHROPIC_BASE_URL = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com/v1")

# Rate limiting: 100 requests per hour per user
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))  # 1 hour

class RateLimiter:
    """Redis-based rate limiter"""
    
    @staticmethod
    async def check_rate_limit(user_id: int) -> tuple[bool, int]:
        """Check if user is within rate limits"""
        key = f"rate_limit:llm:{user_id}"
        current = await redis_client.get(key)
        
        if current is None:
            await redis_client.setex(key, RATE_LIMIT_WINDOW, 1)
            return True, RATE_LIMIT_REQUESTS - 1
        
        current_count = int(current)
        if current_count >= RATE_LIMIT_REQUESTS:
            ttl = await redis_client.ttl(key)
            return False, ttl
        
        await redis_client.incr(key)
        return True, RATE_LIMIT_REQUESTS - current_count - 1

class LLMCache:
    """Cache for LLM responses"""
    
    @staticmethod
    def _make_cache_key(request: LLMRequest, user_id: int) -> str:
        """Generate cache key from request"""
        import hashlib
        content = json.dumps({
            "messages": request.messages,
            "model": request.model,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "user_id": user_id
        }, sort_keys=True)
        return f"llm_cache:{hashlib.sha256(content.encode()).hexdigest()}"
    
    @staticmethod
    async def get(request: LLMRequest, user_id: int) -> Optional[dict]:
        """Get cached response"""
        if request.stream:  # Don't cache streaming responses
            return None
            
        key = LLMCache._make_cache_key(request, user_id)
        cached = await redis_client.get(key)
        if cached:
            return json.loads(cached)
        return None
    
    @staticmethod
    async def set(request: LLMRequest, user_id: int, response: dict, ttl: int = 3600):
        """Cache response"""
        if request.stream:  # Don't cache streaming responses
            return
            
        key = LLMCache._make_cache_key(request, user_id)
        await redis_client.setex(key, ttl, json.dumps(response))

class OpenAIProvider:
    """OpenAI API provider"""
    
    @staticmethod
    async def complete(request: LLMRequest) -> dict:
        """Complete using OpenAI API"""
        if not OPENAI_API_KEY:
            raise HTTPException(status_code=503, detail="OpenAI API not configured")
        
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": request.model,
            "messages": request.messages,
            "temperature": request.temperature,
            "stream": request.stream
        }
        
        if request.max_tokens:
            payload["max_tokens"] = request.max_tokens
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{OPENAI_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=120)
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"OpenAI API error: {error_text}"
                    )
                
                if request.stream:
                    return response
                else:
                    return await response.json()
    
    @staticmethod
    async def stream_complete(request: LLMRequest) -> AsyncGenerator[str, None]:
        """Stream completion from OpenAI"""
        response = await OpenAIProvider.complete(request)
        
        async for line in response.content:
            line = line.decode('utf-8').strip()
            if line.startswith('data: '):
                data = line[6:]
                if data == '[DONE]':
                    break
                try:
                    json_data = json.loads(data)
                    yield f"data: {json.dumps(json_data)}\n\n"
                except json.JSONDecodeError:
                    continue

class AnthropicProvider:
    """Anthropic API provider"""
    
    @staticmethod
    async def complete(request: LLMRequest) -> dict:
        """Complete using Anthropic API"""
        if not ANTHROPIC_API_KEY:
            raise HTTPException(status_code=503, detail="Anthropic API not configured")
        
        # Convert OpenAI format to Anthropic format
        messages = []
        system_message = ""
        
        for msg in request.messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        headers = {
            "x-api-key": ANTHROPIC_API_KEY,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": request.model.replace("gpt-", "claude-"),  # Map models
            "messages": messages,
            "max_tokens": request.max_tokens or 4096,
            "temperature": request.temperature,
            "stream": request.stream
        }
        
        if system_message:
            payload["system"] = system_message
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{ANTHROPIC_BASE_URL}/messages",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=120)
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"Anthropic API error: {error_text}"
                    )
                
                if request.stream:
                    return response
                else:
                    result = await response.json()
                    # Convert Anthropic format back to OpenAI format
                    return {
                        "id": result.get("id", str(uuid.uuid4())),
                        "choices": [{
                            "message": {
                                "role": "assistant",
                                "content": result["content"][0]["text"]
                            },
                            "finish_reason": result.get("stop_reason", "stop"),
                            "index": 0
                        }],
                        "usage": {
                            "prompt_tokens": result["usage"]["input_tokens"],
                            "completion_tokens": result["usage"]["output_tokens"],
                            "total_tokens": result["usage"]["input_tokens"] + result["usage"]["output_tokens"]
                        },
                        "model": request.model,
                        "created": int(time.time())
                    }

def get_provider(model: str):
    """Get appropriate provider for model"""
    if model.startswith("claude-") or "anthropic" in model.lower():
        return AnthropicProvider
    else:
        return OpenAIProvider

@router.post("/completions", response_model=LLMResponse)
async def create_completion(
    request: LLMRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create LLM completion with caching and rate limiting"""
    
    # Check rate limit
    allowed, remaining = await RateLimiter.check_rate_limit(user_id)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in {remaining} seconds"
        )
    
    # Check cache
    cached_response = await LLMCache.get(request, user_id)
    if cached_response:
        return LLMResponse(**cached_response)
    
    # Handle streaming
    if request.stream:
        provider = get_provider(request.model)
        
        async def stream_generator():
            yield "data: {\"type\": \"start\"}\n\n"
            
            if provider == OpenAIProvider:
                async for chunk in OpenAIProvider.stream_complete(request):
                    yield chunk
            else:
                # Handle Anthropic streaming
                response = await provider.complete(request)
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    if line.startswith('data: '):
                        yield line + '\n\n'
            
            yield "data: [DONE]\n\n"
        
        return StreamingResponse(
            stream_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Rate-Limit-Remaining": str(remaining)
            }
        )
    
    # Non-streaming completion
    provider = get_provider(request.model)
    response = await provider.complete(request)
    
    # Cache response
    await LLMCache.set(request, user_id, response)
    
    # Log usage
    await log_llm_usage(user_id, request.model, response.get("usage", {}))
    
    return LLMResponse(**response)

@router.get("/models")
async def list_models(user_id: int = Depends(get_current_user)):
    """List available models"""
    models = [
        {"id": "gpt-4", "provider": "openai", "available": bool(OPENAI_API_KEY)},
        {"id": "gpt-4-turbo", "provider": "openai", "available": bool(OPENAI_API_KEY)},
        {"id": "gpt-3.5-turbo", "provider": "openai", "available": bool(OPENAI_API_KEY)},
        {"id": "claude-3-opus", "provider": "anthropic", "available": bool(ANTHROPIC_API_KEY)},
        {"id": "claude-3-sonnet", "provider": "anthropic", "available": bool(ANTHROPIC_API_KEY)},
        {"id": "claude-3-haiku", "provider": "anthropic", "available": bool(ANTHROPIC_API_KEY)}
    ]
    
    return {"models": models}

@router.get("/usage/{user_id}")
async def get_usage_stats(
    user_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's LLM usage statistics"""
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get usage from cache/database
    usage_key = f"llm_usage:{user_id}"
    cached_usage = await redis_client.get(usage_key)
    
    if cached_usage:
        return json.loads(cached_usage)
    
    # Calculate usage from database logs
    from models import LLMUsageLog
    logs = db.query(LLMUsageLog).filter(
        LLMUsageLog.user_id == user_id,
        LLMUsageLog.created_at >= datetime.utcnow() - timedelta(days=30)
    ).all()
    
    usage_stats = {
        "total_requests": len(logs),
        "total_tokens": sum(log.total_tokens for log in logs),
        "total_cost": sum(log.cost for log in logs),
        "models_used": list(set(log.model for log in logs))
    }
    
    # Cache for 1 hour
    await redis_client.setex(usage_key, 3600, json.dumps(usage_stats))
    
    return usage_stats

async def log_llm_usage(user_id: int, model: str, usage: dict):
    """Log LLM usage for analytics and billing"""
    try:
        from models import LLMUsageLog
        from database import get_db
        
        # Calculate cost (simplified pricing)
        cost_per_token = {
            "gpt-4": 0.00003,
            "gpt-4-turbo": 0.00001,
            "gpt-3.5-turbo": 0.000002,
            "claude-3-opus": 0.000015,
            "claude-3-sonnet": 0.000003,
            "claude-3-haiku": 0.00000025
        }
        
        total_tokens = usage.get("total_tokens", 0)
        cost = total_tokens * cost_per_token.get(model, 0.00001)
        
        # Store in database (async)
        usage_log = LLMUsageLog(
            user_id=user_id,
            model=model,
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=total_tokens,
            cost=cost,
            created_at=datetime.utcnow()
        )
        
        # This would need proper async database session
        # For now, store in Redis for batch processing
        await redis_client.lpush(
            "llm_usage_queue",
            json.dumps({
                "user_id": user_id,
                "model": model,
                "usage": usage,
                "cost": cost,
                "timestamp": datetime.utcnow().isoformat()
            })
        )
        
    except Exception as e:
        # Don't fail the request if logging fails
        print(f"Failed to log LLM usage: {e}")