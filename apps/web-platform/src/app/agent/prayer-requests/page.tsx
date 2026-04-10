'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  HandHeart,
  Loader2,
  Send,
} from 'lucide-react';

import { apiFetch } from '../../../lib/api';
import { type AppSession } from '../../../lib/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Textarea } from '../../../components/ui/textarea';

const PAGE_SIZE = 8;

type PrayerItem = {
  id: string;
  request: string;
  status: 'PENDING' | 'ANSWERED';
  answeredAt: string | null;
  createdAt: string;
  answeredBy: { name: string } | null;
};

export default function AgentPrayerRequestsPage() {
  const { data: session } = useSession();

  const [items, setItems] = useState<PrayerItem[]>([]);
  const [requestText, setRequestText] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const data = await apiFetch('/prayer-requests/mine', { session: session as AppSession });
      setItems(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    if (session) void load();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestText.trim().length < 10) {
      setFormError('O pedido deve ter pelo menos 10 caracteres.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch('/prayer-requests', {
        method: 'POST',
        session: session as AppSession,
        body: JSON.stringify({ request: requestText }),
      });
      setRequestText('');
      await load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const paginated = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Intercessão
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Pedidos de Oração
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Compartilhe seus pedidos com o grupo de intercessão global da Globus Dei. Nossa equipe
            está sempre disposta a orar por você.
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Formulário */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <HandHeart className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Novo pedido
              </p>
              <CardTitle className="mt-0.5 text-base">Enviar pedido de oração</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {formError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Seu pedido</label>
              <Textarea
                required
                rows={5}
                minLength={10}
                maxLength={2000}
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder="Escreva seu pedido de oração. Tudo que você compartilhar será tratado com respeito e confidencialidade."
              />
              <p className="text-xs text-muted-foreground text-right">
                {requestText.length} / 2000
              </p>
            </div>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar pedido
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Histórico
            </p>
            <CardTitle className="mt-0.5 text-base">Meus pedidos</CardTitle>
          </div>
          <Badge variant="secondary" className="font-bold">
            {items.length} {items.length === 1 ? 'pedido' : 'pedidos'}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <HandHeart className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Você ainda não enviou pedidos.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead className="w-36">Enviado em</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="line-clamp-2 text-sm text-foreground">{item.request}</p>
                        {item.status === 'ANSWERED' && item.answeredBy && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Atendido por {item.answeredBy.name}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        {item.status === 'PENDING' ? (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <Clock className="h-3.5 w-3.5" /> Pendente
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Atendido
          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    {items.length} pedido{items.length !== 1 ? 's' : ''} • página {page} de{' '}
                    {totalPages}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
