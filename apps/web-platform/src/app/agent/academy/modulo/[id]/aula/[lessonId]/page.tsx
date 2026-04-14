'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  MessageCircle,
  Paperclip,
  Send,
} from 'lucide-react';

import { apiFetch } from '../../../../../../../lib/api';
import { type AppSession } from '../../../../../../../lib/auth';
import { Badge } from '../../../../../../../components/ui/badge';
import { Button } from '../../../../../../../components/ui/button';
import { Card, CardContent } from '../../../../../../../components/ui/card';
import { Separator } from '../../../../../../../components/ui/separator';
import { Textarea } from '../../../../../../../components/ui/textarea';

// ─── Types ────────────────────────────────────────────────────────────────────

type Material = { id: string; title: string; url: string };

type Answer = {
  id: string;
  content: string;
  createdAt: string;
  collaborator: { id: string; name: string };
};

type Question = {
  id: string;
  content: string;
  createdAt: string;
  agent: { id: string; name: string; email: string };
  answers: Answer[];
};

type Lesson = {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string | null;
  order: number;
  moduleId: string;
  materials: Material[];
  questions: Question[];
};

type ModuleLesson = { id: string; title: string; order: number };
type Module = { id: string; title: string; lessons: ModuleLesson[] };

type Progress = {
  completedIds: string[];
  total: number;
  completed: number;
  allDone: boolean;
};

type Work = {
  id: string;
  content: string | null;
  fileUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  review: { feedback: string; approved: boolean } | null;
} | null;

