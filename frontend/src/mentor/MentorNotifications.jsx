import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useSocket } from '../context/SocketContext';
import { notificationService, mentorshipService } from '../services/api';
import {
  Bell, Check, X, Loader2, User, BookOpen, Calendar,
  Star, MessageCircle, Clock, CheckCircle2
} from 'lucide-react';
import { cn } from '../utils/cn';

const typeConfig = {
  mentorship_request:    { icon: User, color: 'bg-blue-50 text-blue-600', label: 'Request' },
  mentorship_accepted:   { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600', label: 'Accepted' },
  mentorship_rejected:   { icon: X, color: 'bg-rose-50 text-rose-600', label: 'Rejected' },
  course_enrolled:       { icon: BookOpen, color: 'bg-violet-50 text-violet-600', label: 'Enrolled' },
  session_booked:        { icon: Calendar, color: 'bg-orange-50 text-orange-600', label: 'Booked' },
  session_cancelled:     { icon: Calendar, color: 'bg-slate-50 text-slate-600', label: 'Cancelled' },
  new_review:            { icon: Star, color: 'bg-amber-50 text-amber-600', label: 'Review' },
  mentor_approved:       { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600', label: 'Approved' },
  student_request:       { icon: User, color: 'bg-blue-50 text-blue-600', label: 'Request' },
  system:                { icon: Bell, color: 'bg-slate-50 text-slate-600', label: 'System' },
};

const MentorNotifications = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => { loadNotifications(); }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNew = (notification) => {
      setNotifications(prev => [notification, ...prev]);
    };

    socket.on('notification_received', handleNew);
    return () => socket.off('notification_received', handleNew);
  }, [socket]);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (notification) => {
    const requestId = notification.metadata?.requestId;
    if (!requestId) return;
    setProcessingIds(prev => new Set(prev).add(notification._id));
    try {
      await mentorshipService.acceptRequest(requestId);
      await notificationService.markRead(notification._id);
      setNotifications(prev =>
        prev.map(n => n._id === notification._id ? { ...n, isRead: true, status: 'accepted' } : n)
      );
    } catch (err) {
      console.error('Failed to accept', err);
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(notification._id); return s; });
    }
  };

  const handleReject = async (notification) => {
    const requestId = notification.metadata?.requestId;
    if (!requestId) return;
    setProcessingIds(prev => new Set(prev).add(notification._id));
    try {
      await mentorshipService.rejectRequest(requestId);
      await notificationService.markRead(notification._id);
      setNotifications(prev =>
        prev.map(n => n._id === notification._id ? { ...n, isRead: true, status: 'rejected' } : n)
      );
    } catch (err) {
      console.error('Failed to reject', err);
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(notification._id); return s; });
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 mb-2">No notifications</h3>
          <p className="text-sm text-slate-400 font-medium">You'll see updates about students, courses, and sessions here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const config = typeConfig[notif.type] || typeConfig.system;
            const Icon = config.icon;
            const isProcessing = processingIds.has(notif._id);
            const hasAction = notif.type === 'mentorship_request' && notif.metadata?.requestId;

            return (
              <div
                key={notif._id}
                className={cn(
                  "bg-white rounded-2xl border shadow-sm p-4 transition-all",
                  notif.isRead ? 'border-slate-100' : 'border-indigo-100 bg-indigo-50/30'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", config.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold", config.color)}>
                        {config.label}
                      </span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-slate-800 font-medium">{notif.content}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>

                    {/* Action buttons for mentorship requests */}
                    {hasAction && !notif.isRead && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleAccept(notif)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all"
                        >
                          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(notif)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 transition-all"
                        >
                          <X className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    )}

                    {notif.status === 'accepted' && (
                      <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                      </span>
                    )}
                    {notif.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-rose-500">
                        <X className="w-3.5 h-3.5" /> Rejected
                      </span>
                    )}
                  </div>

                  {!notif.isRead && !hasAction && (
                    <button
                      onClick={() => handleMarkRead(notif._id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MentorNotifications;
