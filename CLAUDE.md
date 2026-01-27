# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TARDIS (Teaching with Adaptive Real-time Dynamic Interactive Systems) is a full-stack educational technology platform with AI tutoring, interactive learning, knowledge graphs, and analytics.

## Development Commands

### Frontend (tardis-ui/)
```bash
pnpm dev                    # Dev server at http://localhost:5176
pnpm build                  # Production build + type check
pnpm lint                   # ESLint with auto-fix
pnpm test                   # Run Vitest tests
pnpm test:ui                # Test UI dashboard
pnpm storybook              # Component docs at http://localhost:6006
```

### Backend (media-uploader/)
```bash
make dev-v2                 # Dev server at http://localhost:8000 (runs migrations first)
make migrate                # Run Alembic migrations
make seed                   # Seed PostgreSQL and Neo4j
make test                   # Run pytest with coverage
make lint                   # flake8 + mypy
make format                 # black + isort
pip install -r requirements.txt  # Install dependencies
```

### Full Stack
```bash
docker-compose up -d        # Start all services (postgres, redis, neo4j, minio, kratos)
docker-compose down -v      # Stop and remove volumes
```

### E2E Tests (e2e-tests/)
```bash
pnpm test                   # Run Vitest E2E tests
pnpm test:run               # Single run (no watch)
```

## Architecture

### Tech Stack
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: FastAPI + SQLAlchemy 2.0 + Alembic
- **Databases**: PostgreSQL 16 (relational), Redis (cache/sessions), Neo4j 5 (knowledge graph), MinIO (files)
- **Auth**: ORY Kratos with JWT

### Frontend Structure (tardis-ui/src/)
- `components/` - Reusable UI components
- `contexts/` - React Context providers (AuthContext, CourseContext, LearningContext, etc.)
- `hooks/` - Custom hooks for business logic
- `services/` - API clients and service layer
- `pages/` and `app/` - Route components

Uses `@/` path alias for imports (e.g., `@/components/Dashboard`).

### Backend Structure (media-uploader/)
- `src/api/v2/` - V2 API routers (19 endpoints: auth, analytics, ai_tutor, chapters, content, dashboard, knowledge, llm, media, profile, roleplay, search, semantic_search, student, teacher, topic_generation, admin, simple_auth)
- `src/middleware/` - Security and Kratos auth middleware
- `src/services/` - Business logic layer
- Document processors: `pdf_processor.py`, `video_processor_v2.py`, `docx_processor.py`, `pptx_processor.py`
- `knowledge_graph.py` - Neo4j graph service
- `alembic/` - Database migrations

### Local Dev Ports
| Service | Port |
|---------|------|
| Frontend | 5176 |
| Backend API | 8000 |
| PostgreSQL | 5433 |
| Redis | 6380 |
| Neo4j HTTP | 7475 |
| Neo4j Bolt | 7688 |
| MinIO API | 9002 |
| MinIO Console | 9003 |
| Kratos Public | 4433 |
| Kratos Admin | 4434 |
| Storybook | 6006 |

## Key Patterns

### Frontend
- Functional components with hooks (no class components)
- Context API for state management
- Service layer pattern for API calls (`services/`)
- TypeScript strict mode enabled
- Prettier + ESLint enforced via Husky pre-commit hooks

### Backend
- FastAPI with async endpoints
- V2 API pattern with modular routers
- Kratos-based authentication with JWT middleware
- SQLAlchemy async sessions
- Alembic for schema migrations

## Testing

### Running Single Tests
```bash
# Frontend - specific file
pnpm test src/components/Dashboard.test.tsx

# Backend - specific test
pytest tests/test_v2_api.py::test_specific_function -v

# Backend - pattern matching
pytest -k "test_auth" -v
```

## Code Guidelines
- Complete implementations required (no TODOs or placeholders)
- Focus on readability over premature optimization
- Maintain existing patterns when modifying code
