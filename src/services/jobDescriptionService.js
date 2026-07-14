// src/services/jobDescriptionService.js
import api from "../api/axiosConfig";

// Removed trailing slashes to prevent FastAPI 404 routing mismatches
export const getJobDescriptions = async () => {
  const response = await api.get("/jobs");
  return response.data;
};

export const createJobDescription = async (jobDescription) => {
  const response = await api.post("/jobs", jobDescription);
  return response.data;
};

export const deleteJobDescription = async (id) => {
  await api.delete(`/jobs/${id}`);
};

export const fetchJobFromUrl = async (url) => {
  const response = await api.post("/jobs/fetch-from-url", { url });
  return response.data; // { title, company, description }
};