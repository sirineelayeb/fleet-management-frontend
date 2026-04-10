// frontend/src/services/api.js

import axios from 'axios';

const api = axios.create({
  baseURL: "https://fleet-management-backend-ptpw.onrender.com/api",
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.headers);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    console.error('API Error Details:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    // Only redirect to login for 401 on auth endpoints or if token is invalid
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      // Don't redirect if it's a login/register attempt
      if (!isAuthEndpoint) {
        console.log('401 Unauthorized - clearing token and redirecting');
        localStorage.removeItem('token');
        // Use navigate instead of window.location for better UX
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
