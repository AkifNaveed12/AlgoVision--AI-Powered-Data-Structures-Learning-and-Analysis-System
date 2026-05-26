# AlgoVision Engineering Workflow System

**Purpose:** Define the long-term engineering operating system for evolving AlgoVision from an FYP/MVP into a production-grade SaaS educational platform.

**Architecture context rebuilt from:** `SAAS_Planning.md`, `STABILIZATION_ROADMAP.md`, `REALTIME_ARCHITECTURE.md`, `AI_VOICE_ARCHITECTURE.md`, `docs/prd.md`, `docs/planning.md`, `docs/idea.md`, `docs/schema.md`, `docs/project_status_report.md`, and `docs/diagrams/*`.

---

## Current Architecture Direction

AlgoVision should continue as a **modular monolith SaaS**, not a premature microservices system. The current working product is a React/Vite frontend, FastAPI backend, Supabase Auth/PostgreSQL foundation, Groq AI tutor, backend-generated visualization state engine, local compiler execution, performance analytics, PDF reports, and Docker-based deployment.

The SaaS evolution path is:

```text
React/Vite Frontend
  -> FastAPI REST + WebSocket modular monolith
  -> Supabase Auth/PostgreSQL/Storage
  -> Redis for rate limits, cache, presence, pub/sub, streams, leaderboards
  -> Workers for email, reports, TTS, analytics, onboarding, durable jobs
  -> Isolated compiler worker for untrusted code
  -> Object storage for reports, avatars, narration audio
  -> CI/CD, observability, staged environments, admin tooling
```

The core rule is: **keep one repo and one coherent architecture, but separate runtime responsibilities.** API traffic, realtime sockets, background jobs, TTS generation, and untrusted compiler execution must be deployable as separate process/container roles.

Immediate priority remains stabilization: deterministic auth, request IDs, structured logs, Sentry, CORS hardening, Redis rate limits, report storage migration, CI/CD, health checks, and compiler isolation planning. Realtime battles, voice narration, monetization, mobile, and institutional SaaS should build on that foundation.

---

## 1. Recommended Repository Structure

Target structure:

```text
AlgoVision/
  backend/
    algorithms/
    routers/
    services/
    models/
    realtime/
    domains/
      auth/
      beta/
      battles/
      billing/
      compiler/
      gamification/
      leaderboards/
      notifications/
      reports/
      voice/
    workers/
    migrations/
    observability/

  frontend/
    src/
      components/
      pages/
      features/
      hooks/
      lib/
      context/
      realtime/

  database/
    schema.sql
    seed.sql
    migrations/
    policies/
    rollups/

  docs/
    README.md
    CURRENT_ARCHITECTURE.md
    EXECUTION_MASTERPLAN.md
    ENGINEERING_WORKFLOW_SYSTEM.md
    KNOWN_ISSUES.md
    SYSTEM_DECISIONS.md
    API_CONTRACTS.md
    DEPLOYMENT_GUIDE.md
    RELEASE_NOTES.md
    CHANGELOG.md

    architecture/
      backend.md
      frontend.md
      data-model.md
      auth.md
      compiler.md
      modular-monolith.md
      scaling-strategy.md

    realtime/
      realtime-architecture.md
      event-envelope.md
      battle-lifecycle.md
      redis-keyspace.md
      websocket-contracts.md

    ai/
      ai-tutor.md
      voice-architecture.md
      prompt-versions.md
      tts-model-evaluations.md

    deployment/
      environments.md
      ci-cd.md
      docker.md
      rollback.md
      secrets.md
      smoke-tests.md

    beta/
      beta-rollout-plan.md
      onboarding-flow.md
      demo-account-seeding.md
      feedback-system.md
      beta-analytics.md

    adr/
      0000-template.md
      0001-modular-monolith.md
      0002-retain-supabase.md
      0003-add-redis.md
      0004-runtime-role-separation.md

    changelogs/
      unreleased.md
      v1.0.0-beta.md

    releases/
      v1.0.0-beta.md
      v1.1.0-beta.md

    experiments/
      voice-tts-benchmarks/
      websocket-load-tests/
      compiler-sandbox-options/

    research/
      tts-models.md
      mobile-frameworks.md
      realtime-transports.md

    monitoring/
      dashboards.md
      alerts.md
      incident-runbook.md
      slos.md

    devops/
      github-actions.md
      environment-matrix.md
      dependency-scanning.md
      container-hardening.md
```

