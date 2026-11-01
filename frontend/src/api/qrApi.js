import apiClient from "./apiClient";

export const qrApi = {
  createQRSession: async (data) => {
    const res = await apiClient.post("/qr/create", data);
    return res.data;
  },

  scanQRCode: async (data) => {
    const res = await apiClient.post("/qr/scan", data);
    return res.data;
  },

  getQRSessionDetails: async (id) => {
    const res = await apiClient.get(`/qr/session/${id}`);
    return res.data;
  },

  revokeQRSession: async (id) => {
    const res = await apiClient.post(`/qr/session/${id}/revoke`);
    return res.data;
  },
};
