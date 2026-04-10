import api from './api';

export const alertService = {
  getAll: async (params = {}) => {
    const response = await api.get('/alerts', { params });
    return response.data.data ?? []; 
  },

  getById: async (id) => {
    const response = await api.get(`/alerts/${id}`);
    return response.data.data;
  },

  create: async (data) => {
    const response = await api.post('/alerts', data);
    return response.data.data;
  },

  acknowledge: async (id, note) => {
    const response = await api.put(`/alerts/${id}/acknowledge`, { note });
    return response.data.data;
  },

  resolve: async (id, note) => {
    const response = await api.put(`/alerts/${id}/resolve`, { note });
    return response.data.data;
  },

  getStats: async () => {
    const response = await api.get('/alerts/stats');
    return response.data.data;
  },
};
