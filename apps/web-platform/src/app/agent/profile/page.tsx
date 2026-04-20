'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CheckCircle2, Loader2, Save, UserCircle } from 'lucide-react';

import { useAgentPortal } from '../../../components/portal/AgentPortalShell';
import { apiFetch } from '../../../lib/api';
import { formatAgentStatus, type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Separator } from '../../../components/ui/separator';
import { Textarea } from '../../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { ProfileHistoryTab, ProfileExperience, ProfileEducation, ProfileCourse } from '../../../components/profile/ProfileHistoryTab';
import { ProfileAbilitiesTab } from '../../../components/profile/ProfileAbilitiesTab';

type ProfileForm = {
  phone: string;
  publicBio: string;
  city: string;
  country: string;
  isActive: boolean;
  slug: string;
  photoUrl: string;
  coverUrl: string;
  state: string;
  currentDenomination: string;
  shortDescription: string;
  portfolioUrl: string;
  vocationalAreaIds: string[];
  skillIds: string[];
  languageRecords: { languageId: string; proficiencyLevel: string }[];
};

function agentStatusVariant(s?: string) {
  if (!s) return 'secondary' as const;
  if (s === 'APPROVED') return 'success' as const;
  if (s === 'REJECTED') return 'destructive' as const;
  if (s === 'QUALIFIED' || s === 'SCHEDULED') return 'info' as const;
  if (s === 'SUBMITTED') return 'warning' as const;
  return 'secondary' as const;
}

/**
 * AgentProfilePage lets the authenticated agent keep profile and public presentation up to date.
 */
