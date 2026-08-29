'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Activity, CheckCircle, AlertTriangle,
  LogOut, Plus, Pencil, Trash2, RefreshCw, Clock,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AddFamilyModal } from '@/components/AddFamilyModal';
import { AddReminderModal } from '@/components/AddReminderModal';
import { Button } from '@/components/ui/button';

interface Patient {
  id: string;
  name: string;
  dob: string;
  medical_notes: string;
}

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  phone_number: string | null;
  photo_url: string | null;
}

interface KpiData {
  faces_today: number;
  reminder_compliance: number;
  missed_alerts: number;
  sos_events: number;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-brand/10 rounded-md ${className}`} />;
}

export default function CaregiverDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'reminders'>('overview');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [kpi] = useState<KpiData>({ faces_today: 0, reminder_compliance: 0, missed_alerts: 0, sos_events: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get the caregiver's patients
      const pRes = await fetchApi('/patients/');
      if (!pRes.ok) throw new Error('Failed to fetch patients');
      const pData = await pRes.json();
      const patients: Patient[] = pData.data || [];

      if (patients.length === 0) {
        setLoading(false);
        return;
      }

      const firstPatient = patients[0];
      setPatient(firstPatient);

      // 2. Get family members for this patient
      const fRes = await fetchApi(`/family/?patient_id=${firstPatient.id}`);
      if (fRes.ok) {
        const fData = await fRes.json();
        setFamily(fData.data || []);
      }

      // 3. Get reminders for this patient
      const rRes = await fetchApi(`/reminders/?patient_id=${firstPatient.id}`);
      if (rRes.ok) {
        const rData = await rRes.json();
        setReminders(rData.data || []);
      }
    } catch (err) {
      console.error(err);
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

  const handleDelete = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this person?')) return;
    const res = await fetchApi(`/family/${memberId}`, { method: 'DELETE' });
    if (res.ok) setFamily(prev => prev.filter(m => m.id !== memberId));
  };

  return (
    <ProtectedRoute allowedRoles={['caregiver', 'admin']}>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-brand/10 h-screen p-6 sticky top-0 flex flex-col">
          <div className="text-xl font-bold text-brand mb-8">ReMind AI</div>
          <nav className="flex flex-col gap-1 flex-1">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'network', label: 'Support Network', icon: Users },
              { id: 'reminders', label: 'Reminders', icon: Clock },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-brand/50 hover:text-emergency transition-colors text-sm"
          >
            <LogOut size={16} /> Sign out
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Header */}
          <header className="mb-8 flex items-center justify-between">
            <div>
              {loading ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-brand">
                    {patient ? `Patient: ${patient.name}` : 'No Patient Yet'}
                  </h1>
                  <p className="text-brand/50 text-sm mt-0.5">
                    Welcome back, {user?.name}
                  </p>
                </>
              )}
            </div>
            <button
              onClick={fetchData}
              className="p-2 rounded-xl text-brand/40 hover:text-brand hover:bg-brand/5 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </header>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Faces Recognized', value: kpi.faces_today, suffix: ' Today', icon: Users, color: 'text-brand' },
                  { label: 'Reminder Compliance', value: kpi.reminder_compliance, suffix: '%', icon: CheckCircle, color: 'text-success' },
                  { label: 'Missed Alerts', value: kpi.missed_alerts, suffix: '', icon: AlertTriangle, color: 'text-yellow-500' },
                  { label: 'SOS Events', value: kpi.sos_events, suffix: '', icon: Activity, color: 'text-emergency' },
                ].map(({ label, value, suffix, icon: Icon, color }) => (
                  <div key={label} className="bg-white p-6 rounded-2xl border border-brand/10 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center justify-between text-brand/50">
                      <span className="text-sm font-medium">{label}</span>
                      <Icon size={18} className={color} />
                    </div>
                    {loading ? (
                      <Skeleton className="h-9 w-16" />
                    ) : (
                      <div className="text-3xl font-bold text-brand">{value}{suffix}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Patient Info */}
              <div className="bg-white rounded-2xl border border-brand/10 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-brand mb-4">Patient Details</h2>
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>
                ) : patient ? (
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-brand/50 mb-1">Name</dt>
                      <dd className="font-medium text-brand">{patient.name}</dd>
                    </div>
                    <div>
                      <dt className="text-brand/50 mb-1">Date of Birth</dt>
                      <dd className="font-medium text-brand">{patient.dob}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-brand/50 mb-1">Medical Notes</dt>
                      <dd className="font-medium text-brand">{patient.medical_notes || '—'}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-brand/50 text-sm">
                    No patient linked yet. Go to{' '}
                    <button className="text-brand underline" onClick={() => setActiveTab('network')}>
                      Support Network
                    </button>{' '}
                    to get started.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Network Tab */}
          {activeTab === 'network' && (
            <div className="bg-white rounded-2xl border border-brand/10 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-brand">Family &amp; Known Persons</h2>
                  <p className="text-sm text-brand/50 mt-0.5">
                    {family.length} {family.length === 1 ? 'person' : 'people'} registered
                  </p>
                </div>
                <Button
                  onClick={() => setShowModal(true)}
                  disabled={!patient}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} /> Add Person
                </Button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : family.length === 0 ? (
                <div className="text-center py-16 text-brand/40">
                  <Users size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No family members yet</p>
                  <p className="text-sm mt-1">Click "Add Person" to register a face</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-brand/10 text-brand/50 text-sm">
                      <th className="pb-3 font-medium">Photo</th>
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Relationship</th>
                      <th className="pb-3 font-medium">Phone</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {family.map(member => (
                      <tr key={member.id} className="border-b border-brand/5 last:border-0 hover:bg-cream/50 transition-colors">
                        <td className="py-4">
                          {member.photo_url ? (
                            <img
                              src={member.photo_url}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover border border-brand/10"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-semibold text-sm">
                              {member.name[0]}
                            </div>
                          )}
                        </td>
                        <td className="py-4 font-medium text-brand">{member.name}</td>
                        <td className="py-4 text-brand/60">{member.relationship}</td>
                        <td className="py-4 text-brand/60">{member.phone_number || '—'}</td>
                        <td className="py-4 text-right">
                          <button
                            className="p-1.5 rounded-lg text-brand/40 hover:text-emergency hover:bg-emergency/10 transition-colors"
                            onClick={() => handleDelete(member.id)}
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <div className="bg-white rounded-2xl border border-brand/10 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-brand">Scheduled Reminders</h2>
                  <p className="text-sm text-brand/50 mt-0.5">
                    {reminders.length} total reminders
                  </p>
                </div>
                <Button
                  onClick={() => setShowReminderModal(true)}
                  disabled={!patient}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} /> Add Reminder
                </Button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : reminders.length === 0 ? (
                <div className="text-center py-16 text-brand/40">
                  <Clock size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No reminders scheduled</p>
                  <p className="text-sm mt-1">Click "Add Reminder" to schedule one</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-brand/10 text-brand/50 text-sm">
                      <th className="pb-3 font-medium">Title</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium">Time</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminders.map(rem => (
                      <tr key={rem.id} className="border-b border-brand/5 last:border-0 hover:bg-cream/50 transition-colors">
                        <td className="py-4 font-medium text-brand">{rem.title}</td>
                        <td className="py-4 text-brand/60 capitalize">{rem.category}</td>
                        <td className="py-4 text-brand/60">
                          {new Date(rem.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rem.status === 'completed' ? 'bg-success/10 text-success' :
                            rem.status === 'missed' ? 'bg-emergency/10 text-emergency' :
                            'bg-brand/10 text-brand'
                          }`}>
                            {rem.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            className="p-1.5 rounded-lg text-brand/40 hover:text-emergency hover:bg-emergency/10 transition-colors"
                            onClick={async () => {
                              if (confirm('Delete this reminder?')) {
                                await fetchApi(`/reminders/${rem.id}`, { method: 'DELETE' });
                                fetchData();
                              }
                            }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Add Family Modal */}
      {showModal && patient && (
        <AddFamilyModal
          patientId={patient.id}
          onClose={() => setShowModal(false)}
          onSuccess={() => { fetchData(); setShowModal(false); }}
        />
      )}

      {/* Add Reminder Modal */}
      {showReminderModal && patient && (
        <AddReminderModal
          patientId={patient.id}
          onClose={() => setShowReminderModal(false)}
          onSuccess={() => { fetchData(); setShowReminderModal(false); }}
        />
      )}
    </ProtectedRoute>
  );
}
