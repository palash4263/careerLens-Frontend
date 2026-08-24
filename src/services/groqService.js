// src/services/groqService.js
// Calls Groq's API directly or via backend proxy for AI features
import api from "../api/axiosConfig";

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL   = 'llama-3.3-70b-versatile'; // fast and high quality

/**
 * Build the system prompt for section optimization.
 */
function buildSystemPrompt(sectionName) {
  const baseRules = `
You are an elite FAANG resume writer and ATS optimization expert.
Your ONLY task is to rewrite the provided resume section text to be highly impactful, concise, and ATS-friendly.

CRITICAL INSTRUCTIONS & NEGATIVE CONSTRAINTS:
1. OUTPUT RAW TEXT ONLY. Do NOT include conversational filler, pleasantries, preambles, or markdown formatting blocks (like \`\`\` text).
2. DO NOT say "Here is the rewritten section:" or "Sure, I can help with that." Start immediately with the actual resume content.
3. PRESERVE the exact structure of headers, company names, dates, and project titles exactly as provided.
4. DO NOT hallucinate or invent new jobs, degrees, or projects not mentioned in the source text.
5. Use "• " (bullet followed by a space) for all bullet points. Do not use asterisks (*) or hyphens (-).
6. Apply the XYZ format for bullets: "Accomplished [X] as measured by [Y], by doing [Z]".
7. Start every bullet with a strong, diverse action verb (e.g., Spearheaded, Engineered, Orchestrated, Optimized).
8. KEYWORD GAP PRIORITY: If a "MISSING KEYWORDS" list is provided in the user message, these are terms that appear in the Target Job Description but are currently ABSENT from the resume section. Prioritize weaving these specific missing terms into the rewritten bullets, using the JD's exact terminology where possible.
   - ONLY insert a missing keyword where it truthfully describes work already implied by the existing content (e.g., if the source says "built endpoints for user data" and the missing keyword is "RESTful API design," it is fair to rewrite as "Engineered RESTful APIs for user data..." since the underlying work is unchanged, just phrased with the JD's term).
   - Do NOT insert a missing keyword that has no basis whatsoever in the source text — that is fabrication, not optimization, and violates rule 4.
   - Do NOT create a separate "keywords" list or skills dump — every keyword must be integrated naturally inside a bullet or sentence.
   - If no "MISSING KEYWORDS" list is provided but a Target Job Description is, naturally weave in its exact keywords and phrases without keyword stuffing, following the same truthfulness rule above.
`.trim();

  const sectionRules = {
    Summary: `
Additional rules for Summary:
- Write exactly 2-3 concise sentences in flowing prose. NO BULLET POINTS.
- First sentence: State your seniority, core domain/title, and primary tech stack.
- Second/Third sentence: Highlight a major career achievement or your unique value proposition.
- Eliminate first-person pronouns (I, me, my).
`.trim(),
    Experience: `
Additional rules for Experience:
- CRITICAL: Preserve the "Company Name | Job Title | Dates" header lines exactly. Do not modify them.
- Transform responsibilities into achievements.
- Ensure every bullet has a quantifiable metric (e.g., %, $, time saved, scale of users) where logically possible.
- Keep bullets to a single crisp line (max 120 characters) when rendered.
`.trim(),
    Projects: `
Additional rules for Projects:
- CRITICAL: Preserve the "Project Name | Tech Stack | Dates" header lines exactly. Do not modify them.
- Focus on the technical complexity, architecture, and the problem solved.
- Mention the specific technologies from the header in the context of how they were used (e.g., "Engineered a scalable backend using Node.js...").
`.trim(),
    Skills: `
Additional rules for Skills:
- Group skills logically into categories. Output format MUST be "Category: Skill 1, Skill 2, Skill 3".
- Use exactly these categories if applicable: "Languages", "Frameworks & Libraries", "Databases", "Cloud & DevOps", "Tools".
- Prioritize and prominently feature skills found in the Target Job Description, especially any listed under MISSING KEYWORDS.
- Remove redundant or extremely basic skills (e.g., Microsoft Word, Windows) unless explicitly required.
`.trim(),
    Education: `
Additional rules for Education:
- Preserve the Institution Name, Degree, Field of Study, and Dates.
- Keep it clean and minimal. Do not add bullets unless there are significant academic achievements (e.g., Dean's List, 3.9/4.0 GPA, relevant coursework matching the JD).
`.trim(),
  };

  return `${baseRules}\n\n${sectionRules[sectionName] || ''}`;
}

