-- Add denormalized rating stats to user profiles.
ALTER TABLE "User"
ADD COLUMN "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "totalRatings" INTEGER NOT NULL DEFAULT 0;

-- Keep the schema aligned with the existing nullable conversation relation.
ALTER TABLE "Conversation" ALTER COLUMN "matchId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SessionRating" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewedUserId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionRating_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SessionRating_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionRating_sessionId_reviewerId_reviewedUserId_key"
ON "SessionRating"("sessionId", "reviewerId", "reviewedUserId");

-- CreateIndex
CREATE INDEX "SessionRating_reviewedUserId_createdAt_idx"
ON "SessionRating"("reviewedUserId", "createdAt");

-- CreateIndex
CREATE INDEX "SessionRating_reviewerId_idx"
ON "SessionRating"("reviewerId");

-- CreateIndex
CREATE INDEX "SessionRating_sessionId_idx"
ON "SessionRating"("sessionId");

-- AddForeignKey
ALTER TABLE "SessionRating" ADD CONSTRAINT "SessionRating_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "TeachingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRating" ADD CONSTRAINT "SessionRating_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRating" ADD CONSTRAINT "SessionRating_reviewedUserId_fkey"
FOREIGN KEY ("reviewedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
