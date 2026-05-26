# AlgoVision SaaS Planning Blueprint

**Document purpose:** Master technical blueprint for evolving AlgoVision from an MVP/FYP into a production-grade SaaS educational platform.

**Planning stance:** Preserve the current React + Vite frontend, FastAPI backend, Supabase PostgreSQL/Auth foundation, backend-generated visualization states, analytics flow, AI tutoring flow, PDF reporting, compiler execution system, and Docker deployment. The next architecture target is a **modular monolith SaaS**, not microservices.

**Repository analyzed:** Current project root, backend routers/services/models/algorithm engines, frontend pages/components/context/API clients, database schema/seed files, Dockerfiles, Docker Compose, docs, and tests.

---

## 1. Current Architecture Analysis

### 1.1 Current System Shape

AlgoVision is currently a decoupled client-server application:

- **Frontend:** React 18 + Vite + Tailwind CSS, using React Router, Axios, Supabase JS client, Chart.js, and custom visualizer components.
- **Backend:** FastAPI + Uvicorn, organized around routers, Pydantic models, stateless algorithm engines, and service modules.
- **Database/Auth:** Supabase PostgreSQL + Supabase Auth. The database has RLS enabled and a `public.users` mirror table linked to `auth.users`.
- **AI Tutor:** Backend calls Groq via `backend/services/groq_service.py`, currently using `settings.GROQ_MODEL` with a computer-science tutor system prompt.
- **Visualization:** Algorithm state generation is backend-driven. Engines return ordered `states[]` arrays plus `performance{}` metrics. Frontend plays states using local timers.
- **Compiler:** `backend/services/compiler_service.py` executes user code locally through subprocesses for Python, C, C++, Java, and JavaScript.
- **Reports:** ReportLab generates PDF bytes; current implementation stores generated PDFs on backend temp disk and records file paths in Supabase.
- **Deployment:** Docker Compose builds a FastAPI backend image with compiler runtimes and a production Nginx-served frontend image.

### 1.2 Backend Structure

Current backend modules:

- `backend/main.py`: Registers routers for auth, arrays, linked lists, AI tutor, compiler, practice, performance, reports, BST, AVL, graphs, and sorting.
- `backend/routers/*`: Thin API layer for auth, visualization operations, compiler execution, practice submissions, performance history/comparison, PDF report generation, and AI tutor queries.
- `backend/algorithms/*_engine.py`: Pure, mostly stateless state-generation engines for arrays, linked lists, BST, AVL, graph BFS/DFS, sorting, binary search, and race mode.
- `backend/services/supabase_service.py`: Central Supabase client and data access helpers for auth verification, profiles, algorithm runs, practice problems, attempts, streaks, and reports.
- `backend/services/groq_service.py`: Groq chat completion integration and follow-up question generation.
- `backend/services/compiler_service.py`: Async wrapper around blocking subprocess execution using a thread executor.
- `backend/services/report_service.py`: ReportLab PDF generation with optional base64 chart embedding.

### 1.3 Frontend Structure

Current frontend modules:

- `frontend/src/App.jsx`: Route registration and protected routes.
- `frontend/src/context/AuthContext.jsx`: Supabase session restoration, auth state listener, backend login/signup wrapper, local token storage.
- `frontend/src/lib/api.js`: Axios client with JWT injection and global 401 redirect.
- `frontend/src/lib/supabaseClient.js`: Supabase browser client.
- `frontend/src/pages/*`: Home, Login, Signup, Visualizer, Trees/Graphs, Sorting/Search, Compiler, AI Tutor, Practice, Performance, Reports.
- `frontend/src/components/Visualizer/*`: Array, linked list, BST, graph, sorting visualizers and animation controls.
- `frontend/src/components/Charts/*`: Chart.js analytics.
- `frontend/src/components/Editor/CodeEditor.jsx`: Browser code editor surface.

The frontend stores animation state locally. It requests generated state arrays from the backend, animates them with `setTimeout`, and asynchronously saves performance metrics through `/performance/save`.

### 1.4 Database Schema

Current `database/schema.sql` includes:

- `users`: Supabase Auth mirror table with email, full name, current streak, longest streak, last active date, and created timestamp.
- `practice_problems`: Seeded problem bank with title, difficulty, description, solution, hints, expected output, language ID.
- `algorithm_runs`: Visualization/performance run history with algorithm, data structure, operation, input size, time, memory, operation count, input replay JSON, and timestamp.
- `practice_attempts`: Submission logs with code, language, status, stdout/stderr, time, memory, timestamp.
- `reports`: PDF report records with `report_file`, `report_type`, and timestamp.

RLS policies exist for user-owned data and public read access to practice problems. The backend uses the Supabase service-role key, which bypasses RLS, so backend-level ownership checks remain important.

### 1.5 Current Auth Flow

Current flow:

1. Frontend signup calls backend `/auth/signup`.
2. Backend first tries `supabase.auth.admin.create_user({ email_confirm: true })`.
3. If admin creation fails due to insufficient privileges, backend falls back to `supabase.auth.sign_up`.
4. Login calls `supabase.auth.sign_in_with_password`, returns Supabase access token to frontend.
5. Frontend stores `access_token` in `localStorage`.
6. Protected backend routes use `get_current_user`, which calls `supabase.auth.get_user(token)`.

This works for MVP, but has production issues:

- Signup behavior differs depending on whether the backend has service-role permissions.
- User-facing signup currently auto-confirms if admin API succeeds, which is useful for demo accounts but not ideal for normal public signup.
- Tokens in `localStorage` are simple to implement but increase impact of XSS.
- CORS allows `*`, which is not acceptable for production.

### 1.6 Current AI Tutor Flow

The AI tutor receives a question plus optional context:

- `current_structure`
- `current_operation`
- `current_step`

The backend sends a concise prompt to Groq and performs a second completion for follow-up questions. The design is simple and effective, but every AI query is currently synchronous from the request path and there is no usage accounting, caching, rate limiting, prompt versioning, audit logging, or fallback provider.

### 1.7 Current Visualization Flow

Current visualization flow:

1. Frontend collects data structure input and operation.
2. Backend engine generates a full `states[]` array and `performance{}` metrics.
3. Frontend stores `states`, advances `currentStep` with timers, and renders the current state.
4. Frontend asynchronously saves performance metrics.

This architecture is a good foundation for voice narration because every animation step already has structured state plus a message. The correct SaaS evolution is to enrich the generated state timeline with narration metadata, not to generate speech live per frame.

### 1.8 Current Compiler Flow

Current compiler flow:

1. Frontend submits code to `/execute` or `/practice/submit`.
2. Backend writes code to a temp directory.
3. Backend compiles if needed.
4. Backend runs code with timeout and captures stdout/stderr.
5. Practice compares stdout to expected output and saves attempts in a FastAPI `BackgroundTasks` task.

This is acceptable for controlled demos, but not production safe. Subprocess execution in the API container creates security, noisy-neighbor, CPU exhaustion, memory exhaustion, filesystem, and lateral-movement risk. The production version must isolate execution in a worker/sandbox boundary.

### 1.9 Current Deployment Structure

Current deployment:

- `docker-compose.yml` starts backend and frontend.
- Backend image includes compiler/runtime tools.
- Frontend builds static assets and serves them through Nginx.
- Supabase and Groq are external managed services.

Missing for production:

- Redis
- background worker
- WebSocket server path
- object storage for reports/audio
- CI/CD workflows
- secrets management policy
- staging/beta/prod environments
- observability
- load testing
- backup/restore procedure
- rate limits

---

## 2. Current Bottleneck And Crash Analysis

### 2.1 Likely Signup/Login Crash Causes

Possible causes based on current implementation:

| Risk | Why It Can Crash Or Fail | Fix Direction |
| --- | --- | --- |
| Mixed admin signup and normal signup | `/auth/signup` changes behavior depending on service-role availability. User messaging says confirm email even when auto-confirmed. | Separate public signup and admin demo-account creation flows. |
| Blocking Supabase SDK calls inside async routes | `supabase-py` calls are synchronous. Under concurrent auth/login usage they can block the event loop. | Wrap sync calls in threadpool or adopt async HTTP client/data layer where needed. |
| Trigger/profile timing | `auth.users` trigger creates `public.users`; immediate profile update may race or silently fail. | Make profile upsert explicit and idempotent after user creation. |
| Broad exception handling | Several exceptions are collapsed into generic 400/401 errors, hiding root causes. | Add structured logging with request IDs and provider error categories. |
| Missing rate limits | Signup/login can be spammed. | Add Redis-backed per-IP and per-email rate limiting. |
| CORS wildcard with credentials | `allow_origins=["*"]` and credentials is unsafe and can behave inconsistently in browsers/proxies. | Restrict origins by environment. |

