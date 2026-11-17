import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuBell, LuCheckCheck } from 'react-icons/lu';
import { notificationAPI } from '../services/api.js';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationAPI.getInApp();
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Notifications could not be loaded.');
    }
  }, []);

  useEffect(() => {
    const initialLoadId = window.setTimeout(loadNotifications, 0);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadNotifications();
    }, 15000);
    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
    };
  }, [loadNotifications]);

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllInAppRead();
      setNotifications((current) => current.map((notification) => ({ ...notification, readAt: new Date().toISOString() })));
      setUnreadCount(0);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Notifications could not be marked as read.');
    }
  };

  const openNotification = async (notification) => {
    if (!notification.readAt) {
      try {
        await notificationAPI.markInAppRead(notification._id);
        setNotifications((current) => current.map((item) => (
          item._id === notification._id ? { ...item, readAt: new Date().toISOString() } : item
        )));
        setUnreadCount((current) => Math.max(0, current - 1));
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Notification could not be marked as read.');
        return;
      }
    }
    setOpen(false);
    if (notification.task?._id) {
      const query = new URLSearchParams({
        projectId: notification.project._id,
        search: notification.task.title,
        discussionTaskId: notification.task._id,
      });
      navigate(`/tasks?${query.toString()}`);
      return;
    }
    navigate(`/projects/${notification.project._id}/chat`);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen((current) => !current); setError(''); }}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-700"
      >
        <LuBell aria-hidden="true" className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-orange-700 px-1 text-center text-[10px] font-bold leading-4 text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">Notifications</h2>
            <button
              type="button"
              onClick={markAllRead}
              disabled={!unreadCount}
              className="inline-flex items-center gap-1 text-xs font-medium text-orange-800 hover:text-orange-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <LuCheckCheck aria-hidden="true" className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>
          {error && <p role="alert" className="px-4 py-2 text-xs text-rose-700">{error}</p>}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length ? notifications.map((notification) => (
              <button
                type="button"
                key={notification._id}
                onClick={() => openNotification(notification)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-orange-50 ${notification.readAt ? 'bg-white' : 'bg-orange-50/50'}`}
              >
                <span className="flex items-start gap-2">
                  {!notification.readAt && <span aria-label="Unread" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-600" />}
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-slate-800">
                      {notification.actor?.fullname || 'A teammate'} {notification.kind === 'mention' ? 'mentioned you' : 'posted an update'}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                      {notification.project?.name || 'Workspace'}{notification.task?.title ? ` · ${notification.task.title}` : ''}
                    </span>
                    <span className="mt-1 block line-clamp-2 text-xs text-slate-600">{notification.excerpt}</span>
                    <time dateTime={notification.createdAt} className="mt-1 block text-[10px] text-slate-400">
                      {new Date(notification.createdAt).toLocaleString()}
                    </time>
                  </span>
                </span>
              </button>
            )) : (
              <p className="px-4 py-8 text-center text-xs text-slate-500">You are all caught up.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
