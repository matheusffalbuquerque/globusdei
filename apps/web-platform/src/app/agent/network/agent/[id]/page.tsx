'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Globe,
  Mail,
  MapPin,
  UserCheck,
  UserPlus,
  X,
  Building2,
  Briefcase,
  GraduationCap,
  Award,
  Calendar,
  Lightbulb,
  Languages,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { apiFetch } from '../../../../../lib/api';
import { type AppSession } from '../../../../../lib/auth';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent } from '../../../../../components/ui/card';
import { Separator } from '../../../../../components/ui/separator';

type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

type AgentDetail = {
  id: string;
  name: string;
  email: string;
  city: string | null;
  country: string | null;
  publicBio: string | null;
  status: string;
  connection: {
    id: string;
    status: ConnectionStatus;
    isSender: boolean;
  } | null;
  experiences?: { id: string; title: string; organization: string; startDate: string; endDate?: string; description?: string }[];
  education?: { id: string; course: string; degree?: string; institution: string; startDate: string; endDate?: string }[];
  courses?: { id: string; title: string; institution: string; issueDate?: string }[];
  skills?: { skill: { id: string; name: string } }[];
  languages?: { language: { id: string; name: string }; proficiencyLevel: string }[];
  vocationalAreas?: { vocationalArea: { id: string; name: string } }[];
};

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