### 2.2 Current Scaling Bottlenecks

- **API container does too much:** auth proxying, AI calls, PDF generation, compiler execution, algorithm generation, analytics, and future realtime would all compete in one process.
- **No queue:** AI/TTS/PDF/compiler jobs can block request capacity.
- **No Redis:** no shared cache, session presence, rate limiting, distributed locks, or leaderboard sorted sets.
- **No WebSocket layer:** realtime battles, leaderboards, voice sync, and admin live monitoring cannot scale cleanly through polling.
- **Temp-disk PDF storage:** reports disappear on container restart or replica changes.
- **No object storage layer:** future generated voice/audio/report assets need stable storage with TTL and signed URLs.
- **No observability:** crashes are difficult to diagnose because there is no structured log, trace, metric, or error reporting pipeline.
- **Local subprocess execution:** one malicious or accidental heavy submission can consume API CPU/memory.

### 2.3 Reliability Bottlenecks

- Lack of explicit startup checks for Supabase/Groq configuration.
- No DB migrations framework.
- No health checks that validate dependencies.
- Background work uses FastAPI `BackgroundTasks`, which is not durable. If the process dies, work is lost.
- No idempotency keys for account seeding, report generation, email sends, or payments.

### 2.4 Architecture Reality Audit

The original SaaS direction is valid, but several parts can fail if implemented too literally. This section is the correction layer: it identifies unrealistic assumptions, hidden debt, and production failure modes before implementation begins.

| Area | Risk | Why It Is Dangerous | Required Correction |
| --- | --- | --- | --- |
| FastAPI WebSockets on generic PaaS | Some hosts support WebSockets poorly, sleep free instances, or interrupt long-lived connections. | Battles and synchronized sessions will appear flaky even if app code is correct. | Select hosting with explicit WebSocket support, disable free-tier sleep for realtime envs, add reconnect/resume protocol. |
| Redis as queue + pub/sub + cache + leaderboard | Treating Redis as if it were durable storage can lose events. | Pub/sub drops messages for disconnected consumers; queue failures can lose TTS/email/battle events if not modeled. | Use Postgres job/event tables for durable truth; Redis accelerates delivery and live state only. |
| Supabase service-role backend | Service role bypasses RLS. | A backend bug can expose or mutate cross-user data despite RLS policies. | Add explicit ownership checks in every service method; add admin audit logs; prefer scoped queries. |
| Local compiler worker | Moving subprocesses to a worker is not enough by itself. | The worker can still be escaped or exhausted if it has network, root, broad filesystem, or no cgroups. | Run execution in non-root, network-disabled, resource-limited containers or sandbox tooling. |
| TTS model recommendation | TTS licenses and inference footprints vary quickly. | A model may be unsuitable for commercial use or too slow/expensive on CPU. | Benchmark quality/latency/cost and complete license review before choosing a production default. |
| Object storage migration | Moving reports/audio to storage fixes temp disk, but introduces signed URL expiry and access-control issues. | Users may see broken downloads or leaked assets. | Store object keys, not public URLs; generate short-lived signed URLs after authorization. |
| Frontend local state | Current pages keep complex async state manually in `useState`. | Race conditions, duplicated fetches, stale auth state, and painful cache invalidation will grow quickly. | Introduce TanStack Query for server state and a small domain store only where needed. |
| Analytics tables | Raw event growth can become expensive and slow. | Performance history, practice attempts, battle events, and telemetry will grow without retention/partitioning. | Add retention policy, indexes, rollups, and optional monthly partitioning before public beta. |
| Emailing credentials | Emailing temporary passwords is convenient but sensitive. | Mailboxes can be compromised; users may forward credentials. | Prefer one-time magic setup links when feasible; if passwords are emailed, force reset and expire quickly. |
| Payments roadmap | Stripe is straightforward only if product entitlements are simple. | Webhook retries, plan changes, trials, failed payments, and refunds create edge cases. | Build a local entitlement service backed by Stripe webhook state, not direct Stripe reads from feature gates. |

### 2.5 Unrealistic Architecture Decisions To Avoid

- **Do not put REST, WebSockets, TTS inference, compiler execution, PDF generation, and admin analytics in one runtime process.** The codebase can remain a modular monolith, but runtime roles must be separated into API, realtime-capable API, worker, and execution worker containers.
- **Do not assume one Redis instance can safely replace durable job storage.** Redis is excellent for speed, but the authoritative job/event state should exist in Postgres for account seeding, payments, email, battles, reports, and TTS.
- **Do not assume CPU TTS will be acceptable for all voices.** CPU TTS is useful for beta and pre-generation, but latency, concurrency, and quality must be benchmarked before promising realtime-grade UX.
- **Do not ship battle mode before compiler isolation is solved.** A battle feature amplifies hostile input volume and competitive abuse.
- **Do not build institutional SaaS before single-user beta telemetry is trustworthy.** Admin dashboards and payments should come after usage, crash, and cost visibility exist.

### 2.6 Hidden Technical Debt In The Current Codebase

- **Synchronous Supabase SDK usage:** Several async FastAPI routes call synchronous Supabase methods. This can block the event loop under concurrent usage.
- **Service layer lacks ownership guardrails:** The Supabase service centralizes data access but currently assumes callers pass safe user IDs.
- **No repository/data-access boundary:** Query logic is mixed into `supabase_service.py`; this will become hard to test as domains grow.
- **No migration lifecycle:** Schema is SQL-file based, not versioned per release.
- **No domain event model:** XP, streaks, leaderboard, email, and analytics need event records instead of direct scattered mutations.
- **Frontend API state is manual:** Pages fetch directly and manage loading/error/cache state independently.
- **PDF files are session-local:** Current report records point to local temp paths, which break on restart or multi-replica deployments.
- **Compiler status mismatch:** The compiler returns `"Time Limit Exceeded"`, while practice checks for `"Timeout"` in one branch; production code should normalize statuses centrally.
- **Token storage risk:** `localStorage` token persistence is easy but sensitive to XSS.
- **No environment parity:** Current Docker Compose is useful, but beta/staging/prod are not yet represented as first-class configs.

### 2.7 Likely Deployment Failures

- **Frontend build-time env mismatch:** Vite variables are baked at build time. If `VITE_API_BASE_URL` or Supabase env vars are wrong during image build, changing container env later will not fix the deployed frontend.
- **Backend env path mismatch:** `backend/config.py` loads root `.env`, while Docker Compose uses `backend/.env`. This can behave differently between local and container runs.
- **WebSocket reverse proxy timeouts:** Nginx/load balancer defaults may close idle battle/session sockets without heartbeat tuning.
- **Free-tier sleep:** Render/Railway-like free deployments can sleep, breaking scheduled workers, WebSockets, and delayed feedback emails.
- **Missing compilers in runtime variants:** Any alternate backend image must include `gcc`, `g++`, Node, Java, and Python if compiler execution remains supported.
- **Report/audio files lost on replica change:** Local temp paths cannot survive container replacement.
- **Supabase API rate limits:** Auth admin seeding, profile upserts, and analytics reads can hit provider limits during bulk beta onboarding.
- **CORS and cookie/security headers:** Wildcard CORS plus credentials and missing secure headers can fail browser/security expectations.

### 2.8 Backend Bottlenecks

- Blocking external SDK calls in async routes.
- Groq calls happen synchronously in the request path.
- AI follow-up generation doubles provider calls per chat message.
- Algorithm engines return full state arrays; large visualizations can create large payloads and high memory usage.
- Practice submissions execute code in a threadpool from API context.
- Report generation can consume CPU/memory and currently writes local files.
- No connection pooling or retry/circuit-breaker policy is documented for Supabase/Groq/email/storage.
- No backpressure: expensive endpoints can be called repeatedly by the same user.

### 2.9 Frontend Bottlenecks

