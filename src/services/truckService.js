import api from './api';

export const truckService = {
  getAll: async (params) => {
    const response = await api.get('/trucks', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/trucks/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/trucks', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/trucks/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/trucks/${id}`);
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/trucks/stats');
    return response.data;
  },
  
  getActiveTrucks: async () => {
    const response = await api.get('/trucks/active');
    return response.data;
  },
  
  getAvailable: async () => {
    const response = await api.get('/trucks/available');
    return response.data;
  },
  
  updateLocation: async (id, lat, lng, speed) => {
    const response = await api.post(`/trucks/${id}/location`, { lat, lng, speed });
    return response.data;
  },
  
  updateStatus: async (id, status) => {
    const response = await api.put(`/trucks/${id}/status`, { status });
    return response.data;
  },
  
  assignDriver: async (truckId, driverId) => {
    const response = await api.post(`/trucks/${truckId}/assign-driver`, { driverId });
    return response.data;
  },
  
  unassignDriver: async (truckId) => {
    const response = await api.delete(`/trucks/${truckId}/unassign-driver`);
    return response.data;
  },
  
  assignDevice: async (truckId, deviceId) => {
    const response = await api.post(`/trucks/${truckId}/assign-device`, { deviceId });
    return response.data;
  },
  
  unassignDevice: async (truckId, deviceId) => {
    const response = await api.delete(`/trucks/${truckId}/unassign-device/${deviceId}`);
    return response.data;
  },
  
  getUnassigned: async () => {
    const response = await api.get('/trucks/unassigned');
    return response.data;
  },

  // ==================== DRIVER ASSIGNMENT HISTORY ====================
  // Get driver assignment history for a specific truck
  getDriverAssignmentHistory: async (truckId) => {
    const response = await api.get(`/trucks/${truckId}/driver-history`);
    return response.data;
  },

  // ==================== RECENT ASSIGNMENTS (NEW) ====================
  // Get recent assignments (drivers and devices) within a specified number of days
  getRecentAssignments: async (truckId, days = 30) => {
    const response = await api.get(`/trucks/${truckId}/recent-assignments`, { 
      params: { days } 
    });
    return response.data;
  },

  // Get assignments within a specific date range
  getAssignmentsByDateRange: async (truckId, startDate, endDate) => {
    const response = await api.get(`/trucks/${truckId}/assignments-by-date`, {
      params: { 
        startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
        endDate: endDate instanceof Date ? endDate.toISOString() : endDate
      }
    });
    return response.data;
  },

  // Get truck devices with assignment dates
  getTruckDevices: async (truckId) => {
    const response = await api.get(`/trucks/${truckId}/device`);
    return response.data;
  }
};