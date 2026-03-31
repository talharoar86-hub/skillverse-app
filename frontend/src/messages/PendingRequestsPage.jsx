import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { followService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { getAvatarUrl } from '../utils/avatar';
import { cn } from '../utils/cn';

const PendingRequestsPage = () => {
  const socket = useSocket();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {
      if (notification.type === 'follow' && notification.status === 'pending') {
        fetchPending();
      }
    };

    socket.on('notification_received', handleNotification);
    return () => socket.off('notification_received', handleNotification);
  }, [socket]);

  const fetchPending = async () => {
    try {
      const data = await followService.getPending();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch pending requests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (followId) => {
    try {
      await followService.acceptFollow(followId);
      setRequests(prev => prev.filter(r => r.followId !== followId));
    } catch (err) {
      console.error('Failed to accept follow', err);
    }
  };

  const handleReject = async (followId) => {
    try {
      await followService.rejectFollow(followId);
      setRequests(prev => prev.filter(r => r.followId !== followId));
    } catch (err) {
      console.error('Failed to reject follow', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pending Requests</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          {requests.length} pending {requests.length === 1 ? 'request' : 'requests'}
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-2">No pending requests</h3>
          <p className="text-sm text-slate-500 font-medium max-w-xs">
            When someone wants to follow you, their request will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.followId}
              className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-sm transition-all duration-200"
            >
              <div className="relative shrink-0">
                <img
                  src={getAvatarUrl(req.user)}
                  alt={req.user.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                />
                {req.user.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">{req.user.name}</h4>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  {req.user.experienceLevel || req.user.goal || 'Member'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleAccept(req.followId)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors active:scale-95 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Accept
                </button>
                <button
                  onClick={() => handleReject(req.followId)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors active:scale-95 border border-rose-200"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingRequestsPage;
