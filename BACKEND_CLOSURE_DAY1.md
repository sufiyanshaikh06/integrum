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

## T9 continuation — database-backed sessions

Implemented AuthSession (user ownership, refresh hash, expiry) and User.authVersion with an additive migration. Login creates a session while conditionally locking the unchanged active user row; reset/deactivation can invalidate issuance. JWTs contain session/version claims, unique token IDs, and are verified with an HS256 allowlist and required claim checks. Existing pre-migration tokens are intentionally rejected; users must sign in again after rollout.

Refresh rotation uses a conditional database update against the previous token hash; only one exchange wins. Replayed/stale tokens receive 401. Rejection does not revoke the successfully rotated session. Logout deletes the current session, invalidating both its access and refresh tokens while retaining other sessions. Password reset conditionally consumes the reset token, increments authVersion and deletes all user sessions atomically. Account deactivation increments authVersion so old tokens stay invalid after reactivation. The maintenance administrator bypass checks the live session and current database role/status.

No plaintext refresh tokens are stored. Expired sessions are denied; a periodic expired-row retention/cleanup policy is not yet implemented. Already-running requests are not cancelled by revocation. Native PostgreSQL concurrency and deployment verification remain outstanding.

Verification: Prisma client generation, backend compilation and strict test compilation passed. The closure suite checks single-use refresh rotation, two simultaneous refresh attempts with one winner, logout rejection for both token types, password-reset token reuse rejection, all-session reset invalidation, old-password rejection and successful new login. The compiled production smoke and four targeted legacy scripts (admin foundation, admin users, admin, productivity/study-plan) passed in isolated PGlite. Final deactivation/reactivation checks are included in the closure suite.

This closes the implemented session-revocation gap locally, subject to native PostgreSQL verification. Remaining T9 blockers still include dependency findings, production email delivery, cascade storage cleanup and the other documented data/environment gates. Nothing has been published or merged.

## T9 continuation — Resend email adapter and outage recovery

Implemented the existing Resend provider using its documented POST https://api.resend.com/emails API (https://resend.com/docs/api-reference/emails/send-email). Requests contain configured EMAIL_FROM, recipient, subject and plain text, with bearer credentials, a 10-second abort signal and redirects rejected. Non-success responses, malformed success responses and network errors become a sanitized 503; credentials, message text and provider error bodies are not logged or returned. Configuration validates EMAIL_FROM and requires it plus RESEND_API_KEY when selecting resend. Provider acceptance is not proof of inbox delivery.

Registration now commits the account and baseline records before email network I/O. A delivery failure preserves the account, returns verificationEmailSent=false and tells the user to sign in and request verification again; normal registration preserves existing fields with the additional flag. This avoids holding a database transaction open during delivery. Password-reset delivery failure conditionally clears that request's token and returns the same generic public message as an unknown account. This prevents status-based account enumeration during provider outages. Resend-verification remains available for recovery. No automatic retry or durable email queue is implemented, and timing-based enumeration has not been evaluated.

Verification: backend build, strict test compilation, all 19 closure tests and the compiled production smoke passed. Tests stub network delivery and cover provider success, authentication/rate-limit/server failures, malformed success data, network failure sanitization, registration outage recovery, reset-token cleanup, generic response equality, email verification and password-reset recovery. No real message was sent or live credential used. Live delivery, sender verification and provider configuration remain open environment gates. Console email remains blocked in production.

The session and email code gaps now have local implementations. T9 is still open for the dependency findings, storage lifecycle, data-integrity findings and native PostgreSQL/live-environment gates. No push, merge or branch deletion.

Email continuation regression: admin foundation, admin users, and productivity/study-plan legacy suites all passed on fresh isolated PGlite databases.

## T9 continuation — durable storage cleanup

Added provider metadata to note/resume attachments and a StorageCleanup table. PostgreSQL AFTER DELETE/UPDATE triggers enqueue the old object reference inside the same transaction as record deletion/replacement. Cascaded subject, semester, student-profile and user deletion therefore queue file cleanup even when they do not pass through note controllers. Rolling back the transaction also rolls back its cleanup entries.

Committed replacement/direct-note cleanup is already queued by the database trigger. Immediate cleanup attempts storage deletion using the verified detached reference, or the unique file from a failed attachment. A failed storage deletion preserves or creates a queue entry and increments attempts. The retry processor checks for any remaining note/profile reference before deletion and selects local or Supabase storage from the saved provider. Delete is idempotent; duplicate workers may attempt the same object, and local missing files are treated as already removed. Newly uploaded files use unique object paths. External URLs are not queued or deleted.

