import apiClient from "./apiClient";

export const adminApi = {
  getAdminDashboard: async () => {
    const res = await apiClient.get("/admin/dashboard");
    return res.data;
  },

  getAllDoctors: async (params = {}) => {
    const res = await apiClient.get("/admin/doctors", { params });
    return res.data;
  },

  getPendingDoctors: async () => {
    const res = await apiClient.get("/admin/doctors/pending");
    return res.data;
  },

  getDoctorDetails: async (id) => {
    const res = await apiClient.get(`/admin/doctors/${id}`);
    return res.data;
  },

  verifyDoctor: async (id) => {
    const res = await apiClient.post(`/admin/doctors/${id}/verify`);
    return res.data;
  },

  rejectDoctor: async (id, reason) => {
    const res = await apiClient.post(`/admin/doctors/${id}/reject`, { reason });
    return res.data;
  },

  getAllPatients: async (params = {}) => {
    const res = await apiClient.get("/admin/patients", { params });
    return res.data;
  },

  getAdminActivity: async () => {
    const res = await apiClient.get("/admin/activity");
    return res.data;
  },
};
