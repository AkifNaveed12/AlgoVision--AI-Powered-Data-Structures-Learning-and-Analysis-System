from pydantic import BaseModel
from typing import Optional


class SavePerformanceRequest(BaseModel):
    algorithm: str
    data_structure: str
    operation: str
    input_size: int
    execution_time_ms: float
    memory_usage_kb: float
    operation_count: int
    input_data: Optional[dict] = None


class RunRecord(BaseModel):
    id: int
    algorithm: str
    data_structure: str
    operation: str
    input_size: int
    execution_time_ms: float
    memory_usage_kb: float
    operation_count: int
    ran_at: str
