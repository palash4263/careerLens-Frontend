// src/services/authService.js
import api from "../api/axiosConfig";

export const login = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const register = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

// ✅ Corrected: use "/auth/google" (not "/google")
export const googleSignIn = async (credential) => {
  try {
    const response = await api.post("/auth/google", { credential });
    return response.data;
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
};