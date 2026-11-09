import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
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
