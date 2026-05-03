import api from './api';

export const userService = {
  getAll: async (params = {}) => {
    const response = await api.get('/users', { params });
    return {
      users: response.data.users || [],
      pagination: response.data.pagination || {
        total: response.data.count || 0,
        page: params.page || 1,
        limit: params.limit || 10,
        pages: 1
      },
      count: response.data.count || 0
    };
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
    // Stats are returned directly, not nested
    return response.data;
  },
  
  getShipmentManagers: async () => {
    try {
      const response = await api.get('/users/shipment-managers');
      return response.data;
    } catch (error) {
      console.error('Error fetching shipment managers:', error);
      throw error;
    }
  },
};