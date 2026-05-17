"""
Graph Router — /graph/*
Implements Graph BFS and DFS endpoints per idea.md V2 contracts.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator
from typing import List, Optional

from backend.algorithms.graph_engine import graph_bfs, graph_dfs

router = APIRouter()


class GraphEdge(BaseModel):
    from_node: str
    to: str


class GraphBFSRequest(BaseModel):
    nodes: List[str]           # list of node IDs e.g. ["A","B","C"]
    edges: List[dict]          # list of {from, to}
    start_node: str

    @validator('nodes')
    def validate_size(cls, v):
        if len(v) > 20:
            raise ValueError('Graph must have at most 20 nodes for visualization')
        if len(v) < 1:
            raise ValueError('Graph must have at least 1 node')
        return v

    @validator('start_node')
    def validate_start(cls, v, values):
        if 'nodes' in values and v not in values['nodes']:
            raise ValueError(f'start_node "{v}" must be one of the graph nodes')
        return v


class GraphDFSRequest(BaseModel):
    nodes: List[str]
    edges: List[dict]
    start_node: str

    @validator('nodes')
    def validate_size(cls, v):
        if len(v) > 20:
            raise ValueError('Graph must have at most 20 nodes for visualization')
        if len(v) < 1:
            raise ValueError('Graph must have at least 1 node')
        return v

    @validator('start_node')
    def validate_start(cls, v, values):
        if 'nodes' in values and v not in values['nodes']:
            raise ValueError(f'start_node "{v}" must be one of the graph nodes')
        return v


@router.post("/bfs")
def graph_bfs_endpoint(req: GraphBFSRequest):
    try:
        # Normalize edge format: frontend sends {from, to}, engine expects {from, to}
        edges = [{"from": e.get("from", e.get("from_node", "")), "to": e.get("to", "")} for e in req.edges]
        result = graph_bfs(req.nodes, edges, req.start_node)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/dfs")
def graph_dfs_endpoint(req: GraphDFSRequest):
    try:
        edges = [{"from": e.get("from", e.get("from_node", "")), "to": e.get("to", "")} for e in req.edges]
        result = graph_dfs(req.nodes, edges, req.start_node)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
