#!/bin/bash

# Production Deployment Script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-prod}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Error: $COMPOSE_FILE not found"
    exit 1
fi

# Check if .env.prod exists
if [ ! -f ".env.${ENVIRONMENT}" ]; then
    echo "❌ Error: .env.${ENVIRONMENT} not found"
    exit 1
fi

# Load environment variables
export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)

# Create data directories
echo "📁 Creating data directories..."
mkdir -p "${DATA_DIR}/postgres" "${DATA_DIR}/neo4j/data" "${DATA_DIR}/neo4j/logs" \
         "${DATA_DIR}/neo4j/import" "${DATA_DIR}/neo4j/plugins" \
         "${DATA_DIR}/kratos" "${DATA_DIR}/minio"

# Set proper permissions
sudo chown -R 999:999 "${DATA_DIR}/postgres"
sudo chown -R 7474:7474 "${DATA_DIR}/neo4j"
sudo chown -R 1001:1001 "${DATA_DIR}/minio"

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f "$COMPOSE_FILE" build --no-cache
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
docker-compose -f "$COMPOSE_FILE" ps

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f "$COMPOSE_FILE" exec app alembic upgrade head

# Optional: Seed data for development
if [ "$ENVIRONMENT" = "dev" ]; then
    echo "🌱 Seeding development data..."
    docker-compose -f "$COMPOSE_FILE" exec app python seed_postgres.py
    docker-compose -f "$COMPOSE_FILE" exec app python seed_neo4j.py
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be available at: http://localhost:${APP_PORT:-8000}"
echo "📊 MinIO Console: http://localhost:${MINIO_CONSOLE_PORT:-9001}"
echo "🔍 Neo4j Browser: http://localhost:${NEO4J_HTTP_PORT:-7474}" 