'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  HandCoins,
  ArrowRightLeft,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Trash2,
  Plus,
  Filter,
  X,
  Loader2,
  Globe,
  ChevronsUpDown,
} from 'lucide-react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import { type AppSession } from '../../../lib/auth';
import { Badge, type BadgeProps } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Separator } from '../../../components/ui/separator';
import { cn } from '../../../lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type Dashboard = {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  recentEntries: FinancialEntry[];
  monthlyChart: { month: string; income: number; expense: number }[];
};

type FinancialEntry = {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'ADJUSTMENT' | 'TRANSFER';
  amount: number;
  description: string;
  occurredAt: string;
  targetName?: string;
  targetType?: string;
  targetId?: string;
  category?: { id: string; name: string };
  recordedBy?: { id: string; name: string };
};

type Investment = {
  id: string;
  amount: number;
  description?: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  createdAt: string;
  recordedBy?: { id: string; name: string };
};

type Allocation = {
  id: string;
  amount: number;
  description?: string;
  targetType: string;
  targetId?: string;
  targetName: string;
  createdAt: string;
  recordedBy?: { id: string; name: string };
};

type Category = { id: string; name: string; entryType: string; description?: string };
type AgentOption = { id: string; name: string; email: string };
type EmpreendimentoOption = { id: string; name: string };

type Tab = 'dashboard' | 'entries' | 'investments' | 'allocations' | 'categories' | 'statement';

// ─── Constants ───────────────────────────────────────────────────────────────

const ENTRY_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Entrada',
  EXPENSE: 'Saída',
  ADJUSTMENT: 'Ajuste',
  TRANSFER: 'Transferência',
};

