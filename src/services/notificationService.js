import api from './api';

const notificationService = {
  // Get all notifications with filters
  getAll: async (filters = {}, page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        'sort': '-sentAt'
      });
      
      if (filters.read !== undefined) {
        params.append('read', String(filters.read));
      }
      
      const response = await api.get(`/notifications?${params}`);
      
      return {
        notifications: response.data.data || [],
        total: response.data.pagination?.total || 0,
        page: response.data.pagination?.page || page,
        pages: response.data.pagination?.pages || 1,
        limit: response.data.pagination?.limit || limit
      };
    } catch (error) {
      throw error;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      return { count: response.data.data?.unread || 0 };
    } catch (error) {
      return { count: 0 };
    }
  },

  // Mark single notification as read
  markAsRead: async (id) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Resolve notification (admin only)
  resolve: async (id) => {
    try {
      const response = await api.put(`/notifications/${id}/resolve`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete notification (admin only)
  delete: async (id) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // Delete all notifications (admin only)
  deleteAll: async () => {
    try {
      const response = await api.delete('/notifications');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default notificationService;