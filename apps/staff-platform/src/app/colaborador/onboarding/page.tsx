'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  CalendarDays,
  Link2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import { type AppSession } from '../../../lib/auth';
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
import { cn } from '../../../lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type Question = {
  id: string;
  title: string;
  isRequired: boolean;
  createdAt: string;
};

type AgentAnswer = {
  questionId: string;
  text: string;
  question: { id: string; title: string };
};

type AvailabilitySlot = {
  id: string;
  startTime: string;
  endTime: string;
  meetLink?: string | null;
  agent?: { id: string; name: string } | null;
};

type PendingAgent = {
  id: string;
  name: string;
  email: string;
  status: string;
  feedback?: string | null;
  interviewDate?: string | null;
  interviewLink?: string | null;
  answers: AgentAnswer[];
  scheduledSlot?: AvailabilitySlot | null;
  updatedAt: string;
};

type Tab = 'questions' | 'submissions' | 'slots';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  ENTERED: 'Cadastro iniciado',
  SUBMITTED: 'Aguardando análise',
  QUALIFIED: 'Qualificado — aguarda entrevista',
  SCHEDULED: 'Entrevista agendada',
  APPROVED: 'Aprovado',
  REJECTED: 'Necessita ajustes',
};

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'info'> = {
  ENTERED: 'secondary',
  SUBMITTED: 'warning',
  QUALIFIED: 'info',
  SCHEDULED: 'info',
  APPROVED: 'success',
  REJECTED: 'destructive',
};

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'questions', label: 'Questões', icon: ClipboardList },
  { id: 'submissions', label: 'Envios', icon: User },
  { id: 'slots', label: 'Disponibilidade', icon: CalendarDays },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CollaboratorOnboardingPage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();
  const s = session as AppSession;

  const [activeTab, setActiveTab] = useState<Tab>('questions');

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qLoading, setQLoading] = useState(true);
  const [qForm, setQForm] = useState({ title: '', isRequired: true });
  const [editingQ, setEditingQ] = useState<Question | null>(null);
  const [editQForm, setEditQForm] = useState({ title: '', isRequired: true });
  const [qSaving, setQSaving] = useState(false);

  // Submissions
  const [agents, setAgents] = useState<PendingAgent[]>([]);
  const [aLoading, setALoading] = useState(true);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [feedbackAgent, setFeedbackAgent] = useState<PendingAgent | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({ feedbackText: '', approve: true });
  const [fbSaving, setFbSaving] = useState(false);

  // Slots
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [sLoading, setSLoading] = useState(true);
  const [slotForm, setSlotForm] = useState({ startTime: '', endTime: '', meetLink: '' });
  const [sSaving, setSSaving] = useState(false);

  // Shared
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  // ── Loaders ───────────────────────────────────────────────────────────────

  const loadQuestions = useCallback(async () => {
    setQLoading(true);
    try {
      const data = await apiFetch('/onboarding/questions', { session: s });
      setQuestions(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setQLoading(false);
    }
  }, [s]);

  const loadAgents = useCallback(async () => {
    if (!permissions.canManageOnboarding) return;
    setALoading(true);
    try {
      const data = await apiFetch('/onboarding/pending-analysis', { session: s });
      setAgents(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setALoading(false);
    }
  }, [s, permissions.canManageOnboarding]);

  const loadSlots = useCallback(async () => {
    if (!permissions.canManageOnboarding) return;
    setSLoading(true);
    try {
      const data = await apiFetch('/onboarding/collaborator/slots', { session: s });
      setSlots(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSLoading(false);
    }
  }, [s, permissions.canManageOnboarding]);

  useEffect(() => {
    if (!s) return;
    void loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    if (!s || !permissions.canManageOnboarding) return;
    void loadAgents();
    void loadSlots();
  }, [loadAgents, loadSlots, permissions.canManageOnboarding]);

  // ── Question actions ──────────────────────────────────────────────────────

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setQSaving(true);
    try {
      await apiFetch('/onboarding/questions', {
        session: s,
        method: 'POST',
        body: JSON.stringify(qForm),
      });
      setQForm({ title: '', isRequired: true });
      showSuccess('Questão criada!');
      await loadQuestions();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setQSaving(false);
    }
  };

  const openEditQ = (q: Question) => {
    setEditingQ(q);
    setEditQForm({ title: q.title, isRequired: q.isRequired });
  };

  const submitEditQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQ) return;
    setQSaving(true);
    try {
      await apiFetch(`/onboarding/questions/${editingQ.id}`, {
        session: s,
        method: 'PATCH',
        body: JSON.stringify(editQForm),
      });
      setEditingQ(null);
      showSuccess('Questão atualizada!');
      await loadQuestions();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setQSaving(false);
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Excluir esta questão permanentemente?')) return;
    try {
      await apiFetch(`/onboarding/questions/${id}`, { session: s, method: 'DELETE' });
      showSuccess('Questão excluída.');
      await loadQuestions();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // ── Feedback / approval ───────────────────────────────────────────────────

  const approveQuestionnaire = async (agentId: string) => {
    if (!confirm('Aprovar o questionário deste agente e qualificá-lo para entrevista?')) return;
    try {
      await apiFetch(`/onboarding/${agentId}/approve`, { session: s, method: 'POST' });
      showSuccess('Agente qualificado para entrevista!');
      await loadAgents();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const openFeedback = (agent: PendingAgent, approve: boolean) => {
    setFeedbackAgent(agent);
    setFeedbackForm({ feedbackText: '', approve });
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackAgent) return;
    setFbSaving(true);
    try {
      await apiFetch(`/onboarding/${feedbackAgent.id}/feedback`, {
        session: s,
        method: 'PUT',
        body: JSON.stringify(feedbackForm),
      });
      setFeedbackAgent(null);
      showSuccess(feedbackForm.approve ? 'Agente aprovado!' : 'Feedback enviado.');
      await loadAgents();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFbSaving(false);
    }
  };

  // ── Slot actions ──────────────────────────────────────────────────────────

  const submitSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSSaving(true);
    try {
      await apiFetch('/onboarding/collaborator/slots', {
        session: s,
        method: 'POST',
        body: JSON.stringify({
          startTime: slotForm.startTime,
          endTime: slotForm.endTime,
          meetLink: slotForm.meetLink || undefined,
        }),
      });
      setSlotForm({ startTime: '', endTime: '', meetLink: '' });
      showSuccess('Slot de disponibilidade criado!');
      await loadSlots();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSSaving(false);
    }
  };

  const deleteSlot = async (id: string) => {
    if (!confirm('Excluir este horário?')) return;
    try {
      await apiFetch(`/onboarding/collaborator/slots/${id}`, { session: s, method: 'DELETE' });
      showSuccess('Slot excluído.');
      await loadSlots();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Gestão de pessoas
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
            Onboarding de Agentes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie as questões do questionário, acompanhe os envios e cadastre horários de entrevista.
          </p>
        </div>
        <Badge variant={permissions.canManageOnboarding ? 'success' : 'secondary'} className="self-start gap-1.5">
          {permissions.canManageOnboarding ? (
            <><CheckCircle2 className="h-3 w-3" /> Gestor de onboarding</>
          ) : (
            'Apenas visualização'
          )}
        </Badge>
      </div>

      {/* Feedbacks */}
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

      {/* Tab bar */}
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

      {/* ══════════════════════════════════════════════════════
          TAB: Questões
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_400px]">
          {/* Lista de questões */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Questões do questionário
                </CardTitle>
                <Badge variant="secondary">{questions.length} questão(ões)</Badge>
              </div>
              <CardDescription>
                Estas perguntas serão exibidas para todos os novos agentes no fluxo de onboarding.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {qLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
                  <ClipboardList className="h-7 w-7 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma questão cadastrada ainda.
                  </p>
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/60"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{q.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          {q.isRequired ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-red-500">
                              <ToggleRight className="h-3 w-3" /> Obrigatória
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              <ToggleLeft className="h-3 w-3" /> Opcional
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            · adicionada em {formatDate(q.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {permissions.canManageOnboarding && (
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-blue-600"
                          onClick={() => openEditQ(q)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-red-600"
                          onClick={() => void deleteQuestion(q.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Formulário nova questão */}
          {permissions.canManageOnboarding && (
            <Card className="self-start">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Plus className="h-4 w-4 text-primary" />
                  Nova questão
                </CardTitle>
                <CardDescription>
                  Adicione uma pergunta ao questionário de onboarding.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5">
                <form onSubmit={submitQuestion} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Texto da questão
                    </label>
                    <Input
                      required
                      placeholder="Ex: Qual é a sua motivação para ser agente Globus Dei?"
                      value={qForm.title}
                      onChange={(e) => setQForm({ ...qForm, title: e.target.value })}
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={qForm.isRequired}
                      onChange={(e) => setQForm({ ...qForm, isRequired: e.target.checked })}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">Resposta obrigatória</p>
                      <p className="text-xs text-muted-foreground">
                        O agente não poderá enviar sem responder esta questão.
                      </p>
                    </div>
                  </label>
                  <Button type="submit" disabled={qSaving} className="w-full gap-2">
                    {qSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {qSaving ? 'Salvando…' : 'Adicionar questão'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: Envios / Análise
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-primary" />
                  Agentes em processo de onboarding
                </CardTitle>
                <Badge variant="secondary">{agents.length} agente(s)</Badge>
              </div>
              <CardDescription>
                Agentes com submissão pendente, qualificados ou agendados para entrevista.
              </CardDescription>
            </CardHeader>
          </Card>

          {aLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <User className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Nenhum agente aguardando análise no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            agents.map((agent) => {
              const isExpanded = expandedAgent === agent.id;
              return (
                <Card key={agent.id} className="overflow-hidden">
                  {/* Agent header */}
                  <div
                    className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{agent.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{agent.email}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge variant={STATUS_VARIANT[agent.status] ?? 'secondary'}>
                        {STATUS_LABELS[agent.status] ?? agent.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(agent.updatedAt)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <>
                      <Separator />
                      <CardContent className="space-y-5 pt-5">
                        {/* Interview info */}
                        {agent.interviewDate && (
                          <div className="flex flex-wrap gap-4 rounded-lg bg-muted/40 px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-primary" />
                              <span className="font-medium">Entrevista:</span>
                              <span className="text-muted-foreground">
                                {formatDateTime(agent.interviewDate)}
                              </span>
                            </div>
                            {agent.interviewLink && (
                              <div className="flex items-center gap-2">
                                <Link2 className="h-4 w-4 text-primary" />
                                <a
                                  href={agent.interviewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline-offset-2 hover:underline"
                                >
                                  Link da entrevista
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Feedback */}
                        {agent.feedback && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
                              Feedback registrado
                            </p>
                            <p className="whitespace-pre-wrap text-sm text-amber-900">
                              {agent.feedback}
                            </p>
                          </div>
                        )}

                        {/* Answers */}
                        {agent.answers.length > 0 && (
                          <div className="space-y-3">
                            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              <MessageSquare className="h-3.5 w-3.5" />
                              Respostas do questionário
                            </p>
                            {agent.answers.map((ans) => (
                              <div key={ans.questionId} className="rounded-lg border border-border bg-background px-4 py-3">
                                <p className="mb-1.5 text-xs font-semibold text-foreground">
                                  {ans.question.title}
                                </p>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                                  {ans.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        {permissions.canManageOnboarding && (
                          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                            {agent.status === 'SUBMITTED' && (
                              <Button
                                size="sm"
                                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => void approveQuestionnaire(agent.id)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Qualificar para entrevista
                              </Button>
                            )}
                            {agent.status === 'SCHEDULED' && (
                              <>
                                <Button
                                  size="sm"
                                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => openFeedback(agent, true)}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Aprovar agente
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={() => openFeedback(agent, false)}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  Rejeitar / Feedback
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: Disponibilidade (Slots)
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'slots' && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
          {/* Lista de slots */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Meus horários de entrevista
                </CardTitle>
                <Badge variant="secondary">{slots.length} slot(s)</Badge>
              </div>
              <CardDescription>
                Horários disponíveis que os agentes qualificados podem agendar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {sLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
                  <CalendarDays className="h-7 w-7 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum horário cadastrado. Adicione sua disponibilidade.
                  </p>
                </div>
              ) : (
                slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-lg border px-4 py-3',
                      slot.agent
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-border bg-muted/30',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {formatDateTime(slot.startTime)} → {new Date(slot.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {slot.meetLink && (
                          <a
                            href={slot.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <Link2 className="h-3 w-3" /> Meet
                          </a>
                        )}
                        {slot.agent ? (
                          <span className="flex items-center gap-1 font-semibold text-emerald-700">
                            <User className="h-3 w-3" />
                            Agendado por: {slot.agent.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Disponível</span>
                        )}
                      </div>
                    </div>
                    {!slot.agent && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-600"
                        onClick={() => void deleteSlot(slot.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Novo slot */}
          {permissions.canManageOnboarding && (
            <Card className="self-start">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Plus className="h-4 w-4 text-primary" />
                  Adicionar disponibilidade
                </CardTitle>
                <CardDescription>
                  Cadastre um horário para que agentes possam agendar entrevista.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5">
                <form onSubmit={submitSlot} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Início
                    </label>
                    <Input
                      required
                      type="datetime-local"
                      value={slotForm.startTime}
                      onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Fim
                    </label>
                    <Input
                      required
                      type="datetime-local"
                      value={slotForm.endTime}
                      onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Link da reunião (opcional)
                    </label>
                    <Input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={slotForm.meetLink}
                      onChange={(e) => setSlotForm({ ...slotForm, meetLink: e.target.value })}
                    />
                  </div>
                  <Button type="submit" disabled={sSaving} className="w-full gap-2">
                    {sSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {sSaving ? 'Salvando…' : 'Cadastrar horário'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          DIALOG: Editar questão
      ══════════════════════════════════════════════════════ */}
      <Dialog open={!!editingQ} onOpenChange={(open) => !open && setEditingQ(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar questão</DialogTitle>
            <DialogDescription>
              Atualize o texto ou a obrigatoriedade desta questão.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEditQ} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Texto da questão
              </label>
              <Input
                required
                value={editQForm.title}
                onChange={(e) => setEditQForm({ ...editQForm, title: e.target.value })}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={editQForm.isRequired}
                onChange={(e) => setEditQForm({ ...editQForm, isRequired: e.target.checked })}
              />
              <div>
                <p className="text-sm font-medium text-foreground">Resposta obrigatória</p>
                <p className="text-xs text-muted-foreground">
                  O agente não poderá enviar sem responder esta questão.
                </p>
              </div>
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingQ(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={qSaving} className="gap-2">
                {qSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {qSaving ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════
          DIALOG: Feedback / Aprovação pós-entrevista
      ══════════════════════════════════════════════════════ */}
      <Dialog open={!!feedbackAgent} onOpenChange={(open) => !open && setFeedbackAgent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {feedbackForm.approve ? 'Aprovar agente' : 'Rejeitar / enviar feedback'}
            </DialogTitle>
            <DialogDescription>
              {feedbackAgent && (
                <>
                  Registrar decisão para <strong>{feedbackAgent.name}</strong>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitFeedback} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mensagem de feedback
              </label>
              <textarea
                required
                rows={4}
                className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={
                  feedbackForm.approve
                    ? 'Parabéns! Descreva o que foi positivo na entrevista...'
                    : 'Descreva os pontos a melhorar e o motivo da rejeição...'
                }
                value={feedbackForm.feedbackText}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, feedbackText: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFeedbackAgent(null)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={fbSaving}
                className={cn(
                  'gap-2',
                  feedbackForm.approve
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700',
                )}
              >
                {fbSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : feedbackForm.approve ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {fbSaving
                  ? 'Salvando…'
                  : feedbackForm.approve
                    ? 'Confirmar aprovação'
                    : 'Registrar rejeição'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
