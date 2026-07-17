I have created the Design System Specification Document (design.md) in your workspace!

You can view the full design guide here: 📂 
design.md

🎨 Key Sections Included:
Visual Theme & Concept: Breakdown of the Neo-Dark Cyber-Professional SaaS aesthetic.
Core & Accent Color Palettes: Specifications for primary layouts, alert indicators, and print-safe A4 document theme swatches.
Typography System: Rules for Outfit, Inter, and Roboto font imports.
Glassmorphism specs: Exact parameters used for blur backdrops (backdrop-filter), card outlines, and dropshadow depths.
Physics & Micro-Animations: Transition properties for the 3D cursor tracking, cards shuffling, and spacing transition curves.

Design System Specification Document: Career Lens
This document describes the design tokens, visual guidelines, layout styles, and interactive micro-animations that comprise the Career Lens UI.

1. Visual Theme & Philosophy
Career Lens employs a Neo-Dark Cyber-Professional aesthetic. It balances a high-contrast dark workspace (reducing eye strain for developer profiles) with premium glassmorphism overlays and vibrant neon accents to highlight critical ATS scoring insights.

2. Color Palette System
2.1. Interface Dark Theme Colors
Primary Page BG: #020617 (Deep Midnight Slate)
Secondary Card BG: #0f172a / #171426 (Slate Card Panel)
Borders & Rules: rgba(255, 255, 255, 0.06) (Subtle semi-transparent lines)
Text Primary: #f8fafc / #ffffff (High-contrast text)
Text Secondary: #94a3b8 / #cbd5e1 (Slate grey helper captions)
2.2. Functional Highlight Tokens
Success Accent (Green): #10b981 (Matched skills, High parsability badges)
Warning Accent (Amber): #fbbf24 (Missing skills alerts)
Error Accent (Red): #ef4444 (Critical format parser conflicts)
Interactive Primary Accent: #7c3aed to #4f46e5 (Violet-to-Indigo brand gradient)
2.3. Resume Document Palettes (Print-Safe Layout Accents)
Royal Blue: #1761c7 (Corporate executive standard)
Emerald Teal: #0f9f74 (Clean modern technical look)
Ruby Red: #d32f2f (Bold design profile accent)
Amber Gold: #d4af37 (Creative/marketing standard)
Coral Orange: #ff6b6b (Startup/advertising style)
Charcoal Slate: #475569 (Minimalist monochrome layout)
3. Typography Hierarchy
Brand / Headings: 'Outfit', sans-serif (Elegant, geometrical rounded curves for modern headings)
Body Copy / Text Areas: 'Inter', sans-serif (Maximum readability and clean kerning metrics)
Code / Technical logs: 'Fira Code', monospace (Fixed width, utilized for parser details)
4. Glassmorphism & Layout Specifications
All primary modal panels and setup dropdown overlays use clean glassmorphism properties to maintain layout depth:

Background Blur: backdrop-filter: blur(16px)
Semi-Transparent Backdrop: background: rgba(15, 23, 42, 0.85)
Edge Outline: border: 1px solid rgba(255, 255, 255, 0.08)
Drop Shadow: box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25)
5. Motion, Physics & Micro-Animations
5.1. 3D Parallax Mouse Tracking
The interactive document cards track mouse pointer movements on hover. Normalized client coordinates translate to responsive 3D rotations:

javascript

transform: rotateX(coords.y * -20deg) rotateY(coords.x * 20deg)
5.2. Card Deck Shuffling (Morph Fades)
Overlapping documents swap layout depth, opacity, and scale settings when hovered:

White Card (Front -> Back): Morph from opacity: 1; translateZ(120px) to opacity: 0; translateZ(40px) scale(0.95).
Dark Card (Back -> Front): Morph from opacity: 0; translateZ(40px) scale(0.95) to opacity: 1; translateZ(120px).
5.3. Layout Simulator Transition Gaps
The A4 canvas simulator uses transition curves (transition: all 0.3s ease-out) to animate padding modifications and gap shifts smoothly when tweaking margin/spacing ranges.