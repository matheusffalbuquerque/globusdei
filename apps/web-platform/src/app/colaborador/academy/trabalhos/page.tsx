'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  XCircle,
} from 'lucide-react';

import { apiFetch } from '../../../../lib/api';
import { type AppSession } from '../../../../lib/auth';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { Separator } from '../../../../components/ui/separator';
import { Textarea } from '../../../../components/ui/textarea';

// ─── Types ────────────────────────────────────────────────────────────────────

type FinalWork = {
  id: string;
  content: string | null;
  fileUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  module: { id: string; title: string };
  agent: { id: string; name: string; email: string };
  review: {
    id: string;
    approved: boolean;
    feedback: string;
    createdAt: string;
    collaborator: { id: string; name: string };
  } | null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ColaboradorTrabalhosPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [works, setWorks] = useState<FinalWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const s = session as AppSession | null;

  const loadWorks = useCallback(async () => {
    if (!s?.accessToken) return;
    setLoading(true);
    try {
      const data = await apiFetch('/academy/works', { session: s });
      setWorks(data as FinalWork[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [s]);

  useEffect(() => {
    loadWorks();
  }, [loadWorks]);

  async function handleReview(workId: string, approved: boolean) {
    const feedback = feedbacks[workId]?.trim();
    if (!feedback || !s?.accessToken) {
      alert('O feedback é obrigatório para aprovar ou rejeitar.');
      return;
    }
    setSubmitting(workId);
    try {
      await apiFetch(`/academy/works/${workId}/review`, {
        session: s,
        method: 'POST',
        body: { approved, feedback },
      });
      setFeedbacks((prev) => ({ ...prev, [workId]: '' }));
      await loadWorks();
    } catch {
      alert('Erro ao registrar avaliação.');
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
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trabalhos Finais</h1>
          <p className="text-sm text-muted-foreground">Avalie os trabalhos enviados pelos agentes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 rounded-xl border bg-muted/20 px-5 py-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{works.length}</p>
          <p className="text-xs text-muted-foreground">Aguardando</p>
        </div>
        <Separator orientation="vertical" className="h-10" />
        <p className="text-sm text-muted-foreground">
          Revise o conteúdo enviado, preencha um feedback e aprove ou rejeite cada trabalho.
          Ao aprovar, o agente receberá automaticamente sua certificação no módulo.
        </p>
      </div>

      {/* Empty state */}
      {works.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-green-500/60" />
            <p className="text-base font-medium text-muted-foreground">Nenhum trabalho pendente!</p>
            <p className="mt-1 text-sm text-muted-foreground">Todos os envios foram avaliados.</p>
          </CardContent>
        </Card>
      )}

      {/* Works list */}
      <div className="space-y-6">
        {works.map((work) => (
          <Card key={work.id} className="overflow-hidden">
            {/* Work header */}
            <div className="bg-muted/30 px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs font-normal">
                  {work.module.title}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {work.status === 'PENDING' ? 'Pendente' : work.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}
                </Badge>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  Enviado em {new Date(work.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary uppercase">
                  {work.agent.name.charAt(0)}
                </div>
                <p className="text-xs font-medium text-foreground">{work.agent.name}</p>
                <span className="text-[10px] text-muted-foreground">{work.agent.email}</span>
              </div>
            </div>

            <CardContent className="space-y-4 pt-4">
              {/* Work content */}
              {work.content && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Texto enviado</p>
                  </div>
                  <div className="rounded-lg bg-muted/20 px-4 py-3">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{work.content}</p>
                  </div>
                </div>
              )}

              {work.fileUrl && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Link do arquivo</p>
                  </div>
                  <a
                    href={work.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {work.fileUrl.length > 60 ? work.fileUrl.slice(0, 60) + '…' : work.fileUrl}
                  </a>
                </div>
              )}

              <Separator />

              {/* Existing review */}
              {work.review && (
                <div
                  className={`rounded-lg border-l-2 px-4 py-3 ${
                    work.review.approved
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-red-500 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {work.review.approved ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span
                      className={`text-xs font-semibold ${
                        work.review.approved ? 'text-green-700' : 'text-red-600'
                      }`}
                    >
                      {work.review.approved ? 'Aprovado' : 'Rejeitado'} por {work.review.collaborator.name}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {new Date(work.review.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{work.review.feedback}</p>
                </div>
              )}

              {/* Review form */}
              {!work.review && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Feedback para o agente *
                    </label>
                    <Textarea
                      rows={3}
                      placeholder="Escreva um feedback construtivo sobre o trabalho do agente…"
                      value={feedbacks[work.id] ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFeedbacks((prev) => ({ ...prev, [work.id]: e.target.value }))
                      }
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      O feedback é obrigatório e será exibido ao agente.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                      disabled={!feedbacks[work.id]?.trim() || submitting === work.id}
                      onClick={() => handleReview(work.id, true)}
                    >
                      {submitting === work.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={!feedbacks[work.id]?.trim() || submitting === work.id}
                      onClick={() => handleReview(work.id, false)}
                    >
                      {submitting === work.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      Rejeitar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
