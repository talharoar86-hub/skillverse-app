import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Zap, Clock, ChevronRight, BarChart3, GraduationCap, MessageSquare, TrendingUp, PlusCircle, CheckCircle2, Award, Sparkles, Flame, Send } from 'lucide-react';
import { feedService, enrollmentService } from '../services/api';
import { getAvatarUrl } from '../utils/avatar';
import { cn } from '../utils/cn';

const Card=({children,className=''})=><div className={cn('bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden',className)}>{children}</div>;
const CardHeader=({icon:Icon,iconBg,iconColor,title,link,linkText='View all'})=><div className='flex items-center justify-between px-4 pt-4 pb-2'><div className='flex items-center gap-2'><div className={cn('w-7 h-7 rounded-lg flex items-center justify-center',iconBg)}><Icon className={cn('w-3.5 h-3.5',iconColor)}/></div><h3 className='font-bold text-slate-900 text-sm'>{title}</h3></div>{link&&<Link to={link} className='text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-0.5'>{linkText} <ChevronRight className='w-3 h-3'/></Link>}</div>;

const LearnRecommendedCourses=({courses})=>{if(!courses||courses.length===0)return null;return(<Card><CardHeader icon={BookOpen} iconBg='bg-indigo-50' iconColor='text-indigo-600' title='Recommended Courses' link='/learn/explore' linkText='Explore'/><div className='px-4 pb-4 space-y-2.5'>{courses.map((course,i)=>(<Link key={course._id||i} to='/learn/explore' className='flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group'><div className='w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0 shadow-sm'><BookOpen className='w-4 h-4 text-white'/></div><div className='flex-1 min-w-0'><p className='text-[13px] font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors'>{course.title}</p><div className='flex items-center gap-2 mt-0.5'><span className='text-[10px] font-bold text-slate-400 flex items-center gap-0.5'><Clock className='w-2.5 h-2.5'/> {course.duration||'2h 00m'}</span><span className='text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded'>{course.category||'Skill'}</span></div></div><ChevronRight className='w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0'/></Link>))}</div></Card>);};

const LearnContinueLearning=()=>{const[enrolled,setEnrolled]=useState([]);const[stats,setStats]=useState(null);const[loading,setLoading]=useState(true);useEffect(()=>{const f=async()=>{try{const[e,s]=await Promise.all([enrollmentService.getMyCourses(),enrollmentService.getStats()]);setEnrolled(e?.slice(0,3)||[]);setStats(s);}catch{ /* ignored */ }finally{setLoading(false);}};f();},[]);if(loading)return null;return(<Card><CardHeader icon={GraduationCap} iconBg='bg-emerald-50' iconColor='text-emerald-600' title='Continue Learning' link='/learn/my-learning'/>{stats&&(<div className='flex items-center gap-4 px-4 pb-3'><div className='flex items-center gap-1.5'><div className='w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center'><BookOpen className='w-3 h-3 text-indigo-500'/></div><div><p className='text-xs font-black text-slate-900'>{stats.enrolled||0}</p><p className='text-[9px] font-bold text-slate-400 uppercase'>Enrolled</p></div></div><div className='flex items-center gap-1.5'><div className='w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center'><CheckCircle2 className='w-3 h-3 text-emerald-500'/></div><div><p className='text-xs font-black text-slate-900'>{stats.completed||0}</p><p className='text-[9px] font-bold text-slate-400 uppercase'>Done</p></div></div><div className='flex items-center gap-1.5'><div className='w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center'><Clock className='w-3 h-3 text-amber-500'/></div><div><p className='text-xs font-black text-slate-900'>{stats.hours||0}h</p><p className='text-[9px] font-bold text-slate-400 uppercase'>Hours</p></div></div></div>)}{enrolled.length>0?(<div className='px-4 pb-4 space-y-3'>{enrolled.map((en,i)=>(<Link key={en._id||i} to='/learn/my-learning' className='block group'><div className='flex items-center justify-between mb-1'><p className='text-[13px] font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors'>{en.course?.title||'Course'}</p><span className='text-[10px] font-black text-indigo-600 ml-2'>{en.progress||0}%</span></div><div className='w-full h-1.5 bg-slate-100 rounded-full overflow-hidden'><div className='h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500' style={{width:(en.progress||0)+'%'}}/></div></Link>))}</div>):(<div className='px-4 pb-4'><Link to='/learn/explore' className='flex items-center justify-center gap-2 w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-sm transition-colors'><BookOpen className='w-4 h-4'/> Start Learning</Link></div>)}</Card>);};

