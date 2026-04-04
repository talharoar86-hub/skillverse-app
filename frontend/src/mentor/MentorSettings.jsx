import React, { useState, useEffect } from 'react';
import api from '../services/axiosClient';
import {
  Settings, Loader2, Check, Bell, Mail, Calendar, Star, Users, BookOpen
} from 'lucide-react';
import { cn } from '../utils/cn';

const defaultSettings = {
  emailNotifications: true,
  enrollmentAlerts: true,
  sessionReminders: true,
  reviewAlerts: true,
  mentorshipRequests: true,
  marketingEmails: false
};

const settingFields = [
  { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive email summaries of your dashboard activity', icon: Mail },
  { key: 'enrollmentAlerts', label: 'Enrollment Alerts', description: 'Get notified when a student enrolls in your course', icon: BookOpen },
  { key: 'sessionReminders', label: 'Session Reminders', description: 'Receive reminders before scheduled sessions', icon: Calendar },
  { key: 'reviewAlerts', label: 'Review Alerts', description: 'Get notified when you receive a new review', icon: Star },
  { key: 'mentorshipRequests', label: 'Mentorship Requests', description: 'Receive notifications for new mentorship requests', icon: Users },
  { key: 'marketingEmails', label: 'Marketing Emails', description: 'Receive tips, updates, and promotional content', icon: Bell }
];

const MentorSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const { data } = await api.get('/mentor/settings');
      setSettings({ ...defaultSettings, ...data });
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSetting = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    setSaved(false);

    setIsSaving(true);
    try {
      await api.put('/mentor/settings', updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings', err);
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage your notification preferences.</p>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 animate-fade-in">
            <Check className="w-4 h-4" /> Saved
          </span>
        )}
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-500" /> Notification Preferences
          </h3>
          <p className="text-xs text-slate-400 mt-1">Choose which notifications you want to receive.</p>
        </div>
        <div className="divide-y divide-slate-50">
          {settingFields.map(field => {
            const Icon = field.icon;
            return (
              <div key={field.key} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">{field.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{field.description}</p>
                </div>
                <button
                  onClick={() => toggleSetting(field.key)}
                  disabled={isSaving}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0",
                    settings[field.key] ? "bg-indigo-600" : "bg-slate-200"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                    settings[field.key] ? "left-[22px]" : "left-0.5"
                  )} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MentorSettings;
