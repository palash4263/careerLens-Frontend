// src/services/groqService.js
// Calls Groq's API directly or via backend proxy for AI features
import api from "../api/axiosConfig";

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL   = 'llama-3.3-70b-versatile'; // fast and high quality

/**
 * Build a tight, section-aware system prompt so the model knows
 * exactly what format to return.
 */
function buildSystemPrompt(sectionName) {
  const baseRules = `
You are an elite resume coach specializing in ATS optimization and FAANG-style resumes.
Your ONLY task is to rewrite the provided resume section.

CRITICAL FORMATTING RULES:
- Output ONLY the improved section text. No preamble, no explanations, no markdown headers.
- Use • as the bullet character for all bullet points.
- Keep each bullet to ONE crisp line (under 110 characters).
- Start every bullet with a strong action verb (Architected, Built, Optimized, Engineered…).
- Add quantified metrics where they are missing (e.g., "reducing latency by 40%", "supporting 10K+ users").
- Preserve ALL company names, dates, project names, and tech stack mentions exactly as given.
- Do NOT invent new experiences or projects that weren't in the original text.
`.trim();

  const sectionRules = {
    Summary: `
Additional rules for Summary:
- Write 2-3 tight sentences in flowing prose (no bullets).
- Lead with seniority + domain + key tech stack.
- End with a value proposition (what you deliver for the company).
`.trim(),
    Experience: `
Additional rules for Experience:
- Preserve the company name + date header lines exactly.
- Each bullet must follow: Action verb + what + result/metric.
`.trim(),
    Projects: `
Additional rules for Projects:
- Preserve the project name | tech stack | date header lines exactly.
- Each bullet: what you built + how + measurable outcome.
`.trim(),
    Skills: `
Additional rules for Skills:
- Output as categorized lines: "Category: skill1, skill2, skill3"
- Categories: Languages, Frameworks & Libraries, Cloud & DevOps, Tools & Databases
- Add any keywords from the job description that are relevant but missing.
`.trim(),
    Education: `
Additional rules for Education:
- Preserve institution name, degree, and dates.
- Only add CGPA or honours if already present.
`.trim(),
  };

  return `${baseRules}\n\n${sectionRules[sectionName] || ''}`;
}

/**
 * Call Groq to rewrite a single resume section.
 * @param {string} sectionName  - e.g. "Experience"
 * @param {string} sectionText  - current text of the section
 * @param {string} jobDescription - the JD text for keyword alignment
 * @param {string} customPrompt   - optional user instruction
 * @returns {Promise<string>} optimized section text
 */
