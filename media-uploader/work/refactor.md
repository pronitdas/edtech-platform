# 🛠️ EdTech Platform: Full Local-First Refactor Plan (Cloudless, Deterministic, Complete)

## **Refactor Mission**
Migrate the platform away from Supabase and any cloud dependencies. Achieve a fully local, deterministic, and developer-friendly stack using Docker, Python, npm, and open-source tools. This plan covers **database, authentication, storage, analytics, configuration, deployment, and documentation**.

---

## **1. Database & Infrastructure**

### ✅ Already Complete
- **PostgreSQL via Docker Compose**: Local DB, no cloud.
- **SQLAlchemy ORM**: All models and CRUD in Python.
- **Alembic Migrations**: Schema versioning, repeatable.
- **Seeding Scripts**: Deterministic test data (`seed_postgres.py`).
- **Test Suite**: Pytest, fixtures, DB reset.
- **Neo4j via Docker Compose**: For graph features.
- **Single Table Model**: `EdTechContent` with `language` column implemented.

### 🟡 In Progress / To Do
- **Data Migration**: Write Python scripts to export from Supabase and import into local Postgres. Use CSV/JSON as intermediate format.
- **Production-Ready Docker Compose**: Add production DB config, volumes, and backup scripts.

#### **Action Steps**
1. [x] Refactor all code to use `edtech_content` with a `language` column (✅ Completed - see models.py).
2. [ ] Write Supabase-to-Postgres migration scripts (Python, CSV/JSON).
3. [ ] Add production Docker Compose with persistent volumes and backup/restore scripts.
4. [ ] Add backup/restore scripts for PostgreSQL and Neo4j data.

---

## **2. Authentication & Security**

### 🟡 Planning Phase
- **Auth Service Selected**: ORY Kratos recommended for simpler integration
- **Local-first Implementation**: Ready for development
- **Integration Points Identified**: User model, endpoints, middleware needed

