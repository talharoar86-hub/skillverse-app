import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageSquare, Users, UserCheck, Send, Zap, Loader2, ArrowLeft } from 'lucide-react';
import { messageService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { getAvatarUrl } from '../utils/avatar';
import { formatTimeShort } from '../utils/time';
import { cn } from '../utils/cn';

const QUICK_REPLY_TEMPLATES = [
  { id: 1, label: 'Welcome', text: "Welcome to my mentorship! I'm excited to help you achieve your learning goals. Let me know how I can support you!" },
  { id: 2, label: 'Session Reminder', text: "Hi! Just a reminder about our upcoming session. Please make sure to join on time. Looking forward to seeing you!" },
  { id: 3, label: 'Assignment Feedback', text: "Great work on your recent assignment! I've reviewed it and here are some key points to consider..." },
  { id: 4, label: 'Follow Up', text: "Hope you're making progress! Let me know if you have any questions or need help with anything." },
  { id: 5, label: 'Course Info', text: "Regarding the course - I've uploaded new materials. Please check the lesson resources and let me know if you need clarification." },
  { id: 6, label: 'Thank You', text: "Thank you for your feedback! I truly appreciate it and will use it to improve my teaching. Looking forward to our next session!" }
];

const MentorMessages = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const messagesContainerRef = useRef(null);
  
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

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
        return sortConversations(updated);
      });
    };

    const handleNewMessage = (message) => {
      if (selectedConv && (message.conversation === selectedConv._id || message.conversation === selectedConv.conversationId)) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
      setConversations(prev => {
        const updated = prev.map(conv => {
          const convId = conv._id || conv.conversationId;
          if (convId === message.conversation) {
            return {
              ...conv,
              lastMessage: { content: message.content, sender: message.sender, createdAt: message.createdAt },
              unreadCount: (conv.unreadCount || 0) + 1
            };
          }
          return conv;
        });
        return sortConversations(updated);
      });
    };

    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, selectedConv]);

  const sortConversations = (convs) => {
    return [...convs].sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
      return bTime - aTime;
    });
  };

  const fetchConversations = async () => {
    try {
      const data = await messageService.getMentorFilteredConversations(filter);
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [filter]);

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      if (!searchQuery) return true;
      const name = conv.otherUser?.name?.toLowerCase() || '';
      return name.includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery]);

  const selectConversation = async (conv) => {
    setSelectedConv(conv);
    setLoadingMessages(true);
    try {
      const convId = conv._id || conv.conversationId;
      const data = await messageService.getMessages(convId);
      setMessages(data.messages);
      await messageService.markRead(convId);
      setConversations(prev => prev.map(c => {
        const cId = c._id || c.conversationId;
        if (cId === convId) return { ...c, unreadCount: 0 };
        return c;
      }));
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoadingMessages(false);
    }
    if (socket) {
      socket.emit('join_conversation', convId);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !selectedConv) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      const convId = selectedConv._id || selectedConv.conversationId;
      const message = await messageService.sendMessage(convId, content);
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message', err);
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setNewMessage(template.text);
    setShowTemplates(false);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatMessageTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageDateLabel = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const studentCount = conversations.filter(c => c.userType === 'student').length;
  const menteeCount = conversations.filter(c => c.userType === 'mentee').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-72px)] lg:h-auto">
      {/* Conversation List */}
      <div className={cn(
        "w-full lg:w-80 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col",
        selectedConv ? "hidden lg:flex" : "flex"
      )}>
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => navigate('/mentor-dashboard/overview')} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <h1 className="text-xl font-black text-slate-900">Messages</h1>
          </div>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2 pl-9 pr-4 text-sm font-medium"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all",
                filter === 'all' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              All ({conversations.length})
            </button>
            <button
              onClick={() => setFilter('students')}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all",
                filter === 'students' ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <Users className="w-3 h-3 inline mr-1" />{studentCount}
            </button>
            <button
              onClick={() => setFilter('mentees')}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all",
                filter === 'mentees' ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <UserCheck className="w-3 h-3 inline mr-1" />{menteeCount}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conv) => {
                const convId = conv._id || conv.conversationId;
                const otherUser = conv.otherUser;
                const lastMsg = conv.lastMessage;
                const hasUnread = conv.unreadCount > 0;
                const isSelected = selectedConv && (selectedConv._id === convId || selectedConv.conversationId === convId);

                return (
                  <button
                    key={convId}
                    onClick={() => selectConversation(conv)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left",
                      isSelected
                        ? "bg-indigo-50 border border-indigo-200"
                        : hasUnread
                          ? "bg-indigo-50/50 hover:bg-indigo-50 border border-transparent"
                          : "hover:bg-slate-50 border border-transparent"
                    )}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={getAvatarUrl(otherUser)}
                        alt={otherUser?.name || 'User'}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      {otherUser?.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={cn("text-sm truncate", hasUnread ? "font-extrabold text-slate-900" : "font-bold text-slate-800")}>
                          {otherUser?.name || 'Unknown'}
                        </h4>
                        {lastMsg?.createdAt && (
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {formatTimeShort(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className={cn("text-[12px] truncate", hasUnread ? "font-semibold text-slate-700" : "font-medium text-slate-400")}>
                          {lastMsg?.content || 'No messages'}
                        </p>
                        {hasUnread && (
                          <span className="shrink-0 min-w-[18px] h-4.5 px-1.5 bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center rounded-full">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded",
                          conv.userType === 'mentee' ? "bg-violet-100 text-violet-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                          {conv.userType === 'mentee' ? 'Mentee' : 'Student'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-slate-50",
        !selectedConv ? "hidden lg:flex" : "flex"
      )}>
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-lg font-bold text-slate-400">Select a conversation</p>
              <p className="text-sm text-slate-400 mt-1">Choose from your students or mentees</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white border-b border-slate-100 p-4 flex items-center gap-3">
              <button onClick={() => setSelectedConv(null)} className="lg:hidden p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-500" />
              </button>
              <div className="relative">
                <img
                  src={getAvatarUrl(selectedConv.otherUser)}
                  alt={selectedConv.otherUser?.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
                {selectedConv.otherUser?.isOnline && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">{selectedConv.otherUser?.name || 'Unknown'}</h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {selectedConv.otherUser?.isOnline ? 'Online' : 'Offline'} • {selectedConv.userType === 'mentee' ? 'Mentee' : 'Student'}
                </p>
              </div>
              <button
                onClick={() => navigate(`/messages/${selectedConv._id || selectedConv.conversationId}`)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Open in Messages
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-400">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender?._id === msg.sender || msg.sender === msg.sender;
                  const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[idx - 1]?.createdAt).toDateString();
                  
                  return (
                    <React.Fragment key={msg._id || idx}>
                      {showDate && (
                        <div className="flex justify-center py-2">
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                            {getMessageDateLabel(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[75%] px-4 py-2.5 rounded-2xl",
                          isMe
                            ? "bg-indigo-600 text-white rounded-br-md"
                            : "bg-white text-slate-800 border border-slate-100 rounded-bl-md shadow-sm"
                        )}>
                          <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                          <div className={cn("flex items-center gap-1 mt-1", isMe ? "justify-end" : "justify-start")}>
                            <span className={cn("text-[10px]", isMe ? "text-indigo-200" : "text-slate-400")}>
                              {formatMessageTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesContainerRef} />
            </div>

            <div className="bg-white border-t border-slate-100 p-4">
              {showTemplates && (
                <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Replies</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_REPLY_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleTemplateSelect(t)}
                        className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className={cn(
                    "p-2.5 rounded-xl transition-colors",
                    showTemplates ? "bg-amber-100 text-amber-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  )}
                  title="Quick replies"
                >
                  <Zap className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50/50 focus:outline-none rounded-2xl py-3 px-4 text-sm font-medium"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className={cn(
                    "p-3 rounded-2xl transition-all",
                    newMessage.trim() && !sending
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MentorMessages;