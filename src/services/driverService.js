import api from './api';

export const driverService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/drivers', { params });
      return response.data;
    } catch (error) {
      console.error('driverService.getAll error:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    const response = await api.get(`/drivers/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/drivers', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/drivers/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/drivers/${id}`);
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/drivers/stats');
    return response.data;
  },
  
  getAvailable: async () => {
    const response = await api.get('/drivers/available');
    return response.data;
  },
  
  getPerformance: async (id, period) => {
    const response = await api.get(`/performance/driver/${id}`, { params: { period } });
    return response.data;
  },
  
  getLeaderboard: async (limit, period) => {
    const response = await api.get('/performance/leaderboard', { params: { limit, period } });
    return response.data;
  },
  
  uploadPhoto: async (id, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await api.post(`/drivers/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data; // return the driver object with photo.url
  },
  
  deletePhoto: async (id) => {
    const response = await api.delete(`/drivers/${id}/photo`);
    return response.data;
  },
  archive: async (id) => {
  const response = await api.patch(`/drivers/${id}/archive`);
  return response.data;
  },
  unarchive: async (id) => {
    const response = await api.patch(`/drivers/${id}/unarchive`);
    return response.data;
  },

  // ============================================================
  // NEW SCORE MANAGEMENT APIS
  // ============================================================

  // Get current score configuration (points for early/on-time/late)
  getScoreConfig: async () => {
    const response = await api.get('/drivers/score-config');
    return response.data;
  },

  // Update score configuration (admin only)
  updateScoreConfig: async (data) => {
    const response = await api.put('/drivers/score-config', data);
    return response.data;
  },

  // Get score change logs for a specific driver
  getScoreLogs: async (driverId, limit = 50) => {
    const response = await api.get(`/drivers/${driverId}/score-logs`, { params: { limit } });
    return response.data;
  },

  // Manually adjust a driver's score (admin only)
  adjustScore: async (driverId, points, remark) => {
    const response = await api.post(`/drivers/${driverId}/adjust-score`, { points, remark });
    return response.data;
  },
    getAllDriversWithLastTruck: async () => {
    const response = await api.get('/drivers/history/all');
    return response.data; // { success: true, count: ..., data: [...] }
  },
};