#### **Recommended Stack**
- **Auth Service:** [ORY Kratos](https://www.ory.sh/kratos/) (self-hosted, Docker, open-source)
- **Session Management:** JWT (Python: `pyjwt`), store tokens in Postgres
- **Password Hashing:** `bcrypt` for compatibility
- **User Management:** SQLAlchemy model for `users` table

#### **Action Steps (Prioritized)**
1. [x] Create `users` table migration and SQLAlchemy model
2. [x] Add ORY Kratos service to docker-compose.yml
3. [x] Implement core auth endpoints (login, signup, reset)
4. [x] Add JWT session management
5. [ ] Integrate auth middleware with existing endpoints
6. [ ] Add test users to seed_postgres.py
7. [ ] Document auth setup in README.md

---

## **3. Storage & Media**

### 🟡 Design Phase
- **Storage Solution**: MinIO selected for S3 compatibility
- **Media Management**: Database schema and API endpoints planned
- **Migration Strategy**: Supabase to MinIO path defined

#### **Implementation Stack**
- **MinIO** (S3-compatible, Docker, open-source)
- **Python SDK:** `minio` for uploads/downloads
- **Media Table:** Add `media` table in Postgres for metadata
- **API:** FastAPI endpoints for media operations

#### **Action Steps (Prioritized)**
1. [ ] Create `media` table migration and SQLAlchemy model
2. [ ] Add MinIO service to docker-compose.yml
3. [ ] Implement MinIO client wrapper class
4. [ ] Add media upload/download endpoints
5. [ ] Write Supabase-to-MinIO migration script
6. [ ] Update seed_postgres.py with sample media
7. [ ] Add MinIO setup docs to README.md
8. [ ] Implement media cleanup/maintenance scripts

---

## **4. Analytics, RPC Functions & Business Logic**

### 🟡 Implementation Ready
- **Audit Complete**: Existing RPCs mapped to FastAPI endpoints
- **Schema Designed**: Analytics tables defined
- **Migration Path**: Clear steps for data transfer

#### **Current Analytics**
1. Content Generation Analytics:
   - Status tracking and metadata
   - Generation timestamps
   - Language coverage metrics
2. Knowledge Graph Analytics:
   - Concept tracking (Neo4j)
   - Chapter relationships
   - Content effectiveness

#### **Implementation Stack**
- **FastAPI** with OpenAPI documentation
- **SQLAlchemy** models and queries
- **Alembic** migrations for new tables
- **Pytest** for comprehensive coverage

#### **Database Schema (Ready to Implement)**
```sql
-- Analytics Tables
CREATE TABLE content_analytics (
    id SERIAL PRIMARY KEY,
    knowledge_id INTEGER REFERENCES knowledge(id),
    content_type VARCHAR(50),
    language VARCHAR(50),
    generation_time FLOAT,
    success BOOLEAN,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE engagement_metrics (
    id SERIAL PRIMARY KEY,
    knowledge_id INTEGER REFERENCES knowledge(id),
    chapter_id VARCHAR(50),
    views INTEGER DEFAULT 0,
    completions INTEGER DEFAULT 0,
    avg_time_spent FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE performance_stats (
    id SERIAL PRIMARY KEY,
    operation_type VARCHAR(50),
    duration FLOAT,
    success BOOLEAN,
    error_count INTEGER DEFAULT 0,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

#### **Action Steps (Prioritized)**
1. [x] Audit and document Supabase RPC functions (✅ Complete)
2. [x] Design analytics table schema (✅ Complete)
3. [x] Create Alembic migrations for analytics tables
4. [x] Implement FastAPI endpoints:
   ```python
   @router.get("/analytics/content/{knowledge_id}")
   @router.get("/analytics/engagement/{knowledge_id}")
   @router.get("/analytics/performance")
   ```
5. [x] Create SQLAlchemy models for analytics tables
6. [ ] Write data migration scripts from Supabase
7. [ ] Add logging and monitoring
8. [ ] Write integration tests for endpoints

---

## **5. Configuration & Environment Management**

### ✅ Environment Files Created
- **.env, .env.test, .env.prod** files exist
- **Docker Compose** uses environment configuration

### 🟡 In Progress
- **Environment Documentation**: Need comprehensive docs
- **Service Configuration**: New services (auth, storage) need env setup

#### **Recommended Stack**
- **python-dotenv** for Python env management
- **.env files** for all services (existing + planned)
- **Docker Compose env files** for service config

#### **Action Steps**
1. [x] Create .env, .env.test, .env.prod base files (✅ Complete)
2. [ ] Add environment variables for new services (auth, storage)
3. [ ] Document all environment variables in README
4. [ ] Add environment validation in application startup

---

## **6. Production Deployment & CI/CD**

### 🟡 Partially Implemented
- **CI Pipeline**: Basic GitHub Actions workflow exists
- **Local Development**: Docker Compose for services
- **Needed**: Production configuration and deployment

#### **Current Stack**
- **Docker Compose**: Service orchestration
- **GitHub Actions**: Automated testing (.github/workflows/test.yml)
- **Needed**: Production configs and scripts

#### **Action Steps (Prioritized)**
1. [ ] Create docker-compose.prod.yml with:
   - Secure configurations
   - Volume persistence
   - Resource limits
   - Health checks
2. [ ] Add deployment and rollback scripts
3. [ ] Enhance GitHub Actions workflow:
   - Add linting
   - Add security scanning
   - Add container builds
4. [ ] Create backup/restore scripts
5. [ ] Document production deployment

---

## **7. Data Migration (Supabase → Local Stack)**

### 🟡 Planning Phase
- **Data Sources**: Content, analytics, media files
- **Target Systems**: Postgres, MinIO
- **Tools**: Python migration scripts

#### **Action Steps (Prioritized)**
1. [ ] Create data export scripts for Supabase:
   - Table data to CSV/JSON
   - File storage to local
   - Analytics data export
2. [ ] Implement import scripts for:
   - PostgreSQL data import
   - MinIO file upload
   - Analytics data transformation
3. [ ] Add data validation and verification
4. [ ] Create rollback procedures
5. [ ] Document migration process

---

## **8. Documentation & Onboarding**

### 🟡 In Progress
- **README**: Basic setup documented
- **API Docs**: Needed for new endpoints
- **Environment**: Config documented in README

#### **Action Steps (Prioritized)**
1. [ ] Expand README with:
    - ✅ Local dev setup (partial)
    - ✅ Basic migrations/seeding
    - [ ] Auth system setup/usage
    - [ ] MinIO storage configuration
    - [ ] Analytics endpoints
    - [ ] Production deployment
    - [ ] Migration procedures
2. [ ] Generate OpenAPI docs for all endpoints
3. [ ] Create developer onboarding guide:
    - Environment setup
    - Development workflow
    - Testing procedures
    - Deployment steps
4. [ ] Add architecture diagrams

---

## **9. Sample Local-First Workflow**

```bash
# 1. Start all services
make up  # or: docker-compose up -d

# 2. Run DB migrations
make migrate  # or: alembic upgrade head

# 3. Seed data
make seed  # or: python seed_postgres.py && python seed_neo4j.py

# 4. Run tests
make test  # or: pytest

# 5. Develop/run app
make run  # or: python -m media-uploader.main

# 6. Migrate data from Supabase (one-time)
python migrate_supabase_to_local.py

# 7. Deploy to production (local server, no cloud)
make deploy-prod  # or: docker-compose -f docker-compose.prod.yml up -d
```

---

## **10. Next Steps (Checklist)**
- [x] Refactor dynamic tables to single-table with language column
- [x] Add .env management for all services
- [x] Implement local auth (ORY Kratos, JWT, users table)
- [ ] Add MinIO for storage, refactor all media logic
- [x] Design analytics tables and endpoints (schema ready)
- [x] Implement analytics endpoints and migrations
- [ ] Set up production Docker Compose and deployment scripts
- [ ] Write data/file migration scripts
- [ ] Complete and expand documentation
- [ ] Add CI workflow (GitHub Actions or local runner)

**Current Focus Areas:**
1. Implement analytics tables/endpoints (schema designed, ready for implementation)
2. Authentication setup (ORY Kratos integration)
3. Media storage implementation (MinIO)
4. Production deployment configuration

**Next Implementation Steps:**
1. [x] Create Alembic migrations for analytics tables
2. [x] Implement FastAPI analytics endpoints
3. Write analytics data migration scripts

---

**This plan is 100% local-first, open-source, and cloud-agnostic. No cloud provider required at any step.**

**Update this doc as you complete each section.**