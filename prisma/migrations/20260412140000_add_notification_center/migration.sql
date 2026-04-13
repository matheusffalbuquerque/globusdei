-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM (
    'DIRECT_MESSAGE',
    'CONNECTION_REQUEST',
    'NEW_FOLLOWER',
    'EVENT_REMINDER',
    'PROCESS_UPDATE',
    'SYSTEM_ANNOUNCEMENT'
);

-- CreateEnum
CREATE TYPE "NotificationScope" AS ENUM (
    'PERSONAL',
    'INITIATIVE',
    'PLATFORM'
);

-- CreateEnum
CREATE TYPE "NotificationTargetType" AS ENUM (
    'AGENT',
    'COLLABORATOR',
    'EMPREENDIMENTO'
);

-- CreateEnum
CREATE TYPE "NotificationEmailStatus" AS ENUM (
    'PENDING',
    'SENT',
    'FAILED'
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "scope" "NotificationScope" NOT NULL DEFAULT 'PERSONAL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "sourceEntityType" TEXT,
    "sourceEntityId" TEXT,
    "senderAgentId" TEXT,
    "senderCollaboratorId" TEXT,
    "senderSystemLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "targetType" "NotificationTargetType" NOT NULL,
    "agentId" TEXT,
    "collaboratorId" TEXT,
    "empreendimentoId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEmailLog" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT,
    "senderCollaboratorId" TEXT NOT NULL,
    "targetType" "NotificationTargetType" NOT NULL,
    "agentId" TEXT,
    "empreendimentoId" TEXT,
    "recipientName" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "NotificationEmailStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_senderCollaboratorId_createdAt_idx" ON "Notification"("senderCollaboratorId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationRecipient_agentId_createdAt_idx" ON "NotificationRecipient"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationRecipient_collaboratorId_createdAt_idx" ON "NotificationRecipient"("collaboratorId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationRecipient_empreendimentoId_createdAt_idx" ON "NotificationRecipient"("empreendimentoId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationRecipient_notificationId_createdAt_idx" ON "NotificationRecipient"("notificationId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationEmailLog_senderCollaboratorId_createdAt_idx" ON "NotificationEmailLog"("senderCollaboratorId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationEmailLog_recipientEmail_createdAt_idx" ON "NotificationEmailLog"("recipientEmail", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationEmailLog_empreendimentoId_createdAt_idx" ON "NotificationEmailLog"("empreendimentoId", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_senderAgentId_fkey" FOREIGN KEY ("senderAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_senderCollaboratorId_fkey" FOREIGN KEY ("senderCollaboratorId") REFERENCES "Collaborator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_empreendimentoId_fkey" FOREIGN KEY ("empreendimentoId") REFERENCES "Empreendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEmailLog" ADD CONSTRAINT "NotificationEmailLog_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEmailLog" ADD CONSTRAINT "NotificationEmailLog_senderCollaboratorId_fkey" FOREIGN KEY ("senderCollaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEmailLog" ADD CONSTRAINT "NotificationEmailLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEmailLog" ADD CONSTRAINT "NotificationEmailLog_empreendimentoId_fkey" FOREIGN KEY ("empreendimentoId") REFERENCES "Empreendimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
