-- 1. NotificationType enum expansion
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EXAM_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CERTIFICATION_ALERT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'GENERAL_REMINDER';

-- 2. ReminderDeliveryStatus enum creation
DO $$ BEGIN
  CREATE TYPE "ReminderDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'SKIPPED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Reminder schema additions
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "sourceType" TEXT;
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "sourceId" TEXT;
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "occurrenceKey" TEXT;
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "deliveryStatus" "ReminderDeliveryStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);
ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "suppressedAt" TIMESTAMP(3);

-- Indexes and unique constraint on Reminder
CREATE UNIQUE INDEX IF NOT EXISTS "Reminder_studentProfileId_sourceType_sourceId_occurrenceKey_key"
  ON "Reminder"("studentProfileId", "sourceType", "sourceId", "occurrenceKey");
CREATE INDEX IF NOT EXISTS "Reminder_triggerAt_deliveryStatus_idx"
  ON "Reminder"("triggerAt", "deliveryStatus");

-- 4. Legacy Reminder Backfill
-- Completed reminders -> CANCELLED
UPDATE "Reminder" SET "deliveryStatus" = 'CANCELLED' WHERE "isCompleted" = true;
-- Overdue uncompleted reminders -> SKIPPED (suppressedAt = NOW()) to avoid startup alert flood
UPDATE "Reminder" SET "deliveryStatus" = 'SKIPPED', "suppressedAt" = NOW() WHERE "isCompleted" = false AND "triggerAt" <= NOW();
-- Future uncompleted reminders -> PENDING
UPDATE "Reminder" SET "deliveryStatus" = 'PENDING' WHERE "isCompleted" = false AND "triggerAt" > NOW();

-- 5. StudyPlan schema additions
ALTER TABLE "StudyPlan" ADD COLUMN IF NOT EXISTS "scheduleData" JSONB;
ALTER TABLE "StudyPlan" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "StudyPlan" ADD COLUMN IF NOT EXISTS "canonicalHash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "StudyPlan_studentProfileId_idempotencyKey_key"
  ON "StudyPlan"("studentProfileId", "idempotencyKey");