/**
 * Extract important hard skills/keywords from a job description.
 * Used to diff against resume section text and find what's missing.
 * @param {string} jobDescription
 * @returns {Promise<string[]>}
 */
export async function extractKeywordsFromJD(jobDescription) {
  if (!jobDescription || !jobDescription.trim()) return [];

  const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("groq_api_key");
  if (!apiKey) return [];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Extract the top 15-20 important hard skills, tools, technologies, certifications, and role-specific keywords from this job description. Focus on concrete, ATS-searchable terms (e.g., "Kubernetes", "REST API design", "A/B testing") rather than vague soft skills. Return ONLY a raw JSON array of strings, no prose, no markdown.'
          },
          { role: 'user', content: jobDescription.trim() }
        ],
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '[]';
    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.keywords)) return parsed.keywords;
    const firstArrayValue = Object.values(parsed || {}).find(v => Array.isArray(v));
    return firstArrayValue || [];
  } catch (e) {
    console.warn('extractKeywordsFromJD failed, continuing without gap analysis:', e);
    return [];
  }
}

/**
 * Diff JD keywords against resume section text to find what's missing.
 * Simple, fast, deterministic case-insensitive substring match.
 * @param {string[]} jdKeywords
 * @param {string} sectionText
 * @returns {string[]} keywords present in the JD but not found in the section text
 */
function findMissingKeywords(jdKeywords = [], sectionText = '') {
  const lowerText = sectionText.toLowerCase();
  return jdKeywords.filter(kw => kw && !lowerText.includes(kw.toLowerCase()));
}

/**
 * Call Groq to rewrite a single resume section.
 * @param {string} sectionName  - e.g. "Experience"
 * @param {string} sectionText  - current text of the section
 * @param {string} jobDescription - the JD text for keyword alignment
 * @param {string} customPrompt   - optional user instruction
 * @param {string[]} [jdKeywords] - optional pre-extracted JD keywords (avoids re-extracting per section
 *                                  when optimizing multiple sections against the same JD; call
 *                                  extractKeywordsFromJD(jobDescription) once and pass the result in)
 * @returns {Promise<string>} optimized section text
 */
