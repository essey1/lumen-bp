-- ============================================================
--  Lumen BP — Supabase Schema Catchup Script
--  Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
--  Safe to run multiple times — uses IF NOT EXISTS / IF NOT EXISTS
-- ============================================================

-- 1. Ensure core User columns exist
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "major"              TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "minor"              TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "year"               INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio"                TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "completedSemesters" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mathPlacement"      TEXT DEFAULT 'none';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "waivedCourses"      TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "otpEnabled"         BOOLEAN NOT NULL DEFAULT true;

-- 2. Ensure OTP table exists
CREATE TABLE IF NOT EXISTS "OTP" (
    "id"           TEXT        NOT NULL,
    "hashedCode"   TEXT        NOT NULL,
    "userId"       TEXT        NOT NULL,
    "attempts"     INTEGER     NOT NULL DEFAULT 0,
    "lastResendAt" TIMESTAMP(3),
    "expiresAt"    TIMESTAMP(3) NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OTP_pkey"       PRIMARY KEY ("id"),
    CONSTRAINT "OTP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Ensure Plan table exists
CREATE TABLE IF NOT EXISTS "Plan" (
    "id"            TEXT         NOT NULL,
    "userId"        TEXT         NOT NULL,
    "name"          TEXT         NOT NULL DEFAULT 'My Plan',
    "majors"        TEXT         NOT NULL,
    "minors"        TEXT         NOT NULL,
    "interests"     TEXT         NOT NULL,
    "careerGoals"   TEXT         NOT NULL,
    "mathPlacement" TEXT         NOT NULL DEFAULT 'none',
    "waivedCourses" TEXT         NOT NULL,
    "planType"      TEXT         NOT NULL DEFAULT 'A',
    "semesters"     TEXT         NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey"       PRIMARY KEY ("id"),
    CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Done!
SELECT 'Schema is up to date.' AS status;
