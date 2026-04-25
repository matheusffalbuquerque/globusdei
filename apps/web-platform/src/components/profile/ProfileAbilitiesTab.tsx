'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../ui/card';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import {
  CheckCircle2,
  Loader2,
  Save,
  Plus,
  Lightbulb,
  Languages,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { AppSession } from '../../lib/auth';

export type ProfileForm = {
  phone: string;
  publicBio: string;
  city: string;
  country: string;
  isActive: boolean;
  slug: string;
  photoFileId: string;
  photoUrl: string;
  coverFileId: string;
  coverUrl: string;
  state: string;
  currentDenomination: string;
  shortDescription: string;
  portfolioFileId: string;
  portfolioUrl: string;
  vocationalAreaIds: string[];
  skillIds: string[];
  languageRecords: { languageId: string; proficiencyLevel: string }[];
};

export type ProfileAbilitiesTabProps = {
  session: AppSession;
  form: ProfileForm;
  setForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  status: 'idle' | 'saving' | 'saved';
  isSaveDisabled?: boolean;
};

const proficiencyLevels = [
  { id: 'BASIC', name: 'Básico' },
  { id: 'INTERMEDIATE', name: 'Intermediário' },
  { id: 'ADVANCED', name: 'Avançado' },
  { id: 'FLUENT', name: 'Fluente' },
  { id: 'NATIVE', name: 'Nativo' },
];

export function ProfileAbilitiesTab({
  session,
  form,
  setForm,
  handleSubmit,
  status,
  isSaveDisabled = false,
}: ProfileAbilitiesTabProps) {
  const [skillsList, setSkillsList] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [languagesList, setLanguagesList] = useState<
    { id: string; name: string }[]
  >([]);

  useEffect(() => {
    Promise.all([
      apiFetch('/system-config/skills', { session }),
      apiFetch('/system-config/languages', { session }),
    ])
      .then(([skills, langs]) => {
        setSkillsList(skills);
        setLanguagesList(langs);
      })
      .catch(console.error);
  }, [session]);

  const removeSkill = (id: string) => {
    setForm((c: ProfileForm) => ({
      ...c,
      skillIds: c.skillIds.filter((sId: string) => sId !== id),
    }));
  };

  const removeLanguage = (id: string) => {
    setForm((c: ProfileForm) => ({
      ...c,
      languageRecords: c.languageRecords.filter(
        (l: { languageId: string }) => l.languageId !== id,
      ),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" /> Competências Profissionais e
              Ministeriais
            </CardTitle>
            <CardDescription>
              Múltiplas habilidades conectadas ao projeto
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Selecionar Habilidades</DialogTitle>
              </DialogHeader>
              <div className="max-h-[300px] overflow-y-auto space-y-2 mt-4">
                {skillsList.map((skill) => {
                  const isSelected = form.skillIds.includes(skill.id);
                  return (
                    <label
                      key={skill.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded accent-primary text-primary"
                        checked={isSelected}
                        onChange={(e) =>
                          setForm((c: ProfileForm) => ({
                            ...c,
                            skillIds: e.target.checked
                              ? [...c.skillIds, skill.id]
                              : c.skillIds.filter(
                                  (id: string) => id !== skill.id,
                                ),
                          }))
                        }
                      />
                      <span className="text-sm font-medium">{skill.name}</span>
                    </label>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {form.skillIds.length === 0 ? (
              <span className="text-sm text-muted-foreground italic">
                Nenhuma habilidade selecionada
              </span>
            ) : (
              form.skillIds.map((sId: string) => {
                const skill = skillsList.find((s) => s.id === sId);
                return skill ? (
                  <Badge
                    key={sId}
                    variant="secondary"
                    className="gap-1 px-2.5 py-1"
                  >
                    {skill.name}
                    <button
                      type="button"
                      className="ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() => removeSkill(sId)}
                    >
                      &times;
                    </button>
                  </Badge>
                ) : null;
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5" /> Idiomas
            </CardTitle>
            <CardDescription>Idiomas que você domina</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Selecionar Idiomas</DialogTitle>
              </DialogHeader>
              <div className="max-h-[300px] overflow-y-auto space-y-4 mt-4">
                {languagesList.map((lang) => {
                  const existingRecord = form.languageRecords.find(
                    (r: { languageId: string }) => r.languageId === lang.id,
                  );
                  const isSelected = !!existingRecord;
                  return (
                    <div
                      key={lang.id}
                      className={`flex flex-col gap-2 p-3 rounded-md border ${isSelected ? 'border-primary/50 bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded accent-primary text-primary"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm((c: ProfileForm) => ({
                                ...c,
                                languageRecords: [
                                  ...c.languageRecords,
                                  {
                                    languageId: lang.id,
                                    proficiencyLevel: 'INTERMEDIATE',
                                  },
                                ],
                              }));
                            } else {
                              removeLanguage(lang.id);
                            }
                          }}
                        />
                        <span className="text-sm font-medium">{lang.name}</span>
                      </label>
                      {isSelected && (
                        <div className="ml-7">
                          <select
                            className="text-sm border border-input rounded-md px-2 py-1 bg-background w-full max-w-[200px]"
                            value={existingRecord.proficiencyLevel}
                            onChange={(e) => {
                              const newLevel = e.target.value;
                              setForm((c: ProfileForm) => ({
                                ...c,
                                languageRecords: c.languageRecords.map(
                                  (r: {
                                    languageId: string;
                                    proficiencyLevel: string;
                                  }) =>
                                    r.languageId === lang.id
                                      ? { ...r, proficiencyLevel: newLevel }
                                      : r,
                                ),
                              }));
                            }}
                          >
                            {proficiencyLevels.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {form.languageRecords.length === 0 ? (
              <span className="text-sm text-muted-foreground italic">
                Nenhum idioma selecionado
              </span>
            ) : (
              form.languageRecords.map(
                (record: { languageId: string; proficiencyLevel: string }) => {
                  const lang = languagesList.find(
                    (l) => l.id === record.languageId,
                  );
                  const prof = proficiencyLevels.find(
                    (p) => p.id === record.proficiencyLevel,
                  );
                  return lang ? (
                    <Badge
                      key={lang.id}
                      variant="secondary"
                      className="gap-1 px-3 py-1.5 flex items-center"
                    >
                      <span className="font-semibold">{lang.name}</span>
                      <span className="text-xs text-muted-foreground ml-1.5 border-l border-muted-foreground/30 pl-1.5">
                        {prof?.name}
                      </span>
                      <button
                        type="button"
                        className="ml-2 text-muted-foreground hover:text-foreground"
                        onClick={() => removeLanguage(lang.id)}
                      >
                        &times;
                      </button>
                    </Badge>
                  ) : null;
                },
              )
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4 pt-4 border-t mt-8">
        {status === 'saved' && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Alterações salvas.
          </span>
        )}
        <Button type="submit" disabled={status === 'saving' || isSaveDisabled}>
          {status === 'saving' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaveDisabled
            ? 'Carregando…'
            : status === 'saving'
              ? 'Salvando…'
              : 'Salvar todas as abas'}
        </Button>
      </div>
    </form>
  );
}
