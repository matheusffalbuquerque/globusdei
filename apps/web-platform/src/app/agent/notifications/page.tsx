'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { BellRing } from 'lucide-react';

import { NotificationList, type NotificationItem } from '../../../components/notifications/NotificationCenter';
import { Card, CardContent } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { apiFetch } from '../../../lib/api';
import type { AppSession } from '../../../lib/auth';

/**
 * Agent notification center with personal and initiative-scoped feeds.
 */
export default function AgentNotificationsPage() {
  const { data: session } = useSession();
  const [personal, setPersonal] = useState<NotificationItem[]>([]);
  const [initiatives, setInitiatives] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [personalData, initiativeData] = await Promise.all([
        apiFetch('/notifications/agent', {
          service: 'notification',
          session: session as AppSession,
        }),
        apiFetch('/notifications/agent/initiatives', {
          service: 'notification',
          session: session as AppSession,
        }),
      ]);
      setPersonal(personalData);
      setInitiatives(initiativeData);
      setError(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  };

  useEffect(() => {
    if (session) {
      void load();
    }
  }, [session]);

  const markAsRead = async (recipientId: string) => {
    try {
      await apiFetch(`/notifications/recipients/${recipientId}/read`, {
        service: 'notification',
        method: 'PATCH',
        session: session as AppSession,
      });
      await load();
    } catch (requestError) {
      setError((requestError as Error).message);
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
              Acompanhe o que exige sua atenção
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Mensagens diretas de colaboradores, atualizações de processos, avisos de eventos e atividade nas iniciativas vinculadas ao seu perfil.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-medium text-muted-foreground">
            <BellRing className="h-4 w-4 text-primary" />
            {personal.filter((item) => !item.readAt).length + initiatives.filter((item) => !item.readAt).length} pendências recentes
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <Tabs defaultValue="received">
        <TabsList className="max-w-xl">
          <TabsTrigger value="received">Recebidas</TabsTrigger>
          <TabsTrigger value="initiatives">Iniciativas</TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <NotificationList
            title="Recebidas por você"
            description="Notificações pessoais entregues diretamente ao seu perfil."
            items={personal}
            emptyMessage="Nenhuma notificação pessoal registrada até agora."
            onMarkAsRead={markAsRead}
          />
        </TabsContent>

        <TabsContent value="initiatives">
          <NotificationList
            title="Recebidas pelas suas iniciativas"
            description="Atividade registrada para empreendimentos em que você atua como owner ou membro."
            items={initiatives}
            emptyMessage="Nenhuma notificação de iniciativa encontrada."
            onMarkAsRead={markAsRead}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