export default function AgentProfilePage() {
  const { data: session } = useSession();
  const { agent, reloadAgent } = useAgentPortal();
  const [form, setForm] = useState<ProfileForm>({
    phone: '',
    publicBio: '',
    city: '',
    country: '',
    isActive: true,
    slug: '',
    photoUrl: '',
    coverUrl: '',
    state: '',
    currentDenomination: '',
    shortDescription: '',
    portfolioUrl: '',
    vocationalAreaIds: [],
    skillIds: [],
    languageRecords: [],
  });
  
  const [experiences, setExperiences] = useState<ProfileExperience[]>([]);
  const [education, setEducation] = useState<ProfileEducation[]>([]);
  const [courses, setCourses] = useState<ProfileCourse[]>([]);
  
  const [vocationalAreasList, setVocationalAreasList] = useState<{ id: string; name: string }[]>([]);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    Promise.all([
      apiFetch('/agents/me', { session: session as AppSession }),
      apiFetch('/system-config/vocational-areas', { session: session as AppSession })
    ])
      .then(([profile, areas]) => {
        setVocationalAreasList(areas);
        setForm({
          phone: profile.phone ?? '',
          publicBio: profile.publicBio ?? '',
          city: profile.city ?? '',
          country: profile.country ?? '',
          isActive: profile.isActive ?? true,
          slug: profile.slug ?? '',
          photoUrl: profile.photoUrl ?? '',
          coverUrl: profile.coverUrl ?? '',
          state: profile.state ?? '',
          currentDenomination: profile.currentDenomination ?? '',
          shortDescription: profile.shortDescription ?? '',
          portfolioUrl: profile.portfolioUrl ?? '',
          vocationalAreaIds: profile.vocationalAreas?.map((v: { vocationalAreaId: string }) => v.vocationalAreaId) ?? [],
          skillIds: profile.skills?.map((s: { skillId: string }) => s.skillId) ?? [],
          languageRecords: profile.languages?.map((l: { languageId: string; proficiencyLevel: string }) => ({ languageId: l.languageId, proficiencyLevel: l.proficiencyLevel })) ?? [],
        });
        setExperiences(profile.experiences ?? []);
        setEducation(profile.education ?? []);
        setCourses(profile.courses ?? []);
      })
      .catch((requestError) => setError((requestError as Error).message));
  }, [session]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    setError(null);

    try {
      await apiFetch('/agents/me', {
        method: 'PATCH',
        session: session as AppSession,
        body: JSON.stringify(form),
      });
      await reloadAgent();
      setStatus('saved');
    } catch (requestError) {
      setError((requestError as Error).message);
      setStatus('idle');
    }
  };

  const loadAgentProfile = () => {
    if (!session) return;
    apiFetch('/agents/me', { session: session as AppSession })
      .then((profile) => {
        setExperiences(profile.experiences ?? []);
        setEducation(profile.education ?? []);
        setCourses(profile.courses ?? []);
      })
      .catch(console.error);
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      {/* Form panel */}
      <Tabs defaultValue="identidade">
        <TabsList className="mb-4">
          <TabsTrigger value="identidade">Identidade</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="habilidades">Habilidades & Acadêmico</TabsTrigger>
        </TabsList>
      
        <TabsContent value="identidade">
          <Card>
        <CardHeader className="pb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Perfil operacional
          </p>
          <CardTitle className="mt-0.5 text-base">Dados do agente</CardTitle>
          <p className="text-sm text-muted-foreground">
            Atualize sua apresentação, localização e contexto ministerial para melhorar análise, conexão e visibilidade.
          </p>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Slug (Sua URL Base)</label>
                <div className="flex items-center">
                   <span className="bg-muted px-3 py-2 border border-r-0 border-border rounded-l-md text-sm text-muted-foreground flex-shrink-0">
                     globusdei.org/
                   </span>
                   <Input
                    className="rounded-l-none"
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="seu-nome"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Telefone</label>
                <Input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Denominação Atual</label>
                <Input
                  type="text"
                  value={form.currentDenomination}
                  onChange={(e) => setForm((c) => ({ ...c, currentDenomination: e.target.value }))}
                  placeholder="Ex: Igreja Batista..."
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Áreas de Atuação & Vocação</label>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {form.vocationalAreaIds.length === 0 ? (
                      <span className="text-sm text-muted-foreground italic">Nenhuma área selecionada</span>
                    ) : (
                      form.vocationalAreaIds.map((vId) => {
                        const area = vocationalAreasList.find(a => a.id === vId);
                        return area ? (
                          <Badge key={vId} variant="secondary" className="gap-1 px-2.5 py-1">
                            {area.name}
                            <button
                              type="button"
                              className="ml-1 text-muted-foreground hover:text-foreground"
                              onClick={() => setForm(c => ({
                                ...c,
                                vocationalAreaIds: c.vocationalAreaIds.filter(id => id !== vId)
                              }))}
                            >
                              &times;
                            </button>
                          </Badge>
                        ) : null;
                      })
                    )}
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="w-fit">
                        Adicionar área de atuação
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Selecione as áreas de atuação</DialogTitle>
                      </DialogHeader>
                      <div className="max-h-[300px] overflow-y-auto space-y-2 mt-4 px-1">
                        {vocationalAreasList.map((area) => {
                          const isSelected = form.vocationalAreaIds.includes(area.id);
                          return (
                            <label key={area.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border transition-colors">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-border accent-primary"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setForm(c => ({ ...c, vocationalAreaIds: [...c.vocationalAreaIds, area.id] }));
                                  } else {
                                    setForm(c => ({ ...c, vocationalAreaIds: c.vocationalAreaIds.filter(id => id !== area.id) }));
                                  }
                                }}
                              />
                              <span className="text-sm font-medium">{area.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Descrição Resumida (Abaixo do Nome)</label>
                <Input
                  type="text"
                  value={form.shortDescription}
                  onChange={(e) => setForm((c) => ({ ...c, shortDescription: e.target.value }))}
                  placeholder="Ex: Missionário servindo no Oriente Médio"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Cidade base</label>
                <Input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))}
                  placeholder="Cidade"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Estado</label>
                <Input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm((c) => ({ ...c, state: e.target.value }))}
                  placeholder="Estado"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">País</label>
                <Input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm((c) => ({ ...c, country: e.target.value }))}
                  placeholder="País"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Portfólio ou Site Externo (URL)</label>
                <Input
                  type="url"
                  value={form.portfolioUrl}
                  onChange={(e) => setForm((c) => ({ ...c, portfolioUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Bio pública</label>
              <Textarea
                rows={4}
                value={form.publicBio}
                onChange={(e) => setForm((c) => ({ ...c, publicBio: e.target.value }))}
                placeholder="Resumo enxuto para apresentação pública dentro da plataforma."
              />
            </div>

            {/* Toggle ativo */}
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Perfil ativo</p>
                <p className="text-xs text-muted-foreground">
                  Permite que sua presença continue ativa na rede.
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((c) => ({ ...c, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-border accent-primary"
              />
            </label>

            <div className="flex items-center justify-between gap-4 pt-1">
              {status === 'saved' ? (
                <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Perfil salvo com sucesso.
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Mantenha esses dados atualizados para facilitar a análise da equipe.
                </span>
              )}
              <Button type="submit" disabled={status === 'saving'}>
                {status === 'saving' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {status === 'saving' ? 'Salvando…' : 'Salvar perfil'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </TabsContent>
      
      <TabsContent value="historico">
        <ProfileHistoryTab 
           session={session as AppSession} 
           initialExperiences={experiences} 
           initialEducation={education} 
           initialCourses={courses} 
           onChanged={loadAgentProfile} 
        />
      </TabsContent>

      <TabsContent value="habilidades">
        <ProfileAbilitiesTab 
           session={session as AppSession}
           form={form}
           setForm={setForm}
           handleSubmit={handleSubmit}
           status={status}
        />
      </TabsContent>
      
      </Tabs>

      {/* Summary sidebar */}
      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{agent?.name ?? 'Agente'}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Status
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant={agentStatusVariant(agent?.status)}>
                  {formatAgentStatus(agent?.status)}
                </Badge>
              </div>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Email
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {agent?.email ?? 'Sem email'}
              </p>
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Próximos passos
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Garanta que sua descrição reflita sua atuação missionária atual.</p>
            <p>2. Revise a bio pública antes de divulgar sua presença na rede.</p>
            <p>3. Use a tela de onboarding para acompanhar aprovação e entrevista.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
