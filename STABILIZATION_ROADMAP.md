# AlgoVision Stabilization Roadmap

**Purpose:** Make the current AlgoVision system production-reliable before adding new SaaS features.

**Scope:** Auth crashes, deployment instability, Supabase issues, async problems, frontend state issues, compiler isolation, logging, monitoring, observability, error handling, Docker improvements, CI/CD, load testing, caching, and backend optimization.

**Non-goals:** This roadmap intentionally excludes new SaaS features such as voice narration, leaderboards, battles, payments, admin dashboards, mobile apps, and monetization. Those should wait until the stabilization gates in this document are met.

---

## 1. Current Stability Diagnosis

AlgoVision is a strong MVP with a clean React + Vite frontend, FastAPI backend, Supabase Auth/PostgreSQL, Groq AI tutor, backend-generated visualization states, local compiler execution, PDF reports, and Docker deployment. The main risk is not architecture direction; it is that the current runtime is carrying too many responsibilities without production guardrails.

The system currently has these stability risks:

- Auth behavior changes depending on whether the backend can use Supabase Admin APIs.
- Supabase SDK calls are synchronous but used from async FastAPI routes.
- Backend uses the Supabase service-role key, bypassing RLS, so backend ownership checks must be explicit.
- Frontend auth/session state is manually managed and token storage relies on `localStorage`.
- Compiler execution runs subprocesses from backend runtime context.
- PDF reports are stored on local temp disk.
- Docker/local env loading behavior can diverge.
- There is no structured logging, request tracing, metrics, alerting, or incident workflow.
- There is no Redis/cache/rate-limiting layer.
- CI/CD is not yet enforcing backend/frontend/Docker reliability gates.

---

## 2. Stabilization Principles

1. **Fix reliability before features.** No realtime battles, TTS, payments, or SaaS expansion until the current platform survives normal beta traffic.
2. **Preserve the modular monolith.** Do not rewrite the app or introduce premature microservices.
3. **Separate runtime risk.** Keep one repo/codebase, but separate API, worker, and compiler-execution responsibilities.
4. **Make failures visible.** Every crash, provider error, auth failure, worker failure, and deployment failure should be traceable.
5. **Protect Supabase service-role usage.** RLS does not protect backend service-role mistakes.
6. **Design for beta load first.** Stabilize for dozens to hundreds of users before optimizing for thousands.
7. **Use boring production tools.** Prefer PostgreSQL, Redis, Docker, GitHub Actions, Sentry/OpenTelemetry, and explicit health checks.

---

## 3. Stabilization Success Criteria

Before adding new SaaS features, AlgoVision should meet these gates:

- Auth signup/login/logout/session restore works consistently across local, staging, and production.
- No known auth crash path returns raw provider exceptions to users.
- Backend has structured request logs with request IDs.
- Frontend and backend exceptions are captured in Sentry or equivalent.
- Supabase calls are wrapped with consistent error handling and timeouts.
- Compiler execution is isolated from the API process or explicitly disabled in production until isolated.
- Reports are no longer stored only on temp disk.
- Docker images build reproducibly in CI.
- Frontend build uses correct environment values for each deployment target.
- CI runs backend tests, frontend build, dependency checks, and Docker build.
- Health/readiness endpoints distinguish app liveness from dependency readiness.
- Load tests cover auth, visualization, performance save, practice submit, AI tutor, and report generation.
- Redis-backed rate limits protect auth, compiler, AI, and report endpoints.
- A rollback procedure exists for production deployments.

---

## 4. Phase 0: Stabilization Freeze And Audit

**Goal:** Stop feature expansion and define the reliability baseline.

### Tasks

- Freeze new SaaS feature work until this roadmap reaches Phase 5 minimum.
- Create `stabilization` branch or use `dev` with stabilization-only PRs.
- Capture current environment variables required by backend and frontend.
- Document current deployment command/process.
- Confirm which `.env` file each runtime actually reads:
  - root `.env`
  - `backend/.env`
  - `frontend/.env`
  - Docker Compose `env_file`
  - Vite build args
