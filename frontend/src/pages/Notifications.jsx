import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  Settings,
  ChevronLeft,
  Filter,
  Loader2,
  Inbox,
} from 'lucide-react';
import { notificationService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationCard from '../components/NotificationCard';
import { cn } from '../utils/cn';

const filterTabs = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'like', label: 'Likes' },
  { key: 'comment', label: 'Comments' },
  { key: 'reply', label: 'Replies' },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const socket = useSocket();
  const navigate = useNavigate();
  const { decrementCount, resetCount } = useNotifications();

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };
    socket.on('notification_received', handleNewNotification);
    return () => socket.off('notification_received', handleNewNotification);
  }, [socket]);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      const wasUnread = notifications.find((n) => n._id === id && !n.isRead);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      if (wasUnread) {
        decrementCount(1);
      }
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      resetCount();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const wasUnread = notifications.find((n) => n._id === id && !n.isRead);
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (wasUnread) {
        decrementCount(1);
      }
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.isRead;
    return n.type === activeFilter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] px-4">
        <div className="relative">
          <div className="w-14 h-14 border-[3px] border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
        </div>
        <p className="mt-5 text-sm text-slate-500 font-semibold animate-pulse">
          Loading notifications...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Back Link */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 transition-colors text-sm font-semibold mb-5 group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Home
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[28px] h-7 bg-indigo-600 text-white text-xs font-bold px-2 rounded-full shadow-lg shadow-indigo-200/50">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Stay updated with your latest activity
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200/50 active:scale-95"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1 hide-scrollbar">
        {filterTabs.map((tab) => {
          const count =
            tab.key === 'all'
              ? notifications.length
              : tab.key === 'unread'
              ? unreadCount
              : notifications.filter((n) => n.type === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all active:scale-95',
                activeFilter === tab.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    'text-[11px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center',
                    activeFilter === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 sm:p-16 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Inbox className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {activeFilter === 'all'
              ? 'No notifications yet'
              : activeFilter === 'unread'
              ? 'All caught up!'
              : `No ${activeFilter} notifications`}
          </h3>
          <p className="text-slate-400 mt-1.5 text-sm font-medium max-w-xs mx-auto">
            {activeFilter === 'all'
              ? 'When people interact with your content, you will see it here.'
              : activeFilter === 'unread'
              ? 'You have read all your notifications. Nice work!'
              : `You don't have any ${activeFilter} notifications right now.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((n) => (
            <NotificationCard
              key={n._id}
              notification={n}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Footer info */}
      {filteredNotifications.length > 0 && (
        <p className="text-center text-xs text-slate-400 font-medium mt-6">
          Showing {filteredNotifications.length} notification
          {filteredNotifications.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default Notifications;