const LearnSuggestedMentors=({mentors})=>{if(!mentors||mentors.length===0)return null;return(<Card><CardHeader icon={Users} iconBg='bg-violet-50' iconColor='text-violet-600' title='Suggested Mentors' link='/learn/mentors'/><div className='flex gap-3 px-4 pb-4 overflow-x-auto hide-scrollbar'>{mentors.map(m=>(<Link key={m._id} to={'/user/'+m._id+'/overview'} className='flex flex-col items-center gap-2 min-w-[80px] group'><div className='relative'><img src={getAvatarUrl(m)} alt={m.name} className='w-12 h-12 rounded-full object-cover border-2 border-slate-100 group-hover:border-indigo-300 transition-colors'/><div className='absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full'/></div><div className='text-center'><p className='text-xs font-bold text-slate-800 truncate max-w-[76px] group-hover:text-indigo-600 transition-colors'>{m.name}</p><p className='text-[10px] text-slate-400 truncate max-w-[76px]'>{m.experienceLevel||'Skill Ninja'}</p></div></Link>))}</div></Card>);};

const LearnLearningStats=({stats})=>{if(!stats)return null;return(<div className='bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg shadow-indigo-100'><div className='relative z-10'><div className='flex items-center gap-2 mb-3'><Award className='w-4 h-4 text-yellow-300 fill-yellow-300'/><span className='text-[10px] font-black uppercase tracking-widest opacity-80'>Your Progress</span></div><div className='grid grid-cols-3 gap-4'><div><p className='text-2xl font-black'>{stats.enrolled||0}</p><p className='text-[10px] font-bold opacity-60 uppercase mt-0.5'>Enrolled</p></div><div><p className='text-2xl font-black'>{stats.completed||0}</p><p className='text-[10px] font-bold opacity-60 uppercase mt-0.5'>Completed</p></div><div><p className='text-2xl font-black'>{stats.hours||0}h</p><p className='text-[10px] font-bold opacity-60 uppercase mt-0.5'>Hours</p></div></div></div><Sparkles className='absolute -bottom-3 -right-3 w-20 h-20 text-white/10 rotate-12'/></div>);};

const MentorStudentRequests=({students})=>{if(!students||students.length===0)return null;return(<Card><CardHeader icon={MessageSquare} iconBg='bg-emerald-50' iconColor='text-emerald-600' title='Your Students' link='/mentor-dashboard'/><div className='px-4 pb-4 space-y-3'>{students.map((s,i)=>(<div key={s._id||i} className='flex items-center gap-3'><div className='w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center font-bold text-xs text-slate-300 border border-slate-100 overflow-hidden shrink-0'>{s.avatarUrl?<img src={getAvatarUrl(s)} alt={s.name} className='w-full h-full object-cover'/>:s.name?.charAt(0)||'?'}</div><div className='flex-1 min-w-0'><p className='text-xs font-bold text-slate-800 truncate'>{s.name}</p><p className='text-[10px] text-slate-400 font-medium truncate'>{s.type==='mentee'?'Mentee':'Student'} {s.skills?.[0]?'· '+s.skills[0]:''}</p></div><button className='p-1.5 hover:bg-slate-50 text-indigo-600 rounded-lg transition-colors'><ChevronRight className='w-4 h-4'/></button></div>))}</div></Card>);};

const MentorDashboardStats=({stats})=>{if(!stats)return null;return(<div className='bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-xl shadow-slate-200'><div className='flex items-center justify-between mb-4'><h3 className='font-bold text-xs opacity-70 uppercase tracking-widest'>Mentor Dashboard</h3><BarChart3 className='w-4 h-4 text-indigo-400'/></div><div className='grid grid-cols-2 gap-4 mb-4'><div><p className='text-2xl font-black'>{stats.totalStudents||0}</p><p className='text-[10px] font-bold opacity-50 uppercase mt-1'>Students</p></div><div><p className='text-2xl font-black'>{stats.rating||'5.0'}</p><p className='text-[10px] font-bold opacity-50 uppercase mt-1'>Rating</p></div><div><p className='text-2xl font-black'>{stats.totalCourses||0}</p><p className='text-[10px] font-bold opacity-50 uppercase mt-1'>Courses</p></div><div><p className='text-2xl font-black'>{stats.totalSessions||0}</p><p className='text-[10px] font-bold opacity-50 uppercase mt-1'>Sessions</p></div></div>{stats.pendingRequests>0&&(<div className='flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5'><div className='w-2 h-2 rounded-full bg-amber-400 animate-pulse'/><span className='text-[11px] font-bold'>{stats.pendingRequests} pending request{stats.pendingRequests>1?'s':''}</span></div>)}</div>);};

