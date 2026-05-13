import api from './api';

export const shipmentService = {
  // Get all shipments with optional filters
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/shipments', { params });
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
    try {
      const response = await api.put(`/shipments/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating shipment:', error);
      throw error;
    }
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

  // Archive shipment (soft delete)
  archive: async (id) => {
    try {
      const response = await api.patch(`/shipments/${id}/archive`);
      return response.data;
    } catch (error) {
      console.error('Error archiving shipment:', error);
      throw error;
    }
  },

  // Unarchive shipment
  unarchive: async (id) => {
    try {
      const response = await api.patch(`/shipments/${id}/unarchive`);
      return response.data;
    } catch (error) {
      console.error('Error unarchiving shipment:', error);
      throw error;
    }
  },

  getTruckShipments: async (truckId, params) => {
    const response = await api.get(`/shipments/truck/${truckId}`, { params });
    return response.data;
  },
  
  getDriverShipments: async (driverId, params) => {
    const response = await api.get(`/shipments/driver/${driverId}`, { params });
    return response.data;
  },
  
  // ============================================================
  // TRUCK & DRIVER ASSIGNMENT
  // ============================================================
  
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
  
  // Unassign shipment (free truck and driver)
  unassign: async (shipmentId) => {
    try {
      const response = await api.post(`/shipments/${shipmentId}/unassign`);
      return response.data;
    } catch (error) {
      console.error('Error unassigning shipment:', error);
      throw error;
    }
  },
  reassign(shipmentId, truckId, driverId) {
  return api.patch(`/shipments/${shipmentId}/reassign`, { truckId, driverId });
  },
  
  // ============================================================
  // MANAGER ASSIGNMENT (Admin only)
  // ============================================================
  
  // Get unassigned shipments (no manager assigned)
  getUnassignedShipments: async (params = {}) => {
    try {
      const response = await api.get('/shipments/unassigned', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching unassigned shipments:', error);
      throw error;
    }
  },
  
  // Get shipments assigned to current manager
  getMyAssignedShipments: async (params = {}) => {
    try {
      const response = await api.get('/shipments/my-assigned', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching my assigned shipments:', error);
      throw error;
    }
  },
  
  // Assign shipment to a manager
  assignToManager: async (shipmentId, managerId) => {
    try {
      const response = await api.put(`/shipments/${shipmentId}/assign-manager`, { managerId });
      return response.data;
    } catch (error) {
      console.error('Error assigning shipment to manager:', error);
      throw error;
    }
  },
  unassignManager: async (shipmentId) => {
  try {
    const response = await api.delete(`/shipments/${shipmentId}/unassign-manager`);
    return response.data;
  } catch (error) {
    console.error('Error unassigning manager:', error);
    throw error;
  }
  },
  
  // ============================================================
  // SHIPMENT CANCELLATION
  // ============================================================
  
  // Cancel shipment
  cancel: async (id, reason) => {
    try {
      const response = await api.put(`/shipments/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error cancelling shipment:', error);
      throw error;
    }
  },
  
  // ============================================================
  // STATISTICS
  // ============================================================
  
  // Get shipment statistics
  getStats: async () => {
    try {
      const response = await api.get('/shipments/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching shipment stats:', error);
      return {
        success: true,
        stats: {
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
  
  // ============================================================
  // FILTERS & QUERIES
  // ============================================================
  
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
  
  // Get shipments by customer
  getByCustomer: async (customerId) => {
    try {
      const response = await api.get(`/shipments/customer/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching shipments by customer:', error);
      throw error;
    }
  },
  
  // ============================================================
  // MISSION
  // ============================================================
  
  // Get mission for a shipment
  getMission: async (shipmentId) => {
    try {
      const response = await api.get(`/shipments/${shipmentId}/mission`);
      return response.data;
    } catch (error) {
      console.error('Error fetching shipment mission:', error);
      throw error;
    }
  },
  
  // ============================================================
  // NOTES
  // ============================================================
  
  // Add note to shipment
  addNote: async (shipmentId, content) => {
    try {
      const response = await api.post(`/shipments/${shipmentId}/notes`, { content });
      return response.data;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  },
  
  // Get shipment notes
  getNotes: async (shipmentId) => {
    try {
      const response = await api.get(`/shipments/${shipmentId}/notes`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  },

  // Update note
  updateNote: async (shipmentId, noteId, content) => {
    try {
      const response = await api.put(`/shipments/${shipmentId}/notes/${noteId}`, { content });
      return response.data;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },
  
  
  // Delete note
  deleteNote: async (shipmentId, noteId) => {
    try {
      const response = await api.delete(`/shipments/${shipmentId}/notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }
};