Run `npm run storage:cleanup --workspace backend` from the repository with the correct environment and full tooling dependencies installed. Each invocation processes up to 100 known-provider entries and reports inspected/removed/pending counts. Cascaded file deletion is deferred until this command runs; scheduling it is a deployment task, not configured here. Run it repeatedly until known-provider work is drained; inspect persistent failures. Unknown-provider entries remain pending and are excluded from batches so they cannot starve known jobs.

Pre-migration attachments deliberately retain unknown provider metadata. Confirm their actual storage location before backfilling fileStorageProvider/resumeStorageProvider or queued provider values; never guess from the current environment setting. Keep storage base directory, bucket and project stable; these are not recorded per object. Do not switch storage configurations without migrating existing attachments.

Limitations: upload-before-attachment process crashes can still leave unreferenced files before any database attachment exists. Compensating cleanup while the database itself is unavailable cannot durably enqueue and emits a retry-required log. A full storage inventory reconciliation/upload-intent workflow is not implemented. Native PostgreSQL trigger/concurrency and real Supabase verification remain open; this is not a complete storage lifecycle sign-off.

Storage verification: Prisma generation, backend compilation and strict test compilation passed. The final uninstrumented full run passed all 20 closure tests plus compiled production smoke. New tests verify subject/semester/user cascades, resume cleanup, transaction rollback, injected storage outage with retained attempts, successful retry, and unknown-provider preservation. Both legacy upload suites passed earlier in this slice. Initial full runs exposed an extra readable file after the failed-attachment case when immediate cleanup used the same multi-query routine as retries. Diagnostic/focused runs were inconsistent. Immediate compensation was separated from the retry reference checks; the final normal suite then passed. Native filesystem/PostgreSQL verification remains necessary before storage sign-off.

## T9 continuation — dependency audit remediation, 20 September 2026

Resolved the four remaining production dependency findings while retaining Prisma 7.10.0. Root package.json now declares the Prisma CLI as a shared workspace dependency and overrides deepmerge-ts to 8.0.2 and mysql2 to 3.24.4. The backend continues to own its Prisma client and PostgreSQL adapter. Install dependencies from the repository root; commands run from backend still resolve the root CLI and backend/prisma.config.ts.

Why the packaging change: root overrides were not applied to the workspace-only CLI dependency in the tested npm 11.9.0 resolution. Merely adding overrides left the vulnerable versions installed. Moving the CLI declaration to the root made npm honor both overrides. A clean npm ci --ignore-scripts succeeded, and npm ls then reported the exact patched dependencies as overridden with no invalid-package errors.

The lockfile update was limited to the two libraries and MySQL2's new sql-escaper dependency using npm-generated registry metadata; broad unrelated updates from a fresh graph were discarded. Prisma was not downgraded and no release-candidate upgrade was taken. The CLI remains a production dependency, so the audit improvement is not a dependency reclassification that hides vulnerable packages.

Compatibility risk: deepmerge-ts 8 is a major release (changed Map merging and type/helper behavior). The installed Prisma config loader uses deepmerge for our plain-object configuration. Actual config loading, prisma validate, prisma generate, and offline migrate diff --from-empty --to-schema passed with the overrides. This does not establish compatibility for arbitrary future Prisma configurations or native database migrations. Reassess/remove these overrides when upstream Prisma adopts patched dependencies.

Primary upstream references: https://github.com/RebeccaStevens/deepmerge-ts/releases/tag/v8.0.0 and https://github.com/sidorares/node-mysql2/releases .

The final npm audit --omit=dev reported zero findings in every severity category. This is a dependency audit result, not proof that application logic or deployment is fully secure. Native PostgreSQL migrations/concurrency, live services, remaining data-integrity findings and storage reconciliation limitations remain outstanding. Full application regression results are recorded below after completion.

Final dependency-remediation verification: the full root build, strict backend test compilation, all 20 closure tests, compiled production smoke and all 14 baseline regression scripts passed with the cleanly installed patched dependency tree. The regression runner applies all 12 migration directories to isolated PGlite databases (its startup label still says nine); this is not native PostgreSQL migration-engine verification. No real email, Gemini or Supabase calls were made. The dependency audit gate is passed locally; T9 remains open for the documented data-integrity and environment gates. No publishing, merge or branch deletion was performed.

## T9 continuation — attendance write integrity, 20 September 2026

