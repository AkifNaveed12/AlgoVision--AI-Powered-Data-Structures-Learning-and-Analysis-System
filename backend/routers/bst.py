"""
BST Router — /bst/*
Implements BST insert, search, and traversal endpoints per idea.md contracts.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator
from typing import List, Optional

from backend.algorithms.bst_engine import bst_insert, bst_search, bst_traversal, bst_delete

router = APIRouter()


class BSTInsertRequest(BaseModel):
    values: List[int]          # existing BST values (in insertion order)
    new_value: int

    @validator('values')
    def validate_size(cls, v):
        if len(v) > 30:
            raise ValueError('BST must have at most 30 nodes for visualization')
        return v


class BSTSearchRequest(BaseModel):
    values: List[int]
    target: int

    @validator('values')
    def validate_size(cls, v):
        if len(v) > 30:
            raise ValueError('BST must have at most 30 nodes for visualization')
        return v


class BSTTraversalRequest(BaseModel):
    values: List[int]
    traversal_type: str = "inorder"   # inorder | preorder | postorder

    @validator('traversal_type')
    def validate_type(cls, v):
        if v not in ["inorder", "preorder", "postorder"]:
            raise ValueError("traversal_type must be 'inorder', 'preorder', or 'postorder'")
        return v

    @validator('values')
    def validate_size(cls, v):
        if len(v) > 30:
            raise ValueError('BST must have at most 30 nodes for visualization')
        return v


@router.post("/insert")
def bst_insert_endpoint(req: BSTInsertRequest):
    try:
        result = bst_insert(req.values, req.new_value)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/search")
def bst_search_endpoint(req: BSTSearchRequest):
    try:
        result = bst_search(req.values, req.target)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/traversal")
def bst_traversal_endpoint(req: BSTTraversalRequest):
    try:
        result = bst_traversal(req.values, req.traversal_type)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


class BSTDeleteRequest(BaseModel):
    values: List[int]          # current BST values (in insertion order)
    target: int                # value to delete

    @validator('values')
    def validate_size(cls, v):
        if len(v) > 30:
            raise ValueError('BST must have at most 30 nodes for visualization')
        return v


@router.post("/delete")
def bst_delete_endpoint(req: BSTDeleteRequest):
    try:
        result = bst_delete(req.values, req.target)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