Existing root planning files can remain for historical continuity, but future edits should converge into `docs/` so architecture state is discoverable and not scattered.

---

## 2. Persistent Architecture Memory Strategy

AlgoVision must treat markdown docs as the durable architecture memory. Codex sessions are temporary; repo documentation is permanent.

Rules:

- `docs/CURRENT_ARCHITECTURE.md` is the first file every architecture session restores.
- `docs/EXECUTION_MASTERPLAN.md` tracks current phase, next milestones, blocked items, and active engineering priorities.
- `docs/SYSTEM_DECISIONS.md` lists accepted decisions with links to ADRs.
- Every major architecture choice gets an ADR.
- Every session that changes architecture updates the relevant doc before ending.
- Every long Codex session ends with a short "Context Handoff" section added to the active planning doc or `docs/context.md`.
- Avoid relying on chat history for anything important.

Context restoration workflow:

1. Read `docs/CURRENT_ARCHITECTURE.md`.
2. Read `docs/EXECUTION_MASTERPLAN.md`.
3. Read `docs/SYSTEM_DECISIONS.md`.
4. Read only domain docs needed for the task, such as `docs/realtime/*` or `docs/ai/*`.
5. Read relevant code files.
6. Execute the task.
7. Update changed docs, ADRs, changelog, and known issues.

---

## 3. Codex Session Workflow

Use small, scoped Codex sessions. Do not run a single giant session for stabilization, realtime, voice, beta, and deployment together.

Recommended session types:

- **Context session:** read docs and summarize current state only.
- **Planning session:** update architecture or roadmap docs only.
- **Implementation session:** modify code for one bounded feature or fix.
- **Verification session:** run tests, smoke checks, and document findings.
- **Release session:** update changelog, tag notes, deployment docs, and rollback steps.

Prompt structure:

```text
Goal:
Files/docs to read first:
Allowed scope:
Out of scope:
Expected deliverables:
Verification required:
Docs to update:
```

When to compact or export:

- Compact once the session contains enough architecture reasoning that losing it would be expensive.
- Export a markdown handoff before switching domains.
- Export before starting large code edits after long planning.
- Export after any decision affecting Redis, workers, auth, compiler isolation, realtime, storage, payments, or TTS.

Avoid context overflow:

- Ask Codex to read exact docs, not the whole repo, unless discovery is needed.
- Keep implementation prompts tied to one feature branch and one subsystem.
- Prefer updating `CURRENT_ARCHITECTURE.md` over repeating long project context in every prompt.
- Use ADR references instead of restating old debates.

---

## 4. Token Efficiency Strategy

Token efficiency comes from persistent docs and scoped work.

Practices:

- Keep architecture truth in markdown, not in prompts.
- Use "read these 3 files first" instead of pasting old context.
- Split work by domain: auth, compiler, realtime, voice, beta, deployment.
- Ask for diffs and specific file edits, not broad repo rewrites.
- Maintain `docs/API_CONTRACTS.md` so API details are not rediscovered.
- Maintain `docs/realtime/redis-keyspace.md` so Redis design is not re-explained.
- Maintain `docs/ai/prompt-versions.md` so AI behavior is versioned.
- Use checklists in docs for continuity.
- Do not rescan all markdown files once `CURRENT_ARCHITECTURE.md` exists and is current.

Efficient architecture query pattern:

```text
Read docs/CURRENT_ARCHITECTURE.md, docs/EXECUTION_MASTERPLAN.md, and docs/adr/0003-add-redis.md.
Then implement only the Redis rate-limit foundation for auth endpoints.
Update docs/KNOWN_ISSUES.md and docs/CHANGELOG.md.
```

