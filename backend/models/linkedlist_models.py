from pydantic import BaseModel, field_validator
from typing import List, Optional


class LinkedListInsertRequest(BaseModel):
    nodes: List[int]
    value: int
    position: int

    @field_validator("nodes")
    @classmethod
    def nodes_max_size(cls, v):
        if len(v) > 20:
            raise ValueError("Linked list must have at most 20 nodes for visualization")
        return v


class LinkedListDeleteRequest(BaseModel):
    nodes: List[int]
    value: int


class LinkedListSearchRequest(BaseModel):
    nodes: List[int]
    value: int
