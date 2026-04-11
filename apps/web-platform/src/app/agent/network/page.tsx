'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';

import { apiFetch } from '../../../lib/api';
import { type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

type AgentCard = {
  id: string;
  name: string;
  email: string;
  city: string | null;
  country: string | null;
  vocationType: string;
  publicBio: string | null;
  status: string;
  connection: {
    id: string;
    status: ConnectionStatus;
    isSender: boolean;
  } | null;
};

type EmpreendimentoCard = {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  location: string | null;
  logoUrl: string | null;
  isFollowing: boolean;
  _count: { followers: number };
};

type Section = 'agents' | 'empreendimentos';
type AgentFilter = 'all' | 'connected' | 'pending';
type EmpFilter = 'all' | 'following';

const PAGE_SIZE = 12;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatType(type: string) {
  const map: Record<string, string> = {
    CHURCH: 'Igreja', AGENCY: 'Agência', SCHOOL: 'Escola',
    PROJECT: 'Projeto', VENTURE: 'Empreendimento', ONG: 'ONG',
  };
  return map[type] ?? type;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NetworkPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [section, setSection] = useState<Section>('agents');
  const [agentFilter, setAgentFilter] = useState<AgentFilter>('all');
  const [empFilter, setEmpFilter] = useState<EmpFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [empreendimentos, setEmpreendimentos] = useState<EmpreendimentoCard[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const s = session as AppSession;

  const loadAgents = useCallback(async () => {
    if (!session) return;
    try {
      const data = await apiFetch('/connections/agents', { session: s });
      setAgents(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [session, s]);

  const loadEmpreendimentos = useCallback(async () => {
    if (!session) return;
    try {
      const data = await apiFetch('/platform/empreendimentos', { session: s });
      setEmpreendimentos(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [session, s]);

  useEffect(() => {
    if (session) {
      void loadAgents();
      void loadEmpreendimentos();
    }
  }, [session, loadAgents, loadEmpreendimentos]);

  // ── Agent actions ────────────────────────────────────────────────────────

  const handleConnect = async (agentId: string) => {
    setLoadingAction(agentId);
    try {
      await apiFetch('/connections/requests', {
        method: 'POST', session: s,
        body: JSON.stringify({ receiverId: agentId }),
      });
      await loadAgents();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAccept = async (connectionId: string) => {
    setLoadingAction(connectionId);
    try {
      await apiFetch(`/connections/${connectionId}/accept`, { method: 'POST', session: s });
      await loadAgents();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (connectionId: string) => {
    setLoadingAction(connectionId);
    try {
      await apiFetch(`/connections/${connectionId}/reject`, { method: 'POST', session: s });
      await loadAgents();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemove = async (connectionId: string) => {
    setLoadingAction(connectionId);
    try {
      await apiFetch(`/connections/${connectionId}`, { method: 'DELETE', session: s });
      await loadAgents();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingAction(null);
    }
  };

  // ── Empreendimento actions ───────────────────────────────────────────────

  const handleFollow = async (empId: string, isFollowing: boolean) => {
    setLoadingAction(empId);
    try {
      if (isFollowing) {
        await apiFetch(`/platform/unfollow/${empId}`, { method: 'POST', session: s });
      } else {
        await apiFetch(`/platform/follow/${empId}`, { method: 'POST', session: s });
      }
      await loadEmpreendimentos();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingAction(null);
    }
  };

  // ── Filter + search ──────────────────────────────────────────────────────

  const filteredAgents = agents.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      (a.city ?? '').toLowerCase().includes(q) ||
      (a.country ?? '').toLowerCase().includes(q);

    const matchFilter =
      agentFilter === 'all' ||
      (agentFilter === 'connected' && a.connection?.status === 'ACCEPTED') ||
      (agentFilter === 'pending' &&
        a.connection?.status === 'PENDING' &&
        !a.connection.isSender);

    return matchSearch && matchFilter;
  });

  const filteredEmps = empreendimentos.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      (e.location ?? '').toLowerCase().includes(q);
    const matchFilter = empFilter === 'all' || (empFilter === 'following' && e.isFollowing);
    return matchSearch && matchFilter;
  });

  const currentList = section === 'agents' ? filteredAgents : filteredEmps;
  const totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE));
  const paginatedAgents = filteredAgents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) as AgentCard[];
  const paginatedEmps = filteredEmps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) as EmpreendimentoCard[];

  const connectedCount = agents.filter((a) => a.connection?.status === 'ACCEPTED').length;
  const pendingCount = agents.filter(
    (a) => a.connection?.status === 'PENDING' && !a.connection.isSender,
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Rede de missões
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Rede Global</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Conecte-se com outros agentes e acompanhe empreendimentos da rede Globus Dei.
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
          <button className="ml-3 underline" onClick={() => setError(null)}>fechar</button>
        </div>
      )}

      {/* Tabs principais */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1 w-fit">
        <button
          onClick={() => { setSection('agents'); setPage(1); setSearch(''); }}
          className={cn(
            'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors',
            section === 'agents'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Users className="h-4 w-4" />
          Agentes
          {connectedCount > 0 && (
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{connectedCount}</Badge>
          )}
        </button>
        <button
          onClick={() => { setSection('empreendimentos'); setPage(1); setSearch(''); }}
          className={cn(
            'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors',
            section === 'empreendimentos'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Building2 className="h-4 w-4" />
          Empreendimentos
        </button>
      </div>

      {/* Filtros + busca */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
          {section === 'agents' ? (
            <>
              {([
                { value: 'all', label: 'Todos' },
                { value: 'connected', label: 'Minha rede' },
                { value: 'pending', label: pendingCount > 0 ? `Pendentes (${pendingCount})` : 'Pendentes' },
              ] as { value: AgentFilter; label: string }[]).map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setAgentFilter(f.value); setPage(1); }}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    agentFilter === f.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </>
          ) : (
            <>
              {([
                { value: 'all', label: 'Todos' },
                { value: 'following', label: 'Seguindo' },
              ] as { value: EmpFilter; label: string }[]).map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setEmpFilter(f.value); setPage(1); }}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    empFilter === f.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Busca */}
        <div className="flex h-9 w-64 items-center gap-2 rounded-md border border-border bg-background px-3 shadow-sm focus-within:ring-1 focus-within:ring-ring">
          <svg className="h-4 w-4 shrink-0 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder={section === 'agents' ? 'Nome ou cidade…' : 'Nome ou local…'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Grid de cards */}
      {section === 'agents' && (
        <>
          {paginatedAgents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum agente encontrado.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedAgents.map((agent) => (
                <AgentCardItem
                  key={agent.id}
                  agent={agent}
                  loading={loadingAction === agent.id || loadingAction === agent.connection?.id}
                  onConnect={() => handleConnect(agent.id)}
                  onAccept={() => agent.connection && handleAccept(agent.connection.id)}
                  onReject={() => agent.connection && handleReject(agent.connection.id)}
                  onRemove={() => agent.connection && handleRemove(agent.connection.id)}
                  onView={() => router.push(`/agent/network/agent/${agent.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {section === 'empreendimentos' && (
        <>
          {paginatedEmps.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum empreendimento encontrado.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedEmps.map((emp) => (
                <EmpreendimentoCardItem
                  key={emp.id}
                  emp={emp}
                  loading={loadingAction === emp.id}
                  onToggleFollow={() => handleFollow(emp.id, emp.isFollowing)}
                  onView={() => router.push(`/agent/network/empreendimento/${emp.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            {currentList.length} {section === 'agents' ? 'agentes' : 'empreendimentos'} • página {page} de {totalPages}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────

function AgentCardItem({
  agent, loading, onConnect, onAccept, onReject, onRemove, onView,
}: {
  agent: AgentCard;
  loading: boolean;
  onConnect: () => void;
  onAccept: () => void;
  onReject: () => void;
  onRemove: () => void;
  onView: () => void;
}) {
  const conn = agent.connection;
  const isAccepted = conn?.status === 'ACCEPTED';
  const isPendingReceived = conn?.status === 'PENDING' && !conn.isSender;
  const isPendingSent = conn?.status === 'PENDING' && conn.isSender;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-shadow hover:shadow-md">
      {/* Banner / avatar area */}
      <div
        className="relative flex h-24 cursor-pointer items-end justify-center bg-gradient-to-br from-primary/10 to-primary/5"
        onClick={onView}
      >
        <div className="absolute -bottom-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-background bg-primary/15 text-lg font-bold text-primary shadow">
          {initials(agent.name)}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col items-center px-3 pb-4 pt-8 text-center">
        <button
          className="text-sm font-semibold text-foreground hover:underline leading-tight"
          onClick={onView}
        >
          {agent.name}
        </button>
        {agent.vocationType && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{agent.vocationType}</p>
        )}
        {(agent.city || agent.country) && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {[agent.city, agent.country].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Status badge */}
        <div className="mt-2">
          {isAccepted && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <UserCheck className="h-3 w-3" /> Conectado
            </span>
          )}
          {isPendingSent && (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
              <Clock className="h-3 w-3" /> Solicitação enviada
            </span>
          )}
          {isPendingReceived && (
            <span className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
              <Clock className="h-3 w-3" /> Solicitação recebida
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex w-full flex-col gap-1.5">
          {!conn && (
            <Button size="sm" className="h-8 w-full gap-1.5 text-xs" disabled={loading} onClick={onConnect}>
              <UserPlus className="h-3.5 w-3.5" /> Conectar
            </Button>
          )}
          {isPendingReceived && (
            <div className="flex gap-1.5">
              <Button size="sm" className="h-8 flex-1 gap-1 text-xs" disabled={loading} onClick={onAccept}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Aceitar
              </Button>
              <Button size="sm" variant="outline" className="h-8 flex-1 gap-1 text-xs" disabled={loading} onClick={onReject}>
                <X className="h-3.5 w-3.5" /> Recusar
              </Button>
            </div>
          )}
          {(isAccepted || isPendingSent) && (
            <Button size="sm" variant="outline" className="h-8 w-full text-xs text-muted-foreground" disabled={loading} onClick={onRemove}>
              {isAccepted ? 'Desconectar' : 'Cancelar solicitação'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empreendimento Card ──────────────────────────────────────────────────────

function EmpreendimentoCardItem({
  emp, loading, onToggleFollow, onView,
}: {
  emp: EmpreendimentoCard;
  loading: boolean;
  onToggleFollow: () => void;
  onView: () => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-shadow hover:shadow-md">
      {/* Banner */}
      <div
        className="flex h-24 cursor-pointer items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50"
        onClick={onView}
      >
        {emp.logoUrl ? (
          <img src={emp.logoUrl} alt={emp.name} className="h-16 w-16 rounded-lg object-contain" />
        ) : (
          <Building2 className="h-10 w-10 text-muted-foreground/40" />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col items-center px-3 pb-4 pt-3 text-center">
        <button className="text-sm font-semibold text-foreground hover:underline leading-tight" onClick={onView}>
          {emp.name}
        </button>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{formatType(emp.type)}</p>
        {emp.location && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{emp.location}</p>
        )}
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {emp.description}
        </p>

        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Users className="h-3 w-3" />
          {emp._count.followers} {emp._count.followers === 1 ? 'seguidor' : 'seguidores'}
        </div>

        <Button
          size="sm"
          variant={emp.isFollowing ? 'outline' : 'default'}
          className="mt-3 h-8 w-full text-xs gap-1.5"
          disabled={loading}
          onClick={onToggleFollow}
        >
          {emp.isFollowing ? (
            <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Seguindo</>
          ) : (
            'Seguir'
          )}
        </Button>
      </div>
    </div>
  );
}
