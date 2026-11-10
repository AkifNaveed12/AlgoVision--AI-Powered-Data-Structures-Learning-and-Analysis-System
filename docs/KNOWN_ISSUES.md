# AlgoVision — Known Issues

> **Purpose:** Track all known bugs, crashes, risks, and technical debt.
> Every entry has severity, domain, impact, and target fix phase.
> This file is updated whenever issues are discovered or resolved.

---

## Issue Severity Levels

| Level | Meaning |
|---|---|
| **P0 — Critical** | System crash, data loss, security vulnerability. Must fix immediately. |
| **P1 — High** | Feature broken for users, significant UX degradation. Fix in current phase. |
| **P2 — Medium** | Workaround exists, affects subset of users or workflows. Fix in next phase. |
| **P3 — Low** | Minor inconvenience, cosmetic, or long-term debt. Schedule appropriately. |

---

## Active Issues

---

### KI-001: Mixed Auth Signup Behavior

**Severity:** P1 — High
**Domain:** Auth
**Status:** Open
**Discovered:** 2026-05-26 (Architecture Analysis)
**Target Phase:** Phase 0 — Stabilization

**Impact:**
`/auth/signup` tries `admin.create_user` first (auto-confirms), falls back to `sign_up` (requires email confirmation). Behavior changes depending on whether backend has service-role key. User messaging says "check email" even when auto-confirmed. This makes signup non-deterministic across environments.

**Evidence:**
`backend/routers/auth.py` lines 12–29: try/except block mixes admin and standard signup paths.

**Mitigation:**
Split into two separate endpoints:
- `POST /auth/signup` — public signup, standard flow
- `POST /admin/demo-accounts` — admin-only, auto-confirmed, audit-logged

**Owner:** Unassigned
**Related ADR:** ADR-005 (Stabilization First)

---

### KI-002: CORS Wildcard with Credentials

**Severity:** P1 — High
**Domain:** Security
**Status:** Open
**Discovered:** 2026-05-14 (Deployment)
**Target Phase:** Phase 0 — Stabilization

**Impact:**
`backend/main.py` line 19: `allow_origins=["*"]` combined with `allow_credentials=True` is a security risk and behaves inconsistently in browsers. Any origin can make credentialed requests to the API.

