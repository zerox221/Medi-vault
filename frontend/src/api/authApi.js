import apiClient from "./apiClient";

export const authApi = {
  registerPatient: async (data) => {
    const res = await apiClient.post("/auth/patient/register", data);
    return res.data;
  },

  registerDoctor: async (data) => {
    const res = await apiClient.post("/auth/doctor/register", data);
    return res.data;
  },

  verifyEmail: async (email, otp) => {
    const res = await apiClient.post("/auth/verify-email", { email, otp });
    return res.data;
  },

  resendOTP: async (email) => {
    const res = await apiClient.post("/auth/resend-otp", { email });
    return res.data;
  },

  login: async (credentials) => {
    const res = await apiClient.post("/auth/login", credentials);
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get("/auth/me");
    return res.data;
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore network errors on logout
    }
  },
};
