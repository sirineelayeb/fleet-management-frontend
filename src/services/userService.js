// frontend/src/services/userService.js
import api from './api';

export const userService = {
  getAll: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data; // { success: true, count, users }
  },
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  updateRole: async (id, role) => {
    const response = await api.put(`/users/${id}/role`, { role });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/users/stats');
    return response.data; // { success: true, stats: {...} }
  }
};