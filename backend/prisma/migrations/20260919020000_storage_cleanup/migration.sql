ALTER TABLE "Note" ADD COLUMN "fileStorageProvider" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN "resumeStorageProvider" TEXT;
CREATE TABLE "StorageCleanup" (
 "fileId" TEXT PRIMARY KEY,
 "provider" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "attempts" INTEGER NOT NULL DEFAULT 0
);
CREATE FUNCTION queue_note_cleanup() RETURNS TRIGGER AS $$
BEGIN
 IF OLD."fileId" IS NOT NULL THEN
  IF TG_OP = 'DELETE' THEN
   INSERT INTO "StorageCleanup" ("fileId", "provider") VALUES (OLD."fileId", COALESCE(OLD."fileStorageProvider", 'unknown')) ON CONFLICT DO NOTHING;
  ELSIF OLD."fileId" IS DISTINCT FROM NEW."fileId" THEN
   INSERT INTO "StorageCleanup" ("fileId", "provider") VALUES (OLD."fileId", COALESCE(OLD."fileStorageProvider", 'unknown')) ON CONFLICT DO NOTHING;
  END IF;
 END IF;
 RETURN NULL;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER note_storage_cleanup AFTER DELETE OR UPDATE ON "Note" FOR EACH ROW EXECUTE FUNCTION queue_note_cleanup();
CREATE FUNCTION queue_resume_cleanup() RETURNS TRIGGER AS $$
BEGIN
 IF OLD."uploadedResumeFileId" IS NOT NULL THEN
  IF TG_OP = 'DELETE' THEN
   INSERT INTO "StorageCleanup" ("fileId", "provider") VALUES (OLD."uploadedResumeFileId", COALESCE(OLD."resumeStorageProvider", 'unknown')) ON CONFLICT DO NOTHING;
  ELSIF OLD."uploadedResumeFileId" IS DISTINCT FROM NEW."uploadedResumeFileId" THEN
   INSERT INTO "StorageCleanup" ("fileId", "provider") VALUES (OLD."uploadedResumeFileId", COALESCE(OLD."resumeStorageProvider", 'unknown')) ON CONFLICT DO NOTHING;
  END IF;
 END IF;
 RETURN NULL;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER resume_storage_cleanup AFTER DELETE OR UPDATE ON "StudentProfile" FOR EACH ROW EXECUTE FUNCTION queue_resume_cleanup();
