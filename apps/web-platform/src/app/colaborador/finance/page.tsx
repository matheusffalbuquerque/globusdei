'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import { type AppSession } from '../../../lib/auth';

/**
 * CollaboratorFinancePage supports read-only and manager modes according to finance permissions.
 */
export default function CollaboratorFinancePage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();
  const [dashboard, setDashboard] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [entryForm, setEntryForm] = useState({ type: 'INCOME', amount: '', description: '', categoryId: '' });
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
  const [error, setError] = useState<string | null>(null);

  const loadFinance = async () => {
    try {
      const [dashboardData, entryData, investmentData, allocationData, categoryData] = await Promise.all([
        apiFetch('/finance/dashboard', { service: 'finance', session: session as AppSession }),
        apiFetch('/finance/entries', { service: 'finance', session: session as AppSession }),
        apiFetch('/finance/investments', { service: 'finance', session: session as AppSession }),
        apiFetch('/finance/allocations', { service: 'finance', session: session as AppSession }),
        apiFetch('/finance/categories', { service: 'finance', session: session as AppSession }),
      ]);

      setDashboard(dashboardData);
      setEntries(entryData);
      setInvestments(investmentData);
      setAllocations(allocationData);
      setCategories(categoryData);
      setError(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  useEffect(() => {
    if (session && permissions.canViewFinance) {
      void loadFinance();
    }
  }, [permissions.canViewFinance, session]);

  const submitEntry = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiFetch('/finance/entries', {
        service: 'finance',
        session: session as AppSession,
        method: 'POST',
        body: JSON.stringify({
          ...entryForm,
          amount: Number(entryForm.amount),
          categoryId: entryForm.categoryId || undefined,
        }),
      });
      setEntryForm({ type: 'INCOME', amount: '', description: '', categoryId: '' });
      await loadFinance();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  const submitInvestment = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiFetch('/finance/investments', {
        service: 'finance',
        session: session as AppSession,
        method: 'POST',
        body: JSON.stringify({
          ...investmentForm,
          amount: Number(investmentForm.amount),
          targetId: investmentForm.targetId || undefined,
        }),
      });
      setInvestmentForm({ amount: '', description: '', targetType: 'ORGANIZATION', targetId: '' });
      await loadFinance();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  const submitAllocation = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiFetch('/finance/allocations', {
        service: 'finance',
        session: session as AppSession,
        method: 'POST',
        body: JSON.stringify({
          ...allocationForm,
          amount: Number(allocationForm.amount),
        }),
      });
      setAllocationForm({ amount: '', description: '', targetType: 'AGENT', targetId: '' });
      await loadFinance();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Finance service</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Fluxo de caixa e repasses</h1>
            <p className="mt-3 text-slate-600">
              A visualização é aberta para colaboradores. Os formulários de escrita seguem o papel local de gestor de recursos ou administrador.
            </p>
          </div>
          <div className={`rounded-full px-4 py-2 text-sm font-bold ${permissions.canManageFinance ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
            {permissions.canManageFinance ? 'Modo gestor' : 'Modo leitura'}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Saldo</div>
          <div className="mt-4 text-4xl font-black tracking-tight text-slate-900">
            R$ {(dashboard?.balance ?? 0).toFixed(2)}
          </div>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Entradas</div>
          <div className="mt-4 text-4xl font-black tracking-tight text-emerald-600">
            R$ {(dashboard?.totalIncome ?? 0).toFixed(2)}
          </div>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Saídas</div>
          <div className="mt-4 text-4xl font-black tracking-tight text-red-600">
            R$ {(dashboard?.totalExpense ?? 0).toFixed(2)}
          </div>
        </article>
      </section>

      {permissions.canManageFinance ? (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <form onSubmit={submitEntry} className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Novo lançamento</h2>
            <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" value={entryForm.type} onChange={(event) => setEntryForm({ ...entryForm, type: event.target.value })}>
              <option value="INCOME">INCOME</option>
              <option value="EXPENSE">EXPENSE</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
              <option value="TRANSFER">TRANSFER</option>
            </select>
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" type="number" placeholder="Valor" value={entryForm.amount} onChange={(event) => setEntryForm({ ...entryForm, amount: event.target.value })} />
            <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" value={entryForm.categoryId} onChange={(event) => setEntryForm({ ...entryForm, categoryId: event.target.value })}>
              <option value="">Sem categoria</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <textarea className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4" rows={4} placeholder="Descrição" value={entryForm.description} onChange={(event) => setEntryForm({ ...entryForm, description: event.target.value })} />
            <button className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white">Salvar lançamento</button>
          </form>

          <form onSubmit={submitInvestment} className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Novo investimento</h2>
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" type="number" placeholder="Valor" value={investmentForm.amount} onChange={(event) => setInvestmentForm({ ...investmentForm, amount: event.target.value })} />
            <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" value={investmentForm.targetType} onChange={(event) => setInvestmentForm({ ...investmentForm, targetType: event.target.value })}>
              <option value="ORGANIZATION">ORGANIZATION</option>
              <option value="AGENT">AGENT</option>
              <option value="EMPREENDIMENTO">EMPREENDIMENTO</option>
            </select>
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" placeholder="ID do alvo" value={investmentForm.targetId} onChange={(event) => setInvestmentForm({ ...investmentForm, targetId: event.target.value })} />
            <textarea className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4" rows={4} placeholder="Descrição" value={investmentForm.description} onChange={(event) => setInvestmentForm({ ...investmentForm, description: event.target.value })} />
            <button className="rounded-2xl bg-orange-600 px-6 py-3 text-sm font-bold text-white">Registrar investimento</button>
          </form>

          <form onSubmit={submitAllocation} className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Novo repasse</h2>
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" type="number" placeholder="Valor" value={allocationForm.amount} onChange={(event) => setAllocationForm({ ...allocationForm, amount: event.target.value })} />
            <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" value={allocationForm.targetType} onChange={(event) => setAllocationForm({ ...allocationForm, targetType: event.target.value })}>
              <option value="AGENT">AGENT</option>
              <option value="EMPREENDIMENTO">EMPREENDIMENTO</option>
            </select>
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" placeholder="ID do agente ou empreendimento" value={allocationForm.targetId} onChange={(event) => setAllocationForm({ ...allocationForm, targetId: event.target.value })} />
            <textarea className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4" rows={4} placeholder="Descrição" value={allocationForm.description} onChange={(event) => setAllocationForm({ ...allocationForm, description: event.target.value })} />
            <button className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white">Registrar repasse</button>
          </form>
        </section>
      ) : (
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-sm font-medium text-slate-600">
            Você possui acesso de leitura ao financeiro. Os formulários de lançamentos, investimentos e repasses ficam habilitados apenas para gestores de recursos e administradores.
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">Movimentos recentes</h3>
          <div className="mt-4 space-y-3">
            {entries.slice(0, 8).map((entry) => (
              <div key={entry.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-900">{entry.type}</span>
                  <span className="text-sm font-bold text-orange-600">R$ {entry.amount.toFixed(2)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{entry.description}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">Investimentos</h3>
          <div className="mt-4 space-y-3">
            {investments.map((investment) => (
              <div key={investment.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-900">{investment.targetName ?? 'Globus Dei'}</span>
                  <span className="text-sm font-bold text-emerald-600">R$ {investment.amount.toFixed(2)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{investment.description ?? 'Sem descrição'}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">Repasses</h3>
          <div className="mt-4 space-y-3">
            {allocations.map((allocation) => (
              <div key={allocation.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-900">{allocation.targetName}</span>
                  <span className="text-sm font-bold text-red-600">R$ {allocation.amount.toFixed(2)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{allocation.description ?? 'Sem descrição'}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
