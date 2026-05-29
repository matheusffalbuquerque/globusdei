'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Megaphone,
  Plus,
  AlertCircle,
  Globe,
  Calendar,
  Send,
  Lock,
} from 'lucide-react';

import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { apiFetch } from '../../../lib/api';
import { type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Separator } from '../../../components/ui/separator';
import { Textarea } from '../../../components/ui/textarea';
import { Select } from '../../../components/ui/select';

// ─── Types ───────────────────────────────────────────────────────────────────

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, 'default' | 'info' | 'success' | 'warning' | 'secondary'> = {
  SYSTEM: 'secondary',
  MISSION: 'default',
  EVENT: 'warning',
};

const TYPE_LABEL: Record<string, string> = {
  SYSTEM: 'Sistema',
  MISSION: 'Missão',
  EVENT: 'Evento',
};

function AnnouncementTypeBadge({ type }: { type: string }) {
  return (
    <Badge variant={TYPE_BADGE[type] ?? 'secondary'}>
      {TYPE_LABEL[type] ?? type}
    </Badge>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CollaboratorAnnouncementsPage() {
  const { data: session } = useSession();
  const { permissions } = useCollaboratorPortal();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [form, setForm] = useState({ title: '', content: '', type: 'SYSTEM' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnnouncements = async () => {
    try {
      const data = await apiFetch('/announcements/all', { session: session as AppSession });
      setAnnouncements(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) void loadAnnouncements();
  }, [session]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await apiFetch('/announcements', {
        method: 'POST',
        session: session as AppSession,
        body: JSON.stringify(form),
      });
      setForm({ title: '', content: '', type: 'SYSTEM' });
      await loadAnnouncements();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Comunicação
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Anúncios da plataforma
        </h1>
        <p className="text-sm text-muted-foreground">
          Feed oficial visível para todos os colaboradores e agentes cadastrados.
        </p>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        {/* ── Feed de anúncios ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Publicados
            </h2>
            <Badge variant="secondary">{announcements.length} anúncio(s)</Badge>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-3 w-20 rounded bg-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="mt-2 h-10 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <AnnouncementTypeBadge type={announcement.type} />
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(announcement.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <CardTitle className="mt-2 text-base">{announcement.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {announcement.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                <Globe className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Nenhum anúncio publicado até o momento.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Sidebar: formulário ou aviso ── */}
        <div>
          {permissions.canManageContent ? (
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  Publicar anúncio
                </CardTitle>
                <CardDescription>
                  O anúncio será imediatamente visível no feed da plataforma.
                </CardDescription>
              </CardHeader>

              <Separator />

              <CardContent className="pt-5">
                <form onSubmit={submit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Título</label>
                    <Input
                      required
                      placeholder="Título do anúncio"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                    <Select
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    >
                      <option value="SYSTEM">Sistema</option>
                      <option value="MISSION">Missão</option>
                      <option value="EVENT">Evento</option>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Mensagem</label>
                    <Textarea
                      required
                      rows={7}
                      placeholder="Mensagem oficial para agentes e colaboradores…"
                      value={form.content}
                      onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    />
                  </div>

                  <Button type="submit" disabled={isSaving} className="w-full gap-2">
                    <Send className="h-4 w-4" />
                    {isSaving ? 'Publicando…' : 'Publicar anúncio'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  Apenas leitura
                </CardTitle>
                <CardDescription>
                  Seu papel atual permite leitura do feed, mas não a publicação de novos
                  anúncios. Solicite permissão a um administrador se necessário.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