---

## 5. Documentation Strategy

These documents should always exist:

| Document | Purpose |
| --- | --- |
| `docs/CURRENT_ARCHITECTURE.md` | One-page current truth of the deployed/planned architecture. |
| `docs/EXECUTION_MASTERPLAN.md` | Active phase, milestones, priorities, dependencies, and next actions. |
| `docs/SYSTEM_DECISIONS.md` | Decision index linking to ADRs. |
| `docs/KNOWN_ISSUES.md` | Bugs, crashes, risks, debt, and mitigation status. |
| `docs/API_CONTRACTS.md` | REST, WebSocket, worker job, and event contracts. |
| `docs/DEPLOYMENT_GUIDE.md` | Local, beta, staging, production deployment steps. |
| `docs/RELEASE_NOTES.md` | Human-readable release notes for users/testers. |
| `docs/CHANGELOG.md` | Engineering changelog by version. |
| `docs/monitoring/incident-runbook.md` | How to investigate production failures. |
| `docs/beta/beta-rollout-plan.md` | Beta application, approval, account seeding, email, feedback, analytics. |
| `docs/context.md` | Session/module handoff log. |

Update policy:

- Code behavior changed: update API/contracts docs if externally visible.
- Architecture changed: update `CURRENT_ARCHITECTURE.md` and an ADR.
- Deployment changed: update deployment guide and smoke tests.
- Bug found but not fixed: update known issues.
- Release prepared: update changelog and release notes.

---

## 6. Architecture Decision Record System

ADRs are mandatory for decisions that affect architecture, infrastructure, data model, security, scaling, cost, or long-term maintainability.

ADR folder:

```text
docs/adr/
  0000-template.md
  0001-modular-monolith.md
  0002-retain-supabase.md
  0003-add-redis.md
  0004-runtime-role-separation.md
  0005-react-native-mobile.md
```

ADR template:

```markdown
# ADR-000X: Title

**Status:** Proposed | Accepted | Superseded
**Date:** YYYY-MM-DD
**Owner:** Name

## Context

What problem forced this decision?

## Decision

What are we choosing?

## Alternatives Considered

What else was considered and rejected?

## Consequences

Benefits, tradeoffs, risks, migration impact.

## Implementation Notes

Files, docs, migrations, rollout steps.
```

Examples required for AlgoVision:

- Why modular monolith is retained.
- Why Supabase remains Auth/Postgres/Storage for beta.
- Why Redis is added for rate limits, presence, pub/sub, streams, and leaderboards.
- Why runtime roles are split into API, realtime, worker, and compiler-worker.
- Why React Native with Expo is the preferred mobile path.
- Why TTS is async, cached, and timeline-driven.

---

## 7. Git Workflow Strategy

Branches:

```text
main                 production-ready
dev                  integration and staging
stabilization        reliability work before SaaS expansion
feature/<scope>      normal feature branch
architecture/<topic> architecture docs and ADRs
release/<version>    release hardening
hotfix/<issue>       urgent production fix
experiment/<topic>   isolated research spikes
```

Rules:

- No direct pushes to `main`.
- `dev` receives PRs after local verification.
- `main` receives release PRs or hotfix PRs only.
- Architecture-changing PRs must include docs and ADR updates.
- Feature PRs must include tests or a documented reason tests were not added.
- Hotfix PRs must update `KNOWN_ISSUES.md`, changelog, and release notes.

Commit format:

```text
feat(scope): short description
fix(scope): short description
docs(scope): short description
chore(scope): short description
test(scope): short description
refactor(scope): short description
```

Recommended scopes: `auth`, `api`, `realtime`, `voice`, `compiler`, `reports`, `beta`, `admin`, `billing`, `docker`, `ci`, `docs`, `observability`.

---

## 8. Release Workflow

Use semantic versioning:

```text
v1.0.0-beta  stabilized MVP
v1.1.0-beta  beta onboarding and demo accounts
v1.2.0-beta  Redis, workers, storage, observability
v1.3.0-beta  gamification and leaderboards
v1.4.0-beta  voice-guided visualization beta
v2.0.0-beta  coding battles public beta
v3.0.0       institutional SaaS and payments
```

