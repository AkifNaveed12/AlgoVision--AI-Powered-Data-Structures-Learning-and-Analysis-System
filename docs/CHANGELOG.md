# AlgoVision — Changelog

> **Purpose:** Engineering changelog tracking all changes by version/phase.
> Format follows [Keep a Changelog](https://keepachangelog.com/) conventions.

---

## [Unreleased] — Phase 0: Critical Stabilization

### Added
- `docs/CONTEXT.md` — Permanent engineering memory system
- `docs/SYSTEM_DECISIONS.md` — Architecture decision records (ADR-001 through ADR-009)
- `docs/KNOWN_ISSUES.md` — Issue tracker with 12 identified issues (KI-001 through KI-012)
- `docs/CHANGELOG.md` — This changelog
- `docs/RELEASE_NOTES.md` — User/tester-facing release notes
- `docs/ARCHITECTURE_STATUS.md` — Architecture status dashboard

### Pending (Phase 0 — Stabilization)
- Auth flow separation (public signup vs admin demo-accounts)
- Request ID middleware
- Structured JSON logging
- Consistent API error contract
- Health endpoints (`/health/live`, `/health/ready`)
- CORS restriction by environment
- Report storage migration (temp disk → object storage)
- Compiler guardrails (source length, timeout, process tree kill)
- Environment parity documentation

---

## [0.1.0-pre] — 2026-05-26 — SaaS Architecture Planning

### Added
- `SAAS_Planning.md` — Master SaaS evolution blueprint (75KB)
- `STABILIZATION_ROADMAP.md` — Production hardening plan (25KB)
- `REALTIME_ARCHITECTURE.md` — WebSocket, Redis, battles design (25KB)
- `AI_VOICE_ARCHITECTURE.md` — Voice-guided visualization pipeline (29KB)
- `EXECUTION_MASTERPLAN.md` — Master implementation order (43KB)
- `ENGINEERING_WORKFLOW_SYSTEM.md` — Engineering operating system (21KB)

---

## [0.0.4] — 2026-05-14 — Cloud Deployment Fixes

### Fixed
- CORS configuration for Vercel dynamic deployment URLs
- `VITE_API_URL` fallback for Vercel deployment
- Auth signup fallback to standard `sign_up` when admin API is unavailable

### Changed
- CORS origins set to wildcard `["*"]` to accommodate Vercel (temporary — tracked as KI-002)

---

## [0.0.3] — Version 4 — Final Integration

### Added
- Gamification: daily streaks, longest streak tracking
- Groq AI Tutor integration with context-aware prompts
- Off-screen Chart.js PDF report generation
- Performance analytics dashboard
- Deployment-ready Docker configuration

---

## [0.0.2] — Version 2/3 — Compiler and Expansion

### Added
- Local Python subprocess compiler (replacing Judge0 dependency)
- Sorting algorithm visualizations
- Docker containerization and CI/CD pipeline setup
- BST, AVL tree, and graph visualizers
- Practice arena with code editor

---

## [0.0.1] — Version 1 — MVP

### Added
- FastAPI backend with modular router architecture
- React + Vite frontend with Tailwind CSS
- Supabase Auth integration (JWT)
- Array and linked list visualizers with step-by-step animations
- Database schema: users, algorithm_runs, practice_problems, practice_attempts, reports
- RLS policies for user data isolation
- Auto-profile creation trigger on auth signup