Attendance create/update/delete now lock the owned Subject row before touching its records, and commit the record mutation plus recalculated totals in one explicit READ COMMITTED transaction. Subject PATCH uses the same row lock, so manual totals and record writers serialize per subject. An update/delete rechecks record existence after acquiring the lock. Counts use database aggregates rather than loading every record. The previous public recalculation helper without a transaction was removed; all application record writers use the shared transaction helper.

Manual totals must be nonnegative integers with attendedClasses <= totalClasses, including partial PATCH requests evaluated against the stored counterpart. Invalid totals return 400. Manual totals are supported only when no individual records exist; attempts to override record-derived totals return 409. Adding the first record when nonzero manual totals exist also returns 409 instead of silently erasing the historical summary. The user must deliberately clear both totals before reconstructing attendance as individual records. Deleting the last record returns both totals to zero and permits manual totals again. Do not silently clear manual totals in the frontend. Changing unrelated subject fields, including attendanceGoal, remains allowed with records present. Creating a record for an inaccessible/missing subject now returns 404, matching the owned-subject lookup; record update/delete retain 404 and successful deletion retains 204.

Counting policy is preserved: PRESENT and LATE count as attended; all records, including EXCUSED, count in totalClasses. No unique date rule was introduced because multiple classes per day are possible. Any change to EXCUSED policy needs a separate product decision. Historical inconsistent rows are not bulk rewritten, and raw database writes bypass these service-level guards. Existing record-based totals are recalculated on their next record mutation; production data review is still required. No schema migration was added.

New HTTP/database tests cover partial-update validation, manual/record conflicts without data loss, unchanged goal editing, cross-user denials, concurrent creates and mixed update/delete operations, removal of the final record, and database-trigger fault injection proving create/update/delete rollback when aggregate persistence fails. The trigger exists only within the disposable test database and is removed in a finally block. An initial test assertion expected 200 for successful deletion; the existing API returns 204, and the assertion was corrected without changing the API.

Verification results are recorded below after the affected suites finish. Native PostgreSQL multi-connection locking/deadlock behavior is still an open gate; PGlite coverage is not a substitute. Institutional linkage, report filters, live services and the earlier storage lifecycle limitations remain outstanding. Publishing stays deferred; branches are retained.

Final attendance verification: backend build and strict test compilation passed; all 22 closure tests and the compiled production smoke passed. Legacy test-p1-p2, test-analytics and test-admin-academics each passed on fresh isolated PGlite databases with all 12 existing migrations. No live-service calls or native PostgreSQL tests were performed. Attendance service-level consistency is implemented and locally verified; T9 is not fully closed.

## T9 continuation — report filter integrity, 20 September 2026

Verified institutional relationships remain incomplete: student profile courseId, semester academicTermId and subject masterSubjectId exist in the model, but their full write journeys are not implemented. This slice fixes the independent report-filter defect first; it does not claim to close enrollment/linkage.

User reports now apply the selected course/department to totals, rates, registrations, course/department breakdowns and unassigned counts. Date bounds apply to User.createdAt throughout those results. Institutional filters describe the student enrollment cohort, so scoped reports exclude admins and report admins=0; unfiltered reports retain all roles. Empty selected courses remain visible with zero students. With an institutional filter, unassignedStudents is zero because those students are outside the cohort.

Usage reports now validate and apply course/department filters to both AI logs and career applications. Missing references return 404 and incompatible course/department pairs return 400, matching the other reports. AI date bounds use startedAt. Career bounds and monthly grouping both use createdAt; appliedDate and the current clock no longer move undated applications into inconsistent buckets. Registration daily/monthly/ISO-week grouping and career monthly grouping use UTC, with career months sorted chronologically. The period query controls registration grouping only; the established career response remains applicationsByMonth.

Academic date bounds select AttendanceRecord.date and Assignment.createdAt inclusively. Completion remains the current SUBMITTED/GRADED status of assignments created in the window, not a historical completion-event count. Bounded attendance uses only matching records; manual totals have no date attribution and are excluded. New dateScope metadata identifies the date bases and counts subjectsWithExcludedManualTotals so the frontend can explain omitted historical summaries. With date bounds, totalStudentSubjects counts subjects with matching attendance/assignment activity. Course/department student counts and unassignedStudents describe the current selected enrollment population, not only students active in the window. Unbounded academic reports preserve manual-total fallback and existing attendance counting policy.

Historical enrollment is not modeled; reports use current course membership, not membership at the event date. No migration or historical-data rewrite is included. Report reads are not a transaction-wide snapshot under concurrent writes. These limitations remain explicit rather than presenting the output as a historical audit ledger.