const MentorCreateCourseCTA=()=>(<Card><div className='p-5'><div className='flex items-center gap-3 mb-4'><div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-100'><PlusCircle className='w-6 h-6 text-white'/></div><div><h3 className='font-bold text-slate-900 text-sm'>Create a Course</h3><p className='text-[11px] text-slate-400 font-medium'>Share your knowledge</p></div></div><p className='text-[12px] text-slate-500 mb-4 leading-relaxed'>Create courses, add lessons, and start teaching students from around the world.</p><Link to='/mentor-dashboard/courses' className='flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98]'><PlusCircle className='w-4 h-4'/> Create Course</Link></div></Card>);

const MentorSuggestedLearners=({learners})=>{if(!learners||learners.length===0)return null;return(<Card><CardHeader icon={GraduationCap} iconBg='bg-teal-50' iconColor='text-teal-600' title='Suggested Learners' link='/learn/mentors'/><div className='flex gap-3 px-4 pb-4 overflow-x-auto hide-scrollbar'>{learners.map(l=>(<Link key={l._id} to={'/user/'+l._id+'/overview'} className='flex flex-col items-center gap-2 min-w-[80px] group'><div className='relative'><img src={getAvatarUrl(l)} alt={l.name} className='w-12 h-12 rounded-full object-cover border-2 border-slate-100 group-hover:border-teal-300 transition-colors'/></div><div className='text-center'><p className='text-xs font-bold text-slate-800 truncate max-w-[76px] group-hover:text-teal-600 transition-colors'>{l.name}</p><p className='text-[10px] text-slate-400 truncate max-w-[76px]'>{l.experienceLevel||'Learner'}</p></div></Link>))}</div></Card>);};

const ExchangeSkillMatches=({matches})=>{if(!matches||matches.length===0)return null;return(<Card><CardHeader icon={Zap} iconBg='bg-orange-50' iconColor='text-orange-500' title='Skill Matches' link='/profile/exchange-activity'/><div className='px-4 pb-4 space-y-3'>{matches.map((m,i)=>(<div key={m._id||i}><div className='flex items-center gap-3 mb-2'><div className='w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center font-bold text-xs text-slate-300 border border-slate-100 overflow-hidden shrink-0'>{m.avatarUrl?<img src={getAvatarUrl(m)} alt={m.name} className='w-full h-full object-cover'/>:m.name?.charAt(0)||'?'}</div><div className='flex-1 min-w-0'><p className='text-xs font-bold text-slate-800 truncate'>{m.name}</p><p className='text-[10px] text-slate-400 font-medium truncate'>Gives: {m.give||'Skill'} · Wants: {m.get||'Learning'}</p></div><span className='text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0'>{m.match}</span></div><div className='flex gap-1.5 ml-12'><button className='flex-1 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-700 transition-colors'>Request</button><button className='px-2.5 rounded-lg border border-slate-100 text-slate-400 hover:bg-slate-50 transition-colors'><MessageSquare className='w-3 h-3'/></button></div></div>))}</div></Card>);};

const ExchangeRequests=({requests})=>{if(!requests||requests.length===0)return null;return(<Card><CardHeader icon={Send} iconBg='bg-violet-50' iconColor='text-violet-600' title='Exchange Requests' link='/profile/exchange-activity'/><div className='px-4 pb-4 space-y-3'>{requests.map((r,i)=>(<div key={r._id||i} className='flex items-center gap-3'><div className='w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center font-bold text-xs text-slate-300 border border-slate-100 overflow-hidden shrink-0'>{r.sender?.avatarUrl?<img src={getAvatarUrl(r.sender)} alt={r.sender.name} className='w-full h-full object-cover'/>:r.sender?.name?.charAt(0)||'?'}</div><div className='flex-1 min-w-0'><p className='text-xs font-bold text-slate-800 truncate'>{r.sender?.name||'User'}</p><p className='text-[10px] text-slate-400 font-medium truncate'>Offers: {r.offeredSkill} → Wants: {r.requestedSkill}</p></div><button className='p-1.5 hover:bg-slate-50 text-indigo-600 rounded-lg transition-colors'><ChevronRight className='w-4 h-4'/></button></div>))}</div></Card>);};

