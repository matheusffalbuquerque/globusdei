'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  TrendingUp,
  Wallet,
  AlertCircle,
  Loader2,
  RefreshCw,
  Users,
  Building2,
  Plus,
  ArrowRight,
  Banknote,
  PiggyBank,
} from 'lucide-react';

import { useAgentPortal } from '../../../components/portal/AgentPortalShell';
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
import { Separator } from '../../../components/ui/separator';

// ─── Types ────────────────────────────────────────────────────────────────────

type Summary = {
  totalInvested: number;
  totalTransactions: number;
  monthlyRecurring: number;
  countByTargetType: { agent: number; empreendimento: number };
};

type Investment = {
  id: string;
  targetType: 'AGENT' | 'EMPREENDIMENTO';
  amount: number;
  type: 'ONE_TIME' | 'RECURRING';
  notes: string | null;
  investedAt: string;
  targetAgent: { id: string; name: string } | null;
  targetEmpreendimento: { id: string; name: string; type: string } | null;
};

type WalletData = {
  investor: { id: string; name: string };
  summary: Summary;
  items: Investment[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const TYPE_LABEL: Record<string, string> = { ONE_TIME: 'Único', RECURRING: 'Recorrente' };
const TYPE_BADGE: Record<string, 'secondary' | 'success'> = { ONE_TIME: 'secondary', RECURRING: 'success' };

// ─── Component ────────────────────────────────────────────────────────────────

export default function InvestmentWalletPage() {
  const { data: session, status } = useSession();
  useAgentPortal();
  const typedSession = session as AppSession | null;

  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!typedSession) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/investments/wallet', { session: typedSession });
      setWalletData(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') void load();
  }, [status, typedSession?.accessToken]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando carteira…
        </div>
      </div>
    );
  }

  const s = walletData?.summary;

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Minha carteira
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Carteira de Investimentos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe seus aportes, distribuição e recorrências.
          </p>
        </div>
        <Link href="/agent/investments/received">
          <Button variant="outline" size="sm" className="shrink-0 gap-2">
            <ArrowRight className="h-4 w-4" /> Ver recebidos
          </Button>
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Banknote className="h-4 w-4" />
              <p className="text-xs font-medium">Total investido</p>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {fmt(s?.totalInvested ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4" />
              <p className="text-xs font-medium">Recorrente/mês</p>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
              {fmt(s?.monthlyRecurring ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <p className="text-xs font-medium">Em agentes</p>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {s?.countByTargetType.agent ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <p className="text-xs font-medium">Em empreendimentos</p>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {s?.countByTargetType.empreendimento ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Distribuição visual ── */}
      {s && s.totalInvested > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Distribuição por alvo</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Agentes</span>
                  <span>{s.countByTargetType.agent} aportes</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${(s.countByTargetType.agent / s.totalTransactions) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Empreendimentos</span>
                  <span>{s.countByTargetType.empreendimento} aportes</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${(s.countByTargetType.empreendimento / s.totalTransactions) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Histórico ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Histórico de aportes ({walletData?.items.length ?? 0})
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {!walletData?.items.length ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <PiggyBank className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                Você ainda não registrou nenhum investimento.
              </p>
              <p className="text-xs text-muted-foreground">
                Ao investir em um agente ou empreendimento, o registro aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {walletData.items.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {inv.targetType === 'AGENT' ? (
                        <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {inv.targetAgent?.name ?? inv.targetEmpreendimento?.name ?? '—'}
                      </span>
                      <Badge variant={TYPE_BADGE[inv.type]} className="text-xs">
                        {inv.type === 'RECURRING' && <RefreshCw className="mr-1 h-3 w-3" />}
                        {TYPE_LABEL[inv.type]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(inv.investedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {inv.notes && <> · {inv.notes}</>}
                    </p>
                  </div>
                  <span className="shrink-0 text-base font-bold text-foreground">
                    {fmt(inv.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
