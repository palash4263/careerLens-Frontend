// src/services/groqService.js
// Calls Groq's API directly from the frontend for AI Personalize feature

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
