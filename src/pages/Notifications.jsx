import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationService from '../services/notificationService';
import Pagination from '../components/Common/Pagination';
import { usePagination } from '../hooks/usePagination';
import toast from 'react-hot-toast';
import webSocketService from '../services/websocket';
import { useAuth } from '../context/AuthContext';
import { TrashIcon, CheckIcon } from '@heroicons/react/24/outline';

const Notifications = () => {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [filter, setFilter] = useState('all');
  const { page, limit, goToPage, handleLimitChange } = usePagination(1, 10);

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', filter, page, limit],
    queryFn: () =>
      notificationService.getAll(
        filter === 'unread' ? { read: false } : {},
        page,
        limit
      ),
  });

  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications', 'unreadCount']);
    };

    webSocketService.on('new_notification', handler);
    return () => webSocketService.off('new_notification', handler);
  }, [queryClient]);

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
      toast.success('All marked as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Deleted');
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => notificationService.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All deleted');
    },
  });

  const notifications = data?.notifications || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        Error loading notifications
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* HEADER */}
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Notifications
          </h1>
          <p className="text-sm text-gray-500">
            {total} total notifications
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              goToPage(1);
            }}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
          </select>

          <button
            onClick={() => markAllAsReadMutation.mutate()}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
          >
            <CheckIcon className="h-4 w-4" />
            Mark all read
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                if (window.confirm('Delete all notifications?')) {
                  deleteAllMutation.mutate();
                }
              }}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-2"
            >
              <TrashIcon className="h-4 w-4" />
              Delete all
            </button>
          )}
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-3 mb-6">

        {notifications.length === 0 ? (
          <div className="bg-white border rounded-xl p-10 text-center text-gray-500">
            No notifications found
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className="bg-white border rounded-xl p-4 hover:shadow-sm transition"
            >

              <div className="flex flex-col sm:flex-row sm:justify-between gap-3">

                {/* CONTENT */}
                <div className="flex-1">

                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {n.title}
                    </h3>

                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    {n.message}
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(n.sentAt).toLocaleString()}
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">

                  {!n.read && (
                    <button
                      onClick={() => markAsReadMutation.mutate(n._id)}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Read
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this notification?')) {
                          deleteMutation.mutate(n._id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </button>
                  )}

                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      {total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={pages}
          onPageChange={goToPage}
          onPageSizeChange={handleLimitChange}
          pageSize={limit}
          pageSizeOptions={[5, 10, 25, 50]}
          showFirstLast
          siblingCount={1}
          showPageSizeSelector
          totalItems={total}
        />
      )}
    </div>
  );
};

export default Notifications;