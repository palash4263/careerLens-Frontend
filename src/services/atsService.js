import api from "../api/axiosConfig";
import { optimizeResume } from "./resumeOptimizationService";

export const analyzeResume = async (resumeId, jobDescriptionId) => {
  const params = new URLSearchParams({
    resume_id: String(resumeId),
    job_description_id: String(jobDescriptionId),
  });

  try {
    const response = await api.post(
      `/ats/analyze?${params.toString()}`,
      {
        resumeId,
        jobDescriptionId,
        resume_id: resumeId,
        job_description_id: jobDescriptionId,
      }
    );

    return response.data;
  } catch (error) {
    const status = error.response?.status;

    if (status === 404 || status === 405) {
      return optimizeResume(resumeId, jobDescriptionId);
    }

    throw error;
  }
};
