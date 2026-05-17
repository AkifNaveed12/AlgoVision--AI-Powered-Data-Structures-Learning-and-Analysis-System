"""
Sorting Router — /sorting/*
Implements sorting algorithm and binary search endpoints (V3).
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator
from typing import List

from backend.algorithms.sorting_engine import (
    bubble_sort, selection_sort, insertion_sort, merge_sort, quick_sort,
    binary_search
)

router = APIRouter()

VALID_SORT_ALGORITHMS = {"bubble", "selection", "insertion", "merge", "quick"}


class SortRequest(BaseModel):
    array: List[int]
    algorithm: str       # bubble | selection | insertion | merge | quick

    @validator('array')
    def validate_size(cls, v):
        if len(v) == 0:
            raise ValueError('Array cannot be empty')
        if len(v) > 30:
            raise ValueError('Array must have at most 30 elements for visualization')
        return v

    @validator('algorithm')
    def validate_algorithm(cls, v):
        if v not in VALID_SORT_ALGORITHMS:
            raise ValueError(f'Algorithm must be one of: {", ".join(VALID_SORT_ALGORITHMS)}')
        return v


class BinarySearchRequest(BaseModel):
    array: List[int]
    target: int

    @validator('array')
    def validate_size(cls, v):
        if len(v) == 0:
            raise ValueError('Array cannot be empty')
        if len(v) > 50:
            raise ValueError('Array must have at most 50 elements for visualization')
        return v


class AlgorithmRaceRequest(BaseModel):
    array: List[int]
    algorithms: List[str]   # list of algorithm names to race

    @validator('array')
    def validate_size(cls, v):
        if len(v) == 0:
            raise ValueError('Array cannot be empty')
        if len(v) > 30:
            raise ValueError('Array must have at most 30 elements for visualization')
        return v

    @validator('algorithms')
    def validate_algorithms(cls, v):
        for alg in v:
            if alg not in VALID_SORT_ALGORITHMS:
                raise ValueError(f'Algorithm "{alg}" not supported')
        if len(v) < 2:
            raise ValueError('Race mode requires at least 2 algorithms')
        return v


def _run_sort(algorithm: str, array: List[int]) -> dict:
    algo_map = {
        "bubble": bubble_sort,
        "selection": selection_sort,
        "insertion": insertion_sort,
        "merge": merge_sort,
        "quick": quick_sort,
    }
    return algo_map[algorithm](array)


@router.post("/sort")
def sort_endpoint(req: SortRequest):
    try:
        result = _run_sort(req.algorithm, req.array)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/binary-search")
def binary_search_endpoint(req: BinarySearchRequest):
    try:
        result = binary_search(req.array, req.target)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/race")
def race_endpoint(req: AlgorithmRaceRequest):
    """
    Algorithm race mode: run multiple sorting algorithms on the same array.
    Returns performance comparison (no animation states — just metrics).
    """
    try:
        results = {}
        for alg in req.algorithms:
            res = _run_sort(alg, list(req.array))
            results[alg] = {
                "execution_time_ms": res["performance"]["execution_time_ms"],
                "memory_usage_kb": res["performance"]["memory_usage_kb"],
                "operation_count": res["performance"]["operation_count"],
                "sorted_array": res.get("sorted_array", []),
            }
        return {
            "race_results": results,
            "array_size": len(req.array),
            "algorithms": req.algorithms,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
