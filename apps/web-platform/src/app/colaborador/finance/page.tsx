'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { apiFetch } from '../../../lib/api';

export default function CollaboratorFinancePage() {
  const { data: session, status } = useSession();
  const [dashboard, setDashboard] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [entryForm, setEntryForm] = useState({ type: 'INCOME', amount: '', description: '', categoryId: '' });
  const [investmentForm, setInvestmentForm] = useState({ amount: '', description: '', targetType: 'ORGANIZATION', targetId: '' });
  const [allocationForm, setAllocationForm] = useState({ amount: '', description: '', targetType: 'AGENT', targetId: '' });
  const [error, setError] = useState<string | null>(null);

  const loadFinance = async () => {
    try {
      const [dashboardData, entryData, investmentData, allocationData, categoryData] = await Promise.all([
        apiFetch('/finance/dashboard', { service: 'finance', session }),
        apiFetch('/finance/entries', { service: 'finance', session }),
        apiFetch('/finance/investments', { service: 'finance', session }),
        apiFetch('/finance/allocations', { service: 'finance', session }),
        apiFetch('/finance/categories', { service: 'finance', session }),
      ]);

      setDashboard(dashboardData);
      setEntries(entryData);
      setInvestments(investmentData);
      setAllocations(allocationData);
      setCategories(categoryData);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      void loadFinance();
    }
  }, [status]);

  const submitEntry = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiFetch('/finance/entries', {
        service: 'finance',
        session,
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
        session,
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
        session,
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

  if (status === 'loading') return <div className="p-10 text-center">Carregando sessão...</div>;
  if (status !== 'authenticated') return <div className="p-10 text-center">Faça login para acessar o financeiro.</div>;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-8">
      {error && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600">{error}</div>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200"><span className="text-xs font-bold uppercase text-slate-400">Saldo</span><div className="mt-2 text-3xl font-black text-slate-900">R$ {(dashboard?.balance ?? 0).toFixed(2)}</div></div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200"><span className="text-xs font-bold uppercase text-slate-400">Entradas</span><div className="mt-2 text-3xl font-black text-green-600">R$ {(dashboard?.totalIncome ?? 0).toFixed(2)}</div></div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200"><span className="text-xs font-bold uppercase text-slate-400">Saídas</span><div className="mt-2 text-3xl font-black text-red-600">R$ {(dashboard?.totalExpense ?? 0).toFixed(2)}</div></div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <form onSubmit={submitEntry} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Novo lançamento</h2>
          <select className="w-full rounded-xl border border-slate-200 p-4" value={entryForm.type} onChange={(event) => setEntryForm({ ...entryForm, type: event.target.value })}>
            <option value="INCOME">INCOME</option>
            <option value="EXPENSE">EXPENSE</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
            <option value="TRANSFER">TRANSFER</option>
          </select>
          <input className="w-full rounded-xl border border-slate-200 p-4" type="number" placeholder="Valor" value={entryForm.amount} onChange={(event) => setEntryForm({ ...entryForm, amount: event.target.value })} />
          <select className="w-full rounded-xl border border-slate-200 p-4" value={entryForm.categoryId} onChange={(event) => setEntryForm({ ...entryForm, categoryId: event.target.value })}>
            <option value="">Sem categoria</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <textarea className="w-full rounded-xl border border-slate-200 p-4" rows={4} placeholder="Descrição" value={entryForm.description} onChange={(event) => setEntryForm({ ...entryForm, description: event.target.value })} />
          <button className="rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white">Salvar</button>
        </form>

        <form onSubmit={submitInvestment} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Novo investimento</h2>
          <input className="w-full rounded-xl border border-slate-200 p-4" type="number" placeholder="Valor" value={investmentForm.amount} onChange={(event) => setInvestmentForm({ ...investmentForm, amount: event.target.value })} />
          <select className="w-full rounded-xl border border-slate-200 p-4" value={investmentForm.targetType} onChange={(event) => setInvestmentForm({ ...investmentForm, targetType: event.target.value })}>
            <option value="ORGANIZATION">ORGANIZATION</option>
            <option value="AGENT">AGENT</option>
            <option value="EMPREENDIMENTO">EMPREENDIMENTO</option>
          </select>
          <input className="w-full rounded-xl border border-slate-200 p-4" placeholder="ID do alvo (opcional para organization)" value={investmentForm.targetId} onChange={(event) => setInvestmentForm({ ...investmentForm, targetId: event.target.value })} />
          <textarea className="w-full rounded-xl border border-slate-200 p-4" rows={4} placeholder="Descrição" value={investmentForm.description} onChange={(event) => setInvestmentForm({ ...investmentForm, description: event.target.value })} />
          <button className="rounded-2xl bg-primary px-6 py-3 font-bold text-white">Registrar investimento</button>
        </form>

        <form onSubmit={submitAllocation} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Novo repasse</h2>
          <input className="w-full rounded-xl border border-slate-200 p-4" type="number" placeholder="Valor" value={allocationForm.amount} onChange={(event) => setAllocationForm({ ...allocationForm, amount: event.target.value })} />
          <select className="w-full rounded-xl border border-slate-200 p-4" value={allocationForm.targetType} onChange={(event) => setAllocationForm({ ...allocationForm, targetType: event.target.value })}>
            <option value="AGENT">AGENT</option>
            <option value="EMPREENDIMENTO">EMPREENDIMENTO</option>
          </select>
          <input className="w-full rounded-xl border border-slate-200 p-4" placeholder="ID do agente ou empreendimento" value={allocationForm.targetId} onChange={(event) => setAllocationForm({ ...allocationForm, targetId: event.target.value })} />
          <textarea className="w-full rounded-xl border border-slate-200 p-4" rows={4} placeholder="Descrição" value={allocationForm.description} onChange={(event) => setAllocationForm({ ...allocationForm, description: event.target.value })} />
          <button className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white">Registrar repasse</button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm xl:col-span-1">
          <h3 className="mb-4 text-xl font-bold text-slate-900">Movimentos recentes</h3>
          <div className="space-y-4">
            {entries.slice(0, 8).map((entry) => (
              <div key={entry.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{entry.type}</span>
                  <span className="text-sm font-bold text-primary">R$ {entry.amount.toFixed(2)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{entry.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm xl:col-span-1">
          <h3 className="mb-4 text-xl font-bold text-slate-900">Investimentos</h3>
          <div className="space-y-4">
            {investments.map((investment) => (
              <div key={investment.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{investment.targetName ?? 'Globus Dei'}</span>
                  <span className="text-sm font-bold text-green-600">R$ {investment.amount.toFixed(2)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{investment.description ?? 'Sem descrição'}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm xl:col-span-1">
          <h3 className="mb-4 text-xl font-bold text-slate-900">Repasses</h3>
          <div className="space-y-4">
            {allocations.map((allocation) => (
              <div key={allocation.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{allocation.targetName}</span>
                  <span className="text-sm font-bold text-red-600">R$ {allocation.amount.toFixed(2)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{allocation.description ?? 'Sem descrição'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