- Manual `useState`/`useEffect` fetching will not scale to admin dashboards, realtime rooms, leaderboards, and profile state.
- Animation state arrays are fully held in memory; voice timelines and large race modes will increase memory pressure.
- `setTimeout` animation can drift relative to audio and browser throttling.
- Axios global 401 redirect can disrupt background calls and WebSocket reconnect flows.
- `localStorage` token storage increases XSS blast radius.
- Chart-to-base64 PDF generation can create large request payloads.
- No offline/retry model for flaky networks, important for mobile and battles.

### 2.10 Realtime Architecture Risks

- Redis pub/sub has no replay; disconnected clients miss events.
- Battle timers cannot trust client clocks.
- WebSocket authentication must be refreshed or revalidated on long sessions.
- Multiple tabs from the same user can create duplicate battle/session connections.
- Reconnect must restore state from Redis/Postgres, not local server memory.
- Backpressure is needed when a client cannot consume messages fast enough.
- Presence based only on disconnect events is unreliable; use heartbeat TTLs.
- Realtime events must be idempotent because reconnects and retries can duplicate messages.
- Horizontal scaling requires a clear connection manager and Redis fanout design before multi-replica deployment.

### 2.11 Missing Security Considerations

- Content Security Policy for the React app.
- XSS hardening before storing auth tokens in browser-accessible storage.
- CSRF model if moving to httpOnly cookie sessions.
- WebSocket origin and token validation.
- Object storage authorization and signed URL expiry.
- PII retention policy for beta applications, university/semester fields, and feedback.
- Consent language for beta analytics, email follow-ups, and suspicious activity tracking.
- Secrets rotation policy.
- Admin action approval for bulk account creation and role changes.
- Dependency scanning and container image vulnerability scanning.
- Abuse limits for AI prompts, TTS text length, compiler source size, and PDF chart image payloads.
- Legal/license review for TTS models before monetization.

### 2.12 Missing Observability Systems

- Request correlation ID propagated from frontend to backend to workers.
- Structured logs with user ID, route, latency, status, and provider error class.
- Metrics for queue depth, job age, retry count, and dead-letter count.
- WebSocket connection count, reconnect count, room count, dropped message count, and heartbeat failures.
- AI token usage, latency, error rate, and estimated cost per user/plan.
- TTS generation duration, cache hit rate, audio storage size, and failed segment count.
- Compiler execution duration, timeout rate, language distribution, and sandbox kill reasons.
- Supabase query latency/error metrics where possible.
- Frontend real user monitoring: page load, route errors, API latency, WebSocket reconnects.
- Alerting thresholds and incident response runbooks.

### 2.13 Corrected Implementation Priorities

Before adding major new product surfaces, implement in this order:

1. **Stabilize runtime and security:** CORS, env parity, health checks, structured logs, request IDs, rate limits, report storage.
2. **Create durable work system:** Postgres job table + Redis queue acceleration + worker process + dead-letter handling.
3. **Isolate dangerous execution:** compiler worker sandbox with resource limits before battles.
4. **Add observability:** Sentry, backend metrics, queue metrics, frontend RUM, WebSocket metrics.
5. **Build beta onboarding:** exact-email account creation, email workflow, audit logs, feedback tracking.
6. **Then add realtime/gamification:** leaderboards and profile XP are safer than battle rooms.
7. **Then add voice:** manifest/timeline first, TTS after benchmark/license decision.

---

## 3. SaaS Evolution Strategy

### 3.1 Target Architecture

The next target is:

**React + FastAPI modular monolith + PostgreSQL/Supabase + Redis + background workers + WebSockets + object storage + CI/CD + observability.**

Important runtime clarification:

- **API runtime:** REST endpoints, auth validation, lightweight visualization state generation, profile reads, admin APIs.
- **Realtime runtime:** WebSocket endpoints, connection manager, heartbeat handling, Redis fanout. This may be the same codebase/image as the API but should be deployable as a separately scaled process if realtime load grows.
- **General worker runtime:** email, PDF, TTS orchestration, analytics rollups, leaderboard snapshots, account seeding.
- **Execution worker runtime:** compiler/practice/battle code execution in a hardened sandbox. This must not share the same privilege profile as the API runtime.

Do not split into microservices yet. Instead, create internal backend domains:

- `auth_identity`
- `profiles`
- `visualizations`
- `voice_narration`
- `practice`
- `compiler`
- `analytics`
- `gamification`
- `leaderboards`
- `battles`
- `admin`
- `billing`
- `email`
- `reports`
- `observability`

Each domain should have routers, services, schemas/models, DB migrations, and tests. This keeps deployment simple while preventing the backend from becoming a single unstructured file tree.

### 3.2 Recommended Final Stack

| Layer | Recommended Choice | Why | Tradeoffs | Complexity |
| --- | --- | --- | --- | --- |
| Frontend | Existing React + Vite | Already built, fast iteration, compatible with mobile via shared API contracts. | Needs state/query discipline as app grows. | Low |
| API | Existing FastAPI | Strong async support, Python AI ecosystem, current codebase already uses it. | Must isolate blocking work. | Low |
| DB/Auth | Stay on Supabase PostgreSQL/Auth | Current system is relational and auth already works. Avoid migration risk. | Supabase vendor coupling and pricing limits. | Low |
| Cache/Realtime state | Redis | Rate limiting, queues, leaderboards, presence, locks, matchmaking. | New infra dependency. | Medium |
| Queue | Postgres job table + Dramatiq/Redis dispatch first, Celery later if needed | Keeps durable job state while Redis provides fast delivery. | More moving parts than Redis-only queues. | Medium |
| WebSockets | FastAPI WebSockets + Redis streams/pubsub with replayable room snapshots | Keeps modular monolith, supports battles and live leaderboards. | Multi-replica requires WebSocket-capable hosting, heartbeats, reconnection, and fanout testing. | Medium/High |
| Object storage | Supabase Storage first | Same vendor, signed URLs, good enough for reports/audio. | For very high scale, move assets to S3/R2. | Low |
| AI tutor | Groq as current provider, add provider abstraction | Preserves current flow and allows fallback/rate accounting. | External rate limits/costs. | Medium |
| TTS | Benchmark Kokoro/Piper first; choose production default only after license and latency review | Avoids committing to a model before commercial/legal/performance validation. | More upfront evaluation work. | Medium/High |
| Email | Resend first, SMTP fallback | Good developer experience for transactional onboarding/feedback. | Verify current pricing and sender-domain limits before launch. | Low |
| Payments | Stripe | Standard SaaS subscriptions, webhooks, invoices, customer portal. | Requires careful webhook/idempotency handling. | Medium |
| Observability | Sentry + OpenTelemetry + Prometheus/Grafana or hosted logs | Crash visibility and latency/cost tracking. | Hosted observability can become costly. | Medium |
| CI/CD | GitHub Actions | Native to repo, free minutes for many cases. | Needs secrets and environment protection. | Medium |

---

## 4. Realtime Architecture

### 4.1 Realtime Requirements

AlgoVision needs realtime for:

- synchronized voice-guided visualizations
- live leaderboards
- XP/streak updates
- multiplayer coding battles
- battle timers
- battle submissions/results
- admin active sessions
- suspicious activity events

### 4.2 WebSocket Gateway Inside Modular Monolith

Add a FastAPI WebSocket router:

- `/ws/session/{session_id}` for visualization/narration sync.
- `/ws/leaderboards/{scope}` for leaderboard updates.
- `/ws/battles/{battle_id}` for 1v1 battles.
- `/ws/admin/live` for admin monitoring.

Use Redis for:

- pub/sub across backend replicas
- presence sets
- battle room state
- match queues
- distributed locks
- leaderboard sorted sets

### 4.3 Why Not Microservices Yet

Microservices would add service discovery, network failures, distributed tracing complexity, separate deployments, separate data ownership, and more operational load. The current team needs production stability first. A modular monolith with Redis/workers gives most scaling benefits without premature fragmentation.

### 4.4 Deployment Implications

- Single codebase can serve REST and WebSockets initially, but production deployment should allow separate `api` and `realtime` process types from the same image.
- Add Redis as a managed service or sidecar in development.
- For multiple API replicas, configure load balancer WebSocket support.
- Prefer sticky sessions for battle rooms initially, but do not rely on local memory as the source of truth.
- Store room state in Redis with TTL so reconnects work.
- Configure heartbeat interval, idle timeout, max connection age, and reconnect/resume behavior explicitly.
- Validate the chosen host supports long-lived WebSocket connections before building battles on it.