export async function groqOptimizeSection(sectionName, sectionText, jobDescription = '', customPrompt = '') {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('VITE_GROQ_API_KEY is not set in your .env file');

  const userMessage = [
    `Section: ${sectionName}`,
    '',
    '--- CURRENT SECTION TEXT ---',
    sectionText.trim(),
    '',
    jobDescription ? `--- TARGET JOB DESCRIPTION (align keywords) ---\n${jobDescription.trim()}` : '',
    customPrompt ? `--- USER INSTRUCTION ---\n${customPrompt.trim()}` : '',
  ].filter(Boolean).join('\n');

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt(sectionName) },
        { role: 'user',   content: userMessage },
      ],
      temperature: 0.45,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Groq API error ${response.status}: ${err?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

/**
 * AI Summary Generator for Resume Builder
 */
export async function generateAiSummary(title = 'Software Engineer', name = 'Candidate') {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("groq_api_key");

  const systemPrompt = "You are a top-tier executive resume writer. Generate a 2-3 sentence impactful, ATS-optimized professional summary for a candidate. Focus on strong action verbs, technical skills, and quantitative business impact. Output ONLY the summary text, no quotes or intro.";
  const userPrompt = `Target Role / Title: ${title}, Candidate Name: ${name}`;

  if (apiKey) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.65, max_tokens: 350,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const res = data.choices?.[0]?.message?.content?.trim();
        if (res) return res.replace(/^["']|["']$/g, '');
      }
    } catch (e) {
      console.warn('Direct Groq API fetch error:', e);
    }
  }

  // Try Backend Groq Endpoint
  try {
    const res = await api.post("/optimization/optimize-section", null, {
      params: {
        section_name: "Summary",
        prompt: `Generate a 2-3 sentence professional summary for a ${title}.`,
      },
    });
    if (res?.data) {
      const text = typeof res.data === "string" ? res.data : (res.data.optimizedText || res.data.text || res.data.optimized_content || "");
      if (text) return text.replace(/^["']|["']$/g, '');
    }
  } catch (backendErr) {
    console.warn("Backend Groq optimization fallback used:", backendErr);
  }

  // Fallback Role Generators
  const roleLower = title.toLowerCase();
  if (roleLower.includes('frontend') || roleLower.includes('react')) {
    return `Results-driven ${title} with experience in building high-performance, accessible web applications using React, TypeScript, and modern CSS architectures. Proven track record of optimizing page load times by up to 40% and delivering seamless user experiences for enterprise web applications.`;
  }
  if (roleLower.includes('backend') || roleLower.includes('node') || roleLower.includes('java') || roleLower.includes('python')) {
    return `Performance-focused ${title} specializing in building scalable microservices, REST APIs, and database architectures. Skilled in modern cloud platforms, automated testing, and high-throughput backend pipelines engineered for 99.9% uptime.`;
  }
  if (roleLower.includes('full') || roleLower.includes('stack')) {
    return `Versatile ${title} with expertise across the entire web stack, from responsive frontend interfaces to scalable backend APIs and database schemas. Adept at rapid prototyping, clean code standards, and delivering end-to-end features in agile environments.`;
  }
  return `Results-oriented ${title} with a strong foundation in modern software development, problem-solving, and cross-functional collaboration. Dedicated to shipping high-quality, scalable code that drives business impact and user satisfaction.`;
}

/**
 * AI Experience Bullets Generator for Resume Builder
 */
export async function generateAiExperienceBullets(role = 'Software Engineer', company = 'Tech Corp', existingBullets = []) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("groq_api_key");
  const existingStr = existingBullets.filter(Boolean).map(b => b.slice(0, 40)).join(' | ');
  const seed = Math.floor(Math.random() * 10000);

  if (apiKey) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are an elite FAANG tech recruiter and resume strategist. Generate 3 unique, diverse, high-impact bullet points for a resume work experience section. Avoid using repetitive verb patterns like "Designed and implemented" or "Developed and deployed". Every bullet MUST cover a distinct domain (e.g., System Architecture, Performance Tuning, Security & Testing, CI/CD Pipelines, Team Mentorship). Return ONLY 3 bullet lines without bullet symbols.'
            },
            {
              role: 'user',
              content: `Role: ${role} at ${company}, Seed: ${seed}${existingStr ? `. DO NOT repeat phrasing or concepts from existing bullets: [${existingStr}]` : ''}`
            }
          ],
          temperature: 0.85, max_tokens: 450,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          const lines = text.split('\n').map(l => l.replace(/^[•\-\*\d\.\)]+\s*/, '').trim()).filter(Boolean);
          if (lines.length > 0) return lines.slice(0, 3);
        }
      }
    } catch (e) {
      console.warn('Groq AI fallback used for experience bullets');
    }
  }

  // Diverse Fallback Accomplishments Pool
  const fallbackPool = [
    [
      `Architected high-concurrency microservices at ${company}, reducing P99 latency by 45% under peak traffic.`,
      `Pioneered automated CI/CD deployment pipelines, cutting release cycles from 3 days to 15 minutes.`,
      `Led cross-functional sprint teams of 6 engineers to deliver core platform capabilities with 99.9% uptime.`
    ],
    [
      `Refactored legacy database schemas and query indexes at ${company}, driving a 60% reduction in query execution times.`,
      `Integrated OAuth2 and JWT authentication protocols, mitigating vulnerability exploits across all client endpoints.`,
      `Mentored junior developers through structured code reviews, accelerating onboarding timelines by 30%.`
    ],
    [
      `Engineered real-time telemetry and monitoring dashboards using Prometheus & Grafana at ${company}.`,
      `Streamlined cloud infrastructure costs by 28% through Docker container optimization and AWS auto-scaling rules.`,
      `Spearheaded test-driven development (TDD) adoption, elevating unit test coverage from 60% to 94%.`
    ],
    [
      `Spearheaded automated load testing & performance profiling at ${company}, reducing memory leaks by 35%.`,
      `Optimized API payload serialization, boosting network throughput by 40% across web clients.`,
      `Implemented distributed tracing with OpenTelemetry to diagnose cross-service bottlenecks in real time.`
    ]
  ];

  const poolIdx = (existingBullets.length + Math.floor(Math.random() * 2)) % fallbackPool.length;
  return fallbackPool[poolIdx];
}

/**
 * AI Skills Recommendation Generator for Resume Builder
 */
export async function generateAiSkills(title = 'Software Engineer') {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("groq_api_key");
  if (apiKey) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: 'Generate a JSON array of 10 relevant skills (tech and soft) for the given job title. Return ONLY valid JSON array of strings e.g. ["React", "Node.js"].' },
            { role: 'user', content: `Title: ${title}` }
          ],
          temperature: 0.4, max_tokens: 250,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.warn('Groq AI fallback used for skills');
    }
  }

  const roleLower = title.toLowerCase();
  if (roleLower.includes('frontend') || roleLower.includes('react')) {
    return ["React.js", "TypeScript", "JavaScript (ES6+)", "HTML5 & CSS3", "Tailwind CSS", "Redux Toolkit", "REST APIs", "Jest & RTL", "Git & GitHub", "Responsive Design"];
  }
  if (roleLower.includes('backend') || roleLower.includes('node') || roleLower.includes('java') || roleLower.includes('python')) {
    return ["Node.js", "Express.js", "Python", "Java", "PostgreSQL", "MongoDB", "Redis", "Docker", "RESTful APIs", "System Architecture"];
  }
  return ["React", "TypeScript", "Node.js", "JavaScript", "SQL", "Git", "REST APIs", "System Design", "Agile Methodologies", "Problem Solving"];
}

