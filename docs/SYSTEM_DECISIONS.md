# AlgoVision — System Decisions

> **Purpose:** Every architecture decision is recorded here with rationale, alternatives considered, and consequences.
> Decisions follow the ADR (Architecture Decision Record) format.
> This file is the decision index — detailed ADRs will live in `docs/adr/` as the system grows.

---

## Decision Index

| ID | Title | Status | Date | Impact |
|---|---|---|---|---|
| ADR-001 | Retain Supabase as Auth/DB/Storage Provider | **Accepted** | 2026-05-26 | Auth, Database, Storage |
| ADR-002 | Modular Monolith Architecture (No Microservices) | **Accepted** | 2026-05-26 | Backend, Deployment |
| ADR-003 | Add Redis for Rate Limiting, Cache, Presence, Pub/Sub | **Accepted** | 2026-05-26 | Infrastructure |
| ADR-004 | Runtime Role Separation (API, Realtime, Worker, Compiler) | **Accepted** | 2026-05-26 | Deployment, Scaling |
| ADR-005 | Stabilization Before Feature Expansion | **Accepted** | 2026-05-26 | Roadmap, All Systems |
| ADR-006 | Async Cached TTS for Voice Narration | **Accepted** | 2026-05-26 | AI Voice, Workers |
| ADR-007 | PostgreSQL Durable Jobs + Redis Dispatch | **Accepted** | 2026-05-26 | Workers, Reliability |
| ADR-008 | FastAPI WebSockets First, Socket.IO Reassess Before Battles | **Accepted** | 2026-05-26 | Realtime |
| ADR-009 | CORS Wildcard for Development Only | **Pending** | 2026-05-31 | Security |

---

## ADR-001: Retain Supabase as Auth/DB/Storage Provider

**Status:** Accepted
**Date:** 2026-05-26
**Owner:** Akif (Team Lead)

### Context
AlgoVision currently uses Supabase for PostgreSQL database, Auth (JWT), and the system works. Alternatives exist (Neon for DB, Clerk for Auth, custom Auth), but switching introduces migration risk, development delay, and new failure modes during a critical stabilization period.

### Decision
Stay on Supabase for Auth, PostgreSQL, and Storage until scale demands migration. Use Supabase Storage for reports, avatars, and narration audio assets.

### Alternatives Considered
- **Neon PostgreSQL** — better serverless Postgres, but loses Supabase Auth/Storage integration
- **Clerk** — better auth UX and management, but adds vendor coupling and migration complexity
- **Custom JWT Auth** — full control but high implementation/maintenance cost
- **Firebase** — not PostgreSQL-native, would require full rewrite

### Consequences
- **Benefits:** Zero migration risk. Auth, DB, and Storage in one vendor. RLS policies already configured. Admin API available for demo account creation.
- **Tradeoffs:** Supabase pricing limits at scale. Service-role key bypasses RLS (requires explicit backend ownership checks). Supabase SDK is synchronous in Python (requires threadpool wrapping).
- **Risks:** Vendor lock-in. Supabase API rate limits during bulk beta onboarding.
- **Migration trigger:** If Supabase pricing exceeds budget, auth reliability degrades, or concurrent connection limits are hit at scale.

---

## ADR-002: Modular Monolith Architecture (No Microservices)

**Status:** Accepted
**Date:** 2026-05-26
**Owner:** Akif (Team Lead)

### Context
The project is evolving from MVP to SaaS. Premature microservices would add service discovery, network failures, distributed tracing, separate deployments, and operational load that the current team cannot sustain.

### Decision
Keep one repo, one coherent codebase. Organize backend into domain modules (`auth`, `profiles`, `visualizations`, `practice`, `compiler`, `analytics`, `gamification`, `leaderboards`, `battles`, `admin`, `billing`, `email`, `reports`, `voice`, `observability`). Separate runtime responsibilities into different process roles from the same codebase.

### Alternatives Considered
- **Microservices** — rejected as premature. Would fragment a small team across multiple deployment targets.
- **Serverless Functions** — doesn't fit long-running WebSocket connections, compiler execution, or TTS generation.

### Consequences
- **Benefits:** Simple deployment, shared code, fast iteration, single CI/CD pipeline.
- **Tradeoffs:** Must maintain domain boundaries through code organization, not infrastructure.
- **Migration trigger:** When specific domains need independent scaling beyond what process roles provide.

---

## ADR-003: Add Redis for Rate Limiting, Cache, Presence, Pub/Sub

**Status:** Accepted
**Date:** 2026-05-26

### Context
The system lacks rate limiting, caching, realtime presence, and pub/sub. PostgreSQL alone cannot efficiently serve these use cases.

### Decision
Add Redis as the coordination and acceleration layer. Redis is NOT the source of durable truth — PostgreSQL remains authoritative. Redis handles: rate limits, cache, presence, sorted set leaderboards, pub/sub fanout, distributed locks, matchmaking queues, and battle room snapshots.

