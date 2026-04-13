'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { BellRing, History } from 'lucide-react';

import {
  EmailHistoryTable,
  MessageComposer,
  NotificationList,
  SentNotificationList,
  type EmailHistoryItem,
  type NotificationItem,
  type RecipientSearchResult,
  type SentNotification,
} from '../../../components/notifications/NotificationCenter';
import { useCollaboratorPortal } from '../../../components/portal/CollaboratorPortalShell';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { apiFetch } from '../../../lib/api';
import type { AppSession } from '../../../lib/auth';

/**
 * Collaborator notification center with inbox, outbox, direct messaging and email history.
 */
export default function CollaboratorNotificationsPage() {
  const { data: session } = useSession();
  const { collaborator } = useCollaboratorPortal();
  const isAdmin = (collaborator?.roles ?? []).includes('ADMIN');

  const [inbox, setInbox] = useState<NotificationItem[]>([]);
  const [sent, setSent] = useState<SentNotification[]>([]);
  const [searchResults, setSearchResults] = useState<RecipientSearchResult>({
    agents: [],
    iniciativas: [],
  });
  const [messageQuery, setMessageQuery] = useState('');
  const [messageTargetType, setMessageTargetType] = useState<'AGENT' | 'EMPREENDIMENTO'>('AGENT');
  const [messageTargetId, setMessageTargetId] = useState('');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [emailQuery, setEmailQuery] = useState('');
  const [emailTargetType, setEmailTargetType] = useState<'AGENT' | 'EMPREENDIMENTO'>('AGENT');
  const [emailTargetId, setEmailTargetId] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyQuery, setHistoryQuery] = useState('');
  const [history, setHistory] = useState<EmailHistoryItem[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadBase = async () => {
    try {
      const [inboxData, sentData] = await Promise.all([
        apiFetch('/notifications/collaborator', {
          service: 'notification',
          session: session as AppSession,
        }),
        apiFetch('/notifications/collaborator/sent', {
          service: 'notification',
          session: session as AppSession,
        }),
      ]);

      setInbox(inboxData);
      setSent(sentData);
      setError(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  const loadRecipients = async (query: string) => {
    try {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      const result = await apiFetch(`/notifications/collaborator/search?${params.toString()}`, {
        service: 'notification',
        session: session as AppSession,
      });
      setSearchResults(result);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  const loadHistory = async (query = historyQuery) => {
    if (!isAdmin) return;

    try {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      const result = await apiFetch(`/notifications/emails/history?${params.toString()}`, {
        service: 'notification',
        session: session as AppSession,
      });
      setHistory(result);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  useEffect(() => {
    if (session) {
      void loadBase();
    }
  }, [session]);

  const markAsRead = async (recipientId: string) => {
    try {
      await apiFetch(`/notifications/recipients/${recipientId}/read`, {
        service: 'notification',
        method: 'PATCH',
        session: session as AppSession,
      });
      await loadBase();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSendingMessage(true);
    setSuccess(null);
    try {
      await apiFetch('/notifications/collaborator/messages', {
        service: 'notification',
        method: 'POST',
        session: session as AppSession,
        body: {
          targetType: messageTargetType,
          agentId: messageTargetType === 'AGENT' ? messageTargetId : undefined,
          empreendimentoId: messageTargetType === 'EMPREENDIMENTO' ? messageTargetId : undefined,
          title: messageTitle,
          message: messageBody,
        },
      });
      setMessageTargetId('');
      setMessageTitle('');
      setMessageBody('');
      setSuccess('Notificação registrada com sucesso.');
      await loadBase();
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const sendEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSendingEmail(true);
    setSuccess(null);
    try {
      await apiFetch('/notifications/emails', {
        service: 'notification',
        method: 'POST',
        session: session as AppSession,
        body: {
          targetType: emailTargetType,
          agentId: emailTargetType === 'AGENT' ? emailTargetId : undefined,
          empreendimentoId: emailTargetType === 'EMPREENDIMENTO' ? emailTargetId : undefined,
          subject: emailSubject,
          message: emailBody,
        },
      });
      setEmailTargetId('');
      setEmailSubject('');
      setEmailBody('');
      setSuccess('Email enviado e registrado no histórico.');
      if (historyOpen) {
        await loadHistory();
      }
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Centro de notificações
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              Comunicação operacional e acompanhamento
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Consulte notificações recebidas, acompanhe o que já foi enviado e registre novas mensagens para agentes e iniciativas sem sair do portal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-medium text-muted-foreground">
              <BellRing className="h-4 w-4 text-primary" />
              {inbox.filter((item) => !item.readAt).length} não lidas
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => {
                  const next = !historyOpen;
                  setHistoryOpen(next);
                  if (next) {
                    void loadHistory();
                  }
                }}
              >
                <History className="mr-2 h-4 w-4" />
                {historyOpen ? 'Ocultar histórico' : 'Abrir histórico de email'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <NotificationList
          title="Recebidas por você"
          description="Alertas operacionais, processos em andamento e comunicações internas."
          items={inbox}
          emptyMessage="Nenhuma notificação recebida até agora."
          onMarkAsRead={markAsRead}
        />

        <div className="space-y-6">
          <MessageComposer
            mode="message"
            query={messageQuery}
            onQueryChange={(value) => {
              setMessageQuery(value);
              void loadRecipients(value);
            }}
            targetType={messageTargetType}
            onTargetTypeChange={(value) => {
              setMessageTargetType(value);
              setMessageTargetId('');
            }}
            selectedTarget={messageTargetId}
            onTargetChange={setMessageTargetId}
            searchResults={searchResults}
            title={messageTitle}
            message={messageBody}
            onTitleChange={setMessageTitle}
            onMessageChange={setMessageBody}
            onSubmit={sendMessage}
            isSubmitting={isSendingMessage}
          />

          <MessageComposer
            mode="email"
            query={emailQuery}
            onQueryChange={(value) => {
              setEmailQuery(value);
              void loadRecipients(value);
            }}
            targetType={emailTargetType}
            onTargetTypeChange={(value) => {
              setEmailTargetType(value);
              setEmailTargetId('');
            }}
            selectedTarget={emailTargetId}
            onTargetChange={setEmailTargetId}
            searchResults={searchResults}
            title={emailSubject}
            message={emailBody}
            onTitleChange={setEmailSubject}
            onMessageChange={setEmailBody}
            onSubmit={sendEmail}
            isSubmitting={isSendingEmail}
          />
        </div>
      </div>

      <SentNotificationList
        items={sent}
        emptyMessage="Nenhuma notificação foi enviada por este colaborador até o momento."
      />

      {historyOpen && isAdmin && (
        <EmailHistoryTable
          items={history}
          query={historyQuery}
          onQueryChange={setHistoryQuery}
          onRefresh={() => void loadHistory(historyQuery)}
        />
      )}
    </div>
  );
}
