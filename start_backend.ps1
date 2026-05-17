# Move to the root directory just in case the user runs it from somewhere else
$ScriptPath = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location -Path $ScriptPath

Write-Host "Activating Virtual Environment..." -ForegroundColor Green
if (Test-Path ".\.venv\Scripts\activate.ps1") {
    . ".\.venv\Scripts\activate.ps1"
} else {
    Write-Host "Warning: Virtual environment not found at .venv" -ForegroundColor Yellow
}

Write-Host "Starting FastAPI Backend..." -ForegroundColor Blue
uvicorn backend.main:app --reload
