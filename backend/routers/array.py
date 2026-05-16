from fastapi import APIRouter, HTTPException
from backend.models.array_models import (
    ArrayInsertRequest, ArrayDeleteRequest, ArraySearchRequest, VisualizationResponse
)
from backend.algorithms.array_engine import array_insert, array_delete, array_search

router = APIRouter()


@router.post("/insert", response_model=VisualizationResponse)
def insert(req: ArrayInsertRequest):
    """Insert a value at a given index with step-by-step states."""
    try:
        result = array_insert(req.array, req.index, req.value)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/delete", response_model=VisualizationResponse)
def delete(req: ArrayDeleteRequest):
    """Delete element at a given index with step-by-step states."""
    try:
        result = array_delete(req.array, req.index)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/search", response_model=VisualizationResponse)
def search(req: ArraySearchRequest):
    """Linear search for a value with step-by-step states."""
    try:
        result = array_search(req.array, req.value)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
