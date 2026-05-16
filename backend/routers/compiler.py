from fastapi import APIRouter, Depends
from backend.models.compiler_models import ExecuteRequest, ExecuteResponse
from backend.services.supabase_service import get_current_user
from backend.services import compiler_service

router = APIRouter()


@router.post("/execute", response_model=ExecuteResponse)
async def execute(req: ExecuteRequest, current_user=Depends(get_current_user)):
    """Execute code via local subprocess executor (Python, C++, Java, JS, C)."""
    return await compiler_service.execute_code(req.source_code, req.language_id, req.stdin)