### 4.5 Realtime Correctness Rules

- Server time is authoritative for battles and synchronized sessions.
- Every WebSocket event must have `event_id`, `room_id`, `server_timestamp`, and `sequence`.
- Clients acknowledge sequence numbers so the server can detect missed events.
- Room snapshots must be recoverable from Redis/Postgres after reconnect.
- Redis pub/sub is acceptable for fanout, but battle-critical state transitions must also be written to Postgres or Redis Streams.
- A disconnected client must be able to resume from the latest snapshot, not from replaying local browser state.
- Multiple tabs from the same user must either be blocked for battles or assigned a primary/secondary connection role.

---

## 5. Redis Strategy

### 5.1 Redis Responsibilities

Use Redis for:

- Rate limits: auth, AI tutor, compiler, report generation, email sending.
- Cache: user profile snapshots, practice problem lists, leaderboard pages.
- Queues: TTS jobs, report jobs, email jobs, compiler jobs.
- Leaderboards: sorted sets by XP, battle rating, monthly score, weekly score.
- Realtime: pub/sub or streams for WebSocket fanout.
- Presence: active users, active battle participants, admin session counts.
- Locks: account seeding idempotency, battle matching, billing webhook processing.

### 5.2 Redis Data Patterns

Suggested keys:

- `rl:auth:ip:{ip}` with TTL
- `rl:ai:user:{user_id}:{day}`
- `profile:{user_id}` JSON cache, 5-15 minute TTL
- `practice:problems:v1` JSON cache, 1 hour TTL
- `lb:xp:global`
- `lb:xp:weekly:{yyyy_ww}`
- `lb:battle:rating`
- `battle:room:{battle_id}` JSON state, TTL 24 hours
- `presence:user:{user_id}` heartbeat key, TTL 60 seconds
- `queue:tts`, `queue:email`, `queue:reports`, `queue:compiler`

### 5.3 Tradeoffs

- Redis introduces operational dependency, but it removes pressure from Postgres and enables realtime product features.
- Redis should not become the source of permanent truth. Durable records stay in Postgres.
- For free/cost-efficient deployment, Upstash Redis is good for beta; self-hosted Redis is viable in Docker for development; managed Redis is preferred for production.
- Redis pub/sub is not a durable event bus. Use it only for live fanout where missed messages can be repaired by fetching a snapshot.
- If using Redis as a queue backend, persist user-visible job records in Postgres with statuses: `queued`, `running`, `succeeded`, `failed`, `dead_lettered`, `cancelled`.

### 5.4 Durable Job Table

Add a generic job table before relying on workers for critical flows:

```sql
create table background_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status text not null default 'queued',
  idempotency_key text unique,
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  last_error text,
  scheduled_for timestamptz default now(),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_background_jobs_status_scheduled
  on background_jobs(status, scheduled_for);
```

Why:

- Jobs survive Redis restarts.
- Admins can inspect failed onboarding/email/TTS/report jobs.
- Idempotency is enforceable for account seeding, email sends, report generation, and Stripe webhooks.

---

## 6. AI Voice-Guided Visualization Architecture

### 6.1 Core Principle

Do **not** generate TTS live per frame.

Generate a deterministic narration timeline from the visualization states, pre-generate or cache audio segments, then play animation and audio against a shared timeline clock.

### 6.2 Recommended TTS Stack

| Model | Recommendation | Why | Tradeoffs |
| --- | --- | --- | --- |
| Kokoro | Default SaaS narration engine | Small model, fast generation, good quality, permissive ecosystem reports, practical for generated educational narration. | Needs validation for exact model/license version before commercial launch. |
| Piper | Edge/offline fallback and ultra-low-cost worker | Very fast local neural TTS, good for CPU generation and deterministic voices. | Less expressive than larger neural models. |
| XTTS-v2 | Premium voice cloning or multilingual experiments only | Strong multilingual/voice cloning capability. | Heavier GPU needs and Coqui Public Model License requires careful commercial review. |
| StyleTTS2 | Research/quality experiment | High-quality architecture and expressive generation. | More complex inference/ops; not first production choice. |
| NVIDIA NeMo TTS | Enterprise/GPU path | Mature speech AI framework; Apache-licensed toolkit. | Operationally heavier; GPU infrastructure likely needed. |
| HuggingFace hosted models | Prototype and benchmarking | Fast experimentation. | Latency, cold starts, quotas, and licensing vary by model. |

Source notes to verify before implementation:

- Supabase admin user creation supports `email_confirm`/`phone_confirm` flags in admin APIs: https://supabase.com/docs/reference/dart/auth-admin-createuser
- Piper is a fast local neural TTS project: https://github.com/rhasspy/piper
- StyleTTS2 paper/code describe style diffusion TTS: https://arxiv.org/abs/2306.07691 and https://github.com/yl4579/StyleTTS2
- NVIDIA NeMo includes speech/TTS tooling and Apache 2.0 toolkit licensing: https://github.com/NVIDIA/NeMo
- Kokoro model/license must be verified against the exact HuggingFace model card before commercial use: https://huggingface.co/hexgrad

### 6.3 Narration Data Model

Add tables:

```sql
create table visualization_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  algorithm text not null,
  operation text not null,
  input_data jsonb not null,
  states jsonb not null,
  timeline jsonb not null,
  created_at timestamptz default now()
);

create table narration_assets (
  id uuid primary key default gen_random_uuid(),
  narration_hash text not null unique,
  tts_provider text not null,
  voice_id text not null,
  text text not null,
  audio_storage_key text not null,
  duration_ms integer,
  created_at timestamptz default now()
);

create table visualization_narration_segments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references visualization_sessions(id) on delete cascade,
  step_index integer not null,
  start_ms integer not null,
  duration_ms integer not null,
  narration_text text not null,
  narration_asset_id uuid references narration_assets(id),
  sync_policy text default 'wait_for_audio',
  unique(session_id, step_index)
);
```

### 6.4 Narration Generation Flow

1. Backend algorithm engine returns `states[]`.
2. Narration planner converts each state into concise educational narration text.
3. Text is normalized and hashed with `{model, voice, text, speed}`.
4. Backend checks `narration_assets` and object storage.
5. Missing segments are enqueued as TTS jobs.
6. Worker generates audio, stores it in Supabase Storage/R2/S3, and records duration.
7. Frontend receives a timeline manifest:

```json
{
  "session_id": "...",
  "states": [],
  "segments": [
    {
      "step_index": 0,
      "start_ms": 0,
      "duration_ms": 1800,
      "text": "We start with five array elements.",
      "audio_url": "signed-url"
    }
  ]
}
```

### 6.5 Synchronization Strategy

Use one master timeline clock in the frontend:

- Do not let animation timer and audio playback run independently.
- Use `AudioContext.currentTime` or media element timestamps as the master clock.
- Each visualization state has `start_ms` and `end_ms`.
- Animation renders the state whose window contains current timeline time.
- If audio buffers are not ready, show silent/text mode or wait at segment boundary depending on `sync_policy`.

### 6.6 Caching Strategy

- Cache by normalized narration hash globally, not per user.
- Store audio in object storage with CDN caching.
- Pre-generate common algorithm demos for unauthenticated onboarding.
- For custom inputs, generate segments asynchronously and stream progress over WebSocket.
- Use Redis to dedupe concurrent generation: `lock:tts:{hash}`.

### 6.7 Deployment Implications

- Add TTS worker container.
- Start CPU-based Kokoro/Piper first.
- Add GPU worker only when user volume or quality demands it.
- Store audio outside API container.
- Add job status endpoint and WebSocket progress events.

### 6.8 Complexity And Tradeoffs

- Complexity: Medium for manifest/timeline, High for high-quality TTS infrastructure.
- Main risk: audio desync. Mitigation: timeline-first design with measured audio durations.
- Main cost risk: TTS compute/storage. Mitigation: aggressive segment caching and pre-generation.
- Browser risk: background tabs throttle timers. Mitigation: drive visual state from audio/current timeline time, not `setTimeout`.
- Product risk: long narration slows learning flow. Mitigation: keep per-step narration short and allow text-only, voice-off, and speed controls.
- Legal risk: model and voice licenses can block monetization. Mitigation: complete license review before enabling voice on paid plans.

