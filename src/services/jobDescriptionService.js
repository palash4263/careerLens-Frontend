// src/services/jobDescriptionService.js
import api from "../api/axiosConfig";

// ✅ Fix: Use /jobs/ instead of /job-descriptions
export const getJobDescriptions = async () => {
  const response = await api.get("/jobs/");
  return response.data;
};

export const createJobDescription = async (jobDescription) => {
  const response = await api.post("/jobs/", jobDescription);
  return response.data;
};

export const deleteJobDescription = async (id) => {
  await api.delete(`/jobs/${id}`);
};