const ExchangeStats=({stats})=>{if(!stats)return null;return(<div className='bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-xl shadow-slate-200'><div className='flex items-center justify-between mb-4'><h3 className='font-bold text-xs opacity-70 uppercase tracking-widest'>Exchange Stats</h3><TrendingUp className='w-4 h-4 text-orange-400'/></div><div className='grid grid-cols-3 gap-4'><div><p className='text-2xl font-black'>{stats.active||0}</p><p className='text-[10px] font-bold opacity-50 uppercase mt-1'>Active</p></div><div><p className='text-2xl font-black'>{stats.completed||0}</p><p className='text-[10px] font-bold opacity-50 uppercase mt-1'>Done</p></div><div><p className='text-2xl font-black'>{stats.pending||0}</p><p className='text-[10px] font-bold opacity-50 uppercase mt-1'>Pending</p></div></div></div>);};

const ExchangePeopleWantYourSkill=({matches})=>{if(!matches||matches.length===0)return null;return(<Card><CardHeader icon={Flame} iconBg='bg-rose-50' iconColor='text-rose-500' title='People Want Your Skill' link='/profile/exchange-activity'/><div className='flex gap-3 px-4 pb-4 overflow-x-auto hide-scrollbar'>{matches.map(m=>(<Link key={m._id} to={'/user/'+m._id+'/overview'} className='flex flex-col items-center gap-2 min-w-[80px] group'><div className='relative'><img src={getAvatarUrl(m)} alt={m.name} className='w-12 h-12 rounded-full object-cover border-2 border-slate-100 group-hover:border-rose-300 transition-colors'/><div className='absolute -bottom-1 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap'>Wants: {m.get||'Skill'}</div></div><div className='text-center mt-1'><p className='text-xs font-bold text-slate-800 truncate max-w-[76px] group-hover:text-rose-600 transition-colors'>{m.name}</p></div></Link>))}</div></Card>);};

