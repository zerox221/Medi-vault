import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("medivault_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred. Please try again.";
    
    // Auto-clear invalid token on 401
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.includes("/auth") && !currentPath.includes("/login") && !currentPath.includes("/register")) {
        localStorage.removeItem("medivault_token");
        localStorage.removeItem("medivault_user");
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
