// frontend/src/services/performanceService.js
import api from './api';

export const performanceService = {
  // Get driver leaderboard
  getLeaderboard: async (limit = 10, period = 'month') => {
    const response = await api.get('/performance/leaderboard', { 
      params: { limit, period } 
    });
    return response.data;
  },
  
  // Get driver performance metrics
  getDriverPerformance: async (driverId, period = 'month') => {
    const response = await api.get(`/performance/driver/${driverId}`, {
      params: { period }
    });
    return response.data;
  },
  
  // Get driver trends
  getDriverTrends: async (driverId, weeks = 12) => {
    const response = await api.get(`/performance/driver/${driverId}/trends`, {
      params: { weeks }
    });
    return response.data;
  }
};