- Run current test files and record failures.
- Run frontend `npm run build`.
- Run Docker Compose build locally.
- Record current known crashes with timestamps, endpoint, browser action, and error output.

### Deliverables

- `docs/stabilization-baseline.md`
- current test/build status
- list of known crash paths
- owner assigned for auth, backend, frontend, Docker, and CI

### Exit Criteria

- Team knows what is currently broken.
- No new feature PRs are merged during stabilization.

---

## 5. Phase 1: Auth And Supabase Stabilization

**Goal:** Eliminate signup/login crashes and make auth behavior deterministic.

### Current Problems

- `/auth/signup` mixes public signup with admin-created auto-confirmed users.
- Supabase profile creation depends on trigger timing and follow-up update calls.
- Supabase service-role queries bypass RLS.
- Auth errors are broadly caught and normalized, hiding root causes.
- Token storage and session restoration are split between Supabase JS and backend login response.

### Required Changes

#### 5.1 Split Signup Modes

Create two separate flows:

- `POST /auth/signup`
  - Normal public signup.
  - Uses normal Supabase signup behavior.
  - Does not auto-confirm users.
  - Returns a stable message: account created, check email if confirmation is enabled.

- `POST /admin/demo-accounts`
  - Admin-only.
  - Uses Supabase Admin API.
  - Can auto-confirm exact beta/demo emails.
  - Requires admin role.
  - Writes audit logs.

**Why:** Current behavior depends on service-role availability, so local/staging/prod can behave differently.

**Scalability implication:** Clear flows allow rate limits and monitoring per auth path.

**Tradeoff:** Slightly more backend code, much less ambiguity.

#### 5.2 Make Profile Upsert Idempotent

Add service function:

```python
def ensure_user_profile(user_id: str, email: str, full_name: str | None = None) -> dict:
    ...
```

Rules:

- Insert profile if missing.
- Update only allowed fields.
- Never silently swallow profile failures without logging.
- Return profile consistently.

**Why:** Trigger timing can race with immediate profile updates.

#### 5.3 Harden Supabase Error Handling

Add a Supabase error wrapper:

- maps duplicate email
- invalid credentials
- email not confirmed
- provider timeout
- rate limit
- service role missing/invalid
- network failure

Every auth endpoint should log internal provider error details but return safe user-facing messages.

#### 5.4 Add Auth Rate Limits

Use Redis-backed limits:

- per IP signup attempts
- per email signup attempts
- per IP login attempts
- per email login attempts
- password reset attempts

Before Redis exists, use an in-memory limiter only for local dev, not production.

#### 5.5 Auth Observability

Track:

- signup attempts/success/failure
- login attempts/success/failure
- invalid token count
- Supabase auth latency
- profile upsert failures
- account confirmation failures

### Exit Criteria

- Signup/login behavior is deterministic in local and Docker.
- Auth failures return stable messages.
- No raw Supabase exceptions reach the frontend.
- Auth logs contain request ID and provider error class.
- Rate limits exist for auth endpoints.

---

## 6. Phase 2: Backend Async And Error Handling Stabilization

**Goal:** Prevent blocking operations and inconsistent exceptions from destabilizing FastAPI.

### Current Problems

- Async FastAPI routes call synchronous Supabase methods.
- Groq calls are synchronous from request path.
- PDF generation is CPU/memory work in request path.
- Compiler execution is wrapped in threadpool but still belongs to API runtime.
- Broad `except Exception` blocks hide root causes.

### Required Changes

#### 6.1 Define Backend Error Contract

Every API error should use a consistent shape:

```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password.",
    "request_id": "..."
  }
}
```

Add error codes for:

- auth
- Supabase
- validation
- AI provider
- compiler
- report generation
- rate limiting
- internal errors

