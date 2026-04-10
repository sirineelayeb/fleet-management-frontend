import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BellIcon } from '@heroicons/react/24/outline';
import notificationService from '../../services/notificationService';
import NotificationDropdown from './NotificationDropdown';
import { useAuth } from '../../context/AuthContext';
import webSocketService from '../../services/websocket';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch unread count
  const { data: unreadData, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000,
    enabled: !!user
  });

  // Fetch recent notifications
  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationService.getAll({}, 1, 10),
    enabled: !!user,
    refetchOnWindowFocus: true
  });

  // ✅ Correct extraction – service returns { count: number }
  const unreadCount = unreadData?.count || 0;
  const notifications = notificationsData?.notifications || [];

  // Handle WebSocket notifications
  useEffect(() => {
    if (!user) return;

    const handleNotification = (notification) => {
      console.log('📢 New notification received:', notification);
      queryClient.invalidateQueries(['notifications', 'unreadCount']);
      queryClient.invalidateQueries(['notifications', 'recent']);
      
      // Show browser notification if supported
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/notification-icon.png'
        });
      }
    };

    webSocketService.connect();
    webSocketService.on('notification', handleNotification);
    webSocketService.on('critical-alert', handleNotification);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      webSocketService.off('notification', handleNotification);
      webSocketService.off('critical-alert', handleNotification);
    };
  }, [user, queryClient]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      queryClient.invalidateQueries(['notifications', 'unreadCount']);
      queryClient.invalidateQueries(['notifications', 'recent']);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      queryClient.invalidateQueries(['notifications', 'unreadCount']);
      queryClient.invalidateQueries(['notifications', 'recent']);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationsPath = () => {
    if (user?.role === 'admin') return '/dashboard/notifications';
    return '/shipment_manager/notifications';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        isOpen={isOpen}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClose={() => setIsOpen(false)}
        onViewAll={() => {
          setIsOpen(false);
          navigate(getNotificationsPath());
        }}
      />
    </div>
  );
};

export default NotificationBell;