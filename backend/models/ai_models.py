from pydantic import BaseModel, field_validator
from typing import Optional, List


class AIContext(BaseModel):
    current_structure: Optional[str] = None
    current_operation: Optional[str] = None
    current_step: Optional[int] = None


class AIQueryRequest(BaseModel):
    question: str
    context: Optional[AIContext] = None

    @field_validator("question")
    @classmethod
    def sanitize_question(cls, v):
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Question too short (minimum 3 characters)")
        return v[:500]


class AIQueryResponse(BaseModel):
    answer: str
    follow_up_questions: List[str]