function youtubeEmbedUrl(url: string): string | null {
  const m =
    url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/) ??
    url.match(/([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LessonPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const moduleId = params?.id as string;
  const lessonId = params?.lessonId as string;
  const s = session as AppSession;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [mod, setMod] = useState<Module | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [work, setWork] = useState<Work>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<'descricao' | 'duvidas' | 'materiais' | 'trabalho'>('descricao');
  const [marking, setMarking] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [submittingQ, setSubmittingQ] = useState(false);
  const [workContent, setWorkContent] = useState('');
  const [workFileUrl, setWorkFileUrl] = useState('');
  const [submittingWork, setSubmittingWork] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !moduleId || !lessonId) return;
    try {
      const [lessonData, modData, prog, workData]: [Lesson, Module, Progress, Work] = await Promise.all([
        apiFetch(`/academy/lessons/${lessonId}`, { session: s }),
        apiFetch(`/academy/modules/${moduleId}`, { session: s }),
        apiFetch(`/academy/modules/${moduleId}/progress`, { session: s }),
        apiFetch(`/academy/modules/${moduleId}/work`, { session: s }).catch(() => null),
      ]);
      setLesson(lessonData);
      setMod(modData);
      setProgress(prog);
      setWork(workData);
      setIsDone(prog.completedIds.includes(lessonId));
      if (workData?.content) setWorkContent(workData.content);
      if (workData?.fileUrl) setWorkFileUrl(workData.fileUrl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [session, moduleId, lessonId, s]);

  useEffect(() => {
    if (session) void load();
  }, [session, load]);

  const handleMarkComplete = async () => {
    setMarking(true);
    try {
      await apiFetch(`/academy/lessons/${lessonId}/complete`, { method: 'POST', session: s });
      setIsDone(true);
      setProgress((prev) => prev
        ? {
            ...prev,
            completedIds: [...prev.completedIds, lessonId],
            completed: prev.completed + 1,
            allDone: prev.completed + 1 >= prev.total,
          }
        : prev,
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setMarking(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!questionText.trim()) return;
    setSubmittingQ(true);
    try {
      await apiFetch(`/academy/lessons/${lessonId}/questions`, {
        method: 'POST', session: s,
        body: JSON.stringify({ content: questionText }),
      });
      setQuestionText('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmittingQ(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!workContent.trim() && !workFileUrl.trim()) return;
    setSubmittingWork(true);
    try {
      await apiFetch(`/academy/modules/${moduleId}/work`, {
        method: 'POST', session: s,
        body: JSON.stringify({
          content: workContent || undefined,
          fileUrl: workFileUrl || undefined,
        }),
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmittingWork(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Aula não encontrada.'}
        </div>
      </div>
    );
  }

  const sortedLessons = [...(mod?.lessons ?? [])].sort((a, b) => a.order - b.order);
  const currentIdx = sortedLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? sortedLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < sortedLessons.length - 1 ? sortedLessons[currentIdx + 1] : null;
  const allDone = progress?.allDone ?? false;
  const embedUrl = lesson.youtubeUrl ? youtubeEmbedUrl(lesson.youtubeUrl) : null;

  const tabs = [
    { key: 'descricao' as const, label: 'Descrição', icon: FileText },
    { key: 'duvidas' as const, label: `Dúvidas (${lesson.questions.length})`, icon: MessageCircle },
    { key: 'materiais' as const, label: `Materiais (${lesson.materials.length})`, icon: Paperclip },
    { key: 'trabalho' as const, label: 'Trabalho final', icon: CheckCircle2 },
  ];

  const workStatusColor = {
    PENDING: 'text-amber-600',
    APPROVED: 'text-emerald-600',
    REJECTED: 'text-red-600',
  };
  const workStatusLabel = { PENDING: 'Aguardando avaliação', APPROVED: 'Aprovado ✓', REJECTED: 'Reprovado — revise e reenvie' };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-1.5 px-2" onClick={() => router.push(`/agent/academy/modulo/${moduleId}`)}>
          <ArrowLeft className="h-4 w-4" /> {mod?.title}
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm text-muted-foreground">{lesson.title}</span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error} <button className="ml-2 underline" onClick={() => setError(null)}>fechar</button>
        </div>
      )}

      {/* Vídeo + Playlist */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        {/* Vídeo */}
        <div className="overflow-hidden rounded-xl bg-black">
          {embedUrl ? (
            <div className="aspect-video w-full">
              <iframe
                src={embedUrl}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center bg-muted/40">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">Nenhum vídeo disponível para esta aula.</p>
              </div>
            </div>
          )}
        </div>

        {/* Playlist */}
        <div className="flex flex-col rounded-xl border border-border bg-background shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">{mod?.title}</p>
            <span className="text-xs text-muted-foreground">
              {progress?.completed ?? 0}/{progress?.total ?? sortedLessons.length}
            </span>
          </div>
          <nav className="flex-1 overflow-y-auto">
            {sortedLessons.map((l, i) => {
              const done = progress?.completedIds.includes(l.id);
              const active = l.id === lessonId;
              return (
                <button
                  key={l.id}
                  onClick={() => router.push(`/agent/academy/modulo/${moduleId}/aula/${l.id}`)}
                  className={`flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-0 ${
                    active
                      ? 'bg-primary/8 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {/* Thumbnail placeholder */}
                  <div className={`relative flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md ${active ? 'bg-primary/20' : 'bg-muted'}`}>
                    <span className="text-xs font-bold opacity-60">{i + 1}</span>
                    {done && (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`line-clamp-2 text-xs font-medium leading-snug ${active ? 'text-primary' : 'text-foreground'}`}>
                      {l.title}
                    </p>
                    {done && (
                      <div className="mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] text-emerald-600">Concluída</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Title + Mark complete */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground">{lesson.title}</h1>
          <p className="text-xs text-muted-foreground">Aula {currentIdx + 1} de {sortedLessons.length}</p>
        </div>
        <Button
          variant={isDone ? 'secondary' : 'default'}
          size="sm"
          className="gap-2"
          disabled={isDone || marking}
          onClick={handleMarkComplete}
        >
          {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {isDone ? 'Aula concluída' : 'Marcar como concluída'}
        </Button>
      </div>

      {/* Prev / Next navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline" size="sm" className="gap-2"
          disabled={!prevLesson}
          onClick={() => prevLesson && router.push(`/agent/academy/modulo/${moduleId}/aula/${prevLesson.id}`)}
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button
          variant="outline" size="sm" className="gap-2"
          disabled={!nextLesson}
          onClick={() => nextLesson && router.push(`/agent/academy/modulo/${moduleId}/aula/${nextLesson.id}`)}
        >
          Próxima <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isWork = tab.key === 'trabalho';
          const disabled = isWork && !allDone;
          return (
            <button
              key={tab.key}
              disabled={disabled}
              onClick={() => !disabled && setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : disabled
                  ? 'cursor-not-allowed text-muted-foreground/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {isWork && !allDone && <span className="text-[10px] opacity-60">(bloqueado)</span>}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <Card>
        <CardContent className="py-5">
              {/* Descrição */}
              {activeTab === 'descricao' && (
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                  {lesson.description}
                </p>
              )}

              {/* Materiais */}
              {activeTab === 'materiais' && (
                <div className="space-y-2">
                  {lesson.materials.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum material disponível.</p>
                  ) : (
                    lesson.materials.map((mat) => (
                      <a
                        key={mat.id}
                        href={mat.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {mat.title}
                        <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </a>
                    ))
                  )}
                </div>
              )}

              {/* Dúvidas */}
              {activeTab === 'duvidas' && (
                <div className="space-y-4">
                  {/* Nova dúvida */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Fazer uma pergunta</p>
                    <Textarea
                      rows={3}
                      placeholder="Digite sua dúvida sobre esta aula…"
                      value={questionText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestionText(e.target.value)}
                    />
                    <Button size="sm" className="gap-2" disabled={!questionText.trim() || submittingQ} onClick={handleAskQuestion}>
                      {submittingQ ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Enviar dúvida
                    </Button>
                  </div>

                  {lesson.questions.length > 0 && <Separator />}

                  {/* Lista de dúvidas */}
                  <div className="space-y-4">
                    {lesson.questions.map((q) => (
                      <div key={q.id} className="space-y-2">
                        <div className="rounded-lg bg-muted/40 px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-foreground">{q.agent.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{q.content}</p>
                        </div>
                        {q.answers.map((a) => (
                          <div key={a.id} className="ml-6 rounded-lg border-l-2 border-primary/40 bg-primary/5 px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-primary">{a.collaborator.name}</span>
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Equipe</Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(a.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-sm text-foreground">{a.content}</p>
                          </div>
                        ))}
                        {q.answers.length === 0 && (
                          <p className="ml-6 text-xs text-muted-foreground italic">Aguardando resposta da equipe…</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trabalho Final */}
              {activeTab === 'trabalho' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Trabalho final do módulo</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Envie um texto descrevendo o que aprendeu, ou cole o link de um arquivo, vídeo ou apresentação.
                    </p>
                  </div>

                  {work?.status && (
                    <div className={`flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm font-medium ${workStatusColor[work.status]}`}>
                      <CheckCircle2 className="h-4 w-4" />
                      {workStatusLabel[work.status]}
                      {work.review?.feedback && (
                        <p className="mt-1 text-xs text-foreground font-normal">Feedback: {work.review.feedback}</p>
                      )}
                    </div>
                  )}

                  {work?.status !== 'APPROVED' && (
                    <div className="space-y-3">
                      <Textarea
                        rows={5}
                        placeholder="Descreva o que aprendeu e como aplicou os conhecimentos deste módulo…"
                        value={workContent}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setWorkContent(e.target.value)}
                      />
                      <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 shadow-sm focus-within:ring-1 focus-within:ring-ring">
                        <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <input
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                          placeholder="Link de arquivo, vídeo ou apresentação (opcional)…"
                          value={workFileUrl}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWorkFileUrl(e.target.value)}
                        />
                      </div>
                      <Button
                        className="gap-2"
                        disabled={(!workContent.trim() && !workFileUrl.trim()) || submittingWork}
                        onClick={handleSubmitWork}
                      >
                        {submittingWork ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {work ? 'Reenviar trabalho' : 'Enviar trabalho'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
    </div>
  );
}
