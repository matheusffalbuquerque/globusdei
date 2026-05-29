import type { ReactNode } from 'react';

import { CollaboratorPortalShell } from '../../components/portal/CollaboratorPortalShell';

/**
 * Collaborator route group layout applies the collaborator shell and local role gating.
 */
export default function CollaboratorLayout({ children }: { children: ReactNode }) {
  return <CollaboratorPortalShell>{children}</CollaboratorPortalShell>;
}
