'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Filter, RefreshCw, ScrollText, Lock, ChevronLeft, ChevronRight } from 'lucide-react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import type { AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';

// ─── Types ────────────────────────────────────────────────────────────────────

type AuditLog = {
  id: string;
  actorId: string;
  actorName: string | null;
  actorEmail: string | null;
  entity: string | null;
  actionType: 'SECURITY' | 'TECHNICAL' | 'AUDIT';
  actionDetail: string;
  ipAddress: string | null;
  createdAt: string;
};

type LogsMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type LogsResponse = {
  data: AuditLog[];
  meta: LogsMeta;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function actionTypeBadge(type: string) {
  if (type === 'SECURITY') return 'destructive' as const;
  if (type === 'TECHNICAL') return 'warning' as const;
  return 'secondary' as const;
}

function actionTypeLabel(type: string) {
  if (type === 'SECURITY') return 'Segurança';
  if (type === 'TECHNICAL') return 'Técnico';
  return 'Auditoria';
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(iso));
}

const PAGE_SIZE = 50;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CollaboratorLogsPage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();
  const typedSession = session as AppSession | null;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<LogsMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // ── Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionType, setActionType] = useState('');
  const [entity, setEntity] = useState('');

  const loadLogs = useCallback(async (currentPage = 1) => {
    if (!typedSession) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', String(PAGE_SIZE));
      if (search) params.set('search', search);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (actionType) params.set('actionType', actionType);
      if (entity) params.set('entity', entity);

      const result: LogsResponse = await apiFetch(`/audit/logs?${params.toString()}`, {
        session: typedSession,
      });
      setLogs(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [typedSession, search, startDate, endDate, actionType, entity]);

  useEffect(() => {
    if (permissions.isAdmin) {
      void loadLogs(page);
    }
  }, [page, permissions.isAdmin]);

  const handleSearch = () => {
    setPage(1);
    void loadLogs(1);
  };

  const handleClear = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setActionType('');
    setEntity('');
    setPage(1);
    setTimeout(() => void loadLogs(1), 0);
  };

  if (!permissions.isAdmin) {
    return (
      <div className="flex flex-col gap-2 py-16 items-center text-muted-foreground">
        <Lock className="h-8 w-8" />
        <p className="text-sm font-medium">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Administração
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          Logs da Plataforma
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registro de todas as ações realizadas na plataforma.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ação, usuário, e-mail ou entidade…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>

            <Input
              type="date"
              title="Data inicial"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              type="date"
              title="Data final"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Todos os tipos</option>
                <option value="AUDIT">Auditoria</option>
                <option value="TECHNICAL">Técnico</option>
                <option value="SECURITY">Segurança</option>
              </select>
            </div>

            <Input
              placeholder="Filtrar por entidade (ex: Agent)"
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />

            <div className="flex gap-2 sm:col-span-2 xl:col-span-1">
              <Button onClick={handleSearch} className="flex-1 gap-2">
                <Search className="h-4 w-4" />
                Buscar
              </Button>
              <Button variant="outline" onClick={handleClear} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      {meta && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total.toLocaleString('pt-BR')}</span> registros encontrados
          </p>
          <p className="text-sm text-muted-foreground">
            Página <span className="font-semibold text-foreground">{meta.page}</span> de{' '}
            <span className="font-semibold text-foreground">{meta.totalPages}</span>
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="w-[110px]">Tipo</TableHead>
                  <TableHead className="w-[130px]">Entidade</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead className="w-[140px]">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      Carregando logs…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ScrollText className="h-8 w-8" />
                        <p className="text-sm">Nenhum log encontrado para os filtros aplicados.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  logs.map((log) => (
                    <TableRow key={log.id} className="text-sm">
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {log.actorName ?? '—'}
                          </span>
                          {log.actorEmail && (
                            <span className="text-xs text-muted-foreground">{log.actorEmail}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionTypeBadge(log.actionType)} className="text-[11px]">
                          {actionTypeLabel(log.actionType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.entity ? (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                            {log.entity}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{log.actionDetail}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.ipAddress ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="gap-1"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