#### 6.2 Add Request ID Middleware

Generate or accept `X-Request-ID`.

Propagate it to:

- logs
- error responses
- worker jobs
- frontend failed-request logs

#### 6.3 Isolate Blocking Calls

Short-term:

- Wrap synchronous Supabase calls consistently in `run_in_threadpool` for async routes.
- Add timeouts/retries where possible.

Medium-term:

- Create repository/service boundaries so blocking provider calls are centralized.
- Move heavy work to workers.

#### 6.4 Provider Circuit Breakers

For Groq/Supabase/email/storage:

- timeout
- retry only safe/idempotent operations
- fail fast after repeated failures
- log provider status

#### 6.5 Background Work Policy

Stop using FastAPI `BackgroundTasks` for important durable work.

Allowed:

- non-critical telemetry flushes

Not allowed:

- practice attempt persistence
- report generation
- onboarding emails
- account seeding
- billing

### Exit Criteria

- All API responses have consistent error format.
- Request ID exists in logs and responses.
- Blocking provider calls are centralized and identifiable.
- Important work is not hidden in non-durable `BackgroundTasks`.

---

## 7. Phase 3: Logging, Monitoring, And Observability

**Goal:** Make crashes diagnosable before beta users arrive.

### 7.1 Structured Logging

Backend logs must include:

- timestamp
- level
- request_id
- user_id when available
- route
- method
- status_code
- latency_ms
- error_code
- provider
- provider_latency_ms

Do not log:

- passwords
- tokens
- Supabase service-role key
- Groq key
- full submitted code by default
- temporary demo credentials

### 7.2 Error Tracking

Add Sentry or equivalent to:

- FastAPI backend
- React frontend
- worker process when introduced

Tag errors with:

- environment
- release version
- request ID
- user ID hash
- route/page

### 7.3 Metrics

Minimum backend metrics:

- request count by route/status
- latency p50/p95/p99
- auth success/failure count
- Supabase latency/error count
- Groq latency/error count
- compiler executions/timeouts/errors
- report generation success/failure
- queue depth and job age after workers exist

Minimum frontend metrics:

- route load errors
- API failure count
- auth restore failures
- blank/loading screen duration
- WebSocket reconnect metrics when realtime exists

### 7.4 Health Endpoints

Add:

- `/health/live`
  - returns process alive
  - does not call external providers

- `/health/ready`
  - validates required config
  - checks Supabase connectivity lightly
  - checks Redis if enabled
  - checks storage if enabled

### 7.5 Alerts

Initial alert rules:

- auth failures spike
- backend 5xx rate above threshold
- p95 latency above threshold
- Supabase errors above threshold
- AI provider failures above threshold
- compiler timeout rate above threshold
- worker dead-letter jobs exist
- deployment health check fails

### Exit Criteria

- A crash can be traced from frontend error to backend logs using request ID.
- Backend has route-level latency and error visibility.
- Production deploys expose liveness and readiness separately.

---

## 8. Phase 4: Docker And Deployment Stabilization

**Goal:** Make local, staging, and production deployment predictable.

### Current Problems

- Backend config loads root `.env`, while Compose points to `backend/.env`.
- Frontend Vite variables are baked at build time.
- Backend image includes compilers, increasing size and risk.
- Docker Compose has no Redis/worker separation yet.
- Reports use temp disk.

### Required Changes

#### 8.1 Environment Strategy

Standardize env files:

- `.env.example`
- `backend/.env.example`
- `frontend/.env.example`
- `.env.local` for developer-only root overrides if needed

Document:

- local dev env
- Docker env
- staging env
- production env

Fix backend config so Docker and local behavior match.

#### 8.2 Runtime Config For Frontend

Vite build-time env is a deployment risk.

Options:

- Build separate frontend image per environment.
- Or serve `/config.json` from Nginx/API and load runtime config before React mounts.

Recommendation:

