import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '../api/auth/[...nextauth]/route';
import { getDashboardHome, type AppSession } from '../../lib/auth';

/**
 * Dashboard root redirects the authenticated user to the correct portal by role
 * before any legacy dashboard shell can be rendered.
 */
export default async function DashboardPage() {
  const session = (await getServerSession(authOptions)) as AppSession | null;

  redirect(getDashboardHome(session));
}
