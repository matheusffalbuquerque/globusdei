'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { BadgeCheck, Building2, Lock, Save, X } from 'lucide-react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import { formatFollowUpStatus, type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select } from '../../../components/ui/select';
import { Separator } from '../../../components/ui/separator';
import { Textarea } from '../../../components/ui/textarea';

type Empreendimento = {
  id: string;
  name: string;
  type: string;
  category: string;
  location?: string | null;
  priorityScore: number;
  isBankVerified: boolean;
  followUpStatus: string;
  internalNotes?: string | null;
  serviceLogs: { id: string; action: string; content: string; createdAt: string }[];
};

/**
 * CollaboratorEmpreendimentosPage mirrors the internal project triage workflow for project managers.
 */
export default function CollaboratorEmpreendimentosPage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [selected, setSelected] = useState<Empreendimento | null>(null);
  const [score, setScore] = useState(0);
  const [followUpStatus, setFollowUpStatus] = useState('OPEN');
  const [notes, setNotes] = useState('');
  const [bankVerified, setBankVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEmpreendimentos = async () => {
    if (!permissions.canManageProjects) {
      return;
    }

    try {
      const data = await apiFetch('/empreendimentos', { session: session as AppSession });
      setEmpreendimentos(data);
      setError(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  useEffect(() => {
    if (session && permissions.canManageProjects) {
      void loadEmpreendimentos();
    }
  }, [permissions.canManageProjects, session]);

  const openSelection = (empreendimento: Empreendimento) => {
    setSelected(empreendimento);
    setScore(empreendimento.priorityScore);
    setFollowUpStatus(empreendimento.followUpStatus);
    setNotes(empreendimento.internalNotes || '');
    setBankVerified(empreendimento.isBankVerified);
  };

  const handleUpdateInternal = async () => {
    if (!selected) {
      return;
    }

    try {
      await apiFetch(`/empreendimentos/${selected.id}/internal`, {
        method: 'PATCH',
        session: session as AppSession,
        body: JSON.stringify({
          priorityScore: Number(score),
          isBankVerified: bankVerified,
          followUpStatus,
          internalNotes: notes,
        }),
      });
      setSelected(null);
      await loadEmpreendimentos();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  if (!permissions.canManageProjects) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Lock className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="font-semibold text-foreground">Gestão de empreendimentos indisponível</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Este módulo exige papel local de gestão de projetos. A navegação e os formulários foram bloqueados para refletir a policy do backend.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Governança de iniciativas
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Controle interno de empreendimentos
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Priorize iniciativas, valide dados bancários e registre observações internas de acompanhamento.
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Grid */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {empreendimentos.map((empreendimento) => (
          <Card key={empreendimento.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {empreendimento.type} · {empreendimento.category}
                  </p>
                  <CardTitle className="mt-1 text-base leading-snug">
                    {empreendimento.name}
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {empreendimento.location || 'Local não informado'}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 font-bold">
                  Score {empreendimento.priorityScore}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Banco
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {empreendimento.isBankVerified ? (
                      <>
                        <BadgeCheck className="h-3.5 w-3.5 text-green-600" />
                        <Badge variant="success" className="text-[10px]">Verificado</Badge>
                      </>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Pendente</Badge>
                    )}
                  </div>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Follow-up
                  </p>
                  <p className="mt-1 text-xs font-medium text-foreground">
                    {formatFollowUpStatus(empreendimento.followUpStatus)}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                className="w-full"
                onClick={() => openSelection(empreendimento)}
              >
                <Building2 className="mr-1.5 h-4 w-4" />
                Abrir análise
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Analysis modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-background p-6 shadow-2xl">
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Análise interna
                </p>
                <h3 className="mt-0.5 text-xl font-bold text-foreground">{selected.name}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelected(null)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              {/* Form */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Score de prioridade:{' '}
                    <span className="text-xl font-bold text-primary">{score}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Validar dados bancários</p>
                    <p className="text-xs text-muted-foreground">
                      Libera preenchimento dos dados pelo agente.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={bankVerified}
                    onChange={(e) => setBankVerified(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Status de acompanhamento</label>
                  <Select
                    value={followUpStatus}
                    onChange={(e) => setFollowUpStatus(e.target.value)}
                  >
                    <option value="OPEN">Triagem</option>
                    <option value="MONITORING">Em acompanhamento</option>
                    <option value="ON_HOLD">Em pausa</option>
                    <option value="CLOSED">Finalizado</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Notas internas</label>
                  <Textarea
                    rows={6}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Riscos, observações e encaminhamentos."
                  />
                </div>

                <Button onClick={() => void handleUpdateInternal()} className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar análise
                </Button>
              </div>

              {/* History */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Histórico de logs
                </p>
                <div className="mt-3 space-y-3">
                  {selected.serviceLogs?.length > 0 ? (
                    selected.serviceLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-lg border border-border bg-muted/30 p-3"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{log.action}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                          {log.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      Nenhum histórico interno registrado para este empreendimento.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
