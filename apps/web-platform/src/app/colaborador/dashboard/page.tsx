'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Users,
  Building2,
  Inbox,
  Megaphone,
  Clock,
  CheckCircle2,
  CalendarDays,
  Video,
  Trash2,
  ChevronRight,
  AlertCircle,
  Globe,
  TrendingUp,
} from 'lucide-react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import { formatAgentStatus, formatCollaboratorRole, type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Separator } from '../../../components/ui/separator';

// ─── Types ───────────────────────────────────────────────────────────────────

type PendingAgent = {
  id: string;
  name: string;
  email: string;
  status: string;
  updatedAt: string;
  answers: { question: { title: string }; text: string }[];
};

type AvailabilitySlot = {
  id: string;
  startTime: string;
  endTime: string;
  meetLink?: string | null;
  agent?: { name: string };
};

type DashboardSummary = {
  pendingAgents: number;
  managedEmpreendimentos: number;
  openRequests: number;
  totalAnnouncements: number;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  description?: string;
  accent?: 'amber' | 'blue' | 'emerald' | 'primary';
}) {
  const accentMap = {
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    primary: 'bg-primary/10 text-primary',
  };

  const iconBg = accentMap[accent ?? 'primary'];

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium uppercase tracking-wide">
            {label}
          </CardDescription>
          <div className={`rounded-lg p-2 ${iconBg}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function AgentStatusBadge({ status }: { status: string }) {
  const map: Record<string, 'warning' | 'info' | 'success' | 'secondary'> = {
    SUBMITTED: 'warning',
    QUALIFIED: 'info',
    SCHEDULED: 'info',
    APPROVED: 'success',
  };
  return (
    <Badge variant={map[status] ?? 'secondary'}>
      {formatAgentStatus(status)}
    </Badge>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
      <Globe className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CollaboratorDashboard() {
  const { data: session } = useSession();
  const { collaborator, permissions } = useCollaboratorPortal();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [agents, setAgents] = useState<PendingAgent[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<PendingAgent | null>(null);
  const [newSlot, setNewSlot] = useState({ startTime: '', endTime: '', meetLink: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    try {
      const data = await apiFetch('/collaborators/me/dashboard', {
        session: session as AppSession,
      });
      setSummary(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const loadOnboardingQueue = async () => {
    if (!permissions.canManageOnboarding) return;
    try {
      const [agentData, slotData] = await Promise.all([
        apiFetch('/onboarding/pending-analysis', { session: session as AppSession }),
        apiFetch('/onboarding/collaborator/slots', { session: session as AppSession }),
      ]);
      setAgents(agentData);
      setSlots(slotData);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    if (!session) return;
    setIsLoading(true);
    Promise.all([loadSummary(), loadOnboardingQueue()]).finally(() => setIsLoading(false));
  }, [permissions.canManageOnboarding, session]);

  const approveForInterview = async () => {
    if (!selectedAgent) return;
    setIsApproving(true);
    try {
      await apiFetch(`/onboarding/${selectedAgent.id}/approve`, {
        method: 'POST',
        session: session as AppSession,
      });
      setSelectedAgent(null);
      await Promise.all([loadSummary(), loadOnboardingQueue()]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsApproving(false);
    }
  };

  const createSlot = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiFetch('/onboarding/collaborator/slots', {
        method: 'POST',
        session: session as AppSession,
        body: JSON.stringify(newSlot),
      });
      setNewSlot({ startTime: '', endTime: '', meetLink: '' });
      await loadOnboardingQueue();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const deleteSlot = async (slotId: string) => {
    try {
      await apiFetch(`/onboarding/collaborator/slots/${slotId}`, {
        method: 'DELETE',
        session: session as AppSession,
      });
      await loadOnboardingQueue();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const firstName = collaborator?.name?.split(' ')[0] ?? 'Colaborador';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-6">
      {/* ── Header greeting ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{greeting} 👋</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
            {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aqui está o resumo operacional de hoje —{' '}
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(collaborator?.roles ?? []).map((role) => (
            <Badge key={role} variant="secondary" className="gap-1.5 text-xs">
              <TrendingUp className="h-3 w-3" />
              {formatCollaboratorRole(role)}
            </Badge>
          ))}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Indicadores
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-3 w-24 rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Users}
              label="Agentes pendentes"
              value={summary?.pendingAgents ?? 0}
              description="Aguardando triagem"
              accent="amber"
            />
            <StatCard
              icon={Building2}
              label="Empreendimentos"
              value={summary?.managedEmpreendimentos ?? 0}
              description="Sob gestão ativa"
              accent="primary"
            />
            <StatCard
              icon={Inbox}
              label="Solicitações abertas"
              value={summary?.openRequests ?? 0}
              description="Em aberto ou em progresso"
              accent="blue"
            />
            <StatCard
              icon={Megaphone}
              label="Anúncios ativos"
              value={summary?.totalAnnouncements ?? 0}
              description="Publicados na plataforma"
              accent="emerald"
            />
          </div>
        )}
      </section>

      <Separator />

      {/* ── Onboarding section (conditional) ── */}
      {permissions.canManageOnboarding ? (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          {/* Queue */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Fila de onboarding
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Agentes aguardando análise e aprovação para entrevista
                  </CardDescription>
                </div>
                <Badge variant={agents.length > 0 ? 'warning' : 'secondary'}>
                  {agents.length} em análise
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {agents.length > 0 ? (
                agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 transition-colors hover:bg-muted/70"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{agent.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{agent.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <AgentStatusBadge status={agent.status} />
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => setSelectedAgent(agent)}
                      >
                        Revisar
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState message="Nenhum agente aguardando triagem no momento." />
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Agenda de entrevistas
              </CardTitle>
              <CardDescription>Gerencie sua disponibilidade para entrevistas</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={createSlot} className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Novo horário
                </p>
                <div className="grid gap-2">
                  <Input
                    type="datetime-local"
                    required
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot((s) => ({ ...s, startTime: e.target.value }))}
                  />
                  <Input
                    type="datetime-local"
                    required
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot((s) => ({ ...s, endTime: e.target.value }))}
                  />
                  <Input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={newSlot.meetLink}
                    onChange={(e) => setNewSlot((s) => ({ ...s, meetLink: e.target.value }))}
                  />
                </div>
                <Button type="submit" size="sm" className="w-full gap-2">
                  <Video className="h-3.5 w-3.5" />
                  Publicar horário
                </Button>
              </form>

              <div className="space-y-2">
                {slots.length > 0 ? (
                  slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <p className="text-xs font-semibold text-foreground">
                            {new Date(slot.startTime).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {slot.agent?.name ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              Reservado por {slot.agent.name}
                            </span>
                          ) : (
                            'Disponível'
                          )}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-600"
                        onClick={() => void deleteSlot(slot.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <EmptyState message="Nenhum horário publicado ainda." />
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              Painel resumido
            </CardTitle>
            <CardDescription>
              Você não possui permissão de triagem de onboarding. Os módulos disponíveis no menu
              lateral refletem seus papéis atuais na plataforma.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* ── Agent review dialog ── */}
      <Dialog open={!!selectedAgent} onOpenChange={(open) => !open && setSelectedAgent(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAgent?.name}</DialogTitle>
            <DialogDescription>{selectedAgent?.email}</DialogDescription>
          </DialogHeader>

          <Separator />

          <div className="space-y-3">
            {selectedAgent?.answers.map((answer, i) => (
              <div
                key={`${answer.question.title}-${i}`}
                className="rounded-lg border border-border bg-muted/40 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {answer.question.title}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {answer.text}
                </p>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAgent(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void approveForInterview()}
              disabled={isApproving}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isApproving ? 'Aprovando…' : 'Aprovar para entrevista'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
