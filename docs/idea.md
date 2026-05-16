# AlgoVision — AI-Powered Data Structures Learning & Analysis System
## Master Project Reference Document (idea.md)
### Version 1.0 | Team: Akif · Arslan · Ruman

---

## Table of Contents

1. [Project Vision](#1-project-vision)
2. [Tech Stack](#2-tech-stack)
3. [Environment Variables](#3-environment-variables)
4. [System Architecture](#4-system-architecture)
5. [Module Breakdown](#5-module-breakdown)
6. [Database Schema (Supabase)](#6-database-schema-supabase)
7. [Supabase Connection & Configuration](#7-supabase-connection--configuration)
8. [API Contracts](#8-api-contracts)
9. [Animation / Visualization State Contracts](#9-animation--visualization-state-contracts)
10. [External Service Integration Contracts](#10-external-service-integration-contracts)
11. [Folder Structure](#11-folder-structure)
12. [Branch Workflow & Git Strategy](#12-branch-workflow--git-strategy)
13. [Team Responsibilities](#13-team-responsibilities)
14. [Execution Plan (Versioned)](#14-execution-plan-versioned)
15. [Data Flow — End-to-End](#15-data-flow--end-to-end)
16. [Error Handling Strategy](#16-error-handling-strategy)
17. [Security Considerations](#17-security-considerations)

---

## 1. Project Vision

AlgoVision is a **full-stack, AI-integrated interactive learning platform** that teaches students data structures and algorithms through:

- **Real-time step-by-step visualization** of operations
- **In-browser code execution** via compiler integration
- **AI-powered tutoring** using natural language
- **Performance benchmarking** with graphs and metrics
- **Structured practice problems** with AI hints
- **Downloadable PDF reports** of learning progress

**Core Learning Loop:**
```
Learn → Execute → Visualize → Analyze → Improve
```

**Why it is different from YouTube/tutorials:**  
Static resources show you *what* happens. AlgoVision shows you *how* it happens — step by step, with your own input data, while measuring performance and letting you ask an AI questions at every step.

**Target Audience:** CS/SE students, self-learners, competitive programmers in early stages.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React (Vite) | SPA, component-driven UI |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Charts/Graphs** | Chart.js | Performance comparison graphs |
| **HTTP Client** | Axios | API calls from frontend |
| **Backend** | FastAPI (Python) | REST API server |
| **Data Validation** | Pydantic / pydantic-settings | Request/response models + config |
| **Database** | Supabase (PostgreSQL) | Auth, storage, relational data |
| **AI** | Groq API (LLaMA 3) | AI Tutor, concept explanation |
| **Code Execution** | Local Subprocess | Sandboxed multi-language compiler |
| **PDF Generation** | ReportLab | Generate downloadable PDF reports |
| **Version Control** | Git + GitHub | Source control |
| **Deployment** | HuggingFace Spaces / Streamlit | Hosting (V4) |

**Python Version:** 3.10+  
**Node Version:** 18+ (frontend)

---

## 3. Environment Variables

All environment variables live in a `.env` file at the **backend root**. Never commit this file — it is in `.gitignore`.

```env
# ─── Supabase ───────────────────────────────────────────────────────────
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-or-service-role-key

# ─── Groq AI ────────────────────────────────────────────────────────────
GROQ_API_KEY=gsk_your_groq_key_here
GROQ_MODEL=llama3-70b-8192


# ─── FastAPI Server ─────────────────────────────────────────────────────
APP_HOST=0.0.0.0
APP_PORT=8000
DEBUG=True

# ─── JWT / Auth (Supabase handles this, but kept for reference) ─────────
SECRET_KEY=your_secret_key_for_any_local_jwt_needs
```

**Frontend `.env` (at frontend root):**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Rule:** Backend uses `pydantic-settings` (`BaseSettings`) to load these. Frontend uses Vite's `import.meta.env` to access them.

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │               React (Vite) Frontend                    │    │
│  │                                                        │    │
│  │  Pages: Home | Visualizer | Compiler | AI Tutor |     │    │
│  │         Practice | Performance | Reports              │    │
│  │                                                        │    │
│  │  State: useState / useReducer / Context API           │    │
│  │  Charts: Chart.js    HTTP: Axios                      │    │
│  └────────────────┬───────────────────────────────────────┘    │
└───────────────────┼─────────────────────────────────────────────┘
                    │ REST API (JSON over HTTP)
                    │ Base URL: http://localhost:8000
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FastAPI Backend (Python)                        │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  /auth   │ │  /array  │ │/linkedlist│ │   /ai/query      │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ /execute │ │/practice │ │/performance│ │   /report        │  │
│  └──────────┘ └──────────┘ └────┬─────┘ └──────────────────┘  │
│                                  │                              │
│           Algorithm Engine       │   Services Layer            │
│  ┌─────────────────────────┐    │  ┌────────────────────────┐  │
│  │ array_engine.py         │    │  │ supabase_service.py    │  │
│  │ linkedlist_engine.py    │    │  │ groq_service.py        │  │
│  │ performance_tracker.py  │    │  │ compiler_service.py      │  │
│  └─────────────────────────┘    │  │ report_service.py      │  │
│                                  │  └────────────────────────┘  │
└─────────────────────┬────────────┴──────────────┬───────────────┘
                      │                            │
          ┌───────────▼──────────┐    ┌────────────▼──────────┐
          │  Supabase (PostgreSQL)│    │   External APIs       │
          │                      │    │                       │
          │  - users             │    │  Groq API (AI)        │
          │  - practice_problems │    │  Local Subprocess Compiler │
          │  - algorithm_runs    │    │                       │
          │  - reports           │    └───────────────────────┘
          │  - practice_attempts │
          └──────────────────────┘
```

**Communication Protocol:**  
- Frontend ↔ Backend: **REST (JSON)**  
- Backend ↔ Supabase: **supabase-py SDK** (REST under the hood)  
- Backend ↔ Groq: **groq Python SDK** (HTTP/SSE)  
- Backend ↔ Compiler: **Local Subprocess Execution**  
- All responses: **`application/json`**  
- Auth: **Supabase JWT tokens** — frontend sends `Authorization: Bearer <token>` header on protected routes

---

## 5. Module Breakdown

### Module 1 — User Management (Auth)
**Owner: Ruman**

Handles registration, login, and session management. Delegates entirely to Supabase Auth.

- Signup with email/password
- Login → receive Supabase JWT
- Frontend stores JWT in `localStorage`
- All protected endpoints verify JWT via Supabase `get_user(token)`
- No custom password hashing needed — Supabase handles it

**Key files:**
- `backend/routers/auth.py`
- `backend/services/supabase_service.py` → `verify_token(token)`

---

### Module 2 — Data Structure Visualization (CORE)
**Owner: Akif (backend engine) + Arslan (frontend animation)**

This is the heart of AlgoVision. Backend computes step-by-step **state snapshots** for every operation. Frontend receives the states array and animates them sequentially.

**Supported Structures (V1):**
- Arrays (insert, delete, search, shift, sort)
- Linked Lists (insert at head/tail/position, delete, search, traverse)

**Contract:** Backend always returns a `states[]` array. Each state is a JSON snapshot describing the structure at that moment. Frontend loops through states with a configurable delay (e.g., 600ms per step).

---

### Module 3 — Algorithm Execution Engine
**Owner: Akif**

Pure Python logic that runs algorithms and **generates state snapshots at each meaningful step**. No database calls here — it is stateless computation.

**Design principle:** Every mutation to the data structure must produce one state snapshot. The frontend will replay these in order.

**Files:**
- `backend/algorithms/array_engine.py`
- `backend/algorithms/linkedlist_engine.py`

---

### Module 4 — Performance Analysis
**Owner: Akif**

Measures and stores execution metrics after each algorithm run.

- **What is measured:** execution time (ms), memory delta (KB), operation count
- **How measured:** Python `time.perf_counter()` + `tracemalloc`
- **Where stored:** `algorithm_runs` table in Supabase
- **Frontend display:** Chart.js line/bar charts comparing multiple runs

**File:** `backend/routers/performance.py`, `backend/services/supabase_service.py`

---

### Module 5 — Code Execution (Compiler)
**Owner: Akif (service) + Ruman (proxy/deployment)**

Integrates a local subprocess engine to allow users to write and run code in the browser.

**Flow:**
1. User writes code in frontend Monaco-style editor
2. POST `/execute` with `source_code`, `language_id`, `stdin`
3. Backend executes code via subprocess with timeout

4. Returns `stdout`, `stderr`, `compile_output`, `time`, `memory`

**Supported Languages (Compiler language_id):**
| Language | ID |
|----------|-----|
| Python 3 | 71 |
| C++ (GCC 9.2) | 54 |
| Java | 62 |
| JavaScript (Node 12) | 63 |
| C | 50 |

**File:** `backend/services/compiler_service.py`, `backend/routers/compiler.py`

---

### Module 6 — AI Tutor
**Owner: Akif**

Natural language question answering powered by Groq (LLaMA 3 70B).

**Features:**
- Explain a concept (e.g., "What is a linked list?")
- Debug user's code snippet
- Explain why a specific algorithm step happened
- Hint system for practice problems

**System Prompt Philosophy:** The AI always responds as a CS tutor. Responses are concise, educational, and code-aware. The system prompt includes context about what the user is currently doing (e.g., the current algorithm, the current step).

**File:** `backend/services/groq_service.py`, `backend/routers/ai_tutor.py`

---

### Module 7 — Practice Problems
**Owner: Ruman (DB seed) + Akif (backend) + Arslan (frontend)**

A curated set of 10 initial problems seeded into the database.

- Problems have: `title`, `difficulty` (Easy/Medium/Hard), `description`, `solution`, `hints` (JSON array)
- Users submit code → executed via Local Subprocess Compiler → compared against expected output
- AI hints available on demand
- Attempt history stored in `practice_attempts` table

**File:** `backend/routers/practice.py`

---

### Module 8 — Reporting
**Owner: Ruman**

Generates downloadable PDF reports using ReportLab.

**Report Contains:**
- User info header
- Algorithm runs history (table)
- Performance graphs (embedded as image)
- Practice problem attempt summary
- Generated timestamp

**File:** `backend/services/report_service.py`, `backend/routers/report.py`

---

## 6. Database Schema (Supabase)

Run this SQL in the **Supabase SQL Editor** to create all tables. Supabase Auth manages `auth.users` automatically — we create a `public.users` mirror.

```sql
-- ═══════════════════════════════════════════════════
-- TABLE: public.users
-- Mirror of auth.users for custom profile data
-- ═══════════════════════════════════════════════════
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ═══════════════════════════════════════════════════
-- TABLE: practice_problems
-- Seeded once; read-only at runtime
-- ═══════════════════════════════════════════════════
CREATE TABLE practice_problems (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')) NOT NULL,
    description TEXT NOT NULL,
    solution TEXT NOT NULL,
    hints JSONB DEFAULT '[]'::JSONB,
    expected_output TEXT,
    language_id INTEGER DEFAULT 71,   -- Python 3
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════
-- TABLE: algorithm_runs
-- Stores performance data for every operation run
-- ═══════════════════════════════════════════════════
CREATE TABLE algorithm_runs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    algorithm TEXT NOT NULL,              -- e.g. "array_insert", "linkedlist_search"
    data_structure TEXT NOT NULL,         -- "array" | "linkedlist"
    operation TEXT NOT NULL,              -- "insert" | "delete" | "search"
    input_size INTEGER NOT NULL,          -- number of elements
    execution_time_ms FLOAT NOT NULL,     -- milliseconds
    memory_usage_kb FLOAT NOT NULL,       -- kilobytes
    operation_count INTEGER NOT NULL,     -- number of steps taken
    input_data JSONB,                     -- the actual input for replay
    ran_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_algorithm_runs_user_id ON algorithm_runs(user_id);
CREATE INDEX idx_algorithm_runs_ran_at ON algorithm_runs(ran_at DESC);


-- ═══════════════════════════════════════════════════
-- TABLE: reports
-- Stores generated PDF report references
-- ═══════════════════════════════════════════════════
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    report_file TEXT NOT NULL,             -- Supabase Storage path or local path
    report_type TEXT DEFAULT 'full',       -- "full" | "performance" | "practice"
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_user_id ON reports(user_id);


-- ═══════════════════════════════════════════════════
-- TABLE: practice_attempts
-- Tracks every practice problem submission
-- ═══════════════════════════════════════════════════
CREATE TABLE practice_attempts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id INTEGER REFERENCES practice_problems(id) ON DELETE CASCADE,
    submitted_code TEXT NOT NULL,
    language_id INTEGER DEFAULT 71,
    status TEXT CHECK (status IN ('Accepted', 'Wrong Answer', 'Runtime Error', 'Compile Error', 'Pending')) NOT NULL,
    stdout TEXT,
    stderr TEXT,
    execution_time_ms FLOAT,
    memory_usage_kb FLOAT,
    attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_practice_attempts_user_id ON practice_attempts(user_id);
CREATE INDEX idx_practice_attempts_problem_id ON practice_attempts(problem_id);


-- ═══════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Users can only read/write their own data
-- ═══════════════════════════════════════════════════
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE algorithm_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_attempts ENABLE ROW LEVEL SECURITY;

-- users: read own profile
CREATE POLICY "Users read own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- algorithm_runs: full CRUD on own records
CREATE POLICY "Users manage own algorithm runs"
    ON algorithm_runs FOR ALL
    USING (auth.uid() = user_id);

-- reports: full CRUD on own records
CREATE POLICY "Users manage own reports"
    ON reports FOR ALL
    USING (auth.uid() = user_id);

-- practice_attempts: full CRUD on own records
CREATE POLICY "Users manage own attempts"
    ON practice_attempts FOR ALL
    USING (auth.uid() = user_id);

-- practice_problems: public read (no auth required)
ALTER TABLE practice_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read practice problems"
    ON practice_problems FOR SELECT
    TO anon, authenticated
    USING (true);
```

---

## 7. Supabase Connection & Configuration

### Python Backend (supabase-py)

```python
# backend/services/supabase_service.py
from supabase import create_client, Client
from backend.config import settings

supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY
)
```

### Frontend (supabase-js)

```javascript
// frontend/src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default supabase
```

### Auth Flow (Frontend)

```javascript
// Signup
const { data, error } = await supabase.auth.signUp({ email, password })

// Login
const { data, error } = await supabase.auth.signInWithPassword({ email, password })

// Get JWT to send to backend
const session = supabase.auth.getSession()
const token = session.data.session.access_token

// Send to backend:
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
```

### Backend Token Verification

```python
# backend/services/supabase_service.py
async def verify_token(token: str) -> dict:
    user = supabase.auth.get_user(token)
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user.user

# Dependency injection in protected routes:
async def get_current_user(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    return await verify_token(token)
```

---

## 8. API Contracts

All endpoints are prefixed with the base URL: `http://localhost:8000`

All request/response bodies are `application/json`.

Protected routes require: `Authorization: Bearer <supabase_jwt>`

---

### 8.1 Auth Endpoints

#### POST `/auth/signup`
```json
// Request
{
  "email": "student@example.com",
  "password": "securepass123",
  "full_name": "Ali Akif"
}

// Response 200
{
  "message": "Signup successful",
  "user_id": "uuid-string"
}

// Response 400
{
  "detail": "Email already registered"
}
```

#### POST `/auth/login`
```json
// Request
{
  "email": "student@example.com",
  "password": "securepass123"
}

// Response 200
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "student@example.com"
  }
}
```

#### GET `/auth/me` *(Protected)*
```json
// Response 200
{
  "id": "uuid",
  "email": "student@example.com",
  "full_name": "Ali Akif",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 8.2 Array Endpoints

All array endpoints are **stateless** — they receive the current array state and return visualization steps. No DB write here (performance is saved separately).

#### POST `/array/insert`
```json
// Request
{
  "array": [10, 20, 30, 40],
  "index": 2,
  "value": 25
}

// Response 200
{
  "states": [
    {
      "type": "array",
      "elements": [10, 20, 30, 40],
      "highlight": null,
      "operation": "start",
      "message": "Starting insert of 25 at index 2"
    },
    {
      "type": "array",
      "elements": [10, 20, 30, 40],
      "highlight": 3,
      "operation": "shift",
      "message": "Shifting element 40 right"
    },
    {
      "type": "array",
      "elements": [10, 20, 30, 30, 40],
      "highlight": 2,
      "operation": "shift",
      "message": "Shifting element 30 right"
    },
    {
      "type": "array",
      "elements": [10, 20, 25, 30, 40],
      "highlight": 2,
      "operation": "insert",
      "message": "Inserted 25 at index 2"
    }
  ],
  "performance": {
    "execution_time_ms": 0.12,
    "memory_usage_kb": 0.008,
    "operation_count": 3
  }
}
```

#### POST `/array/delete`
```json
// Request
{
  "array": [10, 20, 30, 40],
  "index": 1
}

// Response 200
{
  "states": [
    {
      "type": "array",
      "elements": [10, 20, 30, 40],
      "highlight": 1,
      "operation": "target",
      "message": "Targeting element 20 at index 1 for deletion"
    },
    {
      "type": "array",
      "elements": [10, 30, 40],
      "highlight": 1,
      "operation": "delete",
      "message": "Deleted element 20, shifting elements left"
    }
  ],
  "performance": {
    "execution_time_ms": 0.08,
    "memory_usage_kb": 0.006,
    "operation_count": 2
  }
}
```

#### POST `/array/search`
```json
// Request
{
  "array": [10, 20, 30, 40],
  "value": 30
}

// Response 200
{
  "states": [
    {
      "type": "array",
      "elements": [10, 20, 30, 40],
      "highlight": 0,
      "operation": "compare",
      "message": "Comparing 10 with target 30 — not equal"
    },
    {
      "type": "array",
      "elements": [10, 20, 30, 40],
      "highlight": 1,
      "operation": "compare",
      "message": "Comparing 20 with target 30 — not equal"
    },
    {
      "type": "array",
      "elements": [10, 20, 30, 40],
      "highlight": 2,
      "operation": "found",
      "message": "Found 30 at index 2!"
    }
  ],
  "found": true,
  "index": 2,
  "performance": {
    "execution_time_ms": 0.05,
    "memory_usage_kb": 0.004,
    "operation_count": 3
  }
}
```

---

### 8.3 Linked List Endpoints

#### POST `/linkedlist/insert`
```json
// Request
{
  "nodes": [10, 20, 30],
  "value": 15,
  "position": 1
}

// Response 200
{
  "states": [
    {
      "type": "linkedlist",
      "nodes": [10, 20, 30],
      "highlight": null,
      "active_pointer": "head",
      "operation": "start",
      "message": "Starting insert of 15 at position 1"
    },
    {
      "type": "linkedlist",
      "nodes": [10, 20, 30],
      "highlight": 10,
      "active_pointer": "current",
      "operation": "traverse",
      "message": "Traversing to position 0 — at node 10"
    },
    {
      "type": "linkedlist",
      "nodes": [10, 15, 20, 30],
      "highlight": 15,
      "active_pointer": "new_node",
      "operation": "insert",
      "message": "New node 15 inserted between 10 and 20"
    }
  ],
  "performance": {
    "execution_time_ms": 0.10,
    "memory_usage_kb": 0.009,
    "operation_count": 2
  }
}
```

#### POST `/linkedlist/delete`
```json
// Request
{
  "nodes": [10, 20, 30],
  "value": 20
}
```

#### POST `/linkedlist/search`
```json
// Request
{
  "nodes": [10, 20, 30],
  "value": 20
}
```

*Response structure mirrors array equivalents with `type: "linkedlist"` and `nodes[]` instead of `elements[]`.*

---

### 8.4 AI Tutor Endpoint

#### POST `/ai/query` *(Protected)*
```json
// Request
{
  "question": "Why does inserting at the beginning of a linked list take O(1) time?",
  "context": {
    "current_structure": "linkedlist",
    "current_operation": "insert",
    "current_step": 1
  }
}

// Response 200
{
  "answer": "Great question! In a linked list, inserting at the beginning (head) takes O(1) constant time because...",
  "follow_up_questions": [
    "What is the time complexity of inserting at the end?",
    "How does this compare to arrays?"
  ]
}
```

---

### 8.5 Compiler Endpoint

#### POST `/execute` *(Protected)*
```json
// Request
{
  "source_code": "print('Hello, AlgoVision!')",
  "language_id": 71,
  "stdin": ""
}

// Response 200
{
  "stdout": "Hello, AlgoVision!\n",
  "stderr": null,
  "compile_output": null,
  "status": "Accepted",
  "time": "0.012",
  "memory": 9216
}

// Response 200 (error case)
{
  "stdout": null,
  "stderr": "NameError: name 'x' is not defined",
  "compile_output": null,
  "status": "Runtime Error",
  "time": null,
  "memory": null
}
```

---

### 8.6 Practice Problem Endpoints

#### GET `/practice/problems`
```json
// Response 200
{
  "problems": [
    {
      "id": 1,
      "title": "Find Maximum in Array",
      "difficulty": "Easy",
      "description": "Given an array of integers, find and return the maximum element.",
      "hints": ["Iterate through all elements", "Keep track of the current maximum"]
    }
  ]
}
```

#### GET `/practice/problems/{problem_id}`
```json
// Response 200
{
  "id": 1,
  "title": "Find Maximum in Array",
  "difficulty": "Easy",
  "description": "Given an array of integers, find and return the maximum element.\n\nExample:\nInput: [3, 1, 4, 1, 5, 9]\nOutput: 9",
  "hints": ["Iterate through all elements", "Keep track of the current maximum"],
  "language_id": 71
}
```

#### POST `/practice/submit` *(Protected)*
```json
// Request
{
  "problem_id": 1,
  "submitted_code": "def solution(arr):\n    return max(arr)\nprint(solution([3,1,4,1,5,9]))",
  "language_id": 71
}

// Response 200
{
  "status": "Accepted",
  "stdout": "9\n",
  "stderr": null,
  "execution_time_ms": 45.2,
  "memory_usage_kb": 8.9,
  "message": "Correct! Well done."
}
```

#### GET `/practice/hint/{problem_id}` *(Protected)*
```json
// Response 200
{
  "hint": "Try using Python's built-in max() function, or iterate through the array keeping track of the largest value seen so far.",
  "hint_level": 1
}
```

---

### 8.7 Performance Endpoints

#### POST `/performance/save` *(Protected)*
```json
// Request (sent automatically after each visualization run)
{
  "algorithm": "array_insert",
  "data_structure": "array",
  "operation": "insert",
  "input_size": 4,
  "execution_time_ms": 0.12,
  "memory_usage_kb": 0.008,
  "operation_count": 3,
  "input_data": {"array": [10,20,30,40], "index": 2, "value": 25}
}

// Response 200
{
  "id": 42,
  "message": "Performance data saved"
}
```

#### GET `/performance/history` *(Protected)*
```json
// Response 200
{
  "runs": [
    {
      "id": 42,
      "algorithm": "array_insert",
      "data_structure": "array",
      "operation": "insert",
      "input_size": 4,
      "execution_time_ms": 0.12,
      "memory_usage_kb": 0.008,
      "operation_count": 3,
      "ran_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### GET `/performance/compare?algorithms=array_insert,linkedlist_insert` *(Protected)*
```json
// Response 200
{
  "comparison": {
    "array_insert": {
      "avg_time_ms": 0.11,
      "avg_memory_kb": 0.007,
      "avg_operations": 3.2,
      "runs": 5
    },
    "linkedlist_insert": {
      "avg_time_ms": 0.09,
      "avg_memory_kb": 0.011,
      "avg_operations": 1.8,
      "runs": 3
    }
  }
}
```

---

### 8.8 Report Endpoint

#### POST `/report/generate` *(Protected)*
```json
// Request
{
  "report_type": "full"
}

// Response 200
{
  "report_id": 7,
  "download_url": "/report/download/7",
  "message": "Report generated successfully"
}
```

#### GET `/report/download/{report_id}` *(Protected)*
Returns a **PDF file** with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename=report_{id}.pdf`

---

## 9. Animation / Visualization State Contracts

This is the **canonical format** all visualization states must follow. Frontend reads these and animates them.

### 9.1 State Object — Array

```typescript
interface ArrayState {
  type: "array";
  elements: number[];          // Current array values
  highlight: number | null;    // Index to highlight (0-based), null = no highlight
  highlight_range?: [number, number]; // Optional: range of indices to highlight
  operation: ArrayOperation;   // What is happening at this step
  message: string;             // Human-readable description of this step
  comparison_value?: number;   // Value being searched for (search ops)
  new_value?: number;          // Value being inserted (insert ops)
}

type ArrayOperation =
  | "start"     // Initial state
  | "compare"   // Comparing elements (search)
  | "shift"     // Shifting element (insert/delete)
  | "insert"    // Placing the new element
  | "delete"    // Removing element
  | "found"     // Search succeeded
  | "not_found" // Search failed
  | "done";     // Final state
```

### 9.2 State Object — Linked List

```typescript
interface LinkedListState {
  type: "linkedlist";
  nodes: number[];                       // Node values in order
  highlight: number | null;              // VALUE of highlighted node (not index)
  active_pointer: "head" | "current" | "prev" | "new_node" | null;
  operation: LinkedListOperation;
  message: string;
  arrows?: "normal" | "highlight";       // Arrow rendering mode
}

type LinkedListOperation =
  | "start"
  | "traverse"   // Moving current pointer
  | "insert"     // Inserting new node
  | "delete"     // Removing node
  | "compare"    // Comparing node value with target
  | "found"
  | "not_found"
  | "done";
```

### 9.3 Response Envelope

Every visualization endpoint returns this exact envelope:

```typescript
interface VisualizationResponse {
  states: (ArrayState | LinkedListState)[];  // Sequential state snapshots
  performance: {
    execution_time_ms: number;   // Time taken to compute all states
    memory_usage_kb: number;     // Memory used
    operation_count: number;     // Number of meaningful operations
  };
  found?: boolean;    // Only present for search operations
  index?: number;     // Only present for search operations (array)
  result_node?: number; // Only present for search operations (linkedlist)
}
```

### 9.4 Frontend Animation Contract

The frontend **must** follow this animation protocol:

```javascript
// Pseudocode for the frontend animation loop
const ANIMATION_DELAY_MS = 600; // Default; user can adjust via slider

async function animateStates(states) {
  for (let i = 0; i < states.length; i++) {
    renderState(states[i]);           // Update UI to show this state
    displayMessage(states[i].message); // Show the step explanation
    await sleep(ANIMATION_DELAY_MS);
  }
  markComplete();
}
```

**Rules:**
1. States are **always** played sequentially — never skip.
2. The final state remains on screen after animation completes.
3. The user can pause/resume animation.
4. Animation speed is user-controllable (100ms to 2000ms per step).
5. After animation, performance data is **automatically POSTed** to `/performance/save`.

---

## 10. External Service Integration Contracts

### 10.1 Groq API

**SDK:** `from groq import Groq`  
**Model:** `llama3-70b-8192`  
**Temperature:** `0.7`  
**Max tokens:** `1024`

```python
# System prompt template
SYSTEM_PROMPT = """
You are AlgoVision's AI Tutor, an expert computer science teacher specializing in 
data structures and algorithms. You help students understand concepts clearly.

Rules:
- Give concise, educational answers
- Use simple analogies when explaining complex concepts
- If asked about code, provide working Python examples
- Keep responses under 200 words unless a detailed explanation is requested
- Always relate your answer back to the data structure the student is currently studying

Current context: {context}
"""
```

### 10.2 Local Subprocess Compiler API

Runs via local `subprocess` module. No external HTTP requests needed.

---

## 11. Folder Structure

```
AlgoVision/
│
├── backend/
│   ├── algorithms/
│   │   ├── __init__.py
│   │   ├── array_engine.py         # Array state generator
│   │   └── linkedlist_engine.py    # Linked list state generator
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                 # /auth/*
│   │   ├── array.py                # /array/*
│   │   ├── linkedlist.py           # /linkedlist/*
│   │   ├── ai_tutor.py             # /ai/*
│   │   ├── compiler.py             # /execute
│   │   ├── practice.py             # /practice/*
│   │   ├── performance.py          # /performance/*
│   │   └── report.py               # /report/*
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── supabase_service.py     # Supabase client + DB operations
│   │   ├── groq_service.py         # Groq AI API calls
│   │   ├── compiler_service.py       # Local Subprocess Compiler compile/run
│   │   └── report_service.py       # ReportLab PDF generation
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── auth_models.py          # Pydantic models for auth
│   │   ├── array_models.py         # Pydantic models for array ops
│   │   ├── linkedlist_models.py    # Pydantic models for LL ops
│   │   ├── ai_models.py            # Pydantic models for AI
│   │   ├── compiler_models.py      # Pydantic models for compiler
│   │   ├── practice_models.py      # Pydantic models for practice
│   │   └── performance_models.py   # Pydantic models for perf
│   │
│   ├── config.py                   # pydantic-settings BaseSettings
│   ├── main.py                     # FastAPI app, CORS, router registration
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Visualizer/
│   │   │   │   ├── ArrayVisualizer.jsx
│   │   │   │   ├── LinkedListVisualizer.jsx
│   │   │   │   └── AnimationControls.jsx
│   │   │   ├── Editor/
│   │   │   │   └── CodeEditor.jsx
│   │   │   ├── Charts/
│   │   │   │   └── PerformanceChart.jsx
│   │   │   ├── AIChat.jsx
│   │   │   └── Navbar.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Visualizer.jsx
│   │   │   ├── Compiler.jsx
│   │   │   ├── AITutor.jsx
│   │   │   ├── Practice.jsx
│   │   │   ├── Performance.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   │
│   │   ├── lib/
│   │   │   ├── supabaseClient.js   # Supabase JS client
│   │   │   └── api.js              # Axios instance with base URL + auth header
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Auth state + JWT management
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   ├── schema.sql                  # Full DB schema (run in Supabase)
│   └── seed.sql                    # 10 practice problems seed data
│
├── docs/
│   ├── idea.md                     # THIS FILE
│   ├── system_design.docx          # System design document
│   └── diagrams/
│       ├── architecture.png
│       └── er_diagram.png
│
├── .env.example                    # Template (no real keys)
├── .gitignore
└── README.md
```

---

## 12. Branch Workflow & Git Strategy

```
main          ← Production-ready, final stable code only
  └── dev     ← Integration branch; all features merge here first
        ├── feature-akif    ← Akif's work (backend, AI, algorithms)
        ├── feature-arslan  ← Arslan's work (frontend, UI, animations)
        └── feature-ruman   ← Ruman's work (DB, deployment, compiler proxy)
```

**Merge flow:**
```
feature-{name} → PR into dev → review → merge → test → PR into main
```

**Commit message format:**
```
feat(array): add insert operation with state generation
fix(compiler): handle execution timeout gracefully
docs(idea): update API contracts for linkedlist
chore(db): add missing index on algorithm_runs
```

**Protection rules:**
- `main` branch: require PR + 1 review before merge
- `dev` branch: require PR before merge
- No direct pushes to `main` or `dev`

---

## 13. Team Responsibilities

| Area | Akif (FA24-BSE-129) | Arslan (FA24-BSE-119) | Ruman |
|------|--------------------|-----------------------|-------|
| **Backend API** | ✅ All routers | — | Auth + Report endpoints support |
| **Algorithm Engine** | ✅ Array + LL engines | — | — |
| **AI Integration** | ✅ Groq service | — | — |
| **Compiler** | ✅ Local Subprocess Compiler service | — | Proxy setup |
| **Frontend** | — | ✅ All pages + components | — |
| **Visualizer** | State contract design | ✅ Animation implementation | — |
| **Database** | Schema design | — | ✅ Setup + seed + RLS |
| **Deployment** | — | — | ✅ HuggingFace / Streamlit |
| **PDF Reports** | ReportLab logic | — | ✅ File storage |
| **Performance Analysis** | ✅ Backend metrics | Chart.js charts | — |

---

## 14. Execution Plan (Versioned)

### ✅ Version 1 — Core MVP (Current Target)

**Scope:**
- Array: insert, delete, search with full animation
- Linked List: insert, delete, search with full animation
- AI Tutor: question answering
- Compiler: run Python, C++, Java
- Practice: 10 problems, submit, check
- Auth: signup, login, protected routes
- Performance: save + view history
- Reports: generate + download PDF

**Definition of Done for V1:**
- [ ] All 8 API routers returning correct responses
- [ ] Frontend animating array and linked list states
- [ ] Local Subprocess Compiler returning actual execution results
- [ ] Groq returning meaningful AI answers
- [ ] Supabase storing data with RLS enforced
- [ ] User can sign up, log in, use all features, download report

---

### 🔮 Version 2 — Trees & Graphs

- BST (insert, delete, search, traversals)
- AVL tree with rotations visualized
- Graph BFS and DFS

### 🔮 Version 3 — Sorting & Searching

- Bubble, Selection, Insertion, Merge, Quick Sort
- Binary Search with visualization
- Algorithm race mode (compare two algorithms live)

### 🔮 Version 4 — Final Polish

- Full deployment on HuggingFace Spaces
- CI/CD pipeline
- UI polish and accessibility
- Complete report system with graphs embedded in PDF
- User dashboard with learning streaks

---

## 15. Data Flow — End-to-End

### Visualization Flow (most important)

```
1. User opens Visualizer page (e.g., Array page)

2. User enters: array=[10,20,30,40], index=2, value=25, operation=insert

3. Arslan's frontend:
   POST /array/insert
   Body: { "array": [10,20,30,40], "index": 2, "value": 25 }
   Headers: { Authorization: Bearer <jwt> }

4. FastAPI receives → validates Pydantic model → calls array_engine.py

5. array_engine.py:
   - Records start time (time.perf_counter)
   - Records start memory (tracemalloc)
   - Runs insert algorithm step by step
   - Appends one state object per meaningful step
   - Records end time + memory
   - Returns states[] + performance{}

6. FastAPI router returns VisualizationResponse JSON

7. Frontend receives response:
   - Stores states[] in React state
   - Starts animateStates() loop (600ms per step)
   - Each step: updates ArrayVisualizer component props
   - ArrayVisualizer re-renders: highlights the correct box, updates values

8. After animation complete:
   - Auto-POST to /performance/save with metrics
   - Show "Animation Complete" UI

9. User can: ask AI about what just happened, try another operation, view performance history
```

### Code Execution Flow

```
1. User writes code in CodeEditor (Arslan's component)

2. User clicks "Run"

3. Frontend POST /execute { source_code, language_id, stdin }

4. compiler_service.py:
   a. base64 encode source_code and stdin
   b. POST to Local Subprocess Compiler /submissions → get token
   c. Poll GET /submissions/{token} every 1s
   d. When status.id >= 3: decode stdout/stderr from base64
   e. Return clean result object

5. Frontend displays stdout in output panel, stderr in error panel
```

---

## 16. Error Handling Strategy

### Backend (FastAPI)

```python
# Standard error responses
400 Bad Request  → Invalid input (e.g., index out of bounds)
401 Unauthorized → Missing or invalid JWT
404 Not Found    → Resource doesn't exist
422 Unprocessable → Pydantic validation failed (automatic)
500 Internal     → Unhandled exception (log and return generic message)
503 Service Unavailable → External API (Groq/Local Subprocess Compiler) unreachable
```

All errors follow this shape:
```json
{ "detail": "Human-readable error message" }
```

### Frontend (Axios)

```javascript
// Global Axios interceptor for auth errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear token, redirect to login
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### Compiler Specific Errors

| Status ID | Meaning | Frontend Message |
|-----------|---------|-----------------|
| 4 | Wrong Answer | "Output doesn't match expected" |
| 5 | Time Limit Exceeded | "Your code took too long (>5s)" |
| 6 | Compilation Error | Show `compile_output` |
| 11 | Runtime Error | Show `stderr` |
| Timeout | Compiler unreachable | "Compiler service temporarily unavailable" |

---

## 17. Security Considerations

- **Never expose** `SUPABASE_KEY` (service role) to the frontend — use anon key only
- **All writes** to user data go through the backend — frontend never writes to Supabase directly (except auth)
- **RLS is mandatory** — every table has policies; backend service role bypasses RLS, anon key does not
- **JWT validation** on every protected route — no route trusts `user_id` from request body; always extract from verified token
- **Compiler isolation** — code execution is performed locally using subprocess. In a real production environment, this should be sandboxed.
- **Groq input sanitization** — strip excessive length from user questions (max 500 chars) before sending to Groq
- **Rate limiting** (V2+) — add FastAPI rate limiting on `/execute` and `/ai/query` to prevent abuse
- **`.env` in `.gitignore`** — enforced from day one; use `.env.example` for documentation

---

*Document maintained by Akif (Lead) | Last updated: Project start | AlgoVision V1*
