import api from './api';

export const trackingService = {
  getLiveTracking: async () => {
    const response = await api.get('/tracking/live');
    return response.data;
  },
  getTruckLiveLocation: async (truckId) => {
    const response = await api.get(`/tracking/live/truck/${truckId}`);
    return response.data;
  },
  getTruckLocations: async (truckId, params = {}) => {
    const response = await api.get(`/tracking/truck/${truckId}`, { params });
    return response.data;
  },
  getTruckHistory: async (truckId, params = {}) => {
    const response = await api.get(`/tracking/history/truck/${truckId}`, { params });
    return response.data;
  },
  getTrackingSummary: async (truckId, params = {}) => {
    const response = await api.get(`/tracking/summary/truck/${truckId}`, { params });
    return response.data;
  }
};