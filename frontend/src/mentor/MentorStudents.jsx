import React, { useState, useEffect, useMemo } from 'react';
import { mentorService, messageService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Users, Loader2, BookOpen, MessageCircle, Search, Calendar, UserCheck, ExternalLink
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getAvatarUrl } from '../utils/avatar';

const MentorStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    try {
      const data = await mentorService.getStudents();
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return students.filter(s => {
      if (filter !== 'all' && s.type !== filter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = s.name?.toLowerCase().includes(q);
        const skillMatch = s.skills?.some(sk => (typeof sk === 'string' ? sk : sk.name)?.toLowerCase().includes(q));
        if (!nameMatch && !skillMatch) return false;
      }
      return true;
    });
  }, [students, filter, searchQuery]);

  const handleMessage = async (student) => {
    if (!student?._id) {
      console.error('Student ID is missing');
      return;
    }
    try {
      const conv = await messageService.createConversation(student._id);
      if (conv?._id || conv?.conversationId) {
        navigate(`/messages/${conv._id || conv.conversationId}`);
      }
    } catch (err) {
      console.error('Failed to start conversation', err);
    }
  };

  const menteeCount = students.filter(s => s.type === 'mentee').length;
  const studentCount = students.filter(s => s.type === 'student').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Students & Mentees</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          {students.length} total - {menteeCount} mentees, {studentCount} enrolled students
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
            <p className="text-xl font-black text-slate-900">{students.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mentees</p>
            <p className="text-xl font-black text-slate-900">{menteeCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Students</p>
            <p className="text-xl font-black text-slate-900">{studentCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or skill..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All', count: students.length },
            { key: 'mentee', label: 'Mentees', count: menteeCount },
            { key: 'student', label: 'Students', count: studentCount }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold border transition-all",
                filter === f.key
                  ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              )}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Student List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 mb-2">
            {students.length === 0 ? 'No students yet' : 'No results found'}
          </h3>
          <p className="text-sm text-slate-400 font-medium">
            {students.length === 0
              ? 'Students will appear here once they enroll in your courses or accept mentorship.'
              : 'Try a different search or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(student => (
            <div key={student._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => navigate(`/user/${student._id}`)}
                  className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center hover:ring-2 hover:ring-indigo-200 transition-all"
                >
                  {getAvatarUrl(student) ? (
                    <img src={getAvatarUrl(student)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-slate-500">{(student.name || 'U').charAt(0)}</span>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{student.name}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold",
                      student.type === 'mentee'
                        ? "bg-violet-50 text-violet-600"
                        : "bg-emerald-50 text-emerald-600"
                    )}>
                      {student.type === 'mentee' ? 'Mentee' : 'Student'}
                    </span>
                  </div>
                  {student.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {student.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold">
                          {typeof skill === 'string' ? skill : skill.name}
                        </span>
                      ))}
                      {student.skills.length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[10px] font-bold">
                          +{student.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  {student.since && (
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Since {new Date(student.since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
                <button
                  onClick={() => handleMessage(student)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Message
                </button>
                <button
                  onClick={() => navigate(`/user/${student._id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:border-indigo-300 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorStudents;