export async function groqOptimizeSection(sectionName, sectionText, jobDescription = '', customPrompt = '', jdKeywords = null) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('VITE_GROQ_API_KEY is not set in your .env file');

  let missingKeywordsBlock = '';
  if (jobDescription) {
    // Reuse pre-extracted keywords if the caller supplied them (recommended when
    // optimizing multiple sections against the same JD), otherwise extract fresh.
    const keywords = Array.isArray(jdKeywords) ? jdKeywords : await extractKeywordsFromJD(jobDescription);
    const missing = findMissingKeywords(keywords, sectionText);
    if (missing.length > 0) {
      missingKeywordsBlock =
        `--- MISSING KEYWORDS (present in JD, absent from current resume section) ---\n` +
        `${missing.join(', ')}\n\n` +
        `Prioritize naturally incorporating these specific terms into the rewritten bullets, ` +
        `ONLY where they truthfully reflect work already present in the source text above. ` +
        `Do not fabricate experience to justify using a term.`;
    }
  }

  const userMessage = [
    `Section: ${sectionName}`,
    '',
    '--- CURRENT SECTION TEXT ---',
    sectionText.trim(),
    '',
    jobDescription ? `--- TARGET JOB DESCRIPTION (align keywords) ---\n${jobDescription.trim()}` : '',
    missingKeywordsBlock,
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
 * Optimize multiple resume sections against the same job description efficiently.
 * Extracts JD keywords ONCE and reuses them across all sections instead of
 * re-extracting per section (saves API calls + latency).
 * @param {Array<{sectionName: string, sectionText: string, customPrompt?: string}>} sections
 * @param {string} jobDescription
 * @returns {Promise<Array<{sectionName: string, optimizedText: string}>>}
 */
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

/**
 * AI Summary Generator for Resume Builder
 */
export async function generateAiSummary(title = 'Software Engineer', name = 'Candidate', customPrompt = '') {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("groq_api_key");

  const systemPrompt = "You are a top-tier executive resume writer. Generate a 2-3 sentence impactful, ATS-optimized professional summary for a candidate. Focus on strong action verbs, technical skills, and quantitative business impact. Output ONLY the summary text, no quotes or intro.";
  const userPrompt = `Target Role / Title: ${title}, Candidate Name: ${name}${customPrompt ? `\n\nUSER CUSTOM PROMPT / INSTRUCTION: ${customPrompt}` : ''}`;

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
        prompt: `Generate a 2-3 sentence professional summary for a ${title}. ${customPrompt}`,
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
export async function generateAiExperienceBullets(role = 'Software Engineer', company = 'Tech Corp', existingBullets = [], customPrompt = '') {
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
              content: `Role: ${role} at ${company}, Seed: ${seed}${existingStr ? `. DO NOT repeat phrasing or concepts from existing bullets: [${existingStr}]` : ''}${customPrompt ? `\n\nUSER CUSTOM PROMPT / INSTRUCTION: ${customPrompt}` : ''}`
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
// Broad tech + soft-skill dictionary used ONLY as an offline fallback for generateAiSkills,
// so that when a JD/custom prompt is available but the Groq API call fails, the result is
// still derived from the actual JD text rather than a fixed generic list.
const SKILL_KEYWORD_DICTIONARY = [
  ["React", ["react(?:\\.js|js)?"]], ["Next.js", ["next(?:\\.js|js)?"]], ["Vue.js", ["vue(?:\\.js|js)?"]],
  ["Angular", ["angular(?:js)?"]], ["TypeScript", ["typescript"]], ["JavaScript", ["javascript"]],
  ["Node.js", ["node(?:\\.js|js)?"]], ["Express.js", ["express(?:\\.js|js)?"]], ["Redux", ["redux"]],
  ["GraphQL", ["graphql"]], ["REST APIs", ["rest(?:ful)?\\s*api(?:s)?"]], ["Webpack", ["webpack"]],
  ["Tailwind CSS", ["tailwind(?:\\s*css)?"]], ["CSS", ["css3?"]], ["HTML", ["html5?"]],
  ["Python", ["python"]], ["Java", ["java"]], ["C\\+\\+", ["c\\+\\+"]], ["C#", ["c#"]],
  ["Spring Boot", ["spring\\s*boot", "spring"]], [".NET", ["\\.net", "dotnet"]],
  ["PostgreSQL", ["postgresql", "postgres"]], ["MySQL", ["mysql"]], ["MongoDB", ["mongodb", "mongo"]],
  ["SQL", ["sql"]], ["Redis", ["redis"]], ["AWS", ["aws", "amazon\\s*web\\s*services"]],
  ["Azure", ["azure"]], ["GCP", ["gcp", "google\\s*cloud"]], ["Docker", ["docker"]],
  ["Kubernetes", ["kubernetes", "k8s"]], ["Git", ["git(?:hub|lab)?"]],
  ["CI/CD", ["ci\\/cd", "cicd", "continuous\\s*integration"]], ["Microservices", ["microservices?"]],
  ["System Design", ["system\\s*design"]], ["Data Structures & Algorithms", ["data\\s*structures", "algorithms?"]],
  ["Agile Methodologies", ["agile", "scrum"]], ["Problem Solving", ["problem[\\s-]solving"]],
  ["Communication", ["communication"]], ["Leadership", ["leadership"]], ["Collaboration", ["collaboration"]],
];

function extractSkillsFromText(text) {
  if (!text) return [];
  return SKILL_KEYWORD_DICTIONARY
    .filter(([, patterns]) => patterns.some(p => new RegExp(`(?<![\\w])(?:${p})(?!\\w)`, 'i').test(text)))
    .map(([label]) => label);
}

export async function generateAiSkills(title = 'Software Engineer', customPrompt = '') {
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
            { role: 'user', content: `Title: ${title}${customPrompt ? `\n\nUSER CUSTOM PROMPT / INSTRUCTION: ${customPrompt}` : ''}` }
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

  // Offline fallback: if we have JD/prompt text to work with, derive skills from it directly
  // instead of returning a fixed generic list unrelated to the actual job description.
  const fromPrompt = extractSkillsFromText(customPrompt);
  if (fromPrompt.length >= 4) return fromPrompt.slice(0, 12);

  const roleLower = title.toLowerCase();
  let generic;
  if (roleLower.includes('frontend') || roleLower.includes('react')) {
    generic = ["React.js", "TypeScript", "JavaScript (ES6+)", "HTML5 & CSS3", "Tailwind CSS", "Redux Toolkit", "REST APIs", "Jest & RTL", "Git & GitHub", "Responsive Design"];
  } else if (roleLower.includes('backend') || roleLower.includes('node') || roleLower.includes('java') || roleLower.includes('python')) {
    generic = ["Node.js", "Express.js", "Python", "Java", "PostgreSQL", "MongoDB", "Redis", "Docker", "RESTful APIs", "System Architecture"];
  } else {
    generic = ["React", "TypeScript", "Node.js", "JavaScript", "SQL", "Git", "REST APIs", "System Design", "Agile Methodologies", "Problem Solving"];
  }

  // Blend in whatever we *did* manage to pull from the JD/prompt text ahead of the generic list.
  return Array.from(new Set([...fromPrompt, ...generic])).slice(0, 12);
}

/**
 * AI Project Idea & Description Generator for Resume Builder
 */
export async function generateAiProject(title = 'Software Engineer', index = 0, existingNames = [], customPrompt = '') {
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
              content: `You are an elite technical resume writer specializing in matching projects to job requirements. Generate ONE portfolio project JSON object for a resume.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON: {"name": "...", "tech": "...", "description": "...", "url": "..."}
2. Do NOT repeat existing project names
3. Project description MUST be 2-3 sentences, starting with a power verb (Architected, Engineered, Built, Designed, Developed)
4. Include a MEASURABLE METRIC in the description (%, time reduction, scale, users, requests/sec)
5. If user provided CUSTOM PROMPT with target JD skills: EXPLICITLY weave those skills into the description and tech stack
6. Tech stack should be 5-7 relevant technologies
7. URL should be realistic (github.com/username/projectname format)
8. Be specific about the problem solved and business impact, not vague`
            },
            {
              role: 'user',
              content: `ROLE: ${title}
PROJECT #: ${index + 1}
${existingStr ? `DO NOT DUPLICATE: ${existingStr}` : ''}
${customPrompt ? `\n⚡ CRITICAL USER DIRECTION:\n${customPrompt}` : 'Generate a compelling, diverse project showcase with strong metrics and modern tech stack.'}`
            }
          ],
          temperature: 0.7 + (index * 0.05),
          max_tokens: 400,
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
 * Strips the project name out of a generated bullet. The resume already shows the
 * project name as the heading above its bullets, so repeating it there is padding.
 * Handles the common shapes the model emits: "... for <Name> with X", "... of <Name>,",
 * "<Name>'s core modules", and quoted variants.
 */
function stripProjectName(line, projectName) {
  const name = (projectName || '').trim();
  if (!name || name.length < 3) return line;

  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let out = line;

  // "Refactored ProjectName's core modules" → "Refactored the core modules"
  out = out.replace(new RegExp(`["'“”]?${esc}["'“”]?['’]s\\s+`, 'gi'), 'the ');
  // "... for/of/in/on/across "ProjectName" ..." → drop the prepositional phrase
  out = out.replace(new RegExp(`\\s+(?:for|of|in|on|across|within|to)\\s+["'“”]?${esc}["'“”]?`, 'gi'), '');
  // Any remaining bare/quoted mention
  out = out.replace(new RegExp(`["'“”]?${esc}["'“”]?`, 'gi'), '');

  // Tidy up the damage: doubled spaces, orphaned punctuation, dangling connectors
  out = out
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/,\s*,/g, ',')
    .replace(/^\s*[,.;:]\s*/, '')
    .trim();

  if (out) out = out.charAt(0).toUpperCase() + out.slice(1);
  // If stripping gutted the sentence, keep the original rather than emit a fragment
  return out.split(/\s+/).length < 6 ? line : out;
}

/**
 * AI Project Bullet Points Generator — generates bullets for an EXISTING project
 * (keeps the user's own name/tech/url intact, unlike generateAiProject which invents
 * a whole new project).
 */
export async function generateAiProjectBullets(projectName = 'Project', tech = '', existingBullets = [], customPrompt = '') {
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
              content: `You are an elite FAANG tech recruiter and resume strategist. Generate 3 UNIQUE, DIVERSE, high-impact resume bullet points for a SPECIFIC project. Each bullet MUST:
1. Start with a STRONG ACTION VERB (e.g., Architected, Engineered, Optimized, Pioneered, Accelerated, Scaled, Deployed, Automated, Refactored)
2. Include a MEASURABLE METRIC or business impact (%, ms latency, throughput, cost savings, users reached, lines reduced)
3. Reference a CONCRETE technical detail (architecture pattern, specific tech, algorithm, integration)
4. Follow the formula: [Action Verb] [what you built] [using X technology] [resulting in Y% improvement / Z ms latency / N users]
5. Be 1 sentence only, 15-25 words
6. Avoid: "Designed and implemented", "Worked on", "Helped with", vague terms like "improved"
7. Be DIVERSE in verb usage and metrics (one about performance, one about scale, one about reliability/automation)
8. Avoid duplicate structures or phrasing from existing bullets
9. ⛔ NEVER write the project name inside a bullet. The resume already displays it as the heading directly above these bullets — repeating it wastes space and reads as padding. Write about WHAT was built and HOW, not about "the project". Say "Architected a modular caching layer..." NOT "Architected [Project Name] using...".
${customPrompt ? `10. CRITICAL: ${customPrompt}` : ''}
Return ONLY 3 bullet lines without symbols or numbering.`
            },
            {
              role: 'user',
              content: `PROJECT: "${projectName}"
TECH STACK: ${tech || 'Not specified'}
SEED: ${seed}
${existingStr ? `EXISTING BULLETS (DO NOT REPEAT): ${existingStr}` : 'NO EXISTING BULLETS'}
${customPrompt ? `\nUSER DIRECTION: ${customPrompt}` : 'Generate diverse, high-impact bullets showcasing technical depth and measurable business value.'}`
            }
          ],
          temperature: 0.85, max_tokens: 450,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          const lines = text
            .split('\n')
            .map(l => l.replace(/^[•\-\*\d\.\)]+\s*/, '').trim())
            .filter(Boolean)
            .map(l => stripProjectName(l, projectName));
          if (lines.length > 0) return lines.slice(0, 3);
        }
      }
    } catch (e) {
      console.warn('Groq AI fallback used for project bullets');
    }
  }

  const techList = tech ? tech.split(',').map(t => t.trim()).filter(Boolean) : [];
  const primaryTech = techList[0] || 'React';
  const secondaryTech = techList[1] || primaryTech;
  const tertiaryTech = techList[2] || secondaryTech;

  // Diverse fallback pool so repeated clicks (when no Groq key / API call fails) don't
  // just re-emit the same 3 template bullets over and over.
  // NOTE: bullets never restate the project name — the card header already shows it.
  const fallbackPool = [
    [
      `Architected a modular ${primaryTech} frontend with code-splitting and lazy loading, cutting initial bundle size by 42% and time-to-interactive to under 1.2s.`,
      `Built a ${secondaryTech} service layer with request batching and response caching, reducing redundant API calls by 68% under peak traffic.`,
      `Instrumented end-to-end performance monitoring across critical user flows, surfacing three render bottlenecks that improved Lighthouse score from 71 to 96.`,
    ],
    [
      `Designed a normalized data model and REST API layer in ${secondaryTech}, sustaining 10,000+ concurrent operations at sub-80ms p95 latency.`,
      `Automated the test suite with unit and integration coverage above 85%, catching 12+ regressions before they reached production.`,
      `Shipped a zero-downtime CI/CD pipeline with staged rollouts, compressing release turnaround from four hours to under nine minutes.`,
    ],
    [
      `Engineered a ${primaryTech}-to-${tertiaryTech} integration layer with connection pooling and retry backoff, slashing end-to-end latency by 40%.`,
      `Refactored the core state management into composable hooks, eliminating 1,400 lines of duplicated logic and cutting average PR review time by 25%.`,
      `Hardened the system against edge-case failures with structured error boundaries, schema validation, and alerting that reduced production incidents by 55%.`,
    ],
    [
      `Implemented server-side rendering with incremental static regeneration, driving a 3.1x improvement in organic search impressions within two months.`,
      `Optimized ${primaryTech} render cycles via memoization and virtualized lists, dropping frame drops on 5,000-row datasets from 22% to under 2%.`,
      `Integrated role-based access control across 18 protected routes, closing a privilege-escalation gap flagged during security review.`,
    ],
  ];

  const poolIdx = (existingBullets.length + Math.floor(Math.random() * fallbackPool.length)) % fallbackPool.length;
  return fallbackPool[poolIdx];
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
export async function generateAiPersonal(title = 'Full Stack Engineer', currentName = 'Palash Mishra') {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("groq_api_key");
  if (apiKey) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: 'Generate sample personal contact details JSON for a resume. Return ONLY valid JSON e.g. {"name": "Palash Mishra", "title": "Senior Full Stack Engineer", "email": "palash.mishra@email.com", "phone": "+91 98765 43210", "location": "Mumbai, India", "linkedin": "linkedin.com/in/palashmishra", "portfolio": "github.com/palashmishra"}' },
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
          if (parsed?.title || parsed?.location || parsed?.name) return parsed;
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

  const handleSlug = (currentName && currentName !== 'Candidate Name' ? currentName : "palashmishra").toLowerCase().replace(/\s+/g, "");
  const nameVal = (currentName && currentName !== 'Candidate Name') ? currentName : "Palash Mishra";

  return {
    name: nameVal,
    title: suggestedTitle,
    email: `${handleSlug}@email.com`,
    phone: "+91 98765 43210",
    location: "Mumbai, India",
    linkedin: `linkedin.com/in/${handleSlug}`,
    portfolio: `github.com/${handleSlug}`,
  };
}

