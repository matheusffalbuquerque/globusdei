-- CreateEnum
CREATE TYPE "PrayerRequestStatus" AS ENUM ('PENDING', 'ANSWERED');

-- CreateTable
CREATE TABLE "PrayerRequest" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "request" TEXT NOT NULL,
    "status" "PrayerRequestStatus" NOT NULL DEFAULT 'PENDING',
    "answeredById" TEXT,
    "answeredAt" TIMESTAMP(3),
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrayerRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrayerRequest" ADD CONSTRAINT "PrayerRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrayerRequest" ADD CONSTRAINT "PrayerRequest_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "Collaborator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
