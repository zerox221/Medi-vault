import apiClient from "./apiClient";

export const doctorApi = {
  getDoctorProfile: async () => {
    const res = await apiClient.get("/doctors/profile");
    return res.data;
  },

  updateDoctorProfile: async (data) => {
    const res = await apiClient.put("/doctors/profile", data);
    return res.data;
  },

  getDoctorDashboard: async () => {
    const res = await apiClient.get("/doctors/dashboard");
    return res.data;
  },

  getDoctorPatients: async () => {
    const res = await apiClient.get("/doctors/patients");
    return res.data;
  },

  getDoctorRequests: async () => {
    const res = await apiClient.get("/doctors/requests");
    return res.data;
  },

  getDoctorRecords: async () => {
    const res = await apiClient.get("/doctors/records");
    return res.data;
  },

  uploadVerificationDocument: async (formData) => {
    const res = await apiClient.post("/doctors/verification-documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
};
