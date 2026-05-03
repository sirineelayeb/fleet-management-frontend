// frontend/src/services/api.js

import axios from 'axios';

// ============================================================
// API BASE URL CONFIGURATION
// ============================================================
// Production URL 
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Development URL (local)
// const API_BASE_URL = "http://localhost:5000/api";

// ============================================================
// AXIOS INSTANCE
// ============================================================
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// REQUEST INTERCEPTOR - Add token to all requests
// ============================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug logging (optional - remove in production)
    if (process.env.NODE_ENV === 'development') {
      // console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// ============================================================
// RESPONSE INTERCEPTOR - Handle errors globally
// ============================================================
api.interceptors.response.use(
  (response) => {
    // Debug logging (optional - remove in production)
    if (process.env.NODE_ENV === 'development') {
      // console.log(`📥 API Response: ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    // Log error details
    console.error('❌ API Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      
      // Don't redirect if it's a login/register attempt
      if (!isAuthEndpoint) {
        // console.log('🔒 401 Unauthorized - Clearing token and redirecting to login');
        localStorage.removeItem('token');
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout - Server might be slow or offline');
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
    console.error('🌐 Network Error - Backend unreachable:', API_BASE_URL);
    }
    
    return Promise.reject(error);
  }
);

export default api;