'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import { apiFetch } from '../../lib/api';

type Question = {
  id: string;
  title: string;
  isRequired: boolean;
};

type OnboardingStatus = {
  status: string;
  feedback?: string | null;
  interviewDate?: string | null;
};

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [agentStatus, setAgentStatus] = useState<OnboardingStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    void loadData();
  }, [status]);

  const loadData = async () => {
    try {
      const [questionData, statusData] = await Promise.all([
        apiFetch('/onboarding/questions', { session }),
        apiFetch('/onboarding/status', { session }),
      ]);

      setQuestions(questionData);
      setAgentStatus(statusData);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  const handleChange = (questionId: string, value: string) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiFetch('/onboarding/submit', {
        method: 'POST',
        session,
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, text]) => ({
            questionId,
            text,
          })),
        }),
      });

      setSuccess(true);
      await loadData();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <div className="p-10 text-center">Carregando sessão...</div>;
  }

  if (status !== 'authenticated') {
    return <div className="p-10 text-center">Faça login para acessar o onboarding.</div>;
  }

  if (
    agentStatus &&
    ['SUBMITTED', 'QUALIFIED', 'SCHEDULED', 'APPROVED', 'REJECTED'].includes(agentStatus.status) &&
    !success
  ) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Status do onboarding</h1>
          <p className="text-slate-500 mb-6">Seu perfil já possui uma submissão em andamento.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-2xl p-4">
              <span className="block text-slate-400 uppercase font-bold text-xs mb-2">Status</span>
              <span className="font-bold text-slate-900">{agentStatus.status}</span>
            </div>
            {agentStatus.interviewDate && (
              <div className="bg-slate-50 rounded-2xl p-4">
                <span className="block text-slate-400 uppercase font-bold text-xs mb-2">Entrevista</span>
                <span className="font-bold text-slate-900">
                  {new Date(agentStatus.interviewDate).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </div>
          {agentStatus.feedback && (
            <div className="mt-6 bg-orange-50 border border-orange-100 rounded-2xl p-6">
              <span className="block text-orange-500 uppercase font-bold text-xs mb-2">Feedback</span>
              <p className="text-slate-700 whitespace-pre-wrap">{agentStatus.feedback}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-xl">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900">Questionário enviado</h1>
          <p className="text-lg leading-relaxed text-gray-500">
            Sua submissão foi registrada. A equipe da Globus Dei fará a análise e liberará os próximos passos no seu dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gray-100 bg-white/90 shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Questionário de onboarding</h2>
          <p className="mt-2 text-lg text-blue-100">
            Compartilhe sua vocação, experiência e contexto ministerial.
          </p>
        </div>

        <div className="px-8 py-8">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {questions.length === 0 ? (
            <div className="animate-pulse space-y-6 py-1">
              <div className="h-4 w-3/4 rounded bg-gray-200"></div>
              <div className="h-20 rounded bg-gray-200"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {questions.map((question) => (
                <div key={question.id} className="group relative">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {question.title} {question.isRequired && <span className="ml-1 text-red-500">*</span>}
                  </label>
                  <textarea
                    required={question.isRequired}
                    rows={4}
                    className="block w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-sm shadow-sm transition-all duration-200 group-hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Descreva detalhadamente..."
                    value={answers[question.id] || ''}
                    onChange={(inputEvent) => handleChange(question.id, inputEvent.target.value)}
                  />
                </div>
              ))}

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 ${
                    isSubmitting ? 'cursor-not-allowed opacity-70' : 'hover:scale-[1.02]'
                  }`}
                >
                  {isSubmitting ? 'Enviando...' : 'Submeter análise'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
