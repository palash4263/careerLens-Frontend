// src/services/resumeOptimizationService.js
import api from "../api/axiosConfig";

// ✅ Fix: Use correct endpoint /optimization/optimize
export const optimizeResume = async (resumeId, jobDescriptionId) => {
  const response = await api.post(
    `/optimization/optimize?resume_id=${resumeId}&job_description_id=${jobDescriptionId}`
  );
  return response.data;
};

export const optimizeSection = async (resumeId, sectionName, jobDescriptionId, customPrompt = "") => {
  const response = await api.post(
    `/optimization/optimize-section?resume_id=${resumeId}&section_name=${sectionName}&job_description_id=${jobDescriptionId}`,
    { prompt: customPrompt, instructions: customPrompt }
  );
  return response.data;
};