// frontend/src/components/Layout/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { UserCircleIcon, ArrowRightOnRectangleIcon, BellIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import notificationService from '../../services/notificationService';
import NotificationDropdown from '../Notifications/NotificationDropdown';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const getProfilePath = () => {
    if (user?.role === 'admin') return '/dashboard/profile';
    if (user?.role === 'shipment_manager') return '/shipment_manager/profile';
    return '/profile'; // fallback
  };
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread count for badge
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000,
  });
  const unreadCount = unreadData?.unread || 0;

  // Fetch recent notifications for dropdown (last 10, unread first, then read)
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'dropdown'],
    queryFn: () => notificationService.getAll({ limit: 10, sort: '-sentAt' }),
    refetchInterval: 30000,
  });
  const notifications = notificationsData?.notifications || [];

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Marked as read');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All notifications marked as read');
    },
  });

  // Role‑specific notifications page path
  const getNotificationsPath = () => {
    if (user?.role === 'admin') return '/dashboard/notifications';
    if (user?.role === 'shipment_manager') return '/shipment_manager/notifications';
    return '/notifications';
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'shipment_manager':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'shipment_manager':
        return 'Shipment Manager';
      default:
        return role;
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="px-6 py-3 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          Fleet Management System
        </h2>

        <div className="flex items-center space-x-4">
          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="relative p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <BellIcon className="h-6 w-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
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
            />
          </div>

          <div className="flex items-center space-x-3">
            <UserCircleIcon
              className="h-8 w-8 text-gray-600 cursor-pointer"
              onClick={() => navigate(getProfilePath())}
            />
            <div>
              <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user?.role)}`}>
                {getRoleLabel(user?.role)}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800 ml-2 flex items-center gap-1"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;