- For beta, build per environment in CI.
- For later production, consider runtime config if deployments multiply.

#### 8.3 Docker Process Separation

Target Compose services:

- `backend-api`
- `frontend`
- `redis`
- `worker`
- `compiler-worker`

Initially, `worker` can be disabled until queues are implemented. `compiler-worker` should be introduced before public practice/battle scale.

#### 8.4 Docker Hardening

- Use non-root user where possible.
- Add health checks.
- Pin base image major versions.
- Use `npm ci` for frontend.
- Avoid copying `.env` into images.
- Add `.dockerignore`.
- Reduce backend image size after compiler worker separation.
- Separate API image from compiler runtime image eventually.

#### 8.5 Storage Stabilization

- Stop storing report records as local temp file paths for production.
- Store reports in Supabase Storage or S3/R2.
- Save storage key in DB.
- Generate signed download URLs after authorization.

### Exit Criteria

- Docker build works from clean checkout.
- Local Docker and deployed environment use the same config rules.
- Frontend env values are correct in deployed image.
- Reports survive container restart.
- API and compiler runtime separation plan is represented in Compose.

---

## 9. Phase 5: Compiler Isolation

**Goal:** Prevent user-submitted code from threatening the API runtime.

### Current Problems

- User code is executed with subprocesses from backend service logic.
- API container includes compilers and runtime tools.
- Memory usage is not strongly enforced.
- Network access is not explicitly blocked.
- Execution secrets may exist in the same container environment.

### Required Changes

#### 9.1 Short-Term Guardrails

Before full isolation:

- Source code max length.
- Stdin max length.
- Stdout/stderr max length.
- Strict timeout.
- Normalize statuses:
  - `Accepted`
  - `Wrong Answer`
  - `Compilation Error`
  - `Runtime Error`
  - `Time Limit Exceeded`
  - `Internal Error`
- Kill entire process tree on timeout.
- Log execution metadata, not full code by default.

#### 9.2 Dedicated Compiler Worker

Move execution to a separate worker container:

- no Supabase service-role key
- no Groq key
- no Stripe/email/storage secrets
- non-root user
- CPU/memory limits
- no network for submitted code
- temporary filesystem per execution
- strict cleanup

#### 9.3 Production Sandbox Options

Progression:

1. Docker worker with resource limits for controlled beta.
2. Add `nsjail`, `firejail`, gVisor, or similar sandbox when host supports it.
3. Consider separate execution fleet or managed Judge0-style execution service if battle volume grows.

### Exit Criteria

- API container no longer directly executes untrusted code in production.
- Compiler worker has no production secrets.
- Resource limits are tested.
- Timeouts reliably clean process trees.

---

## 10. Phase 6: Frontend State Stabilization

**Goal:** Reduce frontend auth, loading, stale data, and async UI bugs.

### Current Problems

- Auth state mixes Supabase session restoration and backend-issued token handling.
- Pages manually fetch server state with `useEffect`.
- Global Axios 401 redirect can disrupt background flows.
- Animation uses `setTimeout`, which can drift and be throttled.
- Chart-to-PDF base64 payloads can become large.

### Required Changes

#### 10.1 Auth State Cleanup

- Define one session source of truth.
- Document whether the app uses Supabase browser session, backend login token, or httpOnly cookie model.
- Avoid silent token mismatch between Supabase JS and backend API.
- Handle expired sessions without hard page reload loops.

#### 10.2 Server State Management

Introduce TanStack Query or equivalent for:

- performance history
- practice problems
- reports list
- profile
- admin/beta data later

Benefits:

- caching
- retries
- loading/error consistency
- invalidation after mutations
- less duplicated page logic

#### 10.3 Error UI

Add consistent frontend states:

- loading
- empty
- validation error
- auth expired
- provider unavailable
- retry available

#### 10.4 Animation Reliability

For current visualizations:

- keep max input sizes enforced server-side and client-side
- avoid huge state arrays
- add graceful error for payload too large

