from fastapi import APIRouter, HTTPException
from backend.models.linkedlist_models import (
    LinkedListInsertRequest, LinkedListDeleteRequest, LinkedListSearchRequest
)
from backend.models.array_models import VisualizationResponse
from backend.algorithms.linkedlist_engine import linkedlist_insert, linkedlist_delete, linkedlist_search

router = APIRouter()


@router.post("/insert", response_model=VisualizationResponse)
def insert(req: LinkedListInsertRequest):
    """Insert a node at a given position with step-by-step states."""
    try:
        result = linkedlist_insert(req.nodes, req.value, req.position)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/delete", response_model=VisualizationResponse)
def delete(req: LinkedListDeleteRequest):
    """Delete the first occurrence of a value with step-by-step states."""
    try:
        result = linkedlist_delete(req.nodes, req.value)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/search", response_model=VisualizationResponse)
def search(req: LinkedListSearchRequest):
    """Search for a value in the linked list with step-by-step states."""
    try:
        result = linkedlist_search(req.nodes, req.value)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
