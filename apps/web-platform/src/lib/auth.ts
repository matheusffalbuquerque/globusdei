import type { Session } from 'next-auth';

/**
 * Shared auth and permission helpers for the web platform dashboards.
 */
export type AppSession = Session & {
  accessToken?: string;
  error?: 'RefreshAccessTokenError';
  user?: Session['user'] & {
    id?: string;
    realmRoles?: string[];
  };
};

/**
 * Local collaborator roles managed by the operational backend.
 */
export type CollaboratorProfile = {
  id: string;
  name: string;
  email: string;
  roles: Array<'ADMIN' | 'PEOPLE_MANAGER' | 'PROJECT_MANAGER' | 'RESOURCE_MANAGER'>;
  expertiseAreas?: string[];
};

export type CollaboratorPermissions = {
  canManageOnboarding: boolean;
  canManageProjects: boolean;
  canManageRequests: boolean;
  canManageContent: boolean;
  canManageFinance: boolean;
  canViewFinance: boolean;
};

export function getRealmRoles(session?: AppSession | null): string[] {
  return session?.user?.realmRoles ?? [];
}

export function hasRealmRole(session: AppSession | null | undefined, role: string): boolean {
  return getRealmRoles(session).includes(role);
}

export function isAgentSession(session?: AppSession | null): boolean {
  return hasRealmRole(session, 'agente');
}

export function isCollaboratorSession(session?: AppSession | null): boolean {
  return hasRealmRole(session, 'colaborador') || hasRealmRole(session, 'administrador');
}

export function getDashboardHome(session?: AppSession | null): string {
  if (isCollaboratorSession(session)) {
    return '/colaborador/dashboard';
  }

  if (isAgentSession(session)) {
    return '/agent/dashboard';
  }

  return '/login';
}

export function getCollaboratorPermissions(
  collaborator?: CollaboratorProfile | null,
): CollaboratorPermissions {
  const roles = collaborator?.roles ?? [];

  return {
    canManageOnboarding: roles.includes('ADMIN') || roles.includes('PEOPLE_MANAGER'),
    canManageProjects: roles.includes('ADMIN') || roles.includes('PROJECT_MANAGER'),
    canManageRequests:
      roles.includes('ADMIN') ||
      roles.includes('PEOPLE_MANAGER') ||
      roles.includes('PROJECT_MANAGER'),
    canManageContent: roles.includes('ADMIN') || roles.includes('PROJECT_MANAGER'),
    canManageFinance: roles.includes('ADMIN') || roles.includes('RESOURCE_MANAGER'),
    canViewFinance: true,
  };
}

/**
 * Human-readable labels keep dashboards readable without leaking enum names into the UI.
 */
export function formatCollaboratorRole(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    PEOPLE_MANAGER: 'Gestor de Pessoas',
    PROJECT_MANAGER: 'Gestor de Projetos',
    RESOURCE_MANAGER: 'Gestor de Recursos',
  };

  return labels[role] ?? role;
}

export function formatAgentStatus(status?: string | null): string {
  const labels: Record<string, string> = {
    ENTERED: 'Cadastro iniciado',
    SUBMITTED: 'Questionário enviado',
    QUALIFIED: 'Qualificado para entrevista',
    SCHEDULED: 'Entrevista agendada',
    APPROVED: 'Aprovado',
    REJECTED: 'Necessita ajustes',
  };

  return labels[status ?? ''] ?? (status || 'Sem status');
}

export function formatServiceRequestCategory(category?: string | null): string {
  const labels: Record<string, string> = {
    TECHNICAL: 'Técnico',
    PSYCHOLOGICAL: 'Psicológico',
    MEDICAL: 'Médico',
    SPIRITUAL: 'Espiritual',
    MENTORSHIP: 'Mentoria',
    LEGAL: 'Jurídico',
  };

  return labels[category ?? ''] ?? (category || 'Categoria');
}

export function formatServiceRequestStatus(status?: string | null): string {
  const labels: Record<string, string> = {
    OPEN: 'Aberta',
    IN_PROGRESS: 'Em andamento',
    RESOLVED: 'Resolvida',
    CLOSED: 'Encerrada',
  };

  return labels[status ?? ''] ?? (status || 'Status');
}

export function formatFollowUpStatus(status?: string | null): string {
  const labels: Record<string, string> = {
    OPEN: 'Triagem',
    MONITORING: 'Em acompanhamento',
    ON_HOLD: 'Em pausa',
    CLOSED: 'Finalizado',
  };

  return labels[status ?? ''] ?? (status || 'Sem status');
}
