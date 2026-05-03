import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import webSocketService from '../services/websocket';
import toast from 'react-hot-toast';

/**
 * Hook to listen to real-time events
 */
export const useSocketEvent = (eventName, callback, dependencies = []) => {
  useEffect(() => {
    if (!callback) return;
    
    webSocketService.on(eventName, callback);
    
    return () => {
      webSocketService.off(eventName, callback);
    };
  }, [eventName, callback, ...dependencies]);
};

/**
 * Hook to get real-time data updates
 */
export const useRealtimeData = (eventName) => {
  const [data, setData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useSocketEvent(eventName, (newData) => {
    setData(newData);
    setLastUpdate(new Date());
  }, []);

  return { data, lastUpdate };
};

/**
 * Hook for real-time notifications with user filtering
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  // Helper function to check if notification is for current user
  const isNotificationForCurrentUser = (notification) => {
    if (!user) return false;
    
    // Check if notification has targetRoles
    if (notification.targetRoles && notification.targetRoles.length > 0) {
      // If targetRoles includes 'admin' or 'shipment_manager', check user role
      if (notification.targetRoles.includes('admin') && user.role === 'admin') {
        return true;
      }
      if (notification.targetRoles.includes('shipment_manager') && user.role === 'shipment_manager') {
        return true;
      }
      // If targetRoles includes both, any admin or manager can see it
      if (notification.targetRoles.includes('admin') && notification.targetRoles.includes('shipment_manager')) {
        return user.role === 'admin' || user.role === 'shipment_manager';
      }
    }
    
    // Check if notification is manager-specific (has managerId)
    if (notification.data?.managerId) {
      return notification.data.managerId === user._id;
    }
    
    // Default: show for all authenticated users
    return true;
  };

  useSocketEvent('new_notification', (notification) => {
    console.log('🔔 New notification received:', notification);
    console.log('📋 Notification targetRoles:', notification.targetRoles);
    console.log('📋 Current user role:', user?.role);
    console.log('📋 Current user ID:', user?._id);
    
    // Check if this notification is meant for the current user
    const isForMe = isNotificationForCurrentUser(notification);
    
    if (isForMe) {
      console.log('✅ Notification is for current user, showing toast');
      
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      
      // Show toast based on severity
      if (notification.severity === 'critical') {
        toast.error(notification.message, { duration: 8000 });
      } else if (notification.severity === 'warning') {
        toast(notification.message, { icon: '⚠️', duration: 6000 });
      } else {
        toast.success(notification.message, { duration: 5000 });
      }
    } else {
      console.log('🔕 Notification filtered out for current user');
    }
  }, [user]);

  const clearNotifications = () => setNotifications([]);
  
  return { notifications, clearNotifications };
};

/**
 * Hook for live fleet updates
 */
export const useLiveFleet = () => {
  const [trucks, setTrucks] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useSocketEvent('truck:updated', (truck) => {
    setTrucks(prev => {
      const index = prev.findIndex(t => t._id === truck._id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = truck;
        return updated;
      }
      return [...prev, truck];
    });
  }, []);

  useSocketEvent('shipment:updated', (shipment) => {
    setShipments(prev => {
      const index = prev.findIndex(s => s._id === shipment._id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = shipment;
        return updated;
      }
      return [...prev, shipment];
    });
  }, []);

  useSocketEvent('alert:new', (alert) => {
    setAlerts(prev => [alert, ...prev].slice(0, 100));
  }, []);

  return { trucks, shipments, alerts, setTrucks, setShipments, setAlerts };
};