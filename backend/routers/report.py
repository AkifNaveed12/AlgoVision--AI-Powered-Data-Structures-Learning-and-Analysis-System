import os
import tempfile
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from backend.services.supabase_service import (
    get_current_user, get_user_profile, get_algorithm_runs,
    get_user_attempts, save_report, get_reports, get_report_by_id
)
from backend.services.report_service import generate_full_report
from pydantic import BaseModel
from typing import Optional, List

class ReportRequest(BaseModel):
    chart_images: Optional[List[str]] = []

router = APIRouter()

# Reports are saved in a temp directory during the session
REPORTS_DIR = os.path.join(tempfile.gettempdir(), "algovision_reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


@router.post("/generate")
def generate_report(req: Optional[ReportRequest] = None, current_user=Depends(get_current_user)):
    """Generate a PDF report for the current user."""
    user_id = str(current_user.id)

    # Gather data
    profile = get_user_profile(user_id)
    runs = get_algorithm_runs(user_id)
    attempts = get_user_attempts(user_id)

    user_data = {
        "email": current_user.email,
        "full_name": profile.get("full_name", ""),
    }

    charts = req.chart_images if req and req.chart_images else []

    # Generate PDF bytes
    pdf_bytes = generate_full_report(user_data, runs, attempts, charts)

    # Save to disk
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"report_{user_id[:8]}_{timestamp}.pdf"
    filepath = os.path.join(REPORTS_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(pdf_bytes)

    # Save record to DB
    record = save_report(user_id, filepath, "full")
    report_id = record.get("id")

    return {
        "report_id": report_id,
        "download_url": f"/report/download/{report_id}",
        "message": "Report generated successfully",
    }


@router.get("/download/{report_id}")
def download_report(report_id: int, current_user=Depends(get_current_user)):
    """Download a specific PDF report (protected — only own reports)."""
    record = get_report_by_id(report_id)
    if not record:
        raise HTTPException(status_code=404, detail="Report not found")

    # Verify ownership
    if record.get("user_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    filepath = record.get("report_file")
    if not filepath or not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Report file not found on server. Please regenerate.")

    return FileResponse(
        path=filepath,
        media_type="application/pdf",
        filename=f"AlgoVision_Report_{report_id}.pdf",
        headers={"Content-Disposition": f"attachment; filename=AlgoVision_Report_{report_id}.pdf"},
    )


@router.get("/list")
def list_reports(current_user=Depends(get_current_user)):
    """List all reports for the current user."""
    reports = get_reports(str(current_user.id))
    return {"reports": reports}
