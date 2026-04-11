'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2, MessageCircle, Send } from 'lucide-react';

import { apiFetch } from '../../../../lib/api';
import { type AppSession } from '../../../../lib/auth';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { Separator } from '../../../../components/ui/separator';
import { Textarea } from '../../../../components/ui/textarea';

// ─── Types ────────────────────────────────────────────────────────────────────

type Question = {
  id: string;
  content: string;
  isAnswered: boolean;
  createdAt: string;
  lesson: {
    id: string;
    title: string;
    module: { id: string; title: string };
  };
  agent: { id: string; name: string; email: string };
  answer: {
    id: string;
    content: string;
    createdAt: string;
    collaborator: { id: string; name: string };
  } | null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ColaboradorDuvidasPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerTexts, setAnswerTexts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'unanswered' | 'all'>('unanswered');

  const s = session as AppSession | null;

  const loadQuestions = useCallback(async () => {
    if (!s?.accessToken) return;
    setLoading(true);
    try {
      const endpoint = filter === 'unanswered' ? '/academy/questions/unanswered' : '/academy/questions/unanswered';
      const data = await apiFetch(endpoint, { session: s });
      setQuestions(data as Question[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [s, filter]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  async function handleAnswer(questionId: string) {
    const content = answerTexts[questionId]?.trim();
    if (!content || !s?.accessToken) return;
    setSubmitting(questionId);
    try {
      await apiFetch(`/academy/questions/${questionId}/answer`, {
        session: s,
        method: 'POST',
        body: { content },
      });
      setAnswerTexts((prev) => ({ ...prev, [questionId]: '' }));
      await loadQuestions();
    } catch {
      alert('Erro ao enviar resposta.');
    } finally {
      setSubmitting(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.push('/colaborador/academy')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dúvidas dos Agentes</h1>
          <p className="text-sm text-muted-foreground">Responda às perguntas sobre as aulas da Academia</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 rounded-xl border bg-muted/20 px-5 py-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{questions.length}</p>
          <p className="text-xs text-muted-foreground">Sem resposta</p>
        </div>
        <Separator orientation="vertical" className="h-10" />
        <p className="text-sm text-muted-foreground">
          Responda as dúvidas abaixo para ajudar os agentes em sua jornada de aprendizado.
        </p>
      </div>

      {/* Empty state */}
      {questions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-green-500/60" />
            <p className="text-base font-medium text-muted-foreground">Todas as dúvidas foram respondidas!</p>
            <p className="mt-1 text-sm text-muted-foreground">Nenhuma pergunta pendente no momento.</p>
          </CardContent>
        </Card>
      )}

      {/* Questions list */}
      <div className="space-y-4">
        {questions.map((q) => (
          <Card key={q.id} className="overflow-hidden">
            {/* Question header */}
            <div className="bg-muted/30 px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs font-normal">
                  {q.lesson.module.title}
                </Badge>
                <span className="text-xs text-muted-foreground">›</span>
                <span className="text-xs text-muted-foreground">{q.lesson.title}</span>
                {!q.isAnswered && (
                  <Badge variant="destructive" className="ml-auto text-[10px]">
                    Sem resposta
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary uppercase">
                  {q.agent.name.charAt(0)}
                </div>
                <p className="text-xs font-medium text-foreground">{q.agent.name}</p>
                <span className="text-[10px] text-muted-foreground">{q.agent.email}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            <CardContent className="space-y-4 pt-4">
              {/* Question content */}
              <div className="rounded-lg bg-muted/20 px-4 py-3">
                <p className="text-sm text-foreground">{q.content}</p>
              </div>

              {/* Existing answer */}
              {q.answer && (
                <div className="rounded-lg border-l-2 border-green-500 bg-green-500/5 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">{q.answer.collaborator.name}</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Equipe</Badge>
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {new Date(q.answer.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{q.answer.content}</p>
                </div>
              )}

              {/* Answer form */}
              {!q.answer && (
                <div className="space-y-2">
                  <Textarea
                    rows={3}
                    placeholder="Digite sua resposta para o agente…"
                    value={answerTexts[q.id] ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setAnswerTexts((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                  />
                  <Button
                    size="sm"
                    className="gap-2"
                    disabled={!answerTexts[q.id]?.trim() || submitting === q.id}
                    onClick={() => handleAnswer(q.id)}
                  >
                    {submitting === q.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Enviar resposta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
