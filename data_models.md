Data Models Specification: Career Lens
This document outlines the data schemas, object shapes, and payload structures passed between components, local storage state synchronize buffers, and API services.

1. Resume Entity Schema
Represents a candidate's uploaded resume document.
{
  "id": 102,
  "file_name": "Palash_Mishra_Backend_Dev.pdf",
  "file_path": "/uploads/resumes/Palash_Mishra_Backend_Dev_1710502930.pdf",
  "extracted_text": "PALASH MISHRA\nSoftware Developer...\nSummary:\nResults-driven Java-based backend developer...",
  "uploaded_at": "2026-07-17T17:30:00.000Z",
  "views": 4,
  "atsScore": 88
}
Property Dictionary
id (Number/String): Unique identifier.
file_name (String): Original uploaded PDF document title.
extracted_text (String): Raw text extracted by the PDF reader parser, containing line-breaks (\n) separating headers and bullet content. Used directly by matching algorithms.
views (Number): Document access tracker.
atsScore (Number): Historical calculated ATS score.
2. Job Description (JD) Entity Schema
Represents the target role requirements utilized for comparative keyword and matching checks.
{
  "id": 15,
  "title": "Backend Software Engineer",
  "company": "Oracle India",
  "description": "We are seeking a Backend Developer with 2+ years of experience in Java, Spring Boot, Microservices, and SQL databases...",
  "created_at": "2026-07-15T09:00:00.000Z"
}
2. Job Description (JD) Entity Schema
Represents the target role requirements utilized for comparative keyword and matching checks.
{
  "id": 15,
  "title": "Backend Software Engineer",
  "company": "Oracle India",
  "description": "We are seeking a Backend Developer with 2+ years of experience in Java, Spring Boot, Microservices, and SQL databases...",
  "created_at": "2026-07-15T09:00:00.000Z"
}
3. ATS Analysis Score Result Schema
Output schema produced by both the backend API analyzer and local heuristic calculators.
{
  "score": 82,
  "grade": "B+",
  "gradeClass": "good",
  "keywordMatchRate": 65,
  "formattingScore": 90,
  "structureScore": 85,
  "foundKeywords": ["JAVA", "SPRING BOOT", "SQL", "REACT", "GIT"],
  "missingKeywords": ["MICROSERVICES", "DOCKER", "KUBERNETES"],
  "recs": [
    "Quantitative Metrics: Quantify achievements. Include percentages or time metrics to prove your results.",
    "Online Footprint: Include your professional LinkedIn profile URL."
  ],
  "checklist": [
    { 
      "label": "Email Contact Info", 
      "passed": true, 
      "desc": "Email header parsed successfully." 
    },
    { 
      "label": "Experience Section", 
      "passed": true, 
      "desc": "Found professional work experience timeline." 
    },
    { 
      "label": "ATS File Format", 
      "passed": true, 
      "desc": "Document uploaded as PDF." 
    }
  ],
  "source": "heuristic",
  "sourceLabel": "Standalone CV Format & Quality Audit"
}
4. Live Editor Sections State Map (editedSections)
A flat key-value dictionary representing parsed resume blocks. This structure is synced real-time to localStorage under cl_edited_sections and used to compile raw strings back into A4 compiler layouts.
{
  "Header": "Palash Fullstack\n+917428477219 | palashmishra47@gmail.com | linkedin.com/in/palash-mishra",
  "Summary": "Results-driven Java-based backend developer with 2+ years of experience in designing and developing scalable applications...",
  "Experience": "• NexGen Technologies Oct 2025 - Present\nBackend Developer Noida, Uttar Pradesh\n• Developed and optimized RESTful APIs...",
  "Projects": "• SaaS CareerLens AI Resume Auditor Project\n• Built high-performance responsive layout simulator...",
  "Skills": "Java, Spring Boot, React.js, JavaScript, SQL, AWS, Docker, Git",
  "Education": "Bachelor of Technology in Computer Science\nGraduation: 2025",
  "Certifications": "• Oracle Certified Associate, Java Programmer\n• AWS Certified Cloud Practitioner",
  "Languages": "English (Professional), Hindi (Native)"
}