---

## 7. Gamification And Community Leaderboards

### 7.1 Gamification Events

Create an event-driven points system. Do not directly mutate XP from scattered code paths.

Core event types:

- `visualization_completed`
- `practice_attempt_submitted`
- `practice_problem_accepted`
- `daily_streak_continued`
- `battle_joined`
- `battle_won`
- `battle_lost`
- `battle_draw`
- `badge_awarded`
- `report_generated`

### 7.2 Database Evolution

```sql
alter table public.users
  add column if not exists username text unique,
  add column if not exists avatar_url text,
  add column if not exists university text,
  add column if not exists department text,
  add column if not exists semester text,
  add column if not exists xp integer default 0,
  add column if not exists rank_tier text default 'Bronze',
  add column if not exists battle_rating integer default 1000,
  add column if not exists role text default 'user',
  add column if not exists updated_at timestamptz default now();

create table gamification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  event_type text not null,
  points integer not null default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table badges (
  id serial primary key,
  code text unique not null,
  name text not null,
  description text not null,
  icon text,
  rule jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table user_badges (
  user_id uuid references public.users(id) on delete cascade,
  badge_id integer references badges(id) on delete cascade,
  awarded_at timestamptz default now(),
  primary key(user_id, badge_id)
);

create table leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  period_start date not null,
  period_end date not null,
  rankings jsonb not null,
  created_at timestamptz default now()
);
```

### 7.3 Redis Leaderboard Strategy

Use sorted sets:

- `lb:xp:global`
- `lb:xp:weekly:{year}:{week}`
- `lb:xp:monthly:{year}:{month}`
- `lb:battle:rating`
- `lb:tournament:{id}`

Postgres remains source of truth. Redis serves fast rank reads and realtime updates.

### 7.4 Ranking Algorithm

For V1 gamification:

- visualization completed: +5 XP
- practice attempt: +2 XP
- accepted easy: +20 XP
- accepted medium: +40 XP
- accepted hard: +70 XP
- daily streak continuation: +10 XP
- battle win: +50 XP
- battle loss: +10 XP

For battles, use Elo/Glicko-style rating separately from XP. XP measures engagement; battle rating measures skill.

### 7.5 Realtime Updates

When a gamification event is committed:

1. Insert `gamification_events`.
2. Update `users.xp` transactionally.
3. Update Redis sorted sets.
4. Publish WebSocket event to user and leaderboard subscribers.

### 7.6 Tradeoffs

- Event ledger adds complexity but makes XP auditable and reversible.
- Redis sorted sets are fast but need rebuild jobs if Redis is flushed.
- Weekly/monthly leaderboards increase engagement but require anti-abuse checks.

---

## 8. Realtime 1v1 Coding Battles

### 8.1 Battle V1 Scope

V1 should be simple and reliable:

- 1v1 matchmaking by rating bucket.
- Same problem for both players.
- Fixed timer.
- Hidden test cases.
- Submissions executed by isolated worker.
- Score based on correctness, time-to-accepted, runtime, memory, and attempts.
- WebSocket room for timer, presence, submission status, and result reveal.

### 8.2 Battle Database Schema

```sql
create table battle_problems (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  difficulty text not null,
  prompt text not null,
  starter_code jsonb default '{}'::jsonb,
  public_examples jsonb default '[]'::jsonb,
  hidden_tests jsonb not null,
  time_limit_seconds integer default 900,
  created_at timestamptz default now()
);

create table battles (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'waiting',
  problem_id uuid references battle_problems(id),
  started_at timestamptz,
  ended_at timestamptz,
  winner_user_id uuid references public.users(id),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table battle_participants (
  battle_id uuid references battles(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  rating_before integer,
  rating_after integer,
  score numeric default 0,
  status text default 'joined',
  joined_at timestamptz default now(),
  primary key(battle_id, user_id)
);

create table battle_submissions (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid references battles(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  code text not null,
  language_id integer not null,
  status text not null,
  passed_tests integer default 0,
  total_tests integer default 0,
  execution_time_ms numeric,
  memory_usage_kb numeric,
  submitted_at timestamptz default now()
);

create table suspicious_activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  battle_id uuid references battles(id) on delete cascade,
  event_type text not null,
  severity text default 'low',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
```

### 8.3 Matchmaking Architecture

Use Redis queues:

- `matchmaking:queue:{rating_bucket}`
- `matchmaking:lock:{user_id}`

Flow:

1. User clicks battle.
2. Backend validates user is not already in a battle.
3. User is placed in Redis sorted set by enqueue timestamp.
4. Matchmaker worker scans nearby rating buckets.
5. Worker creates `battles` row and `battle_participants`.
6. Worker publishes WebSocket `match_found`.

### 8.4 Battle Room State

Store canonical ephemeral room state in Redis:

```json
{
  "battle_id": "...",
  "status": "running",
  "server_start_ms": 123456789,
  "duration_ms": 900000,
  "participants": {
    "user_a": { "connected": true, "score": 0 },
    "user_b": { "connected": true, "score": 0 }
  }
}
```

Postgres stores durable final records. Redis stores live state.

### 8.5 Scoring

Suggested V1 score:

```text
score =
  correctness_points
  + time_bonus
  + performance_bonus
  - failed_attempt_penalty
  - suspicious_activity_penalty
```

Correctness should dominate. Performance should break ties, not encourage unsafe micro-optimizations.

### 8.6 Anti-Cheat

V1:

- tab visibility change events
- copy/paste count
- focus loss count
- multiple submissions with identical code fingerprints
- abnormal execution patterns
- server-side hidden tests

V2:

- plagiarism similarity against other battle submissions
- suspicious timing models
- device/browser fingerprint risk score
- replay/audit view for admins

V3:

- proctored institutional mode
- webcam/screen sharing only if legally and ethically appropriate

### 8.7 Secure Execution

Do not run battle submissions in the API container.

Recommended progression:

- V1 beta: dedicated compiler worker container with CPU/memory limits, no network, temp filesystem, strict timeout.
- V2: nsjail/firejail/gVisor/Kata Containers depending hosting support.
- V3: separate execution fleet or managed Judge0-style isolated runner.

Minimum execution-worker requirements before battles:

- Non-root user inside the container.
- Read-only root filesystem where possible.
- Network disabled for submitted code.
- CPU, memory, process, file-size, stdout/stderr, and wall-clock limits.
- Per-submission temporary directory deleted after execution.
- Process-tree termination on timeout.
- Source-code size limit before writing to disk.
- Separate worker queue from normal API tasks.
- No Supabase service-role key, Groq key, Stripe key, or email key inside the execution container.
- Structured execution audit for timeout, compile error, runtime error, sandbox kill, and suspicious behavior.

### 8.8 Battle Phases

| Phase | Features | Complexity |
| --- | --- | --- |
| V1 | 1v1 rooms, same problem, WebSocket timer, hidden tests, result reveal, basic Elo | Medium |
| V2 | rating buckets, rematch, battle history, spectator/admin monitor, suspicious activity dashboard | High |
| V3 | tournaments, teams, institutional leagues, advanced anti-cheat, execution fleet | Very High |

---

## 9. SaaS Stabilization And Scaling Roadmap

### 9.1 Immediate Stabilization

1. Restrict CORS by environment.
2. Separate public signup from admin-created demo accounts.
3. Add structured logs with request IDs.
4. Add Redis-backed rate limiting for auth, AI, compiler, reports.
5. Move reports to Supabase Storage.
6. Add DB migrations with Alembic or Supabase migrations.
7. Add API startup config validation.
8. Add `/health/live` and `/health/ready`.
9. Wrap blocking Supabase calls or isolate them to sync endpoints/threadpool.
10. Add global exception logging.
11. Normalize compiler statuses across compiler/practice/battle paths.
12. Add request payload limits for source code, chart images, AI prompts, and TTS text.
13. Add dependency and container vulnerability scans to CI.
14. Add frontend error tracking and real user monitoring before beta.

### 9.2 Async Worker Roadmap

Move these out of request path:

- PDF generation
- TTS generation
- onboarding account seeding
- email sending
- feedback campaign scheduling
- compiler execution for practice/battles
- leaderboard snapshot jobs
- analytics rollups

Recommended first worker stack:

- Redis
- Dramatiq
- `backend/workers/*`
- Job tables for durable status where user-visible

