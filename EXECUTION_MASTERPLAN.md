# AlgoVision Execution Masterplan

**Purpose:** Convert the AlgoVision SaaS architecture into an executable engineering roadmap with strict sequencing, dependency gates, sprint structure, rollout policy, and production readiness criteria.

**Planning basis:** `SAAS_Planning.md`, `STABILIZATION_ROADMAP.md`, `REALTIME_ARCHITECTURE.md`, `AI_VOICE_ARCHITECTURE.md`, and `ENGINEERING_WORKFLOW_SYSTEM.md`.

**Execution stance:** Preserve the current React/Vite + FastAPI + Supabase architecture. Evolve through a modular monolith with separated runtime roles. Stabilize first, then scale, then add realtime, AI voice, multiplayer, monetization, and mobile.

---

## 1. Executive Summary

### Current Project State

AlgoVision has a strong MVP/FYP foundation:

- React + Vite frontend with visualizers, auth pages, practice, reports, performance dashboards, AI tutor, and compiler UI.
- FastAPI backend with routers, Pydantic models, algorithm engines, Supabase service layer, Groq AI integration, compiler service, and ReportLab reports.
- Supabase PostgreSQL/Auth as the core data/auth platform.
- Backend-generated visualization state arrays, which are a major architectural strength for future voice synchronization.
- Docker-based local/production deployment structure.
- Planning documents for SaaS evolution, stabilization, realtime systems, AI voice, beta onboarding, admin dashboards, payments, and mobile.

### Current Architecture Maturity

The architecture is mature for an MVP and early controlled demos, but not yet production SaaS mature. It is missing production primitives that must exist before public beta scale:

- deterministic auth and demo-account separation
- structured logs and request IDs
- Sentry/error tracking
- Redis rate limits/cache/presence foundation
- durable job model and workers
- object storage for reports/audio
- isolated compiler worker
- CI/CD gates
- staging environment
- health/readiness checks
- admin RBAC and audit logs

### SaaS Readiness Level

Current readiness: **MVP complete, SaaS foundation incomplete**.

AlgoVision should not yet launch realtime battles, paid plans, public voice features, or large beta cohorts until stabilization and infrastructure gates are met.

### Biggest Current Risks

- Auth instability due to mixed public signup and admin auto-confirmed signup paths.
- Backend service-role Supabase usage bypasses RLS, requiring explicit ownership checks.
- Local compiler execution runs too close to the API runtime.
- No durable queue/worker model for reports, emails, account seeding, TTS, or compiler jobs.
- No Redis layer for rate limits, presence, matchmaking, leaderboards, or realtime fanout.
- No observability baseline, making crashes difficult to diagnose.
- Local temp storage for generated reports is not multi-replica safe.
- Realtime battles would be unsafe before compiler isolation, WebSocket recovery, Redis snapshots, and server-authoritative timers.

### Biggest Strengths

- Backend-generated visualization states give a clean base for analytics, AI tutoring, voice narration, and replay.
- Modular FastAPI routers and service modules are already a good modular-monolith base.
- React visualizer components can be extended into timeline-driven voice playback.
- Supabase accelerates Auth/Postgres/Storage for beta without building infrastructure from scratch.
- Current MVP already covers meaningful learning workflows: visualize, practice, ask AI, track performance, generate reports.

---

## 2. Architecture Dependency Graph

### Foundation Dependencies

```text
Auth stabilization
  -> beta onboarding
  -> admin account seeding
  -> role-based dashboards
  -> payments and entitlements

Request IDs + structured logs + Sentry
  -> production debugging
  -> beta rollout
  -> WebSocket incident response
  -> worker observability
  -> monetization support

CI/CD + staging
  -> beta launch
  -> safe releases
  -> rollback confidence
  -> public launch
```

### Infrastructure Dependencies

```text
Redis
  -> rate limiting
  -> cache
  -> WebSocket presence
  -> realtime pub/sub
  -> Redis Streams for short-term replay
  -> leaderboards
  -> matchmaking queues

Durable job table + worker runtime
  -> onboarding emails
  -> report generation
  -> TTS generation
  -> compiler execution dispatch
  -> analytics rollups
  -> payment webhook processing

Object storage
  -> report persistence
  -> avatar uploads
  -> narration audio
  -> signed download URLs
```

### Realtime Dependencies

```text
Redis + WebSocket auth + connection manager
  -> presence
  -> live leaderboard notifications
  -> admin live dashboard
  -> battle rooms

Compiler worker isolation
  -> safe practice scale
  -> safe coding battles

Battle schema + server authoritative timers + Redis snapshots
  -> battle room synchronization
  -> reconnect recovery
  -> finalization and scoring
```

### AI Voice Dependencies

```text
Object storage + durable jobs + Redis locks
  -> narration assets
  -> TTS queue
  -> audio cache

Timeline manifest
  -> captions
  -> text-only voice mode
  -> synchronized audio playback

TTS license review + benchmark
  -> production voice model choice
  -> paid voice feature eligibility
```

