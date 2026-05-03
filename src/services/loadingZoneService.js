import api from './api';

export const loadingZoneService = {
  getAll: async (params = {}) => {
    const response = await api.get('/loading-zones', { params });
    return response.data;
  },

  getActive: async () => {
    const response = await api.get('/loading-zones/active');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/loading-zones/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/loading-zones', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/loading-zones/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/loading-zones/${id}`);
    return response.data;
  },

  bulkUpdateStatus: async (zoneIds, status) => {
    const response = await api.post('/loading-zones/bulk-update-status', { zoneIds, status });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/loading-zones/stats');
    // Return the entire response so we can access response.data
    return response.data;
  }
};