export async function groqSuggestJobMatches(resumeName, title = 'Software Engineer') {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    return {
      title: title || "Software Engineer",
      skills: ["React.js", "Node.js", "JavaScript", "SQL", "Git", "REST APIs"],
      roles: ["Frontend Developer", "Full Stack Engineer", "React Developer", "Software Engineer"]
    };
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an AI job match assistant. Given a resume name or job title, return a JSON object with: 1) "title" (cleaned primary role title), 2) "skills" (array of 6 key technical skills/keywords), and 3) "roles" (array of 4 related job titles). Return ONLY the raw JSON string.'
          },
          {
            role: 'user',
            content: `Resume Name: ${resumeName}, Primary Title Hint: ${title}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      return JSON.parse(content);
    }
  } catch (e) {
    console.error("Groq job suggestion error, returning fallbacks:", e);
  }

  return {
    title: title || "Software Engineer",
    skills: ["React.js", "Node.js", "JavaScript", "SQL", "Git", "REST APIs"],
    roles: ["Frontend Developer", "Full Stack Engineer", "React Developer", "Software Engineer"]
  };
}

export async function extractSkillsFromResume(resumeText) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("groq_api_key");
  if (!apiKey) {
    throw new Error("GROQ API key is required to extract skills.");
  }
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an AI career analyst. Analyze the provided resume text and extract the top 10-15 key technical and soft skills. Return the result as a raw JSON array of strings.'
        },
        {
          role: 'user',
          content: `Resume Text:\n\n${resumeText}`
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    }),
  });

  if (response.ok) {
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : (parsed.skills || Object.values(parsed)[0]);
    } catch (e) {
      console.error("Failed to parse skills JSON", e);
      return [];
    }
  }
  return [];
}

/**
 * Claude AI Project Bullet Points Generator — generates 5 bullets for a project using Claude
 * @param {string} projectName - Name of the project
 * @param {string} tech - Technologies used
 * @param {string[]} existingBullets - Current bullets to avoid repetition
 * @param {string} customPrompt - Custom user instruction
 * @returns {Promise<string[]>} Array of 5 bullet points
 */
export async function generateProjectBulletsWithClaude(projectName = 'Project', tech = '', existingBullets = [], customPrompt = '') {
  try {
    const response = await api.post("/ai/generate-project-bullets", {
      projectName,
      tech,
      existingBullets: existingBullets.filter(Boolean),
      customPrompt,
      instruction: "Generate 5 unique, high-impact resume bullet points. IMPORTANT: Do NOT mention the project name in any bullet. Focus on technical achievements, metrics, and impact. Start each bullet with a strong action verb."
    });

    if (response?.data?.bullets && Array.isArray(response.data.bullets)) {
      return response.data.bullets.slice(0, 5);
    }
  } catch (e) {
    console.warn('Claude project bullets generation failed, falling back:', e);
  }

  // Fallback to Groq if Claude fails
  try {
    const groqBullets = await generateAiProjectBullets(projectName, tech, existingBullets, customPrompt);
    return groqBullets || [];
  } catch (err) {
    console.warn('Fallback to Groq also failed:', err);
  }

  // Final fallback - return generic bullets (without project name)
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
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("groq_api_key");
  if (!apiKey) {
    throw new Error("GROQ API key is required to generate a roadmap.");
  }

  const prompt = `
Create a detailed, modern, step-by-step learning roadmap for mastering "${skill}".
${resumeContext ? `Tailor the roadmap considering the user's existing resume background: ${resumeContext.substring(0, 500)}...` : ""}
Use Markdown formatting. Include:
1. **Introduction**: Brief overview of the skill.
2. **Prerequisites**: What to know before starting.
3. **Step-by-Step Learning Path**: 3-5 distinct phases (e.g., Fundamentals, Intermediate, Advanced) with bullet points of topics.
4. **Key Projects**: 2 practical project ideas to build.
5. **Top Resources**: Links or mentions of best places to learn.
Keep it concise, highly structured, and actionable. Do not use generic filler text.
`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an elite AI technical mentor who creates highly actionable, accurate, and structured learning roadmaps using beautiful Markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 1500,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
  throw new Error("Failed to generate roadmap from Groq.");
}

/**
 * AI Cover Letter Generator based on Resume and JD
 */
export async function generateAiCoverLetter(resumeText, jobDescription) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("groq_api_key");
  if (!apiKey) {
    throw new Error("GROQ API key is required to generate a cover letter.");
  }

  const prompt = `
Generate a highly professional, modern, and concise cover letter tailored to the following Job Description, using my Resume as the background experience.

--- TARGET JOB DESCRIPTION ---
${jobDescription.substring(0, 3000)}

--- MY RESUME BACKGROUND ---
${resumeText.substring(0, 3000)}

Instructions:
1. Do not use generic filler (e.g. "I am writing to express my interest..."). Open with a strong, hook-driven first sentence.
2. Structure it into exactly 3-4 paragraphs.
3. Highlight specific overlaps between the job requirements and my resume achievements.
4. Close with a clear, confident call to action.
5. Provide ONLY the body of the cover letter (no address headers, no "Dear Hiring Manager", no sign-offs like "Sincerely, [Name]" - I will add those myself in the UI).
6. Do NOT wrap the output in quotes or markdown code blocks.
`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an elite executive career coach and technical recruiter. Generate highly persuasive, succinct, and metric-driven cover letter bodies.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.65,
      max_tokens: 800,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  }
  throw new Error("Failed to generate cover letter from Groq.");
}

/**
 * AI URL Auto-Fill: Fetch job post HTML via proxy and parse with Groq
 */
export async function extractJobFromUrl(url) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem("groq_api_key");
  if (!apiKey) {
    throw new Error("GROQ API key is required to extract job details.");
  }

  // 1. Fetch raw HTML via CORS proxy
  let rawHtml = '';
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error("Proxy fetch failed");
    const data = await res.json();
    rawHtml = data.contents || '';
  } catch (err) {
    console.error("Proxy fetch error:", err);
    throw new Error("Failed to access the provided URL. It might be blocked by bot protection.");
  }

  // 2. Strip tags to reduce tokens
  const cleanText = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .substring(0, 12000); // Send max ~12k characters to Groq to avoid token limits

  if (!cleanText.trim()) {
    throw new Error("No readable text found on the page.");
  }

  // 3. Prompt Groq to extract JSON
  const prompt = `
You are an expert Data Extractor.
Extract the Job Title, Company Name, and the full Job Description from the following scraped web page text.

Respond ONLY with a valid JSON object in this exact format:
{
  "title": "Extracted Job Title",
  "company": "Extracted Company Name",
  "description": "The full detailed job description text. Clean up messy spacing but keep all the important requirements, responsibilities, and qualifications."
}

Do NOT wrap the JSON in markdown blocks like \`\`\`json. Just output the raw JSON object starting with { and ending with }.

--- SCRAPED TEXT ---
${cleanText}
`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an AI that strictly outputs JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 2000,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim() || "";
    // Clean up potential markdown blocks if the model ignored instructions
    if (content.startsWith("```json")) {
      content = content.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (content.startsWith("```")) {
      content = content.replace(/^```/, "").replace(/```$/, "").trim();
    }

    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse Groq JSON:", content);
      throw new Error("AI failed to extract structured data. Please copy-paste manually.");
    }
  }
  throw new Error("Failed to extract data from Groq.");
}