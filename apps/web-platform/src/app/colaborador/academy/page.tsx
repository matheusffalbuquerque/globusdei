'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import { apiFetch } from '../../../lib/api';
import { type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Separator } from '../../../components/ui/separator';
import { Textarea } from '../../../components/ui/textarea';

// ─── Types ────────────────────────────────────────────────────────────────────

type Material = { id: string; title: string; url: string };

type Lesson = {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string | null;
  order: number;
  materials: Material[];
};

type AcademyModule = {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  workInstructions: string;
  isPublished: boolean;
  order: number;
  lessons: Lesson[];
  _count: { enrollments: number; certifications: number };
};

type ModuleForm = {
  title: string;
  description: string;
  coverUrl: string;
  workInstructions: string;
  isPublished: boolean;
  order: string;
};

type LessonForm = {
  title: string;
  description: string;
  youtubeUrl: string;
  order: string;
};

const emptyModuleForm = (): ModuleForm => ({
  title: '',
  description: '',
  coverUrl: '',
  workInstructions: '',
  isPublished: false,
  order: '0',
});

const emptyLessonForm = (): LessonForm => ({
  title: '',
  description: '',
  youtubeUrl: '',
  order: '0',
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function ColaboradorAcademyPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [modules, setModules] = useState<AcademyModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Module form state
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<AcademyModule | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleForm>(emptyModuleForm());
  const [savingModule, setSavingModule] = useState(false);

  // Lesson form state
  const [showLessonForm, setShowLessonForm] = useState<string | null>(null); // moduleId
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLessonForm());
  const [savingLesson, setSavingLesson] = useState(false);

  // Material form state
  const [showMaterialForm, setShowMaterialForm] = useState<string | null>(null); // lessonId
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [savingMaterial, setSavingMaterial] = useState(false);

  const s = session as AppSession | null;

  const loadModules = useCallback(async () => {
    if (!s?.accessToken) return;
    setLoading(true);
    try {
      const data = await apiFetch('/academy/modules/admin/full', { session: s });
      setModules(data as AcademyModule[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [s]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  // ── Module CRUD ──────────────────────────────────────────────────────────

  function openCreateModule() {
    setEditingModule(null);
    setModuleForm(emptyModuleForm());
    setShowModuleForm(true);
  }

  function openEditModule(mod: AcademyModule) {
    setEditingModule(mod);
    setModuleForm({
      title: mod.title,
      description: mod.description,
      coverUrl: mod.coverUrl ?? '',
      workInstructions: mod.workInstructions,
      isPublished: mod.isPublished,
      order: String(mod.order),
    });
    setShowModuleForm(true);
  }

  async function handleSaveModule() {
    if (!s?.accessToken) return;
    setSavingModule(true);
    try {
      const body = {
        title: moduleForm.title,
        description: moduleForm.description,
        coverUrl: moduleForm.coverUrl || undefined,
        workInstructions: moduleForm.workInstructions,
        isPublished: moduleForm.isPublished,
        order: Number(moduleForm.order),
      };
      if (editingModule) {
        await apiFetch(`/academy/modules/${editingModule.id}`, { session: s, method: 'PATCH', body });
      } else {
        await apiFetch('/academy/modules', { session: s, method: 'POST', body });
      }
      setShowModuleForm(false);
      await loadModules();
    } catch {
      alert('Erro ao salvar módulo.');
    } finally {
      setSavingModule(false);
    }
  }

  async function handleTogglePublish(mod: AcademyModule) {
    if (!s?.accessToken) return;
    try {
      await apiFetch(`/academy/modules/${mod.id}`, {
        session: s,
        method: 'PATCH',
        body: { isPublished: !mod.isPublished },
      });
      await loadModules();
    } catch {
      alert('Erro ao atualizar publicação.');
    }
  }

  // ── Lesson CRUD ──────────────────────────────────────────────────────────

  function openCreateLesson(moduleId: string) {
    setEditingLesson(null);
    setLessonForm(emptyLessonForm());
    setShowLessonForm(moduleId);
  }

  function openEditLesson(lesson: Lesson, moduleId: string) {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description,
      youtubeUrl: lesson.youtubeUrl ?? '',
      order: String(lesson.order),
    });
    setShowLessonForm(moduleId);
  }

  async function handleSaveLesson(moduleId: string) {
    if (!s?.accessToken) return;
    setSavingLesson(true);
    try {
      const body = {
        title: lessonForm.title,
        description: lessonForm.description,
        youtubeUrl: lessonForm.youtubeUrl || undefined,
        order: Number(lessonForm.order),
      };
      if (editingLesson) {
        await apiFetch(`/academy/lessons/${editingLesson.id}`, { session: s, method: 'PATCH', body });
      } else {
        await apiFetch(`/academy/modules/${moduleId}/lessons`, { session: s, method: 'POST', body });
      }
      setShowLessonForm(null);
      await loadModules();
    } catch {
      alert('Erro ao salvar aula.');
    } finally {
      setSavingLesson(false);
    }
  }

  // ── Material CRUD ────────────────────────────────────────────────────────

  async function handleAddMaterial(lessonId: string) {
    if (!s?.accessToken || !materialTitle.trim() || !materialUrl.trim()) return;
    setSavingMaterial(true);
    try {
      await apiFetch(`/academy/lessons/${lessonId}/materials`, {
        session: s,
        method: 'POST',
        body: { title: materialTitle, url: materialUrl },
      });
      setShowMaterialForm(null);
      setMaterialTitle('');
      setMaterialUrl('');
      await loadModules();
    } catch {
      alert('Erro ao adicionar material.');
    } finally {
      setSavingMaterial(false);
    }
  }

  async function handleDeleteMaterial(materialId: string) {
    if (!s?.accessToken) return;
    if (!confirm('Remover este material?')) return;
    try {
      await apiFetch(`/academy/materials/${materialId}`, { session: s, method: 'DELETE' });
      await loadModules();
    } catch {
      alert('Erro ao remover material.');
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Academia Globus Dei</h1>
            <p className="text-sm text-muted-foreground">Gerenciar módulos e aulas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push('/colaborador/academy/duvidas')}>
            <BookOpen className="h-4 w-4" />
            Dúvidas
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push('/colaborador/academy/trabalhos')}>
            <GraduationCap className="h-4 w-4" />
            Trabalhos
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreateModule}>
            <Plus className="h-4 w-4" />
            Novo Módulo
          </Button>
        </div>
      </div>

      {/* Module Form */}
      {showModuleForm && (
        <Card className="border-primary/30 shadow-md">
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-base font-semibold text-foreground">
              {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Título *</label>
                <Input
                  placeholder="Ex: Fundamentos do Empreendedorismo Cristão"
                  value={moduleForm.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModuleForm({ ...moduleForm, title: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Descrição *</label>
                <Textarea
                  rows={2}
                  placeholder="Breve descrição do módulo…"
                  value={moduleForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setModuleForm({ ...moduleForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">URL da Capa</label>
                <Input
                  placeholder="https://…"
                  value={moduleForm.coverUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModuleForm({ ...moduleForm, coverUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Ordem</label>
                <Input
                  type="number"
                  min={0}
                  value={moduleForm.order}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModuleForm({ ...moduleForm, order: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Instruções do Trabalho Final *</label>
                <Textarea
                  rows={3}
                  placeholder="Descreva o que o agente deve entregar como trabalho final deste módulo…"
                  value={moduleForm.workInstructions}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setModuleForm({ ...moduleForm, workInstructions: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  id="isPublished"
                  type="checkbox"
                  checked={moduleForm.isPublished}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModuleForm({ ...moduleForm, isPublished: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="isPublished" className="text-sm text-foreground cursor-pointer">
                  Publicar módulo (visível para agentes)
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" className="gap-2" disabled={savingModule} onClick={handleSaveModule}>
                {savingModule && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowModuleForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {modules.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-base font-medium text-muted-foreground">Nenhum módulo criado ainda.</p>
            <p className="mt-1 text-sm text-muted-foreground">Clique em &quot;Novo Módulo&quot; para começar.</p>
          </CardContent>
        </Card>
      )}

      {/* Module list */}
      <div className="space-y-4">
        {modules.map((mod) => {
          const isExpanded = expandedModule === mod.id;

          return (
            <Card key={mod.id} className="overflow-hidden">
              {/* Module header */}
              <div className="flex items-center justify-between bg-muted/30 px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 cursor-pointer"
                    onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-primary" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div
                    className="min-w-0 cursor-pointer"
                    onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{mod.title}</p>
                      {mod.isPublished ? (
                        <Badge variant="default" className="text-[10px] shrink-0">Publicado</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] shrink-0">Rascunho</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {mod.lessons.length} aula{mod.lessons.length !== 1 ? 's' : ''} · {mod._count.enrollments} matrículas · {mod._count.certifications} certificações
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 ml-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title={mod.isPublished ? 'Despublicar' : 'Publicar'}
                    onClick={() => handleTogglePublish(mod)}
                  >
                    {mod.isPublished ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditModule(mod)}
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              {/* Module expanded content */}
              {isExpanded && (
                <CardContent className="space-y-4 pt-4">
                  {/* Description */}
                  <p className="text-sm text-muted-foreground">{mod.description}</p>
                  {mod.workInstructions && (
                    <div className="rounded-lg bg-muted/30 px-4 py-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Trabalho final</p>
                      <p className="text-sm text-foreground">{mod.workInstructions}</p>
                    </div>
                  )}

                  <Separator />

                  {/* Lessons */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Aulas</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => openCreateLesson(mod.id)}
                      >
                        <Plus className="h-3 w-3" />
                        Nova Aula
                      </Button>
                    </div>

                    {/* Lesson form */}
                    {showLessonForm === mod.id && (
                      <Card className="border-dashed">
                        <CardContent className="space-y-3 pt-4">
                          <p className="text-xs font-semibold text-foreground">
                            {editingLesson ? 'Editar Aula' : 'Nova Aula'}
                          </p>
                          <Input
                            placeholder="Título da aula *"
                            value={lessonForm.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLessonForm({ ...lessonForm, title: e.target.value })}
                          />
                          <Textarea
                            rows={2}
                            placeholder="Descrição da aula *"
                            value={lessonForm.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLessonForm({ ...lessonForm, description: e.target.value })}
                          />
                          <Input
                            placeholder="URL do vídeo no YouTube (opcional)"
                            value={lessonForm.youtubeUrl}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLessonForm({ ...lessonForm, youtubeUrl: e.target.value })}
                          />
                          <Input
                            type="number"
                            min={0}
                            placeholder="Ordem (ex: 1)"
                            value={lessonForm.order}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLessonForm({ ...lessonForm, order: e.target.value })}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={savingLesson}
                              onClick={() => handleSaveLesson(mod.id)}
                            >
                              {savingLesson && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                              Salvar
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowLessonForm(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {mod.lessons.length === 0 && showLessonForm !== mod.id && (
                      <p className="text-xs text-muted-foreground italic">Nenhuma aula cadastrada.</p>
                    )}

                    {mod.lessons
                      .sort((a, b) => a.order - b.order)
                      .map((lesson) => (
                        <div key={lesson.id} className="rounded-lg border bg-background px-4 py-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">{lesson.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{lesson.description}</p>
                              {lesson.youtubeUrl && (
                                <p className="text-xs text-primary truncate max-w-xs mt-0.5">{lesson.youtubeUrl}</p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openEditLesson(lesson, mod.id)}
                              >
                                <Pencil className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>

                          {/* Materials */}
                          <div className="pl-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Materiais</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 gap-1 text-[10px] px-1"
                                onClick={() => {
                                  setShowMaterialForm(lesson.id);
                                  setMaterialTitle('');
                                  setMaterialUrl('');
                                }}
                              >
                                <Plus className="h-2.5 w-2.5" />
                                Adicionar
                              </Button>
                            </div>

                            {showMaterialForm === lesson.id && (
                              <div className="flex items-center gap-2">
                                <Input
                                  className="h-7 text-xs"
                                  placeholder="Título"
                                  value={materialTitle}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaterialTitle(e.target.value)}
                                />
                                <Input
                                  className="h-7 text-xs"
                                  placeholder="URL"
                                  value={materialUrl}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaterialUrl(e.target.value)}
                                />
                                <Button
                                  size="sm"
                                  className="h-7 text-xs"
                                  disabled={savingMaterial}
                                  onClick={() => handleAddMaterial(lesson.id)}
                                >
                                  {savingMaterial ? <Loader2 className="h-3 w-3 animate-spin" /> : 'OK'}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setShowMaterialForm(null)}
                                >
                                  ✕
                                </Button>
                              </div>
                            )}

                            {lesson.materials.length === 0 && showMaterialForm !== lesson.id && (
                              <p className="text-[10px] text-muted-foreground italic">Nenhum material.</p>
                            )}

                            {lesson.materials.map((m) => (
                              <div key={m.id} className="flex items-center justify-between rounded bg-muted/30 px-2 py-1">
                                <a
                                  href={m.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline truncate max-w-xs"
                                >
                                  {m.title}
                                </a>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteMaterial(m.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
