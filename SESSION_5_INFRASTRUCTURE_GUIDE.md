# Session 5: Infrastructure & DevOps Guide

**Developer**: DevOps Engineer  
**Duration**: 4-5 days  
**Goal**: Production-ready infrastructure with Docker optimization

---

## Day 1: Multi-Stage Docker Optimization

### Current Issue: 5GB+ Images
Fix with multi-stage builds to reduce to <500MB

### Optimized Backend `Dockerfile`:
```dockerfile
# media-uploader/Dockerfile
FROM python:3.9-slim as builder

RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.9-slim as production

RUN apt-get update && apt-get install -y libpq5 curl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN groupadd -r appuser && useradd -r -g appuser appuser
WORKDIR /app
COPY --chown=appuser:appuser . .

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

USER appuser
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Optimized Frontend `Dockerfile`:
```dockerfile
# tardis-ui/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine as production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Create `nginx.conf`:
```nginx
events { worker_connections 1024; }

http {
    include /etc/nginx/mime.types;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;

        location /health {
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        location / {
            try_files $uri $uri/ /index.html;
        }

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

---

## Day 2: Production Docker Compose

### Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./tardis-ui
      target: production
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: ./media-uploader
      target: production
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://redis:6379
      - NEO4J_URI=bolt://neo4j:7687
      - JWT_SECRET=${JWT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      neo4j:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:13-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  neo4j:
    image: neo4j:5-community
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
    volumes:
      - neo4j_data:/data
    ports:
      - "7474:7474"
      - "7687:7687"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "cypher-shell", "-u", "neo4j", "-p", "${NEO4J_PASSWORD}", "RETURN 1"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  neo4j_data:
```

### Create `.env.prod`:
```bash
POSTGRES_DB=edtech_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
REDIS_PASSWORD=your_redis_password_here
NEO4J_PASSWORD=your_neo4j_password_here
JWT_SECRET=your_jwt_secret_here
OPENAI_API_KEY=your_openai_key_here
ENVIRONMENT=production
DEBUG=false
```

---

## Day 3: Health Checks & Monitoring

### Add Health Endpoints (`media-uploader/health.py`):
```python
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
import redis
import time

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

@router.get("/health/detailed")
async def detailed_health_check():
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {}
    }
    
    # Check database
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        health_status["services"]["database"] = "healthy"
    except Exception as e:
        health_status["services"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"
    
    # Check Redis
    try:
        r = redis.Redis(host='redis', port=6379)
        r.ping()
        health_status["services"]["redis"] = "healthy"
    except Exception as e:
        health_status["services"]["redis"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"
    
    if health_status["status"] == "unhealthy":
        raise HTTPException(status_code=503, detail=health_status)
    
    return health_status

# Add to main.py
app.include_router(router)
```

### Basic Monitoring Setup:
```python
# Add to main.py
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

REQUEST_COUNT = Counter('http_requests_total', 'Total requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'Request duration')

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    
    REQUEST_COUNT.labels(method=request.method, endpoint=request.url.path).inc()
    REQUEST_DURATION.observe(time.time() - start_time)
    
    return response

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
```

---

## Day 4: CI/CD Pipeline

### Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
        
    - name: Install dependencies
      run: |
        cd media-uploader
        pip install -r requirements.txt
        pip install pytest pytest-cov
        
    - name: Run tests
      run: |
        cd media-uploader
        python -m pytest tests/ --cov=. --cov-fail-under=80

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build images
      run: |
        docker-compose -f docker-compose.prod.yml build
        
    - name: Test deployment
      run: |
        docker-compose -f docker-compose.prod.yml up -d
        sleep 60
        curl -f http://localhost:8000/health || exit 1
        docker-compose -f docker-compose.prod.yml down
```

### Create Deployment Script (`scripts/deploy.sh`):
```bash
#!/bin/bash
set -e

echo "Starting deployment..."

# Backup
echo "Creating backup..."
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres edtech_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Deploy
echo "Pulling latest..."
docker-compose -f docker-compose.prod.yml pull

echo "Rolling update..."
docker-compose -f docker-compose.prod.yml up -d --no-deps backend
sleep 30

docker-compose -f docker-compose.prod.yml up -d --no-deps frontend
sleep 30

# Verify
echo "Verifying..."
curl -f http://localhost:8000/health || exit 1
curl -f http://localhost:80/health || exit 1

echo "Deployment complete!"
docker image prune -f
```

---

## Day 5: Production Hardening

### Environment Validation (`scripts/validate-env.sh`):
```bash
#!/bin/bash

required_vars=("POSTGRES_PASSWORD" "JWT_SECRET" "OPENAI_API_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        missing_vars+=("$var")
    fi
done

if [[ ${#missing_vars[@]} -gt 0 ]]; then
    echo "Error: Missing required environment variables:"
    printf '%s\n' "${missing_vars[@]}"
    exit 1
fi

if [[ ${#POSTGRES_PASSWORD} -lt 12 ]]; then
    echo "Error: POSTGRES_PASSWORD must be at least 12 characters"
    exit 1
fi

echo "Environment validation passed!"
```

### Backup Script (`scripts/backup.sh`):
```bash
#!/bin/bash
set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres edtech_prod | gzip > $BACKUP_DIR/postgres_$DATE.sql.gz

# Backup Redis
docker-compose -f docker-compose.prod.yml exec -T redis redis-cli --rdb - | gzip > $BACKUP_DIR/redis_$DATE.rdb.gz

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### Security Hardening:
```bash
# Create scripts/security-check.sh
#!/bin/bash

echo "Running security checks..."

# Check for exposed secrets
if grep -r "password\|secret\|key" --include="*.py" --include="*.js" .; then
    echo "Warning: Potential secrets found in code"
fi

# Check file permissions
find . -type f -perm /o+w -ls | grep -v ".git" && echo "Warning: World-writable files found"

# Check Docker security
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image edtech-backend:latest

echo "Security check complete"
```

## Implementation Order:
1. **Day 1**: Optimize Docker images (5GB → <500MB)
2. **Day 2**: Production docker-compose setup
3. **Day 3**: Health checks and basic monitoring
4. **Day 4**: CI/CD pipeline with automated tests
5. **Day 5**: Security hardening and backup procedures

## Success Criteria:
- ✅ Docker images under 500MB
- ✅ All services have health checks
- ✅ CI/CD pipeline runs tests and deploys
- ✅ Monitoring endpoints active
- ✅ Backup procedures in place
- ✅ Environment validation
- ✅ Security checks automated

## Quick Commands:
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml build
./scripts/deploy.sh

# Health checks
curl http://localhost:8000/health/detailed
curl http://localhost:80/health

# Monitoring
curl http://localhost:8000/metrics

# Backup
./scripts/backup.sh

# Security check
./scripts/security-check.sh

# Environment validation
./scripts/validate-env.sh
```

## Production Checklist:
- [ ] Environment variables secured
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Monitoring alerts set up
- [ ] Backup schedule automated
- [ ] Log rotation configured
- [ ] Performance tuning applied 