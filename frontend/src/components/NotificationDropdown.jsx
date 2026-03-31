import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageSquare,
  Reply,
  Bell,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../utils/cn';
import { notificationService } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { useSocket } from '../context/SocketContext';

const typeConfig = {
  like: { icon: Heart, iconClass: 'text-rose-500 fill-rose-500', bgClass: 'bg-rose-50', label: 'liked your post' },
  comment: { icon: MessageSquare, iconClass: 'text-indigo-500 fill-indigo-500', bgClass: 'bg-indigo-50', label: 'commented on your post' },
  reply: { icon: Reply, iconClass: 'text-emerald-500', bgClass: 'bg-emerald-50', label: 'replied to your comment' },
  system: { icon: Bell, iconClass: 'text-slate-500', bgClass: 'bg-slate-50', label: 'system notification' },
  follow: { icon: UserPlus, iconClass: 'text-indigo-500', bgClass: 'bg-indigo-50', label: 'wants to follow you' },
  mentorship_request: { icon: UserPlus, iconClass: 'text-violet-500', bgClass: 'bg-violet-50', label: 'sent a mentorship request' },
  mentorship_accepted: { icon: CheckCircle2, iconClass: 'text-emerald-500', bgClass: 'bg-emerald-50', label: 'accepted your mentorship request' },
  mentorship_rejected: { icon: XCircle, iconClass: 'text-rose-500', bgClass: 'bg-rose-50', label: 'declined your mentorship request' },
  course_enrolled: { icon: Bell, iconClass: 'text-sky-500', bgClass: 'bg-sky-50', label: 'enrolled in your course' },
  session_booked: { icon: Clock, iconClass: 'text-amber-500', bgClass: 'bg-amber-50', label: 'booked a session' },
  new_review: { icon: Bell, iconClass: 'text-yellow-500', bgClass: 'bg-yellow-50', label: 'left a review' },
  mentor_approved: { icon: CheckCircle2, iconClass: 'text-emerald-500', bgClass: 'bg-emerald-50', label: 'your mentor application was approved' },
};

const NotificationDropdown = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const socket = useSocket();
  const { decrementCount, refreshCount } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications((data.notifications || data).slice(0, 8));
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  // Real-time socket listener
  useEffect(() => {
    if (!socket) return;
    const handleNew = (notification) => {
      setNotifications(prev => {
        const updated = [notification, ...prev.filter(n => n._id !== notification._id)];
        return updated.slice(0, 8);
      });
    };
    socket.on('notification_received', handleNew);
    return () => socket.off('notification_received', handleNew);
  }, [socket]);

  // Click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      decrementCount(1);
      refreshCount();
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      refreshCount();
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleClick = (notification) => {
    if (!notification.isRead) handleMarkRead(notification._id);
    onClose();
    if (notification.post) navigate(`/post/${notification.post}`);
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[calc(100vw-20px)] sm:w-[360px] md:w-[400px] lg:w-[420px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 z-[100] overflow-hidden animate-dropdown"
      style={{ maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 shrink-0">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">Notifications</h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto custom-scrollbar flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No notifications yet</p>
            <p className="text-xs text-slate-400 mt-1">You'll see activity here</p>
          </div>
        ) : (
          <div className="py-1">
            {notifications.map((n) => {
              const config = typeConfig[n.type] || typeConfig.system;
              const TypeIcon = config.icon;
              const timeAgo = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true });

              return (
                <button
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    'w-full flex items-start gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-50 transition-colors text-left',
                    !n.isRead && 'bg-indigo-50/50'
                  )}
                >
                  <div className="relative shrink-0">
                    <img
                      src={n.senderAvatar || 'https://ui-avatars.com/api/?name=User&background=random'}
                      alt={n.senderName || 'User'}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-100"
                    />
                    <div className={cn('absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full border-2 border-white', config.bgClass)}>
                      <TypeIcon className={cn('w-2.5 h-2.5 sm:w-3 sm:h-3', config.iconClass)} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-[13px] leading-snug">
                      <span className="font-semibold text-slate-900">{n.senderName}</span>
                      <span className="text-slate-500 ml-1">{config.label}</span>
                    </p>
                    {(n.type === 'comment' || n.type === 'reply') && n.content && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 font-medium">
                        &ldquo;{n.content}&rdquo;
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">{timeAgo}</span>
                      {!n.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0"></span>}
                    </div>
                  </div>
                  {n.post && <ExternalLink className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-slate-100 p-2 shrink-0">
          <button
            onClick={() => { onClose(); navigate('/notifications'); }}
            className="w-full py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
          >
            See all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
