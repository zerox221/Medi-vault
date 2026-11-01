import apiClient from "./apiClient";

export const aiApi = {
  // Patient AI Endpoints
  patientAsk: async (payload) => {
    const res = await apiClient.post("/ai/ask", payload);
    return res.data;
  },

  patientSearch: async (payload) => {
    const res = await apiClient.post("/ai/search", payload);
    return res.data;
  },

  getProcessingStatus: async (recordId) => {
    const res = await apiClient.get(`/records/${recordId}/processing-status`);
    return res.data;
  },

  reprocessRecord: async (recordId) => {
    const res = await apiClient.post(`/ai/reprocess/${recordId}`);
    return res.data;
  },

  getRecordSummary: async (recordId) => {
    const res = await apiClient.get(`/ai/summary/${recordId}`);
    return res.data;
  },

  // Doctor AI & Search Endpoints
  getAuthorizedPatients: async (query = "") => {
    const res = await apiClient.get("/doctors/patients/search", {
      params: query ? { q: query } : {},
    });
    return res.data;
  },

  getPatientAuthorizedReports: async (patientId) => {
    const res = await apiClient.get(`/doctors/patients/${patientId}/reports`);
    return res.data;
  },

  doctorSearchReports: async (payload) => {
    const res = await apiClient.post("/doctors/reports/search", payload);
    return res.data;
  },

  doctorAskQuestion: async (payload) => {
    const res = await apiClient.post("/doctors/ai/ask", payload);
    return res.data;
  },
};
