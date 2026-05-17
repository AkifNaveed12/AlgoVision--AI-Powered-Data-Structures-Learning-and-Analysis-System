# AlgoVision System Architecture

This document describes the high-level and low-level architecture of AlgoVision.

## High-Level Architecture

The system follows a standard Client-Server Architecture using modern decoupled tech stacks.

```mermaid
graph TD
    %% Define Nodes
    User[User / Browser]
    Frontend[React + Vite Frontend\n(Tailwind, Chart.js)]
    Backend[FastAPI Backend\n(Python, Uvicorn)]
    SupabaseDB[(Supabase DB\nPostgreSQL + Auth)]
    GroqAI[Groq AI API\n(Llama 3)]
    Judge0[Judge0 API\n(Code Compiler)]

    %% Define Connections
    User -- "Interacts with UI" --> Frontend
    Frontend -- "REST API Calls\n(Axios)" --> Backend
    Backend -- "User Auth & CRUD\n(supabase-py)" --> SupabaseDB
    Backend -- "Context-Aware Prompts\n(groq)" --> GroqAI
    Backend -- "Code Submissions\n(HTTPX)" --> Judge0

    %% Add styling classes
    classDef client fill:#3b82f6,stroke:#1e40af,color:#fff;
    classDef server fill:#10b981,stroke:#047857,color:#fff;
    classDef external fill:#8b5cf6,stroke:#5b21b6,color:#fff;
    classDef db fill:#f59e0b,stroke:#b45309,color:#fff;

    class User client;
    class Frontend client;
    class Backend server;
    class GroqAI external;
    class Judge0 external;
    class SupabaseDB db;
```

## Low-Level Component Architecture

This details the specific internal modules within the FastAPI backend and React frontend.

```mermaid
graph TD
    subgraph Frontend [Frontend Architecture (React)]
        App[App.jsx / Router]
        Pages[Pages: Visualizer, Practice, Performance, Reports]
        Context[Global State & Auth Interceptor]
        VizEngine[Visualization Engine\n(Canvas/DOM)]
        ChartWrapper[Performance Chart\n(Chart.js Off-Screen Render)]
        App --> Pages
        Pages --> Context
        Pages --> VizEngine
        Pages --> ChartWrapper
    end

    subgraph Backend [Backend Architecture (FastAPI)]
        Router[API Routers\n(auth, ai_tutor, practice, report, performance)]
        Services[Business Logic Services]
        SupabaseSVC[Supabase Service\n(Data & Streak Engine)]
        CompilerSVC[Compiler Service\n(Judge0 Comm)]
        ReportSVC[Report Service\n(ReportLab PDF Generator)]
        GroqSVC[Groq Service\n(Prompt Construction)]
        
        Router --> Services
        Services --> SupabaseSVC
        Services --> CompilerSVC
        Services --> ReportSVC
        Services --> GroqSVC
    end

    Frontend -- "HTTP/JSON" --> Router
    SupabaseSVC -.-> |"Async/Def ThreadPool"| Database[(PostgreSQL)]
```