**Evidence:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    ...
)
```

**Mitigation:**
Restrict origins by environment. Use environment variable for allowed origins list.

**Owner:** Unassigned
**Related ADR:** ADR-009

---

### KI-003: Synchronous Supabase SDK in Async Routes

**Severity:** P2 — Medium
**Domain:** Backend
**Status:** Open
**Discovered:** 2026-05-26 (Architecture Analysis)
**Target Phase:** Phase 0 — Stabilization

**Impact:**
`supabase-py` calls are synchronous. Called from async FastAPI routes, they block the event loop under concurrent usage. This can cause request stacking, latency spikes, and potential deadlocks under load.

**Evidence:**
`backend/services/supabase_service.py` — all data access functions are synchronous (e.g., `get_user_profile`, `save_algorithm_run`, `get_all_problems`). They are called from `async def` route handlers without `run_in_threadpool`.

**Mitigation:**
Wrap synchronous Supabase calls in `run_in_threadpool` or create a repository boundary layer that consistently isolates blocking calls.

**Owner:** Unassigned

---

### KI-004: Report Storage on Local Temp Disk

**Severity:** P2 — Medium
**Domain:** Reports
**Status:** Open
**Discovered:** 2026-05-26 (Architecture Analysis)
**Target Phase:** Phase 0 — Stabilization

**Impact:**
Generated PDF reports are stored on local temp disk. File paths are saved in the `reports` table. Reports disappear on container restart, replica change, or deployment. Not multi-replica safe.

**Evidence:**
`backend/services/report_service.py` generates PDFs with ReportLab and stores them in temp directories.

**Mitigation:**
Move report storage to Supabase Storage or S3/R2. Store object key in DB. Serve via signed download URLs.

**Owner:** Unassigned

---

### KI-005: Compiler Execution in API Container

**Severity:** P2 — Medium
**Domain:** Compiler, Security
**Status:** Open
**Discovered:** 2026-05-26 (Architecture Analysis)
**Target Phase:** Phase 1 — Infrastructure Hardening

**Impact:**
User-submitted code executes as subprocesses within the API container using `subprocess.run`. This creates security (lateral movement, secret access), resource (CPU/memory exhaustion), and reliability (noisy neighbor) risks. The API container includes all compilers (g++, gcc, Node.js, Java).

**Evidence:**
`backend/services/compiler_service.py` — `_execute_sync` runs user code in temp directories within the API process environment.

**Mitigation:**
Short-term: Add source code length, stdin, stdout limits. Kill entire process tree on timeout.
Medium-term: Move execution to isolated compiler-worker container with no production secrets, non-root user, CPU/memory limits, no network for submitted code.

**Owner:** Unassigned

---

### KI-006: No Request ID or Structured Logging

**Severity:** P2 — Medium
**Domain:** Observability
**Status:** Open
**Discovered:** 2026-05-26 (Architecture Analysis)
**Target Phase:** Phase 0 — Stabilization

**Impact:**
Crashes cannot be traced from frontend error to backend logs. No request IDs, no structured log format, no correlation between frontend failures and backend exceptions. Makes debugging in staging/production extremely difficult.

**Evidence:**
No logging middleware in `backend/main.py`. No request ID header injection or propagation.

**Mitigation:**
Add request ID middleware (generate or accept `X-Request-ID`). Implement structured JSON logging with timestamp, level, request_id, user_id, route, method, status_code, latency_ms, error_code.

**Owner:** Unassigned

---

### KI-007: No Health Endpoints for Deployment Orchestration

**Severity:** P2 — Medium
**Domain:** Deployment
**Status:** Open
**Discovered:** 2026-05-31 (Code Analysis)
**Target Phase:** Phase 0 — Stabilization

**Impact:**
Current `/health` endpoint only returns `{"status": "ok"}` without checking any dependencies. Docker Compose healthcheck calls it, but it cannot distinguish between "process alive" and "dependencies ready" (Supabase, Groq, etc.). This prevents proper readiness gating in container orchestration.

**Evidence:**
`backend/main.py` lines 48–50: simple static health check.

**Mitigation:**
Add `/health/live` (process alive, no external calls) and `/health/ready` (validates Supabase connectivity, required config, Redis if enabled, storage if enabled).

**Owner:** Unassigned

---

### KI-008: No Consistent API Error Contract

**Severity:** P2 — Medium
**Domain:** Backend, Frontend
**Status:** Open
**Discovered:** 2026-05-26 (Architecture Analysis)
**Target Phase:** Phase 0 — Stabilization

**Impact:**
API errors have inconsistent shapes. Some return `{"detail": "..."}` (FastAPI default), some return custom error messages, some include raw provider exceptions. Frontend cannot reliably parse and display error messages.

**Evidence:**
Auth router returns `{"detail": f"Signup failed: {err}"}` which can leak Supabase internal errors. AI tutor returns `{"detail": "AI Tutor service error: {str(e)}"}`.

**Mitigation:**
Standardize all API errors to:
```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "User-safe message",
    "request_id": "..."
  }
}
```

**Owner:** Unassigned

---

### KI-009: Token Storage in localStorage

**Severity:** P3 — Low
**Domain:** Security, Frontend
**Status:** Open — Accepted Risk for Beta
**Discovered:** 2026-05-26 (Architecture Analysis)
**Target Phase:** Phase 2 — SaaS Foundations

**Impact:**
Access tokens stored in `localStorage` are accessible to any JavaScript running on the page. Increases blast radius of XSS attacks.

**Evidence:**
`frontend/src/context/AuthContext.jsx` lines 15, 24, 42: `localStorage.setItem('access_token', ...)`.

**Mitigation:**
For beta: acceptable. For production: consider httpOnly cookie session model with CSRF protection.

**Owner:** Unassigned

---

### KI-010: Backend Config Env File Mismatch

**Severity:** P3 — Low
**Domain:** Deployment
**Status:** Open
**Discovered:** 2026-05-26 (Architecture Analysis)
**Target Phase:** Phase 0 — Stabilization

**Impact:**
`backend/config.py` loads root `.env` (via `os.path.dirname` resolution), while Docker Compose `env_file` points to `backend/.env`. This can cause configuration divergence between local development and containerized deployment.

**Evidence:**
`backend/config.py` line 21: `env_file = os.path.join(os.path.dirname(os.path.dirname(...)), ".env")` — resolves to project root.
`docker-compose.yml` line 15: `env_file: ./backend/.env` — points to backend subdirectory.

**Mitigation:**
Standardize environment file strategy. Document which `.env` file each runtime reads. Create `.env.example` files for root, backend, and frontend.

**Owner:** Unassigned

---

### KI-011: Frontend Global 401 Redirect Disrupts Background Calls

**Severity:** P3 — Low
**Domain:** Frontend
**Status:** Open
**Discovered:** 2026-05-26 (Architecture Analysis)
**Target Phase:** Phase 2 — SaaS Foundations

**Impact:**
Axios global 401 interceptor forces `window.location.href = '/login'` on any 401 response. This disrupts background API calls, token refresh flows, and future WebSocket reconnection logic.

**Evidence:**
`frontend/src/lib/api.js` lines 18–27: global response interceptor.

**Mitigation:**
Add conditional logic to only redirect on user-initiated requests. Exclude background fetches, token refresh, and WebSocket-related calls.

**Owner:** Unassigned

---

### KI-012: No Rate Limiting on Any Endpoint

**Severity:** P2 — Medium
**Domain:** Security, Backend
**Status:** Open
**Discovered:** 2026-05-26 (Architecture Analysis)
**Target Phase:** Phase 1 — Infrastructure Hardening

**Impact:**
All endpoints (auth, AI tutor, compiler, reports) can be called without limit. This enables credential stuffing, AI API cost abuse, compiler resource exhaustion, and report generation spam.

**Evidence:**
No rate-limiting middleware or dependencies in any router.

**Mitigation:**
Add Redis-backed rate limits for auth, AI, compiler, and report endpoints. Before Redis exists, use in-memory limiters for development only.

**Owner:** Unassigned

---

## Resolved Issues

_None yet._