/**
 * AI Project Idea & Description Generator for Resume Builder
 */
export async function generateAiProject(title = 'Software Engineer', index = 0, existingNames = []) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("groq_api_key");
  const existingStr = existingNames.filter(Boolean).join(', ');

  if (apiKey) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are an expert technical resume writer. Generate a unique portfolio project JSON object for a resume. Do NOT repeat any existing project names. Return ONLY valid JSON format: {"name": "...", "tech": "...", "description": "...", "url": "..."}'
            },
            {
              role: 'user',
              content: `Role: ${title}, Project Number: ${index + 1}${existingStr ? `, Avoid duplicate of: ${existingStr}` : ''}`
            }
          ],
          temperature: 0.7 + (index * 0.05),
          max_tokens: 300,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
          if (parsed?.name && parsed?.description) return parsed;
        }
      }
    } catch (e) {
      console.warn('Groq AI fallback used for project generator');
    }
  }

  // Diverse Fallback Projects Palette
  const sampleProjects = [
    {
      name: "AI Career Intelligence & Resume Platform",
      url: "github.com/user/career-intelligence-ai",
      description: "Built a full-stack career analytics platform featuring real-time resume parsing, ATS score computation, and automated Groq AI interview prep recommendations.",
      tech: "React, Node.js, PostgreSQL, Tailwind CSS, Groq AI"
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
    {
      name: "Distributed Cloud Metrics & Observability Dashboard",
      url: "github.com/user/cloud-metrics-dashboard",
      description: "Engineered an enterprise monitoring dashboard visualizing real-time container metrics, server health telemetry, and automated alerting pipelines.",
      tech: "React, TypeScript, Go, Prometheus, Grafana, AWS CloudWatch"
    },
    {
      name: "Automated CI/CD Deployment & Testing Pipeline",
      url: "github.com/user/cicd-automation-pipeline",
      description: "Designed automated deployment workflows with zero-downtime blue/green deployments, Docker containerization, and unit test suites.",
      tech: "GitHub Actions, Docker, Kubernetes, Jest, Cypress, AWS ECS"
    }
  ];

  const idx = index % sampleProjects.length;
  return sampleProjects[idx];
}

/**
 * AI Education Generator for Resume Builder
 */
export async function generateAiEducation(title = 'Software Engineer') {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("groq_api_key");
  if (apiKey) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: 'Generate an education entry JSON object for a resume based on the job title. Return ONLY valid JSON e.g. {"school": "...", "degree": "...", "field": "...", "startYear": "2018", "endYear": "2022", "gpa": "3.8 / 4.0"}' },
            { role: 'user', content: `Role: ${title}` }
          ],
          temperature: 0.4, max_tokens: 250,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
          if (parsed?.school && parsed?.degree) return parsed;
        }
      }
    } catch (e) {
      console.warn('Groq AI fallback used for education generator');
    }
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

/**
 * AI Personal Information Generator for Resume Builder
 */
export async function generateAiPersonal(title = 'Full Stack Engineer', currentName = 'Candidate Name') {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("groq_api_key");
  if (apiKey) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: 'Generate sample personal contact details JSON for a resume. Return ONLY valid JSON e.g. {"title": "Senior Full Stack Engineer", "location": "Mumbai, India", "linkedin": "linkedin.com/in/candidate", "portfolio": "github.com/candidate"}' },
            { role: 'user', content: `Title: ${title}, Name: ${currentName}` }
          ],
          temperature: 0.4, max_tokens: 250,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
          if (parsed?.title || parsed?.location) return parsed;
        }
      }
    } catch (e) {
      console.warn('Groq AI fallback used for personal generator');
    }
  }

  const roleLower = title.toLowerCase();
  let suggestedTitle = "Senior Full Stack Engineer";
  if (roleLower.includes("frontend") || roleLower.includes("react")) suggestedTitle = "Senior Frontend Engineer (React / TypeScript)";
  else if (roleLower.includes("backend") || roleLower.includes("node") || roleLower.includes("java")) suggestedTitle = "Backend Architect (Node.js & Java)";
  else if (roleLower.includes("data") || roleLower.includes("python")) suggestedTitle = "Lead Data Engineer";

  const handleSlug = (currentName || "candidate").toLowerCase().replace(/\s+/g, "");

  return {
    title: suggestedTitle,
    location: "Mumbai, India",
    linkedin: `linkedin.com/in/${handleSlug}`,
    portfolio: `github.com/${handleSlug}`,
  };
}



