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
} from 'lucide-react';

import { apiFetch } from '../../../lib/api';
import { type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { cn } from '../../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Opportunity = {
  id: string;
  title: string;
  description: string;
  category: string;
  location?: string | null;
  isRemote: boolean;
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

function OpportunityCard({ op }: { op: Opportunity }) {
  const publisher = op.empreendimento?.name ?? op.authorAgent?.name ?? op.authorCollaborator?.name ?? 'GlobusDei';

  return (
    <Link href={`/agent/opportunities/${op.id}`} className="block group">
      <Card className="transition-all hover:shadow-md hover:border-primary/30 group-hover:bg-muted/20">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant={CATEGORY_BADGE[op.category] ?? 'secondary'}>
              {CATEGORY_LABEL[op.category] ?? op.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(op.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <CardTitle className="mt-2 text-base leading-snug group-hover:text-primary transition-colors">
            {op.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {op.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {op.isRemote ? (
              <span className="flex items-center gap-1">
                <Wifi className="h-3 w-3" /> Remota
              </span>
            ) : op.location ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {op.location}
              </span>
            ) : null}
            <span className="ml-auto flex items-center gap-1 font-medium text-foreground/60">
              {publisher}
              <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
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

export default function AgentOpportunitiesPage() {
  const { data: session } = useSession();
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

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Rede Globus Dei
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Oportunidades
        </h1>
        <p className="text-sm text-muted-foreground">
          Vagas, projetos e convocações publicadas por iniciativas e pela organização.
        </p>
      </div>

      {/* ── Error banner ── */}
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
                aria-label="Remover filtro"
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
          {opportunities.map((op) => <OpportunityCard key={op.id} op={op} />)}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {search || category
                ? 'Nenhuma oportunidade encontrada para os filtros aplicados.'
                : 'Ainda não há oportunidades publicadas.'}
            </p>
            {(search || category) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  handleCategoryChange('');
                }}
              >
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
