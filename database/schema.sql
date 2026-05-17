-- ═══════════════════════════════════════════════════════════════════
-- AlgoVision — Supabase PostgreSQL Schema
-- Run this ENTIRE file in the Supabase SQL Editor (once)
-- Supabase Auth manages auth.users automatically
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- TABLE: public.users
-- Mirror of auth.users for custom profile data
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_active_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────
-- TABLE: practice_problems
-- Seeded once; read-only at runtime
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS practice_problems (
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


-- ─────────────────────────────────────────────────────────────────
-- TABLE: algorithm_runs
-- Stores performance data for every operation run
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS algorithm_runs (
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

CREATE INDEX IF NOT EXISTS idx_algorithm_runs_user_id ON algorithm_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_algorithm_runs_ran_at ON algorithm_runs(ran_at DESC);


-- ─────────────────────────────────────────────────────────────────
-- TABLE: reports
-- Stores generated PDF report references
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    report_file TEXT NOT NULL,             -- file path or storage key
    report_type TEXT DEFAULT 'full',       -- "full" | "performance" | "practice"
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);


-- ─────────────────────────────────────────────────────────────────
-- TABLE: practice_attempts
-- Tracks every practice problem submission
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS practice_attempts (
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

CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_id ON practice_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_problem_id ON practice_attempts(problem_id);


-- ─────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Users can only read/write their own data
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE algorithm_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_problems ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before re-creating (safe re-run)
DROP POLICY IF EXISTS "Users read own profile" ON public.users;
DROP POLICY IF EXISTS "Users manage own algorithm runs" ON algorithm_runs;
DROP POLICY IF EXISTS "Users manage own reports" ON reports;
DROP POLICY IF EXISTS "Users manage own attempts" ON practice_attempts;
DROP POLICY IF EXISTS "Public read practice problems" ON practice_problems;

-- users: read own profile
CREATE POLICY "Users read own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- users: insert own profile (needed for trigger)
CREATE POLICY "Users insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- users: update own profile
CREATE POLICY "Users update own profile"
    ON public.users FOR UPDATE
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
CREATE POLICY "Public read practice problems"
    ON practice_problems FOR SELECT
    TO anon, authenticated
    USING (true);