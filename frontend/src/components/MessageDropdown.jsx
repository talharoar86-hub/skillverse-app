import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../utils/cn';
import { messageService } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getAvatarUrl } from '../utils/avatar';

const MessageDropdown = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await messageService.getConversations();
      setConversations((data.conversations || data).slice(0, 8));
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchConversations();
  }, [isOpen, fetchConversations]);

  // Real-time socket listener
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message) => {
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv._id === message.conversation) {
            return {
              ...conv,
              lastMessage: message,
              unreadCount: (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        });
        updated.sort((a, b) => {
          const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : 0;
          const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : 0;
          return bTime - aTime;
        });
        return updated;
      });
    };
    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
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

  // Reset search on close
  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  const getOtherParticipant = (conversation) => {
    if (!conversation.participants) return null;
    return conversation.participants.find(p => (p._id || p) !== user._id);
  };

  const filteredConversations = searchQuery
    ? conversations.filter(c => {
        const other = getOtherParticipant(c);
        return other?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : conversations;

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[calc(100vw-20px)] sm:w-[360px] md:w-[400px] lg:w-[420px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 z-[100] overflow-hidden animate-dropdown"
      style={{ maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Messages</h2>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 focus:ring-2 focus:ring-indigo-50/50 focus:outline-none rounded-xl py-2 pl-9 pr-8 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="overflow-y-auto custom-scrollbar flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? 'Try a different search' : 'Start a conversation'}
            </p>
          </div>
        ) : (
          <div className="py-1">
            {filteredConversations.map((conversation) => {
              const other = getOtherParticipant(conversation);
              const lastMsg = conversation.lastMessage;
              const hasUnread = conversation.unreadCount > 0;

              return (
                <button
                  key={conversation._id}
                  onClick={() => { onClose(); navigate(`/messages/${conversation._id}`); }}
                  className={cn(
                    'w-full flex items-start gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-50 transition-colors text-left',
                    hasUnread && 'bg-indigo-50/30'
                  )}
                >
                  <div className="relative shrink-0">
                    <img
                      src={getAvatarUrl(other)}
                      alt={other?.name || 'User'}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-slate-100"
                    />
                    {other?.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={cn(
                        'text-sm truncate',
                        hasUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                      )}>
                        {other?.name || 'Unknown User'}
                      </p>
                      {lastMsg?.createdAt && (
                        <span className="text-[11px] text-slate-400 font-medium shrink-0 ml-2">
                          {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={cn(
                        'text-xs truncate',
                        hasUnread ? 'font-semibold text-slate-700' : 'text-slate-400 font-medium'
                      )}>
                        {lastMsg?.sender === user._id && (
                          <span className="text-slate-400">You: </span>
                        )}
                        {lastMsg?.content || 'No messages yet'}
                      </p>
                      {hasUnread && (
                        <span className="ml-2 shrink-0 min-w-[20px] h-5 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1.5">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredConversations.length > 0 && (
        <div className="border-t border-slate-100 p-2 shrink-0">
          <button
            onClick={() => { onClose(); navigate('/messages'); }}
            className="w-full py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
          >
            See all messages
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageDropdown;