### Dangerous Implementation Orders To Avoid

- Do not build battles before compiler isolation.
- Do not build WebSocket battle rooms before Redis presence/snapshots and reconnect recovery.
- Do not launch beta onboarding before auth flow separation and email/audit logging.
- Do not add payments before entitlements, audit logs, webhook idempotency, and usage counters.
- Do not build voice generation before workers, object storage, signed URLs, and rate limits.
- Do not build admin analytics with raw unbounded queries; add rollups and pagination first.
- Do not scale traffic before observability and rollback procedures exist.

---

## 3. Exact Execution Phases

### PHASE 0 - Critical Stabilization

**Goal:** Make the current MVP reliable enough for controlled testing.

**Deliverables:**

- Split public signup from admin demo-account creation.
- Idempotent user profile upsert.
- Explicit backend ownership checks for service-role Supabase operations.
- Request ID middleware.
- Consistent API error response contract.
- Structured backend logs.
- CORS restricted by environment.
- Health endpoints: `/health/live`, `/health/ready`.
- Report storage moved from local temp paths to object storage or production-safe storage keys.
- Compiler status normalization and source/stdout/stderr limits.
- Environment parity documented for local, Docker, staging, production.

**Systems touched:** auth, Supabase service, backend middleware, reports, compiler, Docker/config, frontend API error handling.

**Risks:** changing auth can break login/signup; storage migration can break report downloads; stricter CORS can break frontend access.

**Dependencies:** existing MVP code and Supabase project.

**Testing strategy:** auth smoke tests, protected route tests, report generation/download test, compiler status tests, frontend build, Docker build.

**Deployment impact:** low to medium; requires env validation and CORS origin config.

**Scalability impact:** reduces crash risk but does not yet add scaling capacity.

**Rollback considerations:** keep old report download path temporarily; feature-flag admin demo-account flow; deploy auth changes to staging first.

---

### PHASE 1 - Infrastructure Hardening

**Goal:** Add production primitives required before feature expansion.

**Deliverables:**

- GitHub Actions for backend CI, frontend build, Docker build, and security checks.
- Staging environment.
- Sentry frontend/backend.
- Redis instance.
- Redis-backed rate limits for auth, AI, compiler, reports.
- Durable `jobs` table.
- Worker process skeleton.
- Dead-letter job model.
- Audit logs table.
- Basic admin RBAC dependency.
- Backup/restore and rollback docs.

**Systems touched:** CI/CD, deployment, observability, Redis, backend jobs, admin, database.

**Risks:** Redis outages affecting rate-limited endpoints; worker complexity introduced before enough monitoring; CI env mismatch.

**Dependencies:** Phase 0 request IDs, config parity, health endpoints.

**Testing strategy:** CI green checks, Redis unavailable simulation, worker job retry test, rate-limit tests, staging smoke tests.

**Deployment impact:** medium; new infrastructure services and secrets.

**Scalability impact:** enables safe beta traffic and protects expensive endpoints.

**Rollback considerations:** rate limits should fail open only for local/dev and fail controlled in production; worker jobs should be idempotent.

---

### PHASE 2 - SaaS Foundations

**Goal:** Establish SaaS-grade user, admin, storage, analytics, and operations foundations.

**Deliverables:**

- Admin dashboard foundation.
- RBAC roles: `user`, `beta_tester`, `instructor`, `admin`, `super_admin`.
- Profile fields: username, avatar, university, semester, bio, XP fields.
- Supabase Storage buckets for reports, avatars, narration audio.
- Signed URL service.
- Usage counters foundation.
- Event ledger for XP/streak/activity.
- Analytics rollup tables.
- TanStack Query or equivalent for core frontend server state.
- Known issues and incident workflow docs.

**Systems touched:** database, storage, admin frontend, backend services, frontend state, analytics.

**Risks:** service-role misuse; admin pages causing expensive queries; frontend state refactor causing regressions.

**Dependencies:** Phase 1 RBAC, audit logs, storage, worker skeleton.

**Testing strategy:** role tests, signed URL authorization tests, profile update tests, admin pagination tests, frontend regression smoke tests.

**Deployment impact:** medium; schema additions and frontend state changes.

**Scalability impact:** prepares account/profile/admin systems for beta cohorts.

**Rollback considerations:** additive schema only; avoid destructive profile migrations; keep old report paths during transition.

---

### PHASE 3 - Realtime Foundations

**Goal:** Build the generic realtime substrate before product-specific realtime features.

**Deliverables:**

- WebSocket auth.
- Connection manager.
- Heartbeat and stale presence TTL.
- Redis presence keys.
- Room join/leave model.
- Event envelope with `event_id`, `event_type`, `room_id`, `sequence`, `server_time_ms`.
- Redis pub/sub fanout.
- Redis Streams for replayable room events.
- Basic reconnect snapshot flow.
- WebSocket metrics and logs.
- Admin live health view fallback to polling.

**Systems touched:** backend realtime modules, Redis, frontend realtime client, monitoring, admin.

