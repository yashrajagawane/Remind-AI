'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pill, Clock, CalendarHeart, Coffee, Droplets, Activity, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface Reminder {
  id: string;
  category: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  recurrence: string | null;
  priority: string;
  status: string;
}

interface Props {
  patientId?: string;
}

export default function ReminderFeed({ patientId }: Props) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await fetchApi(`/reminders/today?patient_id=${patientId}`);
      if (res.ok) {
        const json = await res.json();
        setReminders(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load reminders', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchReminders();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchReminders, 60_000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  const markDone = async (id: string) => {
    try {
      const res = await fetchApi(`/reminders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (res.ok) {
        setReminders(prev =>
          prev.map(r => (r.id === id ? { ...r, status: 'completed' } : r))
        );
        if ('speechSynthesis' in window) {
          const msg = new SpeechSynthesisUtterance('Great job! Reminder marked as done.');
          window.speechSynthesis.speak(msg);
        }
      }
    } catch (err) {
      console.error('Failed to mark reminder', err);
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'medication': return <Pill size={32} />;
      case 'meal': return <Coffee size={32} />;
      case 'appointment': return <CalendarHeart size={32} />;
      case 'hydration': return <Droplets size={32} />;
      case 'activity': return <Activity size={32} />;
      default: return <Clock size={32} />;
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-400 bg-orange-50';
      default: return 'border-brand bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-3xl shadow-xl border border-brand/20 p-6 h-[50vh] flex items-center justify-center">
        <div className="animate-pulse text-xl text-brand/70">Loading reminders...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-3xl shadow-xl border border-brand/20 p-6 h-[50vh] overflow-y-auto">
      {reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-brand/70">
          <CheckCircle2 size={48} className="mb-3 opacity-40" />
          <p className="text-xl font-medium">No reminders for today</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`p-5 rounded-2xl border-l-8 flex items-center gap-5 transition-all ${
                reminder.status === 'completed'
                  ? 'bg-slate-900 border-slate-700 opacity-60'
                  : priorityColor(reminder.priority)
              }`}
            >
              <div
                className={`p-3 rounded-full ${
                  reminder.status === 'completed'
                    ? 'bg-slate-700 text-slate-400'
                    : 'bg-brand/10 text-brand'
                }`}
              >
                {getIcon(reminder.category)}
              </div>

              <div className="flex-1">
                <h3
                  className={`text-2xl font-semibold ${
                    reminder.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-100'
                  }`}
                >
                  {reminder.title}
                </h3>
                <p className="text-lg text-slate-300 mt-0.5">{formatTime(reminder.scheduled_at)}</p>
                {reminder.description && (
                  <p className="text-sm text-slate-400 mt-1">{reminder.description}</p>
                )}
              </div>

              {reminder.status === 'upcoming' && (
                <button
                  onClick={() => markDone(reminder.id)}
                  className="bg-success text-white px-6 py-4 rounded-xl text-xl font-bold hover:bg-green-600 transition-colors active:scale-95"
                >
                  Done
                </button>
              )}

              {reminder.status === 'completed' && (
                <span className="text-green-600 font-bold text-lg flex items-center gap-1">
                  <CheckCircle2 size={20} /> Done
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
