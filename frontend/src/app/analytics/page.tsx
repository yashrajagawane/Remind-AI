'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, TrendingUp, PieChart as PieIcon, AlertTriangle,
  ArrowLeft, Download, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area,
  AreaChart,
} from 'recharts';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-brand/10 rounded-xl ${className}`} />;
}

interface KPI {
  faces_recognized_today: number;
  reminders_completed_pct: number;
  missed_reminders: number;
  sos_events: number;
  total_reminders: number;
  completed_reminders: number;
}

const CHART_COLORS = ['#2D7D46', '#3B9E5F', '#50C878', '#A8D8B9', '#F5C242', '#E63946'];

export default function AnalyticsDashboard() {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [recognitionData, setRecognitionData] = useState<any[]>([]);
  const [reminderData, setReminderData] = useState<any[]>([]);
  const [sosData, setSosData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const chartRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get patient
      const pRes = await fetchApi('/patients/');
      if (!pRes.ok) throw new Error('Failed to fetch patients');
      const pData = await pRes.json();
      const patients = pData.data || [];
      if (patients.length === 0) {
        setLoading(false);
        return;
      }
      const pid = patients[0].id;
      setPatientId(pid);
      setPatientName(patients[0].name);

      // Fetch all analytics in parallel
      const [sumRes, recRes, remRes, sosRes] = await Promise.all([
        fetchApi(`/analytics/${pid}/summary`),
        fetchApi(`/analytics/${pid}/recognitions`),
        fetchApi(`/analytics/${pid}/reminders`),
        fetchApi(`/analytics/${pid}/sos`),
      ]);

      if (sumRes.ok) setKpi((await sumRes.json()).data);
      if (recRes.ok) setRecognitionData((await recRes.json()).data || []);
      if (remRes.ok) setReminderData((await remRes.json()).data || []);
      if (sosRes.ok) setSosData((await sosRes.json()).data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportPDF = async () => {
    // Dynamic import to keep bundle small
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    if (!chartRef.current) return;

    const canvas = await html2canvas(chartRef.current, {
      scale: 2,
      backgroundColor: '#F9FAFB',
    });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.setFontSize(18);
    pdf.text(`ReMind AI - Analytics Report`, 14, 15);
    pdf.setFontSize(11);
    pdf.text(`Patient: ${patientName}`, 14, 22);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    pdf.addImage(imgData, 'PNG', 5, 35, pdfWidth - 10, Math.min(pdfHeight, 160));
    pdf.save(`remind-analytics-${patientName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <ProtectedRoute allowedRoles={['caregiver', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Top Bar */}
        <header className="bg-white border-b border-brand/10 px-8 py-4 sticky top-0 z-10 flex items-center justify-between" role="banner">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/caregiver')}
              aria-label="Back to dashboard"
              className="p-2 rounded-xl text-brand/40 hover:text-brand hover:bg-brand/5 transition-colors"
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-brand flex items-center gap-2">
                <BarChart3 size={22} aria-hidden="true" /> Analytics Dashboard
              </h1>
              <p className="text-sm text-brand/50" aria-live="polite">
                {patientName ? `Patient: ${patientName}` : 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              aria-label="Refresh data"
              className="p-2 rounded-xl text-brand/40 hover:text-brand hover:bg-brand/5 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} aria-hidden="true" />
            </button>
            <button
              onClick={handleExportPDF}
              disabled={loading}
              aria-busy={loading}
              className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl font-medium hover:bg-brand/90 active:scale-95 transition-all disabled:opacity-50"
            >
              <Download size={16} aria-hidden="true" /> Export PDF
            </button>
          </div>
        </header>

        <main id="main-content" className="p-8 max-w-7xl mx-auto" ref={chartRef} role="main" aria-label="Analytics charts and reports">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-brand/10 shadow-sm">
                  <Skeleton className="h-5 w-24 mb-3" />
                  <Skeleton className="h-9 w-16" />
                </div>
              ))
            ) : kpi ? (
              [
                { label: 'Faces Today', value: kpi.faces_recognized_today, icon: TrendingUp, color: 'text-brand' },
                { label: 'Compliance', value: `${kpi.reminders_completed_pct}%`, icon: PieIcon, color: 'text-success' },
                { label: 'Missed', value: kpi.missed_reminders, icon: AlertTriangle, color: 'text-yellow-500' },
                { label: 'SOS Events', value: kpi.sos_events, icon: AlertTriangle, color: 'text-emergency' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white p-6 rounded-2xl border border-brand/10 shadow-sm">
                  <div className="flex items-center justify-between text-brand/50 mb-2">
                    <span className="text-sm font-medium">{label}</span>
                    <Icon size={18} className={color} />
                  </div>
                  <div className="text-3xl font-bold text-brand">{value}</div>
                </div>
              ))
            ) : null}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recognition Trends — Area Chart */}
            <div className="bg-white p-6 rounded-2xl border border-brand/10 shadow-sm">
              <h3 className="text-lg font-semibold text-brand mb-4 flex items-center gap-2">
                <TrendingUp size={18} /> Face Recognition Trends (7 days)
              </h3>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={recognitionData}>
                    <defs>
                      <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2D7D46" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2D7D46" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="recognitions"
                      stroke="#2D7D46"
                      strokeWidth={2.5}
                      fill="url(#colorRec)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Reminder Compliance — Bar Chart */}
            <div className="bg-white p-6 rounded-2xl border border-brand/10 shadow-sm">
              <h3 className="text-lg font-semibold text-brand mb-4 flex items-center gap-2">
                <BarChart3 size={18} /> Reminder Compliance by Category
              </h3>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : reminderData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-brand/40">
                  No reminder data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={reminderData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,.1)',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="completed" name="Completed" fill="#2D7D46" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="missed" name="Missed" fill="#F5C242" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Pie Chart */}
            <div className="bg-white p-6 rounded-2xl border border-brand/10 shadow-sm">
              <h3 className="text-lg font-semibold text-brand mb-4 flex items-center gap-2">
                <PieIcon size={18} /> Overall Compliance Breakdown
              </h3>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : kpi && kpi.total_reminders > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: kpi.completed_reminders },
                        { name: 'Missed', value: kpi.missed_reminders },
                        { name: 'Pending', value: kpi.total_reminders - kpi.completed_reminders - kpi.missed_reminders },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={(props: any) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {[CHART_COLORS[0], CHART_COLORS[4], CHART_COLORS[3]].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-brand/40">
                  No reminder data available
                </div>
              )}
            </div>

            {/* SOS Event Log */}
            <div className="bg-white p-6 rounded-2xl border border-brand/10 shadow-sm">
              <h3 className="text-lg font-semibold text-brand mb-4 flex items-center gap-2">
                <AlertTriangle size={18} /> SOS Event Log
              </h3>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : sosData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-brand/40 flex-col gap-2">
                  <AlertTriangle size={32} className="opacity-30" />
                  <p>No SOS events recorded</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {sosData.map((e: any) => (
                    <div
                      key={e.id}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        e.is_active
                          ? 'border-emergency/30 bg-emergency/5'
                          : 'border-brand/10 bg-brand/5'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-brand text-sm">
                          Via {e.trigger_method} &middot; {e.contacts_notified} contacts notified
                        </p>
                        <p className="text-xs text-brand/50">
                          {new Date(e.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          e.is_active ? 'bg-emergency text-white' : 'bg-success/10 text-success'
                        }`}
                      >
                        {e.is_active ? 'ACTIVE' : 'Resolved'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
