import { notFound } from 'next/navigation';
import {
  Globe,
  MapPin,
  BookOpen,
  Briefcase,
  GraduationCap,
  Award,
  ExternalLink,
  Church,
} from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';

interface PublicAgentProfile {
  id: string;
  name: string;
  slug: string;
  publicBio: string | null;
  shortDescription: string | null;
  photoUrl: string | null;
  coverUrl: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  portfolioUrl: string | null;
  currentDenomination: string | null;
  vocationalAreas: { vocationalArea: { id: string; name: string } }[];
  skills: { skill: { id: string; name: string } }[];
  languages: { language: { id: string; name: string }; proficiencyLevel: string }[];
  experiences: {
    id: string;
    title: string;
    organization: string | null;
    startDate: string;
    endDate: string | null;
    description: string | null;
    experienceType: { name: string } | null;
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string | null;
    startDate: string;
    endDate: string | null;
  }[];
  courses: {
    id: string;
    name: string;
    institution: string | null;
    issueDate: string | null;
  }[];
}

async function fetchPublicProfile(slug: string): Promise<PublicAgentProfile | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_MAIN_SERVICE_URL ?? 'http://localhost:3001';
    const res = await fetch(`${baseUrl}/api/agents/public/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function formatYear(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).getFullYear().toString();
}

function proficiencyLabel(level: string): string {
  const map: Record<string, string> = {
    NATIVE: 'Nativo',
    FLUENT: 'Fluente',
    ADVANCED: 'Avançado',
    INTERMEDIATE: 'Intermediário',
    BASIC: 'Básico',
  };
  return map[level] ?? level;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await fetchPublicProfile(slug);
  if (!agent) return { title: 'Perfil não encontrado | Globus Dei' };
  return {
    title: `${agent.name} | Globus Dei`,
    description: agent.shortDescription ?? agent.publicBio ?? undefined,
  };
}

export default async function PublicAgentProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await fetchPublicProfile(slug);

  if (!agent) {
    notFound();
  }

  const location = [agent.city, agent.state, agent.country].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-[#faf7f4]">
      {/* Cover */}
      <div
        className="h-40 md:h-56 w-full bg-gradient-to-br from-primary/80 to-orange-400"
        style={agent.coverUrl ? { backgroundImage: `url(${agent.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      />

      <div className="container mx-auto max-w-4xl px-4 pb-16">
        {/* Avatar + Header */}
        <div className="flex flex-col sm:flex-row items-start gap-5 -mt-12 mb-8">
          <div className="h-24 w-24 rounded-full border-4 border-white bg-muted overflow-hidden flex-shrink-0 shadow">
            {agent.photoUrl ? (
              <img src={agent.photoUrl} alt={agent.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-muted-foreground bg-orange-100">
                {agent.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="mt-14 sm:mt-6 flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
            {agent.shortDescription && (
              <p className="text-sm text-muted-foreground mt-0.5">{agent.shortDescription}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {location}
                </span>
              )}
              {agent.currentDenomination && (
                <span className="flex items-center gap-1">
                  <Church className="h-3.5 w-3.5" /> {agent.currentDenomination}
                </span>
              )}
              {agent.portfolioUrl && (
                <a
                  href={agent.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Site / Portfólio
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
          {/* Main column */}
          <div className="space-y-6">
            {/* Bio */}
            {agent.publicBio && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" /> Sobre
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{agent.publicBio}</p>
                </CardContent>
              </Card>
            )}

            {/* Experiences */}
            {agent.experiences.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" /> Experiências
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {agent.experiences.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{exp.title}</p>
                          {exp.organization && (
                            <p className="text-xs text-muted-foreground">{exp.organization}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatYear(exp.startDate)} – {exp.endDate ? formatYear(exp.endDate) : 'Atual'}
                        </span>
                      </div>
                      {exp.description && (
                        <p className="text-xs text-muted-foreground mt-1">{exp.description}</p>
                      )}
                      <Separator className="mt-3" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {agent.education.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" /> Formação Acadêmica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agent.education.map((edu) => (
                    <div key={edu.id} className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{edu.degree}{edu.fieldOfStudy ? ` em ${edu.fieldOfStudy}` : ''}</p>
                        <p className="text-xs text-muted-foreground">{edu.institution}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatYear(edu.startDate)} – {edu.endDate ? formatYear(edu.endDate) : 'Atual'}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Courses */}
            {agent.courses.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" /> Cursos & Certificações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {agent.courses.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{c.name}</p>
                        {c.institution && <p className="text-xs text-muted-foreground">{c.institution}</p>}
                      </div>
                      {c.issueDate && (
                        <span className="text-xs text-muted-foreground">{formatYear(c.issueDate)}</span>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Vocational Areas */}
            {agent.vocationalAreas.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> Áreas de Atuação
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {agent.vocationalAreas.map(({ vocationalArea }) => (
                    <Badge key={vocationalArea.id} variant="secondary">{vocationalArea.name}</Badge>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {agent.skills.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Habilidades</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {agent.skills.map(({ skill }) => (
                    <Badge key={skill.id} variant="outline">{skill.name}</Badge>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Languages */}
            {agent.languages.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Idiomas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {agent.languages.map(({ language, proficiencyLevel }) => (
                    <div key={language.id} className="flex items-center justify-between text-sm">
                      <span>{language.name}</span>
                      <span className="text-xs text-muted-foreground">{proficiencyLabel(proficiencyLevel)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
