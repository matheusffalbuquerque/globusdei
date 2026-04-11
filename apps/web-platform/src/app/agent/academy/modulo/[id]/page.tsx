'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  GraduationCap,
  Lock,
  PlayCircle,
  Users,
} from 'lucide-react';

import { apiFetch } from '../../../../../lib/api';
import { type AppSession } from '../../../../../lib/auth';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent } from '../../../../../components/ui/card';
import { Separator } from '../../../../../components/ui/separator';

type Lesson = {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string | null;
  order: number;
  _count: { progresses: number };
};

type Module = {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  isPublished: boolean;
  order: number;
  _count: { lessons: number; enrollments: number };
  lessons: Lesson[];
};

type Progress = {
  completedIds: string[];
  total: number;
  completed: number;
  allDone: boolean;
};

export default function ModuleProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const moduleId = params?.id as string;
  const s = session as AppSession;

  const [mod, setMod] = useState<Module | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !moduleId) return;
    try {
      const [modData, prog]: [Module, Progress] = await Promise.all([
        apiFetch(`/academy/modules/${moduleId}`, { session: s }),
        apiFetch(`/academy/modules/${moduleId}/progress`, { session: s }),
      ]);
      setMod(modData);
      setProgress(prog);
      setIsEnrolled(prog.total > 0 || prog.completed > 0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [session, moduleId, s]);

  useEffect(() => {
    if (session) void load();
  }, [session, load]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await apiFetch(`/academy/modules/${moduleId}/enroll`, { method: 'POST', session: s });
      setIsEnrolled(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !mod) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Módulo não encontrado.'}
        </div>
      </div>
    );
  }

  const completedIds = new Set(progress?.completedIds ?? []);
  const pct = progress && progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Voltar para Academia
      </Button>

      {/* Module header */}
      <Card className="overflow-hidden">
        {mod.coverUrl && (
          <div className="h-40 w-full overflow-hidden">
            <img src={mod.coverUrl} alt={mod.title} className="h-full w-full object-cover" />
          </div>
        )}
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">{mod.title}</h1>
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground leading-relaxed">
                {mod.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />{mod._count.lessons} aulas</span>
                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{mod._count.enrollments} alunos</span>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              {!isEnrolled ? (
                <Button className="gap-2" disabled={enrolling} onClick={handleEnroll}>
                  {enrolling ? 'Inscrevendo…' : 'Ingressar no módulo'}
                </Button>
              ) : (
                <Button className="gap-2" onClick={() => {
                  const firstIncomplete = mod.lessons.find((l) => !completedIds.has(l.id));
                  const target = firstIncomplete ?? mod.lessons[0];
                  if (target) router.push(`/agent/academy/modulo/${moduleId}/aula/${target.id}`);
                }}>
                  <PlayCircle className="h-4 w-4" />
                  {progress?.allDone ? 'Revisar aulas' : 'Continuar estudando'}
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {isEnrolled && (
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>{progress?.completed ?? 0} de {progress?.total ?? 0} aulas concluídas</span>
                <span className="font-medium">{pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lessons list */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-foreground">Grade de aulas</h2>
        <div className="space-y-2">
          {mod.lessons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Nenhuma aula cadastrada ainda.
            </div>
          ) : (
            mod.lessons.map((lesson, i) => {
              const done = completedIds.has(lesson.id);
              const canAccess = isEnrolled;
              return (
                <button
                  key={lesson.id}
                  disabled={!canAccess}
                  onClick={() => router.push(`/agent/academy/modulo/${moduleId}/aula/${lesson.id}`)}
                  className="flex w-full items-center gap-4 rounded-xl border border-border bg-background p-4 text-left shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border bg-muted text-sm font-bold text-muted-foreground">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{lesson.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{lesson.description}</p>
                  </div>
                  <div className="shrink-0">
                    {!canAccess ? (
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    ) : done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
