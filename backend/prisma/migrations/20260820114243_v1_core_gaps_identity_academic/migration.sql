-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "careerGoals" TEXT,
ADD COLUMN     "socialLinks" JSONB;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "attendanceGoal" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetTokenHash" TEXT,
ADD COLUMN     "verificationExpires" TIMESTAMP(3),
ADD COLUMN     "verificationTokenHash" TEXT;
