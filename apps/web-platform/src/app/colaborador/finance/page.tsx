'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import { type AppSession } from '../../../lib/auth';

// ─── Tipos ───────────────────────────────────────────────────────────────────

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
type AgentOption = { id: string; name: string; email: string; vocationType?: string };
type EmpreendimentoOption = { id: string; name: string; type?: string };

type Tab = 'dashboard' | 'entries' | 'investments' | 'allocations' | 'categories' | 'statement';

// ─── Constantes ───────────────────────────────────────────────────────────────

const ENTRY_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Entrada',
  EXPENSE: 'Saída',
  ADJUSTMENT: 'Ajuste',
  TRANSFER: 'Transferência',
};

const ENTRY_TYPE_COLORS: Record<string, string> = {
  INCOME: 'bg-emerald-100 text-emerald-700',
  EXPENSE: 'bg-red-100 text-red-700',
  ADJUSTMENT: 'bg-blue-100 text-blue-700',
  TRANSFER: 'bg-amber-100 text-amber-700',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  ORGANIZATION: 'Organização',
  AGENT: 'Agente',
  EMPREENDIMENTO: 'Empreendimento',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function buildQuery(params: Record<string, string | undefined>) {
  const q = Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join('&');
  return q ? `?${q}` : '';
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function MonthlyBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <span className="text-[10px] font-bold text-slate-400 truncate w-full text-center">{formatBRL(value)}</span>
      <div className="w-full rounded-full bg-slate-100 relative" style={{ height: 80 }}>
        <div
          className={`absolute bottom-0 left-0 right-0 w-full rounded-full ${color} transition-all duration-500`}
          style={{ height: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-slate-500">{label.slice(5)}</span>
    </div>
  );
}

function KpiCard({ label, value, color = 'text-slate-900' }: { label: string; value: string; color?: string }) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">{label}</div>
      <div className={`mt-3 text-3xl font-black tracking-tight ${color}`}>{value}</div>
    </article>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />)}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

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

  // Edição inline
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);
  const [editForm, setEditForm] = useState({ type: 'INCOME', amount: '', description: '', occurredAt: '', categoryId: '' });

  // Formulários de criação
  const [entryForm, setEntryForm] = useState({ type: 'INCOME', amount: '', description: '', categoryId: '', targetType: 'ORGANIZATION', targetId: '', occurredAt: '' });
  const [investmentForm, setInvestmentForm] = useState({ amount: '', description: '', targetType: 'ORGANIZATION', targetId: '' });
  const [allocationForm, setAllocationForm] = useState({ amount: '', description: '', targetType: 'AGENT', targetId: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', entryType: 'EXPENSE' });

  // Extrato por destinatário
  const [statementTargetType, setStatementTargetType] = useState<'AGENT' | 'EMPREENDIMENTO'>('AGENT');
  const [statementTargetId, setStatementTargetId] = useState('');
  const [statementEntries, setStatementEntries] = useState<FinancialEntry[]>([]);
  const [statementInvestments, setStatementInvestments] = useState<Investment[]>([]);
  const [statementAllocations, setStatementAllocations] = useState<Allocation[]>([]);
  const [statementLoading, setStatementLoading] = useState(false);

  // ── Carregamento principal ──────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    if (!s || !permissions.canViewFinance) return;
    setLoading(true);
    try {
      const [dash, ents, invs, allocs, cats, agts, emps] = await Promise.all([
        apiFetch('/finance/dashboard', { service: 'finance', session: s }),
        apiFetch(`/finance/entries${buildQuery({ type: entryTypeFilter || undefined, from: fromFilter || undefined, to: toFilter || undefined, targetId: targetIdFilter || undefined })}`, { service: 'finance', session: s }),
        apiFetch(`/finance/investments${buildQuery({ from: fromFilter || undefined, to: toFilter || undefined })}`, { service: 'finance', session: s }),
        apiFetch(`/finance/allocations${buildQuery({ from: fromFilter || undefined, to: toFilter || undefined })}`, { service: 'finance', session: s }),
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

  useEffect(() => { void loadAll(); }, [loadAll]);

  // ── Extrato por destinatário ────────────────────────────────────────────────

  const loadStatement = useCallback(async () => {
    if (!s || !statementTargetId) return;
    setStatementLoading(true);
    try {
      const [ents, invs, allocs] = await Promise.all([
        apiFetch(`/finance/entries${buildQuery({ targetId: statementTargetId })}`, { service: 'finance', session: s }),
        apiFetch('/finance/investments', { service: 'finance', session: s }),
        apiFetch('/finance/allocations', { service: 'finance', session: s }),
      ]);
      setStatementEntries(ents);
      setStatementInvestments((invs as Investment[]).filter((i) => i.targetId === statementTargetId));
      setStatementAllocations((allocs as Allocation[]).filter((a) => a.targetId === statementTargetId));
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

  // ── Ações ───────────────────────────────────────────────────────────────────

  const submitEntry = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await apiFetch('/finance/entries', { service: 'finance', session: s, method: 'POST', body: JSON.stringify({ type: entryForm.type, amount: Number(entryForm.amount), description: entryForm.description, categoryId: entryForm.categoryId || undefined, targetType: entryForm.targetType || undefined, targetId: entryForm.targetId || undefined, occurredAt: entryForm.occurredAt || undefined }) });
      setEntryForm({ type: 'INCOME', amount: '', description: '', categoryId: '', targetType: 'ORGANIZATION', targetId: '', occurredAt: '' });
      showSuccess('Lançamento registrado!');
      await loadAll();
    } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  };

  const openEditEntry = (entry: FinancialEntry) => {
    setEditingEntry(entry);
    setEditForm({ type: entry.type, amount: String(entry.amount), description: entry.description, occurredAt: entry.occurredAt.slice(0, 10), categoryId: entry.category?.id ?? '' });
  };

  const submitEditEntry = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingEntry) return; setSaving(true);
    try {
      await apiFetch(`/finance/entries/${editingEntry.id}`, { service: 'finance', session: s, method: 'PATCH', body: JSON.stringify({ type: editForm.type, amount: Number(editForm.amount), description: editForm.description, occurredAt: editForm.occurredAt || undefined, categoryId: editForm.categoryId || null }) });
      setEditingEntry(null);
      showSuccess('Lançamento atualizado!');
      await loadAll();
    } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Excluir este lançamento permanentemente?')) return;
    try {
      await apiFetch(`/finance/entries/${id}`, { service: 'finance', session: s, method: 'DELETE' });
      showSuccess('Lançamento excluído.');
      await loadAll();
    } catch (e) { setError((e as Error).message); }
  };

  const submitInvestment = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await apiFetch('/finance/investments', { service: 'finance', session: s, method: 'POST', body: JSON.stringify({ amount: Number(investmentForm.amount), description: investmentForm.description || undefined, targetType: investmentForm.targetType, targetId: investmentForm.targetId || undefined }) });
      setInvestmentForm({ amount: '', description: '', targetType: 'ORGANIZATION', targetId: '' });
      showSuccess('Investimento registrado!');
      await loadAll();
    } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  };

  const submitAllocation = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await apiFetch('/finance/allocations', { service: 'finance', session: s, method: 'POST', body: JSON.stringify({ amount: Number(allocationForm.amount), description: allocationForm.description || undefined, targetType: allocationForm.targetType, targetId: allocationForm.targetId }) });
      setAllocationForm({ amount: '', description: '', targetType: 'AGENT', targetId: '' });
      showSuccess('Repasse registrado!');
      await loadAll();
    } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  };

  const submitCategory = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await apiFetch('/finance/categories', { service: 'finance', session: s, method: 'POST', body: JSON.stringify(categoryForm) });
      setCategoryForm({ name: '', description: '', entryType: 'EXPENSE' });
      showSuccess('Categoria criada!');
      await loadAll();
    } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return;
    try {
      await apiFetch(`/finance/categories/${id}`, { service: 'finance', session: s, method: 'DELETE' });
      showSuccess('Categoria excluída.');
      await loadAll();
    } catch (e) { setError((e as Error).message); }
  };

  // ── TargetSelect ─────────────────────────────────────────────────────────────

  function TargetSelect({ targetType, targetId, onTypeChange, onIdChange, allowedTypes }: { targetType: string; targetId: string; onTypeChange: (v: string) => void; onIdChange: (v: string) => void; allowedTypes: string[] }) {
    return (
      <div className="space-y-2">
        <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" value={targetType} onChange={(e) => { onTypeChange(e.target.value); onIdChange(''); }}>
          {allowedTypes.includes('ORGANIZATION') && <option value="ORGANIZATION">Globus Dei (Organização)</option>}
          {allowedTypes.includes('AGENT') && <option value="AGENT">Agente</option>}
          {allowedTypes.includes('EMPREENDIMENTO') && <option value="EMPREENDIMENTO">Empreendimento</option>}
        </select>
        {targetType === 'AGENT' && (
          <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" value={targetId} onChange={(e) => onIdChange(e.target.value)} required>
            <option value="">Selecione o agente…</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name} — {a.email}</option>)}
          </select>
        )}
        {targetType === 'EMPREENDIMENTO' && (
          <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" value={targetId} onChange={(e) => onIdChange(e.target.value)} required>
            <option value="">Selecione o empreendimento…</option>
            {empreendimentos.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
        )}
      </div>
    );
  }

  // ── Derivados ─────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Visão Geral' },
    { id: 'entries', label: 'Lançamentos' },
    { id: 'investments', label: 'Investimentos' },
    { id: 'allocations', label: 'Repasses' },
    { id: 'categories', label: 'Categorias' },
    { id: 'statement', label: 'Extrato' },
  ];

  const maxMonthly = dashboard?.monthlyChart
    ? Math.max(...dashboard.monthlyChart.flatMap((m) => [m.income, m.expense]), 1)
    : 1;

  const entryTotals = entries.reduce(
    (acc, e) => { if (e.type === 'INCOME' || e.type === 'ADJUSTMENT') acc.income += e.amount; else acc.expense += e.amount; return acc; },
    { income: 0, expense: 0 },
  );

  const statementTotals = {
    invested: statementInvestments.reduce((a, i) => a + i.amount, 0),
    allocated: statementAllocations.reduce((a, al) => a + al.amount, 0),
    income: statementEntries.filter((e) => e.type === 'INCOME').reduce((a, e) => a + e.amount, 0),
    expense: statementEntries.filter((e) => e.type === 'EXPENSE').reduce((a, e) => a + e.amount, 0),
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Gestão financeira</div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Controle de Caixa</h1>
            <p className="mt-1 text-sm text-slate-500">Lançamentos, investimentos, repasses e categorias da Globus Dei.</p>
          </div>
          <span className={`self-start rounded-full px-4 py-2 text-sm font-bold ${permissions.canManageFinance ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {permissions.canManageFinance ? '✦ Gestor de recursos' : 'Apenas visualização'}
          </span>
        </div>
      </section>

      {/* Feedback */}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">⚠ {error}</div>}
      {successMsg && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">✓ {successMsg}</div>}

      {/* Abas */}
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-fit rounded-xl px-4 py-2 text-sm font-semibold transition whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Visão Geral ─────────────────────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {loading ? <LoadingRows /> : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <KpiCard label="Saldo atual" value={formatBRL(dashboard?.balance ?? 0)} color={(dashboard?.balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'} />
                <KpiCard label="Total entradas" value={formatBRL(dashboard?.totalIncome ?? 0)} color="text-emerald-600" />
                <KpiCard label="Total saídas" value={formatBRL(dashboard?.totalExpense ?? 0)} color="text-red-600" />
              </div>

              {(dashboard?.monthlyChart?.length ?? 0) > 0 && (
                <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Fluxo dos últimos 6 meses</div>
                  <div className="flex items-end gap-3 h-28">
                    {dashboard!.monthlyChart.map((m) => (
                      <div key={m.month} className="flex flex-1 gap-1 h-full items-end">
                        <MonthlyBar label={m.month} value={m.income} max={maxMonthly} color="bg-emerald-400" />
                        <MonthlyBar label={m.month} value={m.expense} max={maxMonthly} color="bg-red-400" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-6 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-400" /> Entradas</span>
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-400" /> Saídas</span>
                  </div>
                </article>
              )}

              <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Movimentos recentes</div>
                <div className="space-y-2">
                  {(dashboard?.recentEntries ?? []).length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-400">Nenhum movimento registrado ainda.</p>
                  )}
                  {(dashboard?.recentEntries ?? []).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${ENTRY_TYPE_COLORS[entry.type]}`}>{ENTRY_TYPE_LABELS[entry.type]}</span>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{entry.description}</div>
                          {entry.targetName && <div className="text-xs text-slate-400">{entry.targetName}</div>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-bold ${entry.type === 'INCOME' || entry.type === 'ADJUSTMENT' ? 'text-emerald-600' : 'text-red-600'}`}>{formatBRL(entry.amount)}</div>
                        <div className="text-xs text-slate-400">{formatDate(entry.occurredAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </>
          )}
        </div>
      )}

      {/* ── Lançamentos ─────────────────────────────────────────────────────── */}
      {activeTab === 'entries' && (
        <div className="space-y-6">

          {/* Modal de edição */}
          {editingEntry && permissions.canManageFinance && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <form onSubmit={submitEditEntry} className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Editar lançamento</h2>
                  <button type="button" onClick={() => setEditingEntry(null)} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
                </div>
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                  <option value="INCOME">Entrada</option>
                  <option value="EXPENSE">Saída</option>
                  <option value="ADJUSTMENT">Ajuste</option>
                  <option value="TRANSFER">Transferência</option>
                </select>
                <input required type="number" min="0.01" step="0.01" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" placeholder="Valor (R$)" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
                <input required type="text" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" placeholder="Descrição" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                <input type="date" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" value={editForm.occurredAt} onChange={(e) => setEditForm({ ...editForm, occurredAt: e.target.value })} />
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" value={editForm.categoryId} onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}>
                  <option value="">Sem categoria</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditingEntry(null)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
                  <button type="submit" disabled={saving} className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-black disabled:opacity-50">{saving ? 'Salvando…' : 'Salvar'}</button>
                </div>
              </form>
            </div>
          )}

          {/* Filtros */}
          <div className="flex flex-wrap gap-3 rounded-[28px] border border-slate-200 bg-white p-4">
            <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={entryTypeFilter} onChange={(e) => setEntryTypeFilter(e.target.value)}>
              <option value="">Todos os tipos</option>
              <option value="INCOME">Entrada</option>
              <option value="EXPENSE">Saída</option>
              <option value="ADJUSTMENT">Ajuste</option>
              <option value="TRANSFER">Transferência</option>
            </select>
            <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={targetIdFilter} onChange={(e) => setTargetIdFilter(e.target.value)}>
              <option value="">Todos os destinatários</option>
              <optgroup label="Agentes">{agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>
              <optgroup label="Empreendimentos">{empreendimentos.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}</optgroup>
            </select>
            <input type="date" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={fromFilter} onChange={(e) => setFromFilter(e.target.value)} />
            <input type="date" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={toFilter} onChange={(e) => setToFilter(e.target.value)} />
            <button type="button" onClick={() => { setEntryTypeFilter(''); setFromFilter(''); setToFilter(''); setTargetIdFilter(''); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Limpar filtros</button>
          </div>

          {/* Totais do período */}
          {entries.length > 0 && (
            <div className="flex flex-wrap gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-500">
              <span><span className="font-bold text-emerald-600">{formatBRL(entryTotals.income)}</span> entradas</span>
              <span className="text-slate-300">|</span>
              <span><span className="font-bold text-red-600">{formatBRL(entryTotals.expense)}</span> saídas</span>
              <span className="text-slate-300">|</span>
              <span><span className={`font-bold ${entryTotals.income - entryTotals.expense >= 0 ? 'text-slate-900' : 'text-red-600'}`}>{formatBRL(entryTotals.income - entryTotals.expense)}</span> saldo no período</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
            <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">{entries.length} lançamento(s)</div>
              {loading ? <LoadingRows /> : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${ENTRY_TYPE_COLORS[entry.type]}`}>{ENTRY_TYPE_LABELS[entry.type]}</span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-800">{entry.description}</div>
                          <div className="text-xs text-slate-400">
                            {formatDate(entry.occurredAt)}
                            {entry.category && ` · ${entry.category.name}`}
                            {entry.targetName && ` · ${entry.targetName}`}
                            {entry.recordedBy && ` · por ${entry.recordedBy.name}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-bold ${entry.type === 'INCOME' || entry.type === 'ADJUSTMENT' ? 'text-emerald-600' : 'text-red-600'}`}>{formatBRL(entry.amount)}</span>
                        {permissions.canManageFinance && (
                          <>
                            <button type="button" onClick={() => openEditEntry(entry)} title="Editar" className="rounded-xl p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition text-xs">✎</button>
                            <button type="button" onClick={() => void deleteEntry(entry.id)} title="Excluir" className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition text-xs">✕</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {entries.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Nenhum lançamento encontrado.</p>}
                </div>
              )}
            </article>

            {permissions.canManageFinance && (
              <form onSubmit={submitEntry} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm space-y-4 self-start">
                <h2 className="text-lg font-bold text-slate-900">Novo lançamento</h2>
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" value={entryForm.type} onChange={(e) => setEntryForm({ ...entryForm, type: e.target.value })}>
                  <option value="INCOME">Entrada</option>
                  <option value="EXPENSE">Saída</option>
                  <option value="ADJUSTMENT">Ajuste</option>
                  <option value="TRANSFER">Transferência</option>
                </select>
                <input required type="number" min="0.01" step="0.01" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" placeholder="Valor (R$)" value={entryForm.amount} onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })} />
                <input required type="text" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" placeholder="Descrição" value={entryForm.description} onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })} />
                <input type="date" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" value={entryForm.occurredAt} onChange={(e) => setEntryForm({ ...entryForm, occurredAt: e.target.value })} />
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" value={entryForm.categoryId} onChange={(e) => setEntryForm({ ...entryForm, categoryId: e.target.value })}>
                  <option value="">Sem categoria</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <TargetSelect targetType={entryForm.targetType} targetId={entryForm.targetId} onTypeChange={(v) => setEntryForm({ ...entryForm, targetType: v, targetId: '' })} onIdChange={(v) => setEntryForm({ ...entryForm, targetId: v })} allowedTypes={['ORGANIZATION', 'AGENT', 'EMPREENDIMENTO']} />
                <button type="submit" disabled={saving} className="w-full rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-black disabled:opacity-50 transition">{saving ? 'Salvando…' : 'Registrar lançamento'}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Investimentos ────────────────────────────────────────────────────── */}
      {activeTab === 'investments' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
          <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">{investments.length} investimento(s)</div>
              <span className="text-sm font-bold text-emerald-600">Total: {formatBRL(investments.reduce((a, i) => a + i.amount, 0))}</span>
            </div>
            {loading ? <LoadingRows /> : (
              <div className="space-y-2">
                {investments.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{inv.targetName ?? 'Globus Dei'}</div>
                      <div className="text-xs text-slate-400">
                        {TARGET_TYPE_LABELS[inv.targetType] ?? inv.targetType}
                        {inv.description && ` · ${inv.description}`}
                        {inv.recordedBy && ` · por ${inv.recordedBy.name}`}
                        {` · ${formatDate(inv.createdAt)}`}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-emerald-600">{formatBRL(inv.amount)}</span>
                  </div>
                ))}
                {investments.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Nenhum investimento registrado.</p>}
              </div>
            )}
          </article>

          {permissions.canManageFinance && (
            <form onSubmit={submitInvestment} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm space-y-4 self-start">
              <h2 className="text-lg font-bold text-slate-900">Registrar investimento</h2>
              <input required type="number" min="0.01" step="0.01" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" placeholder="Valor (R$)" value={investmentForm.amount} onChange={(e) => setInvestmentForm({ ...investmentForm, amount: e.target.value })} />
              <input type="text" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" placeholder="Descrição (opcional)" value={investmentForm.description} onChange={(e) => setInvestmentForm({ ...investmentForm, description: e.target.value })} />
              <TargetSelect targetType={investmentForm.targetType} targetId={investmentForm.targetId} onTypeChange={(v) => setInvestmentForm({ ...investmentForm, targetType: v, targetId: '' })} onIdChange={(v) => setInvestmentForm({ ...investmentForm, targetId: v })} allowedTypes={['ORGANIZATION', 'AGENT', 'EMPREENDIMENTO']} />
              <button type="submit" disabled={saving} className="w-full rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition">{saving ? 'Salvando…' : 'Registrar investimento'}</button>
            </form>
          )}
        </div>
      )}

      {/* ── Repasses ─────────────────────────────────────────────────────────── */}
      {activeTab === 'allocations' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
          <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">{allocations.length} repasse(s)</div>
              <span className="text-sm font-bold text-red-600">Total: {formatBRL(allocations.reduce((a, al) => a + al.amount, 0))}</span>
            </div>
            {loading ? <LoadingRows /> : (
              <div className="space-y-2">
                {allocations.map((alloc) => (
                  <div key={alloc.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{alloc.targetName}</div>
                      <div className="text-xs text-slate-400">
                        {TARGET_TYPE_LABELS[alloc.targetType] ?? alloc.targetType}
                        {alloc.description && ` · ${alloc.description}`}
                        {alloc.recordedBy && ` · por ${alloc.recordedBy.name}`}
                        {` · ${formatDate(alloc.createdAt)}`}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-red-600">{formatBRL(alloc.amount)}</span>
                  </div>
                ))}
                {allocations.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Nenhum repasse registrado.</p>}
              </div>
            )}
          </article>

          {permissions.canManageFinance && (
            <form onSubmit={submitAllocation} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm space-y-4 self-start">
              <h2 className="text-lg font-bold text-slate-900">Registrar repasse</h2>
              <input required type="number" min="0.01" step="0.01" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" placeholder="Valor (R$)" value={allocationForm.amount} onChange={(e) => setAllocationForm({ ...allocationForm, amount: e.target.value })} />
              <input type="text" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" placeholder="Descrição (opcional)" value={allocationForm.description} onChange={(e) => setAllocationForm({ ...allocationForm, description: e.target.value })} />
              <p className="text-xs text-slate-500">Repasses são direcionados a agentes ou empreendimentos.</p>
              <TargetSelect targetType={allocationForm.targetType} targetId={allocationForm.targetId} onTypeChange={(v) => setAllocationForm({ ...allocationForm, targetType: v, targetId: '' })} onIdChange={(v) => setAllocationForm({ ...allocationForm, targetId: v })} allowedTypes={['AGENT', 'EMPREENDIMENTO']} />
              <button type="submit" disabled={saving} className="w-full rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition">{saving ? 'Salvando…' : 'Registrar repasse'}</button>
            </form>
          )}
        </div>
      )}

      {/* ── Categorias ───────────────────────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">{categories.length} categoria(s)</div>
            {loading ? <LoadingRows /> : (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{cat.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ENTRY_TYPE_COLORS[cat.entryType] ?? 'bg-slate-100 text-slate-600'}`}>{ENTRY_TYPE_LABELS[cat.entryType] ?? cat.entryType}</span>
                      </div>
                      {cat.description && <div className="text-xs text-slate-400 mt-0.5">{cat.description}</div>}
                    </div>
                    {permissions.canManageFinance && (
                      <button type="button" onClick={() => void deleteCategory(cat.id)} className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition">✕</button>
                    )}
                  </div>
                ))}
                {categories.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Nenhuma categoria cadastrada.</p>}
              </div>
            )}
          </article>

          {permissions.canManageFinance && (
            <form onSubmit={submitCategory} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm space-y-4 self-start">
              <h2 className="text-lg font-bold text-slate-900">Nova categoria</h2>
              <input required type="text" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" placeholder="Nome da categoria" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
              <input type="text" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" placeholder="Descrição (opcional)" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
              <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" value={categoryForm.entryType} onChange={(e) => setCategoryForm({ ...categoryForm, entryType: e.target.value })}>
                <option value="EXPENSE">Saída</option>
                <option value="INCOME">Entrada</option>
                <option value="ADJUSTMENT">Ajuste</option>
                <option value="TRANSFER">Transferência</option>
              </select>
              <button type="submit" disabled={saving} className="w-full rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-black disabled:opacity-50 transition">{saving ? 'Salvando…' : 'Criar categoria'}</button>
            </form>
          )}
        </div>
      )}

      {/* ── Extrato por Destinatário ─────────────────────────────────────────── */}
      {activeTab === 'statement' && (
        <div className="space-y-6">
          {/* Seletor */}
          <div className="flex flex-wrap gap-3 rounded-[28px] border border-slate-200 bg-white p-4">
            <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium" value={statementTargetType}
              onChange={(e) => { setStatementTargetType(e.target.value as 'AGENT' | 'EMPREENDIMENTO'); setStatementTargetId(''); setStatementEntries([]); setStatementInvestments([]); setStatementAllocations([]); }}>
              <option value="AGENT">Agente</option>
              <option value="EMPREENDIMENTO">Empreendimento</option>
            </select>
            <select className="min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={statementTargetId} onChange={(e) => setStatementTargetId(e.target.value)}>
              <option value="">{statementTargetType === 'AGENT' ? 'Selecione o agente…' : 'Selecione o empreendimento…'}</option>
              {statementTargetType === 'AGENT'
                ? agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)
                : empreendimentos.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>

          {!statementTargetId && (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-400">
              Selecione um destinatário para ver o extrato completo.
            </div>
          )}

          {statementTargetId && (
            statementLoading ? <LoadingRows /> : (
              <>
                {/* KPIs do destinatário */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <KpiCard label="Investido" value={formatBRL(statementTotals.invested)} color="text-emerald-600" />
                  <KpiCard label="Repassado" value={formatBRL(statementTotals.allocated)} color="text-red-600" />
                  <KpiCard label="Entradas avulsas" value={formatBRL(statementTotals.income)} color="text-blue-600" />
                  <KpiCard label="Saídas avulsas" value={formatBRL(statementTotals.expense)} color="text-amber-600" />
                </div>

                {/* Lançamentos */}
                <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Lançamentos ({statementEntries.length})</div>
                  <div className="space-y-2">
                    {statementEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${ENTRY_TYPE_COLORS[entry.type]}`}>{ENTRY_TYPE_LABELS[entry.type]}</span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-800">{entry.description}</div>
                            <div className="text-xs text-slate-400">{formatDate(entry.occurredAt)}{entry.category && ` · ${entry.category.name}`}</div>
                          </div>
                        </div>
                        <span className={`shrink-0 text-sm font-bold ${entry.type === 'INCOME' || entry.type === 'ADJUSTMENT' ? 'text-emerald-600' : 'text-red-600'}`}>{formatBRL(entry.amount)}</span>
                      </div>
                    ))}
                    {statementEntries.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Nenhum lançamento para este destinatário.</p>}
                  </div>
                </article>

                {/* Investimentos */}
                {statementInvestments.length > 0 && (
                  <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Investimentos ({statementInvestments.length})</div>
                    <div className="space-y-2">
                      {statementInvestments.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-800">{inv.description ?? 'Investimento'}</div>
                            <div className="text-xs text-slate-400">{formatDate(inv.createdAt)}{inv.recordedBy && ` · por ${inv.recordedBy.name}`}</div>
                          </div>
                          <span className="text-sm font-bold text-emerald-600">{formatBRL(inv.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                )}

                {/* Repasses */}
                {statementAllocations.length > 0 && (
                  <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Repasses ({statementAllocations.length})</div>
                    <div className="space-y-2">
                      {statementAllocations.map((alloc) => (
                        <div key={alloc.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-800">{alloc.description ?? 'Repasse'}</div>
                            <div className="text-xs text-slate-400">{formatDate(alloc.createdAt)}{alloc.recordedBy && ` · por ${alloc.recordedBy.name}`}</div>
                          </div>
                          <span className="text-sm font-bold text-red-600">{formatBRL(alloc.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                )}
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}
