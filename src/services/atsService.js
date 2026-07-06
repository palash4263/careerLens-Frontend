import axios from "axios";

const API_URL = "http://localhost:8080/api/ats";

export const analyzeResume = async (resumeId, jobDescriptionId) => {
  const token = localStorage.getItem("token"); // adjust to however you store it

  const response = await axios.post(
    `${API_URL}/analyze`,
    {
      resumeId,
      jobDescriptionId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};