import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { messageService } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getAvatarUrl } from '../utils/avatar';
import { cn } from '../utils/cn';

const ChatView = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const data = await messageService.getMessages(conversationId);
        setMessages(data.messages);
        setOtherUser(data.otherUser);
        setHasMore(data.hasMore);
        // Mark as read
        await messageService.markRead(conversationId);
      } catch (err) {
        console.error('Failed to fetch messages', err);
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom('auto');
    }
  }, [loading, scrollToBottom]);

  // Socket.IO: join conversation room
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit('join_conversation', conversationId);

    return () => {
      socket.emit('leave_conversation', conversationId);
    };
  }, [socket, conversationId]);

  // Socket.IO: listen for new messages and typing
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (message.conversation === conversationId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
        // Mark as read if not from us
        if (message.sender?._id !== user?._id && message.sender !== user?._id) {
          messageService.markRead(conversationId).catch(() => {});
        }
      }
    };

    const handleTyping = ({ conversationId: cId, userName }) => {
      if (cId === conversationId && userName !== user?.name) {
        setTypingUser(userName);
      }
    };

    const handleStopTyping = ({ conversationId: cId }) => {
      if (cId === conversationId) {
        setTypingUser(null);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing_message', handleTyping);
    socket.on('user_stop_typing_message', handleStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing_message', handleTyping);
      socket.off('user_stop_typing_message', handleStopTyping);
    };
  }, [socket, conversationId, user?.name, scrollToBottom]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    // Stop typing indicator
    if (socket) {
      socket.emit('stop_typing_message', { conversationId });
    }

    try {
      const message = await messageService.sendMessage(conversationId, content);
      // The message will be added via socket event, but add it immediately for responsiveness
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message', err);
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    // Emit typing indicator
    if (socket) {
      socket.emit('typing_message', { conversationId, userName: user?.name });

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing_message', { conversationId });
      }, 2000);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);

    try {
      const oldestMessage = messages[0];
      const cursor = oldestMessage.createdAt;
      const data = await messageService.getMessages(conversationId, cursor);

      setMessages(prev => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to load more messages', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Format message time
  const formatMessageTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group messages by date
  const getMessageDateLabel = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const isPostLink = (content) => {
    const urlRegex = /\/post\/([a-f0-9]{24})/i;
    return urlRegex.exec(content);
  };

  const renderMessageContent = (msg, isMe) => {
    const postMatch = isPostLink(msg.content);
    if (postMatch) {
      const postId = postMatch[1];
      const parts = msg.content.split(postMatch[0]);
      const captionText = parts[0]?.replace(/\n+$/, '').trim();
      const postUrl = `${window.location.origin}/post/${postId}`;
      return (
        <div>
          {captionText && (
            <p className="text-sm leading-relaxed break-words mb-2">{captionText}</p>
          )}
          <div className={cn(
            "rounded-xl border overflow-hidden",
            isMe ? "bg-indigo-500/20 border-indigo-400/30" : "bg-slate-50 border-slate-200"
          )}>
            <div className="px-3 py-2.5 flex items-center gap-2.5">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                isMe ? "bg-indigo-400/30" : "bg-indigo-50"
              )}>
                <ExternalLink className={cn("w-4 h-4", isMe ? "text-indigo-200" : "text-indigo-500")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[11px] font-bold uppercase tracking-wider", isMe ? "text-indigo-200" : "text-slate-400")}>
                  Shared Post
                </p>
                <p className={cn("text-xs font-medium truncate", isMe ? "text-indigo-100" : "text-slate-500")}>
                  {postUrl}
                </p>
              </div>
            </div>
            <a
              href={postUrl}
              onClick={(e) => { e.preventDefault(); window.location.href = postUrl; }}
              className={cn(
                "block text-center py-2 text-[13px] font-bold transition-colors",
                isMe
                  ? "bg-indigo-400/20 text-indigo-100 hover:bg-indigo-400/30 border-t border-indigo-400/20"
                  : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-t border-slate-100"
              )}
            >
              View Post
            </a>
          </div>
        </div>
      );
    }
    return <p className="text-sm leading-relaxed break-words">{msg.content}</p>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-72px-48px)] max-w-[800px] mx-auto">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm mb-3">
        <button
          onClick={() => navigate('/messages')}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative">
          <img
            src={getAvatarUrl(otherUser)}
            alt={otherUser?.name || 'User'}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          />
          {otherUser?.isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 truncate">{otherUser?.name || 'Unknown'}</h3>
          <p className="text-[11px] text-slate-400 font-medium">
            {otherUser?.isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar"
      >
        {hasMore && (
          <div className="flex justify-center py-3">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors"
            >
              {loadingMore ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
          const showDate = idx === 0 ||
            new Date(msg.createdAt).toDateString() !== new Date(messages[idx - 1].createdAt).toDateString();

          return (
            <React.Fragment key={msg._id || idx}>
              {/* Date divider */}
              {showDate && (
                <div className="flex justify-center py-3">
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                    {getMessageDateLabel(msg.createdAt)}
                  </span>
                </div>
              )}

              {/* System message */}
              {msg.isSystem ? (
                <div className="flex justify-center py-2">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 max-w-[80%]">
                    <p className="text-xs text-slate-500 font-medium italic text-center">{msg.content}</p>
                  </div>
                </div>
              ) : (
                /* Regular message */
                <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[75%] px-4 py-2.5 rounded-2xl",
                    isMe
                      ? "bg-indigo-600 text-white rounded-br-md"
                      : "bg-white text-slate-800 border border-slate-100 rounded-bl-md shadow-sm"
                  )}>
                    {renderMessageContent(msg, isMe)}
                    <div className={cn(
                      "flex items-center gap-1 mt-1",
                      isMe ? "justify-end" : "justify-start"
                    )}>
                      <span className={cn(
                        "text-[10px]",
                        isMe ? "text-indigo-200" : "text-slate-400"
                      )}>
                        {formatMessageTime(msg.createdAt)}
                      </span>
                      {isMe && (
                        msg.read
                          ? <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />
                          : <Check className="w-3.5 h-3.5 text-indigo-300" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Typing indicator */}
        {typingUser && (
          <div className="flex justify-start py-1">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium ml-1">{typingUser} is typing</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 bg-white border border-slate-200 focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50/50 focus:outline-none rounded-2xl py-3 px-5 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all duration-200"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className={cn(
            "p-3 rounded-2xl transition-all duration-200 active:scale-95",
            newMessage.trim() && !sending
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatView;
