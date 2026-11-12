---
trigger: glob
globs: "backend/prisma/**, backend/src/services/**, backend/src/config/prisma.ts"
description: "Database and schema guardrail — activates when touching DB and Prisma files."
---
Before editing schemas, queries, or migrations:
1. Consult `docs/DATABASE.md` and `docs/SECURITY.md`.
2. Confirm role authorization and model integrity before writing data.
3. Never alter schemas manually; create a version-controlled Prisma migration (`npx prisma migrate dev`).
4. Ensure file deletions register with `StorageCleanupQueue`.
