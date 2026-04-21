import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '../[...nextauth]/route';
import { isAgentSession, isCollaboratorSession, type AppSession } from '../../../../lib/auth';

// MAIN_SERVICE_URL é a variável server-side (já inclui /api)
// ex: http://main-service:3001/api  (nunca usar NEXT_PUBLIC_ em Server Routes)
const MAIN_SERVICE_URL =
  process.env.MAIN_SERVICE_URL || 'http://localhost:3001/api';

/**
 * Resolves portal availability from the authenticated NextAuth session and the
 * local collaborator profile stored in the main service.
 */
export async function GET() {
  const session = (await getServerSession(authOptions)) as AppSession | null;

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const hasAgentPortal = isAgentSession(session);
  const hasRealmCollaboratorPortal = isCollaboratorSession(session);
  let hasLocalCollaboratorPortal = false;

  if (session.accessToken) {
    try {
      const response = await fetch(`${MAIN_SERVICE_URL}/collaborators/me`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: 'no-store',
      });

      if (response.ok) {
        const collaborator = await response.json();
        hasLocalCollaboratorPortal =
          Array.isArray(collaborator?.roles) && collaborator.roles.length > 0;
      }
    } catch {
      hasLocalCollaboratorPortal = false;
    }
  }

  return NextResponse.json({
    authenticated: true,
    hasAgentPortal,
    hasCollaboratorPortal: hasRealmCollaboratorPortal || hasLocalCollaboratorPortal,
    source: {
      realmCollaborator: hasRealmCollaboratorPortal,
      localCollaborator: hasLocalCollaboratorPortal,
    },
  });
}
