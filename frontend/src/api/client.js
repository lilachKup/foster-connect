import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({ baseURL });

// Attach the JWT (if present) to every request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Turn API error responses into readable Error messages.
export function apiError(err) {
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
  }
  return detail || err.message || "Something went wrong";
}

export default client;