**Risks:** socket leaks, reconnect loops, token expiry handling, Redis fanout bugs.

**Dependencies:** Phase 1 Redis, observability, auth hardening; Phase 2 admin/RBAC.

**Testing strategy:** connect/disconnect tests, token expiry tests, heartbeat timeout tests, reconnect snapshot tests, multi-tab tests, load test with simulated sockets.

**Deployment impact:** medium to high; hosting must support WebSockets and proxy timeouts must be configured.

**Scalability impact:** enables live leaderboards, admin presence, matchmaking, and battles later.

**Rollback considerations:** realtime features must degrade to REST polling; disable socket routes with feature flag if needed.

---

### PHASE 4 - AI Voice Expansion

**Goal:** Add synchronized voice-guided visualizations without blocking normal visualization flow.

**Deliverables:**

- Narration planner with deterministic templates.
- Timeline manifest without audio first.
- Captions synchronized to animation.
- Narration asset tables.
- TTS job tables and worker.
- Kokoro/Piper benchmark and license review.
- Audio asset storage in private bucket.
- Signed URL refresh for audio.
- Segment cache by text/model/voice/version hash.
- Frontend `VoiceTimelinePlayer`.
- Text-only fallback.
- TTS generation metrics and limits.

**Systems touched:** algorithm response enrichment, voice backend, workers, storage, frontend visualizer player, observability.

**Risks:** TTS latency, model license mismatch, audio drift, storage URL expiry, queue overload.

**Dependencies:** Phase 1 workers/Redis; Phase 2 storage/signed URLs; Phase 3 optional progress events.

**Testing strategy:** manifest tests, segment hash tests, job retry tests, signed URL auth tests, frontend seek/play/pause tests, drift checks, TTS failure fallback.

**Deployment impact:** medium; adds worker CPU load and storage writes.

**Scalability impact:** adds cacheable AI/voice asset pipeline.

**Rollback considerations:** voice must be feature-flagged; visualizations continue in text-only mode if voice fails.

---

### PHASE 5 - Community And Leaderboards

**Goal:** Add engagement systems that rely on durable events and Redis sorted sets.

**Deliverables:**

- XP event ledger.
- Badge system foundation.
- Streak hardening.
- Redis sorted sets for global/weekly/monthly XP leaderboards.
- Leaderboard rebuild job from Postgres.
- Leaderboard snapshots.
- Abuse caps and suspicious activity flags.
- Realtime leaderboard invalidation/delta events.
- Profile rank display.

**Systems touched:** gamification, Redis, workers, frontend profile/leaderboard pages, realtime events.

**Risks:** leaderboard abuse, Redis data loss, event duplication, expensive leaderboard queries.

**Dependencies:** Phase 1 Redis/workers; Phase 2 profiles/event ledger; Phase 3 realtime optional.

**Testing strategy:** XP idempotency tests, Redis rebuild test, rank query tests, duplicate event tests, abuse cap tests.

**Deployment impact:** medium; new writes on practice/visualization events.

**Scalability impact:** improves engagement while keeping Redis rebuildable from Postgres.

**Rollback considerations:** Redis leaderboard can be disabled and rebuilt; XP ledger remains durable truth.

---

### PHASE 6 - Beta User Rollout

**Goal:** Launch controlled beta onboarding with exact email mapping, auto-verified demo accounts, and feedback loops.

**Deliverables:**

- Google Form or embedded application form.
- `beta_applications` table.
- Admin review UI.
- Admin approval/rejection workflow.
- Supabase Admin API account creation.
- Auto-verified accounts mapped to submitted emails.
- Temporary password generation.
- Forced reset or setup-link flow.
- Resend onboarding email workflow.
- Onboarding tracking: invited, emailed, first login, activated, feedback submitted.
- Feedback form and review collection.
- Beta analytics dashboard.

**Systems touched:** beta domain, admin, auth, email, workers, audit logs, analytics.

**Risks:** emailing credentials, duplicate accounts, Supabase API rate limits, user PII retention, deliverability failure.

**Dependencies:** Phase 0 auth separation; Phase 1 workers/audit logs/rate limits; Phase 2 admin/RBAC/profile; email provider setup.

**Testing strategy:** dry-run seeding, duplicate email test, email template test, audit log test, first-login tracking test, beta analytics test.

**Deployment impact:** medium; adds admin-only account creation and email workflow.

**Scalability impact:** supports controlled cohorts before public launch.

**Rollback considerations:** account creation jobs must be idempotent; emails can be resent; approvals can be revoked with audit log.

---

### PHASE 7 - Multiplayer Battles

**Goal:** Add safe, server-authoritative 1v1 coding battles.

**Deliverables:**

- Isolated compiler worker complete.
- Battle schema: battles, participants, submissions, events.
- Matchmaking requests table.
- Redis matchmaking queues and locks.
- Matchmaking worker.
- Battle room snapshots in Redis.
- Ready check, countdown, running, finalizing, completed states.
- Server-authoritative timers.
- REST submission command path.
- Compiler job integration.
- Scoring and finalization.
- Stuck battle repair job.
- Suspicious activity event capture.
- Battle history and rating updates.