Verification: backend build and strict test compilation passed. New isolated fixtures exercise two departments, matching and excluded records, exact inclusive date boundaries, empty cohorts, cross-filter rejection, missing courses, manual-total exclusion and creation-date monthly attribution. The closure runner uses TZ=America/Los_Angeles to verify UTC boundary behavior. The existing test-admin-reports HTTP suite passed, including its RBAC and validation checks. Final closure-suite results follow below. No publishing, merge or branch deletion.

Final report verification: all 23 closure tests and the compiled production smoke passed under TZ=America/Los_Angeles on isolated PGlite with all 12 migrations. The existing admin-report regression suite passed on a separate fresh isolated database. Together with the backend build and strict test compilation, this verifies the report-filter slice locally. Institutional linkage, native PostgreSQL and live-environment gates remain open; T9 is not fully closed.

## T9 continuation — student academic-term linkage, 20 September 2026

Added student-only GET /api/v1/semesters/academic-terms before the parameterized semester route. It lists active institutional terms with validated page/limit pagination (default 1/20, maximum 100 per page), a deterministic order and public calendar fields only. It exposes no other student's semesters or administrative counts.

Semester POST/PATCH now accepts optional academicTermId (UUID or null). Omission preserves legacy unlinked creation or the existing link on PATCH; null explicitly unlinks. A new link requires an existing active term (404 if missing, 409 if inactive). Existing links remain readable/editable after the term is deactivated. Semester create/list/detail/update responses include the selected term's calendar metadata. Linking is a calendar reference; student names/dates are not silently overwritten, and no unrequested requirement to exactly match institutional dates was introduced.

Semester date edits now validate the merged stored/provided range, including one-field PATCH. Writers lock the owned semester before reading it and use explicit READ COMMITTED transactions. New term attachments hold a shared term lock while validating and saving. Admin term updates/deletion take an exclusive term lock before reading dates/reference counts, preserving the existing deletion guard against attachments racing its count check. Admin audit behavior is unchanged. Direct database writes still bypass service checks; no migration or historical backfill is included.

This slice addresses calendar linkage. Student course enrollment and master-subject linkage remain open, along with native PostgreSQL concurrency and live-environment gates. Verification results follow below when complete. No publishing, merging or branch deletion.

Initial verification exposed two failures: the concurrent date-edit test returned two successes despite the row lock, and the previously intermittent failed-attachment storage test observed an older file reappearing. The locking result is not treated as native PostgreSQL evidence. Semester PATCH now also uses compare-and-set on the previously read dates and term link, returning 409 on a stale edit; merged-date violations return 400. The existing filesystem test is retained without retries or weakened assertions. Its recurrence remains an unresolved storage verification risk even if a subsequent run passes. Final run results follow.

Term-linking verification checkpoint: backend build and strict test compilation passed. The final full closure run passed the new term-linking/concurrent-edit subtest, but failed the existing failed-attachment storage subtest (22 passed, 2 failed including its parent suite). Therefore the full suite is NOT green. Existing test-admin-academics and test-p1-p2 regressions passed. The compiled production smoke passed independently after the failed suite. Semester compare-and-set behavior is locally verified; native PostgreSQL locking remains unverified. Storage investigation takes priority next.

### Storage failure investigation after term linkage

A temporary diagnostic copy of the test suite traced LocalStorageProvider upload/delete calls and immediate directory listings. The failing upload's newly created object was deleted successfully. The previously replaced object was absent immediately after deletion and then reappeared in a later listing, with no matching second upload call. The cleanup queue was empty. A similar reappearance was observed in a cascade fixture. This does not demonstrate an omitted compensating delete in the tested controller, and its cause remains unproven. Diagnostic instrumentation was removed; no speculative storage-code change was made.

Standalone filesystem probes passed 100 create/read/delete cycles under /tmp and another 100 under the actual workspace uploads directory. These probes did not reproduce the issue. The unchanged, uninstrumented full suite was then run with no concurrent workspace commands: all 24 tests and the compiled production smoke passed (test duration approximately 57 seconds). Earlier overlapping-workspace runs failed. This supports investigating execution-environment interference, but one uninterrupted pass does not establish causality or eliminate the native filesystem/storage verification gate. Do not describe the issue as fixed merely because this run passed. Avoid concurrent workspace commands during the next storage verification run.

Term-linking code is saved in local commit df6d176. Admin-academics and p1-p2 regression checks also passed earlier. Remaining implementation work: course enrollment and master-subject linkage; remaining verification includes native PostgreSQL concurrency, native filesystem behavior and live services. Nothing published, merged or deleted from Git branches.

## T9 continuation — admin-controlled course enrollment

