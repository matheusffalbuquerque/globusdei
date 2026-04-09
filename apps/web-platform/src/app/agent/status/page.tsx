'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Link2,
  Loader2,
  MessageSquare,
} from 'lucide-react';

import { apiFetch } from '../../../lib/api';
import { formatAgentStatus, type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';
import { cn } from '../../../lib/utils';

type OnboardingStatus = {
  status: string;
  feedback?: string | null;
  interviewDate?: string | null;
};

type AvailabilitySlot = {
  id: string;
  startTime: string;
  endTime: string;
  meetLink?: string | null;
};

const STEP_LABELS = [
  'Cadastro iniciado',
  'Questionário enviado',
  'Qualificado',
  'Entrevista agendada',
  'Aprovado',
];

/**
 * AgentStatusPage consolidates onboarding progress, feedback and interview scheduling.
 */
export default function AgentStatusPage() {
  const { data: session } = useSession();
  const [statusData, setStatusData] = useState<OnboardingStatus | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [submittingSlot, setSubmittingSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async () => {
    if (!session) {
      return;
    }

    try {
      const [statusResponse, slotResponse] = await Promise.all([
        apiFetch('/onboarding/status', { session: session as AppSession }),
        apiFetch('/onboarding/slots', { session: session as AppSession }),
      ]);

      setStatusData(statusResponse);
      setSlots(slotResponse);
      setError(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, [session]);

  const stepIndex = useMemo(() => {
    const order = ['ENTERED', 'SUBMITTED', 'QUALIFIED', 'SCHEDULED', 'APPROVED'];
    return Math.max(order.indexOf(statusData?.status ?? 'ENTERED'), 0);
  }, [statusData?.status]);

  const claimSlot = async (slotId: string) => {
    setSubmittingSlot(slotId);
    setError(null);

    try {
      await apiFetch('/onboarding/claim-slot', {
        method: 'POST',
        session: session as AppSession,
        body: JSON.stringify({ slotId }),
      });
      await loadStatus();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSubmittingSlot(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      {/* Left: progress + feedback */}
      <Card>
        <CardHeader className="pb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Onboarding
          </p>
          <CardTitle className="mt-0.5 text-base">Status e próximos passos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Acompanhe a fase atual do seu onboarding, feedbacks do time e a agenda de entrevista quando liberada.
          </p>
        </CardHeader>

        <Separator />

        <CardContent className="pt-5 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Status + interview info */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-muted/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Status atual
              </p>
              <div className="mt-2">
                <Badge variant={
                  statusData?.status === 'APPROVED' ? 'success' :
                  statusData?.status === 'REJECTED' ? 'destructive' :
                  statusData?.status === 'QUALIFIED' || statusData?.status === 'SCHEDULED' ? 'info' :
                  statusData?.status === 'SUBMITTED' ? 'warning' : 'secondary'
                }>
                  {formatAgentStatus(statusData?.status)}
                </Badge>
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Entrevista
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {statusData?.interviewDate
                  ? new Date(statusData.interviewDate).toLocaleString('pt-BR')
                  : 'Ainda não agendada'}
              </p>
            </div>
          </div>

          {/* Progress steps */}
          <div className="space-y-3">
            {STEP_LABELS.map((label, index) => {
              const done = index < stepIndex;
              const current = index === stepIndex;
              return (
                <div key={label} className="flex items-start gap-3">
                  <div
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
                      done
                        ? 'border-primary bg-primary text-primary-foreground'
                        : current
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground',
                    )}
                  >
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                  </div>
                  <div>
                    <p className={cn(
                      'text-sm font-medium',
                      current ? 'text-foreground' : done ? 'text-foreground' : 'text-muted-foreground',
                    )}>
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {current ? 'Etapa atual do seu fluxo.' : done ? 'Concluída.' : 'Aguardando progressão.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feedback */}
          {statusData?.feedback && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-700">
                <MessageSquare className="h-3.5 w-3.5" />
                Feedback da equipe
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-900">
                {statusData.feedback}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right: slots + guide */}
      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Agenda
            </p>
            <CardTitle className="mt-0.5 text-base">Horários disponíveis</CardTitle>
            <p className="text-sm text-muted-foreground">
              A seleção de horário só é liberada quando seu status estiver como qualificado.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {slots.length > 0 ? (
              slots.map((slot) => (
                <div
                  key={slot.id}
                  className="rounded-lg border border-border bg-muted/30 p-4"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(slot.startTime).toLocaleString('pt-BR')} até{' '}
                    {new Date(slot.endTime).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {slot.meetLink ? 'Link de reunião já configurado.' : 'Link será informado pela equipe.'}
                  </p>
                  {slot.meetLink && (
                    <a
                      href={slot.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Link2 className="h-3 w-3" />
                      Abrir link
                    </a>
                  )}
                  <div className="mt-3">
                    <Button
                      size="sm"
                      disabled={statusData?.status !== 'QUALIFIED' || submittingSlot === slot.id}
                      onClick={() => void claimSlot(slot.id)}
                    >
                      {submittingSlot === slot.id ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CalendarDays className="mr-2 h-3.5 w-3.5" />
                      )}
                      {submittingSlot === slot.id ? 'Agendando…' : 'Escolher horário'}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center">
                <Clock className="h-7 w-7 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Ainda não há horários cadastrados pela equipe.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Guia rápido
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Preencha o questionário completo no onboarding.</p>
            <p>2. Aguarde a qualificação da equipe de pessoas.</p>
            <p>3. Escolha um horário e acompanhe sua entrevista aqui.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
