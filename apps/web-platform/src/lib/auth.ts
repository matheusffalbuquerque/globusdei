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

export function getRealmRoles(session?: AppSession | null): string[] {
  return session?.user?.realmRoles ?? [];
}

export function hasRealmRole(session: AppSession | null | undefined, role: string): boolean {
  return getRealmRoles(session).includes(role);
}

export function isAgentSession(session?: AppSession | null): boolean {
  return !!session;
}

export function getDashboardHome(session?: AppSession | null): string {
  if (isAgentSession(session)) {
    return '/agent/dashboard';
  }

  return '/login';
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
