'use client';

import { useState, useEffect } from 'react';

/**
 * Onboarding Flow - Dynamic Questionnaire
 * This interface dynamically loads questions from the API and renders a multi-step or single-page form.
 */
export default function OnboardingPage() {
  const [questions, setQuestions] = useState<{ id: string; title: string; isRequired: boolean }[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // MOCK: Until Keycloak Session is bound
  const currentAgentId = 'MOCK_AGENT_ID';

  useEffect(() => {
    // Fetch dynamic questions from MainService Gateway
    fetch('http://localhost:3001/api/onboarding/questions')
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => console.error('Failed to load questions', err));
  }, []);

  const handleChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      answers: Object.entries(answers).map(([qId, text]) => ({ questionId: qId, text }))
    };

    try {
      const res = await fetch(`http://localhost:3001/api/onboarding/${currentAgentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 p-12 text-center transform transition-all">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Questionário Enviado!</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 leading-relaxed">Sua aplicação missionária foi submetida com sucesso! A equipe de Colaboradores de campo fará a análise missiológica e você será contactado para o Agendamento da sua Entrevista Oficial.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Questionário de Onboarding
          </h2>
          <p className="mt-2 text-blue-100 text-lg">
            Compartilhe sua visão cristã, experiências e vocação para se ingressar.
          </p>
        </div>

        <div className="px-8 py-8">
          {questions.length === 0 ? (
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-6 py-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="space-y-3">
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {questions.map((q) => (
                <div key={q.id!} className="relative group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {q.title} {q.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="mt-1">
                    <textarea
                      required={q.isRequired}
                      rows={4}
                      className="shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-400 p-4 transition-all duration-200 group-hover:border-indigo-300"
                      placeholder="Descreva detalhadamente..."
                      value={answers[q.id!] || ''}
                      onChange={(e) => handleChange(q.id!, e.target.value)}
                    />
                  </div>
                </div>
              ))}
              
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform ${isSubmitting ? 'opacity-70 cursor-not-allowed scale-100' : 'hover:scale-[1.02]'}`}
                >
                  {isSubmitting ? 'Processando envio...' : 'Submeter Análise'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
