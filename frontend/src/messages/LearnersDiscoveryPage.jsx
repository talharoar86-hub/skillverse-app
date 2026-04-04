import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MessageSquare } from 'lucide-react';
import { profileService, messageService } from '../services/api';
import { getAvatarUrl } from '../utils/avatar';

const LearnersDiscoveryPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await profileService.getDiscovery('Learn');
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch learners', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async (userId) => {
    if (!userId) { console.error('User ID is missing'); return; }
    try {
      const conversation = await messageService.createConversation(userId);
      navigate(`/messages/${conversation._id || conversation.conversationId}`);
    } catch (err) {
      console.error('Failed to create conversation', err);
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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Learners</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          {users.length} {users.length === 1 ? 'learner' : 'learners'} available
        </p>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-2">No learners found</h3>
          <p className="text-sm text-slate-500 font-medium max-w-xs">
            Learners will appear here once they set their goal to Learn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {users.map((user) => (
            <div
              key={user._id}
              className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-sm transition-all duration-200"
            >
              <div className="relative shrink-0">
                <img
                  src={getAvatarUrl(user)}
                  alt={user.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                />
                {user.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">{user.name}</h4>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  {user.experienceLevel || 'Learner'}
                </p>
              </div>

              <button
                onClick={() => handleMessage(user._id)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Message
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnersDiscoveryPage;
