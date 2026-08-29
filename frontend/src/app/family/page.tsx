'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity, Clock, Image as ImageIcon, LogOut, Heart, AlertTriangle,
  CheckCircle2, XCircle, Pill, Coffee, CalendarHeart,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Patient {
  id: string;
  name: string;
  dob: string;
  medical_notes: string;
}

interface Reminder {
  id: string;
  category: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  status: string;
  priority: string;
}

interface SOSEvent {
  id: string;
  trigger_method: string;
  is_active: boolean;
  created_at: string;
  resolved_at: string | null;
}

export default function FamilyPortal() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'reminders' | 'sos'>('timeline');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Family members can view the first patient they are linked to
      // For now use the /patients/ endpoint which returns based on role
      const pRes = await fetchApi('/patients/');
      if (pRes.ok) {
        const pData = await pRes.json();
        const patients: Patient[] = pData.data || [];
        if (patients.length > 0) {
          const p = patients[0];
          setPatient(p);

          // Fetch reminders and SOS history in parallel
          const [rRes, sRes] = await Promise.all([
            fetchApi(`/reminders/?patient_id=${p.id}`),
            fetchApi(`/sos/${p.id}/history`),
          ]);

          if (rRes.ok) setReminders((await rRes.json()).data || []);
          if (sRes.ok) setSosEvents((await sRes.json()).data || []);
        }
      }
    } catch (err) {
      console.error('Failed to load family portal data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'medication': return <Pill size={18} />;
      case 'meal': return <Coffee size={18} />;
      case 'appointment': return <CalendarHeart size={18} />;
      default: return <Clock size={18} />;
    }
  };

  const completedReminders = reminders.filter(r => r.status === 'completed');
  const upcomingReminders = reminders.filter(r => r.status === 'upcoming');
  const missedReminders = reminders.filter(r => r.status === 'missed');
  const activeSOS = sosEvents.find(e => e.is_active);

  // Build a timeline from reminders and SOS events
  type TimelineItem = { time: string; label: string; detail: string; type: 'completed' | 'upcoming' | 'missed' | 'sos' };
  const timeline: TimelineItem[] = [
    ...completedReminders.map(r => ({
      time: r.scheduled_at,
      label: `Completed: ${r.title}`,
      detail: r.category,
      type: 'completed' as const,
    })),
    ...upcomingReminders.map(r => ({
      time: r.scheduled_at,
      label: `Upcoming: ${r.title}`,
      detail: r.category,
      type: 'upcoming' as const,
    })),
    ...missedReminders.map(r => ({
      time: r.scheduled_at,
      label: `Missed: ${r.title}`,
      detail: r.category,
      type: 'missed' as const,
    })),
    ...sosEvents.map(e => ({
      time: e.created_at,
      label: `SOS triggered via ${e.trigger_method}`,
      detail: e.resolved_at ? 'Resolved' : 'ACTIVE',
      type: 'sos' as const,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const dotColor = (type: string) => {
    switch (type) {
      case 'completed': return 'bg-success';
      case 'upcoming': return 'bg-brand';
      case 'missed': return 'bg-yellow-500';
      case 'sos': return 'bg-emergency';
      default: return 'bg-gray-400';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['family', 'caregiver', 'admin']}>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-brand/10 h-screen p-6 sticky top-0 flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <Heart size={22} className="text-brand" />
            <div className="text-xl font-bold text-brand">Family Portal</div>
          </div>
          <nav className="flex flex-col gap-1 flex-1">
            {([
              { id: 'timeline', label: 'Daily Timeline', icon: Activity },
              { id: 'reminders', label: 'Reminders', icon: Clock },
              { id: 'sos', label: 'SOS History', icon: AlertTriangle },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === id
                    ? 'bg-brand/10 text-brand font-medium'
                    : 'text-brand/60 hover:bg-brand/5'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
          <div className="text-sm text-brand/40 mb-3">
            Logged in as: {user?.name}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-brand/50 hover:text-emergency transition-colors text-sm"
          >
            <LogOut size={16} /> Sign out
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Active SOS Banner */}
          {activeSOS && (
            <div className="mb-6 bg-emergency/10 border border-emergency/20 text-emergency p-4 rounded-xl flex items-center gap-3 shadow-sm animate-pulse">
              <AlertTriangle size={24} />
              <div>
                <h3 className="font-bold text-lg">ACTIVE EMERGENCY</h3>
                <p className="text-sm">
                  Patient triggered SOS via {activeSOS.trigger_method} at{' '}
                  {new Date(activeSOS.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Header */}
          <header className="mb-8">
            {loading ? (
              <div className="h-8 w-64 bg-brand/5 rounded animate-pulse" />
            ) : (
              <>
                <h1 className="text-2xl font-bold text-brand">
                  {patient ? `Patient: ${patient.name}` : 'No Patient Linked'}
                </h1>
                <p className="text-brand/50 text-sm mt-0.5">
                  Stay updated on your loved one's daily activities
                </p>
              </>
            )}
          </header>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Completed', value: completedReminders.length, icon: CheckCircle2, color: 'text-success' },
              { label: 'Upcoming', value: upcomingReminders.length, icon: Clock, color: 'text-brand' },
              { label: 'Missed', value: missedReminders.length, icon: XCircle, color: 'text-yellow-500' },
              { label: 'SOS Events', value: sosEvents.length, icon: AlertTriangle, color: 'text-emergency' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white p-5 rounded-2xl border border-brand/10 shadow-sm flex items-center gap-4">
                <Icon size={24} className={color} />
                <div>
                  <div className="text-2xl font-bold text-brand">{value}</div>
                  <div className="text-sm text-brand/50">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="bg-white rounded-2xl border border-brand/10 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-brand mb-6">Activity Timeline</h2>
              {timeline.length === 0 ? (
                <div className="text-center py-12 text-brand/40">
                  <Activity size={36} className="mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No activity recorded yet</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-brand/10 ml-3 space-y-6">
                  {timeline.slice(0, 20).map((item, idx) => (
                    <div key={idx} className="pl-6 relative">
                      <div className={`w-3 h-3 rounded-full absolute -left-[7px] top-1.5 ${dotColor(item.type)}`} />
                      <p className="font-medium text-brand">{item.label}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-sm text-brand/50 capitalize">{item.detail}</span>
                        <span className="text-xs text-brand/40">
                          {new Date(item.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <div className="bg-white rounded-2xl border border-brand/10 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-brand mb-6">
                All Reminders ({reminders.length})
              </h2>
              {reminders.length === 0 ? (
                <div className="text-center py-12 text-brand/40">
                  <Clock size={36} className="mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No reminders scheduled</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-brand/10 text-brand/50 text-sm">
                      <th className="pb-3 font-medium">Title</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium">Time</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminders.map(rem => (
                      <tr key={rem.id} className="border-b border-brand/5 last:border-0 hover:bg-cream/50 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(rem.category)}
                            <span className="font-medium text-brand">{rem.title}</span>
                          </div>
                        </td>
                        <td className="py-3 text-brand/60 capitalize">{rem.category}</td>
                        <td className="py-3 text-brand/60">
                          {new Date(rem.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rem.status === 'completed' ? 'bg-success/10 text-success' :
                            rem.status === 'missed' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-brand/10 text-brand'
                          }`}>
                            {rem.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* SOS History Tab */}
          {activeTab === 'sos' && (
            <div className="bg-white rounded-2xl border border-brand/10 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-brand mb-6">
                Emergency History ({sosEvents.length})
              </h2>
              {sosEvents.length === 0 ? (
                <div className="text-center py-12 text-brand/40">
                  <AlertTriangle size={36} className="mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No emergency events recorded</p>
                  <p className="text-sm mt-1">That's a good thing!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sosEvents.map(event => (
                    <div
                      key={event.id}
                      className={`p-4 rounded-xl border flex items-center justify-between ${
                        event.is_active
                          ? 'border-emergency/30 bg-emergency/5'
                          : 'border-brand/10 bg-brand/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle
                          size={20}
                          className={event.is_active ? 'text-emergency' : 'text-brand/40'}
                        />
                        <div>
                          <p className="font-medium text-brand">
                            SOS triggered via {event.trigger_method}
                          </p>
                          <p className="text-sm text-brand/50">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        event.is_active
                          ? 'bg-emergency text-white animate-pulse'
                          : 'bg-success/10 text-success'
                      }`}>
                        {event.is_active ? 'ACTIVE' : 'Resolved'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
