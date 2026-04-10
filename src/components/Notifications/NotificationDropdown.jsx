import React from 'react';
import { 
  BellIcon,  
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  CheckIcon 
} from '@heroicons/react/24/outline';

const getSeverityIcon = (severity) => {
  switch (severity) {
    case 'critical':
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    case 'info':
      return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    default:
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
  }
};

const getSeverityBg = (severity) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-50 hover:bg-red-100';
    case 'warning':
      return 'bg-yellow-50 hover:bg-yellow-100';
    case 'info':
      return 'bg-blue-50 hover:bg-blue-100';
    default:
      return 'bg-green-50 hover:bg-green-100';
  }
};

const NotificationDropdown = ({ 
  isOpen, 
  notifications, 
  unreadCount, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onClose,
  onViewAll
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-500">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <CheckIcon className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No notifications</p>
            <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                !notification.read ? getSeverityBg(notification.severity) : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                if (!notification.read) {
                  onMarkAsRead(notification._id);
                }
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {getSeverityIcon(notification.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notification.sentAt).toLocaleString()}
                  </p>
                  {notification.resolved && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-600">
                      <CheckCircleIcon className="h-3 w-3" />
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
          <button
            onClick={() => {
              onClose();
              if (onViewAll) onViewAll();
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;