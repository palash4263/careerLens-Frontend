// src/services/claudeService.js
// Calls the backend's unified Claude AI endpoint (POST /ai/generate) for all AI features.
// The Anthropic API key lives server-side only — never exposed to the browser.
// Exports mirror groqService.js 1:1 so pages can switch by changing only the import path.
import api from "../api/axiosConfig";

async function callClaude(task, params) {
  const res = await api.post("/ai/generate", { task, params });
  return res?.data?.result;
}

export async function extractKeywordsFromJD(jobDescription) {
  if (!jobDescription || !jobDescription.trim()) return [];
  try {
    const result = await callClaude("extract_keywords_from_jd", { jobDescription });
    return Array.isArray(result) ? result : [];
  } catch (e) {
    console.warn("extractKeywordsFromJD failed, continuing without gap analysis:", e);
    return [];
  }
}

function findMissingKeywords(jdKeywords = [], sectionText = '') {
  const lowerText = sectionText.toLowerCase();
  return jdKeywords.filter(kw => kw && !lowerText.includes(kw.toLowerCase()));
}

export async function groqOptimizeSection(sectionName, sectionText, jobDescription = '', customPrompt = '', jdKeywords = null) {
  const keywords = Array.isArray(jdKeywords) ? jdKeywords : await extractKeywordsFromJD(jobDescription);
  const missing = findMissingKeywords(keywords, sectionText);

  const result = await callClaude("optimize_section", {
    sectionName, sectionText, jobDescription, customPrompt, jdKeywords: missing,
  });
  if (!result) throw new Error("Claude optimization failed to return content.");
  return result;
}

export async function groqOptimizeSectionsBatch(sections, jobDescription = '') {
  const jdKeywords = jobDescription ? await extractKeywordsFromJD(jobDescription) : [];

  const results = [];
  for (const section of sections) {
    const optimizedText = await groqOptimizeSection(
      section.sectionName,
      section.sectionText,
      jobDescription,
      section.customPrompt || '',
      jdKeywords
    );
    results.push({ sectionName: section.sectionName, optimizedText });
  }
  return results;
}

