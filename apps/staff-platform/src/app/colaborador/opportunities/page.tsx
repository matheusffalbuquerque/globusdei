'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  MapPin,
  Wifi,
  AlertCircle,
  ChevronRight,
  Filter,
  Plus,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import { type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Separator } from '../../../components/ui/separator';

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
  authorCollaborator?: { id: string; name: string } | null;
  authorAgent?: { id: string; name: string } | null;
  empreendimento?: { id: string; name: string } | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todas as categorias' },
  { value: 'STUDIES', label: 'Estudos' },
  { value: 'VOLUNTEERING', label: 'Voluntariado' },
  { value: 'EMPLOYMENT', label: 'Emprego' },
  { value: 'MISSION', label: 'Missão' },
  { value: 'ROLE', label: 'Função' },
  { value: 'TRAVEL', label: 'Viagem' },
  { value: 'OTHER', label: 'Outro' },
];

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

// ─── Card de oportunidade ─────────────────────────────────────────────────────

function OpportunityCard({
  op,
  canManage,
  onTogglePublish,
  onDelete,
}: {
  op: Opportunity;
  canManage: boolean;
  onTogglePublish: (id: string, published: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const publisher =
    op.empreendimento?.name ??
    op.authorAgent?.name ??
    op.authorCollaborator?.name ??
    'GlobusDei';

  return (
    <Card className={`transition-all hover:shadow-md ${!op.isPublished ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={CATEGORY_BADGE[op.category] ?? 'secondary'}>
              {CATEGORY_LABEL[op.category] ?? op.category}
            </Badge>
            {!op.isPublished && (
              <Badge variant="secondary" className="text-[10px]">Rascunho</Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(op.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
        <CardTitle className="mt-2 text-base leading-snug">{op.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {op.description}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {op.isRemote ? (
            <span className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Remota</span>
          ) : op.location ? (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {op.location}</span>
          ) : null}
          <span className="ml-auto font-medium text-foreground/60">{publisher}</span>
        </div>

        {/* Ações de gestão */}
        {canManage && (
          <div className="flex items-center gap-2 pt-1">
            <Link href={`/colaborador/opportunities/${op.id}`}>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <ChevronRight className="h-3.5 w-3.5" /> Ver
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => onTogglePublish(op.id, !op.isPublished)}
            >
              {op.isPublished ? (
                <><EyeOff className="h-3.5 w-3.5" /> Ocultar</>
              ) : (
                <><Eye className="h-3.5 w-3.5" /> Publicar</>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-red-500 hover:text-red-600"
              onClick={() => onDelete(op.id)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Remover
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 rounded-full bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
        <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-5/6 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CollaboratorOpportunitiesPage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const load = async (cat?: string, q?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (cat) params.set('category', cat);
      if (q) params.set('search', q);
      const data = await apiFetch(`/opportunities?${params.toString()}`, {
        session: session as AppSession,
      });
      setOpportunities(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) void load(category, search);
  }, [session]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void load(category, search);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    void load(value, search);
  };

  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    try {
      await apiFetch(`/opportunities/${id}`, {
        method: 'PATCH',
        session: session as AppSession,
        body: { isPublished },
      });
      setOpportunities((prev) =>
        prev.map((op) => (op.id === id ? { ...op, isPublished } : op)),
      );
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Confirmar remoção da oportunidade?')) return;
    try {
      await apiFetch(`/opportunities/${id}`, {
        method: 'DELETE',
        session: session as AppSession,
      });
      setOpportunities((prev) => prev.filter((op) => op.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const canManage = permissions.canManageContent || permissions.canManageProjects;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Gestão
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Oportunidades</h1>
          <p className="text-sm text-muted-foreground">
            Vagas e chamadas publicadas na plataforma.
          </p>
        </div>

        {canManage && (
          <Link href="/colaborador/opportunities/create">
            <Button size="sm" className="gap-2 mt-2 sm:mt-0">
              <Plus className="h-4 w-4" />
              Nova oportunidade
            </Button>
          </Link>
        )}
      </div>

      <Separator />

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar oportunidades…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" size="sm" className="gap-1.5 shrink-0">
            <Search className="h-3.5 w-3.5" />
            Buscar
          </Button>
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-48"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* ── Contagem ── */}
      {!isLoading && !error && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{opportunities.length} oportunidade(s)</Badge>
          {category && (
            <Badge variant="outline" className="gap-1">
              {CATEGORY_LABEL[category]}
              <button
                onClick={() => handleCategoryChange('')}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* ── Feed ── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : opportunities.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {opportunities.map((op) => (
            <OpportunityCard
              key={op.id}
              op={op}
              canManage={canManage}
              onTogglePublish={handleTogglePublish}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {search || category
                ? 'Nenhuma oportunidade encontrada para os filtros aplicados.'
                : 'Ainda não há oportunidades cadastradas.'}
            </p>
            {canManage && !search && !category && (
              <Link href="/colaborador/opportunities/create">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Criar primeira oportunidade
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
