-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ENTERED', 'SUBMITTED', 'QUALIFIED', 'SCHEDULED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('ADMIN', 'PEOPLE_MANAGER', 'PROJECT_MANAGER', 'RESOURCE_MANAGER');

-- CreateEnum
CREATE TYPE "EmpreendimentoType" AS ENUM ('CHURCH', 'AGENCY', 'SCHOOL', 'PROJECT', 'VENTURE', 'ONG');

-- CreateEnum
CREATE TYPE "EmpreendimentoCategory" AS ENUM ('EDUCATION', 'SPORTS', 'TECHNOLOGY', 'BUSINESS', 'HEALTH', 'SOCIAL', 'SCIENTIFICAL', 'CAPACITATION', 'SUPPORT');

-- CreateEnum
CREATE TYPE "NeedType" AS ENUM ('MAINTENANCE', 'EXPANSION', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EmpreendimentoAgentRole" AS ENUM ('OWNER', 'MANAGER', 'CONTRIBUTOR', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('OPEN', 'MONITORING', 'ON_HOLD', 'CLOSED');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ServiceRequestCategory" AS ENUM ('TECHNICAL', 'PSYCHOLOGICAL', 'MEDICAL', 'SPIRITUAL', 'MENTORSHIP', 'LEGAL');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('SYSTEM', 'MISSION', 'OPPORTUNITY', 'EVENT');

-- CreateEnum
CREATE TYPE "FinancialEntryType" AS ENUM ('INCOME', 'EXPENSE', 'ADJUSTMENT', 'TRANSFER');

-- CreateEnum
CREATE TYPE "FinancialTargetType" AS ENUM ('ORGANIZATION', 'AGENT', 'EMPREENDIMENTO');

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "authSubject" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "vocationType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "publicBio" TEXT,
    "privateNotes" TEXT,
    "city" TEXT,
    "country" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "AgentStatus" NOT NULL DEFAULT 'ENTERED',
    "scheduledSlotId" TEXT,
    "interviewLink" TEXT,
    "interviewDate" TIMESTAMP(3),
    "interviewerId" TEXT,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collaborator" (
    "id" TEXT NOT NULL,
    "authSubject" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roles" "CollaboratorRole"[],
    "expertiseAreas" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Collaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpreendimentoFollow" (
    "agentId" TEXT NOT NULL,
    "empreendimentoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmpreendimentoFollow_pkey" PRIMARY KEY ("agentId","empreendimentoId")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "AnnouncementType" NOT NULL DEFAULT 'SYSTEM',
    "targetId" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "category" "ServiceRequestCategory" NOT NULL,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "assignedCollaboratorId" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empreendimento" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "establishedDate" TIMESTAMP(3) NOT NULL,
    "type" "EmpreendimentoType" NOT NULL,
    "category" "EmpreendimentoCategory" NOT NULL,
    "socialLinks" JSONB,
    "portfolioUrl" TEXT,
    "location" TEXT,
    "actuationRegions" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "monthlyExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "incomeSources" TEXT,
    "needType" "NeedType" NOT NULL DEFAULT 'MAINTENANCE',
    "receivesInvestments" BOOLEAN NOT NULL DEFAULT false,
    "isBankVerified" BOOLEAN NOT NULL DEFAULT false,
    "bankDetails" TEXT,
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "followUpStatus" "FollowUpStatus" NOT NULL DEFAULT 'OPEN',
    "internalNotes" TEXT,
    "internalResponsibleId" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Empreendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpreendimentoMember" (
    "agentId" TEXT NOT NULL,
    "empreendimentoId" TEXT NOT NULL,
    "role" "EmpreendimentoAgentRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmpreendimentoMember_pkey" PRIMARY KEY ("agentId","empreendimentoId")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionDetail" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "collaboratorId" TEXT NOT NULL,
    "meetLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpreendimentoInvite" (
    "id" TEXT NOT NULL,
    "empreendimentoId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "EmpreendimentoAgentRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmpreendimentoInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceLog" (
    "id" TEXT NOT NULL,
    "empreendimentoId" TEXT NOT NULL,
    "collaboratorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entryType" "FinancialEntryType" NOT NULL DEFAULT 'EXPENSE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "targetType" "FinancialTargetType" NOT NULL,
    "targetId" TEXT,
    "targetName" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "targetType" "FinancialTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialEntry" (
    "id" TEXT NOT NULL,
    "type" "FinancialEntryType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetType" "FinancialTargetType",
    "targetId" TEXT,
    "targetName" TEXT,
    "categoryId" TEXT,
    "recordedById" TEXT NOT NULL,
    "investmentId" TEXT,
    "allocationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinancialEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Agent_authSubject_key" ON "Agent"("authSubject");
CREATE UNIQUE INDEX "Agent_email_key" ON "Agent"("email");
CREATE UNIQUE INDEX "Agent_scheduledSlotId_key" ON "Agent"("scheduledSlotId");
CREATE UNIQUE INDEX "Collaborator_authSubject_key" ON "Collaborator"("authSubject");
CREATE UNIQUE INDEX "Collaborator_email_key" ON "Collaborator"("email");
CREATE UNIQUE INDEX "Connection_senderId_receiverId_key" ON "Connection"("senderId", "receiverId");
CREATE UNIQUE INDEX "Answer_agentId_questionId_key" ON "Answer"("agentId", "questionId");
CREATE UNIQUE INDEX "EmpreendimentoInvite_token_key" ON "EmpreendimentoInvite"("token");
CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");
CREATE UNIQUE INDEX "FinancialEntry_investmentId_key" ON "FinancialEntry"("investmentId");
CREATE UNIQUE INDEX "FinancialEntry_allocationId_key" ON "FinancialEntry"("allocationId");

ALTER TABLE "Agent" ADD CONSTRAINT "Agent_scheduledSlotId_fkey" FOREIGN KEY ("scheduledSlotId") REFERENCES "AvailabilitySlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmpreendimentoFollow" ADD CONSTRAINT "EmpreendimentoFollow_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmpreendimentoFollow" ADD CONSTRAINT "EmpreendimentoFollow_empreendimentoId_fkey" FOREIGN KEY ("empreendimentoId") REFERENCES "Empreendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_assignedCollaboratorId_fkey" FOREIGN KEY ("assignedCollaboratorId") REFERENCES "Collaborator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Empreendimento" ADD CONSTRAINT "Empreendimento_internalResponsibleId_fkey" FOREIGN KEY ("internalResponsibleId") REFERENCES "Collaborator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Empreendimento" ADD CONSTRAINT "Empreendimento_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmpreendimentoMember" ADD CONSTRAINT "EmpreendimentoMember_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmpreendimentoMember" ADD CONSTRAINT "EmpreendimentoMember_empreendimentoId_fkey" FOREIGN KEY ("empreendimentoId") REFERENCES "Empreendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmpreendimentoInvite" ADD CONSTRAINT "EmpreendimentoInvite_empreendimentoId_fkey" FOREIGN KEY ("empreendimentoId") REFERENCES "Empreendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmpreendimentoInvite" ADD CONSTRAINT "EmpreendimentoInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceLog" ADD CONSTRAINT "ServiceLog_empreendimentoId_fkey" FOREIGN KEY ("empreendimentoId") REFERENCES "Empreendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceLog" ADD CONSTRAINT "ServiceLog_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialEntry" ADD CONSTRAINT "FinancialEntry_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "Allocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
