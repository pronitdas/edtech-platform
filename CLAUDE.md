# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Frontend (tardis-ui/)
```bash
# Install dependencies
pnpm install

# Development server (port 3000)
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm type-check

# Linting and formatting
pnpm lint          # Fix issues
pnpm lint:check    # Check only
pnpm format        # Format code
pnpm format:check  # Check formatting

# Testing
pnpm test                    # Run tests
pnpm test:ui                # Test with UI
pnpm test:coverage          # Coverage report

# Storybook
pnpm storybook              # Development server (port 6006)
pnpm build-storybook        # Build static
pnpm test-storybook         # Test stories
pnpm test-storybook:ci      # CI testing
```

### Backend (media-uploader/)
```bash
# Install dependencies
pip install -r requirements.txt

# Development server
python main.py

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Testing
pytest
python -m pytest tests/

# Run specific services
python verify_v2_backend.py    # Verify V2 implementation
```

### LLM Service (llm-service/)
```bash
# Setup and run
pip install -r requirements.txt
python main.py

# Health check
python check_health.py

# Docker deployment
docker-compose up
```

### Infrastructure
```bash
# Full stack (from root)
docker-compose up

# Database operations
./media-uploader/scripts/wait-for-postgres.sh
./media-uploader/scripts/init-db.sh
```

## Project Architecture

### High-Level Structure
- **tardis-ui/**: React 19 frontend with TypeScript, Vite build system
- **media-uploader/**: FastAPI backend with PostgreSQL, Redis, and media processing
- **llm-service/**: AI/ML microservice with OpenAI integration and model gateway
- **docker-compose.yaml**: Development infrastructure orchestration

### Frontend Architecture (tardis-ui/)
- **Component-based**: Functional React components with hooks
- **Type Safety**: Strict TypeScript configuration
- **Styling**: TailwindCSS with component variants
- **State Management**: React Context API (not Redux despite copilot instructions)
- **Testing**: Vitest + Testing Library + Storybook
- **Build**: Vite with code splitting and optimization

Key directories:
- `src/components/`: Reusable UI components with stories and tests
- `src/components/interactive/`: Interactive learning modules (slope drawing, etc.)
- `src/services/`: API clients and business logic
- `src/hooks/`: Custom React hooks for state and analytics
- `src/contexts/`: React context providers
- `src/types/`: TypeScript type definitions

### Backend Architecture (media-uploader/)
- **FastAPI**: Async Python API framework
- **Database**: PostgreSQL with Alembic migrations
- **Caching**: Redis for session and queue management
- **File Processing**: PDF, video, document processors
- **Auth**: JWT-based authentication with middleware
- **Storage**: S3-compatible object storage

Key modules:
- `main.py`: Application entry point with middleware
- `src/api/v2/`: V2 API endpoints (preferred)
- `src/services/`: Business logic services
- `src/models/`: Database models
- `routes/`: V1 API routes (legacy)
- `migrations/`: Database schema versions

### Analytics & AI Integration
- **Analytics Engine**: Comprehensive event tracking across all interactions
- **LLM Integration**: OpenAI API with provider abstraction
- **Real-time Processing**: WebSocket connections for live data
- **Cognitive Load Tracking**: Adaptive difficulty based on user performance

## Development Guidelines

### Code Style
- **Frontend**: ESLint + Prettier with TypeScript strict mode
- **Backend**: Python Black formatting, type hints required
- **Testing**: Write tests for all new features, maintain coverage
- **Documentation**: Update relevant README files and inline comments

### File Organization
- Use absolute imports with `@/` alias for frontend
- Group related components in feature directories
- Separate concerns: components, hooks, services, types
- Follow established naming conventions (PascalCase for components, camelCase for functions)

### Key Development Patterns
1. **Interactive Components**: Use the established pattern in `components/interactive/`
2. **Analytics Integration**: All user interactions should emit analytics events
3. **Error Handling**: Implement comprehensive error boundaries and API error handling
4. **Performance**: Use React.memo, useMemo, and useCallback for optimization
5. **Accessibility**: Follow WCAG 2.1 AA guidelines, use semantic HTML

### Database Operations
- Always use Alembic for schema changes
- V2 models in `src/models/v2_models.py` are preferred over legacy models
- Use proper foreign key relationships and constraints
- Test migrations thoroughly before deployment

### API Development
- Prefer V2 endpoints in `src/api/v2/` over legacy routes
- Implement proper request validation and error responses
- Use dependency injection for database connections
- Document API changes in OpenAPI spec

### Testing Strategy
- Frontend: Component tests with Testing Library, Storybook for visual testing
- Backend: pytest with comprehensive API endpoint coverage
- Integration tests for critical user flows
- Performance testing for interactive components

## Important Context

### Current Development Focus
- **Student Practice Module**: Interactive slope drawing tool with cognitive load tracking
- **Analytics Dashboard**: Real-time learning progress visualization  
- **UI/UX Polish**: Mobile optimization and accessibility improvements
- **Backend Migration**: Transitioning from Supabase to local PostgreSQL

### Known Technical Debt
- Legacy API routes in `routes/` should be migrated to `src/api/v2/`
- Some components still use Supabase client (should use local API)
- Redux references in copilot instructions are outdated (project uses Context API)
- Video processing pipeline needs optimization for large files

### Critical Dependencies
- **Frontend**: React 19, TypeScript 5.6+, Vite 5.4+, TailwindCSS 3.4+
- **Backend**: FastAPI, SQLAlchemy 1.4+, Alembic, PostgreSQL 13+
- **AI/ML**: OpenAI API, custom model gateway
- **Infrastructure**: Docker, Redis, S3-compatible storage