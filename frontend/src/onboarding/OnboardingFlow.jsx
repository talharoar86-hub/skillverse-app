import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { profileService } from '../services/api';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight,
  Plus, 
  Rocket, 
  Zap, 
  Users, 
  BookOpen, 
  Target, 
  Clock,
  Briefcase,
  Star,
  GraduationCap
} from 'lucide-react';
import { cn } from '../utils/cn';

const ALL_SKILLS = [
  "JavaScript", "Python", "React", "Node.js", "UI/UX Design", 
  "Machine Learning", "Data Analysis", "Digital Marketing", 
  "Cybersecurity", "Blockchain", "DevOps", "Mobile Dev",
  "Tailwind CSS", "TypeScript", "SQL", "Cloud Computing"
];

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customSkill, setCustomSkill] = useState("");
  
  const [data, setData] = useState({
    mySkills: [],
    learnSkills: [],
    goal: 'Learn',
    experienceLevel: 'Beginner',
    availability: '5 hours/week'
  });

  const handleNext = () => setStep(s => Math.min(s + 1, 6));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const toggleArrayItem = (field, item) => {
    setData(prev => {
      const arr = prev[field];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter(i => i !== item) };
      } else {
        return { ...prev, [field]: [...arr, item] };
      }
    });
  };

  const addCustomSkill = (field) => {
    if (!customSkill.trim()) return;
    if (!data[field].includes(customSkill.trim())) {
      setData(prev => ({ ...prev, [field]: [...prev[field], customSkill.trim()] }));
    }
    setCustomSkill("");
  };

  const handleComplete = async () => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      await profileService.updateProfile(user._id || user.id, {
        skills: data.mySkills,
        learningGoals: data.learnSkills,
        experienceLevel: data.experienceLevel,
        goal: data.goal,
        availability: data.availability,
        onboardingComplete: true
      });

      await completeOnboarding();
      navigate("/");
    } catch(err) {
      console.error("Failed to complete onboarding", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [1, 2, 3, 4, 5, 6];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-12 font-inter text-slate-800">
      <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row overflow-hidden min-h-[650px]">
        
        {/* Left: Vertical Progress Stepper */}
        <div className="hidden md:flex w-56 bg-slate-50/50 p-12 flex-col items-center border-r border-slate-100/50">
          <div className="flex flex-col gap-10 relative">
            {/* The Line */}
            <div className="absolute left-[13px] top-4 bottom-4 w-[1px] bg-slate-200"></div>
            
            {steps.map((num) => (
              <div key={num} className="relative z-10">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                  step === num 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-125" 
                    : step > num 
                      ? "bg-slate-200 text-slate-500" 
                      : "bg-white border border-slate-200 text-slate-300"
                )}>
                  {num}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Content Area */}
        <div className="flex-1 p-8 md:p-20 flex flex-col">
          {/* Header */}
          <div className="mb-10">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 block">Step {step}</span>
            <h2 className="text-3xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
              {step === 1 && `Welcome to SkillVerse, ${user?.name?.split(' ')[0]}`}
              {step === 2 && "What skills do you have?"}
              {step === 3 && "What do you want to learn?"}
              {step === 4 && "Choose your primary goal"}
              {step === 5 && "What's your experience level?"}
              {step === 6 && "How much time can you commit?"}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
              {step === 1 && "Discover paths, mentors, and tools tailored specifically to your professional goals in roughly 30 seconds."}
              {step === 2 && "Select tools or technologies you're already proficient in. This helps us match you with the right opportunities."}
              {step === 3 && "Pick the skills you're most excited to master. We'll curate courses and mentors to help you get there."}
              {step === 4 && "Choose the path that best describes your intent on the platform. This will customize your home feed."}
              {step === 5 && "Knowing your proficiency level helps us recommend content that matches your current expertise."}
              {step === 6 && "Select your weekly availability so we can help you set realistic learning milestones."}
            </p>
          </div>

          {/* Core Content Grid */}
          <div className="flex-1 flex flex-col justify-start">
            
            {(step === 2 || step === 3) && (
              <div className="animate-fade-in">
                <div className="flex flex-wrap gap-2.5 mb-8 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {(step === 2 ? ALL_SKILLS : ALL_SKILLS.filter(s => !data.mySkills.includes(s))).map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleArrayItem(step === 2 ? 'mySkills' : 'learnSkills', skill)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl border-2 font-bold transition-all duration-200 text-xs flex items-center gap-2",
                        (step === 2 ? data.mySkills : data.learnSkills).includes(skill)
                          ? "border-indigo-600 bg-white text-indigo-600"
                          : "border-slate-50 text-slate-500 bg-slate-50 hover:border-slate-100"
                      )}
                    >
                      {skill}
                      {(step === 2 ? data.mySkills : data.learnSkills).includes(skill) && (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white stroke-[4]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="relative max-w-xs group">
                  <input 
                    type="text" value={customSkill} onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomSkill(step === 2 ? 'mySkills' : 'learnSkills')}
                    placeholder="Add custom..."
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-xl px-5 py-3 outline-none transition-all pr-12 text-xs font-bold"
                  />
                  <Plus className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer group-hover:text-indigo-600 transition-colors" onClick={() => addCustomSkill(step === 2 ? 'mySkills' : 'learnSkills')} />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 animate-fade-in">
                {[
                  { id: 'Learn', icon: BookOpen, title: 'Learn' },
                  { id: 'Mentor', icon: Users, title: 'Mentor' },
                  { id: 'Exchange', icon: Target, title: 'Exchange' }
                ].map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => setData({ ...data, goal: goal.id })}
                    className={cn(
                      "p-8 rounded-2xl border-2 transition-all duration-300 relative text-center group bg-white",
                      data.goal === goal.id 
                        ? "border-indigo-600 shadow-xl shadow-indigo-50/50" 
                        : "border-slate-50 hover:border-slate-100"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 flex items-center justify-center mx-auto mb-4 transition-colors",
                      data.goal === goal.id ? "text-indigo-600 scale-110" : "text-slate-300 group-hover:text-slate-400"
                    )}>
                      {React.createElement(goal.icon, { size: 32 })}
                    </div>
                    <span className="font-bold text-sm text-slate-800">{goal.title}</span>
                    {data.goal === goal.id && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-100">
                         <Check className="w-3 h-3 text-white stroke-[4]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-3 max-w-sm animate-fade-in">
                {[
                  { id: 'Beginner', icon: GraduationCap, title: 'Beginner' },
                  { id: 'Intermediate', icon: Star, title: 'Intermediate' },
                  { id: 'Advanced / Expert', icon: Briefcase, title: 'Advanced / Expert' }
                ].map(level => (
                  <button
                    key={level.id}
                    onClick={() => setData({ ...data, experienceLevel: level.id })}
                    className={cn(
                      "w-full p-5 rounded-2xl border-2 flex items-center justify-between text-left transition-all duration-300 bg-white",
                      data.experienceLevel === level.id 
                        ? "border-indigo-600 shadow-md shadow-indigo-50/50" 
                        : "border-slate-50 hover:border-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        data.experienceLevel === level.id ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-300"
                      )}>
                        {React.createElement(level.icon, { size: 20 })}
                      </div>
                      <span className="font-bold text-sm text-slate-800">{level.title}</span>
                    </div>
                    {data.experienceLevel === level.id && (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white stroke-[4]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {step === 6 && (
              <div className="grid grid-cols-2 gap-4 max-w-sm animate-fade-in">
                {[
                  { id: '2 hours/week', val: '2 hrs/wk' },
                  { id: '5 hours/week', val: '5 hrs/wk' },
                  { id: '10 hours/week', val: '10 hrs/wk' },
                  { id: '20+ hours/week', val: '20+ hrs/wk' }
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => setData({ ...data, availability: option.id })}
                    className={cn(
                      "p-6 py-8 rounded-[1.5rem] border-2 flex flex-col items-center gap-2 transition-all duration-300 bg-white",
                      data.availability === option.id
                        ? "border-indigo-600 shadow-xl shadow-indigo-50/50"
                        : "border-slate-50 hover:border-slate-100"
                    )}
                  >
                    <span className="text-xl font-black text-slate-900">{option.val.split(' ')[0]}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{option.val.split(' ')[1]}</span>
                    {data.availability === option.id && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white stroke-[4]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Buttons Styling to match image */}
          <div className="mt-16 flex items-center gap-8 border-t border-slate-50 pt-8">
            <button 
              onClick={step === 6 ? handleComplete : handleNext}
              disabled={isSubmitting}
              className="bg-indigo-600 text-white min-w-[150px] px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200/50 flex items-center justify-center gap-3 text-sm active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                 <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>{step === 6 ? 'Get Started' : 'Next'} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            {step > 1 && (
              <button 
                onClick={handleBack}
                className="text-slate-400 hover:text-slate-900 font-bold text-sm transition-colors flex items-center gap-2 hover:translate-x-[-2px]"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OnboardingFlow;