**Systems touched:** realtime, compiler worker, workers, Redis, database, frontend battle UI, gamification, leaderboards.

**Risks:** compiler abuse, timer cheating, reconnect bugs, duplicate submissions, stuck battles, Redis failure.

**Dependencies:** Phase 1 workers/Redis; Phase 3 realtime foundation; Phase 5 leaderboards; compiler isolation must be production-ready.

**Testing strategy:** battle lifecycle tests, reconnect tests, timer cutoff tests, compiler timeout tests, duplicate event tests, load tests for sockets and submissions.

**Deployment impact:** high; requires WebSocket hosting validation and worker capacity.

**Scalability impact:** largest load increase; must be rolled out slowly.

**Rollback considerations:** battles behind feature flag; disable matchmaking first; preserve battle records for audit.

---

### PHASE 8 - Monetization

**Goal:** Add paid SaaS plans without compromising data integrity.

**Deliverables:**

- Stripe customer mapping.
- Subscriptions table.
- Usage counters.
- Entitlement service.
- Stripe webhook signature verification.
- Webhook event idempotency table.
- Plan gates for AI, TTS, reports, battles, advanced analytics.
- Billing admin view.
- Failed payment and cancellation handling.

**Systems touched:** billing, backend gates, frontend plans, workers, audit logs, admin.

**Risks:** incorrect entitlements, webhook replay bugs, unpaid access, billing support burden.

**Dependencies:** Phase 1 durable jobs/audit logs; Phase 2 usage counters/RBAC; Phase 4/7 if charging for voice/battles.

**Testing strategy:** Stripe test mode, webhook replay tests, plan downgrade tests, usage limit tests, entitlement cache invalidation tests.

**Deployment impact:** high; introduces financial workflows.

**Scalability impact:** enables paid growth but increases support and compliance needs.

**Rollback considerations:** payments behind environment flag; never delete webhook events; allow manual entitlement override with audit log.

---

### PHASE 9 - Mobile Expansion

**Goal:** Add mobile access after API contracts and auth/session models are stable.

**Deliverables:**

- Expo React Native app.
- Shared API contract references.
- Mobile auth/session flow.
- Profile, practice, AI tutor, leaderboards.
- Lightweight visualizations.
- Push notification architecture for streaks/tournaments.
- Mobile analytics/error tracking.

**Systems touched:** mobile app, auth, API contracts, notifications, analytics.

**Risks:** duplicated UI logic, auth session mismatch, offline behavior, mobile performance for visualizations.

**Dependencies:** stable API contracts; Phase 2 profile/server state; Phase 5 leaderboards; optional Phase 4 voice playback.

**Testing strategy:** device tests, auth restore tests, API compatibility tests, mobile crash reporting, low-network tests.

**Deployment impact:** medium; app distribution setup.

**Scalability impact:** increases traffic and session diversity.

**Rollback considerations:** mobile can be beta-distributed separately; server feature gates protect unstable features.

---

### PHASE 10 - Scale Optimization

**Goal:** Optimize based on real production usage, not speculation.

**Deliverables:**

- Load testing for API, WebSockets, compiler, TTS, reports.
- Database index review and query budgets.
- Cache hit-rate analysis.
- Redis memory and command-rate tuning.
- Worker autoscaling rules.
- CDN for frontend/static/audio assets.
- OpenTelemetry traces.
- SLOs and alert thresholds.
- Cost dashboards.
- Data retention and archival policies.

**Systems touched:** infra, database, Redis, workers, CDN, observability, deployment.

**Risks:** optimizing the wrong bottleneck, cost spikes, cache inconsistency.

**Dependencies:** real beta/public usage data and observability.

**Testing strategy:** k6/Locust/Artillery load tests, chaos/failure tests, restore tests, cache rebuild tests.

**Deployment impact:** medium to high depending on hosting changes.

**Scalability impact:** improves efficiency and reliability for public scale.

**Rollback considerations:** deploy scaling changes incrementally; keep cache rebuild and DB fallback paths.

---

## 4. Sprint-Level Breakdown

Assume 1-week sprints. If the team is part-time, treat each sprint as a milestone block rather than a calendar week.

### Sprint 0 - Baseline And Freeze

**Objectives:** stop feature drift, record current state.

**Backend tasks:** run backend tests/import checks; list auth/report/compiler known failures.

**Frontend tasks:** run build; smoke core pages; record UI/auth issues.

**DevOps tasks:** verify env files, Docker build, deployment commands.

**Testing tasks:** baseline auth, visualization, practice, AI, reports.

**Deployment tasks:** document current deploy path.

**Risk areas:** hidden env mismatch, untracked docs, unknown failures.

### Sprint 1 - Auth And Error Contract

**Objectives:** deterministic auth and consistent errors.

