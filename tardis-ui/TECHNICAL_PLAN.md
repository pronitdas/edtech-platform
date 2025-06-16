# 🛠️ Complete Technical Plan – Two-Phase Refactor 

> Scope : eradicate Supabase, finalise local-first stack, add missing capabilities. Nothing kept for backward compatibility.

──────────────────────────────────
## PHASE 1  – BACK-END EXPANSION (`/v2` API)
──────────────────────────────────

### 1 · New API Surface
```
/v2
 ├─ auth
 │   ├─ POST /login            (email, password)
 │   ├─ POST /register         (email, password, name?)
 │   ├─ POST /logout
 │   └─ GET  /profile          (current user)
 │
 ├─ knowledge
 │   ├─ POST   /               (multi-file upload, flags)
 │   ├─ GET    /               (list, filters)
 │   ├─ GET    /{id}
 │   ├─ DELETE /{id}           (cascade delete)
 │   └─ WS     /{id}/status    (queue progress)
 │
 ├─ chapters
 │   ├─ GET /{kid}
 │   └─ PUT /{kid}/{cid}       (update notes | summary | quiz | mindmap)
 │
 ├─ content
 │   └─ POST /generate/{kid}   (manual regeneration)
 │
 ├─ roleplay
 │   ├─ POST /generate         (knowledge_id, topic, content, language)
 │   └─ GET  /{kid}
 │
 ├─ analytics
 │   ├─ POST /track-event
 │   ├─ GET  /user/{uid}/progress
 │   ├─ GET  /user/{uid}/completion?course_id=
 │   ├─ GET  /user/{uid}/sessions
 │   ├─ GET  /user/{uid}/interactions[?content_id=]
 │   ├─ GET  /user/{uid}/numeric-summary?event_type=&json_key=
 │   ├─ GET  /knowledge/{kid}/interactions
 │   ├─ GET  /knowledge/{kid}/video-stats
 │   ├─ GET  /knowledge/{kid}/quiz-stats
 │   └─ GET  /knowledge/{kid}/quiz-stats
 │
 ├─ search     GET /?q=
 └─ admin      GET /health/full
```

### 2 · Database Schema & Migrations  (`alembic revision -m "v2 core"`)
```sql
--   ▼ NEW TABLES
CREATE TABLE roleplay_scenarios (
    id             SERIAL PRIMARY KEY,
    knowledge_id   INT  NOT NULL REFERENCES knowledge(id) ON DELETE CASCADE,
    chapter_id     VARCHAR(64),
    language       VARCHAR(48) DEFAULT 'English',
    topic          TEXT,
    prompt         TEXT,
    response       TEXT,
    created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at    TIMESTAMPTZ DEFAULT now(),
    ended_at      TIMESTAMPTZ,
    duration_sec  INT
);

CREATE TABLE user_events (
    id            BIGSERIAL PRIMARY KEY,
    user_id       INT NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    knowledge_id  INT REFERENCES knowledge(id)            ON DELETE SET NULL,
    chapter_id    VARCHAR(64),
    session_id    UUID REFERENCES user_sessions(id)       ON DELETE SET NULL,
    event_type    VARCHAR(64) NOT NULL,
    content_id    VARCHAR(64),
    ts            TIMESTAMPTZ  DEFAULT now(),
    data          JSONB
);
CREATE INDEX idx_user_events_data_gin ON user_events USING GIN (data);
CREATE INDEX idx_user_events_user_ts ON user_events (user_id, ts DESC);

--   ▼ TABLE MODIFICATIONS
-- 1 knowledge (remove filename, ensure name, content_type)
ALTER TABLE knowledge
    DROP COLUMN IF EXISTS filename,
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS content_type VARCHAR(32) DEFAULT 'mixed';

-- 2 media back-reference + cascade
ALTER TABLE media
    ADD CONSTRAINT media_knowledge_fk FOREIGN KEY (knowledge_id)
        REFERENCES knowledge(id) ON DELETE CASCADE;

-- 3 chapters language column & index
ALTER TABLE chapters
    ADD COLUMN IF NOT EXISTS language VARCHAR(48) DEFAULT 'English';
CREATE INDEX IF NOT EXISTS idx_chapters_kid ON chapters(knowledge_id);

--   ▼ MATERIALISED VIEW
CREATE MATERIALIZED VIEW user_progress AS
SELECT  user_id,
        knowledge_id,
        COUNT(DISTINCT chapter_id)                           AS chapters_viewed,
        MAX(ts)                                              AS last_access,
        (COUNT(*) FILTER (WHERE event_type='chapter_complete'))::FLOAT /
        NULLIF(COUNT(DISTINCT chapter_id),0) * 100           AS progress_percent
FROM    user_events
GROUP BY user_id, knowledge_id;
```
*Remember to `alembic upgrade head` and schedule `REFRESH MATERIALIZED VIEW CONCURRENTLY user_progress` nightly.*

