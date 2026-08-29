'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Role } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (!accessToken || !user) {
      router.push('/login');
    } else if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Direct user back to their correct dashboard
      if (user.role === 'caregiver') router.push('/caregiver');
      else if (user.role === 'family') router.push('/family');
      else if (user.role === 'patient') router.push('/patient');
      else router.push('/login');
    }
  }, [user, accessToken, allowedRoles, router, isMounted]);

  if (!isMounted) {
    return <div className="min-h-screen bg-cream flex items-center justify-center">Loading...</div>;
  }

  if (!accessToken || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
