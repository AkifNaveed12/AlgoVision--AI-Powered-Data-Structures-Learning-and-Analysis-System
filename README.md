<div align="center">
  <img src="./frontend/public/vite.svg" alt="AlgoVision Logo" width="100"/>
  <h1>AlgoVision</h1>
  <p><strong>AI-Powered Data Structures Learning and Analysis System</strong></p>
</div>

AlgoVision is an advanced, interactive educational platform designed to make learning Data Structures and Algorithms (DSA) intuitive, visual, and highly practical. It combines buttery-smooth visual animations, an integrated sandboxed coding environment, and a context-aware AI Tutor to provide a state-of-the-art learning experience.

---

## 🌟 Key Features

- **Dynamic Visualizer**: Step-by-step animations for Arrays, Linked Lists, Stacks, Queues, Binary Search Trees, AVL Trees, and Graphs.
- **Context-Aware AI Tutor**: Powered by Groq (Llama 3), the AI understands the exact step of the visualization you are looking at and answers your questions pedagogically.
- **Integrated Practice Arena**: Test your skills using our built-in code editor (powered by Monaco). Submissions are compiled and run safely against hidden test cases using the backend's local Python subprocess executor.
- **Gamification & Analytics**: Keep your learning streak alive! View detailed metrics on time/memory complexity, compare algorithms via dynamic charts, and download complete PDF Learning Reports.

---

## 🏗️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Chart.js, Monaco Editor.
- **Backend**: FastAPI (Python), Uvicorn, ReportLab.
- **Database & Auth**: Supabase (PostgreSQL), Row Level Security (RLS).
- **External APIs**: Groq (AI).
- **Code Execution**: Local Python Subprocess.

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Supabase Account
- Groq API Key

### 1. Environment Setup
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
```

### 2. Backend Setup
Navigate to the root directory and activate your virtual environment, then install dependencies:
```bash
cd backend
python -m venv .venv
# Windows: .\.venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

Run the FastAPI backend:
```bash
uvicorn backend.main:app --reload
# Or run the included script: .\start_backend.ps1
```

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```
The application will be running at `http://localhost:5173`.

---

## 📜 Version History & Contributions

This project was built collaboratively in iterative phases. 

### Contributions

- **Akif (Team Lead)**
  - *Roles:* System Design, AI Integration, DB Schema Architecture, Core Business Logics, Final Integrations.
  - *Contributions:* 
    - **Version 1 (MVP)**: Designed the foundational architecture, established the FastAPI and React scaffolding, built the primary database schema, and delivered a complete working MVP.
    - **Version 4 (Final)**: Implemented advanced gamification (Streaks), integrated the Groq AI Tutor, stabilized the system architecture (preventing event loop deadlocks), implemented off-screen Chart.js PDF generation, and brought the platform to a deployment-ready format.

- **Ruman**
  - *Roles:* Compilation Logic, DevOps, Deployment, V1/V3 Integration.
  - *Contributions:* 
    - **Version 2**: Spearheaded the integration of the Python subprocess library for local code compilation. Resolved critical compilation pipeline errors, implemented sorting visualizations, and set up Dockerization, containerization, and CI/CD pipelines.

- **Arslan**
  - *Roles:* V3 Implementations, System Integrations.
  - *Contributions:*
    - **Version 3**: Focused on expanding core system capabilities, integrating V1 and V3 modules, and refining data structure logic execution.

---

## 📂 Documentation

Comprehensive technical documentation is available in the `docs/` directory:
- [**Product Requirements Document (PRD)**](./docs/prd.md)
- [**Database Schema**](./docs/schema.md)
- [**Architecture Diagram**](./docs/diagrams/architecture.md)
- [**Entity Relationship Diagram (ERD)**](./docs/diagrams/erd.md)
- [**Sequence Diagrams**](./docs/diagrams/sequence.md)
- [**User Flows**](./docs/diagrams/userflows.md)
