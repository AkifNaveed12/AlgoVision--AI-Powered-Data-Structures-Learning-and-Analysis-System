from pydantic import BaseModel
from typing import Optional, List, Any


class ProblemSummary(BaseModel):
    id: int
    title: str
    difficulty: str
    description: str
    hints: List[Any]


class ProblemDetail(BaseModel):
    id: int
    title: str
    difficulty: str
    description: str
    hints: List[Any]
    language_id: int


class SubmitRequest(BaseModel):
    problem_id: int
    submitted_code: str
    language_id: int = 71


class SubmitResponse(BaseModel):
    status: str
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    execution_time_ms: Optional[float] = None
    memory_usage_kb: Optional[float] = None
    message: str
