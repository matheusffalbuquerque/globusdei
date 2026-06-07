import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '../[...nextauth]/route';
import { isAgentSession, type AppSession } from '../../../../lib/auth';

/**
 * Resolves portal availability from the authenticated NextAuth session.
 * Always returns false for collaborator portals on web-platform.
 */
export async function GET() {
  const session = (await getServerSession(authOptions)) as AppSession | null;

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const hasAgentPortal = isAgentSession(session);

  return NextResponse.json({
    authenticated: true,
    hasAgentPortal,
    hasCollaboratorPortal: false,
    source: {
      realmCollaborator: false,
      localCollaborator: false,
    },
  });
}