const ENTRY_TYPE_BADGE: Record<string, BadgeProps['variant']> = {
  INCOME: 'success',
  EXPENSE: 'destructive',
  ADJUSTMENT: 'info',
  TRANSFER: 'warning',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  ORGANIZATION: 'Organização',
  AGENT: 'Agente',
  EMPREENDIMENTO: 'Empreendimento',
};

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Visão Geral', icon: Wallet },
  { id: 'entries', label: 'Lançamentos', icon: Receipt },
  { id: 'investments', label: 'Investimentos', icon: TrendingUp },
  { id: 'allocations', label: 'Repasses', icon: HandCoins },
  { id: 'categories', label: 'Categorias', icon: Tag },
  { id: 'statement', label: 'Extrato', icon: FileText },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function buildQuery(params: Record<string, string | undefined>) {
  const q = Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join('&');
  return q ? `?${q}` : '';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  positive,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  positive?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium uppercase tracking-wide">
            {label}
          </CardDescription>
          <div
            className={cn(
              'rounded-lg p-2',
              positive === true
                ? 'bg-emerald-50 text-emerald-600'
                : positive === false
                  ? 'bg-red-50 text-red-600'
                  : 'bg-primary/10 text-primary',
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'text-2xl font-bold tracking-tight',
            positive === true
              ? 'text-emerald-600'
              : positive === false
                ? 'text-red-600'
                : 'text-foreground',
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
      <Globe className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function EntryRow({
  entry,
  canManage,
  onEdit,
  onDelete,
}: {
  entry: FinancialEntry;
  canManage: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const isPositive = entry.type === 'INCOME' || entry.type === 'ADJUSTMENT';
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/60">
      <div className="flex min-w-0 items-start gap-3">
        <Badge variant={ENTRY_TYPE_BADGE[entry.type]} className="mt-0.5 shrink-0">
          {ENTRY_TYPE_LABELS[entry.type]}
        </Badge>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{entry.description}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {formatDate(entry.occurredAt)}
            {entry.category && ` · ${entry.category.name}`}
            {entry.targetName && ` · ${entry.targetName}`}
            {entry.recordedBy && ` · por ${entry.recordedBy.name}`}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            'text-sm font-bold',
            isPositive ? 'text-emerald-600' : 'text-red-600',
          )}
        >
          {isPositive ? '+' : '-'}
          {formatBRL(entry.amount)}
        </span>
        {canManage && (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-blue-600"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-red-600"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function TargetSelect({
  targetType,
  targetId,
  onTypeChange,
  onIdChange,
  allowedTypes,
  agents,
  empreendimentos,
}: {
  targetType: string;
  targetId: string;
  onTypeChange: (v: string) => void;
  onIdChange: (v: string) => void;
  allowedTypes: string[];
  agents: AgentOption[];
  empreendimentos: EmpreendimentoOption[];
}) {
  return (
    <div className="space-y-2">
      <Select
        value={targetType}
        onChange={(e) => {
          onTypeChange(e.target.value);
          onIdChange('');
        }}
      >
        {allowedTypes.includes('ORGANIZATION') && (
          <option value="ORGANIZATION">Globus Dei (Organização)</option>
        )}
        {allowedTypes.includes('AGENT') && <option value="AGENT">Agente</option>}
        {allowedTypes.includes('EMPREENDIMENTO') && (
          <option value="EMPREENDIMENTO">Empreendimento</option>
        )}
      </Select>
      {targetType === 'AGENT' && (
        <Select value={targetId} onChange={(e) => onIdChange(e.target.value)} required>
          <option value="">Selecione o agente…</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} — {a.email}
            </option>
          ))}
        </Select>
      )}
      {targetType === 'EMPREENDIMENTO' && (
        <Select value={targetId} onChange={(e) => onIdChange(e.target.value)} required>
          <option value="">Selecione o empreendimento…</option>
          {empreendimentos.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CollaboratorFinancePage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();
  const s = session as AppSession;

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [empreendimentos, setEmpreendimentos] = useState<EmpreendimentoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtros
  const [entryTypeFilter, setEntryTypeFilter] = useState('');
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');
  const [targetIdFilter, setTargetIdFilter] = useState('');

  // Edit modal
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);
  const [editForm, setEditForm] = useState({
    type: 'INCOME',
    amount: '',
    description: '',
    occurredAt: '',
    categoryId: '',
  });

  // Create forms
  const [entryForm, setEntryForm] = useState({
    type: 'INCOME',
    amount: '',
    description: '',
    categoryId: '',
    targetType: 'ORGANIZATION',
    targetId: '',
    occurredAt: '',
  });
  const [investmentForm, setInvestmentForm] = useState({
    amount: '',
    description: '',
    targetType: 'ORGANIZATION',
    targetId: '',
  });
  const [allocationForm, setAllocationForm] = useState({
    amount: '',
    description: '',
    targetType: 'AGENT',
    targetId: '',
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    entryType: 'EXPENSE',
  });

  // Statement
  const [statementTargetType, setStatementTargetType] = useState<'AGENT' | 'EMPREENDIMENTO'>('AGENT');
  const [statementTargetId, setStatementTargetId] = useState('');
  const [statementEntries, setStatementEntries] = useState<FinancialEntry[]>([]);
  const [statementInvestments, setStatementInvestments] = useState<Investment[]>([]);
  const [statementAllocations, setStatementAllocations] = useState<Allocation[]>([]);
  const [statementLoading, setStatementLoading] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    if (!s || !permissions.canViewFinance) return;
    setLoading(true);
    try {
      const [dash, ents, invs, allocs, cats, agts, emps] = await Promise.all([
        apiFetch('/finance/dashboard', { service: 'finance', session: s }),
        apiFetch(
          `/finance/entries${buildQuery({
            type: entryTypeFilter || undefined,
            from: fromFilter || undefined,
            to: toFilter || undefined,
            targetId: targetIdFilter || undefined,
          })}`,
          { service: 'finance', session: s },
        ),
        apiFetch(
          `/finance/investments${buildQuery({
            from: fromFilter || undefined,
            to: toFilter || undefined,
          })}`,
          { service: 'finance', session: s },
        ),
        apiFetch(
          `/finance/allocations${buildQuery({
            from: fromFilter || undefined,
            to: toFilter || undefined,
          })}`,
          { service: 'finance', session: s },
        ),
        apiFetch('/finance/categories', { service: 'finance', session: s }),
        apiFetch('/finance/targets/agents', { service: 'finance', session: s }),
        apiFetch('/finance/targets/empreendimentos', { service: 'finance', session: s }),
      ]);
      setDashboard(dash);
      setEntries(ents);
      setInvestments(invs);
      setAllocations(allocs);
      setCategories(cats);
      setAgents(agts);
      setEmpreendimentos(emps);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [s, permissions.canViewFinance, entryTypeFilter, fromFilter, toFilter, targetIdFilter]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const loadStatement = useCallback(async () => {
    if (!s || !statementTargetId) return;
    setStatementLoading(true);
    try {
      const [ents, invs, allocs] = await Promise.all([
        apiFetch(`/finance/entries${buildQuery({ targetId: statementTargetId })}`, {
          service: 'finance',
          session: s,
        }),
        apiFetch('/finance/investments', { service: 'finance', session: s }),
        apiFetch('/finance/allocations', { service: 'finance', session: s }),
      ]);
      setStatementEntries(ents);
      setStatementInvestments((invs as Investment[]).filter((i) => i.targetId === statementTargetId));
      setStatementAllocations(
        (allocs as Allocation[]).filter((a) => a.targetId === statementTargetId),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStatementLoading(false);
    }
  }, [s, statementTargetId]);

  useEffect(() => {
    if (activeTab === 'statement' && statementTargetId) void loadStatement();
  }, [activeTab, statementTargetId, loadStatement]);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  const submitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/finance/entries', {
        service: 'finance',
        session: s,
        method: 'POST',
        body: JSON.stringify({
          type: entryForm.type,
          amount: Number(entryForm.amount),
          description: entryForm.description,
          categoryId: entryForm.categoryId || undefined,
          targetType: entryForm.targetType || undefined,
          targetId: entryForm.targetId || undefined,
          occurredAt: entryForm.occurredAt || undefined,
        }),
      });
      setEntryForm({
        type: 'INCOME',
        amount: '',
        description: '',
        categoryId: '',
        targetType: 'ORGANIZATION',
        targetId: '',
        occurredAt: '',
      });
      showSuccess('Lançamento registrado!');
      await loadAll();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const openEditEntry = (entry: FinancialEntry) => {
    setEditingEntry(entry);
    setEditForm({
      type: entry.type,
      amount: String(entry.amount),
      description: entry.description,
      occurredAt: entry.occurredAt.slice(0, 10),
      categoryId: entry.category?.id ?? '',
    });
  };

  const submitEditEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    setSaving(true);
    try {
      await apiFetch(`/finance/entries/${editingEntry.id}`, {
        service: 'finance',
        session: s,
        method: 'PATCH',
        body: JSON.stringify({
          type: editForm.type,
          amount: Number(editForm.amount),
          description: editForm.description,
          occurredAt: editForm.occurredAt || undefined,
          categoryId: editForm.categoryId || null,
        }),
      });
      setEditingEntry(null);
      showSuccess('Lançamento atualizado!');
      await loadAll();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Excluir este lançamento permanentemente?')) return;
    try {
      await apiFetch(`/finance/entries/${id}`, {
        service: 'finance',
        session: s,
        method: 'DELETE',
      });
      showSuccess('Lançamento excluído.');
      await loadAll();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const submitInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/finance/investments', {
        service: 'finance',
        session: s,
        method: 'POST',
        body: JSON.stringify({
          amount: Number(investmentForm.amount),
          description: investmentForm.description || undefined,
          targetType: investmentForm.targetType,
          targetId: investmentForm.targetId || undefined,
        }),
      });
      setInvestmentForm({ amount: '', description: '', targetType: 'ORGANIZATION', targetId: '' });
      showSuccess('Investimento registrado!');
      await loadAll();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const submitAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/finance/allocations', {
        service: 'finance',
        session: s,
        method: 'POST',
        body: JSON.stringify({
          amount: Number(allocationForm.amount),
          description: allocationForm.description || undefined,
          targetType: allocationForm.targetType,
          targetId: allocationForm.targetId,
        }),
      });
      setAllocationForm({ amount: '', description: '', targetType: 'AGENT', targetId: '' });
      showSuccess('Repasse registrado!');
      await loadAll();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const submitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/finance/categories', {
        service: 'finance',
        session: s,
        method: 'POST',
        body: JSON.stringify(categoryForm),
      });
      setCategoryForm({ name: '', description: '', entryType: 'EXPENSE' });
      showSuccess('Categoria criada!');
      await loadAll();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return;
    try {
      await apiFetch(`/finance/categories/${id}`, {
        service: 'finance',
        session: s,
        method: 'DELETE',
      });
      showSuccess('Categoria excluída.');
      await loadAll();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const maxMonthly = dashboard?.monthlyChart
    ? Math.max(...dashboard.monthlyChart.flatMap((m) => [m.income, m.expense]), 1)
    : 1;

  const entryTotals = entries.reduce(
    (acc, e) => {
      if (e.type === 'INCOME' || e.type === 'ADJUSTMENT') acc.income += e.amount;
      else acc.expense += e.amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );

  const statementTotals = {
    invested: statementInvestments.reduce((a, i) => a + i.amount, 0),
    allocated: statementAllocations.reduce((a, al) => a + al.amount, 0),
    income: statementEntries
      .filter((e) => e.type === 'INCOME')
      .reduce((a, e) => a + e.amount, 0),
    expense: statementEntries
      .filter((e) => e.type === 'EXPENSE')
      .reduce((a, e) => a + e.amount, 0),
  };

  const hasFilters = entryTypeFilter || fromFilter || toFilter || targetIdFilter;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Gestão financeira
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
            Controle de Caixa
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lançamentos, investimentos, repasses e categorias da Globus Dei.
          </p>
        </div>
        <Badge
          variant={permissions.canManageFinance ? 'success' : 'secondary'}
          className="self-start gap-1.5"
        >
          {permissions.canManageFinance ? (
            <>
              <CheckCircle2 className="h-3 w-3" /> Gestor de recursos
            </>
          ) : (
            'Apenas visualização'
          )}
        </Badge>
      </div>

      {/* ── Feedback banners ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* ── Tab bar ── */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-1 min-w-fit items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════
          TAB: Visão Geral
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <KpiCard
                  label="Saldo atual"
                  value={formatBRL(dashboard?.balance ?? 0)}
                  icon={Wallet}
                  positive={(dashboard?.balance ?? 0) >= 0}
                />
                <KpiCard
                  label="Total entradas"
                  value={formatBRL(dashboard?.totalIncome ?? 0)}
                  icon={TrendingUp}
                  positive={true}
                />
                <KpiCard
                  label="Total saídas"
                  value={formatBRL(dashboard?.totalExpense ?? 0)}
                  icon={TrendingDown}
                  positive={false}
                />
              </div>

              {(dashboard?.monthlyChart?.length ?? 0) > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <ArrowRightLeft className="h-4 w-4 text-primary" />
                      Fluxo mensal — últimos 6 meses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex h-32 items-end gap-3">
                      {dashboard!.monthlyChart.map((m) => (
                        <div key={m.month} className="flex flex-1 items-end gap-1 h-full">
                          <div className="flex flex-col flex-1 items-center gap-1">
                            <span className="text-[9px] text-muted-foreground">
                              {formatBRL(m.income).replace('R$\u00a0', '')}
                            </span>
                            <div
                              className="w-full rounded-sm bg-emerald-400 transition-all duration-500"
                              style={{ height: `${Math.round((m.income / maxMonthly) * 100)}%` }}
                            />
                          </div>
                          <div className="flex flex-col flex-1 items-center gap-1">
                            <span className="text-[9px] text-muted-foreground">
                              {formatBRL(m.expense).replace('R$\u00a0', '')}
                            </span>
                            <div
                              className="w-full rounded-sm bg-red-400 transition-all duration-500"
                              style={{ height: `${Math.round((m.expense / maxMonthly) * 100)}%` }}
                            />
                            <span className="text-[9px] text-muted-foreground">
                              {m.month.slice(5)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-6 text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Entradas
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Saídas
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Receipt className="h-4 w-4 text-primary" />
                    Movimentos recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(dashboard?.recentEntries ?? []).length === 0 ? (
                    <EmptyState message="Nenhum movimento registrado ainda." />
                  ) : (
                    (dashboard?.recentEntries ?? []).map((entry) => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        canManage={false}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: Lançamentos
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'entries' && (
        <div className="space-y-5">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Filter className="h-4 w-4 text-primary" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  className="w-auto min-w-[140px]"
                  value={entryTypeFilter}
                  onChange={(e) => setEntryTypeFilter(e.target.value)}
                >
                  <option value="">Todos os tipos</option>
                  <option value="INCOME">Entrada</option>
                  <option value="EXPENSE">Saída</option>
                  <option value="ADJUSTMENT">Ajuste</option>
                  <option value="TRANSFER">Transferência</option>
                </Select>
                <Select
                  className="w-auto min-w-[180px]"
                  value={targetIdFilter}
                  onChange={(e) => setTargetIdFilter(e.target.value)}
                >
                  <option value="">Todos os destinatários</option>
                  <optgroup label="Agentes">
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Empreendimentos">
                    {empreendimentos.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </optgroup>
                </Select>
                <Input
                  type="date"
                  className="w-auto"
                  value={fromFilter}
                  onChange={(e) => setFromFilter(e.target.value)}
                />
                <Input
                  type="date"
                  className="w-auto"
                  value={toFilter}
                  onChange={(e) => setToFilter(e.target.value)}
                />
                {hasFilters && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-muted-foreground"
                    onClick={() => {
                      setEntryTypeFilter('');
                      setFromFilter('');
                      setToFilter('');
                      setTargetIdFilter('');
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                    Limpar
                  </Button>
                )}
              </div>

              {/* Period totals */}
              {entries.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg bg-muted/50 px-4 py-2.5 text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-emerald-600">
                      {formatBRL(entryTotals.income)}
                    </span>
                    <span className="text-muted-foreground">entradas</span>
                  </span>
                  <span className="text-border">|</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="font-bold text-red-600">
                      {formatBRL(entryTotals.expense)}
                    </span>
                    <span className="text-muted-foreground">saídas</span>
                  </span>
                  <span className="text-border">|</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'font-bold',
                        entryTotals.income - entryTotals.expense >= 0
                          ? 'text-foreground'
                          : 'text-red-600',
                      )}
                    >
                      {formatBRL(entryTotals.income - entryTotals.expense)}
                    </span>
                    <span className="text-muted-foreground">saldo no período</span>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
            {/* List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Receipt className="h-4 w-4 text-primary" />
                    Lançamentos
                  </CardTitle>
                  <Badge variant="secondary">{entries.length} registro(s)</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading ? (
                  <LoadingSkeleton />
                ) : entries.length === 0 ? (
                  <EmptyState message="Nenhum lançamento encontrado para os filtros aplicados." />
                ) : (
                  entries.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      canManage={permissions.canManageFinance}
                      onEdit={() => openEditEntry(entry)}
                      onDelete={() => void deleteEntry(entry.id)}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Create form */}
            {permissions.canManageFinance && (
              <Card className="self-start">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Plus className="h-4 w-4 text-primary" />
                    Novo lançamento
                  </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="pt-5">
                  <form onSubmit={submitEntry} className="space-y-3">
                    <Select
                      value={entryForm.type}
                      onChange={(e) => setEntryForm({ ...entryForm, type: e.target.value })}
                    >
                      <option value="INCOME">Entrada</option>
                      <option value="EXPENSE">Saída</option>
                      <option value="ADJUSTMENT">Ajuste</option>
                      <option value="TRANSFER">Transferência</option>
                    </Select>
                    <Input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Valor (R$)"
                      value={entryForm.amount}
                      onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
                    />
                    <Input
                      required
                      type="text"
                      placeholder="Descrição"
                      value={entryForm.description}
                      onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
                    />
                    <Input
                      type="date"
                      value={entryForm.occurredAt}
                      onChange={(e) => setEntryForm({ ...entryForm, occurredAt: e.target.value })}
                    />
                    <Select
                      value={entryForm.categoryId}
                      onChange={(e) => setEntryForm({ ...entryForm, categoryId: e.target.value })}
                    >
                      <option value="">Sem categoria</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    <TargetSelect
                      targetType={entryForm.targetType}
                      targetId={entryForm.targetId}
                      onTypeChange={(v) => setEntryForm({ ...entryForm, targetType: v, targetId: '' })}
                      onIdChange={(v) => setEntryForm({ ...entryForm, targetId: v })}
                      allowedTypes={['ORGANIZATION', 'AGENT', 'EMPREENDIMENTO']}
                      agents={agents}
                      empreendimentos={empreendimentos}
                    />
                    <Button type="submit" disabled={saving} className="w-full gap-2">
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {saving ? 'Salvando…' : 'Registrar lançamento'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: Investimentos
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'investments' && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Investimentos recebidos
                </CardTitle>
                <span className="text-sm font-bold text-emerald-600">
                  {formatBRL(investments.reduce((a, i) => a + i.amount, 0))}
                </span>
              </div>
              <CardDescription>{investments.length} registro(s)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <LoadingSkeleton />
              ) : investments.length === 0 ? (
                <EmptyState message="Nenhum investimento registrado." />
              ) : (
                investments.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {inv.targetName ?? 'Globus Dei'}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {TARGET_TYPE_LABELS[inv.targetType] ?? inv.targetType}
                        {inv.description && ` · ${inv.description}`}
                        {inv.recordedBy && ` · por ${inv.recordedBy.name}`}
                        {` · ${formatDate(inv.createdAt)}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-emerald-600">
                      {formatBRL(inv.amount)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {permissions.canManageFinance && (
            <Card className="self-start">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Plus className="h-4 w-4 text-primary" />
                  Registrar investimento
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5">
                <form onSubmit={submitInvestment} className="space-y-3">
                  <Input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Valor (R$)"
                    value={investmentForm.amount}
                    onChange={(e) =>
                      setInvestmentForm({ ...investmentForm, amount: e.target.value })
                    }
                  />
                  <Input
                    type="text"
                    placeholder="Descrição (opcional)"
                    value={investmentForm.description}
                    onChange={(e) =>
                      setInvestmentForm({ ...investmentForm, description: e.target.value })
                    }
                  />
                  <TargetSelect
                    targetType={investmentForm.targetType}
                    targetId={investmentForm.targetId}
                    onTypeChange={(v) =>
                      setInvestmentForm({ ...investmentForm, targetType: v, targetId: '' })
                    }
                    onIdChange={(v) => setInvestmentForm({ ...investmentForm, targetId: v })}
                    allowedTypes={['ORGANIZATION', 'AGENT', 'EMPREENDIMENTO']}
                    agents={agents}
                    empreendimentos={empreendimentos}
                  />
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                    {saving ? 'Salvando…' : 'Registrar investimento'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: Repasses
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'allocations' && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <HandCoins className="h-4 w-4 text-primary" />
                  Repasses realizados
                </CardTitle>
                <span className="text-sm font-bold text-red-600">
                  {formatBRL(allocations.reduce((a, al) => a + al.amount, 0))}
                </span>
              </div>
              <CardDescription>{allocations.length} registro(s)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <LoadingSkeleton />
              ) : allocations.length === 0 ? (
                <EmptyState message="Nenhum repasse registrado." />
              ) : (
                allocations.map((alloc) => (
                  <div
                    key={alloc.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{alloc.targetName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {TARGET_TYPE_LABELS[alloc.targetType] ?? alloc.targetType}
                        {alloc.description && ` · ${alloc.description}`}
                        {alloc.recordedBy && ` · por ${alloc.recordedBy.name}`}
                        {` · ${formatDate(alloc.createdAt)}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-red-600">
                      {formatBRL(alloc.amount)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {permissions.canManageFinance && (
            <Card className="self-start">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Plus className="h-4 w-4 text-primary" />
                  Registrar repasse
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5">
                <form onSubmit={submitAllocation} className="space-y-3">
                  <Input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Valor (R$)"
                    value={allocationForm.amount}
                    onChange={(e) =>
                      setAllocationForm({ ...allocationForm, amount: e.target.value })
                    }
                  />
                  <Input
                    type="text"
                    placeholder="Descrição (opcional)"
                    value={allocationForm.description}
                    onChange={(e) =>
                      setAllocationForm({ ...allocationForm, description: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Repasses são direcionados a agentes ou empreendimentos.
                  </p>
                  <TargetSelect
                    targetType={allocationForm.targetType}
                    targetId={allocationForm.targetId}
                    onTypeChange={(v) =>
                      setAllocationForm({ ...allocationForm, targetType: v, targetId: '' })
                    }
                    onIdChange={(v) => setAllocationForm({ ...allocationForm, targetId: v })}
                    allowedTypes={['AGENT', 'EMPREENDIMENTO']}
                    agents={agents}
                    empreendimentos={empreendimentos}
                  />
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <HandCoins className="h-4 w-4" />
                    )}
                    {saving ? 'Salvando…' : 'Registrar repasse'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: Categorias
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-primary" />
                  Categorias de lançamentos
                </CardTitle>
                <Badge variant="secondary">{categories.length} categoria(s)</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <LoadingSkeleton />
              ) : categories.length === 0 ? (
                <EmptyState message="Nenhuma categoria cadastrada." />
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{cat.name}</span>
                        <Badge variant={ENTRY_TYPE_BADGE[cat.entryType] ?? 'secondary'}>
                          {ENTRY_TYPE_LABELS[cat.entryType] ?? cat.entryType}
                        </Badge>
                      </div>
                      {cat.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{cat.description}</p>
                      )}
                    </div>
                    {permissions.canManageFinance && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-600"
                        onClick={() => void deleteCategory(cat.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {permissions.canManageFinance && (
            <Card className="self-start">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Plus className="h-4 w-4 text-primary" />
                  Nova categoria
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5">
                <form onSubmit={submitCategory} className="space-y-3">
                  <Input
                    required
                    type="text"
                    placeholder="Nome da categoria"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  />
                  <Input
                    type="text"
                    placeholder="Descrição (opcional)"
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, description: e.target.value })
                    }
                  />
                  <Select
                    value={categoryForm.entryType}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, entryType: e.target.value })
                    }
                  >
                    <option value="EXPENSE">Saída</option>
                    <option value="INCOME">Entrada</option>
                    <option value="ADJUSTMENT">Ajuste</option>
                    <option value="TRANSFER">Transferência</option>
                  </Select>
                  <Button type="submit" disabled={saving} className="w-full gap-2">
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {saving ? 'Salvando…' : 'Criar categoria'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: Extrato
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'statement' && (
        <div className="space-y-5">
          {/* Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ChevronsUpDown className="h-4 w-4 text-primary" />
                Selecionar destinatário
              </CardTitle>
              <CardDescription>
                Escolha um agente ou empreendimento para ver o extrato consolidado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Select
                  className="w-auto"
                  value={statementTargetType}
                  onChange={(e) => {
                    setStatementTargetType(e.target.value as 'AGENT' | 'EMPREENDIMENTO');
                    setStatementTargetId('');
                    setStatementEntries([]);
                    setStatementInvestments([]);
                    setStatementAllocations([]);
                  }}
                >
                  <option value="AGENT">Agente</option>
                  <option value="EMPREENDIMENTO">Empreendimento</option>
                </Select>
                <Select
                  className="min-w-[240px]"
                  value={statementTargetId}
                  onChange={(e) => setStatementTargetId(e.target.value)}
                >
                  <option value="">
                    {statementTargetType === 'AGENT'
                      ? 'Selecione o agente…'
                      : 'Selecione o empreendimento…'}
                  </option>
                  {statementTargetType === 'AGENT'
                    ? agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))
                    : empreendimentos.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          {!statementTargetId && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Selecione um destinatário para ver o extrato completo.
                </p>
              </CardContent>
            </Card>
          )}

          {statementTargetId && (
            statementLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <KpiCard
                    label="Investido"
                    value={formatBRL(statementTotals.invested)}
                    icon={TrendingUp}
                    positive={true}
                  />
                  <KpiCard
                    label="Repassado"
                    value={formatBRL(statementTotals.allocated)}
                    icon={HandCoins}
                    positive={false}
                  />
                  <KpiCard
                    label="Entradas avulsas"
                    value={formatBRL(statementTotals.income)}
                    icon={TrendingUp}
                    positive={true}
                  />
                  <KpiCard
                    label="Saídas avulsas"
                    value={formatBRL(statementTotals.expense)}
                    icon={TrendingDown}
                    positive={false}
                  />
                </div>

                {/* Entries */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Receipt className="h-4 w-4 text-primary" />
                      Lançamentos
                    </CardTitle>
                    <CardDescription>{statementEntries.length} registro(s)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {statementEntries.length === 0 ? (
                      <EmptyState message="Nenhum lançamento para este destinatário." />
                    ) : (
                      statementEntries.map((entry) => (
                        <EntryRow key={entry.id} entry={entry} canManage={false} />
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Investments */}
                {statementInvestments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Investimentos
                      </CardTitle>
                      <CardDescription>{statementInvestments.length} registro(s)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {statementInvestments.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {inv.description ?? 'Investimento'}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatDate(inv.createdAt)}
                              {inv.recordedBy && ` · por ${inv.recordedBy.name}`}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-emerald-600">
                            {formatBRL(inv.amount)}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Allocations */}
                {statementAllocations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <HandCoins className="h-4 w-4 text-primary" />
                        Repasses
                      </CardTitle>
                      <CardDescription>{statementAllocations.length} registro(s)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {statementAllocations.map((alloc) => (
                        <div
                          key={alloc.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {alloc.description ?? 'Repasse'}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatDate(alloc.createdAt)}
                              {alloc.recordedBy && ` · por ${alloc.recordedBy.name}`}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-red-600">
                            {formatBRL(alloc.amount)}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          DIALOG: Editar lançamento
      ════════════════════════════════════════════════════════ */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar lançamento</DialogTitle>
            <DialogDescription>
              Atualize os dados do lançamento selecionado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitEditEntry} className="space-y-3">
            <Select
              value={editForm.type}
              onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
            >
              <option value="INCOME">Entrada</option>
              <option value="EXPENSE">Saída</option>
              <option value="ADJUSTMENT">Ajuste</option>
              <option value="TRANSFER">Transferência</option>
            </Select>
            <Input
              required
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Valor (R$)"
              value={editForm.amount}
              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
            />
            <Input
              required
              type="text"
              placeholder="Descrição"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
            <Input
              type="date"
              value={editForm.occurredAt}
              onChange={(e) => setEditForm({ ...editForm, occurredAt: e.target.value })}
            />
            <Select
              value={editForm.categoryId}
              onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingEntry(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