Celery is acceptable if the team prefers its ecosystem, but Dramatiq is simpler for this stage.

### 9.3 Hosting Options

| Option | Best Use | Pros | Cons |
| --- | --- | --- | --- |
| Railway | Beta API/workers/Redis | Simple deploys, good DX. | Costs can rise; resource limits. |
| Render | API/frontend workers | Stable PaaS, simple cron/jobs. | Free instances sleep; WebSocket behavior depends plan. |
| Supabase | DB/Auth/Storage/Edge functions | Already integrated. | Keep service-role key backend-only. |
| Neon | Alternative Postgres | Strong branching/serverless Postgres. | Migrating from Supabase DB not needed now. |
| Upstash | Redis beta | Serverless Redis, low ops. | Per-command pricing/limits. |
| Cloudflare | CDN, DNS, WAF, Turnstile, R2 | Excellent edge/security/cost. | Workers architecture is separate from FastAPI. |
| GitHub Actions | CI/CD | Native and cost-efficient. | Need careful secrets/environment setup. |

Final beta recommendation: **Supabase + a WebSocket-capable API host + Upstash/managed Redis + Cloudflare DNS/CDN + GitHub Actions**.

Railway/Render can be viable, but do not choose either blindly for realtime workloads. Before committing, verify:

- WebSocket support and idle timeout.
- Whether the selected plan sleeps.
- Worker process support.
- Private networking between API, workers, and Redis.
- Log retention and metrics access.
- Rollback support.

If battles become central to the product, prioritize a host with predictable always-on containers over the cheapest free-tier option.

---

## 10. Authentication And Database Strategy

### 10.1 Recommendation

Stay on Supabase Auth + PostgreSQL.

Why:

- Current app already uses Supabase Auth and Supabase Postgres.
- The domain is relational and analytics-heavy.
- RLS and Auth integration are valuable.
- Migration would burn time without solving the immediate production issues.

### 10.2 Auth Alternatives

| Option | Recommendation | Why |
| --- | --- | --- |
| Supabase Auth | Keep | Already integrated; supports admin APIs, JWTs, email auth, OAuth, RLS integration. |
| Clerk | Consider later for enterprise UX | Great hosted auth UX, but adds vendor cost and migration complexity. |
| Auth.js | Not ideal for current FastAPI-centric backend | Better fit for Next.js stacks. |
| BetterAuth | Watch, not immediate | Promising but unnecessary migration now. |
| Custom auth | Avoid | Security burden is too high for startup stage. |

### 10.3 Production Auth Improvements

- Restrict public signup with captcha/Turnstile.
- Add email confirmation for normal users.
- Keep admin-created demo accounts auto-confirmed only for beta workflow.
- Add roles: `user`, `beta_tester`, `instructor`, `admin`, `super_admin`.
- Add a `user_roles` or `memberships` table if institutions are added.
- Add refresh-token strategy review. Consider httpOnly secure cookies if the backend becomes the auth session broker.
- Add audit logs for admin actions.
- Add WebSocket auth validation using short-lived access tokens and server-side reconnect checks.
- Add explicit backend ownership checks because service-role queries bypass RLS.
- Add a session invalidation plan for banned users, compromised accounts, and role changes.
- Document whether the product uses browser `localStorage` tokens or httpOnly cookies; do not mix both models casually.

---

## 11. Demo User Testing And Beta Onboarding System

### 11.1 Goals

The beta system must:

- collect real user applications
- create demo accounts for the exact submitted emails
- auto-verify those accounts
- generate temporary passwords
- send onboarding email automatically
- track onboarding status
- follow up after 1-2 weeks
- collect feedback and expose analytics to admins

### 11.2 Database Schema

```sql
create table beta_applications (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  university text,
  department text,
  semester text,
  interests jsonb default '[]'::jsonb,
  status text not null default 'submitted',
  submitted_at timestamptz default now(),
  approved_at timestamptz,
  created_user_id uuid references public.users(id)
);

create table demo_accounts (
  id uuid primary key default gen_random_uuid(),
  beta_application_id uuid references beta_applications(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  email text not null unique,
  temp_password_hash text not null,
  password_expires_at timestamptz not null,
  must_reset_password boolean default true,
  status text not null default 'created',
  created_at timestamptz default now()
);

create table email_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  beta_application_id uuid references beta_applications(id),
  provider text not null,
  template_key text not null,
  to_email text not null,
  status text not null,
  provider_message_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create table feedback_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  beta_application_id uuid references beta_applications(id),
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  completed_at timestamptz,
  form_url text,
  status text default 'scheduled'
);

create table beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  rating integer check (rating between 1 and 5),
  liked text,
  confusing text,
  requested_features text,
  would_recommend boolean,
  metadata jsonb default '{}'::jsonb,
  submitted_at timestamptz default now()
);
```

### 11.3 Secure Workflow

1. User submits onboarding form.
2. Backend stores `beta_applications` with `status='submitted'`.
3. Admin approves one or many applications.
4. Worker generates a strong temporary password.
5. Worker calls Supabase Admin API `create_user` for that exact email with `email_confirm: true`.
6. Worker upserts `public.users` profile fields.
7. Worker stores only a hash of the temporary password.
8. Worker sends onboarding email with email + temporary password + reset requirement.
9. First login forces password reset.
10. Worker schedules feedback email for day 7 or day 14.

### 11.4 Password Handling

- Generate temp passwords with cryptographic randomness.
- Store only a hash in `demo_accounts`.
- Expire temp passwords in 7-14 days.
- Force password reset after first login.
- Never log temp passwords.
- Email credentials only once.
- Admin panel can regenerate, not reveal, credentials.

Safer alternative:

- Prefer one-time setup links over emailed temporary passwords when possible.
- The setup link should be single-use, hashed in the database, short-lived, and invalidated after password creation.
- If temporary passwords are used for speed during beta, force reset on first login and prevent access to paid/admin features until reset is complete.

### 11.5 Seeding Method

Use **Supabase Admin APIs**, not raw SQL insertion into `auth.users`.

Why:

- Supabase Auth owns auth schema internals.
- Admin API supports confirmed users.
- Raw SQL into auth tables can break future Supabase assumptions.
- API workflow can be idempotent and logged.

Use SQL only for public profile/data seeding after Auth user creation.

### 11.6 Email Architecture

Recommended first provider: **Resend** for transactional onboarding and feedback emails, with SMTP fallback.

Why:

- Simple API
- Good React/email template workflow
- Good for developer-led SaaS launch
- Easy webhooks for delivery events

Alternatives:

| Provider | Use Case | Tradeoff |
| --- | --- | --- |
| Resend | Best first choice | Verify current free tier and sending/domain limits before launch. |
| SendGrid | Mature, high volume | More complex UX and reputation management. |
| Mailgun | Developer-focused, good routing | Pricing/domain setup must be checked. |
| SMTP | Cheap fallback | Weak analytics and deliverability tooling. |

### 11.7 Admin Panel Features

- Review beta applications.
- Approve/reject applications.
- Bulk-create demo accounts.
- Resend onboarding email.
- Regenerate temp password.
- Track login status.
- Track practice usage, AI usage, reports, visualizations.
- Trigger follow-up campaign.
- View feedback responses and export CSV.

---

## 12. User Profile System

### 12.1 Profile Fields

Add:

- username
- avatar_url
- university
- department
- semester
- bio
- XP
- rank tier
- current streak
- longest streak
- battle rating
- battle wins/losses/draws
- solved problems count
- badges
- public/private profile flag

### 12.2 Storage Strategy

- Store avatars in Supabase Storage bucket `avatars`.
- Store generated reports in `reports`.
- Store narration audio in `narration-audio`.
- Use signed upload URLs or backend-mediated uploads.
- Enforce file type and size limits.

### 12.3 Realtime Profile Updates

- Publish XP/streak/badge changes over WebSocket.
- Cache profile summaries in Redis.
- Invalidate cache on profile update or gamification event.

---

## 13. Admin Dashboard Architecture

### 13.1 Admin Features

Admin dashboard should include:

- active users and realtime sessions
- signup/login events
- onboarding funnel
- email campaign status
- beta feedback dashboard
- AI usage and cost estimates
- compiler execution volume/failures
- battle monitoring
- leaderboard management
- suspicious activity review
- crash/error feed
- deployment version and health
- database/storage usage

