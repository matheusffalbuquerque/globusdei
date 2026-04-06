'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { getDashboardHome, type AppSession } from '../../lib/auth';

/**
 * Dashboard root redirects the authenticated user to the correct portal by role.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    router.replace(getDashboardHome(session as AppSession | null));
  }, [router, session, status]);

  return (
    <div className="flex min-h-[calc(100vh-145px)] items-center justify-center bg-slate-50">
      <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 text-sm font-semibold text-slate-500 shadow-sm">
        Redirecionando para o portal correto...
      </div>
    </div>
  );
}