**Backend tasks:** split signup/demo creation; profile upsert; error envelope; ownership checks.

**Frontend tasks:** handle stable error shape; remove brittle auth redirects where needed.

**DevOps tasks:** configure environment CORS origins.

**Testing tasks:** signup/login/logout/session restore; duplicate email; invalid token.

**Deployment tasks:** staging auth smoke test.

**Risk areas:** Supabase trigger/profile timing, service-role behavior.

### Sprint 2 - Logging, Health, Reports, Compiler Guardrails

**Objectives:** make failures visible and reduce high-risk paths.

**Backend tasks:** request IDs, structured logs, health endpoints, report storage migration, compiler limits/status normalization.

**Frontend tasks:** attach request IDs to failed request reports; report download compatibility.

**DevOps tasks:** logging format, readiness checks.

**Testing tasks:** health, report generation/download, compiler timeout/compile/runtime statuses.

**Deployment tasks:** verify health checks in Docker/staging.

**Risk areas:** report storage migration and compiler behavior changes.

### Sprint 3 - CI/CD And Sentry

**Objectives:** prevent broken builds and capture crashes.

**Backend tasks:** backend CI test/import command.

**Frontend tasks:** frontend build CI; Sentry setup.

**DevOps tasks:** GitHub Actions for backend, frontend, Docker, security scan; staging deploy workflow.

**Testing tasks:** CI failure simulation; Sentry test event.

**Deployment tasks:** staging environment configured.

**Risk areas:** secrets in CI, Vite build-time env values.

### Sprint 4 - Redis And Rate Limits

**Objectives:** protect expensive endpoints and prepare realtime.

**Backend tasks:** Redis client; rate-limit middleware/dependencies for auth, AI, compiler, reports.

**Frontend tasks:** graceful rate-limit messages.

**DevOps tasks:** Redis service in local/staging; Redis env/secrets.

**Testing tasks:** rate-limit tests; Redis unavailable behavior.

**Deployment tasks:** deploy Redis-backed staging.

**Risk areas:** Redis outage, false-positive rate limits.

### Sprint 5 - Durable Jobs And Worker Skeleton

**Objectives:** create background work foundation.

**Backend tasks:** `jobs` table, job service, worker process, retry/dead-letter policy.

**Frontend tasks:** generic job status UI pattern if needed.

**DevOps tasks:** worker service in Compose/staging.

**Testing tasks:** enqueue, retry, idempotency, dead-letter tests.

**Deployment tasks:** deploy worker disabled or low-risk first.

**Risk areas:** duplicate jobs, stuck jobs, missing monitoring.

### Sprint 6 - Admin RBAC, Audit Logs, Storage

**Objectives:** SaaS operations foundation.

**Backend tasks:** RBAC dependencies, audit logs, signed URL service, storage buckets.

**Frontend tasks:** admin shell, protected admin routes.

**DevOps tasks:** storage bucket/env setup.

**Testing tasks:** role authorization, signed URL access, audit log writes.

**Deployment tasks:** staging admin smoke test.

**Risk areas:** admin privilege leakage, private asset exposure.

### Sprint 7 - Profiles, Events, Analytics Rollups

**Objectives:** build durable user activity foundation.

**Backend tasks:** profile fields, XP/activity event ledger, rollup tables.

**Frontend tasks:** profile page updates; server-state management for profile/core pages.

**DevOps tasks:** scheduled rollup worker configuration.

**Testing tasks:** profile update, event idempotency, rollup generation.

**Deployment tasks:** additive schema deployment.

**Risk areas:** schema drift, expensive analytics queries.

### Sprint 8 - Realtime Foundation

**Objectives:** generic WebSocket layer.

**Backend tasks:** socket auth, connection manager, heartbeat, Redis presence, event envelope.

**Frontend tasks:** realtime client, reconnect handling.

**DevOps tasks:** WebSocket proxy/hosting timeout config.

**Testing tasks:** connect, disconnect, heartbeat, reconnect, auth expiry.

**Deployment tasks:** staging socket validation.

**Risk areas:** reconnect loops, socket leaks, proxy timeouts.

### Sprint 9 - Leaderboards

**Objectives:** first production realtime-lite feature.

**Backend tasks:** XP ledger integration, Redis sorted sets, rebuild job, leaderboard APIs.

**Frontend tasks:** leaderboard page and profile rank.

**DevOps tasks:** Redis memory monitoring.

**Testing tasks:** rank correctness, rebuild, duplicate event handling.

**Deployment tasks:** feature-flag leaderboard rollout.

**Risk areas:** abuse, Redis data loss, stale ranks.

### Sprint 10 - Beta Onboarding Automation

**Objectives:** controlled beta launch pipeline.

**Backend tasks:** beta applications, approval workflow, Supabase Admin API account seeding, email job.

**Frontend tasks:** admin beta review UI, onboarding status, feedback form.

**DevOps tasks:** email provider setup, verified domain if possible.

**Testing tasks:** dry-run seed, duplicate prevention, email send, audit logs.

