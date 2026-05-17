# AlgoVision Product Requirements Document (PRD)

## 1. Product Overview
**AlgoVision** is an AI-powered interactive learning platform designed to help computer science students, educators, and software engineers understand complex Data Structures and Algorithms (DSA) through dynamic visualizations, real-time performance analytics, integrated code practice, and context-aware AI tutoring.

## 2. Target Audience
- **Students**: Learning DSA for university courses and needing visual aids.
- **Job Seekers**: Practicing algorithmic problem solving for technical interviews.
- **Educators**: Utilizing visualizations to demonstrate concepts in classrooms.

## 3. Key Objectives & Success Metrics
- **Visual Clarity**: Deliver buttery-smooth, step-by-step animations for core data structures.
- **Practical Application**: Bridge the gap between visual understanding and code implementation through the integrated compiler.
- **Engagement**: Increase user retention through gamification (Streaks) and progress tracking (PDF Reports).

---

## 4. Functional Requirements

### 4.1. Core Visualizer
- **Supported Data Structures**: Arrays, Linked Lists, Stacks, Queues, Binary Search Trees (BST), AVL Trees, and Graphs.
- **Operations**: Search, Insert, Delete, Traverse, Sort.
- **Controls**: Play, Pause, Step Forward, Step Backward, Reset.
- **Code Sync**: The UI must highlight the exact pseudo-code line matching the current animation step.

### 4.2. Context-Aware AI Tutor (Groq / Llama 3)
- Users can ask natural language questions at any point during an animation.
- The system must capture the **current visualization state** (e.g., "Node 5 is comparing with Node 10") and send it as context to the AI.
- AI responses must be strictly pedagogical, guiding the user rather than just giving the final answer.

### 4.3. Code Practice & Compilation (Judge0)
- Users must be able to select problems based on difficulty (Easy, Medium, Hard).
- Integrated Monaco/CodeMirror editor supporting Python (and other future languages).
- Submissions are evaluated against hidden test cases using the remote Judge0 compiler API.
- Execution time, memory footprint, and standard output are returned to the user.

### 4.4. Analytics & Reporting
- **Performance Tab**: Records execution metrics (time, memory, operation steps) for every visualizer run.
- **Comparison**: Generates comparative Bar Charts to juxtapose the efficiency of different algorithms (e.g., Array Insert vs. Linked List Insert).
- **PDF Generation**: Users can download a comprehensive PDF containing their history, charts, and metrics via the ReportLab integration.

### 4.5. Authentication & Gamification
- **User Accounts**: JWT-based Authentication managed via Supabase.
- **Daily Streaks**: System tracks consecutive days of practice submissions. The UI displays the current streak and the longest historical streak.

---

## 5. Non-Functional Requirements (NFRs)

### 5.1. Performance
- **Latency**: UI interactions and animation steps must render at 60 FPS.
- **API Response Time**: Non-compilation backend API endpoints must respond in < 200ms.
- **Concurrency**: The FastAPI backend must offload heavy I/O tasks (like compiler polling and PDF generation) to background threads to prevent event loop blocking.

### 5.2. Scalability
- **Stateless Backend**: The FastAPI server must be entirely stateless, storing all sessions via JWTs and databases via Supabase, allowing horizontal scaling across Docker containers.

### 5.3. Security
- **Row Level Security (RLS)**: Supabase PostgreSQL tables must strictly enforce RLS policies preventing users from fetching or mutating data that does not belong to their `auth.uid()`.
- **Code Execution**: User-submitted code must be sandboxed via Judge0. No code is executed on the native FastAPI host.
- **Secret Management**: API keys (Groq, Judge0, Supabase) must be securely injected via `.env` files.

### 5.4. Usability
- The UI must be fully responsive, heavily utilizing modern Tailwind CSS design aesthetics (Dark Mode, Glassmorphism, smooth CSS transitions).

---

## 6. Future Considerations (Post-MVP)
- **Multiplayer Mode**: Collaborative coding environments for pair programming.
- **Expanded Languages**: Full support for Java, C++, and JavaScript in the practice compiler.
- **Custom Visualizations**: Allowing users to write code that generates custom canvas animations.
