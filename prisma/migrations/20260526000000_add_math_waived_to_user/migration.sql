-- AlterTable: add mathPlacement and waivedCourses columns to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mathPlacement" TEXT DEFAULT 'none';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "waivedCourses" TEXT;
