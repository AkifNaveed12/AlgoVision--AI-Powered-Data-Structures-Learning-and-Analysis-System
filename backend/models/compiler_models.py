from pydantic import BaseModel, field_validator
from typing import Optional

SUPPORTED_LANGUAGES = {71, 54, 62, 63, 50}  # Python3, C++, Java, JS, C

LANGUAGE_NAMES = {
    71: "Python 3",
    54: "C++ (GCC 9.2)",
    62: "Java",
    63: "JavaScript (Node 12)",
    50: "C",
}


class ExecuteRequest(BaseModel):
    source_code: str
    language_id: int
    stdin: str = ""

    @field_validator("language_id")
    @classmethod
    def validate_language(cls, v):
        if v not in SUPPORTED_LANGUAGES:
            raise ValueError(f"Language ID {v} not supported. Supported: {sorted(SUPPORTED_LANGUAGES)}")
        return v

    @field_validator("source_code")
    @classmethod
    def validate_length(cls, v):
        if not v.strip():
            raise ValueError("Source code cannot be empty")
        if len(v) > 10000:
            raise ValueError("Source code too long (max 10,000 characters)")
        return v


class ExecuteResponse(BaseModel):
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    compile_output: Optional[str] = None
    status: str
    time: Optional[str] = None
    memory: Optional[int] = None
