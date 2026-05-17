// frontend/src/components/Layout/Navbar.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import webSocketService from '../../services/websocket';
import NotificationDropdown from '../Notifications/NotificationDropdown';

const Navbar = ({ isDark, onToggleDark }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const bellRef = useRef(null);
  const panelRef = useRef(null);

  const getProfilePath = () => {
    if (user?.role === 'admin') return '/dashboard/profile';
    if (user?.role === 'shipment_manager') return '/shipment_manager/profile';
    return '/profile';
  };

  const getNotificationsPath = () => {
    if (user?.role === 'admin') return '/dashboard/notifications';
    if (user?.role === 'shipment_manager') return '/shipment_manager/notifications';
    return '/notifications';
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':            return 'bg-teal-100 text-teal-800';
      case 'shipment_manager': return 'bg-blue-100 text-blue-800';
      default:                 return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':            return 'Administrator';
      case 'shipment_manager': return 'Shipment Manager';
      default:                 return role;
    }
  };

  const isNotificationForCurrentUser = (notification) => {
    if (!user) return false;
    if (notification.targetRoles?.length > 0) {
      if (notification.targetRoles.includes('admin') && user.role === 'admin') return true;
      if (notification.targetRoles.includes('shipment_manager') && user.role === 'shipment_manager') return true;
      if (notification.targetRoles.includes('admin') && notification.targetRoles.includes('shipment_manager')) {
        return user.role === 'admin' || user.role === 'shipment_manager';
      }
    }
    if (notification.data?.managerId) return notification.data.managerId === user._id;
    return true;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedBell = bellRef.current?.contains(event.target);
      const clickedPanel = panelRef.current?.contains(event.target);
      if (!clickedBell && !clickedPanel) setIsDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    const handleNewNotification = (notification) => {
      queryClient.invalidateQueries(['notifications', 'unreadCount']);
      queryClient.invalidateQueries(['notifications', 'dropdown']);
      if (!isNotificationForCurrentUser(notification)) return;
      if (notification.severity === 'critical') {
        toast.error(notification.message, { duration: 8000 });
      } else if (notification.severity === 'warning') {
        toast(notification.message, { icon: '⚠️', duration: 6000 });
      } else {
        toast.success(notification.message, { duration: 5000 });
      }
    };
    webSocketService.on('new_notification', handleNewNotification);
    return () => webSocketService.off('new_notification', handleNewNotification);
  }, [user, queryClient]);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count || 0;

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'dropdown'],
    queryFn: () => notificationService.getAll({ limit: 10, sort: '-sentAt' }),
    refetchInterval: 30000,
  });

  const notifications = notificationsData?.notifications || [];

  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const handleLogout = () => {
    webSocketService.disconnect();
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-[#1E1E2C] border-b border-gray-200 dark:border-white/10 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">

        <h2 className="truncate pl-12 text-base font-semibold text-gray-800 dark:text-white lg:pl-0 lg:text-xl">
          Fleet Management System
        </h2>

        <div className="flex items-center space-x-1 lg:space-x-3">

          {/* Dark / Light toggle */}
          <button
            onClick={onToggleDark}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
          >
            {isDark ? (
              <SunIcon className="h-5 w-5 text-[#E0B50F]" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {/* Bell */}
          <button
            ref={bellRef}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#F29F67] text-xs text-white font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={isDropdownOpen}
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
            onMarkAllAsRead={() => markAllAsReadMutation.mutate()}
            onClose={() => setIsDropdownOpen(false)}
            onViewAll={() => {
              setIsDropdownOpen(false);
              navigate(getNotificationsPath());
            }}
            bellRef={bellRef}
            panelRef={panelRef}
          />

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-white/10" />

          {/* User info */}
          <div className="flex items-center space-x-2">
            <UserCircleIcon
              className="h-8 w-8 cursor-pointer flex-shrink-0 text-gray-500 dark:text-gray-300 hover:text-[#34B1AA] dark:hover:text-[#34B1AA] transition-colors"
              onClick={() => navigate(getProfilePath())}
            />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {user?.name || 'User'}
              </p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(user?.role)}`}>
                {getRoleLabel(user?.role)}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="ml-1 flex items-center gap-1 text-gray-400 hover:text-[#F29F67] dark:hover:text-[#F29F67] transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span className="hidden text-sm sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;