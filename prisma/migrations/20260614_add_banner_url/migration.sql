-- Add bannerUrl column to User table for profile banner image
-- IF NOT EXISTS : safe whether the column already exists (local) or not (prod)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT;
