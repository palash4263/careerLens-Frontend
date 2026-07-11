// src/api/axiosConfig.js
import axios from "axios";

// ✅ Change baseURL to FastAPI backend
const api = axios.create({
  baseURL: "http://localhost:8000/api", // FastAPI runs on port 8000
  timeout: 60000, // 60 seconds for AI optimization
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    const publicEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/google",
      "/health",
      "/docs",
      "/redoc",
    ];

    const isPublicEndpoint = publicEndpoints.some(
      (endpoint) => config.url?.includes(endpoint)
    );

    if (token && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`📤 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error("❌ API Error:", {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });

      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    } else if (error.request) {
      console.error("❌ No response from server. Is FastAPI running on port 8000?");
    } else {
      console.error("❌ Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;