const SmartFeedSuggestions=({index=0,goal='Learn'})=>{
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch suggestions from unified endpoint
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const data = await feedService.getSuggestions(goal);
        setSuggestions(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch feed suggestions:', err);
        setError(err.message || 'Failed to load suggestions');
        setLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [goal]);
  
  if (loading) return null;
  if (error) return <div className='lg:hidden'>Error loading suggestions</div>;
  
  // Extract data from unified response
  const { courses = [], mentors = [], exchanges = [], stats = {} } = suggestions || {};
  
  // Priority mapping (1-100 scale) as specified in the plan
  const learnPriorities = {
    'LearnRecommendedCourses': 85,
    'LearnContinueLearning': 95,
    'LearnSuggestedMentors': 75,
    'LearnLearningStats': 65
  };
  
  const mentorPriorities = {
    'MentorStudentRequests': 95,
    'MentorDashboardStats': 85,
    'MentorCreateCourseCTA': 75,
    'MentorSuggestedLearners': 65
  };
  
  const exchangePriorities = {
    'ExchangeSkillMatches': 90,
    'ExchangeRequests': 85,
    'ExchangeStats': 75,
    'ExchangePeopleWantYourSkill': 65
  };
  
  // Build card components based on fetched data
  const learnCards = [];
  
  // Learn Recommended Courses
  if (courses.length > 0) {
    learnCards.push({
      component: <LearnRecommendedCourses courses={courses.slice(0, 3)} key='c' />,
      priority: learnPriorities.LearnRecommendedCourses,
      type: 'LearnRecommendedCourses'
    });
  }
  
  // Learn Continue Learning
  if (stats && (stats.enrolled || stats.completed || stats.hours)) {
    learnCards.push({
      component: <LearnContinueLearning stats={stats} key='cl' />,
      priority: learnPriorities.LearnContinueLearning,
      type: 'LearnContinueLearning'
    });
  }
  
  // Learn Suggested Mentors
  if (mentors.length > 0) {
    learnCards.push({
      component: <LearnSuggestedMentors mentors={mentors.slice(0, 5)} key='m' />,
      priority: learnPriorities.LearnSuggestedMentors,
      type: 'LearnSuggestedMentors'
    });
  }
  
  // Learn Learning Stats
  if (stats && (stats.enrolled || stats.completed || stats.hours)) {
    learnCards.push({
      component: <LearnLearningStats stats={stats} key='s' />,
      priority: learnPriorities.LearnLearningStats,
      type: 'LearnLearningStats'
    });
  }
  
  const mentorCards = [];
  
  // Mentor Student Requests
  if (mentors.length > 0) {
    mentorCards.push({
      component: <MentorStudentRequests students={mentors.slice(0, 3)} key='r' />,
      priority: mentorPriorities.MentorStudentRequests,
      type: 'MentorStudentRequests'
    });
  }
  
  // Mentor Dashboard Stats
  if (stats && (stats.totalStudents || stats.rating || stats.totalCourses || stats.totalSessions)) {
    mentorCards.push({
      component: <MentorDashboardStats stats={stats} key='s' />,
      priority: mentorPriorities.MentorDashboardStats,
      type: 'MentorDashboardStats'
    });
  }
  
  // Mentor Create Course CTA
  mentorCards.push({
    component: <MentorCreateCourseCTA key='t' />,
    priority: mentorPriorities.MentorCreateCourseCTA,
    type: 'MentorCreateCourseCTA'
  });
  
  // Mentor Suggested Learners
  if (exchanges.length > 0) {
    mentorCards.push({
      component: <MentorSuggestedLearners learners={exchanges.slice(0, 5)} key='l' />,
      priority: mentorPriorities.MentorSuggestedLearners,
      type: 'MentorSuggestedLearners'
    });
  }
  
  const exchangeCards = [];
  
  // Exchange Skill Matches
  if (exchanges.length > 0) {
    exchangeCards.push({
      component: <ExchangeSkillMatches matches={exchanges.slice(0, 3)} key='m' />,
      priority: exchangePriorities.ExchangeSkillMatches,
      type: 'ExchangeSkillMatches'
    });
  }
  
  // Exchange Requests
  if (mentors.length > 0) {
    exchangeCards.push({
      component: <ExchangeRequests requests={mentors.slice(0, 3)} key='r' />,
      priority: exchangePriorities.ExchangeRequests,
      type: 'ExchangeRequests'
    });
  }
  
  // Exchange Stats
  if (stats && (stats.active || stats.completed || stats.pending)) {
    exchangeCards.push({
      component: <ExchangeStats stats={stats} key='s' />,
      priority: exchangePriorities.ExchangeStats,
      type: 'ExchangeStats'
    });
  }
  
  // Exchange People Want Your Skill
  if (exchanges.length > 0) {
    exchangeCards.push({
      component: <ExchangePeopleWantYourSkill matches={exchanges.slice(0, 4)} key='p' />,
      priority: exchangePriorities.ExchangePeopleWantYourSkill,
      type: 'ExchangePeopleWantYourSkill'
    });
  }
  
  let cards = [];
  switch(goal){
    case 'Mentor':
      cards = mentorCards;
      break;
    case 'Exchange':
      cards = exchangeCards;
      break;
    default:
      cards = learnCards;
      break;
  }
  
  // Sort cards by priority (highest first)
  const sortedCards = [...cards].sort((a, b) => b.priority - a.priority);
  
  // Limit to 2-3 cards MAX per session per goal
  // We'll show 2 cards for now, but this could be made dynamic based on engagement
  const maxCards = Math.min(3, sortedCards.length);
  const numToShow = Math.min(2, maxCards); // Show 2 cards as default
  
  // Select top priority cards
  const topCards = sortedCards.slice(0, numToShow);
  
  // Cycle through the selected cards based on index
  const selectedCard = topCards[index % topCards.length];
  
  if (!selectedCard || !selectedCard.component) return null;
  
  return (
    <div className='lg:hidden animate-fade-in'>
      {selectedCard.component}
    </div>
  );
};
export default SmartFeedSuggestions;
