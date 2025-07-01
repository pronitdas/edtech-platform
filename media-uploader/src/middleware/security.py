from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import time
import redis.asyncio as redis
import os
import json
from typing import Dict, Set
import ipaddress
import asyncio

# Security configuration
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "1000"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))  # 1 hour
MAX_REQUEST_SIZE = int(os.getenv("MAX_REQUEST_SIZE", "10")) * 1024 * 1024  # 10MB
ALLOWED_IPS = set(os.getenv("ALLOWED_IPS", "").split(",")) if os.getenv("ALLOWED_IPS") else None
BLOCKED_IPS = set(os.getenv("BLOCKED_IPS", "").split(",")) if os.getenv("BLOCKED_IPS") else set()

# Redis for rate limiting - use same URL as config.py
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = None

async def get_redis_client():
    """Get Redis client with proper error handling"""
    global redis_client
    if redis_client is None:
        try:
            redis_client = redis.from_url(REDIS_URL, decode_responses=True)
            # Test connection
            await redis_client.ping()
        except Exception as e:
            print(f"Redis connection failed: {e}")
            redis_client = None
    return redis_client

class SecurityMiddleware(BaseHTTPMiddleware):
    """Comprehensive security middleware"""
    
    def __init__(self, app):
        super().__init__(app)
        self.suspicious_patterns = {
            "sql_injection": [
                "union select", "drop table", "delete from", "insert into",
                "update set", "exec(", "sp_", "xp_", "alter table"
            ],
            "xss": [
                "<script", "javascript:", "onload=", "onerror=", "onclick=",
                "eval(", "document.cookie", "window.location"
            ],
            "path_traversal": [
                "../", "..\\", "%2e%2e", "%2f", "%5c", "....//", "....\\\\",
                "/etc/passwd", "/etc/shadow", "c:\\windows"
            ],
            "command_injection": [
                "&& ", "|| ", "; ", "| ", "`", "$(", "${", "nc ", "netcat",
                "/bin/", "cmd.exe", "powershell"
            ]
        }
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        client_ip = "unknown"
        
        try:
            # 1. IP filtering
            client_ip = self._get_client_ip(request)
            if not await self._check_ip_allowed(client_ip):
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Access denied from this IP"}
                )
            
            # 2. Rate limiting
            if not await self._check_rate_limit(client_ip):
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded"}
                )
            
            # 3. Request size validation
            if not await self._check_request_size(request):
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Request too large"}
                )
            
            # 4. Security pattern detection
            # if not await self._check_security_patterns(request):
            #     await self._log_security_event(client_ip, "malicious_pattern", request)
            #     return JSONResponse(
            #         status_code=400,
            #         content={"detail": "Request rejected by security filter"}
            #     )
            
            # 5. Process request
            response = await call_next(request)
            
            # 6. Add security headers
            self._add_security_headers(response)
            
            # 7. Log metrics
            processing_time = time.time() - start_time
            await self._log_request_metrics(client_ip, request, response, processing_time)
            
            return response
            
        except Exception as e:
            await self._log_security_event(client_ip, "middleware_error", request, str(e))
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal security error"}
            )
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP with proxy support"""
        # Check for forwarded headers (common in production)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    async def _check_ip_allowed(self, ip: str) -> bool:
        """Check if IP is allowed"""
        if ip == "unknown":
            return False
        
        # Check blocked IPs
        if ip in BLOCKED_IPS:
            return False
        
        # Check allowed IPs (if whitelist is configured)
        if ALLOWED_IPS:
            return ip in ALLOWED_IPS
        
        # Check if IP is in private ranges (for development)
        try:
            ip_obj = ipaddress.ip_address(ip)
            if ip_obj.is_private or ip_obj.is_loopback:
                return True
        except ValueError:
            return False
        
        return True
    
    async def _check_rate_limit(self, ip: str) -> bool:
        """Check rate limit per IP"""
        try:
            client = await get_redis_client()
            if client is None:
                return True  # Allow if Redis is unavailable
            
            key = f"rate_limit:{ip}"
            current = await client.get(key)
            
            if current is None:
                await client.setex(key, RATE_LIMIT_WINDOW, 1)
                return True
            
            current_count = int(current)
            if current_count >= RATE_LIMIT_REQUESTS:
                return False
            
            await client.incr(key)
            return True
        except Exception as e:
            print(f"Rate limit check failed: {e}")
            return True  # Allow if check fails
    
    async def _check_request_size(self, request: Request) -> bool:
        """Check request size limits"""
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_REQUEST_SIZE:
            return False
        return True
    
    async def _check_security_patterns(self, request: Request) -> bool:
        """Check for malicious patterns in request"""
        # Check URL path
        path = str(request.url.path).lower()
        query = str(request.url.query).lower()
        
        # Check headers
        headers_str = " ".join([f"{k}:{v}" for k, v in request.headers.items()]).lower()
        
        # Check body (if present and small enough)
        body_str = ""
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                # Only check small bodies to avoid performance issues
                content_length = int(request.headers.get("content-length", "0"))
                if content_length > 0 and content_length < 1024 * 10:  # 10KB max for pattern checking
                    # This is a simplified check - in production you'd want to be more careful
                    pass  # Skip body checking for now to avoid complexity
            except:
                pass
        
        # Combine all text for pattern matching
        full_text = f"{path} {query} {headers_str} {body_str}"
        
        # Check against patterns
        for category, patterns in self.suspicious_patterns.items():
            for pattern in patterns:
                if pattern in full_text:
                    return False
        
        return True
    
    def _add_security_headers(self, response):
        """Add security headers to response"""
        security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:;",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
        }
        
        for header, value in security_headers.items():
            response.headers[header] = value
    
    async def _log_security_event(self, ip: str, event_type: str, request: Request, details: str = ""):
        """Log security events"""
        event = {
            "timestamp": time.time(),
            "ip": ip,
            "event_type": event_type,
            "path": str(request.url.path),
            "method": request.method,
            "user_agent": request.headers.get("user-agent", ""),
            "details": details
        }
        
        try:
            client = await get_redis_client()
            if client:
                # Log to Redis for immediate alerting
                await client.lpush("security_events", json.dumps(event))
                await client.ltrim("security_events", 0, 999)  # Keep last 1000 events
        except Exception as e:
            print(f"Failed to log to Redis: {e}")
        
        # Always log to console/file
        print(f"SECURITY EVENT: {json.dumps(event)}")
    
    async def _log_request_metrics(self, ip: str, request: Request, response, processing_time: float):
        """Log request metrics for monitoring"""
        if processing_time > 5.0:  # Log slow requests
            metric = {
                "timestamp": time.time(),
                "ip": ip,
                "path": str(request.url.path),
                "method": request.method,
                "status_code": response.status_code,
                "processing_time": processing_time,
                "type": "slow_request"
            }
            try:
                client = await get_redis_client()
                if client:
                    await client.lpush("performance_metrics", json.dumps(metric))
                    await client.ltrim("performance_metrics", 0, 999)
            except Exception as e:
                print(f"Failed to log metrics to Redis: {e}")
                print(f"SLOW REQUEST: {json.dumps(metric)}")

class DDoSProtection:
    """Advanced DDoS protection"""
    
    @staticmethod
    async def check_request_pattern(ip: str, path: str) -> bool:
        """Check for DDoS patterns"""
        try:
            client = await get_redis_client()
            if client is None:
                return True  # Allow if Redis unavailable
            
            # Track requests per IP per endpoint
            key = f"ddos_pattern:{ip}:{path}"
            
            # Count requests in last minute
            current = await client.get(key)
            if current is None:
                await client.setex(key, 60, 1)
                return True
            
            # More than 100 requests to same endpoint in 1 minute = suspicious
            if int(current) > 100:
                return False
            
            await client.incr(key)
            return True
        except Exception as e:
            print(f"DDoS pattern check failed: {e}")
            return True  # Allow if check fails
    
    @staticmethod
    async def analyze_traffic_pattern(ip: str) -> Dict[str, int]:
        """Analyze traffic patterns for anomaly detection"""
        try:
            client = await get_redis_client()
            if client is None:
                return {}
            
            patterns = await client.hgetall(f"traffic_pattern:{ip}")
            return {k: int(v) for k, v in patterns.items()} if patterns else {}
        except Exception as e:
            print(f"Traffic pattern analysis failed: {e}")
            return {}

# Export middleware for use in main.py
__all__ = ["SecurityMiddleware", "DDoSProtection"]