// frontend/src/components/Notifications/NotificationDropdown.jsx
import React, { useEffect, useState } from 'react';
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const getSeverityIcon = (severity) => {
  switch (severity) {
    case 'critical': return <XCircleIcon className="h-5 w-5 text-red-500" />;
    case 'warning':  return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    case 'info':     return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    default:         return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
  }
};

const getSeverityBg = (severity) => {
  switch (severity) {
    case 'critical': return 'bg-red-50 hover:bg-red-100';
    case 'warning':  return 'bg-yellow-50 hover:bg-yellow-100';
    case 'info':     return 'bg-blue-50 hover:bg-blue-100';
    default:         return 'bg-green-50 hover:bg-green-100';
  }
};

const NotificationDropdown = ({
  isOpen,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
  onViewAll,
  // bellRef  → ref on the bell <button> in Navbar, used to compute the
  //            fixed position of the desktop panel via getBoundingClientRect.
  bellRef,
  // panelRef → forwarded back so Navbar's click-outside handler can detect
  //            clicks inside this panel even though it's not in Navbar's DOM.
  panelRef,
}) => {
  // Desktop panel position — derived from bell button's viewport rect.
  // Defaults keep the panel visible even if bellRef isn't provided.
  const [pos, setPos] = useState({ top: 64, right: 16 });

  useEffect(() => {
    if (!isOpen || !bellRef?.current) return;
    const r = bellRef.current.getBoundingClientRect();
    setPos({
      top:   r.bottom + 8,
      right: window.innerWidth - r.right,
    });
  }, [isOpen, bellRef]);

  // Lock body scroll on mobile
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const inner = (
    <>
      {/* ── Header ── */}
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-500">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <CheckIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Mark all as read</span>
              <span className="sm:hidden">Read all</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Close notifications"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No notifications</p>
            <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          notifications
          .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
          .slice(0, 5)
          .map((notification) => (
            <div
              key={notification._id}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                !notification.read ? getSeverityBg(notification.severity) : 'hover:bg-gray-50'
              }`}
              onClick={() => { if (!notification.read) onMarkAsRead(notification._id); }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getSeverityIcon(notification.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 leading-snug">
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1.5">
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

      {/* ── Footer ── */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center flex-shrink-0">
          <button
  onClick={() => {
    if (onViewAll) onViewAll();
  }}
  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
>
  View all notifications
</button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/*
        ── MOBILE panel ────────────────────────────────────────────────────
        `position: fixed` escapes every stacking context — including the
        `isolation: isolate` div in Layout.jsx that wraps the Navbar.
        top-14 = 56px navbar height.
      */}
      <div
        className="sm:hidden fixed inset-x-2 top-14 z-[230] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 72px)' }}
        ref={panelRef}
      >
        {inner}
      </div>

      {/*
        ── DESKTOP panel ───────────────────────────────────────────────────
        `position: fixed` with coordinates from bellRef.getBoundingClientRect().

        WHY NOT absolute: the old <div className="relative"> wrapper in
        Navbar created a positioned ancestor inside the `isolation: isolate`
        stacking context. Any absolute child was caged inside it and could
        never paint above the map, regardless of z-index.

        WHY NOT a wrapper div: removing the `relative` wrapper entirely and
        using fixed + JS-computed coordinates means the panel is positioned
        in the viewport root stacking context — completely outside the
        isolation cage — so z-[230] works as intended.
      */}
      <div
        className="hidden sm:flex flex-col fixed z-[230] w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
        style={{ top: pos.top, right: pos.right, maxHeight: '480px' }}
        ref={panelRef}
      >
        {inner}
      </div>
    </>
  );
};

export default NotificationDropdown;