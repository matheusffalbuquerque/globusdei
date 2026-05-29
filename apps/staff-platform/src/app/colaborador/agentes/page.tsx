'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Loader2,
  Search,
  ShieldCheck,
  UserCog,
  UserRoundPlus,
  Users,
} from 'lucide-react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { apiFetch } from '../../../lib/api';
import {
  formatAgentStatus,
  formatCollaboratorRole,
  type AppSession,
} from '../../../lib/auth';

type CollaboratorRole =
  | 'ADMIN'
  | 'PEOPLE_MANAGER'
  | 'PROJECT_MANAGER'
  | 'RESOURCE_MANAGER';

type AgentDirectoryItem = {
  id: string;
  authSubject: string | null;
  name: string;
  email: string;
  city: string | null;
  country: string | null;
  status: string;
  isActive: boolean;
  collaborator: {
    id: string;
    authSubject: string;
    roles: CollaboratorRole[];
    isActive: boolean;
    updatedAt: string;
  } | null;
};

type DirectoryResponse = {
  data: AgentDirectoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const COLLABORATOR_ROLE_OPTIONS: CollaboratorRole[] = [
  'ADMIN',
  'PEOPLE_MANAGER',
  'PROJECT_MANAGER',
  'RESOURCE_MANAGER',
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'ENTERED', label: 'Cadastro iniciado' },
  { value: 'SUBMITTED', label: 'Questionário enviado' },
  { value: 'QUALIFIED', label: 'Qualificado' },
  { value: 'SCHEDULED', label: 'Entrevista agendada' },
  { value: 'APPROVED', label: 'Aprovado' },
  { value: 'REJECTED', label: 'Necessita ajustes' },
] as const;

/**
 * Agent directory page allows collaborators to inspect platform agents and
 * enables admins to assign or remove local collaborator roles.
 */
export default function CollaboratorAgentsPage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();
  const typedSession = session as AppSession | null;

  const [items, setItems] = useState<AgentDirectoryItem[]>([]);
  const [meta, setMeta] = useState<DirectoryResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [draftRoles, setDraftRoles] = useState<Record<string, CollaboratorRole[]>>({});

  const loadAgents = async (currentPage = 1) => {
    if (!typedSession) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', '12');
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (roleFilter) params.set('role', roleFilter);

      const response: DirectoryResponse = await apiFetch(
        `/collaborators/agents?${params.toString()}`,
        { session: typedSession },
      );

      setItems(response.data);
      setMeta(response.meta);
      setDraftRoles((current) => {
        const next = { ...current };
        for (const item of response.data) {
          next[item.id] = current[item.id] ?? item.collaborator?.roles ?? [];
        }
        return next;
      });
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typedSession) {
      void loadAgents(page);
    }
  }, [typedSession, page, search, status, roleFilter]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput('');
    setSearch('');
    setStatus('');
    setRoleFilter('');
    setPage(1);
  };

  const toggleRole = (agentId: string, role: CollaboratorRole) => {
    setDraftRoles((current) => {
      const activeRoles = current[agentId] ?? [];
      const nextRoles = activeRoles.includes(role)
        ? activeRoles.filter((item) => item !== role)
        : [...activeRoles, role];

      return {
        ...current,
        [agentId]: nextRoles,
      };
    });
  };

  const persistRoles = async (agent: AgentDirectoryItem) => {
    if (!typedSession) return;

    const nextRoles = draftRoles[agent.id] ?? [];
    setSavingId(agent.id);
    setError(null);

    try {
      await apiFetch(`/collaborators/agents/${agent.id}/roles`, {
        method: 'PATCH',
        session: typedSession,
        body: { roles: nextRoles },
      });

      await loadAgents(page);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const appliedFilters = useMemo(() => {
    return [search || null, status || null, roleFilter || null].filter(Boolean).length;
  }, [roleFilter, search, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Equipe e governança
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Agentes da plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Pesquise agentes cadastrados na plataforma e, quando necessário, promova-os para atuação como colaboradores da equipe Globus Dei.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_220px_220px_160px]">
            <form onSubmit={handleSearch} className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar por nome, e-mail, cidade, país ou vocação…"
                className="pl-9"
              />
            </form>

            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
              }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={roleFilter}
              onChange={(event) => {
                setPage(1);
                setRoleFilter(event.target.value);
              }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Todos os papéis</option>
              {COLLABORATOR_ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {formatCollaboratorRole(role)}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex-1">
                Buscar
              </Button>
              <Button type="button" variant="outline" onClick={handleClear}>
                Limpar
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{meta?.total ?? 0}</span> agente(s)
            </span>
            {appliedFilters > 0 && (
              <Badge variant="secondary">{appliedFilters} filtro(s) ativo(s)</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Diretório da plataforma</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando agentes…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm">Nenhum agente encontrado com os filtros atuais.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atuação</TableHead>
                  <TableHead>Colaboração atual</TableHead>
                  {permissions.isAdmin && <TableHead className="w-[360px]">Gestão administrativa</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((agent) => {
                  const activeRoles = draftRoles[agent.id] ?? [];
                  const isSaving = savingId === agent.id;

                  return (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">{agent.email}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[agent.city, agent.country].filter(Boolean).join(', ') || 'Origem não informada'}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={agent.status === 'APPROVED' ? 'success' : 'secondary'}>
                          {formatAgentStatus(agent.status)}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <p className="text-sm font-medium text-foreground">
                            {[agent.city, agent.country].filter(Boolean).join(', ') || 'Origem não informada'}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        {agent.collaborator?.roles?.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {agent.collaborator.roles.map((role) => (
                              <Badge key={role} variant="secondary" className="text-[10px] uppercase">
                                {formatCollaboratorRole(role)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <UserRoundPlus className="h-4 w-4" />
                            Ainda não integra a equipe
                          </div>
                        )}
                      </TableCell>

                      {permissions.isAdmin && (
                        <TableCell>
                          {!agent.authSubject ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                              Este agente ainda não possui vínculo de autenticação e não pode receber acesso de colaborador.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                {COLLABORATOR_ROLE_OPTIONS.map((role) => {
                                  const checked = activeRoles.includes(role);
                                  return (
                                    <label
                                      key={role}
                                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-foreground"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleRole(agent.id, role)}
                                        className="h-4 w-4 accent-primary"
                                      />
                                      <span>{formatCollaboratorRole(role)}</span>
                                    </label>
                                  );
                                })}
                              </div>

                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <ShieldCheck className="h-4 w-4" />
                                  {activeRoles.length > 0
                                    ? 'Ao salvar, o usuário poderá entrar no portal do colaborador.'
                                    : 'Sem papéis selecionados, o acesso de colaborador será removido.'}
                                </div>

                                <Button
                                  size="sm"
                                  onClick={() => void persistRoles(agent)}
                                  disabled={isSaving}
                                >
                                  {isSaving ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Salvando…
                                    </>
                                  ) : (
                                    <>
                                      <UserCog className="h-4 w-4" />
                                      Salvar roles
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página <span className="font-semibold text-foreground">{meta.page}</span> de{' '}
            <span className="font-semibold text-foreground">{meta.totalPages}</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
