/*
  Warnings:

  - You are about to drop the column `description` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `vocationType` on the `Agent` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "LanguageProficiency" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED', 'FLUENT', 'NATIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "Agent" DROP COLUMN IF EXISTS "description",
DROP COLUMN IF EXISTS "vocationType",
ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "coverUrl" TEXT,
ADD COLUMN IF NOT EXISTS "currentDenomination" TEXT,
ADD COLUMN IF NOT EXISTS "nationalityId" TEXT,
ADD COLUMN IF NOT EXISTS "photoUrl" TEXT,
ADD COLUMN IF NOT EXISTS "portfolioUrl" TEXT,
ADD COLUMN IF NOT EXISTS "shortDescription" TEXT,
ADD COLUMN IF NOT EXISTS "slug" TEXT,
ADD COLUMN IF NOT EXISTS "state" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Nationality" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nationality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Language" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ExperienceType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "VocationalArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocationalArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AgentExperience" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "experienceTypeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AgentSkill" (
    "agentId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "contextInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentSkill_pkey" PRIMARY KEY ("agentId","skillId")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AgentVocationalArea" (
    "agentId" TEXT NOT NULL,
    "vocationalAreaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentVocationalArea_pkey" PRIMARY KEY ("agentId","vocationalAreaId")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AgentLanguage" (
    "agentId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "proficiencyLevel" "LanguageProficiency" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentLanguage_pkey" PRIMARY KEY ("agentId","languageId")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AgentEducation" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "degree" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentEducation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AgentCourse" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "certificateUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AgentLink" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AgentRecommendation" (
    "id" TEXT NOT NULL,
    "recommenderId" TEXT NOT NULL,
    "recommendedId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Nationality_name_key" ON "Nationality"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Nationality_code_key" ON "Nationality"("code");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Language_code_key" ON "Language"("code");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ExperienceType_name_key" ON "ExperienceType"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "VocationalArea_name_key" ON "VocationalArea"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Agent_slug_key" ON "Agent"("slug");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Agent" ADD CONSTRAINT "Agent_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES "Nationality"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AgentExperience" ADD CONSTRAINT "AgentExperience_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AgentExperience" ADD CONSTRAINT "AgentExperience_experienceTypeId_fkey" FOREIGN KEY ("experienceTypeId") REFERENCES "ExperienceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AgentSkill" ADD CONSTRAINT "AgentSkill_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AgentSkill" ADD CONSTRAINT "AgentSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AgentVocationalArea" ADD CONSTRAINT "AgentVocationalArea_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AgentVocationalArea" ADD CONSTRAINT "AgentVocationalArea_vocationalAreaId_fkey" FOREIGN KEY ("vocationalAreaId") REFERENCES "VocationalArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AgentLanguage" ADD CONSTRAINT "AgentLanguage_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AgentLanguage" ADD CONSTRAINT "AgentLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AgentEducation" ADD CONSTRAINT "AgentEducation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AgentCourse" ADD CONSTRAINT "AgentCourse_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AgentLink" ADD CONSTRAINT "AgentLink_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AgentRecommendation" ADD CONSTRAINT "AgentRecommendation_recommenderId_fkey" FOREIGN KEY ("recommenderId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AgentRecommendation" ADD CONSTRAINT "AgentRecommendation_recommendedId_fkey" FOREIGN KEY ("recommendedId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
