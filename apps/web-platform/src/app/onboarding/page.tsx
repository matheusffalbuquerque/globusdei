'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  CheckCircle2,
  Clock,
  ClipboardList,
  CalendarDays,
  Link2,
  MessageSquare,
  AlertCircle,
  Loader2,
  Send,
  Globe,
  ThumbsUp,
  RefreshCcw,
} from 'lucide-react';

import { apiFetch } from '../../lib/api';
import { type AppSession } from '../../lib/auth';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { cn } from '../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Question = {
  id: string;
  title: string;
  isRequired: boolean;
};

type AvailabilitySlot = {
  id: string;
  startTime: string;
  endTime: string;
  meetLink?: string | null;
  collaborator?: { id: string; name: string } | null;
};

type AgentStatus = {
  id: string;
  status: string;
  feedback?: string | null;
  interviewDate?: string | null;
  interviewLink?: string | null;
  scheduledSlot?: AvailabilitySlot | null;
};

// ─── Progress steps ───────────────────────────────────────────────────────────

type StepState = 'done' | 'current' | 'upcoming';

const STEPS = [
  { key: 'ENTERED',    label: 'Cadastro',              icon: Globe },
  { key: 'SUBMITTED',  label: 'Questionário enviado',  icon: ClipboardList },
  { key: 'QUALIFIED',  label: 'Qualificado',           icon: CheckCircle2 },
  { key: 'SCHEDULED',  label: 'Entrevista agendada',   icon: CalendarDays },
  { key: 'APPROVED',   label: 'Aprovado',              icon: ThumbsUp },
];

const STATUS_ORDER: Record<string, number> = {
  ENTERED: 0,
  SUBMITTED: 1,
  QUALIFIED: 2,
  SCHEDULED: 3,
  APPROVED: 4,
  REJECTED: -1,
};

