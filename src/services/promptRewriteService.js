// src/services/promptRewriteService.js
// Prompt-driven resume rewrite: take an uploaded resume + the user's own instructions,
// return a brand-new set of resume sections ready to render as a PDF.
import { parseSections } from "../utils/resumeOptimizer";

export const REWRITE_PROMPT_KEY = "cl_rewrite_prompt";

// Placeholder — replace with the real rewrite prompt once it's finalised.
export const DEFAULT_REWRITE_PROMPT = `Rewrite this resume following these instructions:
- Keep every employer, title, date and degree exactly as written.
- Rewrite each bullet with a strong action verb and a measurable result.
- Keep the whole resume tight enough to fit one page.`;

export const REWRITE_SECTIONS = ["Header", "Summary", "Experience", "Projects", "Skills", "Education", "Certifications"];

export const REWRITE_STEPS = [
  { id: "read", label: "Reading your resume" },
  { id: "apply", label: "Applying your prompt" },
  { id: "format", label: "Formatting the new resume" },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Rewrite a resume according to a free-form prompt.
 * @param {{ resumeText: string, prompt: string, onProgress?: (stepId: string) => void }} args
 * @returns {Promise<{ sections: Record<string, string>, preview: boolean }>}
 *
 * TODO: UI-only stub. Swap the body for the real AI call (Groq / backend endpoint).
 * It currently returns the parsed original sections so the page flow can be exercised end to end.
 */
export async function rewriteResumeWithPrompt({ resumeText, prompt, onProgress = () => {} }) {
  if (!resumeText?.trim()) throw new Error("This resume has no extracted text to rewrite.");
  if (!prompt?.trim()) throw new Error("Write a prompt describing how to rewrite the resume.");

  onProgress("read");
  const sections = parseSections(resumeText);
  await wait(700);

  onProgress("apply");
  await wait(1200);

  onProgress("format");
  await wait(500);

  return { sections, preview: true };
}
