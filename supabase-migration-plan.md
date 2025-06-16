# Supabase Migration Plan & Platform Alignment

## 1. Executive Summary
We are migrating away from Supabase to a new stack. This document details all Supabase touchpoints, services, tables, and architectural structure, and aligns the migration with the platform's epics and strategic roadmap.

---

## 2. Supabase Touchpoints (Current State)

### 2.1. Services Using Supabase
- **Authentication:** `src/services/auth.ts` (signIn, signUp)
- **Content Management:** `src/services/edtech-content.ts` (CRUD, storage, RPC)
- **Analytics:** `src/services/analytics-service.ts` (event tracking, progress, RPC)
- **Learning Analytics:** `src/services/learning-analytics-service.ts` (analytics, RPC)
- **Supabase Client:** `src/services/supabase.ts` (client init, export)

### 2.2. Database Tables (from code and epics)
- `EdTechContent_<language>`
- `chapters_v1`
- `knowledge`
- `user_interactions`
- `user_progress`
- `learning_analytics`
- `user_sessions`
- `user_sessions_stats`
- `quiz`
- `media` (storage bucket)

### 2.3. Supabase Storage
- Bucket: `media` (for files, images, etc.)

### 2.4. Supabase RPC/Functions
- `check_edtech_columns`
- `calculate_engagement_score`
- `get_knowledge_video_stats`
- `get_knowledge_quiz_stats`
- `generate_learning_analytics`
- `calculate_understanding_level`
- `start_user_session`
- `end_user_session`
- `get_user_session_stats`
- `get_user_interaction_summary`
- `summarize_numeric_event_data`
- `get_knowledge_interaction_summary`

---

## 3. Migration Plan

### 3.1. Inventory & Analysis
- **List all Supabase SDK/API usages** (see above)
- **Document all tables, storage, and functions**
- **Map each to a new provider or architecture**

### 3.2. Choose Replacements
- **Database:** Managed Postgres (AWS RDS, GCP Cloud SQL) or alternative (MongoDB, etc.)
- **Auth:** Auth0, Firebase Auth, Clerk, or custom JWT
- **Storage:** AWS S3, GCP Storage, Azure Blob, or MinIO
- **RPC/Functions:** REST/GraphQL API endpoints, or DB procedures

### 3.3. Data & File Migration
- **Export all tables** from Supabase
- **Migrate data** to new DB (schema mapping, data cleaning)
- **Migrate files** from Supabase Storage to new provider
- **Re-implement functions** as API endpoints or DB logic

### 3.4. Code Refactoring
- **Replace Supabase SDK calls** with new SDKs or API clients
- **Update all service files** (auth, content, analytics, learning analytics)
- **Remove Supabase dependencies**
- **Update environment variables**

### 3.5. Testing & QA
- **Unit and integration tests** for all migrated features
- **Manual QA** for all user flows
- **Staging environment** for pre-production validation

### 3.6. Deployment & Rollback
- **Deploy to staging**
- **Monitor for issues**
- **Have rollback plan** to revert to Supabase if needed

### 3.7. Documentation & Training
- **Update all documentation** (developer, ops, onboarding)
- **Train team** on new stack

---

## 4. Alignment with Platform Epics & Roadmap

### 4.1. Strategic Roadmap (see `epics/strategic-roadmap.md`)
- **Phase 1:** Testing, Quiz, Responsive Design, Performance, Content Management
- **Phase 2:** Analytics, Gamification, Data Export, Offline, Accessibility
- **Migration must not block:**
  - Test coverage, analytics, content workflows, accessibility, or performance

### 4.2. Key Epics Impacted
- **EP-001:** Test Framework Setup (ensure new stack is testable)
- **EP-002:** Interactive Quiz Platform (migrate quiz data, analytics)
- **EP-005:** Content Management Enhancements (content CRUD, storage)
- **EP-007:** Analytics Dashboard (event, progress, learning analytics)
- **EP-008:** Data Export Integration (ensure new DB supports export)
- **EP-010:** Accessibility Compliance (no regression in accessible flows)
- **EP-011:** Student Practice Module (progress, analytics, content)
- **Advanced AI Tutor:** Data flow between new DB and Neo4j/AI services

### 4.3. Data Model & Service Alignment
- **Tables and data models** must be mapped 1:1 or improved in new DB
- **Storage structure** (media, versioning) must be preserved or enhanced (see `resilient-storage-system.md`)
- **Analytics and event tracking** must be migrated and validated (see `analytics-dashboard.md`)
- **Content versioning and templates** must be supported (see `content-management-enhancements.md`)
- **Quiz and assessment logic** must be migrated (see `core-quiz-engine.md`)

---

## 5. Action Items & Owners
- [ ] Inventory all Supabase usage (Engineering)
- [ ] Select new providers for DB, Auth, Storage (Product/Engineering)
- [ ] Design new schema and migration scripts (Engineering)
- [ ] Migrate data and files (Engineering)
- [ ] Refactor codebase (Engineering)
- [ ] Update documentation (Product/Docs)
- [ ] QA and sign-off (QA/PM)

---

## 6. Risks & Mitigations
- **Data loss:** Backup all data before migration
- **Downtime:** Use blue/green or canary deployments
- **Feature regression:** Comprehensive testing
- **Team ramp-up:** Training and documentation

---

## 7. References
- `epics/strategic-roadmap.md`
- `epics/roadmap-to-production.md`
- `epics/advanced-ai-tutor.md`
- `epics/analytics-dashboard.md`
- `epics/content-management-enhancements.md`
- `epics/resilient-storage-system.md`
- `src/services/edtech-content.ts`, `analytics-service.ts`, `learning-analytics-service.ts`, `auth.ts`, `supabase.ts`

---

**This document is a living plan. Update as migration progresses.** 