# Local Deployment

This guide explains how to deploy the EdTech Platform locally using Docker Compose.

## Prerequisites

* Docker and Docker Compose
* Git

## Deployment

```bash
# 1. Clone the repository
git clone <repository_url>
cd edtech-platform

# 2. Build and deploy the entire stack
docker-compose up --build

# 3. Verify service health
docker-compose ps
```

## Accessing Services

* **Frontend**: http://localhost:5176/
* **Backend API**: http://localhost:8000
* **API Docs**: http://localhost:8000/docs
* **PostgreSQL**: localhost:5433
* **Redis**: localhost:6380
* **Neo4j**: http://localhost:7475
* **MinIO**: http://localhost:9002
* **ORY Kratos**: http://localhost:4433
