Technical Architecture Document: Career Lens
This document outlines the codebase directory structure, component relationships, state synchronization layers, and data workflows implemented in the Career Lens platform.

1. Directory Structure
Below is the directory map of the Career Lens React-Vite frontend application:
careerlens-frontend/
├── src/
│   ├── assets/                 # Shared CSS files
│   │   ├── AtsScoreCalculator.css
│   │   ├── ats.css
│   │   └── resume.css
│   ├── components/             # Reusable UI elements
│   │   ├── canvas/             # 3D interactive graphics
│   │   │   └── ResumeSaas3DHero.jsx
│   │   └── Navbar.jsx          # Shared navigation bar
│   ├── hooks/                  # Custom React hooks
│   │   └── useScrollReveal.js
│   ├── pages/                  # Main page components (routes)
│   │   ├── AtsPage.jsx         # Standalone resume quality dashboard
│   │   ├── AtsScoreCalculatorPage.jsx
│   │   ├── Dashboard.jsx       # User dashboard
│   │   ├── Login.jsx           # Authentication
│   │   ├── ProfilePage.jsx     # User settings
│   │   ├── ResumeEditorPage.jsx # Full-page live document customizer
│   │   ├── ResumeOptimizationPage.jsx
│   │   ├── ResumePage.jsx      # Upload & file management
│   │   └── TemplatesPage.jsx   # Ready-made layouts list
│   ├── services/               # API service communication layer
│   │   ├── atsService.js
│   │   ├── jobDescriptionService.js
│   │   └── resumeService.js
│   ├── utils/                  # Core client-side processing helpers
│   │   └── pdfGenerator.js     # High-fidelity PDF compilation
│   ├── App.jsx                 # Core routing, navbar toggle logic
│   └── main.jsx                # Application root entry point
├── package.json                # Dependencies and project meta
└── vite.config.js              # Build configurations

2. System Architecture & Data Flows
2.1. ATS Scoring and Matching Pipeline
The diagram below illustrates the match calculation path inside the ATS Score Calculator:

2.2. Live Document Customizer & PDF Compilation Flow
This flowchart details how preferences, text edits, and styles are applied and exported:

3. Services API Layer (Endpoint Bindings)
resumeService.js: Handles file uploads, fetches parsed document lists, deletes resume models, and fetches secure PDF blobs for mock page overlays.
jobDescriptionService.js: Manages saved jobs records, target positions, and requirement details.
atsService.js: Integrates with the backend matching classifier for official ATS scoring and feedback.
4. Local State Persistence System
To prevent loss of layout configurations and optimizations during routing, states are synchronized to localStorage keys:

cl_selected_resume: ID of the currently selected resume.
cl_selected_jd: ID of the target job description.
cl_selected_template: Selected A4 format type (two-column, single-column).
cl_selected_color: Primary accent hex color code.
cl_selected_font: Text typography style.
cl_selected_margins: Margin width level (1, 2, 3).
cl_selected_spacing: Section vertical gap height (1 to 5).
cl_edited_sections: Extracted section text map blocks.