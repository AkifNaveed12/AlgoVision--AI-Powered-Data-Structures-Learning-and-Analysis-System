# AlgoVision Sequence Diagrams

## 1. Practice Problem Submission Sequence

This sequence diagram illustrates the complete flow when a user submits code for a practice problem, including Judge0 compilation and streak updating.

```mermaid
sequenceDiagram
    actor User
    participant Frontend as React Frontend
    participant Backend as FastAPI Backend
    participant Judge0 as Judge0 API
    participant Supabase as Supabase DB

    User->>Frontend: Clicks "Submit Code"
    Frontend->>Backend: POST /practice/submit {code, problem_id}
    
    activate Backend
    Backend->>Supabase: Fetch Expected Output (problem_id)
    Supabase-->>Backend: Returns expected_output & test cases
    
    Backend->>Judge0: POST /submissions?wait=true (code, test cases)
    activate Judge0
    Judge0-->>Backend: Returns compilation status, stdout, exec_time, memory
    deactivate Judge0
    
    Backend->>Backend: Compare stdout with expected_output
    
    %% Background task triggered
    Backend--)Supabase: [Background Task] INSERT INTO practice_attempts
    Backend--)Supabase: [Background Task] Calculate & UPDATE user streaks
    
    Backend-->>Frontend: Returns Success/Fail Status & Metrics
    deactivate Backend
    
    Frontend->>User: Renders Results & Updates Streak Widget
```

## 2. PDF Report Generation Sequence

This sequence diagram shows how off-screen chart rendering is used to generate a comprehensive PDF report.

```mermaid
sequenceDiagram
    actor User
    participant Frontend as React (Reports.jsx)
    participant ChartJS as Canvas API
    participant Backend as FastAPI Backend
    participant Supabase as Supabase DB
    participant ReportLab as PDF Generator

    User->>Frontend: Clicks "Generate & Download"
    
    activate Frontend
    Frontend->>Backend: GET /performance/history & compare
    Backend-->>Frontend: Returns raw performance data
    
    Frontend->>Frontend: Temporarily renders invisible Chart.js graphs
    Frontend->>ChartJS: toBase64Image()
    ChartJS-->>Frontend: Returns base64 PNG strings
    
    Frontend->>Backend: POST /report/generate {chart_images}
    deactivate Frontend
    
    activate Backend
    Backend->>Supabase: Fetch user profile, algorithms, and attempts
    Supabase-->>Backend: Returns aggregated user data
    
    Backend->>ReportLab: Generate PDF layout
    Note right of Backend: Decodes base64 images into BytesIO
    ReportLab->>ReportLab: Embeds Charts, Text, Tables into PDF Buffer
    
    Backend->>Supabase: Upload PDF to Storage & Log into reports table
    Supabase-->>Backend: Returns public download URL
    
    Backend-->>Frontend: Returns download_url
    deactivate Backend
    
    Frontend->>User: Triggers automatic PDF file download
```
