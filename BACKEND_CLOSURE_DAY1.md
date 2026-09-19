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

## Continuation — 19 September 2026: T6 career classification

Implemented the next closure task on the same working branch:

- Added ApplicationType (INTERNSHIP / PLACEMENT), EligibilityStatus (UNKNOWN / ELIGIBLE / NOT_ELIGIBLE), and nullable interviewHistory JSON, with a checked-in additive migration. Existing rows receive INTERNSHIP and UNKNOWN defaults; no historical category is inferred.
- Create and patch accept validated category, eligibility and interview history. History entries require an ISO datetime and nonempty round; optional notes/outcome are bounded. Sending [] clears history. Existing interviewDate/interviewRound and offerDetails remain supported.
- GET /api/v1/job-applications accepts applicationType. The /internships and /placements subroutes apply fixed category filters before the /:id route. All queries remain scoped to the authenticated student.
- Removed untyped Prisma update construction from the application service.

Verification: backend build and strict test compilation passed. The closure suite now passes 12 tests (including the parent), exercising defaults, filters, history persistence/clearing, invalid payloads, anonymous access, and cross-student read/update/delete rejection. Existing test-career-hub-job-applications and test-p3-p4 also passed, each with a fresh isolated database. All ten migration SQL files were applied by the PGlite runner; native PostgreSQL migration-engine and production verification remain pending.

The authorized push of 60c60bf was attempted, but Git failed because no HTTPS GitHub credential was available (could not read Username). No remote branch, main merge, pruning, or deployment was performed. The new migration has not been applied to a user database.

Next: T7 analytics, T8 expanded AI study plans, then T9 and the remaining security/lifecycle gates above. Backend closure is not declared complete.

## Continuation — T7 analytics

Added authenticated student endpoints GET /api/v1/analytics/subject-performance and GET /api/v1/analytics/internship-stats. Dashboard now includes academic.completedStudyPlans, academic.studyPlanGoalAchievementRate, career.resumeCompletionScore, and career.resumeCompletion (selected resume ID plus completed/missing sections).

Calculation contract:
- Subject performance reports attendance and assignment completion only; no grade is invented. SUBMITTED/GRADED assignments count as completed. Dashboard and subject performance share the same computation. Existing attendance semantics are preserved: use subject totals, falling back to records when totalClasses is zero; PRESENT/LATE count as attended, all records count in the denominator. Attendance write consistency and EXCUSED policy review remain a separate closure gate.
- Resume completion is populated sections / five * 100: personalInfo, education, experience, skills, projects. Active resume takes precedence, followed by most recently updated resume and a stable ID tie-breaker. Only its latest version counts. Empty/whitespace placeholders do not count. This is content presence, not quality or ATS analysis. A profile-uploaded PDF alone does not fill builder sections.
- Internship statistics include only the authenticated student's INTERNSHIP rows. Status counts are current states, not lifetime interview events. Offer rate is OFFERED / total * 100.
- Study-plan goal achievement is COMPLETED plans / all plans * 100, distinct from average progress. Empty denominators return zero.

Verification: backend build and strict test compilation passed; all 13 closure tests passed, including known-value formulas, empty accounts, resume selection/version behavior, category exclusion, authentication, and cross-student isolation. Both existing analytics scripts (test-analytics, test-analytics-hub) passed on fresh isolated PGlite databases. Native PostgreSQL verification remains pending.

Workflow instruction: user has deferred all publishing until remaining security checks finish. After an approved merge into main, retain the old branches without further commits; do not prune or delete them. No publishing, merging or branch deletion was attempted in this continuation.

Next scheduled task: T8 expanded study-plan output, followed by T9/security and environment verification. T7 completion is not a declaration of complete backend closure.

## Continuation — T8 expanded AI study plans

The existing POST /api/v1/ai/study-plan response now includes four required fields alongside title, recommendedTargetDate, overview and suggestedTasks:

- weeklySchedule: 1–49 recurring weekly sessions with day (uppercase English weekday), topic, integer durationMinutes (1–1440), and activity.
- revisionPlan: 1–50 entries with topic, strategy, and frequency.
- topicPriorities: 1–50 entries with topic, priority (HIGH/MEDIUM/LOW), and reason.
- goalRecommendations: 1–50 nonempty strings.

The TypeScript GeneratedStudyPlan type is derived from the Zod output schema to avoid type/validation drift. Gemini's requested response schema, prompt and adapter and the deterministic mock provider all include the new fields. Service validation preserves the fields and rejects missing, empty or malformed output; failures are recorded in the existing execution log. This remains a recommendation endpoint, not automatic creation of study plans/tasks or calendar scheduling. No database migration is needed.

Verification: backend build, strict test compilation and all 15 closure tests passed. Tests exercise the mock HTTP response, backward-compatible original fields, invalid output rejection and failure logging, missing fields, empty arrays, invalid priority and whitespace-only recommendations. A stubbed Gemini SDK verifies requested schema fields and adapter preservation without any network call. Existing test-p1-p2 and test-ai-notes also passed on isolated PGlite databases. Initial test-only mistakes (expected HTTP 200 rather than the existing 201, and createdAt rather than execution log startedAt) were corrected before the successful run.

Limitations: no live Gemini request was made; deployed model availability, real output quality and native PostgreSQL remain unverified. A weekly template is not a date-resolved calendar. Further security and T9 verification are still required before backend closure. Publishing remains deferred and branches will be retained after any later approved merge.

## Continuation — T9 build and production hardening (not closed)

Changes:
- Root build explicitly builds the two executable workspaces. The shared workspace currently contains no source/build target. Removed the obsolete frontend baseUrl setting and made its source alias relative; full workspace build passes without suppressing deprecation checks.
- TRUST_PROXY_HOPS defaults to zero instead of assuming a single trusted proxy. Configure it only after deployment routing is known. Production startup rejects short (<32 characters) or identical access/refresh signing secrets.
- Health returns 503 when the database cannot be queried. Malformed JSON returns 400; oversized JSON returns 413 instead of being misreported as internal errors.
- Production console email refuses delivery before logging message contents. Real Resend integration remains unfinished; production registration/reset email flows cannot be considered ready.
- Applied compatible dependency updates with npm audit fix (no force). Initial production audit: five high and two moderate findings. Compatible updates leave four high findings in the Prisma/config/deepmerge-ts/mysql2 dependency chain. The proposed forced Prisma downgrade was not applied. The zero-high audit gate is FAILED.
- Added scripts/test-production-hardening.ts and test:hardening. It requires NODE_ENV=test and a dedicated _test database, then launches the actual dist/server.js child with NODE_ENV=production and temporary strong secrets. It checks weak-secret startup rejection, database-backed health, security headers, missing authentication, JSON errors/size limit, authentication rate limiting and graceful SIGTERM shutdown.

Verification uses isolated PGlite, not native PostgreSQL or production infrastructure. Full workspace build and strict application/test compilation passed. Closure suite: 16 tests passed. Compiled production-mode smoke passed. See subsequent regression result below.

Remaining blockers before declaring backend closure:
1. Resolve the four high dependency audit findings with a supported dependency change and regression verification.
2. Implement/test server-side session revocation and refresh replay handling; current logout only clears the cookie and password reset does not revoke issued JWTs.
3. Complete real email delivery and verification/reset flows. The new console guard prevents disclosure, but does not implement delivery.
4. Resolve cascade file cleanup and retry/reconciliation behavior; verify private Supabase storage against a dedicated environment.
5. Finish institutional linkage, report filtering and attendance consistency findings recorded earlier.
6. Native PostgreSQL migrations/concurrency, live AI, deployment-specific cookies/CORS and proxy topology remain unverified. Hosting setup is deferred by user instruction.

No publishing, merging, pruning or branch deletion. Retain merged branches without future commits as instructed.

T9 regression result: all 14 baseline regression scripts passed on fresh isolated PGlite databases after the compatible dependency updates. Final production-only dependency audit confirms four high findings and zero critical/moderate findings. No @ts-ignore or @ts-nocheck directives were found in backend/src.
