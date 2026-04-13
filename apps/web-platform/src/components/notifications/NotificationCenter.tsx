'use client';

import { Bell, Building2, Mail, MailSearch, MessageSquareMore, Search } from 'lucide-react';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Textarea } from '../ui/textarea';

export type NotificationItem = {
  id: string;
  readAt: string | null;
  createdAt: string;
  targetType: string;
  empreendimento?: { id: string; name: string } | null;
  notification: {
    id: string;
    type: string;
    scope: string;
    title: string;
    message: string;
    actionUrl?: string | null;
    createdAt?: string;
    senderCollaborator?: { id: string; name: string; email: string } | null;
    senderAgent?: { id: string; name: string; email: string } | null;
  };
};

export type RecipientSearchResult = {
  agents: Array<{ id: string; name: string; email: string; city?: string | null; country?: string | null }>;
  iniciativas: Array<{ id: string; name: string; category: string; location?: string | null }>;
};

export type SentNotification = {
  id: string;
  type: string;
  scope: string;
  title: string;
  message: string;
  createdAt: string;
  recipients: Array<{
    id: string;
    targetType: string;
    agent?: { id: string; name: string; email: string } | null;
    empreendimento?: { id: string; name: string } | null;
    collaborator?: { id: string; name: string; email: string } | null;
  }>;
};

export type EmailHistoryItem = {
  id: string;
  subject: string;
  recipientEmail: string;
  recipientName?: string | null;
  status: string;
  createdAt: string;
  empreendimento?: { id: string; name: string } | null;
  agent?: { id: string; name: string; email: string } | null;
  senderCollaborator: { id: string; name: string; email: string };
};

export function NotificationList({
  title,
  description,
  items,
  emptyMessage,
  onMarkAsRead,
}: {
  title: string;
  description: string;
  items: NotificationItem[];
  emptyMessage: string;
  onMarkAsRead?: (recipientId: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          items.map((item) => {
            const sender =
              item.notification.senderCollaborator?.name ??
              item.notification.senderAgent?.name ??
              'Sistema Globus Dei';
            return (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-background px-4 py-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={item.readAt ? 'secondary' : 'info'}>
                        {item.readAt ? 'Lida' : 'Nova'}
                      </Badge>
                      <Badge variant="outline">{item.notification.type}</Badge>
                      {item.empreendimento && (
                        <Badge variant="warning" className="gap-1">
                          <Building2 className="h-3 w-3" />
                          {item.empreendimento.name}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {item.notification.title}
                      </h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {item.notification.message}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Origem: {sender}</span>
                      <span>
                        Recebida em {new Date(item.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {item.notification.actionUrl && (
                      <Button asChild variant="outline" size="sm">
                        <a href={item.notification.actionUrl}>Abrir</a>
                      </Button>
                    )}
                    {!item.readAt && onMarkAsRead && (
                      <Button size="sm" onClick={() => onMarkAsRead(item.id)}>
                        Marcar como lida
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export function SentNotificationList({
  items,
  emptyMessage,
}: {
  items: SentNotification[];
  emptyMessage: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquareMore className="h-4 w-4" />
          Notificações enviadas
        </CardTitle>
        <CardDescription>Mensagens operacionais registradas pelo colaborador.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-background px-4 py-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{item.type}</Badge>
                <Badge variant="outline">{item.scope}</Badge>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {item.message}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.recipients.map((recipient) => (
                  <Badge key={recipient.id} variant="outline">
                    {recipient.agent?.name ??
                      recipient.empreendimento?.name ??
                      recipient.collaborator?.name ??
                      recipient.targetType}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Enviada em {new Date(item.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function MessageComposer({
  mode,
  query,
  onQueryChange,
  targetType,
  onTargetTypeChange,
  selectedTarget,
  onTargetChange,
  searchResults,
  title,
  message,
  onTitleChange,
  onMessageChange,
  onSubmit,
  isSubmitting,
}: {
  mode: 'message' | 'email';
  query: string;
  onQueryChange: (value: string) => void;
  targetType: 'AGENT' | 'EMPREENDIMENTO';
  onTargetTypeChange: (value: 'AGENT' | 'EMPREENDIMENTO') => void;
  selectedTarget: string;
  onTargetChange: (value: string) => void;
  searchResults: RecipientSearchResult;
  title: string;
  message: string;
  onTitleChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  isSubmitting: boolean;
}) {
  const options =
    targetType === 'AGENT'
      ? searchResults.agents.map((item) => ({
          value: item.id,
          label: `${item.name} · ${item.email}`,
        }))
      : searchResults.iniciativas.map((item) => ({
          value: item.id,
          label: `${item.name}${item.location ? ` · ${item.location}` : ''}`,
        }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {mode === 'message' ? <MessageSquareMore className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
          {mode === 'message' ? 'Enviar notificação' : 'Enviar email'}
        </CardTitle>
        <CardDescription>
          {mode === 'message'
            ? 'Mensagens diretas para agentes ou iniciativas com entrega no centro de notificações.'
            : 'Disparo operacional de email para um agente ou para todos os membros de uma iniciativa.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Destino</label>
              <Select
                value={targetType}
                onChange={(event) => onTargetTypeChange(event.target.value as 'AGENT' | 'EMPREENDIMENTO')}
              >
                <option value="AGENT">Agente</option>
                <option value="EMPREENDIMENTO">Iniciativa</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Buscar destinatário</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  className="pl-9"
                  placeholder={targetType === 'AGENT' ? 'Nome ou email do agente' : 'Nome da iniciativa'}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Selecionar destinatário</label>
            <Select value={selectedTarget} onChange={(event) => onTargetChange(event.target.value)}>
              <option value="">Escolha um destinatário</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {mode === 'message' ? 'Título da notificação' : 'Assunto do email'}
            </label>
            <Input value={title} onChange={(event) => onTitleChange(event.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {mode === 'message' ? 'Mensagem' : 'Corpo do email'}
            </label>
            <Textarea value={message} onChange={(event) => onMessageChange(event.target.value)} />
          </div>

          <Button type="submit" disabled={isSubmitting || !selectedTarget || !title || !message}>
            {isSubmitting ? 'Enviando...' : mode === 'message' ? 'Registrar notificação' : 'Enviar email'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function EmailHistoryTable({
  items,
  query,
  onQueryChange,
  onRefresh,
}: {
  items: EmailHistoryItem[];
  query: string;
  onQueryChange: (value: string) => void;
  onRefresh: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MailSearch className="h-4 w-4" />
              Histórico de emails
            </CardTitle>
            <CardDescription>Disponível apenas para administrador.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Buscar por email, assunto ou iniciativa"
              className="min-w-[260px]"
            />
            <Button variant="outline" onClick={onRefresh}>
              Buscar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Destinatário</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum email encontrado para o filtro atual.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">
                        {item.recipientName || item.agent?.name || item.empreendimento?.name || item.recipientEmail}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.recipientEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>{item.subject}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'SENT' ? 'success' : item.status === 'FAILED' ? 'destructive' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.senderCollaborator.name}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleString('pt-BR')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
