-- CreateEnum
CREATE TYPE "AgentInvestmentType" AS ENUM ('ONE_TIME', 'RECURRING');

-- CreateEnum
CREATE TYPE "AgentInvestmentTargetType" AS ENUM ('AGENT', 'EMPREENDIMENTO');

-- CreateTable
CREATE TABLE "AgentInvestment" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "targetType" "AgentInvestmentTargetType" NOT NULL,
    "targetAgentId" TEXT,
    "targetEmpreendimentoId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "AgentInvestmentType" NOT NULL DEFAULT 'ONE_TIME',
    "notes" TEXT,
    "investedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentInvestment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentInvestment_investorId_investedAt_idx" ON "AgentInvestment"("investorId", "investedAt");

-- CreateIndex
CREATE INDEX "AgentInvestment_targetAgentId_investedAt_idx" ON "AgentInvestment"("targetAgentId", "investedAt");

-- CreateIndex
CREATE INDEX "AgentInvestment_targetEmpreendimentoId_investedAt_idx" ON "AgentInvestment"("targetEmpreendimentoId", "investedAt");

-- AddForeignKey
ALTER TABLE "AgentInvestment" ADD CONSTRAINT "AgentInvestment_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentInvestment" ADD CONSTRAINT "AgentInvestment_targetAgentId_fkey" FOREIGN KEY ("targetAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentInvestment" ADD CONSTRAINT "AgentInvestment_targetEmpreendimentoId_fkey" FOREIGN KEY ("targetEmpreendimentoId") REFERENCES "Empreendimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
