import React, { useState, useEffect } from 'react';
import { scheduleService } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import {
  Calendar, Clock, Plus, Trash2, Loader2, Check, X, Globe,
  Copy, Settings, CalendarDays, DollarSign, RefreshCw, Link2, Unlink, Save
} from 'lucide-react';
import { cn } from '../utils/cn';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = [];
for (let h = 6; h <= 22; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const DURATION_PRESETS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
];

const BUFFER_OPTIONS = [
  { label: 'No buffer', value: 0 },
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
];

const BREAK_OPTIONS = [
  { label: 'No break', value: 0 },
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
];

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Asia/Seoul', label: 'Korea (KST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST)' },
  { value: 'Pacific/Auckland', label: 'New Zealand (NZST)' },
  { value: 'America/Toronto', label: 'Toronto (ET)' },
  { value: 'America/Vancouver', label: 'Vancouver (PT)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET)' },
];

const MentorSchedule = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState({});
  const [templates, setTemplates] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [calendarSync, setCalendarSync] = useState({ google: { enabled: false }, outlook: { enabled: false } });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [timezone, setTimezone] = useState('UTC');
  const [selectedDay, setSelectedDay] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showBlockDateModal, setShowBlockDateModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [activeTab, setActiveTab] = useState('weekly');
  const [calendarError, setCalendarError] = useState(null);
  const [calendarSuccess, setCalendarSuccess] = useState(null);
  
  const [newSlotStart, setNewSlotStart] = useState('');
  const [newSlotDuration, setNewSlotDuration] = useState(60);
  const [newSlotSessionType, setNewSlotSessionType] = useState('one-on-one');
  const [newSlotMaxParticipants, setNewSlotMaxParticipants] = useState(1);
  const [newSlotBuffer, setNewSlotBuffer] = useState(0);
  const [newSlotBreak, setNewSlotBreak] = useState(0);
  const [newSlotPrice, setNewSlotPrice] = useState('');
  
  const [templateName, setTemplateName] = useState('');
  const [templateDays, setTemplateDays] = useState([]);
  const [templateStartTime, setTemplateStartTime] = useState('');
  const [templateDuration, setTemplateDuration] = useState(60);
  const [templateSessionType, setTemplateSessionType] = useState('one-on-one');
  const [templateMaxParticipants, setTemplateMaxParticipants] = useState(1);
  const [templateBuffer, setTemplateBuffer] = useState(0);
  const [templateBreak, setTemplateBreak] = useState(0);
  const [templatePrice, setTemplatePrice] = useState('');
  
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockRecurring, setBlockRecurring] = useState(false);
  
  const [copyFromDay, setCopyFromDay] = useState(1);
  const [copyToDays, setCopyToDays] = useState([]);

  useEffect(() => { loadSchedule(); }, []);
  useEffect(() => {
    if (!user?._id) return;
    const params = new URLSearchParams(window.location.search);
    const calendarProvider = params.get('calendar');
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if ((calendarProvider === 'google' || calendarProvider === 'outlook') && accessToken && refreshToken) {
      const connectAndCleanup = async () => {
        try {
          await scheduleService.connectCalendar(user._id, calendarProvider, accessToken, refreshToken);
          setCalendarSync(prev => ({ ...prev, [calendarProvider]: { enabled: true } }));
          setCalendarSuccess(`${calendarProvider === 'google' ? 'Google' : 'Outlook'} Calendar connected!`);
          setTimeout(() => setCalendarSuccess(null), 5000);
        } catch (err) {
          setCalendarError('Failed to connect calendar');
          setTimeout(() => setCalendarError(null), 5000);
        }
        window.history.replaceState({}, '', '/mentor/schedule');
      };
      connectAndCleanup();
    } else if (calendarProvider === 'error') {
      setCalendarError('Failed to connect calendar');
      setTimeout(() => setCalendarError(null), 5000);
      window.history.replaceState({}, '', '/mentor/schedule');
    }
  }, [user]);

  const loadSchedule = async () => {
    try {
      const data = await scheduleService.getSchedule(user._id);
      const schedMap = {};
      if (data && data.length > 0) {
        data.forEach(s => {
          schedMap[s.dayOfWeek] = s.slots || [];
          if (s.timezone) setTimezone(s.timezone);
        });
        if (data[0].blockedDates) setBlockedDates(data[0].blockedDates);
        if (data[0].calendarSync) setCalendarSync(data[0].calendarSync);
        if (data[0].templates) setTemplates(data[0].templates);
      }
      setSchedule(schedMap);
    } catch (err) {
      console.error('Failed to load schedule', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const addSlot = (day) => {
    if (!newSlotStart || !newSlotDuration) return;
    const endTime = getEndTime(newSlotStart, newSlotDuration);
    if (endTime > '22:00') return;

    setSchedule(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), {
        startTime: newSlotStart,
        endTime: endTime,
        duration: newSlotDuration,
        sessionType: newSlotSessionType,
        maxParticipants: newSlotMaxParticipants,
        bufferTime: newSlotBuffer,
        breakTime: newSlotBreak,
        priceOverride: newSlotPrice ? parseFloat(newSlotPrice) : null,
        status: 'available',
        isBooked: false
      }]
    }));
    setNewSlotStart('');
    setNewSlotPrice('');
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
          duration: s.duration || 60,
          sessionType: s.sessionType || 'one-on-one',
          maxParticipants: s.maxParticipants || 1,
          bufferTime: s.bufferTime || 0,
          breakTime: s.breakTime || 0,
          priceOverride: s.priceOverride,
          status: s.status || 'available',
          isBooked: s.isBooked || false,
          bookedBy: s.bookedBy?._id || s.bookedBy
        }))
      }));
      await scheduleService.updateSchedule(schedules, timezone, blockedDates, templates);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save schedule', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTemplate = () => {
    if (!templateName || templateDays.length === 0 || !templateStartTime) return;
    const newTemplate = {
      name: templateName,
      days: templateDays,
      startTime: templateStartTime,
      duration: templateDuration,
      sessionType: templateSessionType,
      maxParticipants: templateMaxParticipants,
      bufferTime: templateBuffer,
      breakTime: templateBreak,
      priceOverride: templatePrice ? parseFloat(templatePrice) : null
    };
    setTemplates(prev => [...prev, newTemplate]);
    setTemplateName('');
    setTemplateDays([]);
    setTemplateStartTime('');
    setShowTemplateModal(false);
  };

  const handleApplyTemplate = (template) => {
    const newSchedule = { ...schedule };
    template.days.forEach(day => {
      const endTime = getEndTime(template.startTime, template.duration);
      newSchedule[day] = [...(newSchedule[day] || []), {
        startTime: template.startTime,
        endTime: endTime,
        duration: template.duration,
        sessionType: template.sessionType,
        maxParticipants: template.maxParticipants,
        bufferTime: template.bufferTime,
        breakTime: template.breakTime,
        priceOverride: template.priceOverride,
        status: 'available',
        isBooked: false
      }];
    });
    setSchedule(newSchedule);
  };

  const handleDeleteTemplate = (idx) => {
    setTemplates(prev => prev.filter((_, i) => i !== idx));
  };

  const handleBlockDate = () => {
    if (!blockDate) return;
    const newBlocked = { date: blockDate, reason: blockReason, isRecurring: blockRecurring };
    setBlockedDates(prev => [...prev, newBlocked]);
    setBlockDate('');
    setBlockReason('');
    setBlockRecurring(false);
    setShowBlockDateModal(false);
  };

  const handleRemoveBlockDate = (idx) => {
    setBlockedDates(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCopySlots = () => {
    if (copyToDays.length === 0) return;
    const slotsToCopy = schedule[copyFromDay] || [];
    const newSchedule = { ...schedule };
    copyToDays.forEach(day => {
      newSchedule[day] = [...(newSchedule[day] || []), ...slotsToCopy.map(s => ({ ...s }))];
    });
    setSchedule(newSchedule);
    setShowCopyModal(false);
    setCopyToDays([]);
  };

  const handleConnectGoogle = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID;
    const redirectUri = 'http://localhost:5000/api/schedule/calendar/callback';
    const scope = 'https://www.googleapis.com/auth/calendar';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
    window.location.href = authUrl;
  };

  const handleConnectOutlook = () => {
    const clientId = import.meta.env.VITE_OUTLOOK_CLIENT_ID;
    const redirectUri = 'http://localhost:5000/api/schedule/outlook/callback';
    const scope = 'Calendars.ReadWrite offline_access';
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  };

  const handleSyncCalendar = async (provider) => {
    try {
      setCalendarError(null);
      await scheduleService.syncCalendar(user._id);
      setCalendarSuccess(`${provider === 'google' ? 'Google' : 'Outlook'} Calendar synced!`);
      setTimeout(() => setCalendarSuccess(null), 5000);
    } catch (err) {
      setCalendarError(`Failed to sync ${provider === 'google' ? 'Google' : 'Outlook'} Calendar`);
      setTimeout(() => setCalendarError(null), 5000);
    }
  };

  const handleDisconnectCalendar = async (provider) => {
    try {
      setCalendarError(null);
      await scheduleService.disconnectCalendar(user._id, provider);
      setCalendarSync(prev => ({ ...prev, [provider]: { enabled: false } }));
      setCalendarSuccess(`${provider === 'google' ? 'Google' : 'Outlook'} Calendar disconnected`);
      setTimeout(() => setCalendarSuccess(null), 5000);
    } catch (err) {
      setCalendarError(`Failed to disconnect`);
      setTimeout(() => setCalendarError(null), 5000);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const today = new Date().toISOString().split('T')[0];

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
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage your weekly availability, templates, and calendar sync.</p>
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
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {['weekly', 'blocked', 'templates', 'calendar'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-bold capitalize transition-colors border-b-2 -mb-px",
              activeTab === tab ? "text-indigo-600 border-indigo-600" : "text-slate-500 border-transparent hover:text-slate-700"
            )}
          >
            {tab === 'weekly' && <Calendar className="w-4 h-4 inline mr-2" />}
            {tab === 'blocked' && <CalendarDays className="w-4 h-4 inline mr-2" />}
            {tab === 'templates' && <Copy className="w-4 h-4 inline mr-2" />}
            {tab === 'calendar' && <Link2 className="w-4 h-4 inline mr-2" />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'weekly' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-indigo-500" />
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Timezone</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none">
                    {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <button onClick={() => setShowCopyModal(true)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-indigo-200 hover:shadow-md transition-all text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl"><Copy className="w-5 h-5 text-indigo-500" /></div>
                <div><p className="text-sm font-bold text-slate-900">Copy Slots</p><p className="text-xs text-slate-500">Bulk copy to other days</p></div>
              </div>
            </button>
            <button onClick={() => setShowTemplateModal(true)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-indigo-200 hover:shadow-md transition-all text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl"><Settings className="w-5 h-5 text-emerald-500" /></div>
                <div><p className="text-sm font-bold text-slate-900">Templates</p><p className="text-xs text-slate-500">Create recurring patterns</p></div>
              </div>
            </button>
            <button onClick={() => setShowBlockDateModal(true)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-indigo-200 hover:shadow-md transition-all text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 rounded-xl"><CalendarDays className="w-5 h-5 text-rose-500" /></div>
                <div><p className="text-sm font-bold text-slate-900">Block Dates</p><p className="text-xs text-slate-500">Set holidays/vacations</p></div>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {DAYS.map((day, dayIdx) => (
              <div key={dayIdx} className={cn("bg-white rounded-2xl border shadow-sm p-5 transition-all", selectedDay === dayIdx ? 'border-indigo-300 shadow-md' : 'border-slate-100')}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-slate-900">{day}</h3>
                  <button onClick={() => setSelectedDay(selectedDay === dayIdx ? null : dayIdx)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors">
                    {selectedDay === dayIdx ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>

                {(schedule[dayIdx] || []).length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium py-2">No availability set</p>
                ) : (
                  <div className="space-y-2 mb-3">
                    {(schedule[dayIdx] || []).map((slot, slotIdx) => (
                      <div key={slotIdx} className={cn("flex flex-col gap-2 p-2.5 rounded-xl text-xs font-bold", slot.status === 'booked' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-100')}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /><span>{slot.startTime} - {slot.endTime}</span></div>
                          {slot.status === 'booked' ? (
                            <span className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded">Booked</span>
                          ) : (
                            <button onClick={() => removeSlot(dayIdx, slotIdx)} className="p-1 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded", slot.sessionType === 'one-on-one' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>
                            {slot.sessionType === 'one-on-one' ? '1:1' : 'Group'}
                          </span>
                          {slot.sessionType === 'group' && <span className="text-[10px] text-slate-500">Max: {slot.maxParticipants}</span>}
                          {slot.bufferTime > 0 && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Buffer: {slot.bufferTime}m</span>}
                          {slot.breakTime > 0 && <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Break: {slot.breakTime}m</span>}
                          {slot.priceOverride && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center"><DollarSign className="w-2.5 h-2.5" />{slot.priceOverride}</span>}
                          <span className="text-[10px] text-slate-400">{slot.duration || 60}min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedDay === dayIdx && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <select value={newSlotStart} onChange={e => setNewSlotStart(e.target.value)} className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none">
                        <option value="">Start Time</option>
                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select value={newSlotDuration} onChange={e => setNewSlotDuration(parseInt(e.target.value))} className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none">
                        {DURATION_PRESETS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={newSlotSessionType} onChange={e => { setNewSlotSessionType(e.target.value); setNewSlotMaxParticipants(e.target.value === 'group' ? 5 : 1); }} className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none">
                        <option value="one-on-one">1:1 Session</option>
                        <option value="group">Group Session</option>
                      </select>
                      {newSlotSessionType === 'group' && (
                        <input type="number" min="2" max="100" value={newSlotMaxParticipants} onChange={e => setNewSlotMaxParticipants(parseInt(e.target.value))} className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none" placeholder="Max" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={newSlotBuffer} onChange={e => setNewSlotBuffer(parseInt(e.target.value))} className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none">
{BUFFER_OPTIONS.map(b => <option key={`buffer-${b.value}`} value={b.value}>{b.label}</option>)}
                      </select>
                      <select value={newSlotBreak} onChange={e => setNewSlotBreak(parseInt(e.target.value))} className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none">
{BREAK_OPTIONS.map(b => <option key={`break-${b.value}`} value={b.value}>{b.label}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <input type="number" step="0.01" min="0" value={newSlotPrice} onChange={e => setNewSlotPrice(e.target.value)} className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none" placeholder="Price override" />
                      </div>
                      <button onClick={() => addSlot(dayIdx)} disabled={!newSlotStart} className="p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-40 hover:bg-indigo-700 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'templates' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Recurring Slot Templates</h2>
            <button onClick={() => setShowTemplateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" /> Create Template
            </button>
          </div>
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No templates created yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-200 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900">{template.name}</h3>
                      <p className="text-xs text-slate-500">{template.days.map(d => SHORT_DAYS[d]).join(', ')} at {template.startTime}</p>
                    </div>
                    <button onClick={() => handleDeleteTemplate(idx)} className="p-1 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{template.duration}min</span>
                    <span className={cn("text-xs px-2 py-1 rounded", template.sessionType === 'one-on-one' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>
                      {template.sessionType === 'one-on-one' ? '1:1' : `Group (${template.maxParticipants})`}
                    </span>
                    {template.bufferTime > 0 && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded">Buffer: {template.bufferTime}m</span>}
                    {template.breakTime > 0 && <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded">Break: {template.breakTime}m</span>}
                  </div>
                  <button onClick={() => handleApplyTemplate(template)} className="w-full py-2 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-lg hover:bg-indigo-100 transition-colors">Apply to Days</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'blocked' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Blocked Dates</h2>
            <button onClick={() => setShowBlockDateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-colors">
              <Plus className="w-4 h-4" /> Block Date
            </button>
          </div>
          {blockedDates.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No blocked dates</p>
            </div>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((blocked, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-xl">
                  <div>
                    <p className="font-bold text-slate-900">{formatDate(blocked.date)}</p>
                    {blocked.reason && <p className="text-sm text-slate-500">{blocked.reason}</p>}
                    {blocked.isRecurring && <span className="text-xs bg-rose-200 text-rose-700 px-2 py-0.5 rounded mt-1 inline-block">Recurring yearly</span>}
                  </div>
                  <button onClick={() => handleRemoveBlockDate(idx)} className="p-2 text-rose-400 hover:text-rose-600 transition-colors"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {(calendarError || calendarSuccess) && (
            <div className={cn("p-4 rounded-xl text-sm font-bold flex items-center gap-2", calendarError ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200")}>
              {calendarError ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              {calendarError || calendarSuccess}
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Calendar Integration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  </div>
                  <div><h3 className="font-bold text-slate-900">Google Calendar</h3><p className="text-xs text-slate-500">Sync your availability</p></div>
                </div>
                {calendarSync.google?.enabled ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600"><Check className="w-4 h-4" /><span className="text-sm font-medium">Connected</span></div>
                    <button onClick={() => handleSyncCalendar('google')} className="w-full py-2 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" /> Sync Now</button>
                    <button onClick={() => handleDisconnectCalendar('google')} className="w-full py-2 border border-rose-200 text-rose-600 text-sm font-bold rounded-lg hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"><Unlink className="w-4 h-4" /> Disconnect</button>
                  </div>
                ) : (
                  <button onClick={handleConnectGoogle} className="w-full py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors">Connect Google Calendar</button>
                )}
              </div>
              <div className="border border-slate-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="#0078D4" d="M11.5 0H0v11.5h11.5V0zm1 0v11.5h8.5V0H12.5zM0 12.5V24h11.5V12.5H0zm12.5 0V24h8.5V12.5H12.5z"/></svg>
                  </div>
                  <div><h3 className="font-bold text-slate-900">Outlook Calendar</h3><p className="text-xs text-slate-500">Sync with Microsoft</p></div>
                </div>
                {calendarSync.outlook?.enabled ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600"><Check className="w-4 h-4" /><span className="text-sm font-medium">Connected</span></div>
                    <button onClick={() => handleSyncCalendar('outlook')} className="w-full py-2 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" /> Sync Now</button>
                    <button onClick={() => handleDisconnectCalendar('outlook')} className="w-full py-2 border border-rose-200 text-rose-600 text-sm font-bold rounded-lg hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"><Unlink className="w-4 h-4" /> Disconnect</button>
                  </div>
                ) : (
                  <button onClick={handleConnectOutlook} className="w-full py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors">Connect Outlook Calendar</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">Create Template</h2>
              <p className="text-sm text-slate-500 mt-1">Set up recurring slot patterns</p>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Template Name</label><input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-300" placeholder="e.g., Morning Slots" /></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Days</label><div className="flex flex-wrap gap-2">{DAYS.map((day, idx) => (<button key={idx} onClick={() => setTemplateDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx])} className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-colors", templateDays.includes(idx) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{SHORT_DAYS[idx]}</button>))}</div></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Start Time</label><select value={templateStartTime} onChange={e => setTemplateStartTime(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-300"><option key="select-time" value="">Select time</option>{TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Duration</label><select value={templateDuration} onChange={e => setTemplateDuration(parseInt(e.target.value))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-300">{DURATION_PRESETS.map(d => <option key={`duration-${d.value}`} value={d.value}>{d.label}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Session Type</label><select value={templateSessionType} onChange={e => { setTemplateSessionType(e.target.value); setTemplateMaxParticipants(e.target.value === 'group' ? 5 : 1); }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-300"><option key="one-on-one" value="one-on-one">One-on-One</option><option key="group" value="group">Group</option></select></div>
                {templateSessionType === 'group' && <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Max Participants</label><input type="number" min="2" max="100" value={templateMaxParticipants} onChange={e => setTemplateMaxParticipants(parseInt(e.target.value))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-300" /></div>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Buffer Time</label><select value={templateBuffer} onChange={e => setTemplateBuffer(parseInt(e.target.value))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-300">{BUFFER_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Break Time</label><select value={templateBreak} onChange={e => setTemplateBreak(parseInt(e.target.value))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-300">{BREAK_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}</select></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Price Override (optional)</label><input type="number" step="0.01" min="0" value={templatePrice} onChange={e => setTemplatePrice(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-300" placeholder="Leave empty to use default" /></div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowTemplateModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleAddTemplate} disabled={!templateName || templateDays.length === 0 || !templateStartTime} className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">Create Template</button>
            </div>
          </div>
        </div>
      )}

      {showBlockDateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">Block Date</h2>
              <p className="text-sm text-slate-500 mt-1">Set holidays or vacation periods</p>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Date</label><input type="date" min={today} value={blockDate} onChange={e => setBlockDate(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-300" /></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Reason (optional)</label><input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-300" placeholder="e.g., Christmas holiday" /></div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="recurring" checked={blockRecurring} onChange={e => setBlockRecurring(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                <label htmlFor="recurring" className="text-sm text-slate-600 font-medium">Repeat yearly</label>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowBlockDateModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleBlockDate} disabled={!blockDate} className="flex-1 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors">Block Date</button>
            </div>
          </div>
        </div>
      )}

      {showCopyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">Copy Slots</h2>
              <p className="text-sm text-slate-500 mt-1">Bulk copy slots to multiple days</p>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Copy From</label><select value={copyFromDay} onChange={e => setCopyFromDay(parseInt(e.target.value))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-300">{DAYS.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}</select></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Copy To</label><div className="flex flex-wrap gap-2">{DAYS.map((day, idx) => (<button key={idx} onClick={() => setCopyToDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx])} disabled={idx === copyFromDay} className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-colors", idx === copyFromDay ? "bg-slate-100 text-slate-300 cursor-not-allowed" : copyToDays.includes(idx) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{SHORT_DAYS[idx]}</button>))}</div></div>
              {(schedule[copyFromDay] || []).length > 0 && <div className="p-3 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 mb-2">Slots to copy:</p><div className="space-y-1">{(schedule[copyFromDay] || []).map((slot, idx) => (<p key={idx} className="text-xs text-slate-600 font-medium">{slot.startTime} - {slot.endTime}</p>))}</div></div>}
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowCopyModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleCopySlots} disabled={copyToDays.length === 0 || (schedule[copyFromDay] || []).length === 0} className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">Copy {copyToDays.length} day{copyToDays.length !== 1 ? 's' : ''}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorSchedule;