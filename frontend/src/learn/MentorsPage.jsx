import React from 'react';
import { Users, Star, Clock, MessageSquare } from 'lucide-react';

const MOCK_MENTORS = [
  { id: 'm1', name: 'Sarah Jenkins', role: 'Senior React Developer', skills: ['React', 'Performance', 'TypeScript'], rating: 4.9, sessions: 124, avatar: 'from-blue-500 to-indigo-600' },
  { id: 'm2', name: 'Alex Chen', role: 'Lead Product Designer', skills: ['Figma', 'Design Systems', 'CSS'], rating: 4.8, sessions: 89, avatar: 'from-emerald-500 to-teal-600' },
  { id: 'm3', name: 'David Krol', role: 'Staff Backend Engineer', skills: ['Go', 'Distributed Systems', 'K8s'], rating: 5.0, sessions: 210, avatar: 'from-cyan-500 to-blue-600' },
  { id: 'm4', name: 'Dr. Amanda Lee', role: 'AI Research Scientist', skills: ['Python', 'ML', 'PyTorch'], rating: 4.9, sessions: 175, avatar: 'from-violet-500 to-purple-600' },
  { id: 'm5', name: 'Kevin Wu', role: 'Principal Architect', skills: ['System Design', 'AWS', 'Microservices'], rating: 5.0, sessions: 98, avatar: 'from-rose-500 to-pink-600' },
  { id: 'm6', name: 'Maria Santos', role: 'Staff Engineer, Meta', skills: ['TypeScript', 'GraphQL', 'Performance'], rating: 4.7, sessions: 142, avatar: 'from-orange-500 to-amber-600' },
];

const MentorsPage = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mentors</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Connect with expert mentors to accelerate your growth.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {MOCK_MENTORS.map(mentor => (
          <div key={mentor.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-indigo-50 transition-all duration-300 overflow-hidden group">
            {/* Cover */}
            <div className={`h-20 bg-gradient-to-br ${mentor.avatar} relative`}>
              <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/20 transition-colors" />
            </div>

            {/* Avatar */}
            <div className="px-5 -mt-7 mb-3">
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${mentor.avatar} border-4 border-white shadow-md flex items-center justify-center`}>
                <span className="text-xl font-black text-white">{mentor.name.charAt(0)}</span>
              </div>
            </div>

            <div className="px-5 pb-5">
              <h3 className="font-black text-[15px] text-slate-900 leading-tight">{mentor.name}</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-3">{mentor.role}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {mentor.skills.slice(0, 3).map(skill => (
                  <span key={skill} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-black text-slate-800">{mentor.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">{mentor.sessions} sessions</span>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200">
                  <MessageSquare className="w-3.5 h-3.5" /> Connect
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MentorsPage;
