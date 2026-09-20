# Native PostgreSQL and local-storage verification

Status: runner prepared; no native PostgreSQL pass has been established in the assistant workspace. PostgreSQL server binaries and Docker were unavailable there. PGlite results remain separate evidence.

## Prerequisites

Use a checkout containing all current backend-closure commits and this runner. An older laptop checkout does not verify the current work. These commits have not been pushed; synchronize the reviewed source before running. Do not merge or delete branches for this check.

Install the repository's locked dependencies from its root (`npm ci`), and start your local PostgreSQL server. The database account must be allowed to create databases and drop its own test database. Reserve local port 5099 for the production smoke test. Stop other test runners during this run to avoid overlapping filesystem activity.

## Windows PowerShell, from the repository root

Enter a connection URL to the local `postgres` maintenance database when prompted, for example `postgresql://USERNAME:URL_ENCODED_PASSWORD@127.0.0.1:5432/postgres`. Do not paste the real URL into chat or commit it. URL-encode special characters in the password.

```powershell
$nativeConnection = Read-Host 'Local PostgreSQL maintenance URL' -AsSecureString
$env:NATIVE_TEST_ADMIN_URL = [System.Net.NetworkCredential]::new('', $nativeConnection).Password
try {
    npm run test:native --workspace backend
    if ($LASTEXITCODE -ne 0) { throw 'Native verification failed; inspect the local logs.' }
} finally {
    Remove-Item Env:NATIVE_TEST_ADMIN_URL -ErrorAction SilentlyContinue
    $nativeConnection = $null
}
```

## What the runner does

1. Requires a loopback URL targeting `/postgres`, without URL query parameters. It never uses the existing DATABASE_URL as the test target.
2. Creates a unique `integrum_native_<random>_test` database. It never resets an existing database.
3. Opens two independent PostgreSQL connections. One holds a row lock while another waits; after rollback, the waiting update must apply to the original value. Records the server version.
4. Runs Prisma `migrate deploy`, `migrate status`, client generation, backend compilation and strict test compilation.
5. Seeds only the generated database, runs the full closure test file and compiled production smoke. These include ownership, token/session handling, rollback, attendance, enrollment, syllabus and local-storage cases. AI is mocked, email is console-only and storage is local; no real email or AI requests are required.
6. Saves sanitized command logs and result metadata under `backend/test-results/<database>/` (ignored by Git). Logs redact database URLs and hexadecimal test tokens; review before sharing.
7. Closes test connections and drops only the database it successfully created. Cleanup failures report that database's exact name for manual removal. Abrupt termination or power loss can prevent cleanup; use the printed name, never a wildcard.

Uploaded fixtures use unique test profile IDs under local uploads. Normal test cleanup removes fixture files; an interrupted/failed test can leave fixture files. The runner does not bulk-delete the uploads directory. Client generation and build refresh normal generated artifacts.

## What passing establishes—and what it does not

The process must exit zero, all closure tests and smoke checks must pass, and result.json must report testsPassed=true and cleanupSucceeded=true. Check server.txt for the actual PostgreSQL version used.

This verifies the migration chain and closure suite against a native local server and its filesystem. It is not the separate 14-script legacy regression matrix, exhaustive domain concurrency coverage, a Supabase-storage test, or deployment approval. Live Supabase/private bucket behavior, Gemini availability, real email delivery and deployment cookie/proxy behavior remain separate gates.

The previous file-reappearance failure must remain documented. It occurred during overlapping workspace activity; uninterrupted runs passed without a storage code change. Execution-environment interference is a hypothesis. If it recurs on the laptop, retain the logs and investigate before backend sign-off; do not repeatedly rerun until green and discard the failures.