### 13.2 RBAC

Roles:

- `user`
- `beta_tester`
- `instructor`
- `admin`
- `super_admin`

Use backend route dependencies:

- `require_auth`
- `require_role("admin")`
- `require_permission("manage_beta")`

Never rely only on frontend route hiding.

### 13.3 Admin Analytics Stack

Start with Postgres rollup tables and backend endpoints. Add Metabase later for internal BI if needed.

Suggested rollups:

- daily active users
- weekly active users
- signup conversion
- accepted submissions
- AI messages per day
- compiler executions per language
- report generations
- battles completed
- TTS generation jobs
- email delivery/open/click events

### 13.4 Admin Dashboard Failure Modes

- Admin dashboards can accidentally become the most expensive part of the system if they query raw events on every page load.
- Use rollups and paginated endpoints, not unbounded `select *` queries.
- Every admin action that mutates user/account/billing/beta state must write an audit log.
- Admin WebSocket live views should degrade to polling if realtime infrastructure is down.
- Do not expose raw submitted code, emails, or suspicious activity metadata broadly; use role-specific permissions.

---

## 14. Mobile App Roadmap

### 14.1 Recommendation

Use **React Native with Expo** when mobile begins.

Why:

- Existing team and frontend are React-based.
- Can share API contracts, validation types, design concepts, and auth patterns.
- Expo accelerates beta distribution.
- Better fit than Flutter because the current app is already React.

### 14.2 Flutter Comparison

Flutter is strong for polished cross-platform UI, but adopting it would introduce a second UI language/framework and reduce reuse. Choose Flutter only if the team has stronger Dart/Flutter skills than React Native skills.

### 14.3 Mobile Scope

V1 mobile:

- login/signup
- profile
- practice problem reading/submission
- AI tutor
- lightweight visualizations
- leaderboards

Later:

- battle participation
- voice-guided visualization playback
- offline practice
- push notifications for streaks/tournaments

---

## 15. Payments And Monetization

### 15.1 Pricing Tiers

Suggested tiers:

- **Free:** visualizations, limited AI tutor messages, limited reports, basic practice.
- **Premium Student:** higher AI limits, voice-guided visualizations, battle access, advanced analytics, more reports.
- **Institution:** instructor dashboards, cohorts, admin analytics, tournaments, bulk accounts.
- **Beta/Founding:** free or discounted premium for early testers.

### 15.2 Stripe Architecture

Add tables:

```sql
create table billing_customers (
  user_id uuid primary key references public.users(id) on delete cascade,
  stripe_customer_id text unique not null,
  created_at timestamptz default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  stripe_subscription_id text unique not null,
  plan_key text not null,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table usage_counters (
  user_id uuid references public.users(id) on delete cascade,
  period_start date not null,
  metric text not null,
  used integer default 0,
  primary key(user_id, period_start, metric)
);
```

### 15.3 Feature Gating

Gate:

- AI messages/day
- TTS minutes/month
- battle entries/day
- PDF reports/month
- advanced analytics
- institution dashboards

Use backend enforcement, not frontend-only checks.

### 15.4 Webhook Rules

- Verify Stripe signatures.
- Store webhook events with idempotency.
- Process in worker if slow.
- Never trust client-side payment status.

---

## 16. DevOps, CI/CD, And Release Strategy

### 16.1 Environments

Create:

- local
- beta
- staging
- production

Each must have separate:

- Supabase project or schema
- Redis instance
- object storage bucket/prefix
- Groq/API keys
- email domain or sender
- Stripe test/live mode

### 16.2 GitHub Actions

Workflows:

- `backend-ci.yml`: install deps, run tests, run import checks.
- `frontend-ci.yml`: `npm ci`, lint, build.
- `docker-build.yml`: build backend/frontend images.
- `deploy-staging.yml`: deploy on merge to `dev`.
- `deploy-production.yml`: deploy on release tag.

### 16.3 Release Versioning

Use semantic versioning:

- `v1.0.0-beta`: stabilized current MVP.
- `v1.1.0-beta`: onboarding/demo account automation.
- `v1.2.0-beta`: Redis, queues, reports storage, observability.
- `v1.3.0-beta`: gamification and leaderboards.
- `v1.4.0-beta`: voice-guided visualization beta.
- `v2.0.0`: coding battles public beta.
- `v2.1.0`: admin analytics dashboard.
- `v3.0.0`: institutional SaaS + payments.

### 16.4 Deployment Rules

- `main` is production-ready only.
- `dev` deploys to staging/beta.
- Release tags deploy to production.
- Use protected GitHub environments and manual approval for production.
- Keep rollback instructions per release.

---

## 17. Monitoring, Logging, And Observability

### 17.1 Minimum Production Observability

Add:

- Sentry for frontend/backend exceptions.
- Structured JSON logs from FastAPI.
- Request ID middleware.
- Latency metrics per endpoint.
- Redis/queue metrics.
- Worker job success/failure metrics.
- AI provider latency/error/token usage logs.
- Compiler job timeout/error metrics.
- WebSocket connection metrics.
- Frontend route-level errors, API latency, and WebSocket reconnect metrics.
- Deployment version tags in frontend, backend, workers, and logs.
- Dead-letter queue dashboards.
- Alerting for auth failure spikes, worker backlog age, Redis errors, AI provider failures, and payment webhook failures.

### 17.2 Observability Implementation Plan

1. Add request ID middleware in FastAPI and return `X-Request-ID`.
2. Add Axios interceptor to attach a client request ID and log failed requests to Sentry.
3. Use structured JSON logs with fields: `request_id`, `user_id`, `route`, `status_code`, `latency_ms`, `error_class`.
4. Add Sentry to frontend and backend.
5. Add OpenTelemetry instrumentation for FastAPI and outbound HTTP calls where feasible.
6. Add worker metrics: job type, queue delay, execution time, retries, failures.
7. Add WebSocket metrics: active connections, room count, reconnects, auth failures, heartbeat misses.
8. Build an admin health page that shows API, Redis, worker, Supabase, Groq, email, storage, and Stripe status.

### 17.3 Audit Logs

Create:

```sql
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id),
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);
```

Log admin actions, account seeding, password resets, billing changes, suspicious activity decisions, and role changes.

---

## 18. Security Roadmap

### 18.1 Immediate

- Lock CORS to known origins.
- Ensure service-role key is backend-only.
- Add rate limits.
- Add request body size limits.
- Add Turnstile/captcha to public signup.
- Add admin RBAC.
- Move generated files out of temp disk.
- Sanitize PDF/chart payload size.
- Add secure headers in Nginx.
- Add Content Security Policy, `X-Content-Type-Options`, `Referrer-Policy`, and clickjacking protection.
- Add dependency scanning and container scanning in CI.
- Add secrets rotation process for Supabase, Groq, email, Stripe, Redis, and storage credentials.
- Add PII retention rules for beta forms and feedback.
- Add WebSocket origin validation and token revalidation.

### 18.2 Compiler Security

- Move execution to isolated worker.
- Disable network in execution container.
- Enforce CPU/memory/pid/filesystem limits.
- Run as non-root.
- Limit source size/stdout/stderr.
- Kill process tree on timeout.
- Store execution audit.

### 18.3 AI/TTS Security

- Prompt injection is lower risk than data exfiltration here, but still log prompt versions and avoid putting secrets/user tokens in prompts.
- Enforce AI usage limits.
- Moderate or filter TTS text if public user-generated narration is allowed.
- Review commercial licenses for every TTS model before monetization.
- Do not send hidden test cases, private user emails, service keys, payment state, or admin notes into LLM prompts.
- Add abuse monitoring for prompt spam, unusually long TTS text, and repeated failed AI calls.

### 18.4 Data Privacy

- Classify data: public learning content, user profile data, educational analytics, submitted code, beta PII, billing data, admin audit logs.
- Define retention periods for submitted code and beta applications.
- Provide account deletion/export process before broader SaaS launch.
- Keep billing data in Stripe where possible; store only identifiers and entitlement state locally.
- Limit staff/admin access to PII by role and audit sensitive reads.

---

## 19. Exact Phased Implementation Roadmap

### Phase 0: Stabilize Current MVP

