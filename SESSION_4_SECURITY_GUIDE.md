# Session 4: Security & API Hardening Guide

**Developer**: Security/Backend Developer  
**Duration**: 4-5 days  
**Goal**: Implement comprehensive security measures

---

## Day 1: Input Validation

### Create `security/validation.py`:
```python
from pydantic import BaseModel, validator
import re
import bleach

class UserRegistrationRequest(BaseModel):
    email: str
    name: str
    password: str
    
    @validator('email')
    def validate_email(cls, v):
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid email format')
        return v.lower().strip()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain uppercase letter')
        return v

# File validation
ALLOWED_EXTENSIONS = {'.pdf', '.txt', '.md', '.docx'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def validate_file(file):
    if not file.filename:
        raise HTTPException(400, "No filename provided")
    
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type {ext} not allowed")
    
    content = file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large")
    
    file.file.seek(0)
    return content
```

### SQL Injection Prevention:
```python
# Use parameterized queries
def get_user_knowledge_safe(db: Session, user_id: int, search: str = None):
    query = "SELECT * FROM knowledge WHERE user_id = :user_id"
    params = {"user_id": user_id}
    
    if search:
        query += " AND name ILIKE :search"
        params["search"] = f"%{search}%"
    
    return db.execute(text(query), params).fetchall()
```

---

## Day 2: Rate Limiting

### Create `security/rate_limiting.py`:
```python
import redis
import time
from fastapi import HTTPException, Request

redis_client = redis.Redis(host='localhost', port=6379, db=1)

class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
    
    def is_allowed(self, request: Request) -> bool:
        client_id = request.client.host
        key = f"rate_limit:{client_id}"
        
        current_time = int(time.time())
        window_start = current_time - self.window_seconds
        
        # Remove old entries
        redis_client.zremrangebyscore(key, 0, window_start)
        
        # Count current requests
        current_requests = redis_client.zcard(key)
        
        if current_requests >= self.max_requests:
            return False
        
        # Add current request
        redis_client.zadd(key, {str(current_time): current_time})
        redis_client.expire(key, self.window_seconds)
        
        return True

# Middleware
@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    path = request.url.path
    
    if path.startswith("/v2/auth/login"):
        limiter = RateLimiter(5, 900)  # 5 per 15 min
    elif path.startswith("/v2/knowledge/"):
        limiter = RateLimiter(100, 3600)  # 100 per hour
    else:
        limiter = RateLimiter(1000, 3600)  # General limit
    
    if not limiter.is_allowed(request):
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})
    
    return await call_next(request)
```

---

## Day 3: Enhanced JWT Auth

### Create `security/jwt_auth.py`:
```python
import jwt
from datetime import datetime, timedelta
import secrets
import redis

JWT_SECRET = secrets.token_urlsafe(32)
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

redis_client = redis.Redis(host='localhost', port=6379, db=2)

class JWTAuth:
    @staticmethod
    def create_access_token(user_id: int, email: str) -> str:
        payload = {
            "user_id": user_id,
            "email": email,
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
            "jti": secrets.token_hex(16)
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    @staticmethod
    def verify_token(token: str) -> dict:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            
            # Check blacklist
            jti = payload.get("jti")
            if redis_client.exists(f"blacklist:{jti}"):
                raise HTTPException(401, "Token revoked")
            
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(401, "Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(401, "Invalid token")
    
    @staticmethod
    def revoke_token(token: str):
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            jti = payload.get("jti")
            exp = payload.get("exp")
            
            if jti and exp:
                ttl = exp - datetime.utcnow().timestamp()
                if ttl > 0:
                    redis_client.setex(f"blacklist:{jti}", int(ttl), "revoked")
        except:
            pass

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = JWTAuth.verify_token(token)
    return payload
```

---

## Day 4: Security Headers & CORS

### Security Headers Middleware:
```python
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
    )
    
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000"
    
    return response
```

### CORS Configuration:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"]
)
```

---

## Day 5: Security Monitoring

### Security Logging:
```python
import logging
import json
from datetime import datetime

security_logger = logging.getLogger("security")
security_handler = logging.FileHandler("logs/security.log")
security_logger.addHandler(security_handler)

class SecurityEventLogger:
    @staticmethod
    def log_login_attempt(email: str, ip: str, success: bool):
        event = {
            "event_type": "login_attempt",
            "email": email,
            "ip": ip,
            "success": success,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        level = logging.INFO if success else logging.WARNING
        security_logger.log(level, f"Login: {json.dumps(event)}")
    
    @staticmethod
    def log_rate_limit_violation(ip: str, endpoint: str):
        event = {
            "event_type": "rate_limit_violation",
            "ip": ip,
            "endpoint": endpoint,
            "timestamp": datetime.utcnow().isoformat()
        }
        security_logger.warning(f"Rate limit: {json.dumps(event)}")

# Monitoring middleware
@app.middleware("http")
async def security_monitoring(request: Request, call_next):
    if request.url.path in ["/v2/auth/login", "/v2/auth/register"]:
        # Log authentication attempts
        pass
    
    response = await call_next(request)
    
    if response.status_code == 401:
        SecurityEventLogger.log_auth_failure(request.client.host, request.url.path)
    
    return response
```

### Basic Vulnerability Scanner:
```python
def scan_endpoints():
    """Basic security scan"""
    vulnerabilities = []
    
    # Test SQL injection
    payloads = ["'", "1' OR '1'='1"]
    for payload in payloads:
        # Test endpoints with malicious input
        pass
    
    return vulnerabilities
```

## Implementation Order:
1. **Day 1**: Input validation + SQL injection prevention
2. **Day 2**: Rate limiting + DDoS protection  
3. **Day 3**: JWT security + session management
4. **Day 4**: Security headers + CORS
5. **Day 5**: Monitoring + vulnerability scanning

## Success Criteria:
- ✅ All inputs validated and sanitized
- ✅ Rate limiting prevents abuse
- ✅ JWT tokens secure with blacklisting
- ✅ Security headers protect against common attacks
- ✅ CORS configured properly
- ✅ Security events logged and monitored

## Testing Commands:
```bash
# Test rate limiting
for i in {1..10}; do curl -X POST /v2/auth/login; done

# Test input validation
curl -X POST /v2/auth/register -d '{"email":"invalid","password":"weak"}'

# Test JWT security
curl -H "Authorization: Bearer invalid_token" /v2/knowledge/

# Check security headers
curl -I /v2/auth/profile
``` 