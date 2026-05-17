# AlgoVision User Flows

This document maps out the core user journeys within AlgoVision.

## 1. Authentication Flow

```mermaid
stateDiagram-v2
    [*] --> LandingPage
    LandingPage --> Login : Returning User
    LandingPage --> Signup : New User
    
    state Signup {
        [*] --> EnterDetails
        EnterDetails --> CreateAccount : Clicks "Sign Up"
        CreateAccount --> EmailConfirm : Auto-confirms via backend
    }
    
    Signup --> Login
    
    state Login {
        [*] --> EnterCredentials
        EnterCredentials --> Authenticate : Validates against Supabase
        Authenticate --> Dashboard : Success
        Authenticate --> ErrorState : Invalid Credentials
        ErrorState --> EnterCredentials
    }
    
    Dashboard --> [*]
```

## 2. Core Learning Journey (Visualizer to Performance)

```mermaid
stateDiagram-v2
    [*] --> Dashboard
    Dashboard --> AlgorithmVisualizer : Selects Data Structure\n(e.g., Binary Search Tree)
    
    state AlgorithmVisualizer {
        [*] --> ConfigInput
        ConfigInput --> PlayAnimation : Clicks "Visualize"
        PlayAnimation --> StepperControls : User pauses/steps through
        StepperControls --> AI_Tutor : "Explain this step"
        AI_Tutor --> StepperControls : Receives Groq AI Explanation
        StepperControls --> FinishAnimation
    }
    
    AlgorithmVisualizer --> Performance : Clicks "View Performance"
    
    state Performance {
        [*] --> ViewHistory : Sees execution time & memory
        ViewHistory --> CompareAlgos : Enters CSV of algorithms
        CompareAlgos --> BarCharts : Renders comparative Bar Charts
    }
    
    Performance --> [*]
```

## 3. Practice & Evaluation Flow

```mermaid
stateDiagram-v2
    [*] --> PracticeDashboard
    
    PracticeDashboard --> SelectProblem : Choose from Easy/Medium/Hard
    SelectProblem --> CodeEditor : Reads problem description
    
    state CodeEditor {
        [*] --> WriteCode
        WriteCode --> RequestHint : Clicks "Get Hint" (AI generated)
        RequestHint --> WriteCode
        WriteCode --> Submit : Clicks "Submit Code"
    }
    
    Submit --> Compilation
    
    state Compilation {
        [*] --> SubprocessAPI
        SubprocessAPI --> Validation : Checks against Expected Output via local python executor
    }
    
    Compilation --> Success : Code matches
    Compilation --> Failure : Compile Error / Wrong Answer
    
    Success --> UpdateStreak : Background Task Updates Profile
    Failure --> CodeEditor : User tries again
    UpdateStreak --> Dashboard : User checks streak widget
```

## 4. Reports Generation Flow

```mermaid
stateDiagram-v2
    [*] --> ReportsDashboard
    
    ReportsDashboard --> FetchList : Loads previous reports
    ReportsDashboard --> GenerateNew : Clicks "Generate & Download"
    
    state GenerateNew {
        [*] --> FetchData : Gets history & compare stats
        FetchData --> RenderHidden : Off-screen Chart.js rendering
        RenderHidden --> CaptureBase64 : Extracts images
        CaptureBase64 --> BackendGenerate : Sends to FastAPI
        BackendGenerate --> ReportLab : Constructs PDF
        ReportLab --> Storage : Uploads to Supabase Storage
    }
    
    GenerateNew --> DownloadPDF : Triggers auto-download
    DownloadPDF --> [*]
```

## Detailed Text Walkthroughs

### **Scenario A: A New Student Learning Linked Lists**
1. **Sign Up**: The user creates an account. They are greeted by the Dashboard.
2. **Visualize**: They navigate to `Data Structures -> Linked List`. They input a series of numbers and click "Insert".
3. **Interactive Step**: The user watches the nodes link together. They don't understand pointers, so they pause the animation and type in the **AI Tutor** chat: *"Why did the 'next' pointer change to node 3?"*. The Groq AI model provides a contextual answer based on the UI state.
4. **Analytics**: After completing the insertion, the system logs the operation. The user goes to the **Performance** tab to see that the Linked List insertion took `O(1)` time at the head, comparing its graph directly with an Array insertion graph.

### **Scenario B: Preparing for Interviews**
1. **Practice Tab**: The user selects an "Easy" array problem.
2. **Coding**: They write a Python solution in the integrated code editor.
3. **Execution**: Clicking submit sends the code to the **Local Python Subprocess Executor**. The code runs safely against hidden test cases natively on the backend server.
4. **Validation & Streak**: It passes! The backend accepts the solution, updates the user's `current_streak` to 5 days, and visually updates the fire icon on their home dashboard.
5. **Reporting**: At the end of the week, the user visits the **Reports** tab and clicks "Generate PDF". The system securely captures the performance charts off-screen and compiles their practice accuracy, performance charts, and history into a downloadable PDF portfolio.
