from fastapi import APIRouter, Depends, HTTPException
from backend.models.compiler_models import ExecuteRequest, ExecuteResponse
from backend.services.supabase_service import get_current_user
from backend.services import judge0_service

router = APIRouter()


@router.post("/execute", response_model=ExecuteResponse)
async def execute(req: ExecuteRequest, current_user=Depends(get_current_user)):
    """Execute code via Judge0 (protected). Supports Python, C++, Java, JS, C."""
    return await judge0_service.execute_code(req.source_code, req.language_id, req.stdin)
