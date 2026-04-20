'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Building2, GraduationCap, Briefcase, Award, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { apiFetch } from '../../lib/api';
import { AppSession } from '../../lib/auth';

export type ProfileExperience = { id: string; title: string; organization: string; startDate: string; endDate?: string; description?: string; experienceType?: { name: string } };
export type ProfileEducation = { id: string; institution: string; course: string; degree?: string; startDate: string; endDate?: string; description?: string };
export type ProfileCourse = { id: string; title: string; institution: string; issueDate?: string; certificateUrl?: string; description?: string };

type ProfileHistoryTabProps = {
  session: AppSession;
  initialExperiences: ProfileExperience[];
  initialEducation: ProfileEducation[];
  initialCourses: ProfileCourse[];
  onChanged: () => void;
};

export function ProfileHistoryTab({ session, initialExperiences, initialEducation, initialCourses, onChanged }: ProfileHistoryTabProps) {
  const [experienceTypes, setExperienceTypes] = useState<{ id: string; name: string }[]>([]);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [isAddingEducation, setIsAddingEducation] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);

  // Forms
  const [expForm, setExpForm] = useState({ title: '', organization: '', location: '', startDate: '', endDate: '', description: '', experienceTypeId: '' });
  const [eduForm, setEduForm] = useState({ institution: '', course: '', degree: '', startDate: '', endDate: '', description: '' });
  const [courseForm, setCourseForm] = useState({ title: '', institution: '', issueDate: '', certificateUrl: '', description: '' });

  useEffect(() => {
    apiFetch('/system-config/experience-types', { session })
      .then(setExperienceTypes)
      .catch(console.error);
  }, [session]);

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/agents/me/experiences', {
      method: 'POST',
      session,
      body: JSON.stringify({
        ...expForm,
        startDate: new Date(expForm.startDate).toISOString(),
        endDate: expForm.endDate ? new Date(expForm.endDate).toISOString() : undefined,
      }),
    });
    setIsAddingExperience(false);
    onChanged();
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/agents/me/education', {
      method: 'POST',
      session,
      body: JSON.stringify({
        ...eduForm,
        startDate: new Date(eduForm.startDate).toISOString(),
        endDate: eduForm.endDate ? new Date(eduForm.endDate).toISOString() : undefined,
      }),
    });
    setIsAddingEducation(false);
    onChanged();
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/agents/me/courses', {
      method: 'POST',
      session,
      body: JSON.stringify({
        ...courseForm,
        issueDate: courseForm.issueDate ? new Date(courseForm.issueDate).toISOString() : undefined,
      }),
    });
    setIsAddingCourse(false);
    onChanged();
  };

  const handleDelete = async (type: 'experiences' | 'education' | 'courses', id: string) => {
    if (!confirm('Tem certeza?')) return;
    await apiFetch(`/agents/me/${type}/${id}`, {
      method: 'DELETE',
      session,
    });
    onChanged();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Atualmente';
    return format(new Date(dateStr), "MMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Experiências */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" /> Experiências</CardTitle>
            <CardDescription>Profissionais, ministeriais e voluntariado</CardDescription>
          </div>
          <Dialog open={isAddingExperience} onOpenChange={setIsAddingExperience}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => setExpForm({ title: '', organization: '', location: '', startDate: '', endDate: '', description: '', experienceTypeId: experienceTypes[0]?.id || '' })}><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Experiência</DialogTitle></DialogHeader>
              <form onSubmit={handleAddExperience} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm">Tipo</label>
                  <select className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={expForm.experienceTypeId} onChange={e => setExpForm(c => ({...c, experienceTypeId: e.target.value}))} required>
                    <option value="">Selecione...</option>
                    {experienceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1"><label className="text-sm">Título</label><Input required value={expForm.title} onChange={e => setExpForm(c => ({...c, title: e.target.value}))} /></div>
                <div className="space-y-1"><label className="text-sm">Organização</label><Input required value={expForm.organization} onChange={e => setExpForm(c => ({...c, organization: e.target.value}))} /></div>
                <div className="flex gap-4">
                  <div className="space-y-1 flex-1"><label className="text-sm">Início</label><Input type="date" required value={expForm.startDate} onChange={e => setExpForm(c => ({...c, startDate: e.target.value}))} /></div>
                  <div className="space-y-1 flex-1"><label className="text-sm">Fim</label><Input type="date" value={expForm.endDate} onChange={e => setExpForm(c => ({...c, endDate: e.target.value}))} /></div>
                </div>
                <div className="space-y-1"><label className="text-sm">Descrição</label><Textarea value={expForm.description} onChange={e => setExpForm(c => ({...c, description: e.target.value}))} /></div>
                <Button type="submit" className="w-full">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {initialExperiences.length === 0 && <p className="text-sm text-muted-foreground italic">Nenhuma experiência adicionada.</p>}
          {initialExperiences.map((exp: ProfileExperience) => (
            <div key={exp.id} className="relative pl-6 pb-4 border-l last:border-0 border-muted">
              <span className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{exp.title}</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5"/> {exp.organization} — {exp.experienceType?.name}</p>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> {formatDate(exp.startDate)} - {formatDate(exp.endDate)}</p>
                  {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete('experiences', exp.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Formação Acadêmica */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Formação Acadêmica</CardTitle>
          </div>
          <Dialog open={isAddingEducation} onOpenChange={setIsAddingEducation}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => setEduForm({ institution: '', course: '', degree: '', startDate: '', endDate: '', description: '' })}><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Formação Acadêmica</DialogTitle></DialogHeader>
              <form onSubmit={handleAddEducation} className="space-y-4">
                <div className="space-y-1"><label className="text-sm">Instituição</label><Input required value={eduForm.institution} onChange={e => setEduForm(c => ({...c, institution: e.target.value}))} /></div>
                <div className="space-y-1"><label className="text-sm">Curso</label><Input required value={eduForm.course} onChange={e => setEduForm(c => ({...c, course: e.target.value}))} /></div>
                <div className="space-y-1"><label className="text-sm">Grau (ex: Bacharelado)</label><Input value={eduForm.degree} onChange={e => setEduForm(c => ({...c, degree: e.target.value}))} /></div>
                <div className="flex gap-4">
                  <div className="space-y-1 flex-1"><label className="text-sm">Início</label><Input type="date" required value={eduForm.startDate} onChange={e => setEduForm(c => ({...c, startDate: e.target.value}))} /></div>
                  <div className="space-y-1 flex-1"><label className="text-sm">Fim</label><Input type="date" value={eduForm.endDate} onChange={e => setEduForm(c => ({...c, endDate: e.target.value}))} /></div>
                </div>
                <Button type="submit" className="w-full">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {initialEducation.length === 0 && <p className="text-sm text-muted-foreground italic">Nenhuma formação adicionada.</p>}
          {initialEducation.map((edu: ProfileEducation) => (
            <div key={edu.id} className="relative pl-6 pb-4 border-l last:border-0 border-muted">
              <span className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{edu.course} {edu.degree ? `(${edu.degree})` : ''}</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5"/> {edu.institution}</p>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> {formatDate(edu.startDate)} - {formatDate(edu.endDate)}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete('education', edu.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cursos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5" /> Cursos e Certificações</CardTitle>
          </div>
          <Dialog open={isAddingCourse} onOpenChange={setIsAddingCourse}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => setCourseForm({ title: '', institution: '', issueDate: '', certificateUrl: '', description: '' })}><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Curso</DialogTitle></DialogHeader>
              <form onSubmit={handleAddCourse} className="space-y-4">
                <div className="space-y-1"><label className="text-sm">Título</label><Input required value={courseForm.title} onChange={e => setCourseForm(c => ({...c, title: e.target.value}))} /></div>
                <div className="space-y-1"><label className="text-sm">Instituição</label><Input required value={courseForm.institution} onChange={e => setCourseForm(c => ({...c, institution: e.target.value}))} /></div>
                <div className="space-y-1"><label className="text-sm">Data de Conclusão</label><Input type="date" value={courseForm.issueDate} onChange={e => setCourseForm(c => ({...c, issueDate: e.target.value}))} /></div>
                <div className="space-y-1"><label className="text-sm">URL do Certificado (Opcional)</label><Input type="url" value={courseForm.certificateUrl} onChange={e => setCourseForm(c => ({...c, certificateUrl: e.target.value}))} /></div>
                <Button type="submit" className="w-full">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {initialCourses.length === 0 && <p className="text-sm text-muted-foreground italic">Nenhum curso adicionado.</p>}
          {initialCourses.map((course: ProfileCourse) => (
            <div key={course.id} className="relative pl-6 pb-4 border-l last:border-0 border-muted">
              <span className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{course.title}</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5"/> {course.institution}</p>
                  {course.issueDate && <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> {formatDate(course.issueDate)}</p>}
                  {course.certificateUrl && <a href={course.certificateUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline mt-1 block">Ver Certificado</a>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete('courses', course.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
