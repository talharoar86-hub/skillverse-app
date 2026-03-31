import React, { useState, useEffect } from 'react';
import { scheduleService } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import {
  Calendar, Clock, Plus, Trash2, Loader2, Check, X, Globe
} from 'lucide-react';
import { cn } from '../utils/cn';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = [];
for (let h = 6; h <= 22; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'];

const MentorSchedule = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [timezone, setTimezone] = useState('UTC');
  const [selectedDay, setSelectedDay] = useState(null);
  const [newSlotStart, setNewSlotStart] = useState('');
  const [newSlotEnd, setNewSlotEnd] = useState('');

  useEffect(() => { loadSchedule(); }, []);

  const loadSchedule = async () => {
    try {
      const data = await scheduleService.getSchedule(user._id);
      const schedMap = {};
      data.forEach(s => {
        schedMap[s.dayOfWeek] = s.slots || [];
        if (s.timezone) setTimezone(s.timezone);
      });
      setSchedule(schedMap);
    } catch (err) {
      console.error('Failed to load schedule', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addSlot = (day) => {
    if (!newSlotStart || !newSlotEnd) return;
    if (newSlotStart >= newSlotEnd) return;

    setSchedule(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), {
        startTime: newSlotStart,
        endTime: newSlotEnd,
        status: 'available',
        isBooked: false
      }]
    }));
    setNewSlotStart('');
    setNewSlotEnd('');
  };

  const removeSlot = (day, slotIdx) => {
    setSchedule(prev => ({
      ...prev,
      [day]: (prev[day] || []).filter((_, i) => i !== slotIdx)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      const schedules = Object.entries(schedule).map(([day, slots]) => ({
        dayOfWeek: parseInt(day),
        slots: slots.map(s => ({
          startTime: s.startTime,
          endTime: s.endTime,
          status: s.status || 'available',
          isBooked: s.isBooked || false,
          bookedBy: s.bookedBy?._id || s.bookedBy
        }))
      }));
      await scheduleService.updateSchedule(schedules, timezone);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save schedule', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Schedule</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Set your weekly availability for students to book sessions.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold animate-fade-in">
              <Check className="w-4 h-4" /> Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60 active:scale-95 transition-all"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </div>

      {/* Timezone */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-indigo-500" />
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
            >
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {DAYS.map((day, dayIdx) => (
          <div
            key={dayIdx}
            className={cn(
              "bg-white rounded-2xl border shadow-sm p-5 transition-all",
              selectedDay === dayIdx ? 'border-indigo-300 shadow-md' : 'border-slate-100'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900">{day}</h3>
              <button
                onClick={() => setSelectedDay(selectedDay === dayIdx ? null : dayIdx)}
                className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
              >
                {selectedDay === dayIdx ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>

            {/* Slots */}
            {(schedule[dayIdx] || []).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-2">No availability set</p>
            ) : (
              <div className="space-y-2 mb-3">
                {(schedule[dayIdx] || []).map((slot, slotIdx) => (
                  <div
                    key={slotIdx}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold",
                      slot.status === 'booked'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-slate-50 text-slate-600 border border-slate-100'
                    )}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span className="flex-1">{slot.startTime} - {slot.endTime}</span>
                    {slot.status === 'booked' && (
                      <span className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded">Booked</span>
                    )}
                    {slot.status !== 'booked' && (
                      <button
                        onClick={() => removeSlot(dayIdx, slotIdx)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Slot Form */}
            {selectedDay === dayIdx && (
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <select
                  value={newSlotStart}
                  onChange={e => setNewSlotStart(e.target.value)}
                  className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="">Start</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="text-slate-300 text-xs">→</span>
                <select
                  value={newSlotEnd}
                  onChange={e => setNewSlotEnd(e.target.value)}
                  className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="">End</option>
                  {TIME_SLOTS.filter(t => t > newSlotStart).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button
                  onClick={() => addSlot(dayIdx)}
                  disabled={!newSlotStart || !newSlotEnd}
                  className="p-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-40 hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MentorSchedule;
