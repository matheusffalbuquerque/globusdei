'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Wifi,
  Calendar,
  Building2,
  User,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';

import { useCollaboratorPortal } from '../../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../../lib/api';
import { type AppSession } from '../../../../lib/auth';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Separator } from '../../../../components/ui/separator';

// ─── Types ────────────────────────────────────────────────────────────────────

type Opportunity = {
  id: string;
  title: string;
  description: string;
  category: string;
  location?: string | null;
  isRemote: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  authorCollaborator?: { id: string; name: string } | null;
  authorAgent?: { id: string; name: string } | null;
  empreendimento?: { id: string; name: string } | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_BADGE: Record<string, 'default' | 'info' | 'success' | 'warning' | 'secondary'> = {
  STUDIES: 'info',
  VOLUNTEERING: 'success',
  EMPLOYMENT: 'default',
  MISSION: 'warning',
  ROLE: 'secondary',
  TRAVEL: 'info',
  OTHER: 'secondary',
};

const CATEGORY_LABEL: Record<string, string> = {
  STUDIES: 'Estudos',
  VOLUNTEERING: 'Voluntariado',
  EMPLOYMENT: 'Emprego',
  MISSION: 'Missão',
  ROLE: 'Função',
  TRAVEL: 'Viagem',
  OTHER: 'Outro',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CollaboratorOpportunityDetailPage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = permissions.canManageContent || permissions.canManageProjects;

  useEffect(() => {
    if (!session || !params.id) return;
    setIsLoading(true);
    apiFetch(`/opportunities/${params.id}`, { session: session as AppSession })
      .then((data) => { setOpportunity(data); setError(null); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [session, params.id]);

  const handleTogglePublish = async () => {
    if (!opportunity) return;
    setIsActing(true);
    try {
      const updated = await apiFetch(`/opportunities/${opportunity.id}`, {
        method: 'PATCH',
        session: session as AppSession,
        body: { isPublished: !opportunity.isPublished },
      });
      setOpportunity(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsActing(false);
    }
  };

  const handleDelete = async () => {
    if (!opportunity || !confirm('Remover esta oportunidade permanentemente?')) return;
    setIsActing(true);
    try {
      await apiFetch(`/opportunities/${opportunity.id}`, {
        method: 'DELETE',
        session: session as AppSession,
      });
      router.push('/colaborador/opportunities');
    } catch (err) {
      setError((err as Error).message);
      setIsActing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error ?? 'Oportunidade não encontrada.'}
        </div>
      </div>
    );
  }

  const publisher =
    opportunity.empreendimento?.name ??
    opportunity.authorAgent?.name ??
    opportunity.authorCollaborator?.name ??
    'GlobusDei';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ── Navegação ── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 -ml-1">
          <ArrowLeft className="h-4 w-4" /> Oportunidades
        </Button>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={isActing}
              onClick={handleTogglePublish}
            >
              {opportunity.isPublished ? (
                <><EyeOff className="h-3.5 w-3.5" /> Ocultar</>
              ) : (
                <><Eye className="h-3.5 w-3.5" /> Publicar</>
              )}
            </Button>
            <Link href={`/colaborador/opportunities/${opportunity.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5" disabled={isActing}>
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              disabled={isActing}
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" /> Remover
            </Button>
          </div>
        )}
      </div>

      {/* ── Card principal ── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={CATEGORY_BADGE[opportunity.category] ?? 'secondary'}>
              {CATEGORY_LABEL[opportunity.category] ?? opportunity.category}
            </Badge>
            {opportunity.isRemote && (
              <Badge variant="outline" className="gap-1">
                <Wifi className="h-3 w-3" /> Remota
              </Badge>
            )}
            {!opportunity.isPublished && (
              <Badge variant="secondary">Rascunho</Badge>
            )}
          </div>
          <CardTitle className="mt-3 text-xl leading-snug">{opportunity.title}</CardTitle>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {!opportunity.isRemote && opportunity.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                {opportunity.location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 shrink-0" />
              {new Date(opportunity.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-5 space-y-5">
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Descrição
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {opportunity.description}
            </p>
          </div>

          <Separator />

          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Publicado por
            </h2>
            <div className="flex items-center gap-2 text-sm text-foreground">
              {opportunity.empreendimento ? (
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="font-medium">{publisher}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground pt-1">
            <div>
              <span className="font-medium text-foreground/70">Criado em</span>
              <p>{new Date(opportunity.createdAt).toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <span className="font-medium text-foreground/70">Atualizado em</span>
              <p>{new Date(opportunity.updatedAt).toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
