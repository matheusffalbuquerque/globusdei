/*
  Warnings:

  - The values [OPPORTUNITY] on the enum `AnnouncementType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "OpportunityCategory" AS ENUM ('STUDIES', 'VOLUNTEERING', 'EMPLOYMENT', 'MISSION', 'ROLE', 'TRAVEL', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "AnnouncementType_new" AS ENUM ('SYSTEM', 'MISSION', 'EVENT');
ALTER TABLE "app"."Announcement" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Announcement" ALTER COLUMN "type" TYPE "AnnouncementType_new" USING ("type"::text::"AnnouncementType_new");
ALTER TYPE "AnnouncementType" RENAME TO "AnnouncementType_old";
ALTER TYPE "AnnouncementType_new" RENAME TO "AnnouncementType";
DROP TYPE "app"."AnnouncementType_old";
ALTER TABLE "Announcement" ALTER COLUMN "type" SET DEFAULT 'SYSTEM';
COMMIT;

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "OpportunityCategory" NOT NULL DEFAULT 'OTHER',
    "location" TEXT,
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "authorCollaboratorId" TEXT,
    "authorAgentId" TEXT,
    "empreendimentoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Opportunity_category_createdAt_idx" ON "Opportunity"("category", "createdAt");

-- CreateIndex
CREATE INDEX "Opportunity_isPublished_createdAt_idx" ON "Opportunity"("isPublished", "createdAt");

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_authorCollaboratorId_fkey" FOREIGN KEY ("authorCollaboratorId") REFERENCES "Collaborator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_authorAgentId_fkey" FOREIGN KEY ("authorAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_empreendimentoId_fkey" FOREIGN KEY ("empreendimentoId") REFERENCES "Empreendimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
