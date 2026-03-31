import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageSquare, Users } from 'lucide-react';
import { messageService } from '../services/api';
import { getAvatarUrl } from '../utils/avatar';
import { formatTimeShort } from '../utils/time';
import { cn } from '../utils/cn';
import { useSocket } from '../context/SocketContext';

const ConversationList = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleConversationUpdated = (data) => {
      setConversations(prev => {
        const updated = prev.map(conv => {
          const convId = conv._id || conv.conversationId;
          if (convId === data.conversationId) {
            return { ...conv, lastMessage: data.lastMessage };
          }
          return conv;
        });
        // Sort by last message time
        return updated.sort((a, b) => {
          const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
          const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
          return bTime - aTime;
        });
      });
    };

    const handleNewMessage = (message) => {
      setConversations(prev => {
        const updated = prev.map(conv => {
          const convId = conv._id || conv.conversationId;
          if (convId === message.conversation) {
            return {
              ...conv,
              lastMessage: {
                content: message.content,
                sender: message.sender,
                createdAt: message.createdAt
              },
              unreadCount: (conv.unreadCount || 0) + 1
            };
          }
          return conv;
        });
        return updated.sort((a, b) => {
          const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
          const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
          return bTime - aTime;
        });
      });
    };

    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('new_message', handleNewMessage);
    };
  }, [socket]);

  const fetchConversations = async () => {
    try {
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const name = conv.otherUser?.name?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Messages</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Your conversations</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50/50 focus:outline-none rounded-2xl py-2.5 pl-11 pr-4 text-sm font-bold text-slate-800 placeholder-slate-400 transition-all duration-200"
        />
      </div>

      {/* Conversation List */}
      {filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-2">No conversations yet</h3>
          <p className="text-sm text-slate-500 font-medium max-w-xs">
            Follow someone and get accepted to start chatting with them.
          </p>
          <button
            onClick={() => navigate('/messages/mentors')}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors active:scale-95"
          >
            <Users className="w-4 h-4" />
            Browse Chats
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredConversations.map((conv) => {
            const convId = conv._id || conv.conversationId;
            const otherUser = conv.otherUser;
            const lastMsg = conv.lastMessage;
            const hasUnread = conv.unreadCount > 0;

            return (
              <button
                key={convId}
                onClick={() => navigate(`/messages/${convId}`)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left group",
                  hasUnread
                    ? "bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100"
                    : "bg-white hover:bg-slate-50 border border-transparent"
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={getAvatarUrl(otherUser)}
                    alt={otherUser?.name || 'User'}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  {otherUser?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={cn(
                      "text-sm truncate",
                      hasUnread ? "font-extrabold text-slate-900" : "font-bold text-slate-800"
                    )}>
                      {otherUser?.name || 'Unknown User'}
                    </h4>
                    {lastMsg?.createdAt && (
                      <span className="text-[11px] text-slate-400 font-medium shrink-0">
                        {formatTimeShort(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={cn(
                      "text-[13px] truncate",
                      hasUnread ? "font-semibold text-slate-700" : "font-medium text-slate-400"
                    )}>
                      {lastMsg?.content || 'No messages yet'}
                    </p>
                    {hasUnread && (
                      <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center rounded-full">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
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
  );
};

export default ConversationList;