### Alternatives Considered
- **PostgreSQL-only** — too slow for sorted set leaderboard queries, presence TTLs, and pub/sub at scale.
- **In-memory limiters** — not shared across replicas; unsuitable for production.

### Consequences
- **Benefits:** Protects expensive endpoints. Enables realtime features. Reduces DB pressure.
- **Tradeoffs:** New infrastructure dependency. Redis outages must be handled gracefully (fail-open for dev, controlled degradation for production).

---

## ADR-004: Runtime Role Separation

**Status:** Accepted
**Date:** 2026-05-26

### Context
The current backend process handles REST API, algorithm generation, AI calls, PDF generation, and compiler execution in one runtime. This creates resource competition and security risk.

### Decision
Same codebase, deployable as separate process types:
- `api` — REST endpoints, auth, lightweight operations
- `realtime` — WebSocket connections, heartbeat, fanout
- `worker` — email, PDF, TTS, analytics, onboarding, durable jobs
- `compiler-worker` — isolated code execution with no production secrets

### Consequences
- **Benefits:** Compiler execution cannot access production secrets. Workers don't block API capacity. WebSocket connections scale independently.
- **Tradeoffs:** More Docker containers/processes to manage. Requires shared job queue infrastructure.

---

## ADR-005: Stabilization Before Feature Expansion

**Status:** Accepted
**Date:** 2026-05-26

### Context
The MVP works for controlled demos but has production stability gaps: non-deterministic auth, no structured logging, no rate limits, no health checks, wildcard CORS, local temp file storage for reports, no CI/CD gates.

### Decision
No new SaaS features (realtime battles, TTS, payments, admin dashboards, mobile) until stabilization gates are met per STABILIZATION_ROADMAP.md and EXECUTION_MASTERPLAN.md Phase 0.

### Consequences
- **Benefits:** Prevents building features on an unstable foundation. Reduces crash risk during beta.
- **Tradeoffs:** Delays feature delivery. Requires discipline to resist feature drift.

---

## ADR-006: Async Cached TTS for Voice Narration

**Status:** Accepted
**Date:** 2026-05-26

### Context
Live TTS per animation frame would be too slow, expensive, and create synchronization issues.

### Decision
Generate deterministic narration timelines from visualization states. Pre-generate and cache audio segments asynchronously using workers. Play animation and audio against a shared timeline clock. Default TTS engine: Kokoro (Apache-2.0), with Piper as fallback.

### Consequences
- **Benefits:** Cached audio starts quickly. Identical narration reusable across users. Visualizations work without voice in text-only fallback.
- **Tradeoffs:** Requires worker infrastructure, object storage, and job queue before implementation.

---

## ADR-007: PostgreSQL Durable Jobs + Redis Dispatch

**Status:** Accepted
**Date:** 2026-05-26

### Context
FastAPI `BackgroundTasks` is not durable — if the process dies, work is lost. Critical work (emails, reports, TTS, account seeding, billing) must survive process restarts.

### Decision
Use a PostgreSQL `background_jobs` table as the durable source of truth for all important async work. Redis accelerates job dispatch and provides fast queue mechanics. Workers poll/consume from Redis but job state is always recoverable from PostgreSQL.

### Consequences
- **Benefits:** Jobs survive Redis restarts. Admins can inspect failed jobs. Idempotency enforceable.
- **Tradeoffs:** Slightly more complex than Redis-only queues. Requires dedicated worker process.

---

## ADR-008: FastAPI WebSockets First, Socket.IO Reassess Before Battles

**Status:** Accepted
**Date:** 2026-05-26

### Context
AlgoVision needs realtime capabilities for leaderboards, presence, and battles. Socket.IO provides rooms and reconnection but adds dependency complexity.

### Decision
Start with native FastAPI WebSockets for simple realtime features (leaderboards, admin presence). Before building coding battles, reassess Socket.IO for room management complexity. Regardless of transport choice, durable battle state must never live only in socket memory.

### Consequences
- **Benefits:** Lower dependency count initially. FastAPI-native integration.
- **Tradeoffs:** Must implement rooms, reconnection, and heartbeats manually if staying with raw WebSockets.

---

## ADR-009: CORS Wildcard Replacement (Pending)

**Status:** Pending Implementation
**Date:** 2026-05-31

### Context
Current `allow_origins=["*"]` with `allow_credentials=True` is unsafe for production and behaves inconsistently in browsers. Vercel generates dynamic deployment URLs, which made hardcoded origins impractical during initial deployment.

### Decision
Restrict CORS origins by environment:
- **Development:** `localhost:5173`
- **Staging:** specific staging URL
- **Production:** production domain + Vercel preview pattern

### Alternatives Considered
- **Keep wildcard** — unacceptable for production security.
- **Proxy through same origin** — adds infrastructure complexity.

### Consequences
- **Benefits:** Eliminates CORS security risk.
- **Tradeoffs:** Must configure CORS origins per environment. Vercel preview deployments may need a pattern-based CORS check.
