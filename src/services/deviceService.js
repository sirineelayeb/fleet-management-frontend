// frontend/src/services/deviceService.js
import api from './api';

export const deviceService = {
  // Get all devices
  getAll: async (params = {}) => {
    const response = await api.get('/devices', { params });
    return response.data;
  },
  
  // Get single device by ID
  getById: async (id) => {
    const response = await api.get(`/devices/${id}`);
    return response.data;
  },
  
  // Register a new device
  register: async (data) => {
    const response = await api.post('/devices/register', data);
    return response.data;
  },
  
  // Update device
  update: async (id, data) => {
    const response = await api.put(`/devices/${id}`, data);
    return response.data;
  },
  
  // Delete device
  delete: async (id) => {
    const response = await api.delete(`/devices/${id}`);
    return response.data;
  },
  
  assignToTruck: async (deviceId, truckId) => {
    console.log('Assigning device:', deviceId, 'to truck:', truckId);
    const response = await api.post(`/devices/${deviceId}/assign-truck`, { truckId });
    console.log('Assignment response:', response.data);
    return response.data;
  },
  unassignFromTruck: async (deviceId) => {
    const response = await api.patch(`/devices/${deviceId}/unassign`);
    return response.data;
  }
};