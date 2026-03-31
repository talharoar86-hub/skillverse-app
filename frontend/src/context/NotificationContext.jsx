import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useSocket } from './SocketContext';
import { notificationService } from '../services/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!user || hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchUnreadCount = async () => {
      try {
        const { count } = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        console.error('Failed to fetch unread count', err);
      }
    };

    fetchUnreadCount();
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = () => {
      setUnreadCount(prev => prev + 1);
    };
    socket.on('notification_received', handleNotification);
    return () => socket.off('notification_received', handleNotification);
  }, [socket]);

  const decrementCount = useCallback((count = 1) => {
    setUnreadCount(prev => Math.max(0, prev - count));
  }, []);

  const resetCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const refreshCount = useCallback(async () => {
    if (!user) return;
    try {
      const { count } = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to refresh unread count', err);
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{ unreadCount, decrementCount, resetCount, refreshCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
