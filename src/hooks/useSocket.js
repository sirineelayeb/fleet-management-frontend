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
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  useSocketEvent('notification', (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50));
    
    // Show toast for important notifications
    if (notification.type === 'alert' || notification.severity === 'high') {
      toast.error(notification.message);
    } else if (notification.type === 'success') {
      toast.success(notification.message);
    } else {
      toast.info(notification.message);
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
