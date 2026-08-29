'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { fetchApi } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import CameraFeed from '@/components/CameraFeed';
import ReminderFeed from '@/components/ReminderFeed';
import SOSButton from '@/components/SOSButton';
import VoiceAssistant from '@/components/VoiceAssistant';

interface Patient {
  id: string;
  name: string;
}

export default function PatientHome() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPatient() {
      try {
        if (user?.role === 'patient') {
          // If the patient is logged in directly, fetch their own profile
          // Since our current list_patients is for caregiver/admin, we use a workaround
          // For now, assume if role is patient, user.id is the patient.id
          setPatient({ id: user.id, name: user.name });
        } else if (user?.role === 'caregiver' || user?.role === 'admin') {
          // If caregiver is logged in on the tablet, get their primary patient
          const res = await fetchApi('/patients/');
          if (res.ok) {
            const data = await res.json();
            if (data.data && data.data.length > 0) {
              setPatient(data.data[0]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load patient', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPatient();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-pulse text-2xl font-semibold text-brand/80">Loading companion...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-3xl font-bold text-slate-100 mb-4">No Patient Profile Found</h1>
        <p className="text-xl text-slate-300 max-w-lg mb-8">
          Please log in as a caregiver to set up a patient profile first, or ensure a patient is assigned to this account.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="bg-brand text-white px-8 py-4 rounded-2xl text-xl font-bold"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['patient', 'caregiver', 'admin']}>
      <div className="bg-cream relative min-h-screen p-4 font-sans md:p-8">
        <header className="mx-auto mb-8 flex max-w-7xl items-center justify-between" role="banner">
          <h1 className="text-4xl font-bold tracking-tight text-slate-100 md:text-5xl">ReMind AI</h1>
          <div className="text-brand text-3xl font-bold" aria-label={`Greeting: Hello, ${patient.name.split(' ')[0]}`}>Hello, {patient.name.split(' ')[0]}</div>
        </header>

        <main id="main-content" className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2" role="main">
          {/* Left Column: Camera Feed */}
          <div className="flex flex-col gap-8">
            <section aria-label="Face recognition camera">
              <h2 className="mb-4 px-2 text-3xl font-bold text-slate-200">Who is this?</h2>
              <CameraFeed patientId={patient.id} />
            </section>
          </div>

          {/* Right Column: Reminders */}
          <div className="flex flex-col gap-8">
            <section aria-label="Today's reminders">
              <h2 className="mb-4 px-2 text-3xl font-bold text-slate-200">Today&apos;s Reminders</h2>
              <ReminderFeed patientId={patient.id} />
            </section>
          </div>
        </main>

        {/* Floating Emergency Button */}
        <SOSButton patientId={patient.id} ref={(node) => {
          if (node) {
            (window as any).triggerSOS = node.triggerSOS;
          }
        }} />
        <VoiceAssistant 
          onSOSTrigger={() => {
            if ((window as any).triggerSOS) (window as any).triggerSOS();
          }} 
        />
      </div>
    </ProtectedRoute>
  );
}
