import apiClient from "./apiClient";

export const userApi = {
  getUserProfile: async () => {
    const res = await apiClient.get("/users/profile");
    return res.data;
  },

  updateUserProfile: async (data) => {
    const res = await apiClient.put("/users/profile", data);
    return res.data;
  },

  getUserDashboard: async () => {
    const res = await apiClient.get("/users/dashboard");
    return res.data;
  },

  getUserActivity: async (params = {}) => {
    const res = await apiClient.get("/users/activity", { params });
    return res.data;
  },
};
