// frontend/src/services/authService.js
import api from './api';

export const authService = {
  login: async (email, password) => {
    console.log('AuthService login - sending request');
    
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('AuthService response:', response.data);
      
      // Your backend returns: { success: true, token: "...", data: { user: {...} } }
      return {
        success: true,
        token: response.data.token,
        user: response.data.data?.user || response.data.user
      };
    } catch (error) {
      console.error('AuthService error:', error);
      console.error('Error response:', error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  },
  
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return {
        success: true,
        token: response.data.token,
        user: response.data.data?.user || response.data.user
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  },
  
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      // Your backend returns: { success: true, data: { user: {...} } }
      return response.data.data?.user || response.data.user;
    } catch (error) {
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Optional: Forgot password (if implemented in backend)
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send reset email'
      };
    }
  },
  
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reset password'
      };
    }
  },
  updateMe: async (data) => {
    try {
      const response = await api.put('/auth/me', data);
      // Assuming backend returns { success: true, user: { ... } }
      return {
        success: true,
        user: response.data.user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile',
      };
    }
  },
  updateMe: async (data) => {
  try {
    const response = await api.put('/auth/me', data);
    return {
      success: true,
      user: response.data.user,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update profile',
    };
  }
},

};
