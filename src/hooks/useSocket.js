import { useEffect, useState } from 'react';
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
 * Hook for real-time notifications
 * ✅ Updated to listen for 'new_notification' event
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  // ✅ Listen for 'new_notification' (not 'notification')
  useSocketEvent('new_notification', (notification) => {
    console.log('🔔 New notification received:', notification);
    
    setNotifications(prev => [notification, ...prev].slice(0, 50));
    
    // Show toast based on severity
    if (notification.severity === 'critical') {
      toast.error(notification.message, { duration: 8000 });
    } else if (notification.severity === 'warning') {
      toast(notification.message, { icon: '⚠️', duration: 6000 });
    } else {
      toast.success(notification.message, { duration: 5000 });
    }
  }, []);

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