import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationService from '../services/notificationService';
import Pagination from '../components/Common/Pagination';
import { usePagination } from '../hooks/usePagination';
import { 
  BellIcon,  
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import webSocketService from '../services/websocket';
import { useAuth } from '../context/AuthContext';

const getSeverityIcon = (severity) => {
  switch (severity) {
    case 'critical': return <XCircleIcon className="h-6 w-6 text-red-500" />;
    case 'warning': return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
    case 'info': return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
    default: return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
  }
};

const Notifications = () => {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth()
  const [filter, setFilter] = useState('all');
  const { page, limit, goToPage, handleLimitChange } = usePagination(1, 10);

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', filter, page, limit],
    queryFn: () => notificationService.getAll(
      filter === 'unread' ? { read: false } : {},
      page,
      limit
    )
  });
  useEffect(() => {
  const handleNewNotification = () => {
    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries(['notifications', 'unreadCount']);
  };

  webSocketService.on('new_notification', handleNewNotification);

  return () => {
    webSocketService.off('new_notification', handleNewNotification);
  };
}, [queryClient]);
  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications', 'unreadCount']);
      toast.success('Marked as read');
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications', 'unreadCount']);
      toast.success('All notifications marked as read');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications', 'unreadCount']);
      toast.success('Notification deleted');
    }
  });
  const deleteAllMutation = useMutation({
  mutationFn: () => notificationService.deleteAll(),
  onSuccess: () => {
    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries(['notifications', 'unreadCount']);
    toast.success('All notifications deleted');
  }
  });

  const notifications = data?.notifications || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        Error loading notifications: {error.message}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">{total} total notifications</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              goToPage(1); // Reset to page 1 when changing filter
            }}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
          </select>
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <CheckIcon className="h-4 w-4" />
            Mark all as read
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                if (window.confirm('Delete all notifications?')) {
                  deleteAllMutation.mutate();
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
              Delete all
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications found</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-white rounded-lg shadow-sm border p-4 transition ${
                !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getSeverityIcon(notification.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <p className="text-gray-600 mt-1 whitespace-pre-line">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.sentAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={() => markAsReadMutation.mutate(notification._id)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                          title="Mark as read"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this notification?')) {
                              deleteMutation.mutate(notification._id);
                            }
                          }}
                          className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Component */}
      {total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={pages}
          onPageChange={goToPage}
          onPageSizeChange={handleLimitChange}
          pageSize={limit}
          pageSizeOptions={[5, 10, 25, 50]}
          showFirstLast={true}
          siblingCount={1}
          showPageSizeSelector={true}
          totalItems={total}
        />
      )}
    </div>
  );
};

export default Notifications;