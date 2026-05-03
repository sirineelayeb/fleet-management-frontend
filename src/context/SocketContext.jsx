// frontend/src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import webSocketService from '../services/websocket';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && !initialized.current) {
      initialized.current = true;
      console.log('🔌 Initializing WebSocket connection from SocketProvider...');
      webSocketService.connect();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated && initialized.current) {
      webSocketService.disconnect();
      initialized.current = false;
    }
  }, [isAuthenticated]);

  const value = {
    socket: webSocketService,
    isConnected: webSocketService.isConnected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};