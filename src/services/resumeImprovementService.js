// src/services/resumeImprovementService.js
import api from "../api/axiosConfig";

// ✅ Fix: Use correct endpoint
export const improveResume = async (resumeId, jobDescriptionId) => {
  const response = await api.post(
    `/optimization/optimize?resume_id=${resumeId}&job_description_id=${jobDescriptionId}`
  );
  return response.data;
};

export const improveResumeSection = async (resumeId, sectionName, jobDescriptionId) => {
  const response = await api.post(
    `/optimization/optimize-section?resume_id=${resumeId}&section_name=${sectionName}&job_description_id=${jobDescriptionId}`
  );
  return response.data;
};