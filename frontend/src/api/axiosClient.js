import axios from "axios";

function resolveBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) {
    const cleaned = envUrl.replace(/\/+$/, "");
    return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
  }
  if (import.meta.env.PROD) {
    return "https://exam-web-ak0z.onrender.com/api";
  }
  return "http://localhost:5000/api";
}

const axiosClient = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động đính kèm JWT Token từ localStorage vào mọi request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("ptit_exam_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
