import api from './api';

export const customerService = {
  // Get all customers with pagination and filters
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/customers', { params });
      // The API returns: { success: true, data: [...], pagination: {...} }
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },
   
  getCustomersWithLocation: async () => {
    try {
      const response = await api.get('/customers', { params: { hasLocation: true } });
      return response.data;
    } catch (error) {
      console.error('Error fetching customers with location:', error);
      throw error;
    }
  },

  // Search customers (for dropdowns)
  search: async (query, limit = 20) => {
    try {
      const response = await api.get('/customers/search', { params: { q: query, limit } });
      return response.data;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  },

  // Get single customer
  getById: async (id) => {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },

  // Create customer
  create: async (data) => {
    try {
      const response = await api.post('/customers', data);
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  // Update customer
  update: async (id, data) => {
    try {
      const response = await api.put(`/customers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  // Delete customer
  delete: async (id) => {
    try {
      const response = await api.delete(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  // Archive customer
  archive: async (id) => {
    try {
      const response = await api.patch(`/customers/${id}/archive`);
      return response.data;
    } catch (error) {
      console.error('Error archiving customer:', error);
      throw error;
    }
  },

  // Restore customer
  restore: async (id) => {
    try {
      const response = await api.patch(`/customers/${id}/restore`);
      return response.data;
    } catch (error) {
      console.error('Error restoring customer:', error);
      throw error;
    }
  },

  // Get customer statistics
  getStats: async () => {
    try {
      const response = await api.get('/customers/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      throw error;
    }
  },

  // Bulk import customers
  bulkImport: async (customers) => {
    try {
      const response = await api.post('/customers/bulk-import', { customers });
      return response.data;
    } catch (error) {
      console.error('Error bulk importing customers:', error);
      throw error;
    }
  }
};