import type { ReactNode } from 'react';

import { AgentPortalShell } from '../../components/portal/AgentPortalShell';

/**
 * Agent route group layout applies the authenticated shell and navigation for agent pages.
 */
export default function AgentLayout({ children }: { children: ReactNode }) {
  return <AgentPortalShell>{children}</AgentPortalShell>;
}
