import api from './api';

const notificationService = {
  // Get all notifications with filters
  getAll: async (filters = {}, page = 1, limit = 50) => {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...filters
      });
      const response = await api.get(`/notifications?${params}`);
      // Backend returns { success, count, data, pagination }
      return {
        notifications: response.data.data || [],
        total: response.data.pagination?.total || 0,
        page: response.data.pagination?.page || page,
        pages: response.data.pagination?.pages || 1,
        limit: response.data.pagination?.limit || limit
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      // Backend returns { success, data: { unread: count } }
      return { count: response.data.data?.unread || 0 };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { count: 0 };
    }
  },

  // Mark single notification as read
  markAsRead: async (id) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },

  // Resolve notification (admin only)
  resolve: async (id) => {
    try {
      const response = await api.put(`/notifications/${id}/resolve`);
      return response.data;
    } catch (error) {
      console.error('Error resolving notification:', error);
      throw error;
    }
  },

  // Delete notification (admin only)
  delete: async (id) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
};

export default notificationService;