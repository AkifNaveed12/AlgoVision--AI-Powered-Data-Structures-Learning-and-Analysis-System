from pydantic import BaseModel, field_validator
from typing import Optional, List


class ArrayInsertRequest(BaseModel):
    array: List[int]
    index: int
    value: int

    @field_validator("array")
    @classmethod
    def array_max_size(cls, v):
        if len(v) > 50:
            raise ValueError("Array must have at most 50 elements for visualization")
        return v


class ArrayDeleteRequest(BaseModel):
    array: List[int]
    index: int


class ArraySearchRequest(BaseModel):
    array: List[int]
    value: int


class PerformanceMetrics(BaseModel):
    execution_time_ms: float
    memory_usage_kb: float
    operation_count: int


class VisualizationResponse(BaseModel):
    states: List[dict]
    performance: PerformanceMetrics
    found: Optional[bool] = None
    index: Optional[int] = None
    result_node: Optional[int] = None
