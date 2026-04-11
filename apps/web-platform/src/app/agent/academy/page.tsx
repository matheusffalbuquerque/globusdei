'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BookOpen, CheckCircle2, ChevronRight, GraduationCap, Lock, PlayCircle } from 'lucide-react';

import { apiFetch } from '../../../lib/api';
import { type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';

// ─── Types ────────────────────────────────────────────────────────────────────

type Module = {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  isPublished: boolean;
  order: number;
  _count: { lessons: number; enrollments: number };
};

type Progress = {
  completedIds: string[];
  total: number;
  completed: number;
  allDone: boolean;
};

type Certification = {
  moduleId: string;
  issuedAt: string;
  module: { id: string; title: string; coverUrl: string | null };
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AcademyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const s = session as AppSession;

  const [modules, setModules] = useState<Module[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const [mods, certs]: [Module[], Certification[]] = await Promise.all([
        apiFetch('/academy/modules', { session: s }),
        apiFetch('/academy/certifications', { session: s }),
      ]);
      setModules(mods);
      setCertifications(certs);

      // Load progress for each module in parallel
      const progresses = await Promise.all(
        mods.map((m) =>
          apiFetch(`/academy/modules/${m.id}/progress`, { session: s })
            .then((p: Progress) => ({ id: m.id, p }))
            .catch(() => ({ id: m.id, p: { completedIds: [], total: 0, completed: 0, allDone: false } })),
        ),
      );
      const map: Record<string, Progress> = {};
      const enrolled = new Set<string>();
      progresses.forEach(({ id, p }) => {
        map[id] = p;
        if (p.total > 0) enrolled.add(id); // has progress = enrolled (or started)
      });
      setProgressMap(map);
      setEnrolledIds(enrolled);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [session, s]);

  useEffect(() => {
    if (session) void load();
  }, [session, load]);

  const handleEnroll = async (moduleId: string) => {
    setEnrolling(moduleId);
    try {
      await apiFetch(`/academy/modules/${moduleId}/enroll`, { method: 'POST', session: s });
      setEnrolledIds((prev) => new Set(prev).add(moduleId));
      router.push(`/agent/academy/modulo/${moduleId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnrolling(null);
    }
  };

  const inProgress = modules.filter(
    (m) => enrolledIds.has(m.id) && !certifications.find((c) => c.moduleId === m.id),
  );

  const certifiedIds = new Set(certifications.map((c) => c.moduleId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Formação e desenvolvimento
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Academia Globus Dei</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Módulos de formação para agentes de missão. Conclua as aulas e envie o trabalho final para receber sua certificação.
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error} <button className="ml-2 underline" onClick={() => setError(null)}>fechar</button>
        </div>
      )}

      {/* Em progresso */}
      {inProgress.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <PlayCircle className="h-4 w-4 text-primary" /> Em progresso
          </h2>
          <div className="flex flex-wrap gap-3">
            {inProgress.map((m) => {
              const prog = progressMap[m.id];
              const pct = prog && prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
              return (
                <button
                  key={m.id}
                  onClick={() => router.push(`/agent/academy/modulo/${m.id}`)}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5 text-left shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.title}</p>
                    <p className="text-[11px] text-muted-foreground">{pct}% concluído</p>
                  </div>
                  <ChevronRight className="ml-2 h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Certificações */}
      {certifications.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <GraduationCap className="h-4 w-4 text-emerald-600" /> Certificações obtidas
          </h2>
          <div className="flex flex-wrap gap-2">
            {certifications.map((c) => (
              <Badge key={c.moduleId} variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {c.module.title}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Todos os módulos */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-foreground">Módulos disponíveis</h2>
        {modules.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum módulo publicado ainda.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {modules.map((m) => {
              const prog = progressMap[m.id];
              const isEnrolled = enrolledIds.has(m.id);
              const isCertified = certifiedIds.has(m.id);
              const pct = prog && prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;

              return (
                <ModuleCard
                  key={m.id}
                  module={m}
                  pct={pct}
                  isEnrolled={isEnrolled}
                  isCertified={isCertified}
                  enrolling={enrolling === m.id}
                  onOpen={() => router.push(`/agent/academy/modulo/${m.id}`)}
                  onEnroll={() => handleEnroll(m.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Module Card ──────────────────────────────────────────────────────────────

function ModuleCard({
  module: m, pct, isEnrolled, isCertified, enrolling, onOpen, onEnroll,
}: {
  module: Module;
  pct: number;
  isEnrolled: boolean;
  isCertified: boolean;
  enrolling: boolean;
  onOpen: () => void;
  onEnroll: () => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-shadow hover:shadow-md">
      {/* Cover */}
      <div
        className="relative flex h-32 cursor-pointer items-center justify-center overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5"
        onClick={onOpen}
      >
        {m.coverUrl ? (
          <img src={m.coverUrl} alt={m.title} className="h-full w-full object-cover" />
        ) : (
          <BookOpen className="h-12 w-12 text-primary/30" />
        )}
        {isCertified && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
            <CheckCircle2 className="h-3 w-3" /> Certificado
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <button className="text-left text-sm font-semibold text-foreground hover:underline leading-tight" onClick={onOpen}>
          {m.title}
        </button>
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {m.description}
        </p>

        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{m._count.lessons} aulas</span>
          <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{m._count.enrollments} alunos</span>
        </div>

        {/* Progress bar */}
        {isEnrolled && !isCertified && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>Progresso</span><span>{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div className="mt-4">
          {isEnrolled ? (
            <Button size="sm" className="h-8 w-full text-xs" onClick={onOpen}>
              {isCertified ? 'Ver módulo' : 'Continuar'}
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="h-8 w-full text-xs" disabled={enrolling} onClick={onEnroll}>
              {enrolling ? 'Inscrevendo…' : 'Ingressar'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
