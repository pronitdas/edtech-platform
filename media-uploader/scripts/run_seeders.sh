#!/bin/bash
set -e

# Database Seeder Runner
# This script runs the Python seeder after the containers are up

echo "Waiting for PostgreSQL to be ready..."

# Wait for PostgreSQL to be ready
while ! docker compose exec postgres pg_isready -U postgres -d development > /dev/null 2>&1; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo "PostgreSQL is ready. Running seeder..."

# Install dependencies and run seeder
docker compose exec -w /app media-uploader python -m pip install --quiet sqlalchemy psycopg2-binary || true

# Run the seeder
docker compose exec -w /app media-uploader python scripts/seed_simple.py

echo "Database seeding completed!"
