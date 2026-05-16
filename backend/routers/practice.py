from fastapi import APIRouter, Depends, HTTPException
from backend.models.practice_models import SubmitRequest, SubmitResponse
from backend.services.supabase_service import (
    get_current_user, get_all_problems, get_problem_by_id,
    save_practice_attempt, get_user_attempts_for_problem
)
from backend.services import compiler_service
from backend.services.groq_service import ask_tutor

router = APIRouter()


@router.get("/problems")
async def list_problems():
    """List all practice problems (public — no auth required). Solution field excluded."""
    problems = get_all_problems()
    # Never return solution to frontend
    return {
        "problems": [
            {
                "id": p["id"],
                "title": p["title"],
                "difficulty": p["difficulty"],
                "description": p["description"],
                "hints": p.get("hints", []),
            }
            for p in problems
        ]
    }


@router.get("/problems/{problem_id}")
async def get_problem(problem_id: int):
    """Get a single problem detail (public). Solution excluded."""
    problem = get_problem_by_id(problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail=f"Problem {problem_id} not found")
    return {
        "id": problem["id"],
        "title": problem["title"],
        "difficulty": problem["difficulty"],
        "description": problem["description"],
        "hints": problem.get("hints", []),
        "language_id": problem.get("language_id", 71),
    }


@router.post("/submit", response_model=SubmitResponse)
async def submit(req: SubmitRequest, current_user=Depends(get_current_user)):
    """Submit code for a practice problem. Executes via Judge0 and compares output."""
    problem = get_problem_by_id(req.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail=f"Problem {req.problem_id} not found")

    expected_output = (problem.get("expected_output") or "").strip()

    # Execute via Judge0
    result = await compiler_service.execute_code(req.submitted_code, req.language_id)
    judge_status = result.get("status", "")
    stdout = result.get("stdout") or ""
    stderr = result.get("stderr")

    # Determine AlgoVision status
    if judge_status in ("Compilation Error",):
        av_status = "Compile Error"
        message = "Compilation failed. Check your syntax."
    elif judge_status in ("Runtime Error",):
        av_status = "Runtime Error"
        message = "Your code encountered a runtime error."
    elif judge_status == "Accepted" and stdout.strip() == expected_output:
        av_status = "Accepted"
        message = "Correct! Well done. 🎉"
    elif judge_status == "Timeout":
        av_status = "Runtime Error"
        message = "Your code took too long to execute."
    else:
        av_status = "Wrong Answer"
        message = f"Wrong answer. Expected: '{expected_output}', Got: '{stdout.strip()}'"

    # Save attempt
    exec_time = None
    mem_kb = None
    try:
        exec_time = float(result.get("time") or 0) * 1000  # ms
        mem_kb = (result.get("memory") or 0) / 1024
    except Exception:
        pass

    save_practice_attempt(str(current_user.id), {
        "problem_id": req.problem_id,
        "submitted_code": req.submitted_code,
        "language_id": req.language_id,
        "status": av_status,
        "stdout": stdout,
        "stderr": stderr,
        "execution_time_ms": exec_time,
        "memory_usage_kb": mem_kb,
    })

    return {
        "status": av_status,
        "stdout": stdout,
        "stderr": stderr,
        "execution_time_ms": exec_time,
        "memory_usage_kb": mem_kb,
        "message": message,
    }


@router.get("/hint/{problem_id}")
async def get_hint(problem_id: int, current_user=Depends(get_current_user)):
    """Get a progressive hint for a problem based on attempt history."""
    problem = get_problem_by_id(problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail=f"Problem {problem_id} not found")

    hints = problem.get("hints", [])
    attempts = get_user_attempts_for_problem(str(current_user.id), problem_id)
    attempt_count = len(attempts)

    if hints and attempt_count < len(hints):
        hint = hints[attempt_count % len(hints)]
        return {"hint": hint, "hint_level": attempt_count + 1}

    # Exhausted static hints — ask Groq for a deeper hint
    try:
        ai_response = ask_tutor(
            f"Give me a concise hint for this coding problem: {problem['title']}. "
            f"Description: {problem['description'][:200]}",
            {"current_structure": "array", "current_operation": "problem_solving"}
        )
        return {"hint": ai_response["answer"], "hint_level": attempt_count + 1, "ai_generated": True}
    except Exception:
        hint = hints[-1] if hints else "Think step by step. Break the problem into smaller parts."
        return {"hint": hint, "hint_level": attempt_count + 1}
