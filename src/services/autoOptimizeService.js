// src/services/autoOptimizeService.js
// One-click resume optimization pipeline: JD keywords → parallel section rewrites → scoring.
// Groq is primary for every step; the local rule engine (resumeOptimizer.js) is the fallback
// so a Groq outage degrades quality rather than failing the whole run.
import { extractKeywordsFromJD, groqOptimizeSection } from "./groqService";
import {
  parseSections,
  reconstructResume,
  extractKeywords,
  optimizeSectionClient,
} from "../utils/resumeOptimizer";

export const DEFAULT_OPTIMIZE_PROMPT_KEY = "cl_auto_optimize_prompt";

// The user's standing instructions — shown (editable) on the Optimize page and prepended
// to every section rewrite. Keep this in plain language; the per-section rules below
// translate it into concrete constraints.
export const DEFAULT_OPTIMIZE_PROMPT = `Tailor this resume to the target job description so recruiters and ATS filters see a strong match.
- Skills: reorganize and include as many of the JD's skills as truthfully apply.
- Projects: keep exactly two — the CareerLens project and one project aligned to the JD.
- Weave JD keywords naturally into bullets; never keyword-stuff or fabricate employers/degrees.
- Keep everything tight enough to fit one full page.`;

export const AUTO_SECTIONS = ["Summary", "Experience", "Projects", "Skills"];

// Per-section constraints layered under the user's prompt. These carry the one-page
// length budgets and the Projects rule that overrides the base "never invent projects" guard.
const SECTION_RULES = {
  Summary: `Write exactly 2-3 sentences (max 60 words). Lead with the job title used in the JD and the JD's top 3-4 technologies.`,
  Experience: `Keep every "Company | Title | Dates" header line exactly. Max 4 bullets per role, each ≤ 22 words on a single line. Use the JD's exact terminology for technologies already implied by the source bullets.`,
  Projects: `OVERRIDE FOR THIS TASK: the output must contain EXACTLY TWO projects, in this order:
1. The CareerLens project (any entry whose name contains "CareerLens" / "Career Lens"). Keep its name and header line; rewrite its 3-4 bullets using the JD's terminology and keywords.
2. One project aligned to the target JD. If the source already has a project that matches the JD's stack, adapt that one (keep its name). Otherwise create ONE realistic project whose name, tech stack and 3-4 bullets use the JD's core technologies and responsibilities.
Drop every other project. Header format for each project: "Project Name | Tech, Stack, List | Mon YYYY". Bullets ≤ 22 words, one line each, no project name inside bullets.`,
  Skills: `Output 4-5 lines in the format "Category: Skill 1, Skill 2, ...". Include EVERY provided JD keyword that could reasonably apply to this candidate, plus the candidate's existing skills. Max ~10 skills per line. No prose.`,
};

const escapeRegExp = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

/** Keyword coverage: share of JD keywords present anywhere in the resume text. */
export function keywordCoverage(resumeText = "", keywords = []) {
  if (!keywords.length) return { matched: [], missing: [], ratio: 0 };
  const matched = [];
  const missing = [];
  for (const kw of keywords) {
    const re = new RegExp(`(?<![\\w])${escapeRegExp(kw)}(?![\\w])`, "i");
    (re.test(resumeText) ? matched : missing).push(kw);
  }
  return { matched, missing, ratio: matched.length / keywords.length };
}

/** ATS-style score on the same scale the rest of the app uses (52–97). */
export function atsScore(resumeText = "", keywords = []) {
  const { ratio } = keywordCoverage(resumeText, keywords);
  const lower = resumeText.toLowerCase();
  const structureBonus =
    (/(experience|projects)/.test(lower) ? 4 : 0) + (/education/.test(lower) ? 4 : 0);
  return Math.min(97, Math.max(52, Math.round(45 + ratio * 45) + structureBonus));
}

async function resolveKeywords(jdText) {
  const local = extractKeywords(jdText);
  let ai = [];
  try {
    ai = await extractKeywordsFromJD(jdText);
  } catch {
    /* Groq unavailable — local list is enough */
  }
  const merged = [];
  const seen = new Set();
  for (const kw of [...ai, ...local]) {
    const clean = String(kw || "").trim();
    if (!clean || seen.has(clean.toLowerCase())) continue;
    seen.add(clean.toLowerCase());
    merged.push(clean);
  }
  return merged;
}

async function rewriteSection(sectionName, sectionText, jdText, keywords, userPrompt) {
  const instruction = [userPrompt?.trim(), SECTION_RULES[sectionName]].filter(Boolean).join("\n\n");

  // Projects/Skills may legitimately start empty (e.g. resume had no Projects heading);
  // still ask Groq so the JD-aligned content gets created.
  try {
    const text = await groqOptimizeSection(sectionName, sectionText || "(empty)", jdText, instruction, keywords);
    if (text && text.trim()) return { text: text.trim(), source: "groq" };
  } catch (err) {
    console.warn(`[autoOptimize] Groq failed for ${sectionName}, using local engine:`, err.message);
  }

  const local = optimizeSectionClient(sectionName, sectionText, jdText, instruction);
  return { text: (local.optimizedText || sectionText || "").trim(), source: "local" };
}

/**
 * Run the full one-click optimization.
 * @param {object} args
 * @param {string} args.resumeText   Raw extracted resume text
 * @param {object} args.job          { title, company, description }
 * @param {string} [args.userPrompt] Standing instructions (defaults to DEFAULT_OPTIMIZE_PROMPT)
 * @param {(step: string, detail?: string) => void} [args.onProgress]
 */
export async function autoOptimizeResume({ resumeText, job, userPrompt = DEFAULT_OPTIMIZE_PROMPT, onProgress }) {
  const progress = (step, detail) => onProgress?.(step, detail);
  const jdText = job?.description || "";
  if (!resumeText?.trim()) throw new Error("The selected resume has no extractable text.");
  if (!jdText.trim()) throw new Error("The selected job description is empty.");

  progress("keywords");
  const keywords = await resolveKeywords(jdText);

  progress("parse");
  const original = parseSections(resumeText);

  progress("rewrite");
  const rewritten = await Promise.all(
    AUTO_SECTIONS.map(async (name) => {
      const out = await rewriteSection(name, original[name], jdText, keywords, userPrompt);
      progress("section", name);
      return [name, out];
    })
  );

  const sections = { ...original };
  const sources = {};
  for (const [name, { text, source }] of rewritten) {
    sections[name] = text;
    sources[name] = source;
  }

  progress("score");
  const optimizedText = reconstructResume(sections);
  const before = keywordCoverage(resumeText, keywords);
  const after = keywordCoverage(optimizedText, keywords);

  return {
    sections,
    originalSections: original,
    optimizedText,
    originalText: resumeText,
    keywords,
    coverageBefore: before,
    coverageAfter: after,
    scoreBefore: atsScore(resumeText, keywords),
    scoreAfter: atsScore(optimizedText, keywords),
    sources, // which engine produced each section — surfaced in the UI
  };
}

/** First non-empty header line that isn't a contact detail or a role title. */
export function nameFromHeader(header = "", fallback = "") {
  const line = header
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !/[@|]|https?:|\+?\d{5,}/.test(l) && !/\b(developer|engineer|analyst|architect|manager|designer|consultant|intern)\b/i.test(l));
  return line || fallback || "Resume";
}

/** `Palash_Mishra_Acme_Backend_Developer_Resume` */
export function buildResumeFileName(name, company, title) {
  const clean = (s) => String(s || "").trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  return [clean(name) || "Resume", clean(company), clean(title), "Resume"].filter(Boolean).join("_");
}
