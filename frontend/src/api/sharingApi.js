import apiClient from "./apiClient";

export const sharingApi = {
  requestAccess: async (data) => {
    const res = await apiClient.post("/sharing/request", data);
    return res.data;
  },

  getPatientSharingRequests: async () => {
    const res = await apiClient.get("/sharing/patient/requests");
    return res.data;
  },

  getDoctorSharingRequests: async () => {
    const res = await apiClient.get("/sharing/doctor/requests");
    return res.data;
  },

  approveSharingRequest: async (id, data) => {
    const res = await apiClient.post(`/sharing/${id}/approve`, data);
    return res.data;
  },

  rejectSharingRequest: async (id, data) => {
    const res = await apiClient.post(`/sharing/${id}/reject`, data);
    return res.data;
  },

  revokeSharingAccess: async (id) => {
    const res = await apiClient.post(`/sharing/${id}/revoke`);
    return res.data;
  },

  getSharingStatus: async (id) => {
    const res = await apiClient.get(`/sharing/${id}/status`);
    return res.data;
  },
};