Release process:

1. Create `release/<version>` from `dev`.
2. Freeze feature merges.
3. Run backend tests, frontend build, Docker build, and smoke tests.
4. Update `docs/CHANGELOG.md`.
5. Update `docs/releases/<version>.md`.
6. Update rollback notes.
7. Deploy to staging.
8. Run release health checks.
9. Tag release: `vX.Y.Z-beta`.
10. Deploy production only from tag with manual approval.
11. Publish GitHub release notes.
12. Monitor logs, Sentry, health, queue age, auth failures, and frontend errors.

Beta release workflow:

- Use feature flags for unfinished SaaS modules.
- Keep beta users and production users separated by environment or role.
- Record beta-impacting changes in `docs/beta/beta-rollout-plan.md`.
- Send beta release notes when changes affect onboarding, credentials, data, or expected user behavior.

---

## 9. Long-Term SaaS Engineering Workflow

AlgoVision should follow this lifecycle:

```text
research
  -> planning
  -> architecture
  -> ADR
  -> implementation
  -> tests
  -> observability
  -> staged rollout
  -> analytics review
  -> iteration
```

How to apply it:

- **Research:** benchmark tools, licenses, costs, hosting support, and security constraints.
- **Planning:** define product goal, user flow, success metric, non-goals.
- **Architecture:** document data model, runtime role, API/event contracts, failure modes.
- **ADR:** record irreversible or costly decisions.
- **Implementation:** make scoped PRs; keep domain boundaries clear.
- **Tests:** unit, integration, frontend build, smoke, load where relevant.
- **Observability:** logs, metrics, Sentry tags, admin health visibility.
- **Rollout:** local -> beta -> staging -> production, with feature flags.
- **Analytics:** measure usage, failures, cost, latency, drop-offs.
- **Iteration:** update docs and backlog based on real signals.

---

## 10. Feature Development Lifecycle

Every feature follows:

1. **Proposal:** problem, users, success metric, non-goals.
2. **Architecture review:** affected domains, data, APIs, security, scaling.
3. **ADR:** required if infrastructure, data model, auth, runtime, or cost changes.
4. **Contract first:** update REST/WebSocket/event/job schemas.
5. **Implementation:** backend, frontend, worker, migration, config as needed.
6. **Testing:** focused tests plus smoke path.
7. **Observability:** logs, metrics, error tags, admin visibility.
8. **Docs:** update architecture, API contracts, changelog, known issues.
9. **Rollout:** feature flag or beta group first.
10. **Review:** analytics, feedback, bug rate, cost.

Example for voice narration:

```text
proposal -> voice architecture doc -> ADR for async cached TTS
-> narration manifest contract -> tables/jobs/storage
-> frontend timeline player -> worker metrics -> beta flag -> cache/cost review
```

Example for battles:

```text
proposal -> realtime architecture review -> ADR for Redis Streams/Socket transport
-> battle schema -> matchmaking worker -> WebSocket contracts
-> compiler-worker integration -> load test -> beta tournament rollout
```

---

## 11. Engineering Priorities System

Priority order:

1. **Stabilization:** auth reliability, observability, CI/CD, error contracts, report storage, env parity.
2. **Security:** CORS, service-role guardrails, rate limits, compiler isolation, admin RBAC.
3. **Scalability foundation:** Redis, workers, durable jobs, object storage, health checks.
4. **Beta onboarding:** applications, demo accounts, onboarding email, feedback loop.
5. **Gamification:** XP ledger, streak hardening, leaderboards.
6. **AI systems:** AI usage limits, prompt versions, voice timeline, TTS jobs.
7. **Realtime systems:** WebSocket gateway, presence, matchmaking, battles.
8. **UX systems:** consistent loading/error states, TanStack Query, accessibility.
9. **Monetization:** Stripe entitlements, usage counters, plan gates.
10. **Mobile:** Expo app after API contracts and auth are stable.

Decision rule:

