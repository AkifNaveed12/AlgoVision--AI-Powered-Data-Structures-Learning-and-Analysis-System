"""
AVL Router — /avl/*
Provides AVL tree insert, delete, search, and traversal endpoints
with full rotation-animation state sequences.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator
from typing import List

from backend.algorithms.avl_engine import (
    avl_insert,
    avl_delete,
    avl_search,
    avl_traversal,
)

router = APIRouter()


# ─── Request models ───────────────────────────────────────────────────────────

class AVLInsertRequest(BaseModel):
    values:    List[int]
    new_value: int

    @validator('values')
    def validate_size(cls, v):
        if len(v) > 30:
            raise ValueError('AVL tree must have at most 30 nodes for visualization')
        return v


class AVLDeleteRequest(BaseModel):
    values: List[int]
    target: int

    @validator('values')
    def validate_size(cls, v):
        if len(v) > 30:
            raise ValueError('AVL tree must have at most 30 nodes for visualization')
        return v


class AVLSearchRequest(BaseModel):
    values: List[int]
    target: int

    @validator('values')
    def validate_size(cls, v):
        if len(v) > 30:
            raise ValueError('AVL tree must have at most 30 nodes for visualization')
        return v


class AVLTraversalRequest(BaseModel):
    values:         List[int]
    traversal_type: str = "inorder"

    @validator('traversal_type')
    def validate_type(cls, v):
        if v not in ["inorder", "preorder", "postorder"]:
            raise ValueError("traversal_type must be 'inorder', 'preorder', or 'postorder'")
        return v

    @validator('values')
    def validate_size(cls, v):
        if len(v) > 30:
            raise ValueError('AVL tree must have at most 30 nodes for visualization')
        return v


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/insert")
def avl_insert_endpoint(req: AVLInsertRequest):
    try:
        return avl_insert(req.values, req.new_value)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/delete")
def avl_delete_endpoint(req: AVLDeleteRequest):
    try:
        return avl_delete(req.values, req.target)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/search")
def avl_search_endpoint(req: AVLSearchRequest):
    try:
        return avl_search(req.values, req.target)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/traversal")
def avl_traversal_endpoint(req: AVLTraversalRequest):
    try:
        return avl_traversal(req.values, req.traversal_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
