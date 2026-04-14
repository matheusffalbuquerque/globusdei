'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  TrendingUp,
  ArrowLeft,
  AlertCircle,
  Loader2,
  RefreshCw,
  Users,
  Building2,
  Banknote,
  HandCoins,
  Wallet,
} from 'lucide-react';

import { useAgentPortal } from '../../../../components/portal/AgentPortalShell';
import { apiFetch } from '../../../../lib/api';
import { type AppSession } from '../../../../lib/auth';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Separator } from '../../../../components/ui/separator';

// ─── Types ────────────────────────────────────────────────────────────────────

type Summary = {
  totalReceived: number;
  totalTransactions: number;
  uniqueInvestors: number;
  monthlyRecurring: number;
};

type ReceivedItem = {
  id: string;
  investorId: string;
  amount: number;
  type: 'ONE_TIME' | 'RECURRING';
  notes: string | null;
  investedAt: string;
  investor: { id: string; name: string; email: string };
};

type ReceivedData = {
  summary: Summary;
  items: ReceivedItem[];
};

type EmpreendimentoSummary = {
  id: string;
  name: string;
  type: string;
};

type EmpreendimentoReceivedEntry = {
  empreendimento: EmpreendimentoSummary;
  summary: Summary;
  items: ReceivedItem[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const TYPE_LABEL: Record<string, string> = { ONE_TIME: 'Único', RECURRING: 'Recorrente' };
const TYPE_BADGE: Record<string, 'secondary' | 'success'> = { ONE_TIME: 'secondary', RECURRING: 'success' };

// ─── Sub-component: Received Card ────────────────────────────────────────────

function ReceivedCard({
  title,
  summary,
  items,
  icon,
}: {
  title: string;
  summary: Summary;
  items: ReceivedItem[];
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Total recebido</p>
            <p className="mt-0.5 text-lg font-bold text-foreground">{fmt(summary.totalReceived)}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Recorrente/mês</p>
            <p className="mt-0.5 text-lg font-bold text-emerald-600">{fmt(summary.monthlyRecurring)}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Investidores únicos</p>
            <p className="mt-0.5 text-lg font-bold text-foreground">{summary.uniqueInvestors}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Transações</p>
            <p className="mt-0.5 text-lg font-bold text-foreground">{summary.totalTransactions}</p>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <HandCoins className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum aporte recebido ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{inv.investor.name}</span>
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
                <span className="shrink-0 text-base font-bold text-foreground">{fmt(inv.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReceivedInvestmentsPage() {
  const { data: session, status } = useSession();
  useAgentPortal();
  const typedSession = session as AppSession | null;

  const [personalData, setPersonalData] = useState<ReceivedData | null>(null);
  const [empreendimentoEntries, setEmpreendimentoEntries] = useState<EmpreendimentoReceivedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!typedSession) return;
    setIsLoading(true);
    setError(null);
    try {
      const [personal, empreendimentoList] = await Promise.all([
        apiFetch('/investments/received/me', { session: typedSession }),
        apiFetch('/investments/received/my-empreendimentos', { session: typedSession }),
      ]);
      setPersonalData(personal as ReceivedData);
      setEmpreendimentoEntries(empreendimentoList as EmpreendimentoReceivedEntry[]);
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
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando investimentos recebidos…
        </div>
      </div>
    );
  }

  const totalGeralRecebido =
    (personalData?.summary.totalReceived ?? 0) +
    empreendimentoEntries.reduce((s, e) => s + e.summary.totalReceived, 0);

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Minha carteira
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Investimentos Recebidos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aportes recebidos no seu perfil e nos seus empreendimentos.
          </p>
        </div>
        <Link href="/agent/investments">
          <Button variant="ghost" size="sm" className="shrink-0 gap-2">
            <ArrowLeft className="h-4 w-4" /> Minha carteira
          </Button>
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ── Total geral ── */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-5 py-4">
        <Banknote className="h-5 w-5 text-primary" />
        <div>
          <p className="text-xs font-medium text-muted-foreground">Total recebido (todos os canais)</p>
          <p className="text-xl font-bold text-foreground">{fmt(totalGeralRecebido)}</p>
        </div>
      </div>

      {/* ── Recebidos no perfil pessoal ── */}
      {personalData && (
        <ReceivedCard
          title="Aportes no meu perfil"
          summary={personalData.summary}
          items={personalData.items}
          icon={<Users className="h-4 w-4 text-primary" />}
        />
      )}

      {/* ── Recebidos por empreendimento ── */}
      {empreendimentoEntries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Aportes nos meus empreendimentos</h2>
          {empreendimentoEntries.map((entry) => (
            <ReceivedCard
              key={entry.empreendimento.id}
              title={entry.empreendimento.name}
              summary={entry.summary}
              items={entry.items}
              icon={<Building2 className="h-4 w-4 text-emerald-500" />}
            />
          ))}
        </div>
      )}

      {empreendimentoEntries.length === 0 && personalData?.items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <HandCoins className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              Nenhum investimento recebido ainda.
            </p>
            <p className="text-xs text-muted-foreground">
              Quando alguém investir em você ou nos seus empreendimentos, aparecerá aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
