import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Flame, BookOpen, Clock } from 'lucide-react';
import { cn } from '../utils/cn';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, isToday } from 'date-fns';

const LearningCalendar = ({ activityLog = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  // Create a map of dates with activity
  const activityMap = useMemo(() => {
    const map = {};
    activityLog.forEach(entry => {
      if (!entry.date) return;
      const key = format(new Date(entry.date), 'yyyy-MM-dd');
      if (!map[key]) {
        map[key] = { hours: 0, lessons: 0 };
      }
      map[key].hours += entry.hoursSpent || 0;
      map[key].lessons += entry.lessonsCompleted || 0;
    });
    return map;
  }, [activityLog]);

  const getActivityForDay = (day) => {
    const key = format(day, 'yyyy-MM-dd');
    return activityMap[key];
  };

  const getIntensity = (activity) => {
    if (!activity) return 0;
    const total = activity.hours + activity.lessons;
    if (total >= 5) return 4;
    if (total >= 3) return 3;
    if (total >= 1.5) return 2;
    if (total > 0) return 1;
    return 0;
  };

  const intensityColors = [
    'bg-slate-50',
    'bg-emerald-100',
    'bg-emerald-300',
    'bg-emerald-500',
    'bg-emerald-700',
  ];

  const [selectedDay, setSelectedDay] = useState(null);
  const selectedActivity = selectedDay ? getActivityForDay(selectedDay) : null;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </button>
        <h3 className="font-black text-lg text-slate-900">{format(currentMonth, 'MMMM yyyy')}</h3>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {days.map(day => {
          const activity = getActivityForDay(day);
          const intensity = getIntensity(activity);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative",
                intensityColors[intensity],
                isSelected && "ring-2 ring-indigo-500 ring-offset-1",
                today && "font-black",
                "hover:ring-2 hover:ring-indigo-200 hover:ring-offset-1"
              )}
            >
              <span className={cn(
                "text-xs font-bold",
                intensity >= 3 ? "text-white" : intensity >= 2 ? "text-emerald-700" : "text-slate-600",
                today && "text-indigo-600"
              )}>
                {format(day, 'd')}
              </span>
              {activity && intensity < 2 && (
                <div className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />
              )}
              {today && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="mt-4 p-4 bg-slate-50 rounded-2xl">
          <p className="text-sm font-bold text-slate-800 mb-2">{format(selectedDay, 'EEEE, MMMM d, yyyy')}</p>
          {selectedActivity ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-bold text-slate-700">{selectedActivity.hours}h</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-slate-700">{selectedActivity.lessons} lessons</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium">No activity on this day</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Less</span>
        {intensityColors.map((color, i) => (
          <div key={i} className={cn("w-4 h-4 rounded", color, i === 0 && "border border-slate-200")} />
        ))}
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">More</span>
      </div>
    </div>
  );
};

export default LearningCalendar;
