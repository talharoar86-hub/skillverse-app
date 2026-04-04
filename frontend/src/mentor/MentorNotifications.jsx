import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useSocket } from '../context/SocketContext';
import { notificationService, mentorshipService } from '../services/api';
import {
  Bell, Check, X, Loader2, User, BookOpen, Calendar,
  Star, MessageCircle, Clock, CheckCircle2, Filter, Trash2, ChevronLeft, ChevronRight
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

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'mentorship_request', label: 'Requests' },
  { key: 'course_enrolled', label: 'Enrollments' },
  { key: 'session_booked', label: 'Sessions' },
  { key: 'new_review', label: 'Reviews' },
];

const PAGE_SIZE = 20;

const MentorNotifications = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

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
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = notifications;
    if (filter === 'unread') {
      result = result.filter(n => !n.isRead);
    } else if (filter !== 'all') {
      result = result.filter(n => n.type === filter);
    }
    return result;
  }, [notifications, filter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;

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

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Failed to delete', err);
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

  useEffect(() => { setPage(1); }, [filter]);

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
      <div className="flex items-center justify-between flex-wrap gap-3">
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

      {/* Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400 mr-1" />
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
              filter === opt.key
                ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {paginated.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 mb-2">No notifications</h3>
          <p className="text-sm text-slate-400 font-medium">
            {filter !== 'all' ? 'No notifications match this filter.' : 'You\'ll see updates about students, courses, and sessions here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map(notif => {
            const config = typeConfig[notif.type] || typeConfig.system;
            const Icon = config.icon;
            const isProcessing = processingIds.has(notif._id);
            const hasAction = notif.type === 'mentorship_request' && notif.metadata?.requestId && !notif.isRead;

            return (
              <div
                key={notif._id}
                className={cn(
                  "bg-white rounded-2xl border shadow-sm p-4 transition-all group",
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

                    {hasAction && (
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

                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && !hasAction && (
                      <button
                        onClick={() => handleMarkRead(notif._id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Mark read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif._id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-slate-600">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentorNotifications;
