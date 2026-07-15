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
import api from "../api/axiosConfig";

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
  sectionTextOverride = ""
) => {
  const response = await api.post("/optimization/optimize-section", null, {
    params: {
      resume_id: resumeId,
      section_name: sectionName,
      job_description_id: jobDescriptionId,
      prompt: customPrompt,
    },
  });

  return response.data;
};
