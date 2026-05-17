from supabase import create_client, Client
from fastapi import Header, HTTPException
from datetime import datetime, timezone, timedelta

from backend.config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


# ─── Auth Helpers ────────────────────────────────────────────────────────────

async def verify_token(token: str) -> dict:
    """Verify Supabase JWT and return user object."""
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return user.user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(authorization: str = Header(...)) -> dict:
    """FastAPI dependency: extracts and verifies Bearer token."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header must start with Bearer")
    token = authorization[7:]
    return await verify_token(token)


# ─── User Profile ─────────────────────────────────────────────────────────────

def get_user_profile(user_id: str) -> dict:
    """Fetch public.users row for the given UUID."""
    result = supabase.table("users").select("*").eq("id", user_id).single().execute()
    return result.data if result.data else {}


def update_user_full_name(user_id: str, full_name: str) -> dict:
    """Update full_name in public.users."""
    result = supabase.table("users").update({"full_name": full_name}).eq("id", user_id).execute()
    return result.data


# ─── Algorithm Runs ───────────────────────────────────────────────────────────

def save_algorithm_run(user_id: str, run_data: dict) -> dict:
    """Insert a performance record into algorithm_runs."""
    payload = {**run_data, "user_id": user_id}
    result = supabase.table("algorithm_runs").insert(payload).execute()
    return result.data[0] if result.data else {}


def get_algorithm_runs(user_id: str) -> list:
    """Fetch all algorithm runs for the user, newest first."""
    result = (
        supabase.table("algorithm_runs")
        .select("*")
        .eq("user_id", user_id)
        .order("ran_at", desc=True)
        .execute()
    )
    return result.data or []


def get_algorithm_runs_by_names(user_id: str, algorithms: list) -> list:
    """Fetch runs filtered by algorithm names for comparison."""
    result = (
        supabase.table("algorithm_runs")
        .select("*")
        .eq("user_id", user_id)
        .in_("algorithm", algorithms)
        .execute()
    )
    return result.data or []


# ─── Practice ─────────────────────────────────────────────────────────────────

def get_all_problems() -> list:
    """Fetch all practice problems (public)."""
    result = supabase.table("practice_problems").select("*").order("id").execute()
    return result.data or []


def get_problem_by_id(problem_id: int) -> dict:
    """Fetch a single practice problem by ID."""
    result = supabase.table("practice_problems").select("*").eq("id", problem_id).single().execute()
    return result.data if result.data else None


def update_user_streak(user_id: str):
    """Calculate and update consecutive day streaks for a user."""
    profile = get_user_profile(user_id)
    last_active = profile.get("last_active_date")
    current_streak = profile.get("current_streak") or 0
    longest_streak = profile.get("longest_streak") or 0
    
    today = datetime.now(timezone.utc).date()
    
    if not last_active:
        new_streak = 1
    else:
        last_date = datetime.strptime(last_active, "%Y-%m-%d").date()
        if last_date == today:
            return profile # already practiced today
        elif last_date == today - timedelta(days=1):
            new_streak = current_streak + 1
        else:
            new_streak = 1
            
    new_longest = max(new_streak, longest_streak)
    
    try:
        result = supabase.table("users").update({
            "current_streak": new_streak,
            "longest_streak": new_longest,
            "last_active_date": today.isoformat()
        }).eq("id", user_id).execute()
        return result.data[0] if result.data else profile
    except Exception:
        return profile


def save_practice_attempt(user_id: str, attempt_data: dict) -> dict:
    """Save a practice submission attempt."""
    payload = {**attempt_data, "user_id": user_id}
    result = supabase.table("practice_attempts").insert(payload).execute()
    
    # Update streak on practice submission
    try:
        update_user_streak(user_id)
    except Exception:
        pass
        
    return result.data[0] if result.data else {}


def get_user_attempts_for_problem(user_id: str, problem_id: int) -> list:
    """Get all attempts a user made on a specific problem."""
    result = (
        supabase.table("practice_attempts")
        .select("*")
        .eq("user_id", user_id)
        .eq("problem_id", problem_id)
        .order("attempted_at", desc=True)
        .execute()
    )
    return result.data or []


def get_user_attempts(user_id: str) -> list:
    """Get all attempts by a user."""
    result = (
        supabase.table("practice_attempts")
        .select("*")
        .eq("user_id", user_id)
        .order("attempted_at", desc=True)
        .execute()
    )
    return result.data or []


# ─── Reports ──────────────────────────────────────────────────────────────────

def save_report(user_id: str, report_file: str, report_type: str = "full") -> dict:
    """Save a report record."""
    payload = {"user_id": user_id, "report_file": report_file, "report_type": report_type}
    result = supabase.table("reports").insert(payload).execute()
    return result.data[0] if result.data else {}


def get_reports(user_id: str) -> list:
    """Get all reports for a user."""
    result = (
        supabase.table("reports")
        .select("*")
        .eq("user_id", user_id)
        .order("generated_at", desc=True)
        .execute()
    )
    return result.data or []


def get_report_by_id(report_id: int) -> dict:
    """Get a single report."""
    result = supabase.table("reports").select("*").eq("id", report_id).single().execute()
    return result.data if result.data else None
