# Backend closure — day-one checkpoint

Reviewed 18 September 2026. Base: `backend/v1-closure` at `00aeabf7d801d29d92aed20cc0ae37e9e64284a1`.
Implementation branch: `fix/backend-closure-day1`.

## Changes

- Validation middleware forwards Zod output, including transformations, defaults, coercion and stripped fields. Express 5 query getters are shadowed on the individual request.
- Task create/update verifies that a referenced study plan belongs to the authenticated student before writing.
- Local file downloads return bytes through the existing authenticated note/profile endpoints. No public upload-directory route or localhost redirect is introduced. Local paths reject traversal and downloads use private/no-store cache control.
- Note ownership is checked before storage writes. Note/profile replacements use conditional updates against the previously observed file reference, rejecting stale concurrent attachments with 409.
- Failed database attachments attempt removal of newly uploaded objects; successful replacements remove previous objects. Explicit note deletion removes its current attachment.
- Profile resume object names use UUIDs and profile reads expose uploadedResumeFileId.
- Supabase deletion failures are surfaced to cleanup handling instead of silently discarded.
- AI timeout timers are cleared on settlement and timeout ApiError(503) survives Gemini error mapping. The timeout bounds waiting; it does not cancel an already-started provider request.
- Database pool allows CLI processes to exit when idle; the beforeExit cleanup runs once. Error middleware delegates already-started responses to Express.
- Platform audit regression creates its own audit fixture. Career regression now verifies PDF bytes and retrieves version metadata separately, matching the closure branch's binary PDF API.

## Verification actually performed

| Check | Result |
|---|---|
| Original backend strict compilation before fixes | Passed |
| Updated backend production compilation | Passed |
| Strict typecheck of application plus new regression test | Passed |
| New regression suite | 11 tests passed, zero failures (Node includes the parent test in this total) |
| Original eleven planned regression scripts | Each passed against a fresh isolated database; platform and P3/P4 required the test corrections described below and successful reruns |
| Notes upload, profile upload, PDF export scripts | All three passed against fresh isolated databases |
| Whitespace/diff check | Passed |

The original eleven scripts were test-admin-foundation, test-admin-users, test-admin-academics, test-admin-content, test-admin-platform, test-admin-reports, test-admin, test-p1-p2, test-p3-p4, test-ai-notes and test-analytics.

The new suite checks normalized values in actual persisted department records; Express body/query/params transformations; rejection of foreign study-plan links without mutation; exact downloaded bytes; unauthorized/foreign file access; replacement cleanup; compensated note attachment failure; stale attachment rejection; explicit note deletion cleanup; path traversal; and timeout behavior.

The platform suite initially failed because an empty seeded database has no audit entries. Its own unchanged-value setting update now creates an auditable fixture. P3/P4 initially failed because it parsed the PDF response as JSON; it now checks Content-Type, attachment disposition, PDF signature and nonempty bytes while checking template/version metadata through GET resume. No production admin feature changes were made to satisfy either test.

### Environment qualification

Native PostgreSQL installation was unavailable under workspace system permissions. Runtime tests used **PGlite 0.5.8 with pglite-server 0.1.5**, Node 24.19.0, the application's actual Prisma/pg adapter, and all nine migration SQL files applied to isolated in-memory databases. Every legacy script received a fresh schema, seeded admin and separate application process. This avoids cross-suite data pollution.

This verifies HTTP/application/persistence behavior in that test environment. It does **not** establish native PostgreSQL migration-engine behavior, concurrent native database transactions, Supabase access policies, or production deployment readiness. PGlite was temporary test tooling outside the repository; application dependencies and database architecture were not changed.

## Reproduce the new suite on native PostgreSQL

1. Create a dedicated database whose name ends in `_test`. Never point these scripts at a working development or production database.
2. In backend/.env, configure that DATABASE_URL, NODE_ENV=test, AI_PROVIDER=mock, STORAGE_PROVIDER=local, EMAIL_PROVIDER=console, JWT settings, CLIENT_URL, and explicit seed-admin credentials.
3. From backend/, run `npx prisma generate`, `npx prisma migrate deploy`, and `node --import tsx prisma/seed.ts`.
4. Run `npm run test:closure`. It typechecks the new suite, starts an ephemeral HTTP listener, and removes its own user/file/department/audit fixtures.
5. Run `npm run build`. For the legacy scripts, use a newly migrated/seeded disposable database for each script and a running server on port 5000. Many legacy scripts do not clean all their fixtures and some older scripts perform broad deletes; do not run the whole scripts directory against a shared database.

The backend's existing `npm test` placeholder has not been relabeled as a passing full suite. `test:closure` is the explicit command for this checkpoint.

## Remaining gates

- Repeat the new suite and the required regression manifest on native PostgreSQL with migration status verification.
- Exercise real Supabase private-bucket upload, signed download and deletion using a dedicated test bucket/environment.
- Storage cleanup is best effort if the provider is unavailable. Failures now log the affected file ID for retry; durable cleanup retry/reconciliation is not implemented.
- Cascading deletion through a semester, subject or user can still orphan stored files. This checkpoint handles direct note deletion and upload replacement/failure, not all cascade paths. Address before claiming complete storage lifecycle closure.
- Verify concurrent requests against native PostgreSQL; the stale-reference rejection test is deterministic and does not prove all race scenarios.
- Finish T6 career classification/eligibility/history, T7 analytics, T8 expanded study-plan outputs, and T9 production build/runtime/security gates.
- Resolve institutional enrollment/linkage, production email delivery and cross-site session behavior. Preserve existing scope decisions: document text extraction is future scope, and simple PDF template variants may share a layout.
- Report-filter correctness and remaining session/security findings remain in the research handoff; backend final freeze has not been declared.

No frontend work, production migration, live AI request or main/closure-branch merge was performed in this checkpoint.