**Deployment tasks:** beta cohort 1 launch.

**Risk areas:** credential handling, email deliverability, PII retention.

### Sprint 11 - Voice Manifest

**Objectives:** voice-ready timeline without production TTS dependency.

**Backend tasks:** narration planner, manifest endpoint, deterministic templates.

**Frontend tasks:** timeline player, captions, text-only mode.

**DevOps tasks:** none beyond existing.

**Testing tasks:** manifest/state sync, seek/play/pause.

**Deployment tasks:** beta flag.

**Risk areas:** visualizer regressions, timeline drift.

### Sprint 12 - TTS Worker And Audio Cache

**Objectives:** async generated voice.

**Backend tasks:** narration assets, TTS jobs, Kokoro/Piper benchmark, storage upload.

**Frontend tasks:** audio segment loading, signed URL refresh, fallback.

**DevOps tasks:** CPU worker sizing, storage monitoring.

**Testing tasks:** job retry, cache hash, audio playback, failure fallback.

**Deployment tasks:** limited beta voice rollout.

**Risk areas:** CPU load, model licensing, queue age.

### Sprint 13-15 - Battle Foundation

**Objectives:** build battle system only after compiler isolation.

**Backend tasks:** compiler worker isolation, battle schema, matchmaking, battle lifecycle, scoring/finalizer.

**Frontend tasks:** matchmaking UI, battle room UI, submission status, reconnect state.

**DevOps tasks:** worker resource limits, WebSocket load tests.

**Testing tasks:** end-to-end battle, timer cutoff, reconnect, stuck battle repair.

**Deployment tasks:** internal tournament only.

**Risk areas:** compiler abuse, synchronization bugs, stuck states.

### Sprint 16+ - Monetization, Mobile, Scale

Proceed only after beta telemetry proves product stability and engagement.

---

## 5. Critical Production Risks

### Auth Failure Risks

**Risk:** public signup and admin auto-confirmed demo signup conflict.

**Mitigation:** separate endpoints, route-level rate limits, stable error contract, audit admin account creation.

### WebSocket Scaling Risks

**Risk:** socket state stored in local memory breaks on restart or multiple replicas.

**Mitigation:** Redis presence, room snapshots, event sequences, reconnect snapshot flow, Redis pub/sub fanout.

### Compiler Risks

**Risk:** user code consumes API CPU/memory or accesses secrets.

**Mitigation:** isolate compiler worker, no production secrets, non-root user, CPU/memory/pid limits, network disabled for submitted code, strict time/output/source limits.

### Queue Overload Risks

**Risk:** TTS, emails, reports, compiler jobs, and analytics compete for worker capacity.

**Mitigation:** job priorities, queue age alerts, worker pools by job type, dead-letter handling, per-user quotas.

### Redis Dependency Risks

**Risk:** Redis outage breaks rate limits, presence, leaderboards, matchmaking.

**Mitigation:** keep durable truth in Postgres, rebuild leaderboards, degrade realtime features, health alerts, managed Redis for production.

### Supabase Limitations

**Risk:** service-role bypasses RLS; API rate limits during bulk beta onboarding.

**Mitigation:** explicit ownership checks, scoped service methods, audit logs, batch seeding with backoff, avoid raw auth table SQL.

### Realtime Synchronization Risks

**Risk:** battles depend on client clocks or missed socket messages.

**Mitigation:** server-authoritative timers, server receive time for submissions, snapshots, Redis Streams for recovery, idempotent event handling.

### AI Inference Bottlenecks

**Risk:** Groq/TTS latency blocks user flows or creates cost spikes.

**Mitigation:** usage limits, async TTS jobs, deterministic narration templates, cache by hash, provider timeouts, fallback text-only mode.

---

## 6. Production Readiness Gates

### Before Beta Launch

- Auth flows deterministic.
- Request IDs and structured logs active.
- Sentry active frontend/backend.
- CI passes backend, frontend, Docker.
- Staging environment exists.
- Health/readiness endpoints deployed.
- Redis rate limits active for auth/AI/compiler/reports.
- Reports stored outside temp disk.
- Admin RBAC and audit logs exist.
- Onboarding email flow tested.
- Known issues reviewed and critical items closed or mitigated.

### Before Realtime Battles

- WebSocket foundation tested.
- Redis presence/snapshots/streams implemented.
- Compiler worker isolated.
- Battle schema and lifecycle tested.
- Server-authoritative timer implemented.
- Reconnect recovery implemented.
- Stuck battle finalizer implemented.
- Socket and compiler load tests passed.
- Battle feature flag exists.

### Before Public Launch

- Beta cohort data reviewed.
- p95 API latency and error rate within targets.
- Frontend error rate acceptable.
- Backup/restore tested.
- Rollback procedure tested.
- Security headers and CORS finalized.
- Rate limits tuned.
- Admin support workflows ready.
- Data retention and account deletion/export policy documented.

### Before Monetization

