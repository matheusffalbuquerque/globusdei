'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Search, Users } from 'lucide-react';

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

type TeamCollaboratorItem = {
  id: string;
  authSubject: string;
  name: string;
  email: string;
  roles: CollaboratorRole[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  agent: {
    id: string;
    status: string;
    city: string | null;
    country: string | null;
    vocationType: string;
    isActive: boolean;
  } | null;
};

type DirectoryResponse = {
  data: TeamCollaboratorItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'ENTERED', label: 'Cadastro iniciado' },
  { value: 'SUBMITTED', label: 'Questionário enviado' },
  { value: 'QUALIFIED', label: 'Qualificado' },
  { value: 'SCHEDULED', label: 'Entrevista agendada' },
  { value: 'APPROVED', label: 'Aprovado' },
  { value: 'REJECTED', label: 'Necessita ajustes' },
] as const;

const ROLE_OPTIONS: CollaboratorRole[] = [
  'ADMIN',
  'PEOPLE_MANAGER',
  'PROJECT_MANAGER',
  'RESOURCE_MANAGER',
];

/**
 * Team directory page shows only users that currently belong to the
 * internal Globus Dei collaborator team.
 */
export default function CollaboratorsDirectoryPage() {
  const { data: session } = useSession();
  const typedSession = session as AppSession | null;

  const [items, setItems] = useState<TeamCollaboratorItem[]>([]);
  const [meta, setMeta] = useState<DirectoryResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const loadTeam = async (currentPage = 1) => {
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
        `/collaborators/team?${params.toString()}`,
        { session: typedSession },
      );

      setItems(response.data);
      setMeta(response.meta);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typedSession) {
      void loadTeam(page);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Equipe Globus Dei
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Colaboradores</h1>
        <p className="text-sm text-muted-foreground">
          Visualize apenas os usuários que já integram a equipe interna, com filtros por papel local e estágio da jornada como agente.
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
                placeholder="Buscar por nome ou e-mail…"
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
              {ROLE_OPTIONS.map((role) => (
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

          <div className="mt-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta?.total ?? 0}</span> colaborador(es) encontrados
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Equipe interna</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando colaboradores…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm">Nenhum colaborador encontrado com os filtros atuais.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Papéis locais</TableHead>
                  <TableHead>Contexto do agente</TableHead>
                  <TableHead className="w-[180px]">Última atualização</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((collaborator) => (
                  <TableRow key={collaborator.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{collaborator.name}</p>
                        <p className="text-xs text-muted-foreground">{collaborator.email}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {collaborator.isActive ? 'Perfil local ativo' : 'Perfil local inativo'}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {collaborator.roles.map((role) => (
                          <Badge key={role} variant="secondary" className="text-[10px] uppercase">
                            {formatCollaboratorRole(role)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell>
                      {collaborator.agent ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {collaborator.agent.vocationType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[collaborator.agent.city, collaborator.agent.country].filter(Boolean).join(', ') || 'Origem não informada'}
                          </p>
                          <Badge variant={collaborator.agent.status === 'APPROVED' ? 'success' : 'secondary'}>
                            {formatAgentStatus(collaborator.agent.status)}
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Sem vínculo com cadastro de agente.
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(collaborator.updatedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
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
