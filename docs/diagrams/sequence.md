# AlgoVision Sequence Diagrams

## 1. Practice Problem Submission Sequence

This sequence diagram illustrates the complete flow when a user submits code for a practice problem, including local compilation and streak updating.

```mermaid
sequenceDiagram
    actor User
    participant Frontend as React Frontend
    participant Backend as FastAPI Backend
    participant Compiler as Python Subprocess
    participant Supabase as Supabase DB

    User->>Frontend: Clicks "Submit Code"
    Frontend->>Backend: POST /practice/submit {code, problem_id}
    
    activate Backend
    Backend->>Supabase: Fetch Expected Output (problem_id)
    Supabase-->>Backend: Returns expected_output & test cases
    
    Backend->>Compiler: Execute python code with input (stdin)
    activate Compiler
    Compiler-->>Backend: Returns stdout, stderr, execution time, memory
    deactivate Compiler
    
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

## 3. Authentication Flow (Signup & Login)

```mermaid
sequenceDiagram
    actor User
    participant Frontend as React Frontend
    participant Backend as FastAPI Backend
    participant Auth as Supabase GoTrue Auth
    participant DB as Supabase PostgreSQL

    User->>Frontend: Submits Signup Form (Email, Password, Name)
    Frontend->>Backend: POST /auth/signup
    activate Backend
    Backend->>Auth: admin.create_user()
    Auth-->>Backend: Returns user UUID
    Backend->>DB: UPDATE users SET full_name = name WHERE id = uuid
    Backend-->>Frontend: Returns success message
    deactivate Backend

    User->>Frontend: Submits Login Form (Email, Password)
    Frontend->>Backend: POST /auth/login
    activate Backend
    Backend->>Auth: sign_in_with_password()
    Auth-->>Backend: Returns JWT Access Token
    Backend->>DB: Fetch user profile data (Streaks)
    DB-->>Backend: Returns profile data
    Backend-->>Frontend: Returns JWT Token & Profile Data
    deactivate Backend
    
    Frontend->>Frontend: Stores JWT in LocalStorage
    Frontend->>User: Redirects to Dashboard
```

## 4. AI Tutor Query Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend as React Frontend
    participant Backend as FastAPI Backend
    participant Groq as Groq AI (Llama 3)

    User->>Frontend: Pauses animation & asks question
    Frontend->>Frontend: Captures current Data Structure State
    Frontend->>Backend: POST /ai/query {question, context}
    
    activate Backend
    Backend->>Backend: Constructs prompt combining user question & state context
    Backend->>Groq: Sends Chat Completion Request
    activate Groq
    Groq-->>Backend: Returns AI Pedagogical Response
    deactivate Groq
    
    Backend-->>Frontend: Returns Explanation String
    deactivate Backend
    
    Frontend->>User: Displays response in Tutor Chatbox
```

## 5. Algorithm Visualization & Performance Logging Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Visualization Engine
    participant Backend as FastAPI Backend
    participant Supabase as Supabase DB

    User->>Frontend: Configures array size and speed
    User->>Frontend: Clicks "Sort" (e.g., Quick Sort)
    
    activate Frontend
    Frontend->>Frontend: Computes atomic steps & tracks comparisons
    Frontend->>User: Plays animated sorting algorithm
    
    Frontend->>Backend: POST /performance/save {algorithm, ops, memory, time}
    deactivate Frontend
    
    activate Backend
    Backend->>Supabase: INSERT INTO algorithm_runs
    Supabase-->>Backend: Returns Success
    Backend-->>Frontend: Returns HTTP 200 OK
    deactivate Backend
```
