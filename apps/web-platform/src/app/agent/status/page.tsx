'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

import { apiFetch } from '../../../lib/api';
import { formatAgentStatus, type AppSession } from '../../../lib/auth';

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
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Onboarding</div>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Status e próximos passos</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Acompanhe a fase atual do seu onboarding, feedbacks do time e a agenda de entrevista quando liberada.
        </p>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-5">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Status atual</div>
            <div className="mt-3 text-2xl font-bold text-slate-900">
              {formatAgentStatus(statusData?.status)}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 p-5">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Entrevista</div>
            <div className="mt-3 text-lg font-bold text-slate-900">
              {statusData?.interviewDate
                ? new Date(statusData.interviewDate).toLocaleString('pt-BR')
                : 'Ainda não agendada'}
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {['Cadastro iniciado', 'Questionário enviado', 'Qualificado', 'Entrevista agendada', 'Aprovado'].map(
            (step, index) => (
              <div key={step} className="flex items-start gap-4">
                <div
                  className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
                    index <= stepIndex ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{step}</div>
                  <div className="text-sm text-slate-500">
                    {index === stepIndex ? 'Etapa atual do seu fluxo.' : 'Aguardando progressão.'}
                  </div>
                </div>
              </div>
            ),
          )}
        </div>

        {statusData?.feedback && (
          <div className="mt-8 rounded-3xl border border-orange-200 bg-orange-50 p-6">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Feedback da equipe</div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{statusData.feedback}</p>
          </div>
        )}
      </section>

      <section className="space-y-6">
        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Agenda</div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Horários disponíveis</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            A seleção de horário só é liberada quando seu status estiver como qualificado.
          </p>

          <div className="mt-6 space-y-4">
            {slots.length > 0 ? (
              slots.map((slot) => (
                <div key={slot.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-sm font-bold text-slate-900">
                    {new Date(slot.startTime).toLocaleString('pt-BR')} até{' '}
                    {new Date(slot.endTime).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {slot.meetLink ? 'Link de reunião já configurado.' : 'Link será informado pela equipe.'}
                  </div>
                  <button
                    type="button"
                    disabled={statusData?.status !== 'QUALIFIED' || submittingSlot === slot.id}
                    onClick={() => void claimSlot(slot.id)}
                    className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submittingSlot === slot.id ? 'Agendando...' : 'Escolher horário'}
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">
                Ainda não há horários cadastrados pela equipe.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Guia rápido</div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>1. Preencha o questionário completo no onboarding.</p>
            <p>2. Aguarde a qualificação da equipe de pessoas.</p>
            <p>3. Escolha um horário e acompanhe sua entrevista aqui.</p>
          </div>
        </article>
      </section>
    </div>
  );
}
