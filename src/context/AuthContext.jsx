// frontend/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

const loadUser = async () => {
  try {
    const userData = await authService.getMe();
    console.log('User data from backend:', userData); // Debug log

    const normalizedUser = {
      ...userData,
      _id: userData._id || userData.id,
    };

    if (!normalizedUser._id) {
      console.error('User ID missing from:', userData);
      throw new Error('Invalid user data: missing ID');
    }

    setUser(normalizedUser);
  } catch (error) {
    console.error('Load user error:', error);
    localStorage.removeItem('token');
  } finally {
    setLoading(false);
  }
};

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success) {
      localStorage.setItem('token', result.token);
      setUser(result.user);
    }
    return result;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user,
      setUser, 
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isShipmentManager: user?.role === 'shipment_manager'
    }}>
      {children}
    </AuthContext.Provider>
  );
};