### 3 · Service Layer Tasks
| Area | Work |
|------|------|
| **Upload** | Refactor `upload_knowledge_file` ➜ `POST /v2/knowledge`. Accept `auto_process`, `generate_content`, `content_types[]`, `content_language`. Immediately enqueue and return WS channel id. |
| **QueueManager** | Remove external retry endpoints; implement exponential back-off inside worker. Emit Redis PubSub events. |
| **WebSockets** | FastAPI-WebSocket → `ws/knowledge/{id}/status`. Bridge via Redis. |
| **RoleplaySvc** | Wrapper around OpenAI `gpt-4o-mini`; persist scenarios. |
| **AnalyticsSvc** | Insert events, compute aggregates (views, video %, quiz %, engagement score). |
| **SearchSvc** | Full-text search (`tsvector`) across `knowledge.name`, `chapters.content`. |
| **Admin** | Health consolidator (Postgres, Neo4j, MinIO, Queue, GPU). |

### 4 · Testing & CI
- Pytest + httpx covering every new endpoint
- Load test WebSocket with locust
- GitHub Action: run `make migrate && pytest`

Estimated effort **≈ 8 dev-days**

──────────────────────────────────
## PHASE 2  – FRONT-END REBUILD (Next.js + local API)
──────────────────────────────────

### 1 · Package / Config Cleanup
```bash
npm uninstall @supabase/supabase-js
rm src/services/supabase.ts
```
Add `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2 · Core Infrastructure
| Item | Deliverable |
|------|-------------|
| **HTTP Client** | `src/services/api-client.ts` – handles token, JSON & file uploads, retries. |
| **Auth Service** | `src/services/auth.ts` – login / register / logout / profile; stores JWT in `localStorage`. |
| **Content Service** | `src/services/edtech-content.ts` – fetch chapters, update via `PUT /chapters`, trigger generation via `/content/generate`. |
| **Knowledge Service** | `src/services/knowledge.ts` – multi-file upload, list knowledge, live status via WS. |
| **Roleplay Service** | `src/services/roleplay.ts` – generate + fetch scenarios. |
| **Analytics Service** | `src/services/analytics.ts` – track events, query aggregates. |

### 3 · UI & Pages
- **Dashboard**: list knowledge, process status (live via WS).  
- **Chapter Viewer**: tabs for notes / summary / quiz / mindmap, edit button → `PUT /chapters`.  
- **Role-play Widget**: choose topic, call roleplay service, display conversation.  
- **Analytics Pages**: progress, completion, engagement charts (Victory / Recharts).  
- **Account Pages**: login, register, profile.

### 4 · State Management & Real-time
- React Context for auth & websocket events.  
- `useKnowledgeStatus(kid)` hook → subscribes to WS, with reconnection.  
- Replace any remaining SWR/fetcher that points to Supabase.

### 5 · Tests & Tooling
- Jest + React Testing Library for components.  
- Cypress end-to-end: upload, process, edit, analytics flow.  
- ESLint + Prettier config clean-up.

### 6 · Migrations / Scripts
No DB migrations on FE, but **NPM scripts**:
```json
"scripts": {
  "dev":   "next dev",
  "build": "next build",
  "start": "next start",
  "test":  "jest",
  "lint":  "eslint . --fix"
}
```

### 7 · Timeline
| Day | Work |
|----:|------|
| 1   | Purge Supabase, set up api-client, auth service. |
| 2   | Knowledge & Content services, file-upload component. |
| 3   | Chapter viewer + editor, WebSocket hook. |
| 4   | Role-play widget + analytics service. |
| 5   | Page rewiring, routing, UX polish. |
| 6   | Unit + E2E tests, CI workflow. |

──────────────────────────────────
### Deliverables Checklist (Front-end)
- [ ] No Supabase imports in repo
- [ ] Live upload + status workflow
- [ ] Chapter CRUD & content generation
- [ ] Roleplay scenarios working
- [ ] Analytics charts display real data
- [ ] 100 % passing tests & lint

──────────────────────────────────
### Success Criteria (Full Project)
1. All endpoints in Phase 1 executable & documented (OpenAPI).  
2. Front-end only talks to `/v2` backend.  
3. Local stack `make up` + `npm run dev` works offline.  
4. CI passes: `make test` (backend) and `npm test` (frontend).  
5. README updated; demo script records successful flow.

🏁  **Done means Done – Supabase is gone, legacy routes removed, codebase slim & local-first.** 