- CORS config by environment.
- Structured logs and request IDs.
- Health/readiness endpoints.
- Separate public signup from demo-account admin creation.
- Supabase profile upsert hardening.
- Move reports to Supabase Storage.
- Add CI for backend/frontend builds.
- Fix local/container environment variable parity.
- Add request payload size limits.
- Add frontend Sentry and backend Sentry.
- Normalize compiler status handling.

### Phase 1: SaaS Foundation

- Add migrations.
- Add Redis.
- Add rate limiting.
- Add worker process.
- Add job status model.
- Add admin RBAC.
- Add audit logs.
- Add Sentry.
- Add Postgres-backed durable job table before critical worker flows.
- Add dead-letter job handling and admin retry controls.
- Add dependency/container vulnerability scanning.

### Phase 2: Beta Onboarding Automation

- Onboarding form.
- Beta application table.
- Admin approval UI.
- Supabase Admin API account creation for exact submitted emails.
- Temporary password generation and forced reset.
- Resend email workflow.
- Follow-up feedback scheduling.
- Beta analytics dashboard.

### Phase 3: Profiles And Gamification

- Usernames, avatars, university/semester fields.
- XP event ledger.
- Badges.
- Streak hardening.
- Redis leaderboards.
- Weekly/monthly snapshots.
- Realtime XP/rank updates.
- Add event retention and leaderboard rebuild jobs.

### Phase 4: Voice-Guided Visualizations

- Benchmark and license-review TTS candidates.
- Narration planner.
- TTS worker.
- Audio storage.
- Timeline manifest.
- Frontend synchronized playback.
- Cache and pre-generation.
- Admin controls for voices and templates.

### Phase 5: Realtime Battles

- Harden compiler execution worker first.
- WebSocket infrastructure.
- Redis presence.
- Matchmaking queue.
- Battle schema.
- Isolated compiler worker.
- V1 scoring.
- Suspicious event capture.
- Battle history.

### Phase 6: Payments And Institutional SaaS

- Stripe subscriptions.
- Usage counters.
- Feature gating.
- Institution/team/cohort model.
- Instructor dashboard.
- Billing admin tools.

### Phase 7: Mobile

- Expo app.
- Shared API client.
- Auth/profile/practice/AI.
- Push notifications.
- Voice visualization playback.

---

## 20. Production Readiness Checklist

- [ ] CORS restricted.
- [ ] Secrets out of repository and frontend bundle.
- [ ] RLS policies reviewed.
- [ ] Backend ownership checks added for service-role operations.
- [ ] Redis rate limiting enabled.
- [ ] Workers configured and monitored.
- [ ] Reports/audio stored in object storage.
- [ ] Compiler isolated from API container.
- [ ] Sentry configured.
- [ ] Request IDs in logs.
- [ ] CI passes backend tests and frontend build.
- [ ] Staging environment exists.
- [ ] Database migrations are repeatable.
- [ ] Backup/restore process tested.
- [ ] Admin RBAC enforced server-side.
- [ ] Stripe webhook idempotency implemented before payments.
- [ ] Email domain authenticated.
- [ ] Load test for signup/login/visualization/practice paths.
- [ ] WebSocket reconnection tested.
- [ ] AI/TTS usage limits enforced.
- [ ] Vite build-time env vars verified in deployed frontend image.
- [ ] WebSocket host idle timeout and heartbeat behavior tested.
- [ ] Durable job table and dead-letter queue exist.
- [ ] Worker backlog and job age alerts configured.
- [ ] Object storage uses private buckets and signed URLs.
- [ ] Frontend CSP and secure headers configured.
- [ ] Execution worker has no production secrets.
- [ ] Submitted code retention policy documented.
- [ ] Beta PII retention and deletion process documented.
- [ ] TTS model license review completed before paid launch.

---

## 21. Risk Analysis

| Risk | Impact | Probability | Mitigation |
| --- | --- | --- | --- |
| Compiler sandbox escape/resource abuse | Critical | Medium | Isolated execution worker with hard limits. |
| Signup/login instability | High | Medium | Separate signup modes, logs, rate limits, Supabase error handling. |
| TTS cost/latency | High | Medium | Pre-generate, cache by hash, use CPU-friendly models first. |
| WebSocket scaling bugs | High | Medium | Redis-backed room state, reconnection design, load tests. |
| Supabase service-role misuse | Critical | Low/Medium | Backend-only key, audit logs, strict admin routes. |
| Leaderboard abuse | Medium | High | Event audit, caps, suspicious activity detection. |
| Payment webhook mistakes | High | Medium | Idempotency, signature verification, test mode rollout. |
| Overbuilding microservices | High | Medium | Stay modular monolith until clear team/load boundaries exist. |
| Redis data loss or missed pub/sub events | High | Medium | Keep durable job/event state in Postgres and rebuild Redis views. |
| PaaS WebSocket limitations | High | Medium | Validate host support, use heartbeats, resume protocol, and no free-tier sleep for realtime. |
| Frontend state complexity | Medium | High | Introduce TanStack Query/server-state patterns before admin/realtime expansion. |
| Vite env misconfiguration | Medium | Medium | Build per environment or inject runtime config through served config JSON. |
| TTS license mismatch | High | Medium | Legal/license review before monetized voice features. |
| Admin dashboard expensive queries | Medium | Medium | Use rollups, pagination, indexes, and query budgets. |

---

## 22. Cost Optimization Strategy

- Keep Supabase as the primary DB/Auth/Storage during beta.
- Use Upstash/managed Redis free or low tier initially.
- Use CPU TTS where possible; reserve GPU for batch or premium voice quality.
- Cache narration segments globally.
- Limit AI messages and TTS minutes by plan.
- Store reports/audio with TTL where appropriate.
- Use GitHub Actions CI and deploy only on meaningful branches/tags.
- Use Cloudflare CDN for static frontend and cached audio.
- Run workers on demand where hosting supports it.
- Add usage dashboards before monetization to prevent surprise bills.

---

## 23. Free/Open-Source Alternatives Comparison

| Need | Preferred | Alternatives | Notes |
| --- | --- | --- | --- |
| TTS | Kokoro/Piper | XTTS-v2, StyleTTS2, NeMo | Verify exact model licenses before commercial release. |
| Queue | Dramatiq + Redis | Celery + Redis/RabbitMQ, RQ | Dramatiq is simpler for this stage. |
| Realtime | FastAPI WebSockets | Socket.IO, Supabase Realtime | FastAPI keeps backend unified; Socket.IO adds richer client semantics. |
| Monitoring | Sentry free tier + structured logs | GlitchTip, Grafana/Loki | Hosted Sentry is fastest to integrate. |
| Analytics BI | Postgres rollups | Metabase, Superset | Start with internal admin endpoints. |
| Email | Resend | SendGrid, Mailgun, SMTP | Verify current pricing/free tiers. |
| Storage | Supabase Storage | Cloudflare R2, S3, MinIO | Supabase is simplest now. |
| Auth | Supabase Auth | Clerk, BetterAuth, Auth.js | Do not migrate unless auth UX becomes a bottleneck. |
| Payments | Stripe | Lemon Squeezy/Paddle | Stripe is best for direct SaaS subscriptions. |

---

## 24. Final Architecture Summary

AlgoVision should evolve through a disciplined modular-monolith path:

```text
React/Vite Frontend
  -> FastAPI REST + WebSocket Modular Monolith
    -> PostgreSQL/Supabase Auth/Storage
    -> Redis cache/queues/realtime state/leaderboards
    -> Workers for TTS, PDF, email, compiler, analytics
    -> Groq AI provider behind an AI service abstraction
    -> Object storage for reports, avatars, narration audio
    -> GitHub Actions CI/CD
    -> Sentry/OpenTelemetry/logging
```

This preserves the current project strengths: backend-generated visualization states, modular FastAPI routers, React visualizers, Supabase Auth/Postgres, AI tutor integration, analytics, PDF reports, practice problems, compiler execution, and Docker deployment.

The highest-leverage next move is not a rewrite. It is to add production primitives around the existing architecture: Redis, workers, object storage, observability, secured auth flows, and clear domain modules. That foundation supports voice narration, leaderboards, battles, admin analytics, beta onboarding, payments, and mobile without destabilizing the working MVP.

The corrected production constraint is: **keep one modular codebase, but do not keep one runtime responsibility.** API traffic, realtime sockets, general jobs, and untrusted code execution must be separable at deployment time even while they remain part of the same repository and architecture.
