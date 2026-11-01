import apiClient from "./apiClient";

export const recordsApi = {
  uploadRecord: async (formData, onProgress) => {
    const res = await apiClient.post("/records/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    return res.data;
  },

  getPatientRecords: async (params = {}) => {
    const res = await apiClient.get("/records", { params });
    return res.data;
  },

  getRecordById: async (id) => {
    const res = await apiClient.get(`/records/${id}`);
    return res.data;
  },

  getRecordDownloadUrl: async (id) => {
    const res = await apiClient.get(`/records/${id}/download`);
    return res.data;
  },

  deleteRecord: async (id) => {
    const res = await apiClient.delete(`/records/${id}`);
    return res.data;
  },

  summarizeRecord: async (id) => {
    const res = await apiClient.post(`/records/${id}/summarize`);
    return res.data;
  },
};