- Stripe webhooks idempotent.
- Entitlement service implemented.
- Usage counters enforced backend-side.
- Audit logs for billing/admin actions.
- Plan downgrade/cancellation tested.
- Support and refund process documented.
- Paid feature license review complete, especially TTS.

### Before Mobile Launch

- API contracts stable.
- Auth/session strategy stable.
- Profile/practice/AI endpoints mobile-ready.
- Mobile crash reporting active.
- Push notification policy defined.
- Mobile beta distribution process ready.

---

## 7. Beta Rollout System

### STEP 1 - Google Form

Collect:

- full name
- exact email to use for account
- university/department/semester
- learning goal
- preferred programming language
- consent for beta feedback
- optional notes

Export or sync responses into `beta_applications`.

Suggested table:

```sql
create table beta_applications (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  university text,
  department text,
  semester text,
  learning_goal text,
  preferred_language text,
  status text not null default 'submitted',
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id),
  user_id uuid references public.users(id),
  metadata jsonb default '{}'::jsonb
);
```

### STEP 2 - Admin Approval System

Admin dashboard actions:

- view applications
- approve
- reject
- create account
- resend onboarding email
- reset temp password
- mark contacted
- export feedback

Every admin action writes `audit_logs`.

### STEP 3 - Auto-Generated Demo Accounts

Requirements:

- generated account maps to submitted email exactly
- account is auto-verified
- temporary password generated securely
- profile seeded with beta role
- onboarding email sent automatically
- action is idempotent

Architecture:

```text
Admin approves application
  -> backend creates account_seed job
  -> worker calls Supabase Admin API create_user
  -> email_confirm = true
  -> password = generated temporary password
  -> public.users profile upserted
  -> role = beta_tester
  -> onboarding email job queued
  -> audit log written
  -> beta_applications.user_id updated
```

Use Supabase Admin API, not raw SQL into `auth.users`.

Temporary password rules:

- random high-entropy password
- never logged
- stored only as needed for immediate email flow, preferably not persisted
- force reset on first login where feasible
- expire invitation/setup flow where feasible

### STEP 4 - Feedback Collection

Collect:

- onboarding success
- first feature used
- confusing screens
- bugs/crashes
- AI tutor quality
- visualization clarity
- practice/compiler experience
- desired features
- willingness to keep using

Tie feedback to:

- user ID
- release version
- cohort
- timestamp

### STEP 5 - Analytics Review

Review weekly:

- applications submitted
- approved users
- emails delivered/opened
- first login rate
- activation rate
- visualizations completed
- practice attempts
- AI tutor messages
- reports generated
- errors per user
- feedback score
- churn/inactive users

Beta expansion rule: do not increase cohort size until auth, onboarding, error rate, and core learning flow metrics are stable for the current cohort.

---

## 8. Infrastructure Evolution Plan

### Introduce Immediately

- CI/CD
- staging
- Sentry
- request IDs
- structured logs
- health/readiness endpoints
- object storage for reports

### Introduce Before Beta

- Redis
- rate limits
- worker runtime
- durable job table
- audit logs
- email provider
- admin RBAC

### Introduce Before Voice

- narration jobs
- audio storage
- signed URL refresh
- Redis locks/cache
- TTS worker metrics

### Introduce Before Realtime Battles

- WebSockets
- Redis presence/pubsub/streams
- room snapshots
- compiler worker isolation
- battle finalizer worker
- socket load testing

### Introduce Before Public Launch

- CDN for frontend/static assets
- cache tuning
- backup/restore testing
- security scans
- alerting dashboard
- data retention policy

### Introduce After Real Usage Justifies It

- GPU TTS workers
- dedicated realtime runtime
- multiple worker pools
- OpenTelemetry traces
- advanced BI tools
- mobile push notification backend

---

## 9. Engineering Team Simulation

Even with a small team, responsibilities should be explicit.

### Frontend Owner

- React/Vite app shell.
- Auth/session UX.
- Visualizers and timeline player.
- Practice/compiler UI.
- Admin dashboard UI.
- Realtime client and reconnect states.
- Loading/error/empty states.
- Frontend Sentry and analytics.

### Backend Owner

- FastAPI routers and domain services.
- Supabase service ownership checks.
- Auth, RBAC, admin APIs.
- Algorithm engines and contracts.
- Compiler worker integration.
- Jobs, reports, beta onboarding, billing.
- API error contract and request IDs.

### Infrastructure Owner

- Docker and Compose.
- GitHub Actions.
- Staging/production environments.
- Redis.
- Workers.
- Secrets.
- Health checks.
- Monitoring and rollback.

### AI Systems Owner

- Groq tutor prompts and limits.
- Prompt versioning.
- Narration templates.
- TTS model benchmark and license review.
- TTS worker/cache/storage.
- AI/voice usage analytics and cost tracking.

### Release Owner

- Branch discipline.
- Changelog and release notes.
- Release tags.
- Staging verification.
- Production deploy approval.
- Rollback readiness.
- Post-release monitoring.

One person can hold multiple roles, but every sprint must state who is accountable for each role.

