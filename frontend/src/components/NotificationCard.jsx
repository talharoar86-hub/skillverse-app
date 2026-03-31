import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageSquare,
  Reply,
  Bell,
  Trash2,
  Clock,
  Eye,
  ExternalLink,
  UserPlus,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../utils/cn';
import { followService } from '../services/api';

const typeConfig = {
  like: {
    icon: Heart,
    iconClass: 'text-rose-500 fill-rose-500',
    bgClass: 'bg-rose-50',
    label: 'liked your post',
    accentClass: 'bg-rose-500',
  },
  comment: {
    icon: MessageSquare,
    iconClass: 'text-indigo-500 fill-indigo-500',
    bgClass: 'bg-indigo-50',
    label: 'commented on your post',
    accentClass: 'bg-indigo-500',
  },
  reply: {
    icon: Reply,
    iconClass: 'text-emerald-500',
    bgClass: 'bg-emerald-50',
    label: 'replied to your comment',
    accentClass: 'bg-emerald-500',
  },
  system: {
    icon: Bell,
    iconClass: 'text-slate-500',
    bgClass: 'bg-slate-50',
    label: 'system notification',
    accentClass: 'bg-slate-500',
  },
  follow: {
    icon: UserPlus,
    iconClass: 'text-indigo-500',
    bgClass: 'bg-indigo-50',
    label: 'wants to follow you',
    accentClass: 'bg-indigo-500',
  },
};

const NotificationCard = ({ notification, onMarkRead, onDelete }) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [followHandled, setFollowHandled] = useState(notification.status && notification.status !== 'pending');

  const config = typeConfig[notification.type] || typeConfig.system;
  const TypeIcon = config.icon;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  const hasPost = !!notification.post;

  const handleMarkRead = (e) => {
    e.stopPropagation();
    if (!notification.isRead) {
      onMarkRead(notification._id);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setIsDeleting(true);
    await onDelete(notification._id);
  };

  const handleViewPost = (e) => {
    e.stopPropagation();
    if (!notification.isRead) {
      onMarkRead(notification._id);
    }
    navigate(`/post/${notification.post}`);
  };

  const handleReply = (e) => {
    e.stopPropagation();
    if (!notification.isRead) {
      onMarkRead(notification._id);
    }
    navigate(`/post/${notification.post}?reply=true`);
  };

  const handleAcceptFollow = async (e) => {
    e.stopPropagation();
    if (followHandled) return;
    try {
      const result = await followService.acceptFollow(notification.metadata?.followId);
      setFollowHandled(true);
      if (!notification.isRead) {
        onMarkRead(notification._id);
      }
      if (result.conversation) {
        navigate(`/messages/${result.conversation._id || result.conversation}`);
      }
    } catch (err) {
      console.error('Accept follow failed', err);
    }
  };

  const handleRejectFollow = async (e) => {
    e.stopPropagation();
    if (followHandled) return;
    try {
      await followService.rejectFollow(notification.metadata?.followId);
      setFollowHandled(true);
      if (!notification.isRead) {
        onMarkRead(notification._id);
      }
    } catch (err) {
      console.error('Reject follow failed', err);
    }
  };

  const handleCardClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification._id);
    }
    if (notification.post) {
      navigate(`/post/${notification.post}`);
    }
  };

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer',
        notification.isRead
          ? 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
          : 'bg-white border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-200',
        isDeleting && 'opacity-0 scale-95 pointer-events-none'
      )}
      style={{ transition: 'opacity 200ms, transform 200ms, box-shadow 200ms, border-color 200ms' }}
      onClick={handleCardClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Unread indicator bar */}
      {!notification.isRead && (
        <div className={cn('absolute left-0 top-4 bottom-4 w-[3px] rounded-full', config.accentClass)} />
      )}

      {/* Avatar with type badge */}
      <div className="relative shrink-0">
        <img
          src={notification.senderAvatar || '/default-avatar.png'}
          alt={notification.senderName || 'User'}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow-sm"
        />
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 p-1 rounded-full border-2 border-white shadow-sm',
            config.bgClass
          )}
        >
          <TypeIcon className={cn('w-3 h-3', config.iconClass)} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm sm:text-[15px] leading-snug">
              <span className="font-semibold text-slate-900">{notification.senderName}</span>
              <span className="text-slate-500 ml-1 font-medium">{config.label}</span>
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400 font-medium">{timeAgo}</span>
              {!notification.isRead && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full uppercase tracking-wide ml-1">
                  New
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content snippet for comments/replies */}
        {(notification.type === 'comment' || notification.type === 'reply') && notification.content && (
          <div className="mt-2 p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium">
              &ldquo;{notification.content}&rdquo;
            </p>
          </div>
        )}

        {/* Follow request Accept/Reject buttons */}
        {notification.type === 'follow' && !followHandled && notification.status === 'pending' && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleAcceptFollow}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors active:scale-95 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={handleRejectFollow}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors active:scale-95 border border-rose-200"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}

        {/* Follow status badge after handled */}
        {notification.type === 'follow' && (followHandled || (notification.status && notification.status !== 'pending')) && (
          <div className="mt-2">
            <span className={cn(
              "inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg",
              (notification.status === 'accepted' || followHandled && notification.status !== 'rejected')
                ? "text-emerald-600 bg-emerald-50"
                : "text-rose-600 bg-rose-50"
            )}>
              {(notification.status === 'accepted' || followHandled && notification.status !== 'rejected')
                ? <><CheckCircle2 className="w-3.5 h-3.5" /> Accepted</>
                : <><XCircle className="w-3.5 h-3.5" /> Declined</>
              }
            </span>
          </div>
        )}

        {/* Quick Actions - visible on hover */}
        <div
          className={cn(
            'flex items-center gap-1.5 mt-2.5 transition-all duration-150',
            showActions ? 'opacity-100' : 'opacity-0 sm:opacity-0'
          )}
        >
          {!notification.isRead && (
            <button
              onClick={handleMarkRead}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mark read</span>
            </button>
          )}
          {hasPost && (
            <button
              onClick={handleViewPost}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View post</span>
            </button>
          )}
          {hasPost && (notification.type === 'comment' || notification.type === 'reply') && (
            <button
              onClick={handleReply}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors active:scale-95"
            >
              <Reply className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reply</span>
            </button>
          )}
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Always-visible delete button (desktop) */}
      <button
        onClick={handleDelete}
        className={cn(
          'hidden sm:flex absolute right-3 top-3 p-2 rounded-lg transition-all active:scale-95',
          showActions
            ? 'opacity-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50'
            : 'opacity-0 text-slate-300'
        )}
        aria-label="Delete notification"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default NotificationCard;
