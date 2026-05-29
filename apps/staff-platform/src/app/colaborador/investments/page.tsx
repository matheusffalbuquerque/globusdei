'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  TrendingUp,
  Search,
  Filter,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Users,
  Building2,
  RefreshCw,
  Banknote,
} from 'lucide-react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import { type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Separator } from '../../../components/ui/separator';

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentSnippet = { id: string; name: string; email: string };
type EmpreendimentoSnippet = { id: string; name: string; type: string; category: string };

type Investment = {
  id: string;
  investorId: string;
  targetType: 'AGENT' | 'EMPREENDIMENTO';
  targetAgentId: string | null;
  targetEmpreendimentoId: string | null;
  amount: number;
  type: 'ONE_TIME' | 'RECURRING';
  notes: string | null;
  investedAt: string;
  investor: AgentSnippet;
  targetAgent: AgentSnippet | null;
  targetEmpreendimento: EmpreendimentoSnippet | null;
};

type ListResponse = { total: number; items: Investment[] };

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  ONE_TIME: 'Único',
  RECURRING: 'Recorrente',
};

const TARGET_TYPE_LABEL: Record<string, string> = {
  AGENT: 'Agente',
  EMPREENDIMENTO: 'Empreendimento',
};

const TYPE_BADGE: Record<string, 'default' | 'info' | 'success' | 'warning' | 'secondary'> = {
  ONE_TIME: 'secondary',
  RECURRING: 'success',
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// ─── Component ────────────────────────────────────────────────────────────────

export default function InvestmentsManagementPage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();
  const typedSession = session as AppSession | null;

  const [data, setData] = useState<ListResponse>({ total: 0, items: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterTargetType, setFilterTargetType] = useState('');
  const [filterType, setFilterType] = useState('');

  // Summary metrics
  const total = data.items.reduce((s, i) => s + i.amount, 0);
  const recurring = data.items.filter((i) => i.type === 'RECURRING');
  const monthlyRecurring = recurring.reduce((s, i) => s + i.amount, 0);
  const uniqueInvestors = new Set(data.items.map((i) => i.investorId)).size;

  const load = async () => {
    if (!typedSession) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterTargetType) params.set('targetType', filterTargetType);
      if (filterType) params.set('type', filterType);
      params.set('take', '200');
      const res = await apiFetch(`/investments?${params.toString()}`, { session: typedSession });
      setData(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, [filterTargetType, filterType, typedSession?.accessToken]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este investimento? Esta ação não pode ser desfeita.')) return;
    try {
      await apiFetch(`/investments/${id}`, { method: 'DELETE', session: typedSession! });
      setData((prev) => ({ total: prev.total - 1, items: prev.items.filter((i) => i.id !== id) }));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const filtered = data.items.filter((inv) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      inv.investor.name.toLowerCase().includes(s) ||
      inv.targetAgent?.name.toLowerCase().includes(s) ||
      inv.targetEmpreendimento?.name.toLowerCase().includes(s) ||
      inv.notes?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Gestão financeira
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Investimentos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualize e gerencie todos os investimentos registrados na plataforma.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 self-start gap-1.5 px-3 py-1.5 text-sm font-medium">
          <TrendingUp className="h-3.5 w-3.5" />
          {data.total} registros
        </Badge>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-muted-foreground">Total investido</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{fmt(total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-muted-foreground">Recorrente/mês</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600">{fmt(monthlyRecurring)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-muted-foreground">Investidores únicos</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{uniqueInvestors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-muted-foreground">Transações</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{data.total}</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ── Filtros ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Filtros</CardTitle>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar investidor ou alvo…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterTargetType} onChange={(e) => setFilterTargetType(e.target.value)}>
              <option value="">Todos os alvos</option>
              <option value="AGENT">Agente</option>
              <option value="EMPREENDIMENTO">Empreendimento</option>
            </Select>
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">Todos os tipos</option>
              <option value="ONE_TIME">Único</option>
              <option value="RECURRING">Recorrente</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabela ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {filtered.length} {filtered.length === 1 ? 'investimento' : 'investimentos'} encontrados
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <TrendingUp className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum investimento encontrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {inv.investor.name}
                      </span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-sm text-foreground">
                        {inv.targetAgent?.name ?? inv.targetEmpreendimento?.name ?? '—'}
                      </span>
                      <Badge variant={inv.targetType === 'AGENT' ? 'secondary' : 'info'} className="text-xs">
                        {inv.targetType === 'AGENT' ? (
                          <><Users className="mr-1 h-3 w-3" />{TARGET_TYPE_LABEL[inv.targetType]}</>
                        ) : (
                          <><Building2 className="mr-1 h-3 w-3" />{TARGET_TYPE_LABEL[inv.targetType]}</>
                        )}
                      </Badge>
                      <Badge variant={TYPE_BADGE[inv.type]} className="text-xs">
                        {inv.type === 'RECURRING' && <RefreshCw className="mr-1 h-3 w-3" />}
                        {TYPE_LABEL[inv.type]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(inv.investedAt).toLocaleDateString('pt-BR')}
                      {inv.notes && <> · {inv.notes}</>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-base font-bold text-foreground">{fmt(inv.amount)}</span>
                    {permissions.canManageFinance && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDelete(inv.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
