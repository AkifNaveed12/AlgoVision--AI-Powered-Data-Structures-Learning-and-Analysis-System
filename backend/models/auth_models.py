from pydantic import BaseModel, EmailStr
from typing import Optional


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    current_streak: Optional[int] = 0
    longest_streak: Optional[int] = 0
    last_active_date: Optional[str] = None
    created_at: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
