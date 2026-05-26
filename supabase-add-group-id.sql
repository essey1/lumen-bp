-- Run this in Supabase → SQL Editor
-- Adds the groupId column to the Plan table for linking A/B/C plans generated together

ALTER TABLE "Plan"
  ADD COLUMN IF NOT EXISTS "groupId" TEXT;

-- Optional: index for faster sibling lookups
CREATE INDEX IF NOT EXISTS "Plan_groupId_idx" ON "Plan" ("groupId");
