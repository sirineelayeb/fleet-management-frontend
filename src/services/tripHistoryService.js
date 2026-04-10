// frontend/src/services/tripHistoryService.js
import api from './api';

export const tripHistoryService = {
  // Get all trips (admin only)
  getAllTrips: async (params = {}) => {
    const response = await api.get('/trips/all', { params });
    return response.data;
  },

  // Get trips for a specific truck
  getTruckTrips: async (truckId, params = {}) => {
    const response = await api.get(`/trips/truck/${truckId}`, { params });
    return response.data;
  },

  // Get trips for a specific driver
  getDriverTrips: async (driverId, params = {}) => {
    const response = await api.get(`/trips/driver/${driverId}`, { params });
    return response.data;
  },

  // Get trip statistics (admin only)
  getTripStats: async (params = {}) => {
    const response = await api.get('/trips/stats', { params });
    return response.data;
  },

  // Get trip route data for map (returns route.points array of {lat, lng})
  getTripRoute: async (tripId) => {
    const response = await api.get(`/trips/${tripId}/route`);
    return response.data;
  },

  // Get full trip with route (same as above, but may include more details)
  getTripWithRoute: async (tripId) => {
    const response = await api.get(`/trips/${tripId}`);
    return response.data;
  },

  // Get live tracking for a truck
  getLiveTracking: async (truckId) => {
    const response = await api.get(`/trips/live/${truckId}`);
    return response.data;
  },

  // Get driver trip stats
  getDriverTripStats: async (driverId, params = {}) => {
    const response = await api.get(`/trips/driver/${driverId}/stats`, { params });
    return response.data;
  },

  // Get truck trip stats
  getTruckTripStats: async (truckId, params = {}) => {
    const response = await api.get(`/trips/truck/${truckId}/stats`, { params });
    return response.data;
  },
};