For future synchronized audio:

- do not rely on `setTimeout` alone
- use timeline-based rendering

### Exit Criteria

- Session restore is deterministic.
- Protected routes do not flicker or loop on expired auth.
- Common pages have consistent loading/error states.
- Server data caching/invalidation exists for core pages.

---

## 11. Phase 7: Caching And Backend Optimization

**Goal:** Reduce unnecessary database/provider pressure.

### 11.1 Redis Introduction

Add Redis for:

- auth rate limits
- AI rate limits
- compiler rate limits
- report generation rate limits
- cached practice problem list
- cached profile summary
- future job dispatch

Redis should not be permanent truth.

### 11.2 Cache Candidates

| Data | TTL | Invalidated By |
| --- | --- | --- |
| practice problem list | 1 hour | admin problem update |
| user profile summary | 5-15 minutes | profile update, XP/streak change |
| performance comparison results | 1-5 minutes | new algorithm run |
| report list | 1 minute | report generated/deleted |
| AI prompt templates | 1 hour | deployment/config change |

### 11.3 Database Index Review

Review/add indexes for:

- `algorithm_runs(user_id, ran_at desc)`
- `practice_attempts(user_id, attempted_at desc)`
- `practice_attempts(user_id, problem_id)`
- `reports(user_id, generated_at desc)`
- future audit logs by actor/date
- future jobs by status/scheduled time

### 11.4 Payload Optimization

- Limit visualization input sizes.
- Compress large API responses at proxy/server level.
- Paginate performance history.
- Limit report chart image size.
- Avoid returning full submitted code in history endpoints unless needed.

### Exit Criteria

- Redis-backed rate limits active.
- Core read endpoints avoid repeated unnecessary Supabase calls.
- Performance history is paginated.
- API payload limits are enforced.

---

## 12. Phase 8: CI/CD Stabilization

**Goal:** Prevent broken builds and unsafe deployments.

### 12.1 Required GitHub Actions

Create workflows:

- `backend-ci.yml`
  - install Python deps
  - import FastAPI app
  - run algorithm tests
  - run backend unit tests

- `frontend-ci.yml`
  - `npm ci`
  - `npm run build`

- `docker-ci.yml`
  - build backend image
  - build frontend image

- `security-ci.yml`
  - dependency vulnerability scan
  - secret scan
  - container scan if feasible

### 12.2 Deployment Pipeline

Minimum environments:

- staging
- production

Rules:

- `dev` deploys to staging.
- version tag deploys to production.
- production requires manual approval.
- rollback command is documented.

### 12.3 Release Health Check

After deploy:

- `/health/live`
- `/health/ready`
- frontend route loads
- auth login smoke test
- visualization smoke test
- practice submit smoke test if compiler available
- report generation smoke test if storage configured

### Exit Criteria

- Broken frontend/backend builds cannot merge.
- Docker build failures are caught before deployment.
- Production deploy has health gate and rollback procedure.

---

## 13. Phase 9: Load Testing And Reliability Testing

**Goal:** Validate the system under realistic beta traffic.

### 13.1 Load Test Scenarios

Use k6, Locust, or Artillery.

Test:

- anonymous homepage/API health
- signup/login bursts
- `/auth/me`
- visualization endpoints
- `/performance/save`
- `/performance/history`
- `/practice/problems`
- `/practice/submit`
- `/ai/query`
- `/report/generate`

### 13.2 Stress Profiles

Initial beta target:

- 25 concurrent users
- 100 concurrent users
- 250 concurrent users synthetic stress

Track:

- p50/p95/p99 latency
- error rate
- Supabase latency
- CPU/memory
- compiler timeouts
- AI failures
- database write failures

### 13.3 Failure Testing

Simulate:

- Supabase unavailable
- Groq unavailable
- Redis unavailable
- storage unavailable
- compiler timeout
- invalid/expired token
- duplicate signup
- large payloads

