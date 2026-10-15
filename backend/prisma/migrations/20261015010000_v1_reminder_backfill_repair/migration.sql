-- Corrective migration to reconcile legacy reminder backfill policy:
-- 1. Historical completed legacy reminders must be CANCELLED (completion does not prove delivery).
UPDATE "Reminder"
SET "deliveryStatus" = 'CANCELLED'
WHERE "isCompleted" = true
  AND ("deliveredAt" IS NULL OR "sourceType" IS NULL);

-- 2. Historical overdue incomplete legacy reminders (isCompleted = false, triggerAt <= NOW()) that are still PENDING
-- must be marked SKIPPED (with suppressedAt = NOW()) to prevent alert flood upon deployment.
UPDATE "Reminder"
SET "deliveryStatus" = 'SKIPPED',
    "suppressedAt" = COALESCE("suppressedAt", NOW())
WHERE "isCompleted" = false
  AND "triggerAt" <= NOW()
  AND "deliveryStatus" = 'PENDING';

-- 3. Future incomplete legacy reminders remain PENDING.
UPDATE "Reminder"
SET "deliveryStatus" = 'PENDING'
WHERE "isCompleted" = false
  AND "triggerAt" > NOW()
  AND "deliveryStatus" NOT IN ('CANCELLED', 'DELIVERED');
