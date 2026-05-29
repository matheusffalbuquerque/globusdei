import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import { authOptions } from '../api/auth/[...nextauth]/route';

/**
 * Dashboard is only a transient redirect route, so it should not render any
 * legacy shell while the destination portal is being resolved.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login?callbackUrl=/dashboard');
  }

  return children;
}