export default function AgentProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const agentId = params?.id as string;

  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const s = session as AppSession;

  const loadAgent = async () => {
    if (!session || !agentId) return;
    try {
      const [all, agentProfile] = await Promise.all([
        apiFetch('/connections/agents', { session: s }),
        apiFetch(`/agents/${agentId}`, { session: s })
      ]);
      const found = all.find((a: AgentDetail) => a.id === agentId);
      if (!found) throw new Error('Agente não encontrado.');
      setAgent({ ...agentProfile, connection: found.connection });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) void loadAgent();
  }, [session, agentId]);

  const handleConnect = async () => {
    if (!agent) return;
    setActionLoading(true);
    try {
      await apiFetch('/connections/requests', {
        method: 'POST', session: s,
        body: JSON.stringify({ receiverId: agent.id }),
      });
      await loadAgent();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!agent?.connection) return;
    setActionLoading(true);
    try {
      await apiFetch(`/connections/${agent.connection.id}/accept`, { method: 'POST', session: s });
      await loadAgent();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!agent?.connection) return;
    setActionLoading(true);
    try {
      await apiFetch(`/connections/${agent.connection.id}/reject`, { method: 'POST', session: s });
      await loadAgent();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!agent?.connection) return;
    setActionLoading(true);
    try {
      await apiFetch(`/connections/${agent.connection.id}`, { method: 'DELETE', session: s });
      await loadAgent();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Agente não encontrado.'}
        </div>
      </div>
    );
  }

  const conn = agent.connection;
  const isAccepted = conn?.status === 'ACCEPTED';
  const isPendingReceived = conn?.status === 'PENDING' && !conn.isSender;
  const isPendingSent = conn?.status === 'PENDING' && conn.isSender;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Voltar para Rede Global
      </Button>

      <Card>
        {/* Banner */}
        <div className="relative h-32 rounded-t-xl bg-gradient-to-br from-primary/20 to-primary/5">
          <div className="absolute -bottom-8 left-6 flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-primary/15 text-xl font-bold text-primary shadow-md">
            {initials(agent.name)}
          </div>
        </div>

        <CardContent className="pt-12 pb-6">
          {/* Actions header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">{agent.name}</h1>
            </div>

            <div className="flex shrink-0 gap-2">
              {!conn && (
                <Button size="sm" className="gap-1.5" disabled={actionLoading} onClick={handleConnect}>
                  <UserPlus className="h-4 w-4" /> Conectar
                </Button>
              )}
              {isPendingReceived && (
                <>
                  <Button size="sm" className="gap-1.5" disabled={actionLoading} onClick={handleAccept}>
                    <CheckCircle2 className="h-4 w-4" /> Aceitar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" disabled={actionLoading} onClick={handleReject}>
                    <X className="h-4 w-4" /> Recusar
                  </Button>
                </>
              )}
              {(isAccepted || isPendingSent) && (
                <Button size="sm" variant="outline" className="text-muted-foreground" disabled={actionLoading} onClick={handleRemove}>
                  {isAccepted ? 'Desconectar' : 'Cancelar solicitação'}
                </Button>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="mt-3">
            {isAccepted && (
              <Badge variant="secondary" className="gap-1 text-emerald-600">
                <UserCheck className="h-3 w-3" /> Conectado
              </Badge>
            )}
            {isPendingSent && (
              <Badge variant="secondary" className="gap-1 text-amber-600">
                <Clock className="h-3 w-3" /> Solicitação enviada
              </Badge>
            )}
            {isPendingReceived && (
              <Badge variant="secondary" className="gap-1 text-blue-600">
                <Clock className="h-3 w-3" /> Solicitação recebida
              </Badge>
            )}
          </div>

          <Separator className="my-5" />

          {/* Info fields */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Email</p>
                <p className="text-sm text-foreground">{agent.email}</p>
              </div>
            </div>

            {(agent.city || agent.country) && (
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Localização</p>
                  <p className="text-sm text-foreground">
                    {[agent.city, agent.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</p>
                <Badge variant="outline" className="mt-0.5 text-xs capitalize">
                  {agent.status?.toLowerCase() ?? 'ativo'}
                </Badge>
              </div>
            </div>
          </div>

          {agent.publicBio && (
            <>
              <Separator className="my-5" />
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Sobre</p>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{agent.publicBio}</p>
              </div>
            </>
          )}

          {/* Habilidades e Idiomas */}
          {(agent.skills?.length > 0 || agent.languages?.length > 0 || agent.vocationalAreas?.length > 0) && (
            <>
              <Separator className="my-5" />
              <div className="space-y-4">
                {agent.vocationalAreas?.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Áreas de Atuação</p>
                    <div className="flex flex-wrap gap-2">
                      {agent.vocationalAreas.map((v: { vocationalArea: { id: string, name: string } }) => (
                        <Badge key={v.vocationalArea.id} variant="secondary">{v.vocationalArea.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {agent.skills?.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"><Lightbulb className="w-3 h-3" /> Competências</p>
                    <div className="flex flex-wrap gap-2">
                      {agent.skills.map((s: { skill: { id: string, name: string } }) => (
                        <Badge key={s.skill.id} variant="outline" className="border-primary/20 bg-primary/5">{s.skill.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {agent.languages?.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"><Languages className="w-3 h-3" /> Idiomas</p>
                    <div className="flex flex-wrap gap-2">
                      {agent.languages.map((l: { language: { id: string, name: string }; proficiencyLevel: string }) => (
                         <Badge key={l.language.id} variant="secondary">
                           {l.language.name} <span className="opacity-50 ml-1">({l.proficiencyLevel})</span>
                         </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Histórico */}
          {(agent.experiences?.length > 0 || agent.education?.length > 0 || agent.courses?.length > 0) && (
            <>
              <Separator className="my-5" />
              <div className="space-y-6">
                {agent.experiences?.length > 0 && (
                  <div>
                    <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5"/> Experiência</p>
                    <div className="space-y-4">
                      {agent.experiences.map((exp: { id: string; title: string; organization: string; startDate: string; endDate?: string; description?: string }) => (
                        <div key={exp.id} className="relative pl-4 border-l-2 border-muted">
                          <h4 className="font-semibold text-sm">{exp.title}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5"><Building2 className="w-3 h-3"/> {exp.organization}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5"><Calendar className="w-3 h-3"/> {exp.startDate ? format(new Date(exp.startDate), "MMM yyyy", { locale: ptBR }) : ''} - {exp.endDate ? format(new Date(exp.endDate), "MMM yyyy", { locale: ptBR }) : 'Atualmente'}</p>
                          {exp.description && <p className="text-sm mt-1.5 text-muted-foreground line-clamp-3">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {agent.education?.length > 0 && (
                  <div>
                    <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5"/> Formação Acadêmica</p>
                    <div className="space-y-4">
                      {agent.education.map((edu: { id: string; course: string; degree?: string; institution: string; startDate: string; endDate?: string }) => (
                        <div key={edu.id} className="relative pl-4 border-l-2 border-muted">
                          <h4 className="font-semibold text-sm">{edu.course} {edu.degree ? `(${edu.degree})` : ''}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5"><Building2 className="w-3 h-3"/> {edu.institution}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5"><Calendar className="w-3 h-3"/> {edu.startDate ? format(new Date(edu.startDate), "MMM yyyy", { locale: ptBR }) : ''} - {edu.endDate ? format(new Date(edu.endDate), "MMM yyyy", { locale: ptBR }) : 'Concluído'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {agent.courses?.length > 0 && (
                  <div>
                    <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Award className="w-3.5 h-3.5"/> Cursos e Certificações</p>
                    <div className="space-y-4">
                      {agent.courses.map((course: { id: string; title: string; institution: string; issueDate?: string }) => (
                        <div key={course.id} className="relative pl-4 border-l-2 border-muted">
                          <h4 className="font-semibold text-sm">{course.title}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5"><Building2 className="w-3 h-3"/> {course.institution}</p>
                          {course.issueDate && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5"><Calendar className="w-3 h-3"/> Emitido em {format(new Date(course.issueDate), "MMM yyyy", { locale: ptBR })}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