export async function generateAiSummary(title = 'Software Engineer', name = 'Candidate', customPrompt = '') {
  try {
    const result = await callClaude("summary", { title, name, customPrompt });
    if (result) return result.replace(/^["']|["']$/g, '');
  } catch (e) {
    console.warn('Claude summary generation failed, using fallback:', e);
  }
  return `Results-oriented ${title} with a strong foundation in modern software development, problem-solving, and cross-functional collaboration. Dedicated to shipping high-quality, scalable code that drives business impact and user satisfaction.`;
}

export async function generateAiExperienceBullets(role = 'Software Engineer', company = 'Tech Corp', existingBullets = [], customPrompt = '') {
  try {
    const result = await callClaude("experience_bullets", { role, company, existingBullets: existingBullets.filter(Boolean), customPrompt });
    if (Array.isArray(result) && result.length > 0) return result.slice(0, 3);
  } catch (e) {
    console.warn('Claude experience bullets generation failed, using fallback:', e);
  }
  return [
    `Architected high-concurrency microservices at ${company}, reducing P99 latency by 45% under peak traffic.`,
    `Pioneered automated CI/CD deployment pipelines, cutting release cycles from 3 days to 15 minutes.`,
    `Led cross-functional sprint teams of 6 engineers to deliver core platform capabilities with 99.9% uptime.`
  ];
}

export async function generateAiSkills(title = 'Software Engineer', customPrompt = '') {
  try {
    const result = await callClaude("skills", { title, customPrompt });
    if (Array.isArray(result) && result.length > 0) return result;
  } catch (e) {
    console.warn('Claude skills generation failed, using fallback:', e);
  }
  const roleLower = title.toLowerCase();
  if (roleLower.includes('frontend') || roleLower.includes('react')) {
    return ["React.js", "TypeScript", "JavaScript (ES6+)", "HTML5 & CSS3", "Tailwind CSS", "Redux Toolkit", "REST APIs", "Jest & RTL", "Git & GitHub", "Responsive Design"];
  }
  if (roleLower.includes('backend') || roleLower.includes('node') || roleLower.includes('java') || roleLower.includes('python')) {
    return ["Node.js", "Express.js", "Python", "Java", "PostgreSQL", "MongoDB", "Redis", "Docker", "RESTful APIs", "System Architecture"];
  }
  return ["JavaScript", "React", "Node.js", "SQL", "Git", "REST APIs", "Problem Solving", "Agile Methodologies", "System Design", "Communication"];
}

export async function generateAiProject(title = 'Software Engineer', index = 0, existingNames = [], customPrompt = '') {
  const existingStr = existingNames.filter(Boolean).join(', ');
  try {
    const result = await callClaude("project_idea", { title, index, existingNames: existingNames.filter(Boolean), customPrompt });
    if (result?.name && result?.description) return result;
  } catch (e) {
    console.warn('Claude project generation failed, using fallback:', e);
  }

  const sampleProjects = [
    {
      name: "AI Career Intelligence & Resume Platform",
      url: "github.com/user/career-intelligence-ai",
      description: "Built a full-stack career analytics platform featuring real-time resume parsing, ATS score computation, and automated AI interview prep recommendations.",
      tech: "React, Node.js, PostgreSQL, Tailwind CSS"
    },
    {
      name: "High-Throughput E-Commerce Microservices Engine",
      url: "github.com/user/microservices-commerce-engine",
      description: "Architected a decoupled microservices backend using Express and Redis, handling 15,000+ concurrent requests/sec with sub-50ms API latency.",
      tech: "Node.js, Express, Redis, Docker, RabbitMQ, PostgreSQL"
    },
    {
      name: "Real-Time Collaborative Code Editor & Sandbox",
      url: "github.com/user/collaborative-code-sandbox",
      description: "Developed a WebSockets-powered live multi-user IDE with multi-language code execution engine, Monaco editor integration, and operational transformation.",
      tech: "React, TypeScript, WebSockets, Docker, Monaco Editor"
    },
  ];
  void existingStr;
  const idx = index % sampleProjects.length;
  return sampleProjects[idx];
}

export async function generateAiProjectBullets(projectName = 'Project', tech = '', existingBullets = [], customPrompt = '') {
  try {
    const result = await callClaude("project_bullets_short", { projectName, tech, existingBullets: existingBullets.filter(Boolean), customPrompt });
    if (Array.isArray(result) && result.length > 0) return result.slice(0, 3);
  } catch (e) {
    console.warn('Claude project bullets generation failed, using fallback:', e);
  }
  const techList = tech ? tech.split(',').map(t => t.trim()).filter(Boolean) : [];
  const primaryTech = techList[0] || 'modern web technologies';
  return [
    `Architected "${projectName}" using ${primaryTech}, achieving sub-100ms response times under simulated peak load.`,
    `Implemented core functionality for ${projectName}, improving reliability and reducing manual overhead by 35%.`,
    `Optimized performance and scalability of ${projectName}, cutting resource usage by 30% through targeted refactoring.`,
  ];
}

export async function generateAiEducation(title = 'Software Engineer') {
  try {
    const result = await callClaude("education", { title });
    if (result?.school && result?.degree) return result;
  } catch (e) {
    console.warn('Claude education generation failed, using fallback:', e);
  }
  return {
    school: "Institute of Technology & Science",
    degree: "Bachelor of Technology (B.Tech)",
    field: "Computer Science & Engineering",
    startYear: "2018",
    endYear: "2022",
    gpa: "3.8 / 4.0 (First Class with Distinction)"
  };
}

export async function generateAiPersonal(title = 'Full Stack Engineer', currentName = 'Palash Mishra') {
  try {
    const result = await callClaude("personal", { title, currentName });
    if (result?.title || result?.location || result?.name) return result;
  } catch (e) {
    console.warn('Claude personal generation failed, using fallback:', e);
  }
  const handleSlug = (currentName && currentName !== 'Candidate Name' ? currentName : "user").toLowerCase().replace(/\s+/g, "");
  const nameVal = (currentName && currentName !== 'Candidate Name') ? currentName : "Candidate Name";
  return {
    name: nameVal,
    title,
    email: `${handleSlug}@email.com`,
    phone: "+91 98765 43210",
    location: "Mumbai, India",
    linkedin: `linkedin.com/in/${handleSlug}`,
    portfolio: `github.com/${handleSlug}`,
  };
}

export async function groqSuggestJobMatches(resumeName, title = 'Software Engineer') {
  try {
    const result = await callClaude("job_match", { resumeName, title });
    if (result?.title || result?.skills) return result;
  } catch (e) {
    console.warn("Claude job suggestion error, returning fallbacks:", e);
  }
  return {
    title: title || "Software Engineer",
    skills: ["React.js", "Node.js", "JavaScript", "SQL", "Git", "REST APIs"],
    roles: ["Frontend Developer", "Full Stack Engineer", "React Developer", "Software Engineer"]
  };
}

export async function extractSkillsFromResume(resumeText) {
  try {
    const result = await callClaude("extract_skills_from_resume", { resumeText });
    return Array.isArray(result) ? result : [];
  } catch (e) {
    console.error("Failed to extract skills via Claude:", e);
    return [];
  }
}

export async function generateProjectBulletsWithClaude(projectName = 'Project', tech = '', existingBullets = [], customPrompt = '') {
  try {
    const result = await callClaude("project_bullets", {
      projectName, tech, existingBullets: existingBullets.filter(Boolean), customPrompt,
      instruction: "Generate 5 unique, high-impact resume bullet points. Do NOT mention the project name in any bullet. Focus on technical achievements, metrics, and impact. Start each bullet with a strong action verb."
    });
    if (Array.isArray(result) && result.length > 0) return result.slice(0, 5);
  } catch (e) {
    console.warn('Claude project bullets generation failed, using fallback:', e);
  }
  const techList = tech ? tech.split(',').map(t => t.trim()).filter(Boolean) : [];
  const primaryTech = techList[0] || 'modern web technologies';
  return [
    `Architected scalable backend using ${primaryTech}, achieving sub-100ms response times.`,
    `Implemented core features with optimized algorithms, improving reliability and reducing manual overhead by 35%.`,
    `Optimized performance and database queries, cutting resource usage by 30% through targeted refactoring.`,
    `Designed microservices architecture supporting 10,000+ concurrent operations.`,
    `Deployed with automated CI/CD pipeline and monitoring, reducing release time from hours to minutes.`
  ];
}

export async function generateSkillRoadmap(skill, resumeContext = "") {
  const result = await callClaude("skill_roadmap", { skill, resumeContext: resumeContext.substring(0, 500) });
  if (!result) throw new Error("Failed to generate roadmap from Claude.");
  return result;
}

export async function generateAiCoverLetter(resumeText, jobDescription) {
  const result = await callClaude("cover_letter", { resumeText, jobDescription });
  if (!result) throw new Error("Failed to generate cover letter from Claude.");
  return result;
}

export async function extractJobFromUrl(url) {
  const result = await callClaude("extract_job_from_url", { url });
  if (!result) throw new Error("Failed to extract job details from the provided URL.");
  return result;
}
