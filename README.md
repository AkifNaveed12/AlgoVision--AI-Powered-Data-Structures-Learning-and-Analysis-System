# AlgoVision
### AI Powered Data Structures Learning & Analysis System

AlgoVision is an interactive learning platform designed to help students understand and experiment with data structures and algorithms through visualization, execution, and performance analysis.

The system allows users to visualize algorithms step-by-step, execute code, analyze time and memory performance, compare data structures, practice problems, and receive assistance from an AI tutor.

---

# Key Features

• Interactive Data Structure Visualization  
• Step-by-Step Algorithm Execution  
• Performance Analysis (Time & Memory)  
• Algorithm Comparison  
• Built-in Code Execution Playground  
• AI Tutor Support using Groq API  
• Practice Problems with Difficulty Levels  
• User Progress Tracking  
• Downloadable Performance Reports  

---

# System Modules

### 1. User Management Module
Handles authentication and authorization including registration, login, logout, and profile management. The module stores user activity and tracks learning progress.

### 2. Data Structure Visualization Module
Provides interactive visualizations of data structures such as arrays, linked lists, stacks, queues, trees, and graphs. Each operation is displayed step-by-step through algorithm animations.

### 3. Algorithm Performance Analysis Module
Measures execution time and memory usage for algorithms and compares different data structures using graphical analysis.

### 4. Code Execution Module
Provides a coding playground where users can write and execute programs to test algorithms and observe outputs.

### 5. AI Tutor Module
Integrates an AI assistant using Groq API that explains algorithms, answers questions, and provides hints for solving problems.

### 6. Practice Problem Module
Provides structured practice questions categorized by difficulty levels to help students improve their problem-solving skills.

### 7. Reporting and Analytics Module
Stores execution results and generates performance reports including graphical visualizations of time and memory usage.

---

# System Architecture

Frontend → React + Tailwind  
Backend → Python FastAPI  
Database → PostgreSQL (Supabase)  
AI Integration → Groq API  
Code Execution → Judge0 API  
Deployment → Streamlit / HuggingFace Spaces

---

# Tech Stack

Frontend
- React.js
- Tailwind CSS
- Chart.js / D3.js

Backend
- Python
- FastAPI

Database
- PostgreSQL (Supabase)

AI
- Groq API

Tools
- Git
- GitHub
- VS Code

---

# Project Structure
# AlgoVision
### AI Powered Data Structures Learning & Analysis System

AlgoVision is an interactive learning platform designed to help students understand and experiment with data structures and algorithms through visualization, execution, and performance analysis.

The system allows users to visualize algorithms step-by-step, execute code, analyze time and memory performance, compare data structures, practice problems, and receive assistance from an AI tutor.

---

# Key Features

• Interactive Data Structure Visualization  
• Step-by-Step Algorithm Execution  
• Performance Analysis (Time & Memory)  
• Algorithm Comparison  
• Built-in Code Execution Playground  
• AI Tutor Support using Groq API  
• Practice Problems with Difficulty Levels  
• User Progress Tracking  
• Downloadable Performance Reports  

---

# System Modules

### 1. User Management Module
Handles authentication and authorization including registration, login, logout, and profile management. The module stores user activity and tracks learning progress.

### 2. Data Structure Visualization Module
Provides interactive visualizations of data structures such as arrays, linked lists, stacks, queues, trees, and graphs. Each operation is displayed step-by-step through algorithm animations.

### 3. Algorithm Performance Analysis Module
Measures execution time and memory usage for algorithms and compares different data structures using graphical analysis.

### 4. Code Execution Module
Provides a coding playground where users can write and execute programs to test algorithms and observe outputs.

### 5. AI Tutor Module
Integrates an AI assistant using Groq API that explains algorithms, answers questions, and provides hints for solving problems.

### 6. Practice Problem Module
Provides structured practice questions categorized by difficulty levels to help students improve their problem-solving skills.

### 7. Reporting and Analytics Module
Stores execution results and generates performance reports including graphical visualizations of time and memory usage.

---

# System Architecture

Frontend → React + Tailwind  
Backend → Python FastAPI  
Database → PostgreSQL (Supabase)  
AI Integration → Groq API  
Code Execution → Judge0 API  
Deployment → Streamlit / HuggingFace Spaces

---

# Tech Stack

Frontend
- React.js
- Tailwind CSS
- Chart.js / D3.js

Backend
- Python
- FastAPI

Database
- PostgreSQL (Supabase)

AI
- Groq API

Tools
- Git
- GitHub
- VS Code

---

# Project Structure
AlgoVision
│
├ backend
├ frontend
├ docs
├ tests
├ requirements.txt
├ .env
└ README.md

---

# Visualization State Format

Example Array State
{
"type": "array",
"elements": [10,20,30],
"highlight": 1,
"operation": "shift"
}

The backend generates visualization states which are returned to the frontend for animation.

---

# Setup Instructions

### Clone Repository
git clone https://github.com/AkifNaveed12/AlgoVision--AI-Powered-Data-Structures-Learning-and-Analysis-System.git

### Create Virtual Environment
python -m venv venv

Activate

Windows

venv\Scripts\activate

### Install dependencies
pip install -r requirements.txt

---

# Environment Variables

Create `.env` file

GROQ_API_KEY=
SUPABASE_URL=
SUPABASE_KEY=


---

# Version Roadmap

### Version 1
Array + Linked List implementation  
Visualization + AI Tutor + Reports

### Version 2
other pending linear data structures

### Version 3
Non-Linear data structures

### version 4
Sorting + Searching Algorithms

### Version 5
Advanced AI Learning System + final polishing

---

# Contributors

Muhammad Akif Naveed  
Arslan Shafiq

---

# License

Educational Project
