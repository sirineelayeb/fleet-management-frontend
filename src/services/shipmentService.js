// frontend/src/services/shipmentService.js
import api from './api';

export const shipmentService = {
  // Get all shipments with optional filters
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/shipments', { params });
      console.log('shipmentService.getAll - response:', response);
      console.log('shipmentService.getAll - response.data:', response.data);
      return response.data; 
    } catch (error) {
      console.error('Error fetching shipments:', error);
      throw error;
    }
  },
  
  // Get single shipment by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/shipments/${id}`);
      return response.data; 
    } catch (error) {
      console.error('Error fetching shipment:', error);
      throw error;
    }
  },
  
  // Create new shipment
  create: async (data) => {
    try {
      const response = await api.post('/shipments', data);
      return response.data; 
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw error;
    }
  },
  
  // Update shipment
  update: async (id, data) => {
    const response = await api.put(`/shipments/${id}`, data);
    return response.data;
  },
    
  // Delete shipment
  delete: async (id) => {
    try {
      const response = await api.delete(`/shipments/${id}`);
      return response.data; 
    } catch (error) {
      console.error('Error deleting shipment:', error);
      throw error;
    }
  },
  
  // Assign shipment to truck and driver
  assign: async (shipmentId, truckId, driverId) => {
    try {
      const response = await api.post('/shipments/assign', { shipmentId, truckId, driverId });
      return response.data; 
    } catch (error) {
      console.error('Error assigning shipment:', error);
      throw error;
    }
  },
  
  // Cancel shipment
  cancel: async (id) => {
    try {
      const response = await api.put(`/shipments/${id}/cancel`);
      return response.data; 
    } catch (error) {
      console.error('Error cancelling shipment:', error);
      throw error;
    }
  },
  
  // Get shipment statistics
  getStats: async () => {
    try {
      const response = await api.get('/shipments/stats');
      return response.data; 
    } catch (error) {
      console.error('Error fetching shipment stats:', error);
      return {
        success: true,
        data: {
          total: 0,
          pending: 0,
          assigned: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0
        }
      };
    }
  },
  
  // Get shipments by status
  getByStatus: async (status) => {
    try {
      const response = await api.get(`/shipments/status/${status}`);
      return response.data; 
    } catch (error) {
      console.error('Error fetching shipments by status:', error);
      throw error;
    }
  },
  
  // Get shipments by truck
  getByTruck: async (truckId) => {
    try {
      const response = await api.get(`/shipments/truck/${truckId}`);
      return response.data; 
    } catch (error) {
      console.error('Error fetching shipments by truck:', error);
      throw error;
    }
  },
  
  // Get shipments by driver
  getByDriver: async (driverId) => {
    try {
      const response = await api.get(`/shipments/driver/${driverId}`);
      return response.data; 
    } catch (error) {
      console.error('Error fetching shipments by driver:', error);
      throw error;
    }
  },
  
  // Get mission for a shipment
  getMission: async (shipmentId) => {
    try {
      const response = await api.get(`/shipments/${shipmentId}/mission`);
      return response.data; 
    } catch (error) {
      console.error('Error fetching shipment mission:', error);
      throw error;
    }
  }
};