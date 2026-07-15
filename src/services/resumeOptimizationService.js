// src/services/resumeOptimizationService.js
// Client-side resume optimization — no backend API required.
import { getResumes } from "./resumeService";
import { getJobDescriptions } from "./jobDescriptionService";
import {
  optimizeResumeClient,
  optimizeSectionClient,
  parseSections,
  reconstructResume,
} from "../utils/resumeOptimizer";

/**
 * Optimize an entire resume against a job description.
 * Accepts either IDs (fetches from Supabase) or raw text.
 */
export const optimizeResume = async (resumeId, jobDescriptionId) => {
  let resumeText = "";
  let jobDescriptionText = "";

  if (typeof resumeId === "number" || typeof resumeId === "string") {
    const resumes = await getResumes();
    const resume = resumes.find((r) => String(r.id) === String(resumeId));
    resumeText = resume?.extracted_text || resume?.content || "";
  } else if (typeof resumeId === "string") {
    resumeText = resumeId;
  }

  if (typeof jobDescriptionId === "number" || typeof jobDescriptionId === "string") {
    const jobs = await getJobDescriptions();
    const job = jobs.find((j) => String(j.id) === String(jobDescriptionId));
    jobDescriptionText = job?.description || "";
  } else if (typeof jobDescriptionId === "string") {
    jobDescriptionText = jobDescriptionId;
  }

  return optimizeResumeClient(resumeText, jobDescriptionText);
};

/**
 * Optimize a single resume section.
 * @param {number|string} resumeId - Resume ID (fetched from Supabase) or raw resume text
 * @param {string} sectionName - Section key (Summary, Experience, etc.)
 * @param {number|string} jobDescriptionId - Job ID (fetched from Supabase) or raw JD text
 * @param {string} customPrompt - Optional custom instruction
 * @param {string} sectionTextOverride - Optional: pass the current section text directly
 * @returns {Promise<{optimizedText, optimized_content, optimizedSection, text}>}
 */
export const optimizeSection = async (
  resumeId,
  sectionName,
  jobDescriptionId,
  customPrompt = "",
  sectionTextOverride = null,
) => {
  let sectionText = sectionTextOverride;
  let jobDescriptionText = "";

  if (sectionText == null) {
    let resumeText = "";
    if (typeof resumeId === "number") {
      const resumes = await getResumes();
      const resume = resumes.find((r) => String(r.id) === String(resumeId));
      resumeText = resume?.extracted_text || resume?.content || "";
    } else if (typeof resumeId === "string") {
      resumeText = resumeId;
    }
    const sections = parseSections(resumeText);
    sectionText = sections[sectionName] || "";
  }

  if (typeof jobDescriptionId === "number") {
    const jobs = await getJobDescriptions();
    const job = jobs.find((j) => String(j.id) === String(jobDescriptionId));
    jobDescriptionText = job?.description || "";
  } else if (typeof jobDescriptionId === "string") {
    jobDescriptionText = jobDescriptionId;
  }

  return optimizeSectionClient(sectionName, sectionText, jobDescriptionText, customPrompt);
};
