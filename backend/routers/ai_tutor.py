from fastapi import APIRouter, Depends, HTTPException
from backend.models.ai_models import AIQueryRequest, AIQueryResponse
from backend.services.supabase_service import get_current_user
from backend.services.groq_service import ask_tutor

router = APIRouter()


@router.post("/query", response_model=AIQueryResponse)
def query(req: AIQueryRequest, current_user=Depends(get_current_user)):
    """Ask the AI Tutor a question (protected). Optionally pass visualization context."""
    context = req.context.model_dump() if req.context else None
    return ask_tutor(req.question, context)
