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
  const response = await api.get(`/tracking/truck/${truckId}/history`, { params }); // ✅ added /history
  return response.data;
  },
  getTruckRoute: async (truckId, params = {}) => {
  const response = await api.get(`/tracking/truck/${truckId}/route`, { params });
  return response.data;
  },
    
  getTruckHistory: async (truckId, params = {}) => {
    const response = await api.get(`/tracking/history/truck/${truckId}`, { params });
    return response.data;
  },
  
  getTrackingSummary: async (truckId, params = {}) => {
    const response = await api.get(`/tracking/summary/truck/${truckId}`, { params });
    return response.data;
  },
  
  reverseGeocode: async (lat, lng) => {
    try {
      const response = await api.get('/tracking/reverse-geocode', { params: { lat, lng } });
      return response.data;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return { name: `${lat.toFixed(4)}°, ${lng.toFixed(4)}°` };
    }
  }
};

export default trackingService;