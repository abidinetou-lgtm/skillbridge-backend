/*
  Warnings:

  - You are about to drop the column `rewardKeys` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[jitsiRoomId]` on the table `TeachingSession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jitsiRoomId` to the `TeachingSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `TeachingSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TeachingSessionStatus" ADD VALUE 'ACTIVE';
ALTER TYPE "TeachingSessionStatus" ADD VALUE 'PENDING_CONFIRMATION';

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_matchId_fkey";

-- DropForeignKey
ALTER TABLE "TeachingSession" DROP CONSTRAINT "TeachingSession_matchId_fkey";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TeachingSession" ADD COLUMN     "actualEndedAt" TIMESTAMP(3),
ADD COLUMN     "actualStartedAt" TIMESTAMP(3),
ADD COLUMN     "creditsConsumed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "creditsReserved" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "jitsiRoomId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "matchId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "rewardKeys",
ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 20;

-- CreateIndex
CREATE UNIQUE INDEX "TeachingSession_jitsiRoomId_key" ON "TeachingSession"("jitsiRoomId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingSession" ADD CONSTRAINT "TeachingSession_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