- If a feature increases load, abuse surface, cost, or user trust risk, required stabilization work must be done first.
- Battles must not launch before compiler isolation.
- Voice must not launch before durable jobs, storage, rate limits, and TTS license review.
- Payments must not launch before audit logs, entitlements, webhook idempotency, and support workflows.

---

## 12. Monitoring And Technical Debt Workflow

Track technical debt in `docs/KNOWN_ISSUES.md` with:

```text
ID:
Severity:
Domain:
Impact:
Evidence:
Owner:
Target phase:
Mitigation:
Status:
```

Categories:

- bugs
- crashes
- auth failures
- provider failures
- frontend state defects
- slow queries
- large payloads
- compiler risks
- WebSocket/realtime risks
- AI/TTS cost risks
- security debt
- deployment debt

Monitoring workflow:

1. Add request IDs and structured logs.
2. Add Sentry frontend/backend/worker.
3. Track API latency and error rate by route.
4. Track worker queue depth, job age, retries, dead letters.
5. Track Redis availability and command latency.
6. Track WebSocket active connections, reconnects, heartbeat misses.
7. Track AI/TTS token usage, generation minutes, cache hit rate, failures.
8. Track compiler timeouts, runtime errors, queue age, suspicious submissions.
9. Review known issues weekly.
10. Promote recurring incidents into roadmap items or ADRs.

---

## 13. Beta User Rollout Workflow

Ideal beta flow:

```text
beta application form
  -> admin review
  -> approval
  -> Supabase Admin API account creation
  -> auto-verified demo account or setup link
  -> onboarding email
  -> first-login tracking
  -> usage analytics
  -> feedback request
  -> follow-up campaign
```

Required components:

- `beta_applications` table.
- Admin dashboard to approve/reject users.
- Admin-only demo account creation endpoint.
- Idempotent account seeding job.
- Temporary password or magic setup link.
- Automated credential/setup email through Resend or SMTP fallback.
- Audit log for account creation, email resend, password reset, approval changes.
- Feedback form tied to user ID and release version.
- Analytics for activation, visualizer use, AI use, practice attempts, reports, crashes.

Rules:

- Public signup and admin demo-account creation must remain separate.
- Prefer setup links over emailing reusable passwords.
- If temporary passwords are emailed, force reset and expire quickly.
- Never create accounts by raw SQL into Supabase auth tables.
- Use Supabase Admin APIs for auth user creation and SQL only for profile/demo data.
- Beta PII retention and deletion rules must be documented.

---

## 14. Final Recommended Workflow

Daily AlgoVision development workflow:

1. Start by reading `docs/CURRENT_ARCHITECTURE.md`, `docs/EXECUTION_MASTERPLAN.md`, and the active domain doc.
2. Check `docs/KNOWN_ISSUES.md` for blockers or related risks.
3. Work on one bounded task per session.
4. For architecture-impacting work, create or update an ADR before implementation.
5. Implement with scoped changes following existing FastAPI/React/Supabase patterns.
6. Run the smallest meaningful verification first, then broader tests if the blast radius is large.
7. Update API contracts, architecture docs, known issues, and changelog before ending the session.
8. Add a short handoff note to `docs/context.md` after substantial sessions.
9. Compact or export context before switching domains or after major architecture reasoning.
10. Open PR with tests, docs, risks, and rollout notes.
11. Merge to `dev`, deploy to staging/beta, smoke test, then release by tag.

Session start checklist:

- What phase are we in?
- Which domain is affected?
- Which docs are source of truth?
- Is an ADR required?
- What verification proves this is safe?
- What docs must be updated before the session ends?

Session end checklist:

- Code changed and verified.
- Docs updated.
- ADR updated or explicitly not needed.
- Known issues updated.
- Changelog/release notes updated if user-facing or release-relevant.
- Next step is clear.

This workflow keeps AlgoVision sustainable as it grows from a strong educational MVP into a SaaS platform with realtime systems, AI voice, multiplayer battles, admin operations, beta onboarding, monetization, mobile expansion, and production-grade infrastructure.