---

## 10. Final Recommended Stack

### Backend Stack

- FastAPI
- Uvicorn/Gunicorn where hosting requires process management
- Pydantic/Pydantic Settings
- Supabase Python client
- Domain modules inside modular monolith
- Postgres-backed durable jobs plus Redis dispatch

### Frontend Stack

- React + Vite
- Tailwind CSS
- Axios
- Supabase JS for auth session where appropriate
- TanStack Query for server state
- Chart.js

### Realtime Stack

- Phase 1: FastAPI WebSockets
- Redis presence/pubsub/streams
- Server-authored event envelope
- Possible Socket.IO reassessment only if battle-room complexity justifies it

### Mobile Stack

- React Native with Expo
- Shared API contracts
- Sentry mobile

### Observability Stack

- Sentry frontend/backend/worker
- Structured JSON logs
- Request IDs
- Health/readiness endpoints
- OpenTelemetry later
- Provider/job/socket metrics

### Email Stack

- Resend as first choice
- SMTP fallback
- Worker-based sends
- Delivery event tracking where available

### CI/CD Stack

- GitHub Actions
- backend CI
- frontend build
- Docker build
- dependency/security scan
- staging deploy on `dev`
- production deploy on release tag

### Deployment Stack

- Dockerized backend/frontend/workers
- Supabase Auth/Postgres/Storage
- Managed Redis such as Upstash or equivalent
- Static frontend through Nginx/CDN
- Staging and production separated
- CDN later for audio/static assets

---

## 11. Launch Strategy

### Closed Beta Strategy

- Start with 10-20 known users.
- Use exact-email approval and auto-created beta accounts.
- Feature flags: voice, leaderboards, battles off unless explicitly enabled.
- Weekly feedback review.
- Expand only after stability gates are green.

### Campus Rollout Strategy

- Cohort 1: internal classmates and trusted testers.
- Cohort 2: one department or course.
- Cohort 3: multiple universities or clubs.
- Use beta analytics to identify top learning flows before marketing broadly.

### Release Strategy

- `dev` deploys to staging/beta.
- Release branches harden versions.
- Tags deploy production.
- GitHub Releases include user-facing notes, known limitations, and rollback reference.

### Testing Waves

1. Internal smoke test.
2. Developer dogfood.
3. Closed beta cohort.
4. Expanded campus beta.
5. Public beta.
6. Production launch.

### Staged Rollout Plan

- Stage 1: stable MVP with onboarding.
- Stage 2: profile/gamification/leaderboards.
- Stage 3: voice-guided visualizations.
- Stage 4: battles by invite only.
- Stage 5: payments and premium limits.
- Stage 6: mobile beta.

---

## 12. Success Metrics

### Stability Metrics

- backend 5xx rate < 1 percent during beta
- auth success rate > 98 percent for valid credentials
- p95 non-compiler API latency < 300 ms
- frontend error rate < 2 percent of sessions
- worker oldest job age below configured SLA
- zero critical secrets exposed to frontend

### Engagement Metrics

- visualizations completed per active user
- practice attempts per active user
- AI tutor messages per active user
- reports generated per week
- profile completion rate

### Retention Metrics

- day 1 activation rate
- day 7 retention
- weekly active users
- streak continuation rate
- returning users after feedback email

### Leaderboard Activity

- XP events per day
- leaderboard page views
- weekly ranked users
- suspicious XP events
- Redis rebuild success

### Battle Participation

- matchmaking queue joins
- average wait time
- battle start success rate
- battle completion rate
- reconnect recovery rate
- compiler timeout rate
- disputed/stuck battle count

### AI Tutor Usage

- messages per user
- provider latency
- provider failure rate
- token usage per user
- AI rate-limit hits
- feedback quality score where collected

### Voice Metrics

- TTS cache hit rate
- average generation time
- failed segment rate
- text-only fallback rate
- playback buffering time
- generated minutes per day

### Onboarding Completion

- application submitted
- approved
- account created
- email delivered
- first login
- first visualization
- first practice attempt
- first feedback submitted

### System Uptime And Latency Targets

- beta uptime target: 99 percent
- public launch uptime target: 99.5 percent or higher
- WebSocket reconnect success > 95 percent
- p95 WebSocket event delivery under 500 ms for beta rooms
- report generation job completes within 60 seconds for normal reports
- TTS first segment ready within acceptable beta SLA when cached or pre-generated

---

## Final Execution Rule

AlgoVision should move forward only when the current layer is stable enough to support the next layer.

The correct order is:

```text
stabilize MVP
  -> add observability and CI/CD
  -> add Redis, workers, storage, RBAC
  -> build SaaS user/admin foundations
  -> add realtime substrate
  -> add leaderboards and beta onboarding
  -> add voice and battles behind flags
  -> monetize proven usage
  -> expand to mobile
  -> optimize scale using real metrics
```

This ordering prevents feature chaos, protects the current working product, and gives AlgoVision a realistic startup-grade path from MVP to production SaaS.
