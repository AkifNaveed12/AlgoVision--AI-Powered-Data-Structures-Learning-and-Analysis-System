from fastapi import APIRouter, Depends, HTTPException
from typing import List
from backend.models.performance_models import SavePerformanceRequest, RunRecord
from backend.services.supabase_service import (
    get_current_user, save_algorithm_run, get_algorithm_runs, get_algorithm_runs_by_names
)

router = APIRouter()


@router.post("/save")
def save_performance(req: SavePerformanceRequest, current_user=Depends(get_current_user)):
    """Save performance data after a visualization run (protected)."""
    run_data = req.model_dump()
    result = save_algorithm_run(str(current_user.id), run_data)
    return {"id": result.get("id"), "message": "Performance data saved"}


@router.get("/history")
def get_history(current_user=Depends(get_current_user)):
    """Get all algorithm runs for the current user (protected)."""
    runs = get_algorithm_runs(str(current_user.id))
    return {"runs": runs}


@router.get("/compare")
def compare(algorithms: str, current_user=Depends(get_current_user)):
    """
    Compare performance averages across multiple algorithms.
    ?algorithms=array_insert,linkedlist_insert
    """
    algorithm_list = [a.strip() for a in algorithms.split(",") if a.strip()]
    if not algorithm_list:
        raise HTTPException(status_code=400, detail="Provide at least one algorithm name")

    runs = get_algorithm_runs_by_names(str(current_user.id), algorithm_list)

    # Group and compute averages
    groups: dict = {}
    for run in runs:
        name = run["algorithm"]
        if name not in groups:
            groups[name] = {"times": [], "memories": [], "ops": []}
        groups[name]["times"].append(run["execution_time_ms"])
        groups[name]["memories"].append(run["memory_usage_kb"])
        groups[name]["ops"].append(run["operation_count"])

    comparison = {}
    for name, data in groups.items():
        n = len(data["times"])
        comparison[name] = {
            "avg_time_ms": round(sum(data["times"]) / n, 4) if n else 0,
            "avg_memory_kb": round(sum(data["memories"]) / n, 4) if n else 0,
            "avg_operations": round(sum(data["ops"]) / n, 2) if n else 0,
            "runs": n,
        }

    # Add empty entries for requested algorithms with no data
    for name in algorithm_list:
        if name not in comparison:
            comparison[name] = {"avg_time_ms": 0, "avg_memory_kb": 0, "avg_operations": 0, "runs": 0}

    return {"comparison": comparison}
