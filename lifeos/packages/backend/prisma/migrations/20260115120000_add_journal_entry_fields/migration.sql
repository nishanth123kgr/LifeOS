-- AlterTable
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "gratitude" TEXT;
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "energy" INTEGER;
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN DEFAULT true;
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "wordCount" INTEGER DEFAULT 0;
