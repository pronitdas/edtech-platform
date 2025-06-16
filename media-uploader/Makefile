.PHONY: help up down build migrate seed test clean deploy-prod backup

# Default target
help:
	@echo "Available commands:"
	@echo "  make up          - Start development services"
	@echo "  make down        - Stop all services"
	@echo "  make build       - Build application container"
	@echo "  make migrate     - Run database migrations"
	@echo "  make seed        - Seed databases with test data"
	@echo "  make test        - Run test suite"
	@echo "  make clean       - Clean up containers and volumes"
	@echo "  make deploy-prod - Deploy to production"
	@echo "  make backup      - Create database backups"
	@echo "  make logs        - Show application logs"
	@echo "  make shell       - Open shell in app container"

# Development commands
up:
	docker-compose up -d
	@echo "Services started. Application available at http://localhost:8000"

down:
	docker-compose down

build:
	docker-compose build

migrate:
	alembic upgrade head

seed: migrate
	python seed_postgres.py
	python seed_neo4j.py

test:
	pytest -v

clean:
	docker-compose down -v
	docker system prune -f

# Production commands
deploy-prod:
	./scripts/deploy.sh prod

backup:
	./scripts/postgres-backup.sh

# Utility commands
logs:
	docker-compose logs -f app

shell:
	docker-compose exec app /bin/bash

# Phase 1 specific commands
.PHONY: migrate test-v2 refresh-view

migrate:
	alembic upgrade head

test-v2:
	pytest tests/test_v2_api.py -v

refresh-view:
	psql $(DATABASE_URL) -c "REFRESH MATERIALIZED VIEW CONCURRENTLY user_progress;"

# Full Phase 1 setup
phase1-setup: migrate
	@echo "Phase 1 setup complete - v2 API ready"

# Development workflow
dev-v2: migrate
	uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Testing workflow  
test: test-v2
	pytest tests/ -v --cov=src --cov-report=html

# Install dependencies
install:
	pip install -r requirements.txt

# Run application locally (without Docker)
run:
	python -m media-uploader.main

# Format code
format:
	black .
	isort .

# Lint code
lint:
	flake8 .
	mypy .

# Full development setup
setup: install migrate seed
	@echo "Local development setup complete!"