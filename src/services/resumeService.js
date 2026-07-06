import api from "../api/axiosConfig";

export const getResumes = async () => {
  const response = await api.get("/resumes");
  return response.data;
};

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/resumes/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const deleteResume = async (id) => {
  await api.delete(`/resumes/${id}`);
};