function getStepState(stepKey: string, currentStatus: string): StepState {
  const stepIdx  = STATUS_ORDER[stepKey]  ?? 0;
  const currIdx  = STATUS_ORDER[currentStatus] ?? 0;
  if (currentStatus === 'REJECTED') return stepIdx <= 1 ? 'done' : 'upcoming';
  if (stepIdx  < currIdx)  return 'done';
  if (stepIdx === currIdx) return 'current';
  return 'upcoming';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentOnboardingPage() {
  const { data: session, status: sessionStatus } = useSession();
  const s = session as AppSession;

  const [questions, setQuestions]     = useState<Question[]>([]);
  const [answers, setAnswers]         = useState<Record<string, string>>({});
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [slots, setSlots]             = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [claiming, setClaiming]       = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  const loadData = useCallback(async () => {
    if (!s) return;
    setLoading(true);
    try {
      const [qData, statusData] = await Promise.all([
        apiFetch('/onboarding/questions', { session: s }),
        apiFetch('/onboarding/status', { session: s }),
      ]);
      setQuestions(qData);
      setAgentStatus(statusData);
      setError(null);

      // Load slots only when QUALIFIED
      if (statusData?.status === 'QUALIFIED') {
        const slotData = await apiFetch('/onboarding/slots', { session: s });
        setSlots(slotData);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [s]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') void loadData();
  }, [sessionStatus, loadData]);

  // ── Submit questionnaire ──────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/onboarding/submit', {
        method: 'POST',
        session: s,
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, text]) => ({
            questionId,
            text,
          })),
        }),
      });
      showSuccess('Questionário enviado com sucesso!');
      await loadData();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Claim slot ────────────────────────────────────────────────────────────

  const claimSlot = async (slotId: string) => {
    setClaiming(slotId);
    setError(null);
    try {
      await apiFetch('/onboarding/claim-slot', {
        method: 'POST',
        session: s,
        body: JSON.stringify({ slotId }),
      });
      showSuccess('Entrevista agendada!');
      await loadData();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setClaiming(null);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Carregando…</p>
        </div>
      </div>
    );
  }

  if (sessionStatus !== 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-foreground">Acesso restrito</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Faça login para acessar o onboarding.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatus = agentStatus?.status ?? 'ENTERED';

  // ── Main layout ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Globe className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Bem-vindo à Globus Dei
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Acompanhe seu processo de integração como agente.
          </p>
        </div>

        {/* Feedback banners */}
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

        {/* Progress tracker */}
        {currentStatus !== 'REJECTED' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Seu progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between gap-1">
                {STEPS.map((step, idx) => {
                  const state = getStepState(step.key, currentStatus);
                  const Icon = step.icon;
                  const isLast = idx === STEPS.length - 1;
                  return (
                    <div key={step.key} className="flex flex-1 flex-col items-center">
                      <div className="relative flex w-full items-center">
                        <div
                          className={cn(
                            'mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                            state === 'done'
                              ? 'border-primary bg-primary text-primary-foreground'
                              : state === 'current'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-background text-muted-foreground',
                          )}
                        >
                          {state === 'done' ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>
                        {!isLast && (
                          <div
                            className={cn(
                              'absolute left-[calc(50%+16px)] right-[calc(-50%+16px)] top-3.5 h-0.5',
                              state === 'done' ? 'bg-primary' : 'bg-border',
                            )}
                          />
                        )}
                      </div>
                      <span
                        className={cn(
                          'mt-2 text-center text-[10px] font-medium leading-tight',
                          state === 'current'
                            ? 'text-primary'
                            : state === 'done'
                              ? 'text-foreground'
                              : 'text-muted-foreground',
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── REJECTED ── */}
        {currentStatus === 'REJECTED' && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                Necessita ajustes
              </CardTitle>
              <CardDescription>
                Sua candidatura necessita de revisão. Leia o feedback abaixo e reenvie o questionário.
              </CardDescription>
            </CardHeader>
            {agentStatus?.feedback && (
              <>
                <Separator />
                <CardContent className="pt-5">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Feedback da equipe
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-900">
                      {agentStatus.feedback}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCcw className="h-4 w-4" />
                    Você pode reenviar o questionário com as correções abaixo.
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        )}

        {/* ── APPROVED ── */}
        {currentStatus === 'APPROVED' && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <ThumbsUp className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-emerald-800">Candidatura aprovada!</h2>
                <p className="mt-1 text-sm text-emerald-700">
                  Você está oficialmente integrado à Globus Dei. Em breve você terá acesso completo à plataforma.
                </p>
              </div>
              {agentStatus?.feedback && (
                <div className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-3 text-left">
                  <p className="mb-1 text-xs font-semibold text-emerald-700">Comentário da equipe</p>
                  <p className="text-sm text-emerald-900">{agentStatus.feedback}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── QUALIFIED: escolher slot ── */}
        {currentStatus === 'QUALIFIED' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-primary" />
                Agendar entrevista
              </CardTitle>
              <CardDescription>
                Seu questionário foi aprovado! Escolha um dos horários disponíveis para sua entrevista.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {slots.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
                  <Clock className="h-7 w-7 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum horário disponível no momento. Aguarde a equipe cadastrar novos slots.
                  </p>
                </div>
              ) : (
                slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {formatDateTime(slot.startTime)}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {slot.collaborator && (
                          <span>com {slot.collaborator.name}</span>
                        )}
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
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0 gap-1.5"
                      disabled={!!claiming}
                      onClick={() => void claimSlot(slot.id)}
                    >
                      {claiming === slot.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CalendarDays className="h-3.5 w-3.5" />
                      )}
                      Agendar
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* ── SCHEDULED: info da entrevista ── */}
        {currentStatus === 'SCHEDULED' && agentStatus?.interviewDate && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-primary" />
                Entrevista agendada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Data e horário
                </p>
                <p className="mt-1 text-base font-bold text-foreground">
                  {formatDateTime(agentStatus.interviewDate)}
                </p>
              </div>
              {agentStatus.interviewLink && (
                <a
                  href={agentStatus.interviewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  <Link2 className="h-4 w-4" />
                  Entrar na reunião
                </a>
              )}
              <p className="text-xs text-muted-foreground">
                Aguarde a avaliação da equipe Globus Dei após a entrevista.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── SUBMITTED: aguardando ── */}
        {currentStatus === 'SUBMITTED' && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Questionário em análise</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  A equipe da Globus Dei está revisando suas respostas. Você será notificado sobre os próximos passos em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Questionnaire form (ENTERED or REJECTED) ── */}
        {(currentStatus === 'ENTERED' || currentStatus === 'REJECTED') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ClipboardList className="h-4 w-4 text-primary" />
                Questionário de integração
              </CardTitle>
              <CardDescription>
                Responda as perguntas abaixo para iniciar seu processo de onboarding.
                Campos marcados com <span className="text-red-500">*</span> são obrigatórios.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {questions.length === 0 ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                      <div className="h-24 animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="space-y-2">
                      <label className="flex items-start gap-2 text-sm font-semibold text-foreground">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {idx + 1}
                        </span>
                        <span>
                          {q.title}
                          {q.isRequired && <span className="ml-1 text-red-500">*</span>}
                        </span>
                      </label>
                      <textarea
                        required={q.isRequired}
                        rows={4}
                        className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        placeholder="Escreva sua resposta aqui…"
                        value={answers[q.id] ?? ''}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                      />
                    </div>
                  ))}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full gap-2"
                      size="lg"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {submitting ? 'Enviando…' : currentStatus === 'REJECTED' ? 'Reenviar questionário' : 'Enviar questionário'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Globus Dei · Plataforma de integração de agentes
        </p>
      </div>
    </div>
  );
}