### Exit Criteria

- 100 concurrent beta-style users do not cause auth crashes or backend instability.
- Failure modes return controlled errors.
- Alerts trigger for simulated critical failures.

---

## 14. Recommended Stabilization Order

Do this in order:

1. Freeze features and record baseline.
2. Fix auth flow separation and Supabase profile upsert.
3. Add error contract, request IDs, structured logs.
4. Add Sentry/frontend-backend error tracking.
5. Fix Docker/env parity and report storage.
6. Add CI for backend/frontend/Docker.
7. Add Redis rate limits.
8. Add compiler guardrails and start compiler-worker separation.
9. Introduce frontend server-state management for core pages.
10. Add load testing.
11. Add production deploy health gates and rollback.

---

## 15. Stabilization Backlog

### Critical

- Split public signup from admin demo account creation.
- Add explicit backend ownership checks around service-role Supabase queries.
- Fix local/Docker `.env` mismatch.
- Add request ID middleware.
- Add structured logs.
- Add Sentry.
- Move reports out of temp disk.
- Add auth rate limits.
- Add compiler source/stdout/stderr limits.
- Add CI backend/frontend builds.

### High

- Wrap/categorize Supabase errors.
- Add readiness health checks.
- Add Redis.
- Add Postgres-backed durable job table.
- Add worker process.
- Add Docker health checks and `.dockerignore`.
- Add frontend consistent error/loading states.
- Add load tests for auth and practice.

### Medium

- Introduce TanStack Query.
- Paginate performance history.
- Add dependency/container scanning.
- Add provider circuit breakers.
- Add alerting dashboards.
- Add compiler worker sandbox.
- Add runtime frontend config strategy.

---

## 16. Production Readiness Checklist

- [ ] Public signup and admin demo creation are separate.
- [ ] Supabase profile upsert is idempotent.
- [ ] Backend service-role queries have ownership checks.
- [ ] Auth endpoints have Redis-backed rate limits.
- [ ] API errors follow consistent error contract.
- [ ] Request IDs appear in frontend errors, backend logs, and responses.
- [ ] Sentry or equivalent is active for frontend and backend.
- [ ] `/health/live` and `/health/ready` exist.
- [ ] Docker/local env behavior is documented and consistent.
- [ ] Frontend deployment env variables are verified.
- [ ] Reports persist outside container temp disk.
- [ ] Compiler execution has source/stdout/stderr/time limits.
- [ ] Compiler worker separation plan is implemented or production compiler is disabled.
- [ ] CI runs backend tests.
- [ ] CI runs frontend build.
- [ ] CI builds Docker images.
- [ ] Dependency/security scan exists.
- [ ] Load tests cover auth, visualization, practice, AI, and reports.
- [ ] Rollback procedure exists.
- [ ] Alerts exist for auth failures, 5xx spikes, provider failures, and worker failures.

---

## 17. Final Stabilization Target Architecture

The stabilized architecture should look like this before SaaS feature expansion:

```text
React/Vite Frontend
  - deterministic auth/session handling
  - consistent error/loading states
  - frontend error tracking
  - build-time env verified per environment

FastAPI API Runtime
  - structured logs
  - request IDs
  - consistent error contract
  - auth/Supabase hardening
  - rate limits
  - health/readiness endpoints

PostgreSQL/Supabase
  - idempotent profile upserts
  - explicit backend ownership checks
  - indexes reviewed
  - reports reference object-storage keys

Redis
  - rate limits
  - cache
  - future queue dispatch

Worker Runtime
  - durable jobs
  - report/email/background work

Compiler Worker Runtime
  - isolated from API
  - no production secrets
  - resource limits

CI/CD
  - backend tests
  - frontend build
  - Docker build
  - security scans
  - staging and production health gates
```

Once this architecture is stable under load tests and real beta usage, AlgoVision can safely resume SaaS feature development.
