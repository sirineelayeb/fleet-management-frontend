// frontend/src/services/gateService.js
import api from './api';

export const gateService = {
  // Gates
  getAll: async (params = {}) => {
  const cleanParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== undefined && value !== null) {
      cleanParams[key] = value;
    }
  }
  const response = await api.get('/gates', { params: cleanParams });
  return response.data;
},
  getById: async (id) => {
    const response = await api.get(`/gates/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/gates', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/gates/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/gates/${id}`);
    return response.data;
  },
  getActive: async () => {
    const response = await api.get('/gates/active');
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/gates/stats');
    return response.data;
  },

  // Authorized trucks
  getAuthorizedTrucks: async (gateId) => {
    const response = await api.get(`/gates/${gateId}/authorized-trucks`);
    return response.data;
  },
  authorizeTruck: async (gateId, truckId) => {
    const response = await api.post(`/gates/${gateId}/authorize-truck`, { truckId });
    return response.data;
  },
  removeAuthorizedTruck: async (gateId, truckId) => {
    const response = await api.delete(`/gates/${gateId}/authorize-truck/${truckId}`);
    return response.data;
  },

  // Access logs & queue
  getAccessLogs: async (gateId, params = {}) => {
    const response = await api.get(`/gates/${gateId}/access-logs`, { params });
    return response.data;
  },
  getQueue: async (gateId) => {
    const response = await api.get(`/gates/${gateId}/queue`);
    return response.data;
  },
};