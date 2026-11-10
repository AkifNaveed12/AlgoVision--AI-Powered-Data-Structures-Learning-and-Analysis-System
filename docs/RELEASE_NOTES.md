# AlgoVision — Release Notes

> **Purpose:** Human-readable release notes for users, testers, and stakeholders.
> Technical engineering details belong in `CHANGELOG.md`. This file focuses on user-facing impact.

---

## Upcoming: v1.0.0-beta — Stabilized Platform

**Status:** In Development (Phase 0 — Stabilization)
**Target:** After Phase 0 completion

### What's Changing
- More reliable signup and login experience
- Better error messages when something goes wrong
- Improved system health monitoring
- More secure API access controls
- Reports will persist across system updates

### For Beta Testers
- Existing demo accounts will continue to work
- You may notice improved error messages during login/signup
- No feature changes — this release focuses on reliability

---

## Current: Pre-Release — Architecture Planning Complete

**Date:** May 2026

### What's Available
- **Dynamic Visualizer:** Step-by-step animations for Arrays, Linked Lists, BST, AVL Trees, Graphs, Sorting algorithms
- **AI Tutor:** Context-aware AI assistant powered by Groq (Llama 3) that understands your current visualization step
- **Practice Arena:** Built-in code editor with compilation and test case validation
- **Performance Analytics:** Track execution time, memory usage, and operation counts with interactive charts
- **PDF Reports:** Generate comprehensive learning reports with performance data
- **Gamification:** Daily streak tracking to encourage consistent practice
- **Multi-language Compiler:** Supports Python, C, C++, Java, and JavaScript

### Known Limitations
- Platform is in pre-release stabilization phase
- Report files may not persist across system restarts (being fixed)
- Error messages may sometimes contain technical details (being standardized)
- CORS security is temporarily relaxed for deployment flexibility (being hardened)

---

## Version History

### v0.0.4 — Cloud Deployment (May 2026)
- Fixed cloud deployment compatibility with Vercel and Render
- Resolved CORS authentication issues for cloud-hosted frontend

### v0.0.3 — Final Integration (v4)
- Added AI Tutor with contextual understanding
- Added gamification with daily streaks
- Added PDF report generation with charts
- Achieved deployment-ready status

### v0.0.2 — Expansion (v2/v3)
- Added local code compiler (replacing external Judge0 service)
- Added sorting algorithm visualizations
- Added BST, AVL tree, and graph visualizers
- Added practice arena with code editor
- Added Docker containerization

### v0.0.1 — MVP (v1)
- Initial platform with array and linked list visualizations
- Supabase authentication
- Core backend API with FastAPI
- React frontend with Tailwind CSS
