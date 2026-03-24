'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * DoctorProtectedRoute — INTEGRATION POINT (new component)
 * Wraps pages that only doctors can access.
 * - Not logged in → redirect to /login
 * - Logged in but not a doctor → redirect to /dashboard
 */
export default function DoctorProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'doctor') {
        router.push('/dashboard'); // Not a doctor — go back to regular dashboard
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  return <>{children}</>;
}
