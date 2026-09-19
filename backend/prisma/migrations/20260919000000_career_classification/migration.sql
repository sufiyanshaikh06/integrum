CREATE TYPE "ApplicationType" AS ENUM ('INTERNSHIP', 'PLACEMENT');
CREATE TYPE "EligibilityStatus" AS ENUM ('UNKNOWN', 'ELIGIBLE', 'NOT_ELIGIBLE');
ALTER TABLE "JobApplication"
  ADD COLUMN "applicationType" "ApplicationType" NOT NULL DEFAULT 'INTERNSHIP',
  ADD COLUMN "eligibilityStatus" "EligibilityStatus" NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN "interviewHistory" JSONB;
