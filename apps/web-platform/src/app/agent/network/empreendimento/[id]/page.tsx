'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  MapPin,
  Users,
} from 'lucide-react';

import { apiFetch } from '../../../../../lib/api';
import { type AppSession } from '../../../../../lib/auth';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent } from '../../../../../components/ui/card';
import { Separator } from '../../../../../components/ui/separator';

type EmpreendimentoDetail = {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  location: string | null;
  logoUrl: string | null;
  isFollowing: boolean;
  _count: { followers: number };
};

function formatType(type: string) {
  const map: Record<string, string> = {
    CHURCH: 'Igreja', AGENCY: 'Agência', SCHOOL: 'Escola',
    PROJECT: 'Projeto', VENTURE: 'Empreendimento', ONG: 'ONG',
  };
  return map[type] ?? type;
}

export default function EmpreendimentoProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const empId = params?.id as string;

  const [emp, setEmp] = useState<EmpreendimentoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const s = session as AppSession;

  const loadEmp = async () => {
    if (!session || !empId) return;
    try {
      const all: EmpreendimentoDetail[] = await apiFetch('/platform/empreendimentos', { session: s });
      const found = all.find((e) => e.id === empId);
      if (!found) throw new Error('Empreendimento não encontrado.');
      setEmp(found);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) void loadEmp();
  }, [session, empId]);

  const handleToggleFollow = async () => {
    if (!emp) return;
    setActionLoading(true);
    try {
      if (emp.isFollowing) {
        await apiFetch(`/platform/unfollow/${emp.id}`, { method: 'POST', session: s });
      } else {
        await apiFetch(`/platform/follow/${emp.id}`, { method: 'POST', session: s });
      }
      await loadEmp();
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

  if (error || !emp) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Empreendimento não encontrado.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Voltar para Rede Global
      </Button>

      <Card>
        {/* Banner */}
        <div className="flex h-36 items-center justify-center rounded-t-xl bg-gradient-to-br from-slate-100 to-slate-50">
          {emp.logoUrl ? (
            <img src={emp.logoUrl} alt={emp.name} className="h-20 w-20 rounded-xl object-contain shadow" />
          ) : (
            <Building2 className="h-14 w-14 text-muted-foreground/30" />
          )}
        </div>

        <CardContent className="pt-6 pb-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">{emp.name}</h1>
              <p className="text-sm text-muted-foreground">{formatType(emp.type)}</p>
            </div>

            <Button
              size="sm"
              variant={emp.isFollowing ? 'outline' : 'default'}
              className="shrink-0 gap-1.5"
              disabled={actionLoading}
              onClick={handleToggleFollow}
            >
              {emp.isFollowing ? (
                <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Seguindo</>
              ) : (
                'Seguir'
              )}
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{emp._count.followers} {emp._count.followers === 1 ? 'seguidor' : 'seguidores'}</span>
          </div>

          <Separator className="my-5" />

          {/* Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            {emp.location && (
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Localização</p>
                  <p className="text-sm text-foreground">{emp.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Categoria</p>
                <Badge variant="outline" className="mt-0.5 text-xs">{emp.category}</Badge>
              </div>
            </div>
          </div>

          {emp.description && (
            <>
              <Separator className="my-5" />
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Sobre</p>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{emp.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
