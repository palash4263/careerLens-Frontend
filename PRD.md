Product Requirements Document (PRD): Career Lens
1. Project Overview
Career Lens is an intelligent, AI-powered Resume Optimization & ATS Auditing SaaS platform. Its mission is to empower job seekers by providing real-time parsability audits, job description compatibility matching, and a state-of-the-art live document customization studio to maximize recruiters' callbacks.

2. Target Audience & Core Use Cases
Job Seekers: Tweak resumes to align with specific target roles, identify missing industry keywords, and repair formatting glitches before submission.
Technical & Professional Candidates: Perform standalone CV structure checks to ensure optimal readability for machine ATS parsers.

3. Core Feature Set (Implemented)
3.1. Main Dashboard
Dynamic Statistics: Interactive circular widgets displaying Total Resumes, Average ATS Score, and Profile Strengths.
Activity Stream: Chronological feed tracking recent scans, document optimizations, and profile configurations.
3.2. Resume Management & Upload Studio
PDF Upload Engine: Dropzone accepting files (max 10MB) with drag-and-drop support, scanning metadata, and executing parsing simulations.
Interactive 3D Resume Mockup:
Displays overlapping template layouts floating in a 3D perspective field.
Shuffles templates (White Modern vs. Dark Executive) and dynamically updates page margins/section spacing sliders on cursor hover.
Translates mouse movements into responsive 3D parallax tilts.
3.3. ATS Match Score Calculator
Multi-Mode Scoring Evaluator:
Saved Job Description Mode: Calculates similarity rate against saved descriptions using cosine similarity with TF-IDF keyword weights.
Custom Paste Mode: Compares resume text directly with pasted requirements text.
Standalone CV Quality Audit: Analyzes the CV’s formatting, section structure, and contact information without requiring a job description.
Actionable Quality Checklist: Diagnostic items reporting missing contact links (email, phone, LinkedIn, GitHub), bullet density, and layout compliance.
3.4. Full-Screen Live Resume Editor
Split-Screen Workspace: Left-hand editor panel for custom section blocks (Header, Summary, Experience, Projects, Skills, Education); right-hand simulated A4 paper sheet.
Real-Time Layout Simulator: Synchronizes all edits instantly into a visual rendering matching template configurations.
Document Formatting Controls:
Template Selector: Toggle between Two-Column and Single-Column layouts.
Brand Color Palette: Primary color picker (Royal Blue, Emerald Teal, Violet, Coral, Sunset Gold, Slate Grey).
Font Family Selector: Premium font dropdown (Outfit, Inter, Roboto, Playfair, etc.).
Page Margins Slider: Toggles narrow (24px), normal (36px), and wide (48px) margins.
Section Spacing Slider: Fine-tunes vertical paragraph gaps across 5 layout density levels.
3.5. High-Fidelity PDF compiler
Reconstructs active resume sections and compiles them into a single-page PDF document matching the exact margins, spacings, colors, names, and templates chosen in the editor.
4. Technical Architecture & Tech Stack
4.1. Technology Stack
Vite & React: High-performance frontend build pipeline.
Framer Motion: Smooth slide animations and spring-based modal overlays.
Three.js & Canvas: Powers 3D elements and background fog shading.
PDF-Lib & JsPDF: Compiles A4 sheets and text fragments directly in-browser.
4.2. Local State Management
Persistent preferences for templates, active colors, margins, fonts, and current edits saved to localStorage to survive router redirects and page reloads.
5. Design & User Experience Guidelines
Color System: Sleek slate/dark-blue background (#020617, #0f172a), emerald accents for green success badges, and violet gradients for primary action buttons.
Layouts: Persistent top navigation bars (hidden during full-screen Live Editor mode for maximum screen estate), dynamic responsive grid break points, and clean glassmorphism dropdown menus.