// src/services/resumeOptimizationService.js
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

  if (typeof resumeId === "number" || (typeof resumeId === "string" && !isNaN(Number(resumeId)))) {
    try {
      const resumes = await getResumes();
      const resume = resumes.find((r) => String(r.id) === String(resumeId));
      resumeText = resume?.extracted_text || resume?.content || "";
    } catch (err) {
      console.warn("Could not fetch resume list for optimization", err);
    }
  } else if (typeof resumeId === "string") {
    resumeText = resumeId;
  }

  if (typeof jobDescriptionId === "number" || (typeof jobDescriptionId === "string" && !isNaN(Number(jobDescriptionId)))) {
    try {
      const jobs = await getJobDescriptions();
      const job = jobs.find((j) => String(j.id) === String(jobDescriptionId));
      jobDescriptionText = job?.description || "";
    } catch (err) {
      console.warn("Could not fetch JD list for optimization", err);
    }
  } else if (typeof jobDescriptionId === "string") {
    jobDescriptionText = jobDescriptionId;
  }

  return optimizeResumeClient(resumeText, jobDescriptionText);
};

/**
 * Optimize a single resume section with full fallback support.
 * @param {number|string} resumeId - Resume ID or raw resume text
 * @param {string} sectionName - Section key (Summary, Experience, Skills, etc.)
 * @param {number|string} jobDescriptionId - Job ID or raw JD text
 * @param {string} customPrompt - Custom user prompt (e.g., "add according to JD")
 * @param {string} sectionTextOverride - Current text of the section
 * @returns {Promise<{optimizedText: string, optimized_content: string, text: string}>}
 */
export const optimizeSection = async (
  resumeId,
  sectionName,
  jobDescriptionId,
  customPrompt = "",
  sectionTextOverride = ""
) => {
  // 1. Try backend endpoint first
  if (resumeId && jobDescriptionId && !isNaN(Number(resumeId)) && !isNaN(Number(jobDescriptionId))) {
    try {
      const response = await api.post("/optimization/optimize-section", null, {
        params: {
          resume_id: Number(resumeId),
          section_name: sectionName,
          job_description_id: Number(jobDescriptionId),
          prompt: customPrompt,
        },
      });

      if (response.data) {
        const text =
          typeof response.data === "string"
            ? response.data
            : response.data.optimized_text ||
              response.data.optimizedText ||
              response.data.text ||
              response.data.content ||
              response.data.optimizedSection ||
              "";
        if (text) {
          return {
            optimizedText: text,
            optimized_content: text,
            text,
          };
        }
      }
    } catch (err) {
      console.warn("Backend section optimization API unavailable/failed, executing client AI optimizer:", err);
    }
  }

  // 2. Client-side fallback AI optimizer
  let jobDescriptionText = "";
  let currentSectionText = sectionTextOverride || "";

  if (jobDescriptionId) {
    try {
      const jobs = await getJobDescriptions();
      const job = jobs.find((j) => String(j.id) === String(jobDescriptionId));
      jobDescriptionText = job?.description || (typeof jobDescriptionId === "string" ? jobDescriptionId : "");
    } catch (e) {
      if (typeof jobDescriptionId === "string") jobDescriptionText = jobDescriptionId;
    }
  }

  if (!currentSectionText && resumeId) {
    try {
      const resumes = await getResumes();
      const resume = resumes.find((r) => String(r.id) === String(resumeId));
      const fullText = resume?.extracted_text || resume?.content || "";
      if (fullText) {
        const parsed = parseSections(fullText);
        currentSectionText = parsed[sectionName] || "";
      }
    } catch (e) {
      if (typeof resumeId === "string") currentSectionText = resumeId;
    }
  }

  const result = optimizeSectionClient(sectionName, currentSectionText, jobDescriptionText || customPrompt, customPrompt);
  return result;
};
