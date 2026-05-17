# AlgoVision — Master Implementation Plan

## planning.md | Version 1.0

### Team: Akif (Lead) · Arslan · Ruman

---

## Table of Contents

1. [Pre-Development Setup](#phase-0-pre-development-setup)
2. [Module 1 — Project Scaffold & Repository Structure](#module-1--project-scaffold--repository-structure)
3. [Module 2 — Authentication System](#module-2--authentication-system)
4. [Module 3 — Algorithm Engine (Backend Core)](#module-3--algorithm-engine-backend-core)
5. [Module 4 — Visualization System (Frontend Core)](#module-4--visualization-system-frontend-core)
6. [Module 5 — Performance Analysis](#module-5--performance-analysis)
7. [Module 6 — Code Execution (Compiler)](#module-6--code-execution-compiler)
8. [Module 7 — AI Tutor](#module-7--ai-tutor)
9. [Module 8 — Practice Problems](#module-8--practice-problems)
10. [Module 9 — Reporting (PDF)](#module-9--reporting-pdf)
11. [Module 10 — Docker & Deployment Readiness](#module-10--docker--deployment-readiness)
12. [Environment Variables Reference (demo.env)](#environment-variables-reference-demoenv)
13. [Context Log File Format (context.md)](#context-log-file-format-contextmd)
14. [Git Workflow Reference](#git-workflow-reference)

---

## IMPORTANT GLOBAL RULES

Before any module begins, the following rules apply to every task in every module without exception:

- **Strict adherence to idea.md** — no alterations to stack, API contracts, or state contracts
- **Docker-deployable at all times** — after every module, the system must be buildable and runnable via docker-compose
- **Separate backend/frontend environments** — each has its own `.env`, `requirements.txt` / `package.json`
- **Feature branch only** — all work on `feature-akif`, `feature-arslan`, `feature-ruman` → merge to `dev` → merge to `main`
- **context.md updated** after every module's final task
- **No direct pushes to `main` or `dev`**

---

## Phase 0: Pre-Development Setup

> One-time setup before any module development begins. Owner: All team members.

### T0.0 — API Keys & Service Accounts

Obtain and securely store the following credentials. **Never commit real keys to the repository.**

```
SERVICE             WHERE TO GET IT
──────────────────────────────────────────────────────────────────
Supabase URL        https://supabase.com → Project Settings → API
Supabase Anon Key   https://supabase.com → Project Settings → API → anon/public key
Supabase Svc Key    https://supabase.com → Project Settings → API → service_role key (backend only)
Groq API Key        https://console.groq.com → API Keys → Create New Key (free tier available)
```

### T0.1 — Supabase Project Verification

The Supabase project is already created with the schema from `idea.md`. Verify:

1. Log in to https://supabase.com
2. Open the project → SQL Editor
3. Run the following verification queries:

```sql
-- Check all required tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected output:
-- algorithm_runs
-- practice_attempts
-- practice_problems
-- reports
-- users

-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Verify the trigger for auto-creating user profile on signup
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

4. If any table is missing, run the full `schema.sql` from `idea.md` in the SQL editor.
5. Confirm Supabase Auth is enabled: Authentication → Providers → Email (must be enabled).

### T0.2 — Local Development Prerequisites

Each developer must have installed:

```
Tool            Version     Install Command
──────────────────────────────────────────
Python          3.10+       python --version
Node.js         18+         node --version
npm             9+          npm --version
Docker Desktop  latest      docker --version
Docker Compose  V2          docker compose version
Git             2.30+       git --version
```

### T0.3 — GitHub Repository Setup

```bash
# One-time setup by Akif (lead)
# 1. Create repo on GitHub: AlgoVision
# 2. Initialize locally:
git init
git remote add origin https://github.com/<org>/AlgoVision.git
git checkout -b main
git add README.md .gitignore
git commit -m "chore(init): initial repository setup"
git push -u origin main

# 3. Create branches
git checkout -b dev
git push -u origin dev

git checkout -b feature-akif
git push -u origin feature-akif

git checkout -b feature-arslan
git push -u origin feature-arslan

git checkout -b feature-ruman
git push -u origin feature-ruman

# 4. Set branch protection on GitHub:
# Settings → Branches → Add rule:
#   - main: require PR + 1 review, no direct push
#   - dev: require PR, no direct push
```

---

## Module 1 — Project Scaffold & Repository Structure

> Owner: Akif (backend scaffold) + Arslan (frontend scaffold)
> Goal: Create the exact folder structure from idea.md, wire up configs, verify everything runs locally.

---

### T1.0 — Analyze & Establish Correct Folder Structure

Before creating any new files, audit whether any files already exist and reconcile with the canonical structure.

**Canonical structure (source of truth — idea.md Section 11):**

```
AlgoVision/
├── backend/
│   ├── algorithms/
│   │   ├── __init__.py
│   │   ├── array_engine.py
│   │   └── linkedlist_engine.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── array.py
│   │   ├── linkedlist.py
│   │   ├── ai_tutor.py
│   │   ├── compiler.py
│   │   ├── practice.py
│   │   ├── performance.py
│   │   └── report.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── supabase_service.py
│   │   ├── groq_service.py
│   │   ├── compiler_service.py
│   │   └── report_service.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── auth_models.py
│   │   ├── array_models.py
│   │   ├── linkedlist_models.py
│   │   ├── ai_models.py
│   │   ├── compiler_models.py
│   │   ├── practice_models.py
│   │   └── performance_models.py
│   ├── config.py
│   ├── main.py
│   └── requirements.txt
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
│   │   ├── lib/
│   │   │   ├── supabaseClient.js
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database/
│   ├── schema.sql
│   └── seed.sql
├── docs/
│   ├── idea.md
│   ├── planning.md          ← this file
│   └── context.md           ← created after first module
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

**Action items for T1.0:**

- Create all missing directories and `__init__.py` placeholder files
- Move any misplaced files to correct locations
- Delete any files not in the canonical structure (confirm before deletion)
- Do NOT create any logic yet — just structure

---

### T1.1 — Backend Bootstrap

**File: `backend/config.py`**

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    GROQ_API_KEY: str
    GROQ_MODEL: str = "llama3-70b-8192"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = True
    SECRET_KEY: str = "changeme"

    class Config:
        env_file = ".env"

settings = Settings()
```

**File: `backend/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import auth, array, linkedlist, ai_tutor, compiler, practice, performance, report

app = FastAPI(title="AlgoVision API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(array.router, prefix="/array", tags=["Array"])
app.include_router(linkedlist.router, prefix="/linkedlist", tags=["LinkedList"])
app.include_router(ai_tutor.router, prefix="/ai", tags=["AI Tutor"])
app.include_router(compiler.router, tags=["Compiler"])
app.include_router(practice.router, prefix="/practice", tags=["Practice"])
app.include_router(performance.router, prefix="/performance", tags=["Performance"])
app.include_router(report.router, prefix="/report", tags=["Report"])

@app.get("/")
def root():
    return {"status": "AlgoVision API running", "version": "1.0.0"}
```

**File: `backend/requirements.txt`**

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic==2.7.1
pydantic-settings==2.2.1
supabase==2.4.2
groq==0.9.0
httpx==0.27.0
reportlab==4.2.0
python-multipart==0.0.9
```

**All router files** — create as empty stubs returning `{"status": "not implemented"}` for now. Example for `backend/routers/array.py`:

```python
from fastapi import APIRouter
router = APIRouter()

@router.post("/insert")
def array_insert():
    return {"status": "not implemented"}
```

Repeat for all routers. This lets the server start without errors.

---

### T1.2 — Frontend Bootstrap

```bash
cd frontend
npm create vite@latest . -- --template react
npm install
npm install axios @supabase/supabase-js chart.js react-chartjs-2
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**File: `frontend/src/lib/api.js`**

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
```

**File: `frontend/src/lib/supabaseClient.js`**

```javascript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export default supabase;
```

**File: `frontend/src/App.jsx`** — Placeholder with React Router setup. Create stub page components returning `<div>Page Name</div>` for all 9 pages.

---

### T1.3 — Environment Files Setup

**File: `.env.example`** (committed to repo — no real values):

```env
# ─── Supabase ───────────────────────────────────────────────────────────
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-service-role-key

# ─── Groq AI ────────────────────────────────────────────────────────────
GROQ_API_KEY=gsk_your_groq_key_here
GROQ_MODEL=llama3-70b-8192


# ─── FastAPI Server ─────────────────────────────────────────────────────
APP_HOST=0.0.0.0
APP_PORT=8000
DEBUG=True

# ─── JWT / Auth ─────────────────────────────────────────────────────────
SECRET_KEY=your_secret_key_here
```

**File: `frontend/.env.example`** (committed to repo — no real values):

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Actual `.env` files** (NOT committed — in `.gitignore`):

- `backend/.env` — copy from `.env.example`, fill in real values
- `frontend/.env` — copy from `frontend/.env.example`, fill in real values

**File: `.gitignore`:**

```
# Environment files — NEVER COMMIT
.env
backend/.env
frontend/.env
*.env.local

# Python
__pycache__/
*.pyc
*.pyo
.venv/
venv/
env/

# Node
node_modules/
frontend/dist/
frontend/build/

# Docker artifacts
*.log

# IDE
.vscode/
.idea/
*.swp
```

---

### T1.4 — Docker Scaffold (Deployment Readiness from Day 1)

**File: `docker-compose.yml`** (root):

```yaml
version: "3.9"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/app
    command: uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    env_file:
      - ./frontend/.env
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev -- --host
    depends_on:
      - backend
```

**File: `backend/Dockerfile`:**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**File: `frontend/Dockerfile`:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

---

### T1.5 — Module Integration & Connectivity Check

Verify the scaffold is functional end-to-end:

1. `docker compose up --build` → both services must start without errors
2. `GET http://localhost:8000/` → returns `{"status": "AlgoVision API running"}`
3. `GET http://localhost:8000/docs` → FastAPI Swagger UI loads with all router stubs visible
4. `http://localhost:5173` → React app loads (stub pages, no errors in console)
5. Axios `api.js` base URL correctly points to backend
6. `.env` values load correctly: test with a quick `print(settings.APP_PORT)` in `main.py`

---

### T1.6 — Testing

- [ ] All 8 routers are registered in `main.py` and visible in `/docs`
- [ ] All stub endpoints return `200 OK`
- [ ] Frontend builds without TypeScript/lint errors (`npm run build`)
- [ ] Docker containers start cleanly
- [ ] `.env` is NOT in git tracked files (`git status` must not show `.env`)
- [ ] `requirements.txt` installs cleanly in a fresh virtual environment
- [ ] CORS allows requests from `localhost:5173` to `localhost:8000`

---

### T1.7 — context.md Update

After this module completes, create `docs/context.md` with the first entry. Follow the format defined in the [Context Log File Format](#context-log-file-format-contextmd) section below.

---

### T1.8 — Git Push

```bash
# On feature-akif branch
git add .
git commit -m "feat(scaffold): complete project folder structure and bootstrap

- Created canonical folder structure per idea.md Section 11
- Backend: FastAPI app with all router stubs, config.py with pydantic-settings
- Frontend: Vite+React with Tailwind, Axios instance, Supabase client
- Docker: Dockerfiles for both services + docker-compose.yml
- Environment: .env.example + frontend/.env.example + .gitignore
- All services start cleanly via docker compose up"

git push origin feature-akif

# Create PR: feature-akif → dev on GitHub
# After review and merge to dev:
# Create PR: dev → main (after T1.6 testing passes)
```

---

## Module 2 — Authentication System

> Owner: Ruman (Supabase setup/RLS) + Akif (backend routes) + Arslan (frontend pages)
> Goal: Working signup, login, JWT-protected routes, AuthContext in frontend.

---

### T2.0 — Backend: Pydantic Auth Models

**File: `backend/models/auth_models.py`**

```python
from pydantic import BaseModel, EmailStr
from typing import Optional

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    created_at: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
```

---

### T2.1 — Backend: Supabase Service (Auth Layer)

**File: `backend/services/supabase_service.py`**

Implement:

- `create_client()` using `settings.SUPABASE_URL` and `settings.SUPABASE_KEY`
- `async def verify_token(token: str) -> dict` — calls `supabase.auth.get_user(token)`, raises `HTTPException(401)` if invalid
- `async def get_current_user(authorization: str = Header(...))` — dependency for protected routes, strips `"Bearer "` prefix, calls `verify_token`
- `def get_user_profile(user_id: str) -> dict` — fetches from `public.users` table
- `def save_algorithm_run(user_id: str, run_data: dict) -> dict` — inserts into `algorithm_runs`
- `def get_algorithm_runs(user_id: str) -> list` — selects from `algorithm_runs` ordered by `ran_at DESC`

---

### T2.2 — Backend: Auth Router

**File: `backend/routers/auth.py`**

Implement per idea.md Section 8.1:

- `POST /auth/signup` — calls `supabase.auth.sign_up({email, password})`, on success inserts `full_name` into `public.users`, returns `{message, user_id}`
- `POST /auth/login` — calls `supabase.auth.sign_in_with_password({email, password})`, returns `{access_token, token_type, user}`
- `GET /auth/me` (protected) — uses `get_current_user` dependency, fetches profile from `public.users`, returns `UserResponse`

Error handling:

- Duplicate email → `400 {"detail": "Email already registered"}`
- Wrong credentials → `400 {"detail": "Invalid email or password"}`
- Invalid token → `401 {"detail": "Invalid token"}`

---

### T2.3 — Frontend: AuthContext

**File: `frontend/src/context/AuthContext.jsx`**

```jsx
import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../lib/supabaseClient";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.setItem("access_token", session.access_token);
        setUser(session.user);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.setItem("access_token", session.access_token);
        setUser(session.user);
      } else {
        localStorage.removeItem("access_token");
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signup = async (email, password, fullName) => {
    return await api.post("/auth/signup", {
      email,
      password,
      full_name: fullName,
    });
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("access_token", res.data.access_token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

### T2.4 — Frontend: Login & Signup Pages

**`frontend/src/pages/Login.jsx`** and **`frontend/src/pages/Signup.jsx`**

Both pages must:

- Use controlled form inputs (email, password, full_name for signup)
- Call `useAuth().login()` / `useAuth().signup()` on submit
- Show loading state during API call
- Display error messages from API response
- Redirect to `/` on successful login
- Link to each other (Login → Signup and vice versa)
- Use Tailwind for clean, minimal styling

---

### T2.5 — Frontend: Protected Route Component

**File: `frontend/src/components/ProtectedRoute.jsx`**

```jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
```

Wire up in `App.jsx` with React Router. Protected pages: Visualizer, Compiler, AITutor, Practice, Performance, Reports.

---

### T2.6 — Module Integration & Connectivity Check

1. Start backend: `POST /auth/signup` with Postman/curl — verify user appears in Supabase Auth dashboard
2. `POST /auth/login` — verify JWT is returned
3. `GET /auth/me` with Bearer token — verify profile returned
4. `GET /auth/me` with no token — verify `401` returned
5. Frontend: complete signup flow → verify redirect to home
6. Frontend: complete login flow → verify JWT stored in `localStorage`
7. Frontend: access a protected page without login → verify redirect to `/login`
8. Frontend: logout → verify token cleared and redirect to login

---

### T2.7 — Testing

- [ ] Signup with valid data → user created in Supabase Auth and `public.users`
- [ ] Signup with duplicate email → `400` error displayed on frontend
- [ ] Login with correct credentials → JWT returned and stored
- [ ] Login with wrong password → error displayed
- [ ] Protected route without token → redirect to login
- [ ] `GET /auth/me` with valid token → correct profile returned
- [ ] Token expiry handling — Supabase handles 1-hour expiry; verify `401` redirects to login
- [ ] AuthContext persists user session on page refresh

---

### T2.8 — context.md Update

Add Module 2 entry to `docs/context.md`.

---

### T2.9 — Git Push

```bash
git add .
git commit -m "feat(auth): complete authentication system

- Backend: SignupRequest, LoginRequest, AuthResponse Pydantic models
- Backend: supabase_service.py with verify_token and get_current_user dependency
- Backend: /auth/signup, /auth/login, /auth/me endpoints per idea.md contracts
- Frontend: AuthContext with session persistence, login, signup, logout
- Frontend: Login and Signup pages with error handling
- Frontend: ProtectedRoute component with redirect logic
- All auth flows tested end-to-end"

git push origin feature-akif
# PR: feature-akif → dev
```

---

## Module 3 — Algorithm Engine (Backend Core)

> Owner: Akif
> Goal: Implement array and linked list algorithm engines that produce exact visualization state sequences as defined in idea.md Section 9.

---

### T3.0 — Array Engine

**File: `backend/algorithms/array_engine.py`**

Implement the following functions. Each returns `(states: list[dict], performance: dict)`.

Performance measurement pattern (same for all operations):

```python
import time
import tracemalloc

def measure(func, *args, **kwargs):
    tracemalloc.start()
    start = time.perf_counter()
    result = func(*args, **kwargs)
    end = time.perf_counter()
    current, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    return result, {
        "execution_time_ms": round((end - start) * 1000, 4),
        "memory_usage_kb": round(current / 1024, 4),
        "operation_count": result["op_count"]
    }
```

**`array_insert(array: list, index: int, value: int) -> dict`**

State sequence:

1. `operation: "start"` — show initial array, no highlight
2. For each element from end down to `index`: `operation: "shift"`, highlight the element being shifted
3. Final state: `operation: "insert"`, highlight `index`, array contains new element

Edge cases to handle:

- `index < 0` or `index > len(array)` → raise `ValueError("Index out of bounds")`
- Empty array → insert at 0 valid

**`array_delete(array: list, index: int) -> dict`**

State sequence:

1. `operation: "start"` — initial state
2. `operation: "target"` — highlight element at `index`
3. `operation: "delete"` — array after removal (elements shifted left)

Edge cases:

- `index < 0` or `index >= len(array)` → raise `ValueError`
- Empty array → raise `ValueError`

**`array_search(array: list, value: int) -> dict`**

State sequence:

1. `operation: "start"` — initial state
2. For each index: `operation: "compare"` — highlight current, show comparison message
3. If found: `operation: "found"` — final state; if not: `operation: "not_found"`

Returns extra fields: `found: bool`, `index: int | None`

---

### T3.1 — Linked List Engine

**File: `backend/algorithms/linkedlist_engine.py`**

Implement the following. Linked list is represented as a simple Python list (no Node class needed — backend is stateless, list is the canonical representation).

**`linkedlist_insert(nodes: list, value: int, position: int) -> dict`**

State sequence:

1. `operation: "start"` — initial nodes, `active_pointer: "head"`
2. Traverse to `position - 1`: for each step, `operation: "traverse"`, highlight current node value, `active_pointer: "current"`
3. `operation: "insert"` — nodes with new value inserted, highlight new value, `active_pointer: "new_node"`

Positions:

- `position: 0` → insert at head (no traversal needed)
- `position: len(nodes)` → insert at tail
- `position > len(nodes)` → raise `ValueError`

**`linkedlist_delete(nodes: list, value: int) -> dict`**

State sequence:

1. `operation: "start"` — initial
2. For each node: `operation: "compare"` — highlight node value
3. `operation: "delete"` if found, else `operation: "not_found"`

**`linkedlist_search(nodes: list, value: int) -> dict`**

State sequence mirrors array_search but uses node values, not indices. Returns `found: bool`, `result_node: int | None`.

---

### T3.2 — Array Router

**File: `backend/routers/array.py`**

Implement per idea.md Section 8.2:

- `POST /array/insert` — validates with `ArrayInsertRequest`, calls `array_engine.array_insert`, returns `VisualizationResponse`
- `POST /array/delete` — calls `array_engine.array_delete`
- `POST /array/search` — calls `array_engine.array_search`

**File: `backend/models/array_models.py`**

```python
from pydantic import BaseModel, validator
from typing import Optional, List

class ArrayInsertRequest(BaseModel):
    array: List[int]
    index: int
    value: int

    @validator('array')
    def array_max_size(cls, v):
        if len(v) > 50:
            raise ValueError('Array must have at most 50 elements for visualization')
        return v

class ArrayDeleteRequest(BaseModel):
    array: List[int]
    index: int

class ArraySearchRequest(BaseModel):
    array: List[int]
    value: int

class PerformanceMetrics(BaseModel):
    execution_time_ms: float
    memory_usage_kb: float
    operation_count: int

class VisualizationResponse(BaseModel):
    states: List[dict]
    performance: PerformanceMetrics
    found: Optional[bool] = None
    index: Optional[int] = None
    result_node: Optional[int] = None
```

---

### T3.3 — Linked List Router

**File: `backend/routers/linkedlist.py`**

Implement per idea.md Section 8.3:

- `POST /linkedlist/insert`
- `POST /linkedlist/delete`
- `POST /linkedlist/search`

**File: `backend/models/linkedlist_models.py`**

```python
from pydantic import BaseModel, validator
from typing import List, Optional

class LinkedListInsertRequest(BaseModel):
    nodes: List[int]
    value: int
    position: int

    @validator('nodes')
    def nodes_max_size(cls, v):
        if len(v) > 20:
            raise ValueError('Linked list must have at most 20 nodes for visualization')
        return v

class LinkedListDeleteRequest(BaseModel):
    nodes: List[int]
    value: int

class LinkedListSearchRequest(BaseModel):
    nodes: List[int]
    value: int
```

---

### T3.4 — Module Integration & Connectivity Check

Test all 6 endpoints via FastAPI `/docs` (Swagger UI):

1. `POST /array/insert` with `{"array": [10,20,30,40], "index": 2, "value": 25}` → verify states match idea.md example exactly
2. `POST /array/delete` with `{"array": [10,20,30,40], "index": 1}` → verify 2 states returned
3. `POST /array/search` with `{"array": [10,20,30,40], "value": 30}` → verify `found: true`, `index: 2`
4. `POST /linkedlist/insert` with `{"nodes": [10,20,30], "value": 15, "position": 1}` → verify states
5. `POST /linkedlist/delete` with `{"nodes": [10,20,30], "value": 20}` → verify delete state
6. `POST /linkedlist/search` with `{"nodes": [10,20,30], "value": 20}` → verify `found: true`

Verify all responses include the `performance` object with `execution_time_ms`, `memory_usage_kb`, `operation_count`.

---

### T3.5 — Testing

- [ ] Array insert at index 0 (beginning) — correct shift sequence
- [ ] Array insert at last index (end) — no shifting needed
- [ ] Array insert at out-of-bounds index — `400` error returned
- [ ] Array delete first element — correct left-shift sequence
- [ ] Array delete last element — no shifting
- [ ] Array delete out-of-bounds — `400` error
- [ ] Array search — found at first element (1 compare step)
- [ ] Array search — found at last element (n compare steps)
- [ ] Array search — value not in array — `not_found` state, `found: false`
- [ ] Empty array inputs handled gracefully
- [ ] Linked list insert at head (position 0) — no traversal states
- [ ] Linked list insert at tail — full traversal
- [ ] Linked list insert out of range — `400` error
- [ ] Linked list delete non-existent value — `not_found` state
- [ ] All state objects contain required fields: `type`, `operation`, `message`
- [ ] Performance metrics present and non-zero on all responses

---

### T3.6 — context.md Update

---

### T3.7 — Git Push

```bash
git commit -m "feat(algorithms): implement array and linked list engines

- array_engine.py: insert, delete, search with step-by-step state generation
- linkedlist_engine.py: insert, delete, search with pointer tracking states
- array_models.py: Pydantic request/response models with validators
- linkedlist_models.py: Pydantic request/response models with validators
- routers/array.py: POST /array/insert, /delete, /search per idea.md contracts
- routers/linkedlist.py: POST /linkedlist/insert, /delete, /search
- All states follow VisualizationResponse contract from idea.md Section 9
- Edge cases handled: out-of-bounds, empty arrays, not-found scenarios"

git push origin feature-akif
```

---

## Module 4 — Visualization System (Frontend Core)

> Owner: Arslan
> Goal: Animate backend-generated states. Frontend NEVER computes algorithm steps.

---

### T4.0 — ArrayVisualizer Component

**File: `frontend/src/components/Visualizer/ArrayVisualizer.jsx`**

Props:

- `state: object` — current `ArrayState` object
- `animating: boolean`

Renders:

- Row of boxes, one per element in `state.elements`
- Highlighted box (different color/border) at `state.highlight` index
- Index numbers below each box
- Step message displayed below the array
- Smooth CSS transition on highlight change

Tailwind classes for states:

- Default box: `bg-blue-100 border-2 border-blue-300`
- Highlighted box: `bg-yellow-300 border-2 border-yellow-500 scale-110 transition-all`
- Found box: `bg-green-300 border-2 border-green-500`
- Not-found indication: `bg-red-100 border-2 border-red-300`

---

### T4.1 — LinkedListVisualizer Component

**File: `frontend/src/components/Visualizer/LinkedListVisualizer.jsx`**

Props same as ArrayVisualizer.

Renders:

- Horizontal row of node boxes connected by arrows (→)
- Highlighted node by VALUE (not index) using `state.highlight`
- Active pointer label (head, current, new_node, prev) shown above the corresponding node
- Arrow rendering: SVG or CSS-based connecting arrows
- `NULL` terminator at the end of the list

---

### T4.2 — AnimationControls Component

**File: `frontend/src/components/Visualizer/AnimationControls.jsx`**

Features:

- Play / Pause button
- Step forward / Step backward buttons
- Speed slider (100ms to 2000ms, default 600ms)
- Step counter: "Step 3 of 7"
- Reset button (returns to step 0)
- "Animation Complete" banner on final step

Internal state:

- `currentStep: number`
- `isPlaying: boolean`
- `speed: number` (ms)
- `intervalRef: useRef` for the play interval

Animation loop logic:

```javascript
// When playing: advance currentStep every `speed` ms
// When paused: stop interval
// When complete: show complete state, stop
```

---

### T4.3 — Visualizer Page (Main Page)

**File: `frontend/src/pages/Visualizer.jsx`**

Layout:

1. **Top section**: Tabs — "Array" / "Linked List"
2. **Input section**:
   - Array: input for array values (comma-separated), index, value, operation selector (insert/delete/search)
   - Linked List: input for nodes (comma-separated), value, position (for insert)
3. **Visualization section**: `ArrayVisualizer` or `LinkedListVisualizer` component
4. **Controls section**: `AnimationControls` component
5. **Message section**: Current step's `message` displayed
6. **Performance section**: After animation complete, show `execution_time_ms`, `memory_usage_kb`, `operation_count`

Data flow:

```
User fills inputs → clicks "Visualize" → POST to /array/insert (or relevant endpoint)
→ receive {states[], performance{}} → store in React state
→ pass states[currentStep] to visualizer component
→ AnimationControls loops through states
→ After last step → auto-POST to /performance/save
```

State management (in `Visualizer.jsx`):

```javascript
const [states, setStates] = useState([]);
const [currentStep, setCurrentStep] = useState(0);
const [performance, setPerformance] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [activeTab, setActiveTab] = useState("array"); // 'array' | 'linkedlist'
```

---

### T4.4 — Module Integration & Connectivity Check

1. Start both backend and frontend
2. Navigate to `/visualizer`
3. Array insert: enter `10,20,30,40`, index `2`, value `25` → click Visualize
4. Verify states are fetched from backend (check Network tab)
5. Verify animation plays step by step with correct highlighting
6. Verify speed slider changes animation speed
7. Verify pause/resume works
8. Verify final state persists on screen after animation completes
9. Verify performance metrics appear after completion
10. Linked list insert: enter `10,20,30`, value `15`, position `1` → animate
11. Verify pointer labels (head, current, new_node) appear above correct nodes

---

### T4.5 — Testing

- [ ] Array insert animation shows correct state at each step
- [ ] Array delete animation shows correct shift sequence
- [ ] Array search animation highlights each comparison
- [ ] Highlight color changes correctly per operation type
- [ ] Linked list node boxes render with arrows between them
- [ ] Active pointer label appears above correct node each step
- [ ] Animation pause stops at current step
- [ ] Step forward/backward navigates correctly
- [ ] Speed slider at 100ms animates fast, at 2000ms animates slow
- [ ] Empty array input shows validation error (before API call)
- [ ] API error response displayed to user (not just console)
- [ ] Performance metrics display correctly after animation
- [ ] Switching tabs (Array ↔ Linked List) clears previous animation
- [ ] Mobile responsive (Tailwind breakpoints)

---

### T4.6 — context.md Update

---

### T4.7 — Git Push

```bash
# On feature-arslan branch
git commit -m "feat(visualizer): implement full visualization UI

- ArrayVisualizer.jsx: animated array boxes with highlight states
- LinkedListVisualizer.jsx: node boxes with arrows and pointer labels
- AnimationControls.jsx: play/pause/step/speed controls
- Visualizer.jsx: main page wiring API calls to animation components
- State flows strictly from backend — no algorithm logic in frontend
- Auto-POSTs performance data after animation completes"

git push origin feature-arslan
```

---

## Module 5 — Performance Analysis

> Owner: Akif (backend) + Arslan (frontend charts)
> Goal: Save, retrieve, and visualize performance data per idea.md Section 8.7.

---

### T5.0 — Performance Models

**File: `backend/models/performance_models.py`**

```python
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class SavePerformanceRequest(BaseModel):
    algorithm: str
    data_structure: str
    operation: str
    input_size: int
    execution_time_ms: float
    memory_usage_kb: float
    operation_count: int
    input_data: Optional[dict] = None

class RunRecord(BaseModel):
    id: int
    algorithm: str
    data_structure: str
    operation: str
    input_size: int
    execution_time_ms: float
    memory_usage_kb: float
    operation_count: int
    ran_at: str
```

---

### T5.1 — Performance Router

**File: `backend/routers/performance.py`**

Implement per idea.md Section 8.7:

- `POST /performance/save` (protected) — inserts into `algorithm_runs` table via `supabase_service.save_algorithm_run(user_id, data)`
- `GET /performance/history` (protected) — fetches all runs for current user from `algorithm_runs`
- `GET /performance/compare` (protected) — accepts `?algorithms=array_insert,linkedlist_insert`, computes averages per algorithm, returns comparison object

For the compare endpoint:

```python
# Group runs by algorithm name, compute avg_time_ms, avg_memory_kb, avg_operations, count
```

---

### T5.2 — Performance Chart Component

**File: `frontend/src/components/Charts/PerformanceChart.jsx`**

Uses Chart.js / react-chartjs-2.

Two chart types:

1. **History Chart**: Line chart — x-axis = `ran_at` timestamps, y-axis = `execution_time_ms`, one dataset per algorithm. Shows performance trend over time.
2. **Comparison Chart**: Bar chart — x-axis = algorithm names, y-axis = `avg_time_ms`. For compare endpoint data.

```jsx
import { Line, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, ... } from 'chart.js'
```

---

### T5.3 — Performance Page

**File: `frontend/src/pages/Performance.jsx`**

Sections:

1. **Run History table**: columns — Algorithm, Operation, Input Size, Time (ms), Memory (KB), Operations, Date
2. **Time Trend chart**: `PerformanceChart` with history data
3. **Compare section**: multi-select checkboxes for algorithms → "Compare" button → bar chart with comparison data

---

### T5.4 — Module Integration & Connectivity Check

1. Run an array insert visualization → verify performance data auto-saved (check Supabase `algorithm_runs` table)
2. `GET /performance/history` — verify run appears
3. `GET /performance/compare?algorithms=array_insert` — verify avg computed
4. Frontend Performance page loads history and charts render
5. Select 2 algorithms → compare chart renders correctly

---

### T5.5 — Testing

- [ ] Performance data saved after each visualization run
- [ ] History returns only current user's runs (RLS enforced)
- [ ] Compare endpoint handles single algorithm (no divide-by-zero)
- [ ] Compare endpoint handles algorithm with no runs (graceful empty response)
- [ ] Charts render with no data (empty state message shown)
- [ ] Charts render with 1 data point (no line chart errors)
- [ ] History table sorts by date descending

---

### T5.6 — context.md Update

---

### T5.7 — Git Push

```bash
git commit -m "feat(performance): performance saving, history, and comparison

- performance_models.py: SavePerformanceRequest, RunRecord models
- routers/performance.py: save, history, compare endpoints per contracts
- PerformanceChart.jsx: Line and Bar charts via Chart.js
- Performance.jsx: run history table + trend + comparison charts
- Auto-save integrated in Visualizer after animation complete"

git push origin feature-akif
```

---

## Module 6 — Code Execution (Compiler)

> Owner: Akif (Local Subprocess Compiler service) + Arslan (editor UI)
> Goal: Users write code in browser, execute via local Subprocess Compiler, see real output.

---

### T6.0 — Compiler Service

**File: `backend/services/compiler_service.py`**

```python
import asyncio
import base64

async def execute_code(source_code: str, language_id: int, stdin: str = "") -> dict:
    # Uses local subprocess code execution engine instead of external Judge0 API
    # 1. Writes source to a temporary file
    # 2. Uses asyncio.create_subprocess_exec to compile and run
    # 3. Returns execution results dict
    pass
```

---

### T6.1 — Compiler Router & Models

**File: `backend/models/compiler_models.py`**

```python
from pydantic import BaseModel
from typing import Optional

SUPPORTED_LANGUAGES = {71, 54, 62, 63, 50}  # Python, C++, Java, JS, C

class ExecuteRequest(BaseModel):
    source_code: str
    language_id: int
    stdin: str = ""

    @validator('language_id')
    def validate_language(cls, v):
        if v not in SUPPORTED_LANGUAGES:
            raise ValueError(f'Language ID {v} not supported')
        return v

    @validator('source_code')
    def validate_length(cls, v):
        if len(v) > 10000:
            raise ValueError('Source code too long (max 10,000 characters)')
        return v

class ExecuteResponse(BaseModel):
    stdout: Optional[str]
    stderr: Optional[str]
    compile_output: Optional[str]
    status: str
    time: Optional[str]
    memory: Optional[int]
```

**File: `backend/routers/compiler.py`** — `POST /execute` (protected), calls `compiler_service.execute_code`

---

### T6.2 — Code Editor Component

**File: `frontend/src/components/Editor/CodeEditor.jsx`**

Use a `<textarea>` with monospace font and syntax highlighting via CSS (no heavy Monaco editor dependency for V1 — keep it simple with a styled textarea).

Features:

- Language selector dropdown (Python, C++, Java, JavaScript, C) with correct `language_id` mapping
- Code input area with `font-family: monospace`, line numbers (CSS counter trick)
- `stdin` textarea (optional input for the program)
- "Run Code" button
- Loading spinner during execution
- Output panel (stdout in green text, stderr in red text, compile errors in orange)
- Status badge (Accepted, Runtime Error, Compile Error, etc.)

---

### T6.3 — Compiler Page

**File: `frontend/src/pages/Compiler.jsx`**

Layout:

- Left panel: `CodeEditor` component
- Right panel: Output section (stdout, stderr, compile output, execution time, memory)
- Language info strip showing current language and Local Subprocess Compiler ID

---

### T6.4 — Module Integration & Connectivity Check

1. `POST /execute` with `{"source_code": "print('hello')", "language_id": 71, "stdin": ""}` → verify `stdout: "hello\n"`, `status: "Accepted"`
2. `POST /execute` with broken Python → verify `stderr` contains error
3. `POST /execute` with C++ code → verify it compiles and runs
4. Frontend: write Python code → Run → output appears in output panel
5. Frontend: write code with stdin → verify stdin is passed to program
6. Frontend: syntax error code → verify `compile_output` shown in orange

---

### T6.5 — Testing

- [ ] Python print statement → stdout output shown
- [ ] Python runtime error → stderr shown (not a crash)
- [ ] C++ Hello World compiles and runs
- [ ] Java Hello World compiles and runs
- [ ] Empty source code → validation error (before API call)
- [ ] Source code > 10,000 chars → `422` validation error
- [ ] Invalid language_id → `422` error
- [ ] Local Subprocess Compiler timeout (deliberately long loop) → timeout message shown
- [ ] Protected route — unauthenticated user gets `401`

---

### T6.6 — context.md Update

---

### T6.7 — Git Push

```bash
git commit -m "feat(compiler): Local Subprocess Compiler code execution integration

- compiler_service.py: async submit + poll with base64 encoding/decoding
- compiler_models.py: ExecuteRequest with language validation
- routers/compiler.py: POST /execute protected endpoint
- CodeEditor.jsx: monospace textarea with language selector
- Compiler.jsx: split layout with editor + output panel
- Supports Python, C++, Java, JavaScript, C (Local Subprocess Compiler language IDs)"

git push origin feature-akif
```

---

## Module 7 — AI Tutor

> Owner: Akif
> Goal: Natural language Q&A using Groq (LLaMA 3 70B), context-aware responses.

---

### T7.0 — Groq Service

**File: `backend/services/groq_service.py`**

```python
from groq import Groq
from backend.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

SYSTEM_PROMPT = """You are AlgoVision's AI Tutor, an expert computer science teacher specializing in data structures and algorithms. You help students understand concepts clearly.

Rules:
- Give concise, educational answers
- Use simple analogies when explaining complex concepts
- If asked about code, provide working Python examples
- Keep responses under 200 words unless a detailed explanation is requested
- Always relate your answer back to the data structure the student is currently studying

Current context: {context}"""

def ask_tutor(question: str, context: dict = None) -> dict:
    context_str = f"Structure: {context.get('current_structure', 'general')}, Operation: {context.get('current_operation', 'none')}" if context else "general study session"

    # Sanitize input
    question = question[:500]

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT.format(context=context_str)},
            {"role": "user", "content": question}
        ],
        temperature=0.7,
        max_tokens=1024,
    )

    answer = response.choices[0].message.content

    # Generate follow-up questions
    follow_up_response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": "Generate exactly 2 short follow-up questions a student might ask next. Return ONLY a JSON array of 2 strings. No other text."},
            {"role": "user", "content": f"Original question: {question}\nAnswer: {answer}"}
        ],
        temperature=0.5,
        max_tokens=200,
    )

    try:
        import json
        follow_ups = json.loads(follow_up_response.choices[0].message.content)
    except:
        follow_ups = []

    return {"answer": answer, "follow_up_questions": follow_ups}
```

---

### T7.1 — AI Tutor Router & Models

**File: `backend/models/ai_models.py`**

```python
from pydantic import BaseModel, validator
from typing import Optional, List

class AIContext(BaseModel):
    current_structure: Optional[str] = None
    current_operation: Optional[str] = None
    current_step: Optional[int] = None

class AIQueryRequest(BaseModel):
    question: str
    context: Optional[AIContext] = None

    @validator('question')
    def sanitize_question(cls, v):
        v = v.strip()
        if len(v) < 3:
            raise ValueError('Question too short')
        return v[:500]

class AIQueryResponse(BaseModel):
    answer: str
    follow_up_questions: List[str]
```

**File: `backend/routers/ai_tutor.py`** — `POST /ai/query` (protected), calls `groq_service.ask_tutor`

---

### T7.2 — AI Chat Component

**File: `frontend/src/components/AIChat.jsx`**

Features:

- Chat-style UI: user messages on right (blue), tutor responses on left (gray)
- Input box with "Ask" button
- Loading spinner while waiting for Groq response
- Follow-up question chips (clickable buttons that auto-fill the input)
- Context passthrough: receives optional `context` prop (current structure/operation from Visualizer)
- Message history stored in component state (session-only, no persistence)
- "Ask about this step" integration point — Visualizer page can pass current step context

---

### T7.3 — AI Tutor Page

**File: `frontend/src/pages/AITutor.jsx`**

Renders `AIChat` component with no pre-filled context (general study mode).

Also: the `Visualizer.jsx` page should embed a collapsible `AIChat` panel with the current visualization context pre-filled.

---

### T7.4 — Module Integration & Connectivity Check

1. `POST /ai/query` with `{"question": "What is a linked list?", "context": null}` → verify meaningful answer returned
2. Context-aware query: `{"question": "Why is this O(n)?", "context": {"current_structure": "linkedlist", "current_operation": "search"}}` → verify context referenced in answer
3. Follow-up questions returned as array of 2 strings
4. Frontend: type question → get answer → click follow-up chip → chips auto-fill input
5. Input sanitization: 501 char question → truncated to 500 before API

---

### T7.5 — Testing

- [ ] Basic question returns non-empty answer
- [ ] Context is referenced in tutor response when provided
- [ ] Empty question → validation error (frontend + backend)
- [ ] Very long question (>500 chars) → truncated, not rejected
- [ ] Follow-up questions array is always returned (even if Groq JSON parse fails — graceful fallback to `[]`)
- [ ] Groq API key invalid → `503` Service Unavailable returned (not a 500 crash)
- [ ] Rate limit scenario — verify error handled gracefully with meaningful message

---

### T7.6 — context.md Update

---

### T7.7 — Git Push

```bash
git commit -m "feat(ai-tutor): Groq LLaMA 3 AI tutoring integration

- groq_service.py: Groq client with system prompt, context injection, follow-up generation
- ai_models.py: AIQueryRequest with 500-char sanitization, AIContext model
- routers/ai_tutor.py: POST /ai/query protected endpoint
- AIChat.jsx: chat-style UI with follow-up question chips
- AITutor.jsx: standalone tutor page
- Visualizer page: embedded collapsible AI chat with step context"

git push origin feature-akif
```

---

## Module 8 — Practice Problems

> Owner: Ruman (DB seed) + Akif (backend) + Arslan (frontend)
> Goal: 10 seeded problems, code submission, Local Subprocess Compiler validation, AI hints.

---

### T8.0 — Database Seed

**File: `database/seed.sql`**

10 practice problems covering array and linked list operations:

```sql
INSERT INTO practice_problems (title, difficulty, description, solution, hints, expected_output, language_id) VALUES

('Find Maximum in Array', 'Easy',
'Given an array of integers, find and return the maximum element.\n\nInput: [3, 1, 4, 1, 5, 9]\nOutput: 9',
'arr = list(map(int, input().split()))\nprint(max(arr))',
''["Iterate through all elements", "Keep track of the current maximum", "Python has a built-in max() function"]'',
'9', 71),

('Reverse an Array', 'Easy',
'Given an array, print its elements in reverse order.\n\nInput: 1 2 3 4 5\nOutput: 5 4 3 2 1',
'arr = list(map(int, input().split()))\nprint(*arr[::-1])',
'["Use Python slice notation arr[::-1]", "Or use a loop from end to start"]',
'5 4 3 2 1', 71),

('Count Occurrences', 'Easy',
'Given an array and a target value, count how many times the target appears.\n\nFirst line: array elements\nSecond line: target\n\nInput:\n1 2 3 2 4 2\n2\nOutput: 3',
'arr = list(map(int, input().split()))\ntarget = int(input())\nprint(arr.count(target))',
'["Use list.count() method", "Or iterate and count manually"]',
'3', 71),

('Check Sorted Array', 'Easy',
'Determine if an array is sorted in ascending order. Print True or False.\n\nInput: 1 2 3 4 5\nOutput: True',
'arr = list(map(int, input().split()))\nprint(arr == sorted(arr))',
'["Compare array with its sorted version", "Or check each adjacent pair"]',
'True', 71),

('Sum of Array', 'Easy',
'Compute the sum of all elements in an array.\n\nInput: 1 2 3 4 5\nOutput: 15',
'arr = list(map(int, input().split()))\nprint(sum(arr))',
'["Use built-in sum()", "Or use a loop accumulator"]',
'15', 71),

('Remove Duplicates', 'Medium',
'Given an array, print only unique elements in their original order.\n\nInput: 1 2 2 3 4 3 5\nOutput: 1 2 3 4 5',
'arr = list(map(int, input().split()))\nseen = []\n[seen.append(x) for x in arr if x not in seen]\nprint(*seen)',
'["Use a set to track seen elements", "Maintain original order", "Python dict.fromkeys() preserves order"]',
'1 2 3 4 5', 71),

('Second Largest', 'Medium',
'Find the second largest element in an array. Assume all elements are distinct.\n\nInput: 3 1 4 1 5 9 2 6\nOutput: 6',
'arr = list(map(int, input().split()))\narr.sort()\nprint(arr[-2])',
'["Sort the array", "Access second to last element", "Or use a single pass tracking top-2 values"]',
'6', 71),

('Rotate Array', 'Medium',
'Rotate array to the right by k positions.\n\nFirst line: array\nSecond line: k\n\nInput:\n1 2 3 4 5\n2\nOutput: 4 5 1 2 3',
'arr = list(map(int, input().split()))\nk = int(input())\nk = k % len(arr)\nprint(*arr[-k:] + arr[:-k])',
'["Use Python slice: arr[-k:] + arr[:-k]", "Handle k > len(arr) with modulo", "Consider in-place rotation for efficiency"]',
'4 5 1 2 3', 71),

('Merge Two Sorted Arrays', 'Hard',
'Merge two sorted arrays into one sorted array.\n\nFirst line: first array\nSecond line: second array\n\nInput:\n1 3 5\n2 4 6\nOutput: 1 2 3 4 5 6',
'a = list(map(int, input().split()))\nb = list(map(int, input().split()))\nprint(*sorted(a+b))',
'["Two-pointer technique is most efficient", "Or simply concatenate and sort", "Think about O(n) vs O(n log n) complexity"]',
'1 2 3 4 5 6', 71),

('Find Missing Number', 'Hard',
'Given an array containing n-1 integers from 1 to n, find the missing number.\n\nInput: 1 2 4 5 6\nOutput: 3',
'arr = list(map(int, input().split()))\nn = len(arr) + 1\nprint(n*(n+1)//2 - sum(arr))',
'["Sum formula: n*(n+1)/2", "XOR approach is also valid", "What is the expected sum minus actual sum?"]',
'3', 71);
```

Run this in Supabase SQL Editor to seed the problems.

---

### T8.1 — Practice Router & Models

**File: `backend/models/practice_models.py`**

```python
from pydantic import BaseModel
from typing import Optional, List, Any

class ProblemSummary(BaseModel):
    id: int
    title: str
    difficulty: str
    description: str
    hints: List[str]

class ProblemDetail(BaseModel):
    id: int
    title: str
    difficulty: str
    description: str
    hints: List[str]
    language_id: int

class SubmitRequest(BaseModel):
    problem_id: int
    submitted_code: str
    language_id: int = 71

class SubmitResponse(BaseModel):
    status: str
    stdout: Optional[str]
    stderr: Optional[str]
    execution_time_ms: Optional[float]
    memory_usage_kb: Optional[float]
    message: str
```

**File: `backend/routers/practice.py`**

Implement per idea.md Section 8.6:

- `GET /practice/problems` — fetch all from `practice_problems`, return summary (no `solution` field)
- `GET /practice/problems/{problem_id}` — fetch single problem (no `solution` field)
- `POST /practice/submit` (protected):
  1. Fetch `expected_output` from DB for the problem
  2. Execute user's code via `compiler_service.execute_code`
  3. Compare `stdout.strip()` with `expected_output.strip()`
  4. Determine status: `Accepted` or `Wrong Answer` (or `Runtime Error`/`Compile Error` from Local Subprocess Compiler)
  5. Save attempt to `practice_attempts` table
  6. Return `SubmitResponse`
- `GET /practice/hint/{problem_id}` (protected):
  1. Fetch problem hints from DB
  2. Check user's `practice_attempts` count for this problem → return `hints[attempt_count % len(hints)]`
  3. Use Groq if hints exhausted: ask for a next-level hint

---

### T8.2 — Practice Page

**File: `frontend/src/pages/Practice.jsx`**

Layout:

1. **Problem list sidebar**: cards with title, difficulty badge (Easy=green, Medium=yellow, Hard=red)
2. **Problem detail area**: description, examples, constraints
3. **Code editor**: embedded `CodeEditor` component (language pre-set to problem's `language_id`)
4. **Stdin area**: for problems that require input
5. **Submit button** → show result (Accepted in green, Wrong Answer in red)
6. **Hint button** → show hint in expandable card
7. **Attempt history**: below problem — show past attempts with status and timestamp

---

### T8.3 — Module Integration & Connectivity Check

1. `GET /practice/problems` → verify 10 problems returned, `solution` field NOT in response
2. `POST /practice/submit` with correct solution → verify `Accepted` status saved in `practice_attempts`
3. `POST /practice/submit` with wrong output → verify `Wrong Answer`
4. `GET /practice/hint/1` → verify hint returned
5. Frontend: select problem → see description → write solution → submit → see result
6. Verify RLS: user A cannot see user B's `practice_attempts`

---

### T8.4 — Testing

- [ ] All 10 problems retrievable from API
- [ ] Solution field never returned to frontend
- [ ] Correct code submission → `Accepted`
- [ ] Wrong output → `Wrong Answer` (not Accepted)
- [ ] Runtime error in submission → `Runtime Error` status
- [ ] Compile error in submission → `Compile Error` status
- [ ] Hint returns first hint on first attempt
- [ ] Hint cycles through hints on repeated requests
- [ ] Attempt saved to DB with correct user_id, problem_id, status
- [ ] Unauthenticated submit → `401`
- [ ] Non-existent problem_id → `404`

---

### T8.5 — context.md Update

---

### T8.6 — Git Push

```bash
git commit -m "feat(practice): practice problem system with Local Subprocess Compiler validation

- database/seed.sql: 10 practice problems (Easy/Medium/Hard, arrays focus)
- practice_models.py: ProblemSummary, SubmitRequest, SubmitResponse models
- routers/practice.py: list, detail, submit, hint endpoints
- Submit: local subprocess execution + expected_output comparison + attempt save
- Hint: DB hints with attempt-count progression + Groq fallback
- Practice.jsx: problem list, code editor, submit result, hint display"

git push origin feature-akif
```

---

## Module 9 — Reporting (PDF)

> Owner: Ruman (file storage) + Akif (ReportLab logic)
> Goal: Generate downloadable PDF reports with run history, performance data, and practice summary.

---

### T9.0 — Report Service

**File: `backend/services/report_service.py`**

```python
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer
from reportlab.lib.units import inch
from io import BytesIO
from datetime import datetime

def generate_full_report(user_data: dict, runs: list, attempts: list) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch)
    styles = getSampleStyleSheet()
    story = []

    # Header
    story.append(Paragraph("AlgoVision — Learning Progress Report", styles['Title']))
    story.append(Paragraph(f"User: {user_data.get('email', 'N/A')}", styles['Normal']))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
    story.append(Spacer(1, 0.25*inch))

    # Algorithm Runs table
    story.append(Paragraph("Algorithm Run History", styles['Heading2']))
    if runs:
        run_data = [["Algorithm", "Operation", "Input Size", "Time (ms)", "Memory (KB)", "Steps", "Date"]]
        for run in runs:
            run_data.append([
                run.get('algorithm', ''),
                run.get('operation', ''),
                str(run.get('input_size', '')),
                f"{run.get('execution_time_ms', 0):.3f}",
                f"{run.get('memory_usage_kb', 0):.3f}",
                str(run.get('operation_count', '')),
                run.get('ran_at', '')[:10]
            ])
        t = Table(run_data, colWidths=[1.2*inch, 0.9*inch, 0.8*inch, 0.8*inch, 0.9*inch, 0.6*inch, 1*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        story.append(t)
    else:
        story.append(Paragraph("No algorithm runs recorded yet.", styles['Normal']))

    story.append(Spacer(1, 0.25*inch))

    # Practice Attempts Summary
    story.append(Paragraph("Practice Problem Attempts", styles['Heading2']))
    if attempts:
        att_data = [["Problem", "Status", "Language", "Time (ms)", "Date"]]
        for att in attempts:
            att_data.append([
                str(att.get('problem_id', '')),
                att.get('status', ''),
                'Python' if att.get('language_id') == 71 else str(att.get('language_id')),
                f"{att.get('execution_time_ms', 0) or 0:.1f}",
                att.get('attempted_at', '')[:10]
            ])
        t2 = Table(att_data, colWidths=[0.8*inch, 1.2*inch, 1*inch, 1*inch, 1.2*inch])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        story.append(t2)
    else:
        story.append(Paragraph("No practice attempts recorded yet.", styles['Normal']))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
```

---

### T9.1 — Report Router

**File: `backend/routers/report.py`**

Implement per idea.md Section 8.8:

- `POST /report/generate` (protected):
  1. Fetch user profile from `public.users`
  2. Fetch user's `algorithm_runs` from Supabase
  3. Fetch user's `practice_attempts` from Supabase
  4. Call `report_service.generate_full_report(user, runs, attempts)`
  5. Save PDF bytes to `/tmp/report_{user_id}_{timestamp}.pdf`
  6. Save path to `reports` table
  7. Return `{report_id, download_url, message}`

- `GET /report/download/{report_id}` (protected):
  1. Fetch report record from `reports` table
  2. Verify `user_id` matches current user
  3. Return `FileResponse` with `application/pdf` content type

---

### T9.2 — Reports Page

**File: `frontend/src/pages/Reports.jsx`**

Layout:

- "Generate Report" button with loading state
- Past reports list: columns — Report ID, Type, Generated Date, Download button
- Download button triggers `GET /report/download/{id}` and triggers file download via browser

---

### T9.3 — Module Integration & Connectivity Check

1. `POST /report/generate` → verify PDF bytes returned with valid PDF header (`%PDF`)
2. `GET /report/download/{id}` → browser prompts PDF download
3. Open downloaded PDF → verify all sections present (header, runs table, attempts table)
4. Report generated with no runs/attempts → verify graceful "no data" messages in PDF
5. User A cannot download User B's report → `403`

---

### T9.4 — Testing

- [ ] PDF generates without ReportLab errors
- [ ] PDF opens correctly in browser/PDF viewer
- [ ] Report header shows correct user email and timestamp
- [ ] Algorithm runs table renders with correct columns
- [ ] Practice attempts table renders correctly
- [ ] Empty runs → "No algorithm runs recorded yet" in PDF
- [ ] Report saved to `reports` table in DB
- [ ] Download URL is valid and returns actual PDF bytes
- [ ] Cross-user access blocked (RLS)
- [ ] Generate button shows loading state during generation

---

### T9.5 — context.md Update

---

### T9.6 — Git Push

```bash
git commit -m "feat(reports): PDF report generation with ReportLab

- report_service.py: ReportLab PDF with user header, runs table, attempts table
- routers/report.py: POST /report/generate + GET /report/download/{id}
- Reports.jsx: generate button, report history, download links
- PDF includes: user info, algorithm run history, practice attempt summary
- Cross-user access blocked via user_id verification"

git push origin feature-ruman
# (or feature-akif if Akif implements backend)
```

---

## Module 10 — Docker & Deployment Readiness

> Owner: Ruman
> Goal: Full system deployable via single `docker compose up`. Production-ready configuration.

---

### T10.0 — Production Docker Configuration

**Update `docker-compose.yml`** for production profile:

```yaml
version: "3.9"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
```

**File: `frontend/Dockerfile.prod`** (production build):

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**File: `frontend/nginx.conf`:**

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Update `frontend/vite.config.js`:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://backend:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
```

---

### T10.1 — Navbar & Application Shell

**File: `frontend/src/components/Navbar.jsx`**

Navigation links: Home | Visualizer | Compiler | AI Tutor | Practice | Performance | Reports

Show user email + Logout button when logged in. Show Login/Signup when not.

---

### T10.2 — Home Page

**File: `frontend/src/pages/Home.jsx`**

Landing page sections:

1. Hero: "AlgoVision — Learn Data Structures Visually"
2. Feature cards: Visualizer, Compiler, AI Tutor, Practice
3. "Get Started" button → /signup (if not logged in) or /visualizer (if logged in)
4. Brief explanation of the Learn → Execute → Visualize → Analyze → Improve loop

---

### T10.3 — End-to-End System Integration Check

The complete system must pass all of the following:

**Backend:**

1. `docker compose up --build` starts both containers
2. All 8 router prefixes respond correctly
3. Supabase connection verified: `GET /auth/me` with valid token works
4. Groq connection verified: `POST /ai/query` returns a real answer
5. Local Subprocess Compiler connection verified: `POST /execute` runs Python code
6. PDF generation verified: `POST /report/generate` returns valid PDF

**Frontend:** 7. Production build completes: `npm run build` in frontend/ 8. All 9 pages load without console errors 9. Auth flow: signup → login → protected pages accessible → logout → redirected 10. Full visualization flow: input data → animate → performance saved → AI question → answer 11. Compiler flow: write code → run → output shown 12. Practice flow: select problem → submit correct → Accepted → download report 13. Report downloads and opens as valid PDF

**Docker:** 14. `docker compose up` (dev) → both services healthy 15. `docker compose -f docker-compose.yml up --build` → production build serves frontend on port 80

---

### T10.4 — Final Testing Checklist

**Authentication:**

- [ ] Signup with new email → success
- [ ] Login with correct credentials → JWT stored
- [ ] Session persists on refresh
- [ ] Logout clears session

**Visualization:**

- [ ] Array insert → all states animate → performance saved
- [ ] Array delete → correct steps
- [ ] Array search → found/not-found states
- [ ] Linked list insert at head, middle, tail
- [ ] Linked list delete found/not-found
- [ ] Linked list search found/not-found
- [ ] Animation controls: play/pause/step/speed all work
- [ ] AI chat embedded in visualizer returns context-aware answer

**Compiler:**

- [ ] Python runs correctly
- [ ] C++ runs correctly
- [ ] Java runs correctly
- [ ] Runtime error shown in red
- [ ] Compile error shown in orange

**AI Tutor:**

- [ ] General question answered
- [ ] Context-aware question (from visualizer) answered with context
- [ ] Follow-up chips work

**Practice:**

- [ ] All 10 problems listed
- [ ] Correct solution → Accepted
- [ ] Wrong solution → Wrong Answer
- [ ] Hints cycle through DB hints
- [ ] Attempt history visible per user

**Performance:**

- [ ] History shows runs after visualization
- [ ] Compare endpoint works with 2+ algorithms
- [ ] Charts render correctly

**Reports:**

- [ ] PDF generates successfully
- [ ] PDF downloads
- [ ] PDF contains all sections

**Security:**

- [ ] No service role key in frontend bundle (`npm run build` then `grep -r "service_role" dist/`)
- [ ] Cross-user data access blocked (test with 2 accounts)
- [ ] All protected endpoints return `401` without token

---

### T10.5 — context.md Final Update

Add the final Module 10 entry and a "System Complete" summary entry.

---

### T10.6 — Final Git Push & Main Merge

```bash
# On feature branches, commit all final changes
git commit -m "feat(deployment): production Docker configuration and full system integration

- docker-compose.yml: production profile with health checks
- frontend/Dockerfile.prod: multi-stage build with nginx
- frontend/nginx.conf: SPA routing + backend proxy
- Navbar.jsx: complete navigation with auth-aware links
- Home.jsx: landing page with feature overview
- All modules integrated and end-to-end tested
- System passes full deployment checklist"

git push origin feature-akif  # (and feature-arslan, feature-ruman for their work)

# PR: feature-akif → dev (and others)
# After all PRs merged to dev and tested:
# PR: dev → main
# Merge with commit: "release(v1.0): AlgoVision V1 MVP complete"
```

---

## Environment Variables Reference (demo.env)

> This section documents how to obtain each required secret. **Copy this to `demo.env` at project root. Never commit real keys.**

**File: `demo.env`** (committed to repo — shows where to get keys, no real values):

```env
# ═══════════════════════════════════════════════════════
# AlgoVision — Environment Variables Reference (demo.env)
# Copy backend/.env.example → backend/.env and fill values
# Copy frontend/.env.example → frontend/.env and fill values
# ═══════════════════════════════════════════════════════

# ─── SUPABASE ──────────────────────────────────────────
# HOW TO GET:
#   1. Go to https://supabase.com and log in
#   2. Open your AlgoVision project
#   3. Click Settings (gear icon) → API
#   4. Copy "Project URL" → SUPABASE_URL
#   5. Copy "anon/public" key → VITE_SUPABASE_ANON_KEY (frontend)
#   6. Copy "service_role" key → SUPABASE_KEY (backend ONLY — never expose to frontend)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key-here         # backend only
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here       # frontend only

# ─── GROQ API ──────────────────────────────────────────
# HOW TO GET:
#   1. Go to https://console.groq.com
#   2. Sign up / Log in
#   3. Click "API Keys" in left sidebar
#   4. Click "Create API Key"
#   5. Name it "AlgoVision" and copy the key (shown only once)
#   Free tier: 14,400 tokens/minute on LLaMA 3 70B — sufficient for development
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama3-70b-8192


# ─── FASTAPI SERVER ────────────────────────────────────
APP_HOST=0.0.0.0
APP_PORT=8000
DEBUG=True

# ─── SECURITY ──────────────────────────────────────────
# Generate a secure random key:
#   python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=generate-a-random-32-char-hex-string-here

# ─── FRONTEND (in frontend/.env) ───────────────────────
VITE_API_BASE_URL=http://localhost:8000
```

---

## Context Log File Format (context.md)

> All entries go in `docs/context.md`. One entry per module. Format is strict.

**File: `docs/context.md`** — template:

```markdown
# AlgoVision — Development Context Log

## Maintained by: Akif (Lead) | Updated after each module

---

## Entry Format

### [MODULE_NUMBER] — [MODULE_NAME]

**Date:** YYYY-MM-DD  
**Branch:** feature-{name}  
**Author:** {name}

#### Files Created / Modified

| File               | Action   | Reason                          |
| ------------------ | -------- | ------------------------------- |
| `path/to/file.py`  | Created  | Reason why this file was needed |
| `path/to/file.jsx` | Modified | What changed and why            |

#### What Was Built

[2-3 sentences describing what was implemented]

#### Problems Encountered & Solutions

**Problem:** [Describe the bug or blocker]  
**Solution:** [How it was resolved]

#### API Contracts Implemented

- `POST /endpoint` — [brief description]

#### Testing Notes

- [What was tested and results]

#### Known Limitations / Tech Debt

- [V4 Cloud Deployment and Polish]

---
```

---

## Git Workflow Reference

### Branch Naming

```
main           ← stable production code
dev            ← integration branch (all features merge here first)
feature-akif   ← Akif's development work
feature-arslan ← Arslan's development work
feature-ruman  ← Ruman's development work
```

### Commit Message Format

```
<type>(<scope>): <short description>

<optional body — what and why>

Types: feat | fix | docs | chore | test | refactor
Scopes: scaffold | auth | array | linkedlist | visualizer | performance | compiler | ai | practice | reports | docker

Examples:
feat(array): add insert operation with full state generation
fix(compiler): handle execution failure on empty stdout
docs(planning): add Module 5 performance analysis tasks
chore(docker): add health check to backend service
test(auth): add edge case for duplicate email signup
```

### Merge Flow

```
1. Develop on feature-{name}
2. git push origin feature-{name}
3. Open PR: feature-{name} → dev on GitHub
4. Team reviews (at minimum Akif reviews all PRs)
5. Merge to dev
6. Test on dev branch (run full checklist)
7. Open PR: dev → main
8. Merge to main (requires passing T_module_.4 checklist)
```

### Never Do

- `git push origin main` directly
- `git push origin dev` directly
- Commit `.env` files
- Commit `node_modules/`
- Force push to `main` or `dev`

---

_Document authored by: Akif (FA24-BSE-129) — AlgoVision Lead_  
_Version: 1.0 | Status: Active Development Reference_  
_Strictly follows: idea.md Version 1.0 | V1 MVP Scope Only_

```

```