Added PATCH /api/v1/admin/users/:id/enrollment under the existing authenticated ADMIN boundary. The path ID is a user UUID; the strict body requires courseId as a UUID or explicit null to unenroll. Missing/malformed values and extra fields return 400; missing users/courses return 404; non-student targets return 400. No student self-enrollment authority was added. The existing self-profile update strips unsupported fields, so sending courseId there does not change enrollment.

Enrollment writes lock the target user and student profile and hold a shared lock on the selected course. The profile update also checks the previously read courseId and rejects a stale write with 409. Changing/clearing enrollment is rejected when existing linked syllabus subjects would belong to a different course; no personal subjects or historical work are silently deleted. Future master-subject attachment writers must acquire the same profile lock before validating/attaching. Admin course deletion now locks the course before its existing dependent-record checks. Transactions explicitly use READ COMMITTED. Native PostgreSQL concurrency verification is still required; direct database modifications bypass service checks.

A changed enrollment and its STUDENT_ENROLLMENT_UPDATED audit row commit atomically. The audit records actor, target user, student profile, previous/new course IDs and the existing IP metadata. Repeating the same course assignment returns the current enrollment without a duplicate audit. GET /users/me now exposes the student's course ID plus course/department ID, name and code, without exposing other enrolled students. Existing admin course listing supplies the selection catalog. This stores current enrollment only; it is not a dated enrollment-history model. Reports continue to group by current membership.

Verification: backend build and strict test compilation passed. All 25 closure tests and compiled production smoke passed on isolated PGlite with all 12 migrations, followed sequentially by passing test-admin-users, test-admin-academics and test-admin-reports suites. No concurrent workspace commands were run during those checks. New coverage includes unauthenticated/student rejection, strict body/path validation, missing references, non-student targets, idempotence, audit details, profile visibility, blocked self-assignment, incompatible syllabus links, explicit unenrollment and a forced audit-insert failure proving enrollment rollback. The temporary runner's process timeout was raised from 60 to 120 seconds because the expanded suite now takes approximately 62 seconds; assertions were not relaxed.

This closes the implemented course-enrollment API gap locally. Next: student master-subject lookup/linking with consistent profile locking and catalog mutation guards. Native PostgreSQL/live-service verification and the earlier storage/runtime uncertainty remain open. Nothing pushed, merged or deleted from Git branches.

## T9 continuation — syllabus-subject lookup and linking

Added student-only GET /api/v1/subjects/syllabus before the subject-ID route. Pagination defaults to page 1/limit 20 with a maximum limit of 100. The catalog is restricted to the student's current enrolled course; unassigned students receive an empty catalog. Responses contain syllabus metadata, not other students' records or administrative counts.

Subject POST/PATCH accepts optional masterSubjectId (UUID or null). Omission preserves existing behavior/link; null unlinks. Selecting a missing entry returns 404 and selecting an entry without matching enrollment returns 409. Ownership is enforced before modifying an existing subject. Subject create/list/detail/update responses include selected syllabus metadata. Personal name, code, credits and academic work are not overwritten by catalog values. Multiple personal subjects may reference one syllabus entry, including repeat attempts; no new uniqueness or semester-number policy was invented.

Attachment transactions lock the student profile using the same lock as enrollment updates and hold a shared lock on the selected catalog row through validation/persistence. Subject updates retain the attendance row lock and its consistency checks. Admin master-subject update/delete now acquire an exclusive catalog-row lock before checking dependents. Moving a referenced catalog entry to another course returns 409; existing deletion restrictions remain. These service-level checks use explicit READ COMMITTED transactions and need native PostgreSQL concurrency verification. Direct database writes bypass these checks; no migration/backfill was performed.

Verification: backend build and strict test compilation passed. All 25 closure tests passed with the existing enrollment test expanded to cover catalog scoping, unauthenticated requests, pagination validation, cross-user edits, malformed/missing/cross-course IDs, creation and linking/unlinking, link preservation on unrelated edits, and rejection of referenced catalog moves/deletion. Compiled production smoke plus test-admin-academics and test-p1-p2 regressions passed sequentially on isolated PGlite with all 12 migrations, without concurrent workspace commands. No assertions were weakened; this suite took about 70 seconds.

The three previously missing institutional relationship write paths are now implemented locally: admin course enrollment, personal semester-to-term linkage, and personal subject-to-syllabus linkage. This does not close T9: native database migration/concurrency, native filesystem/storage uncertainty, provider/live-environment checks and remaining documented deployment/data semantics still need verification. No push, merge or branch deletion.
