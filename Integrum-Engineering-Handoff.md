# Integrum — Engineering Handoff and Backend Closure Runbook

**Prepared for:** Sufiyan Shaikh and the next developer or coding assistant  
**Snapshot date:** 17 October 2026  
**Repository:** https://github.com/sufiyanshaikh06/integrum  
**Implementation branch:** `fix/backend-closure-day1`  
**Latest code checkpoint:** `10ecb2a` (Canonical Vercel + Render + Supabase configuration verified; 54/54 native tests; 13/13 browser workflow stages passed)  
**Status:** Phase 3 accepted (`ec68594`); Phase 4 accepted (`e5a84f2` / `10ecb2a`); canonical multi-platform deployment topology configured for Vercel (frontend), Render (backend & continuous reminder processor), and Supabase (PostgreSQL); open gates remain B02–B04, B07, B08.

> Read sections 1–3 before running commands. This document contains design rationale and decision summaries, implementation evidence, limitations, and next actions. It is not a claim of exhaustive security certification or a guarantee of zero defects. Commands involving merges, real databases, or publication have explicit prerequisites. Do not paste the entire document into a terminal.

## Contents

1. Immediate handoff and authoritative state
2. Product purpose, frozen scope, and decision rules
3. Recovery package and exact history preservation
4. Architecture and source navigation
5. Requirements versus implementation
6. Commit-by-commit change ledger
7. Critical behavior contracts and design rationale
8. Verification evidence and its limits
9. Remaining gaps, priorities, and acceptance evidence
10. Definition of a closed backend
11. Exact Windows native verification
12. Failure investigation and review policy
13. Git publication, branch integration, and conflicts
14. Database, storage, and rollout discipline
15. Frontend direction and development schedule
16. Successor instructions and reporting templates
17. Evidence sources and reference index
18. Generated source inventory and recovery appendix
19. Product requirement reconciliation and V1 scope matrix
20. Schema, lifecycle, and concurrency reference
21. Route authorization, input validation, and HTTP response atlas
22. Cross-domain data flow and transaction invariants
23. Storage provider, cleanup queue, and lifecycle operations
24. Phase 2 closure and feature acceptance ledger
25. Phase 3 reconciliation acceptance, Phase 4 implementation, and final backend gates

## 1. Immediate handoff and authoritative state

### 1.1 The next task

Finish the native Windows verification using the corrected production smoke test. Do not restart the project or rebuild completed modules. Do not declare T9 complete merely because the number of tests is green.

The user ran the native runner on the laptop in:

```text
D:\ALL_PROJECTS\integrum-backend-transfer
```

That folder was created from the earlier Git bundle. It is distinct from the original project folder `D:\ALL_PROJECTS\integrum`, which must remain untouched until its independent changes have been inventoried.

The first native run produced:

| Check | User-provided result |
|---|---|
| Create uniquely named disposable PostgreSQL database | Passed |
| Independent connections, row lock, rollback | Passed |
| Prisma migration deployment and status | Passed |
| Prisma client generation | Passed |
| Backend build and strict test typecheck | Passed |
| Seed disposable database | Passed |
| Closure suite | **25 tests passed, 0 failed** |
| Compiled production HTTP/security smoke checks | Passed up to shutdown |
| Clean shutdown assertion | Failed: `null !== 0` |
| Remove disposable database | Passed |
| Whole command | Exit code 1; correctly failed |

Evidence directory on the user's laptop:

```text
D:\ALL_PROJECTS\integrum-backend-transfer\backend\test-results\integrum_native_c918af09f292d6ae_test
```

Its `result.json` reported `testsPassed: false`, `cleanupSucceeded: true`, completed at `2026-09-21T03:12:47.155Z`. Retain this first historical failure for provenance.

Subsequent native Windows runs confirmed full resolution:
1. **Phase 3 Reconciliation Checkpoint (`ec68594`):**
   - Closure suite expanded to **46 tests passed, 0 failed**.
   - Compiled production smoke passed with clean IPC child shutdown (`code: 0`).
   - Disposable database created, migrated, seeded, tested, and dropped with `testsPassed: true`, `cleanupSucceeded: true`.
2. **Phase 4 Data Consistency Checkpoint (`48ba2ed`):**
   - Closure suite expanded to **52 tests passed, 0 failed**.
   - Latest disposable database: `integrum_native_7772534b3cf69a3c_test`.
   - Results: `testsPassed: true`, `cleanupSucceeded: true`, completed at `2026-10-17T03:08:55.004Z` on PostgreSQL 18.4 (x86_64-windows).
   - All 8 stages passed: independent connections, row lock/rollback, Prisma migrations, client generation, backend build, test typecheck, database seed, 52/52 closure tests, and compiled production smoke check.
3. **Phase 4 Final Real-Browser Verification Checkpoint:**
   - Closure suite expanded to **54 tests passed, 0 failed**.
   - Production smoke: Passed with clean child IPC shutdown (`code: 0`).
   - Headless Google Chrome Real-Browser Verification: **13/13 stages passed** covering static asset serving, SPA routing, 404 API error responses, reverse-proxy HTTPS cookies, student sign in, semester/subject creation, assignment creation, task creation with W07 atomic row-lock completion (`completedAt` verified in DB), study notes creation/view/delete, unified calendar agenda, in-app notifications read/unread toggle, page reload persistence, form validation error toasts without false success, Student B ownership isolation, and permanent logout.
   - Latest disposable database: `integrum_native_3badc1a86280daf5_test`.
   - Results: `testsPassed: true`, `cleanupSucceeded: true`, completed at `2026-10-17T04:15:45.246Z` on PostgreSQL 18.4 (x86_64-windows).
   - All 9 runner stages passed cleanly.

### 1.2 The Windows fix

Commit `6a58d18` changes the smoke test and its documentation, not the production server. The old test used `child.kill('SIGTERM')` and then required normal exit code zero. Windows forcibly terminates child processes for this operation. The corrected Windows-only launcher establishes a private parent/child IPC channel and invokes the compiled server's existing SIGTERM handler inside the child. Linux still receives a real SIGTERM. Both paths must exit normally with code zero, without a terminating signal, within five seconds.

This verifies application shutdown logic on Windows, **not Windows OS delivery of POSIX signals**. Node documents the platform difference in its [child-process API](https://nodejs.org/api/child_process.html#subprocesskillsignal).

The corrected script was built/typechecked and both paths were exercised on Linux against an isolated PGlite database. That is evidence for the implementation, not a replacement for the pending Windows run.

### 1.3 Distinguish the three code locations

| Location | Known state | What must not be assumed |
|---|---|---|
| Assistant workspace repository | Clean at `6a58d18` when packaging began | Not durable by itself; download the recovery package |
| Laptop transfer folder | Originally restored at `86df369`; user was instructed to copy corrected smoke file | Copy success and rerun success have not been reported; a copied file does not import its Git commit |
| GitHub | Historical access and repository permissions confirmed; terminal push failed for missing credentials | No successful push of these closure commits is confirmed; remote main and current remote branch tips were not refreshed for this handoff |

Latest source is recoverable from the **new** bundle included with this handoff. The older `Integrum-Backend-Closure.bundle` ends at `86df369` and does not include `6a58d18`.

### 1.4 Evidence precedence

1. Current explicit user decisions govern scope and authority.
2. The inspected source and exact commit establish implementation behavior.
3. Reproducible logs tied to a commit establish tested behavior in that environment.
4. The approved synopsis defines the product commitment, with later explicit user amendments noted.
5. Historical progress documents and chat exports explain intent but may be outdated.

`PROJECT_PROGRESS.md` contains older “ready for frontend” and completion statements that were superseded by later defects. `BACKEND_CLOSURE_DAY1.md` is chronological: an early “remaining” item may have been implemented later. Never quote an early section as the final state without reading its continuation.

## 2. Product purpose, frozen scope, and decision rules

### 2.1 What Integrum is meant to deliver

**Integrum — AI-Powered Student Success Platform: An Integrated Academic, Productivity and Career Management System.**

It is a single-institution student platform connecting academic work, personal productivity, and career preparation to one authenticated profile. A student should manage semesters, subjects, notes, assignments, attendance, study plans, tasks, resumes, skills, certifications, projects, internships, and placements without switching between disconnected tools. Administrators manage users, institutional academic catalogs, platform content, settings, feedback, and reports.

AI belongs inside resume review, study planning, and notes assistance. It is not a separate chatbot product. Analytics must explain real stored activity, not manufacture academic marks or employment guarantees.

### 2.2 Frozen V1 modules

| Pillar | Intended user outcome |
|---|---|
| Identity & Access | Register, verify email, sign in, recover password, manage profile, use appropriate student/admin permissions |
| Academic Hub | Organize subjects/material, track assignments and attendance, plan study, see academic dates |
| Career Hub | Build/version/export resumes, track skills and evidence, manage internships and placements |
| Productivity Hub | Track tasks, goals and reminders, including useful deadline/alert journeys |
| AI Intelligence Hub | Review resumes, propose study/revision plans, summarize notes and generate learning aids |
| Analytics Hub | Understand attendance, assignments, study progress, productivity and career activity with transparent formulas |
| Administration Portal | Manage users, catalogs, content, feedback/settings, audit activity and reporting |

Do not remove Productivity or Analytics from V1 merely because an old reviewer suggested postponement. The user chose the full seven-pillar scope.

Out of V1: OCR, voice assistant, recruiter portal, faculty dashboard expansion, direct company APIs, a dedicated recommendation engine, and native mobile apps. Simple recommendations inside the approved AI features are in scope; a new recommendation-engine subsystem is not. Uploaded-document text extraction was treated as future work in closure discussions; do not imply uploaded PDFs automatically become AI-readable note text.

### 2.3 Architecture and policy commitments

- Keep React + TypeScript + Tailwind/Vite frontend; Express + TypeScript backend; PostgreSQL + Prisma; custom JWT authentication and bcrypt.
- Apply Clean Architecture and SOLID pragmatically through existing routes/controllers/services/providers. Do not impose a wholesale directory rewrite to satisfy a label.
- Preserve ownership: Assignment/Note → Subject → Semester → StudentProfile → User. Derive higher ownership through relationships.
- Schema presence is not a complete feature. A feature needs a usable authorized API journey, validation, persistence, error behavior, tests, and eventually UI.
- Fix implementation defects autonomously within agreed scope. Ask for a product decision when changing attendance policy, enrollment authority, historical semantics, architecture, or committed feature scope.
- Never weaken strict TypeScript, bypass a failing test, or hide a provider failure to get a green result.
- Keep changes reviewable and committed in coherent slices; document reason, behavior, evidence, and limitations.
- Preserve all old branches after merge. “Close” means stop committing to them, not delete or prune them.
- Deployment was postponed until backend stabilization. Supabase database/storage and Vercel frontend are intended directions; backend hosting needs an explicit later decision.

**Historical hosting discrepancy:** the synopsis and an early planning export mention Render. The user later questioned that choice and deferred deployment discussion. Record this discrepancy honestly; do not treat the historical mention as current permission to deploy to Render, or claim Render was never mentioned.

**Session design refinement:** the synopsis described stateless JWT sessions. Revocation requirements led to database-backed sessions while retaining JWTs. This is a deliberate security implementation refinement; describe the actual design in the final report.

## 3. Recovery package and exact history preservation

### 3.1 Files in the package

- `Integrum-Engineering-Handoff.md`: this document, including source-derived appendices.
- `Integrum-Complete-Handoff.bundle`: complete Git history reachable from the local refs listed below, including the latest Windows fix.
- `checksums.sha256`: hashes of package files, excluding itself.

The bundle contains committed repository files and history, including migrations and scripts. It does **not** contain installed dependencies, ignored local environment files, database data, uploaded user files, laptop-only edits, secrets, or native logs from the user's laptop. It does not claim to contain branches that existed only on GitHub and were never fetched here.

Bundle SHA-256:

```text
8b13422cacd60621c4a1422c1afeb887692a19648bb59ec8d76ac9200f5e9edd
```

Included refs:

| Ref | Commit |
|---|---|
| `refs/heads/fix/backend-closure-day1` | `6a58d18e92f3b425fa21b92d6a03cd8efdabaa1f` |
| `refs/heads/backend/v1-closure` | `00aeabf7d801d29d92aed20cc0ae37e9e64284a1` |
| `refs/remotes/origin/backend/v1-closure` | Same historical `00aeabf7...` |
| `refs/tags/v0.1.0-foundation` | `ebfdc038a8610752ca9a387da46c1a0f73252a49` |
| `HEAD` | `6a58d18e92f3b425fa21b92d6a03cd8efdabaa1f` |

There is no local `main` ref in this package. Fetch the actual remote main later; do not create a fictional main history.

### 3.2 Safest recovery: a new checkout

Extract the ZIP into `D:\ALL_PROJECTS\integrum-handoff-package` so the bundle is directly inside that folder. Adjust only the package path if extraction produced another nesting level.

Run these blocks in **PowerShell**, not Command Prompt. Stop at an error.

```powershell
$bundle = 'D:\ALL_PROJECTS\integrum-handoff-package\Integrum-Complete-Handoff.bundle'
$expected = '8b13422cacd60621c4a1422c1afeb887692a19648bb59ec8d76ac9200f5e9edd'
if ((Get-FileHash -LiteralPath $bundle -Algorithm SHA256).Hash -ne $expected) {
    throw 'Bundle checksum mismatch. Stop.'
}
$destination = 'D:\ALL_PROJECTS\integrum-handoff-restored'
if (Test-Path -LiteralPath $destination) { throw 'Destination already exists. Choose a new folder.' }
git clone --branch fix/backend-closure-day1 "$bundle" "$destination"
if ($LASTEXITCODE -ne 0) { throw 'Clone failed.' }
Set-Location -LiteralPath $destination
git bundle verify "$bundle"
if ($LASTEXITCODE -ne 0) { throw 'Bundle verification failed.' }
git fsck --full
if ($LASTEXITCODE -ne 0) { throw 'Repository integrity check failed.' }
$expectedHead = '6a58d18e92f3b425fa21b92d6a03cd8efdabaa1f'
if ((git rev-parse HEAD).Trim() -ne $expectedHead) { throw 'Unexpected HEAD.' }
git status --short
```

Status should be empty. This new folder becomes the project root for subsequent commands. Keep both previous laptop folders intact until compared. Do not manually copy `.git` between folders.

```powershell
git remote set-url origin https://github.com/sufiyanshaikh06/integrum.git
if ($LASTEXITCODE -ne 0) { throw 'Remote configuration failed.' }
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
```

A new clone restores the working branch, but other bundled heads may appear as remote-tracking refs rather than local branches. The bundle remains the exact preservation copy. Verify refs before creating any additional local branch; do not overwrite an existing branch to make names match.

### 3.3 If continuing in the existing transfer folder

First inspect `git status --short`, `git log -5 --oneline`, and `git diff`. A manually copied fixed smoke script will appear as an uncommitted modification at old HEAD `86df369`. Do not commit a duplicate version and then cherry-pick the same fix blindly. Prefer the clean restore above, and compare/carry forward any genuine independent laptop changes deliberately. Keep native logs from the earlier folder as evidence.

The bundle preserves original commits. Downloading/copying one source file does not preserve commit metadata. The local assistant commits use `Codex <codex@openai.com>`; pushing them through the user's GitHub account does not rewrite authorship. Configure the user's name and verified email for **future user-authored commits**, not to retrospectively disguise old commits.

## 4. Architecture and source navigation

```mermaid
flowchart TD
    UI["React frontend — starter at handoff"] --> API["Express REST API"]
    API --> Guard["Authentication, authorization, validation"]
    Guard --> Domain["Controllers and domain services"]
    Domain --> DB["Prisma and PostgreSQL"]
    Domain --> Files["Local or Supabase storage"]
    Domain --> AI["Mock or Gemini provider"]
    Domain --> Mail["Console or Resend provider"]
    DB --> Queue["Storage cleanup queue"]
    Queue --> Worker["Explicit cleanup command"]
    Worker --> Files
```

The REST base is `/api/v1`. `backend/src/app.ts` mounts routes and middleware. `backend/src/server.ts` starts HTTP and handles shutdown. Importing `app.ts` for tests avoids requiring a permanent listening server.

| Area | Source to inspect |
|---|---|
| Runtime/environment | `backend/src/app.ts`, `server.ts`, `config/env.ts`, `config/prisma.ts` |
| Auth and cookies | `services/auth.service.ts`, `middleware/authenticate.ts`, `middleware/authorize.ts`, `utils/jwt.ts`, `utils/cookies.ts` |
| Input/error contracts | `schemas/`, `middleware/validateRequest.ts`, `middleware/errorHandler.ts`, `utils/ApiError.ts`, `utils/ApiResponse.ts` |
| Academic consistency | `services/attendance-consistency.ts`, `attendance.service.ts`, `subject.service.ts`, `semester.service.ts` |
| Institutional writes | `services/admin/user.service.ts`, `services/admin/academic.service.ts` |
| Reports/analytics | `services/admin/report.service.ts`, `services/analytics.service.ts` |
| Private files | `controllers/note.controller.ts`, `controllers/user.controller.ts`, `services/storage/` |
| AI | `services/ai.service.ts`, `services/ai/`, `schemas/ai.schema.ts` |
| Email | `services/email.service.ts`, registration/reset code in auth service |
| Database | `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, `backend/prisma.config.ts` |
| Verification | `backend/scripts/test-day1.test.ts`, `test-production-hardening.ts`, `test-native.mjs`, `backend/tsconfig.tests.json` |
| Existing frontend | `frontend/src/App.tsx`, `main.tsx`, styles; still Vite starter |
| Workspaces | root `package.json`, `backend/package.json`, `frontend/package.json`, `shared/package.json` |

`shared` is a workspace placeholder without a current application build target. README language about shared types/schemas is an intended structure, not proof that all contracts are already centralized. Root build explicitly builds frontend and backend.

## 5. Requirements versus implementation

Status meanings: **Implemented** = source supports the behavior, subject to the evidence column; **Partial** = some required journey remains; **Unverified** = no adequate execution evidence; **Future** = explicitly outside V1. These are not numeric completion percentages.

| Requirement | Actual implementation at snapshot | Evidence / remaining work |
|---|---|---|
| Register/login/refresh/logout | Implemented, with database session checks and rotation | Closure coverage, including native first run; final corrected smoke pending |
| Email verification/password reset | Token workflows and Resend adapter implemented | Stubbed provider tests; real delivery and complete browser journey unverified |
| Student profile/career goals/social links | Existing read/update API; private PDF resume upload supported | Profile upload regression and closure file tests; frontend absent |
| Unified personalized dashboard | Student analytics endpoints exist | UI overview, quick actions and recent-activity presentation absent; endpoint is not a finished dashboard |
| Semesters/subjects/assignments | Existing ownership-based APIs, date and validation fixes | Native closure plus historical targeted regressions; broad final native regression remains |
| Study planner | StudyPlan CRUD, progress/status and task association exist | Weekly AI recommendations added; date-resolved schedule/acceptance workflow is partial |
| Notes organization | Subject ownership, text/tag/search features and file upload/download exist | File behavior tested locally; real Supabase pending; verify every advertised format with fixtures |
| Uploaded document processing | Files can be stored/downloaded | Automatic extraction/OCR not supplied; AI notes operate on available text, not implied PDF parsing |
| Attendance | Records, goals/reports and atomic totals implemented | Existing counting policy retained; inspect historical inconsistent data and domain races |
| Academic calendar | Personal calendar APIs and institutional event/content APIs exist | UI aggregation and automatic deadline synchronization not established; manual calendar CRUD is not a sync engine |
| Resume builder | Resume/version APIs, template list and PDF binary renderer pre-existed closure fixes | Template variants may share layout; no claim of five distinct polished designs |
| Resume completion | Deterministic five-section content-presence score added | Tested; distinct from AI review/ATS terminology |
| Skill tracking | Skills, certifications, projects and expiry lookup APIs exist | Evidence-management UI absent; proficiency is user data, not independently verified skill level |
| Internship/placement tracking | Category/eligibility/history added; status/offer/interview fields retained | Defaults, filters, history and isolation tested |
| Placement company list | Student-owned application records with company fields | No independent recruiter/company directory or external integrations; scope interpretation must be explicit |
| Eligibility | Manual enum state UNKNOWN/ELIGIBLE/NOT_ELIGIBLE | No automated placement eligibility rules engine |
| Tasks | Ownership-based CRUD and study-plan association | Cross-owner association fixed; completion-date analytics remains approximate |
| Reminder system | Reminder CRUD with title/trigger time/completion exists | **Partial:** no scheduler/delivery implementation found in backend/src; generic reminders do not prove assignment/exam/interview/renewal alerts |
| Notification/settings models | Schema entities and profile settings reads exist | No complete notification inbox/dispatcher or settings write journey established by this review; reconcile with V1 acceptance |
| AI resume review | Existing provider/service workflow and structured review persistence | Real model quality/availability unverified; heuristic output is not validated employability measurement |
| AI study planner | Weekly sessions, revision plan, topic priorities, recommendations added | Schema/mock/stub coverage; suggestions are not automatically persisted study plans/tasks/calendar entries |
| AI notes | Summary/key points/questions/flashcards routes exist | Mock/stub/legacy tests; real provider and user experience pending |
| Academic analytics | Attendance/assignment breakdown, plan completion metrics implemented | No invented marks; semantics explained below |
| Career analytics | Resume completion/internship stats added; existing skills/readiness outputs | Readiness is a heuristic; resume-selection consistency needs review |
| Productivity analytics | Existing daily/weekly activity and task completion outputs | Task.updatedAt used as completion proxy; not historical event accounting |
| Visual dashboard/charts | Backend data exists | **Not implemented as product frontend** |
| Admin users/catalogs/content/platform/reports | Substantial inherited implementation; closure repairs and linkage added | Historical admin suites pass; final native matrix and UI journeys pending |
| Course/term/syllabus integration | All three formerly missing write paths implemented | Native closure includes relevant tests; complete contention matrix still open |
| Private storage lifecycle | Authenticated local bytes, Supabase signed URLs, compensation, durable cleanup queue | Real Supabase, scheduling, inventory/backfill/crash-orphan handling remain |
| CI/CD | No `.github` workflow directory found | Not implemented; plan after reliable closure runner, before release |
| Deployment | No deployment performed in this work | Hosting choice, production config, browser sessions and live providers still open |

### 5.1 New review observations to carry forward

These are source-based findings discovered during handoff preparation, not fixes performed in this task:

- Reminder CRUD has no dispatcher found by source search. Confirm the minimum V1 alert journey before closing the backend; deliver it or explicitly agree/document a narrower V1 behavior. Do not silently defer promised functionality.
- `getPlacementReadiness()` uses the first returned resume without an explicit parent resume ordering, while the new completion score deliberately chooses active/latest. Align selection or document a justified difference; add a multiple-resume known-value test.
- Cookie lifetime is hard-coded to seven days while refresh expiry is configurable. Review consistency; don't silently change session policy during a merge.
- Supabase upload/signed-URL failures construct ApiErrors containing provider error messages. Review what the error middleware exposes and sanitize sensitive internal detail. The email adapter already sanitizes its provider errors.
- Residual `any` exists in inherited code, for example reminder update construction. Strict compilation passing does not imply no `any`; avoid turning a hardening task into an unbounded type-style rewrite.
- Production env validates JWT secret length/difference but does not by itself prove entropy, suitable bcrypt cost, all provider config, or deployment readiness. Test credentials and bcrypt cost 4 are for disposable tests only.

## 6. Commit-by-commit change ledger

Baseline for this assistant's changes: `00aeabf7d801d29d92aed20cc0ae37e9e64284a1`. The original application and T1–T5 belong to earlier work; do not attribute their entire implementation to this assistant.

| Commit | Problem and goal | Change and rationale | Evidence / goal status |
|---|---|---|---|
| `60c60bf` | Parsed validation lost; foreign study-plan links; private file download/replacement defects; timeout mapped incorrectly | Persist Zod output; enforce ownership before writes; authenticated local bytes; UUID filenames; compare-and-set replacement; compensate failed attachment; preserve timeout 503 and clear timers | 11 closure tests and 14 baseline scripts at that stage on isolated PGlite; local defects addressed, native/live limits remained |
| `21c4886` | G4 internship/placement distinction missing | Add type, eligibility, interview history and category endpoints; additive migration preserves unknown history | 12 closure tests plus career application/P3-P4 regression; implemented |
| `2fb21f3` | G5 canonical metrics missing | Add subject performance, internship-only stats, five-section resume completion and completed-plan rate | 13 closure tests, both analytics scripts; formulas tested |
| `1de5745` | G6 study-plan output too narrow | One Zod-derived output contract across prompt/schema/Gemini/mock for four new fields | 15 closure tests plus selected legacy tests; live AI not exercised |
| `60c974b` | Root build and production hardening gaps | Build executable workspaces, fix frontend TS alias config, trust proxy default 0, strong/different production JWTs, DB-backed health, correct malformed/oversized body errors, console-email guard, production smoke | 16 closure tests, compiled smoke and 14 baseline scripts; dependency/security gates still open then |
| `f9e5abf` | Logout/reset/deactivation did not reliably revoke tokens | AuthSession hashed refresh storage, JWT session/version claims, atomic rotation, logout current session, reset all sessions, deactivate version increment | Rotation/replay/reset/logout/deactivation coverage and targeted legacy tests; no full race proof |
| `5777dbc` | Email abstraction lacked usable Resend transport/outage handling | Resend HTTP adapter with timeout/sanitization; preserve registered account on send failure; forgot-password cleanup and generic response | Stubbed success/failure tests; real mail still unverified |
| `f7b639c` | Cascades/replacements could orphan files; provider outages lost cleanup intent | Per-file provider provenance, transactional SQL trigger queue, explicit retry worker with reference checks | Queue/cascade/rollback/retry tests; crash-before-attachment reconciliation and scheduler remain |
| `232e061` | Four high tooling dependency findings | Root Prisma 7.10.0 and exact deepmerge-ts/mysql2 overrides; no forced major downgrade | Clean install, Prisma tooling, full build, 20 closure tests, smoke, 14 baseline scripts; production audit zero then |
| `f91362c` | Attendance rows and totals could disagree after failures/races | Shared subject lock, transactions, recalc totals, enforce totals bounds and manual/record separation | 22 closure tests including injected rollback plus three regressions; historical data not rewritten |
| `e66b364` | Reports mixed cohorts/date bases | Consistent filters, UTC buckets, explicit date metadata, exclude undated manual totals in bounded reports | 23 closure tests under non-UTC TZ, smoke and admin report regression |
| `df6d176` | Institutional terms could not be safely linked to personal semesters | Active-term lookup, optional/null link, merged date validation, shared/exclusive locks, stale-edit CAS | New tests and targeted regressions; full run exposed recurring storage failure, not hidden |
| `d35ac72` | Needed honest account of intermittent storage failure | Record instrumentation, probes and uninterrupted passing run; no speculative storage patch | 100+100 filesystem probes, unchanged 24-test suite + smoke passed; cause unproven |
| `9e5cadd` | CourseId existed without complete enrollment journey | Admin-only course assignment/unassignment, atomic audit, profile visibility, stale checks, incompatible syllabus protection | 25 closure tests + three admin regressions, PGlite |
| `49b1f0b` | MasterSubjectId existed without course-scoped student journey | Syllabus lookup, optional/null link, coordinated locks, block referenced catalog moves/deletion | Expanded 25-test suite + admin academics/P1-P2 + smoke, PGlite |
| `86df369` | Native evidence missing and manual setup unsafe/confusing | Guarded native runner creates unique DB, checks real connections, migrates/builds/tests/logs/drops own DB | Local safety checks; first laptop run later passed everything except Windows smoke shutdown |
| `6a58d18` | Windows kill semantics caused null exit and false clean-shutdown expectation | Test-only IPC launcher invokes existing handler on Windows; retain strict normal-exit checks | Build/typecheck, Linux real-signal and forced IPC path pass locally; actual Windows rerun pending |
| `f966014` | Catalog deletion could broaden targeted resource visibility (W11) | Block referenced catalog master subject moves/deletes; preserve scoped syllabus visibility | 25 closure tests; verified |
| `65ae90f` | Concurrent admin status/role changes could orphan system without admin (W14) | Serialize last-active-admin check with database row lock on role/status changes | 25 closure tests; verified |
| `ccae9c8` | File upload MIME types unvalidated; provider errors unsanitized (W13) | Validate PDF/image byte signatures; sanitize provider errors to 503 | 25 closure tests; verified |
| `53bbbd7` | Event dates unordered; concurrent event updates could corrupt order (W04) | Enforce startDate <= endDate; serialize concurrent event updates with CAS | 25 closure tests; verified |
| `ac1104a` | Task nullable fields could not be distinguished between omission and clearing (W06) | Explicit undefined vs null semantics in task schemas and update service | 25 closure tests; verified |
| `02307dd` | Content and catalog feed queries lacked validated pagination/filtering (W15) | Attach Zod-validated query schemas across feed endpoints | 25 closure tests; verified |
| `9d7812b` / `dc6ed5e` | Authentication errors conflated database outages with invalid tokens (W18) | Classify database errors vs credential errors; return 503 on database unavailability | 25 closure tests; verified |
| `7efa21e` | Note search lacked bounded pagination and student ownership isolation (W01) | Add validated search schema; scope notes strictly to studentProfileId | 25 closure tests; verified |
| `90671d3` | Student feedback feed leaked internal admin notes (W17) | Filter internal admin notes from student feedback view | 25 closure tests; verified |
| `024d64d` | Verification tokens could be consumed multiple times during race (W10) | Atomic single-use token consumption and state transition in database transaction | 25 closure tests; verified |
| `80089c2` | Student settings write path lacked default semester validation (W19) | Add student settings write path validating default semester ownership | 25 closure tests; verified |
| `00588b0` | Workflow closure schema additions (W02, W03, W05) | Additive migration for reminder lifecycle, calendar projections, and study plan acceptance | Native migration applied cleanly |
| `e4ba11c` | Unified calendar projection lacked audience isolation (W05) | Calendar projection combining assignments, exams, events, and interview rounds | Expanded closure tests; verified |
| `f34adbe` | Reminder lifecycle desynchronized from source entities (W03) | Bidirectional reminder status synchronization and atomic dispatch | Expanded closure tests; verified |
| `f3e108b` | AI study plan acceptance not idempotent (W02) | Idempotent plan acceptance mapping sessions to dated tasks in transaction | Expanded closure tests; verified |
| `ec68594` | Phase 3 reconciliation: legacy reminder backfill, certification lifecycles, and interview identity | Backfill legacy reminder triggers; reconcile certification statuses; stabilize interview round identity | 46/46 native closure tests passing; clean production smoke |
| `ab3cae0` | Integrated student prototype | In-memory token handling; full academic workflow demo | Verified prototype |
| `4466baa` | Mutable updatedAt altered apparent task completion date; reopening semantics undefined (W07) | Add completedAt timestamp with additive migration; atomic status transitions; reopening clears completedAt | 46 closure tests + compilation verified |
| `9be3644` | Inconsistent résumé selector; non-deterministic version ties; local activity boundaries (W07, W08, B10) | getCanonicalResume selector; UTC half-open [from, to) intervals; exclude legacy tasks with unknown completion time from dated activity | Native tests passing |
| `57ee31b` | AI study plan used stale analytics; attendance calculated as unweighted average (W09, B10) | Fresh aggregate attendance from sum(attended)/sum(total); zero-record semantics (hasAttendanceData: false vs 0.0%) | Native tests passing |
| `5f9cdc6` | Storage retrieval and deletion routed to ambient provider instead of upload provider (W12) | Route retrieval and deletion strictly through note.fileStorageProvider and profile.resumeStorageProvider | Native tests passing |
| `25cf348` | Admin content metrics counted draft, scheduled, and expired content (W20) | Scope platform counts to student publication and expiry rules (publishedAt <= now, expiresAt > now) | Native tests passing |
| `48ba2ed` | Phase 4 verification and injected post-write transaction rollback | Add W07, W08, W09, W12, W20, B10 tests and injected PostgreSQL trigger rollback test for study plan acceptance | 52/52 native closure tests passing; clean production smoke |

Aggregate source diff for these 17 commits: **69 files changed, 2,400 insertions, 396 deletions**, as reported by Git at this snapshot. Counts are change volume, not a quality metric. Use `git show <commit>` for the exact patch and the generated appendix for changed paths.

Earlier closure work already supplied: storage provider infrastructure (`b42d73c`), initial hardening (`a0080e5`), note upload (`72d93db`), profile resume upload (`26a7bae`), and PDF binary export (`35ff0ad`). Earlier admin/type-safety repair history remains in the bundle.

## 7. Critical behavior contracts and design rationale

### 7.1 Validation, ownership, and response behavior

Validation must forward the **parsed Zod value**, not merely test it and retain the original request. This preserves trimming, defaults, coercion and field stripping. Express 5 query access required a request-local override rather than assigning to a getter. New schemas must be checked through actual HTTP requests and persisted values.

A foreign study plan cannot be assigned to a student's task. File ownership is checked before provider writes. Missing/foreign owned entities commonly return 404 to avoid disclosing another student's record. Use the route's established contract rather than normalizing all statuses without a reason.

Expected patterns: 400 invalid input; 401 missing/invalid/revoked session; 403 forbidden role/platform setting; 404 unavailable owned resource; 409 stale write or domain conflict; 413 oversized body; 429 rate limit; 503 dependency unavailable. Some create routes return 201 and deletes 204. Tests previously incorrectly expected 200 for existing 201/204 behavior; those tests were corrected instead of changing valid APIs to satisfy them.

### 7.2 Sessions and revocation

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB
    Client->>API: Refresh cookie
    API->>DB: Check user, session, version and old token hash
    API->>DB: Conditional rotation of matching old hash
    alt One update succeeds
        DB-->>API: Rotation committed
        API-->>Client: New access token and refresh cookie
    else Old hash no longer matches
        DB-->>API: No matching update
        API-->>Client: 401
    end
```

- JWT access and refresh tokens carry session/version claims and unique IDs; HS256 is allowlisted.
- Refresh tokens are hashed in the database. Concurrent exchange is conditional on the old hash; one winner is expected.
- Replaying an old token is denied; it does not revoke the winner's newly rotated token. Do not add token-family revocation without evaluating multi-tab/retry behavior and product policy.
- Logout invalidates the current session and its access/refresh tokens; other sessions remain.
- Password reset consumes the reset token atomically, increments `authVersion`, and deletes all sessions.
- Deactivation increments the version; reactivation must not resurrect old tokens. Authentication and maintenance bypass inspect current database state.
- Tokens issued before the session migration are intentionally invalid. Rollout requires users to sign in again.
- Already-executing requests are not retroactively cancelled. Expired session rows are denied but periodic cleanup is absent.

**Possible improvement:** a documented expiry cleanup job and metrics; concurrency tests for login versus reset/deactivation; an agreed role-change session policy. Do not store raw tokens in logs or add an authentication migration to Supabase Auth during this closure.

### 7.3 Files and cleanup

For local storage, authenticated endpoints stream bytes with private/no-store caching, not public URLs. File paths reject traversal. UUID-based immutable object names and exclusive local creation reduce accidental overwrite. Supabase uses private-bucket signed redirects after API authorization; URLs are time-limited bearer access, so do not log or treat them as permanently private once shared.

Replacement writes use compare-and-set against the old reference. The winning database attachment owns the new file; a failed/stale attachment attempts to delete its own newly uploaded object. Detached old files are removed immediately where possible and retained as retry jobs when removal fails.

SQL triggers queue old note/profile file references inside the same transaction when detached or cascaded away. If the database transaction rolls back, the queue insert rolls back too. The worker refuses to remove an object still referenced by a note or profile, uses its recorded provider, and leaves failed jobs for later retry.

```mermaid
flowchart TD
    Change["Delete or replace database reference"] --> Tx["Database transaction"]
    Tx --> Commit["Commit row change and cleanup job"]
    Tx --> Rollback["Rollback both"]
    Commit --> Check["Check object is unreferenced"]
    Check --> Delete["Delete from recorded provider"]
    Delete --> Success["Remove completed job"]
    Delete --> Retry["Retain failed job"]
```

Known limitations:

- Worker is an explicit command, default batch size 100; no deployed schedule/backoff/alert policy exists.
- Older files can have unknown provider provenance; automatic retry excludes unknown providers. Inventory before backfill, never guess based on current configuration.
- Provider provenance records local/supabase, not the full project/bucket/base-path identity. Moving storage configuration can misdirect lookup/deletion; require a migration plan.
- Upload followed by process death before DB attachment/queue insertion can orphan an object. Database outage can also prevent recording cleanup. A reconciler/inventory policy remains necessary.
- Queue primary key is file ID. Reusing identical identifiers across providers is a design risk; current UUID conventions reduce collisions but are not a universal namespace proof.
- Reference checking followed by deletion is not an external-storage transaction. Preserve immutable unique object IDs and forbid arbitrary reattachment; review any future API allowing object reuse.

**Possible improvement:** an upload-intent record, provider namespace identity, dry-run inventory and grace-period reconciliation, plus scheduled bounded retry. This is safer than blindly deleting all objects absent from a one-time database query while uploads are in flight.

### 7.4 Attendance

`0 <= attendedClasses <= totalClasses`, both integers. PRESENT and LATE count as attended. All records, including EXCUSED, contribute to the denominator. Multiple classes may occur on one day; no date uniqueness was invented.

When records exist, counters derive from records; direct manual-total edits return 409. With nonzero manual totals but no records, creating the first record returns 409 to avoid silently discarding historical totals. The student must explicitly clear both totals before switching to records. Deleting the final record returns totals to zero, enabling manual totals again. The frontend must explain the conflict rather than silently clear history.

Record create/update/delete and counter recalculation share a transaction and subject lock. Subject PATCH uses the same coordination. Fault-injection tests force counter update failure and verify record writes roll back. Historical inconsistent data was not bulk repaired; service guards do not protect direct SQL writes.

**Possible improvement:** native contention coverage and a reviewed repair report for legacy rows. Changing EXCUSED policy is a product decision, not a merge cleanup.

### 7.5 Institutional linkage

- Admin `PATCH /api/v1/admin/users/:id/enrollment`, strict `{courseId: UUID | null}`. The ID is a **user ID**, not a student-profile ID. Repeating an unchanged assignment creates no duplicate audit entry.
- Student self-profile PATCH does not grant enrollment authority; unsupported courseId is stripped.
- Enrollment/audit write together; conflicting syllabus links block course change/unenrollment with 409.
- Student `GET /api/v1/semesters/academic-terms` returns active terms, page 1/limit 20 default, maximum 100. Semester create/PATCH supports `academicTermId`; omitted means preserve/default, null means unlink. New links require active terms; historical inactive links remain readable/editable.
- Semester one-field date edits validate merged stored/new dates. Compare-and-set guards stale edits. Personal dates/names are not silently overwritten from institutional terms.
- Student `GET /api/v1/subjects/syllabus` returns only the currently enrolled course's catalog; unenrolled students receive an empty list. Subject create/PATCH supports `masterSubjectId` with omitted/preserve versus null/unlink semantics.
- Catalog links do not overwrite personal subject names, codes or credits. Repeats are permitted; no unique master-subject-per-student or semester-number alignment was invented.
- Profile/catalog/term locks coordinate related writers. Admin catalog moves/deletes must preserve reference guards. Native deadlock behavior needs explicit coverage before relying on these locks as a complete concurrency solution.

**Possible improvement:** globally documented lock order, controlled contention tests, and dated enrollment history only if historical reporting is explicitly required. Do not add that schema merely to improve a label in a report.

### 7.6 Analytics and reporting

| Metric | Exact interpretation / limitation |
|---|---|
| Subject performance | Attendance and assignment completion, not inferred grades |
| Assignment completion | Current SUBMITTED or GRADED state counts as completed |
| Resume completion | Nonempty sections out of personalInfo, education, experience, skills, projects × 100/5 |
| Resume selected for completion | Active first, then latest updated, stable ID tie-breaker; latest version only |
| Uploaded profile PDF | Does not populate builder sections by itself |
| Plan goal achievement | COMPLETED plans / all plans × 100; zero for empty denominator |
| Internship stats | Only current student's INTERNSHIP rows; current statuses, not event history |
| Internship offer rate | OFFERED / total × 100 |
| Placement readiness | Existing product heuristic, not calibrated employability; weights skills 25%, resume ATS field 25%, applications 20%, certifications 15%, projects 15% |
| Task activity | `updatedAt` proxy for completion time; editing completed tasks can alter apparent activity |

Institutional user reports apply course/department and User.createdAt filtering consistently. Scoped cohorts exclude admins and unassigned students; unfiltered reports retain all roles. Missing catalog refs return 404; incompatible course/department pairs return 400.

Usage AI dates use `startedAt`; career dates/grouping use `createdAt`, not current clock or appliedDate. Buckets use UTC. Academic windows use AttendanceRecord.date and Assignment.createdAt inclusively; completed assignments are current status among assignments created in that window, not historical completion events.

Bounded attendance excludes undated manual totals and exposes `dateScope` metadata, including `subjectsWithExcludedManualTotals`. Reports group by **current enrollment**, not enrollment at event time. Reads are not a transaction-wide snapshot. The UI/report report must disclose these semantics.

**Possible improvement:** explicit `completedAt` for tasks and deterministic resume selection across all analytics. Historical enrollment and event ledgers should be added only if V1 acceptance truly needs history; otherwise keep labels accurate.

### 7.7 AI and email

AI output contract now includes `weeklySchedule`, `revisionPlan`, `topicPriorities`, `goalRecommendations` alongside original study-plan fields. Weekly sessions are recurring weekday templates, not resolved calendar dates. The service validates provider output and records failures; recommendations do not automatically create tasks or plans. Request timeout maps to 503 and clears timers, but does not guarantee cancellation of an already-started model call.

Resend adapter uses authenticated HTTPS, a ten-second abort timeout, rejects redirects, and sanitizes network/provider failures to 503. Successful API acceptance is not proof of inbox delivery. Registration preserves the newly committed account when verification email fails and reports the delivery flag; password-forgot uses a generic response and clears its own failed reset token conditionally. A durable email queue is absent.

**Possible improvement:** bounded per-user AI budgets and payload controls, live schema-quality tests, an explicit accept/edit/reject UI for generated plans, resend-verification recovery, and a durable email outbox if required for reliable delivery. Confirm current routes before claiming a resend flow already exists. Never silently expose service keys or make paid provider calls just to turn a test green.

## 8. Verification evidence and its limits

### 8.1 What was actually executed

During earlier implementation, native PostgreSQL/Docker was unavailable in the assistant workspace. The temporary test environment used PGlite 0.5.8 + pglite-server 0.1.5, the real Prisma/pg adapter, migration SQL, seeded fixtures and real HTTP calls. PGlite was outside the repository and did not replace production PostgreSQL.

Test counts increased from 11 through 25 as coverage grew. They include the parent test; “25 tests” does not mean 25 separate full end-to-end user journeys. Some updates expanded an existing test without increasing the count.

The latest full 14-script baseline execution recorded in the closure log followed dependency remediation. Later slices reran the affected subsets plus the growing closure suite. Do not say all 14 were rerun after every later commit or on the final native Windows snapshot.

Baseline manifest:

```text
test-admin-foundation
test-admin-users
test-admin-academics
test-admin-content
test-admin-platform
test-admin-reports
test-admin
test-p1-p2
test-p3-p4
test-ai-notes
test-analytics
test-notes-upload
test-profile-resume-upload
test-resume-pdf-export
```

These are files under `backend/scripts/` with `.ts` extensions. The repository contains other legacy test files too; this list is the historical baseline, not a statement that all scripts have been audited or run.

### 8.2 Storage failure: preserve both failure and success

During term-linking work, an existing file-replacement test intermittently observed an old deleted file reappearing. Tracing showed the failed new attachment's object was deleted, while an older object absent after deletion later reappeared without another upload call. Queue was empty. Similar behavior occurred in a cascade fixture.

Temporary tracing was removed. Two probes, each 100 create/read/delete cycles, passed in `/tmp` and uploads. An unchanged full suite run with no concurrent workspace commands passed 24 tests plus smoke; later enrollment/syllabus runs passed 25 sequentially. The first native laptop closure suite also passed 25.

This reduces the immediate reproduction concern but does not prove a root cause. Execution-environment interference remains a hypothesis. Do not describe it as a confirmed storage-code fix. Do not rerun repeatedly and keep only passing logs.

### 8.3 Evidence still absent

- Full baseline matrix against isolated native databases at the final candidate (B02).
- Explicit native lock-order/deadlock/domain contention coverage beyond the existing suite (B03).
- Real Supabase private-bucket upload, retrieval, signed URL expiry, deletion and outage recovery (B04).
- Scheduled storage lifecycle worker and crash-orphan reconciliation plan (B05).
- Real Gemini availability/output quality and real Resend delivery (B07, B08).
- Production browser cookie/CORS/proxy behavior, distributed rate limiting, deployment or CI results (B12, B13).
- Full V1 UI journeys; student prototype verified with in-memory auth at `ab3cae0`.

*(Note: Windows native smoke/shutdown B01, PostgreSQL version recording, V1 feature reconciliation B06, and data semantics/readiness fixtures B10 were resolved and verified in Phase 3 and Phase 4.)*

### 8.4 Evidence discipline

Record commit/tree, Node/npm/PostgreSQL versions, command, provider modes, exit code, test counts, log location and cleanup outcome. A test run against manually edited files must record `git diff` or tree identity, not just HEAD. Keep credentials and signed URLs private. Preserve failed runs with cause analysis. Retesting after a documented fix is correct; retrying unchanged until green is not closure evidence.

## 9. Remaining gaps, priorities, and acceptance evidence

| ID | Priority / work | Status | Required next action | Acceptance evidence |
|---|---|---|---|---|
| B01 | Windows native smoke | **CLOSED** | Completed and verified | Exit 0, 52/52 closure, production-smoke PASS, cleanup true, PG 18.4 recorded |
| B02 | Required: final regression manifest | **PENDING** | Port/use a guarded native harness giving each baseline script a fresh DB | Named script results with final candidate identity, no shared DB destruction |
| B03 | Required: domain concurrency | **PENDING** | Controlled parallel transactions for refresh/reset, attendance, enrollment/catalog, term deletion, catalog moves, and last-active-admin demotion | No invariant violation; stale conflicts predictable; deadlocks bounded/handled and investigated |
| B04 | Required before storage release | **PENDING** | Dedicated Supabase project/private bucket verification | Owner bytes, outsider denied, signed expiry, replacement/cascade removal, outage retry, no public object access |
| B05 | Required storage lifecycle plan | **PENDING** | Inventory unknown-provider files and crash-orphan risk; operational retry/reconciliation | Reviewed dry-run manifest, no live references deleted, scheduled bounded process and visible failures |
| B06 | V1 feature reconciliation | **PENDING (Subitem Open)** | Workflow closure substantially reconciled; interview-round persistent identity and legacy reconciliation remains an active subitem | Persistent one-time IDs implemented and verified in closure tests; execute production backfill and verify live legacy reconciliation |
| B07 | Required live email | **PENDING** | Real registration/verification/reset and delivery-failure recovery in test environment | Authorized test recipient receives messages; tokens single-use/expire; secrets not logged |
| B08 | Required live AI | **PENDING** | Small authorized live tests for approved features using model configured via env.GEMINI_MODEL (defaulting to gemini-3.6-flash if unset) | Valid schema, useful output, timeout/rate/quota errors, honest UI fallback |
| B09 | Required security review | **PENDING** | Review current code/config/dependency audit and newly noted exposure risks | No unresolved critical/high security defect; no suppression-based build; provider errors sanitized |
| B10 | Data semantics & metrics consistency | **CLOSED** | Completed in Phase 4 | Documented EXCUSED application policy; canonical résumé selector; UTC half-open intervals; 95-point fixture |
| B11 | Required integration gate | **PENDING** | Final branch review and tested merge candidate | All relevant tests on merged tree, original closure ancestry preserved |
| B12 | Before production | **PENDING** | Hosting topology, cookie/CORS/CSRF, HTTPS/proxy and secrets | Real browser session journey works; no frontend service credentials |
| B13 | Before production | **PENDING** | CI/CD and recovery | Repeatable clean build/native tests, migration approval boundary, backup/restore procedure |
| B14 | Maintenance | **PENDING** | Expired session cleanup, email outbox, broader observability | Prioritized owner/date; implement where reliability acceptance requires it |

“Required” here is a proposed closure criterion grounded in V1 and known risks. A successor may refine the implementation approach, but cannot silently mark a gap complete or waive a security defect. If time forces a scope decision, present the exact missing user journey and its impact to Sufiyan.

## 10. Definition of a closed backend

Use two distinct milestones so local correctness is not confused with production readiness.

### 10.1 Backend contract closure — permits frontend integration

- [ ] All seven pillars have a requirements-to-API map with no unexplained promised behavior missing.
- [ ] Reminder/notification/weekly-plan ambiguities are resolved explicitly.
- [ ] Corrected native runner passes on the final candidate, with both result booleans true.
- [ ] Final baseline regressions pass in disposable native environments; affected domain races are verified.
- [ ] Authentication, ownership, RBAC, parsed validation, atomic writes, cleanup and failure behavior pass positive and negative tests.
- [ ] Storage provider integration is verified in its dedicated test environment; lifecycle backlog/recovery has a concrete safe operating plan.
- [ ] Email/AI integration contracts and core live journeys are verified, or a precisely described remaining infrastructure gate is explicitly accepted before UI work. Do not rename that acceptance “fully deployed.”
- [ ] Full root build and strict test typecheck pass without weakening compiler settings or adding bypasses.
- [ ] Current dependency/security review has no unresolved critical/high blocker; historical zero audit is rerun.
- [ ] API response/status/pagination/file-download/metric semantics are documented for frontend development.
- [ ] Database migration chain is reproducible; existing-data impact and rollout compatibility are reviewed.
- [ ] Merged candidate is tested, traceable, backed up, and accepted; no branch is deleted.

### 10.2 Production readiness — permits deployment/public use

Also require: selected hosting topology; real browser auth/CORS/CSRF behavior; HTTPS and secure cookies; production secrets and least-privilege access; DB backup/restore evidence; provider configuration and delivery evidence; scheduled cleanup; monitoring; rate-limit behavior for the actual instance count; CI checks; controlled migration/release procedure; rollback plan; no test admin credentials or mock behavior misrepresented as production features.

No finite checklist guarantees absence of all vulnerabilities. Closure means the agreed requirements and specific risk gates have evidence, not that future bugs are impossible. The original goal “fully secure and works correctly” should be translated into these testable criteria.

## 11. Exact Windows native verification

### 11.1 Prerequisites

Use the restored root from section 3, or a verified existing checkout containing the same final code. Run in PowerShell (`PS ...>`). `npm.cmd` avoids the blocked `npm.ps1` wrapper without changing execution policy. The PostgreSQL account is a **login role**, not a database name; use local `postgres` unless another role has the required create-database privileges.

```powershell
Set-Location -LiteralPath 'D:\ALL_PROJECTS\integrum-handoff-restored'
git branch --show-current
git log -1 --oneline
git status --short
node --version
npm.cmd --version
Get-Service -Name '*postgres*' | Format-Table Name, Status, DisplayName
Get-NetTCPConnection -LocalPort 5099 -State Listen -ErrorAction SilentlyContinue
```

A running PostgreSQL service is needed. If stopped, use `services.msc` to start the correct PostgreSQL service. Port 5099 should have no listener. No output from the port query normally means none was found; do not interpret unrelated command errors as a successful check. Do not kill an unknown process. Stop your own previous test server with Ctrl+C in its terminal if necessary.

If dependencies have not been installed in this checkout, run `npm.cmd ci` and stop on failure. No copying of the original project `.env` is necessary for the native runner.

### 11.2 Credentials and execution block

Paste the complete block together. Enter the password at the secure prompt, never in chat.

```powershell
$pgUser = Read-Host 'PostgreSQL LOGIN username (Enter for postgres)'
if ([string]::IsNullOrWhiteSpace($pgUser)) { $pgUser = 'postgres' }
$pgPort = Read-Host 'PostgreSQL port (Enter for 5432)'
if ([string]::IsNullOrWhiteSpace($pgPort)) { $pgPort = '5432' }
$pgPassword = Read-Host 'PostgreSQL password' -AsSecureString
$nativeExitCode = $null
try {
    $encodedUser = [Uri]::EscapeDataString($pgUser)
    $encodedPassword = [Uri]::EscapeDataString(
        [System.Net.NetworkCredential]::new('', $pgPassword).Password
    )
    $env:NATIVE_TEST_ADMIN_URL = "postgresql://${encodedUser}:${encodedPassword}@127.0.0.1:${pgPort}/postgres"
    npm.cmd run test:native --workspace backend
    $nativeExitCode = $LASTEXITCODE
}
finally {
    Remove-Item Env:NATIVE_TEST_ADMIN_URL -ErrorAction SilentlyContinue
    Remove-Variable pgPassword, encodedPassword -ErrorAction SilentlyContinue
}
Write-Host "Verification exit code: $nativeExitCode"
```

The script creates `integrum_native_<random>_test`, checks independent native DB connections, deploys migrations, checks status, generates Prisma client, builds backend, typechecks tests, seeds, runs closure and compiled production smoke, then removes only its generated database. It overrides child configuration to mock AI/local storage/console email and generates test secrets. It refuses a non-loopback maintenance URL or a maintenance path other than `/postgres`.

The actual application PostgreSQL database is not its target. A process crash/power loss may leave its uniquely named test database behind; remove only that exact recorded test database after investigation. Do not use wildcard database deletion or `migrate reset` on a working project database.

Stages can be quiet until their log is written. Child stage timeout is 180 seconds. Do not increase it to hide a hang: first identify whether startup, a lock wait, an external call, or slow hardware explains the delay.

### 11.3 Read and preserve the result

Use the exact directory printed by the runner when possible. For the most recent run:

```powershell
$latestRun = Get-ChildItem '.\backend\test-results' -Directory |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
if ($null -eq $latestRun) { throw 'No result directory. Preserve the terminal error.' }
Get-Content (Join-Path $latestRun.FullName 'result.json') -Encoding UTF8
Get-Content (Join-Path $latestRun.FullName 'server.txt') -Encoding UTF8
Get-Content (Join-Path $latestRun.FullName 'closure.log') -Encoding UTF8 -Tail 35
Get-Content (Join-Path $latestRun.FullName 'production-smoke.log') -Encoding UTF8 -Tail 30
```

Accept only exit code zero, `testsPassed: true`, `cleanupSucceeded: true`, expected 25 tests/zero failures, and smoke success. A blank exit variable is not success. UTF-8 prevents the garbled checkmark characters seen in the user's earlier output; garbled symbols alone were a display issue, not a test failure.

Copy the full result directory to an evidence backup on the laptop. Sanitize before sharing: runner redaction is helpful but does not guarantee every possible secret is removed. Do not commit raw logs containing email tokens or connection strings.

After native success run the full root build (`npm.cmd run build`) and the required final security/audit checks. The native runner builds backend, not the frontend. Do not run a manual closure test against an arbitrary database just because its name ends in `_test`.

### 11.4 The separate baseline harness still needs native isolation

Do not run every `backend/scripts/*.ts` file in a loop against the existing database. Some older scripts have broad cleanup and fixed fixture assumptions. A successor should implement or carefully operate a native baseline harness with:

1. The same loopback maintenance URL guard and unique generated database ownership.
2. One fresh migrated/seeded database per named baseline script.
3. A child Express server on the expected port 5000, with explicit test-only env.
4. Health/readiness validation before the test, bounded runtime and sanitized logs.
5. Platform-aware shutdown and removal of only that generated database in finally.
6. Per-suite results; a failed suite must not be hidden by later success.

The temporary PGlite regression harness used a schema reset only inside its freshly owned in-memory database. **Do not copy its DROP SCHEMA command into a native project database.** Its source is included in the recovery appendix for understanding, not as an approved native runner.

## 12. Failure investigation and review policy

### 12.1 Standard repair loop

```mermaid
flowchart TD
    Fail["Capture failure and exact source"] --> Classify["Identify failing layer"]
    Classify --> Reproduce["Small deterministic reproduction"]
    Reproduce --> Fix["Minimal justified fix"]
    Fix --> Check["Targeted test and affected regression"]
    Check --> Review["Review invariant and failure behavior"]
    Review --> Record["Commit evidence and residual limits"]
    Check -->|"Still failing"| Classify
```

For each failure, record expected/actual behavior, source commit and uncommitted diff, environment, command, error and fixtures. Classify as application logic, test harness, environment/config, dependency/tooling, concurrency, external provider, data migration, or unresolved. “Environment issue” requires evidence; do not use it to dismiss a data-loss bug.

Read the failing assertion and surrounding implementation before editing. Build the smallest reliable reproduction. State the invariant to preserve. Add a regression that would fail before the fix, where meaningful. Run affected tests after the fix and broaden only to address shared behavior or a release gate. Keep before/after evidence and review the diff for accidental changes.

### 12.2 Severity policy

| Severity | Examples | Required handling |
|---|---|---|
| Critical/high blocker | Auth bypass, cross-student data disclosure, secret exposure, destructive migration, lost files, corrupt attendance, broken session revocation | Stop affected release/merge; reproduce and fix; no silent waiver |
| Functional blocker | Promised reminder journey absent, unusable reset, required PDF/file operation fails | Complete the journey or obtain a concrete scope decision; never mark implemented from schema alone |
| Environment/harness blocker | npm.ps1 blocked, port conflict, Windows kill semantics, unavailable DB | Correct invocation or harness without weakening the application assertion |
| Nonblocking limitation | Disclosed heuristic, no historical enrollment snapshots when not required, shared simple PDF layouts | Document impact, owner and acceptance; schedule improvement if needed |

### 12.3 Specific error guide

| Symptom | Correct response |
|---|---|
| `npm.ps1 ... scripts disabled` | Use `npm.cmd`; no need to lower machine execution policy |
| `}Get-NetTCPConnection not recognized` | Remove stray brace and use PowerShell |
| `else is not recognized` | Submit the complete if/else together; do not paste branches as separate commands |
| PostgreSQL authentication failure | Verify local login role/password/port privately; database name is not a login |
| Permission denied to create DB | Use an authorized local maintenance role; do not grant the production app superuser rights |
| Port already in use | Identify the owning process; stop only your known test process |
| Prisma migration failure | Save migration name/error/status and inspect actual schema; no blind reset or resolve |
| Storage object reappears | Preserve IDs/queue state/timestamps; reproduce without overlapping workspace commands, then native; no retry-until-green |
| Smoke `null !== 0` | Confirm corrected Windows launcher is present; keep first failure logs; retain exit checks |
| Typecheck failure | Fix actual types/contracts; no ts-nocheck, broad any conversion, disabling strict flags or excluding files to hide errors |
| Provider failure | Keep secrets and raw provider bodies out of responses; verify bounded timeout/error mapping |
| Push non-fast-forward | Fetch and inspect divergence; merge/review legitimate remote work, never force-push blindly |
| Merge conflict | Resolve by intended behavior and tests, not blanket ours/theirs |
| Workspace unavailable | Continue from downloaded bundle and this document; do not claim lost files or successful operations without evidence |

### 12.4 Reviews that matter

Each change review should answer: whose data is touched; what validates ownership and role; what happens under concurrent writes; what rolls back; what external side effect may remain; what happens on retry; what response the client sees; whether old data is compatible; whether tests verify behavior rather than mirror implementation.

Use parameterized SQL values; do not interpolate user input into SQL identifiers. Test both allowed and denied paths. Keep fault-injection fixtures restricted to disposable test databases and remove them. Do not add a public shutdown/debug endpoint to fix a test. Avoid global regex rewrites across unrelated files.

## 13. Git publication, branch integration, and conflicts

### 13.1 User policy

The user wants a stable `main` containing all approved features after backend closure. Existing branches must be retained and receive no further commits after integration. There is no Git “closed branch” state equivalent to a closed pull request: record them as retired in documentation and preserve their refs. Disable automatic head-branch deletion if a GitHub PR workflow would delete them. Do not prune/delete branches or use `git push --mirror`.

The user authorized pushing closure commits, but no successful push is confirmed. This handoff creates a package; it does not publish or merge. Authentication on the laptop does not authenticate the assistant workspace.

### 13.2 Inspect and authenticate before publishing

From the verified working checkout, with genuine independent laptop changes already preserved/reconciled:

```powershell
git status --short
git remote -v
git branch -a
git log --oneline --decorate -10
git config user.name
git config user.email
```

Do not paste credentials in chat. Use Git Credential Manager/browser authentication, or if GitHub CLI is installed:

```powershell
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
```

Use the user's actual intended name/email for future commits, set per repository if needed. Existing Codex-authored commit objects stay unchanged. A GitHub connection with repository permission is not automatically a terminal Git credential.

Fetch without pruning:

```powershell
git fetch origin
if ($LASTEXITCODE -ne 0) { throw 'Fetch failed.' }
git log --graph --oneline --decorate --all -40
```

Inspect any `origin/fix/backend-closure-day1` before pushing. If it has independent commits not in the local branch, stop and reconcile them. If there is no divergence and the branch is ready to publish:

```powershell
git push --set-upstream origin fix/backend-closure-day1
if ($LASTEXITCODE -ne 0) { throw 'Push failed. Preserve error; do not force.' }
git rev-parse HEAD
git ls-remote origin refs/heads/fix/backend-closure-day1
```

The hashes must match. Publishing a working branch is not final backend sign-off and does not justify merging main early.

### 13.3 Choose the actual final source tip

`6a58d18` is the handoff checkpoint, not an instruction to ignore future closure fixes. When all fixes are ready, record the final approved source SHA. Verify it contains this checkpoint and the baseline closure history:

```powershell
git merge-base --is-ancestor 6a58d18e92f3b425fa21b92d6a03cd8efdabaa1f fix/backend-closure-day1
if ($LASTEXITCODE -ne 0) { throw 'Latest handoff changes are not in the candidate.' }
git merge-base --is-ancestor 00aeabf7d801d29d92aed20cc0ae37e9e64284a1 fix/backend-closure-day1
if ($LASTEXITCODE -ne 0) { throw 'Original backend closure history is missing.' }
```

If another authorized branch contains later fixes, adjust the candidate branch deliberately and document it. Do not discard unique commits on the remote original closure branch merely because the local historical tip was `00aeabf`.

### 13.4 Recommended integration procedure

Use a temporary integration branch from **fresh remote main**, leaving the retained source branches unchanged. This temporary branch can also be retained. Its purpose is a reviewable combined tree, not a permanent parallel product line.

Prerequisites: clean working tree, source branch reviewed, no unknown laptop changes, relevant backend closure gates passed, fetched actual main. If main does not exist remotely, stop and inspect the repository setup instead of inventing unrelated history.

```powershell
if (git status --porcelain) { throw 'Working tree has changes. Preserve and resolve them first.' }
git fetch origin
if ($LASTEXITCODE -ne 0) { throw 'Fetch failed.' }
$mainBefore = (git rev-parse origin/main).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Remote main is unavailable.' }
$closureTip = (git rev-parse fix/backend-closure-day1).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Closure candidate is unavailable.' }
git log --left-right --oneline origin/main...fix/backend-closure-day1
git diff --stat origin/main...fix/backend-closure-day1
```

Save the two SHAs in the release record. Create a local backup bundle before integration:

```powershell
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$preMergeBundle = "..\Integrum-premerge-$stamp.bundle"
git bundle create "$preMergeBundle" --all
if ($LASTEXITCODE -ne 0) { throw 'Pre-merge backup failed.' }
git bundle verify "$preMergeBundle"
if ($LASTEXITCODE -ne 0) { throw 'Pre-merge backup verification failed.' }
$integrationBranch = "integration/backend-close-$stamp"
git switch -c "$integrationBranch" origin/main
if ($LASTEXITCODE -ne 0) { throw 'Integration branch creation failed.' }
git merge --no-ff --no-commit "$closureTip"
```

A merge conflict can produce a nonzero exit: inspect status and enter section 13.5. Do not continue to commit/push automatically. `--no-ff --no-commit` makes the combined tree reviewable before the merge commit. Git documents these merge controls and conflict recovery in [git-merge](https://git-scm.com/docs/git-merge).

Before committing the integration, resolve every conflict, inspect the staged diff, install the resolved lockfile with `npm.cmd ci`, run root build, native closure and required baseline/security checks on the **combined** tree. Passing tests on the source branch alone is insufficient.

When the combined tree is accepted:

```powershell
git diff --check
git diff --name-only --diff-filter=U
git diff --cached --stat
```

There must be no unmerged paths or unexplained changes. Stage only intentional changes, then:

```powershell
git commit -m 'merge: integrate verified backend closure'
if ($LASTEXITCODE -ne 0) { throw 'Merge commit failed.' }
git merge-base --is-ancestor "$closureTip" HEAD
if ($LASTEXITCODE -ne 0) { throw 'Closure ancestry was lost.' }
git merge-base --is-ancestor "$mainBefore" HEAD
if ($LASTEXITCODE -ne 0) { throw 'Main ancestry was lost.' }
git push --set-upstream origin "$integrationBranch"
if ($LASTEXITCODE -ne 0) { throw 'Integration push failed.' }
```

Preferred publication: review a GitHub PR from integration branch to main, use a history-preserving merge method, and retain the branch. Do not squash/rebase if preserving these exact original commits is the objective. If main advances, integrate the new main into the integration branch and rerun affected gates before approval.

If the user deliberately chooses a direct main update and repository rules allow it, update main only to the reviewed tested integration commit. Use a clean checkout, fast-forward-only operations, and a fresh fetch; if any fast-forward fails, stop. Do not bypass protected-branch rules. Do not perform both the PR merge and a separate direct push as competing procedures.

After the chosen merge succeeds, fetch and verify the source tip and previous main are ancestors of `origin/main`, compare expected API/migration files, and record the final main SHA. A PR may add another merge commit; verify ancestry and tree, not an assumed identical SHA. Run final smoke on the checked-out final main. Retain old branches; no cleanup deletion commands.

### 13.5 Conflict resolution by meaning

**Do not choose “accept all incoming” or “accept all current” for the whole repository.** In this merge, current/ours is the integration branch based on main; incoming/theirs is the closure candidate. Those words change meaning in other workflows, especially rebase.

```powershell
git status
git diff --name-only --diff-filter=U
git diff --cc
```

For a particular conflicted path, inspect the common ancestor, main side and closure side using `git show :1:path`, `git show :2:path`, and `git show :3:path` (replace `path` with the actual repository-relative path). Work file-by-file.

| Conflict area | Resolution rule |
|---|---|
| Routes/controllers | Preserve new routes and existing functionality; static paths such as syllabus/academic-terms/templates must precede `/:id`; retain middleware and status contracts |
| Authentication/JWT | Keep session/version checks, hashed refresh rotation, reset/logout/deactivation semantics; do not restore old cookie-only logout |
| Validation/error handling | Keep parsed Zod values and sanitized errors; reconcile schema changes with actual clients/tests |
| Attendance/linkage services | Preserve transaction boundaries, locks/CAS and manual-total/ref guards; don't duplicate writes outside the transaction |
| Prisma schema | Combine compatible models/relations, validate both client expectations and database history |
| Existing migration SQL | Do not rewrite a migration already applied anywhere to resolve a conflict; investigate checksum/history and add a forward migration when needed |
| Competing new migrations | Determine whether either ran in a real DB; review order/dependencies and create a coherent forward chain; not a filename-only resolution |
| package.json/lockfile | Decide intended dependency versions/overrides first; regenerate lock with agreed npm version if needed; review unrelated churn; then npm ci/build/audit |
| Tests | Preserve regressions from both sides and update only against an agreed contract; no deleting failing assertions |
| Progress/docs | Keep historical evidence, add a current authoritative status, correct duplicated claims without pretending prior failures never occurred |
| Generated dist/client files | Regenerate with approved source/toolchain; do not use generated output to decide source behavior |

After manual editing, run `git diff --check`, inspect unresolved paths, and search for conflict markers (`git grep -n -E '^(<<<<<<< |=======|>>>>>>> )' -- .`). A marker search may find legitimate separator text; inspect hits. Stage exact resolved files with `git add <path>`. Do not use `git add .` without reviewing all untracked files.

If resolution is unclear, preserve the pre-merge bundle and use `git merge --abort` **while the merge is still in progress**. Start only from a clean tree so abort has a reliable baseline. Do not use `reset --hard` as routine conflict handling. If an already published merge later proves defective, design a reviewed revert/forward fix; a code revert does not automatically undo database migrations or external file deletion.

### 13.6 After integration

Record the retained branch names and final tip SHAs in a branch retirement note. Mark them “merged; no further development.” Keep main as the canonical tested line. For future risky changes, a short-lived review branch can be proposed if the user permits; otherwise keep main commits small and verify before pushing. The user's desire for one clear main is not permission to skip testing or overwrite concurrent work.

## 14. Database, storage, and rollout discipline

### 14.1 Migration chain

Twelve migration directories exist at this snapshot. The assistant added three: career classification, auth sessions, and storage cleanup. Linkage/attendance/report repairs primarily use existing schema plus service behavior; they did not bulk backfill real user data.

| New migration | Rollout effect |
|---|---|
| `20260919000000_career_classification` | Existing applications default INTERNSHIP and UNKNOWN; no inference of prior placement status |
| `20260919010000_auth_sessions` | Adds session table/authVersion; old issued tokens require re-login |
| `20260919020000_storage_cleanup` | Adds provider provenance and cleanup queue/triggers; historical provider metadata can remain unknown |

For shared or production databases: capture backup and restore procedure, inspect migration status, review schema/data impact, then apply approved forward migrations. `migrate deploy` applies checked-in migrations; it is not a test runner or a repair for arbitrary schema drift. Do not use development reset commands against user data. If a migration failed halfway, inspect the database and migration records before choosing a repair/resolve action; never mark it applied just to unblock the next command.

The native test runner requires `/postgres` because that is the local maintenance database used to create its unique test DB. This is separate from the runtime application's `DATABASE_URL`. Production app credentials must not inherit maintenance/superuser privilege merely because it helped local tests.

### 14.2 Storage verification protocol

Use a dedicated non-production Supabase environment; the current code's bucket name is **`integrum-files`**, so do not casually point it at an existing real-data bucket. Keep service credentials server-side. Confirm provider configuration privately before any mutation.

Perform controlled fixture tests:

1. Owner uploads a supported note file and profile PDF; verify actual bytes on retrieval.
2. Anonymous and another student cannot obtain the owner's file through the API.
3. The object is not publicly readable without authorized/signed access.
4. A signed URL works during its expiry and is rejected after expiry; account for clock behavior without hiding a genuine failure.
5. Replacement removes/durably queues the old object; failed DB attachment compensates its own new object.
6. Direct note deletion and subject/semester/student cascades queue all detached references.
7. Provider deletion outage preserves pending jobs; restoring provider access and invoking bounded retry removes unreferenced fixtures.
8. Still-referenced files are not deleted. Unknown-provider rows are retained for diagnosis.
9. Cleanup does not touch unrelated objects, real students or another application's storage.
10. Save sanitized evidence and remove only the known fixture objects/rows.

Before any orphan cleanup on existing storage, produce a **dry-run inventory** containing provider, object ID, DB references, age, reason and proposed action. Include a grace period for in-flight uploads. Review ambiguities; apply only approved entries. Keep an auditable deletion result. An empty queue is not evidence there are no orphans.

### 14.3 Deployment choices to revisit after backend closure

Supabase can host PostgreSQL and private storage; it does not automatically run this existing long-lived Express server. Vercel frontend hosting and the Express runtime need an explicit topology. Do not migrate to Edge Functions/serverless or introduce Render solely because a past document listed it. Explain concrete hosting constraints and cost before selecting.

Current cookie behavior: HttpOnly refresh cookie, Secure in production, SameSite Strict, hard-coded seven-day lifetime. Access token is intended to stay in frontend memory. Cross-site browser refresh behavior must be tested with the actual frontend/API domains; do not simply change SameSite to None without a CSRF/origin review. CORS allows configured CLIENT_URL with credentials. Proxy hops default zero: set according to actual trusted routing, never blindly trust every forwarding header.

In-memory Express rate limiting is per process. If deploying multiple instances, evaluate a shared limiter or clearly bound the deployment. Review health probe load because global production middleware can affect health traffic. Review shutdown error/timeout behavior under real database failures; the five-second test watchdog is a test mechanism, not proof the production server has a complete shutdown deadline policy.

### 14.4 CI/CD direction — proposed, not implemented

After the local runner is reliable, add a workflow that checks out the commit, uses an agreed supported Node/npm version, runs `npm ci`, provisions an isolated PostgreSQL service, executes the native suite with mock AI/local files/console email, builds the full workspace, and runs the explicit baseline/security gates. Artifacts should be sanitized logs; no production secrets are needed for this baseline.

Keep real-provider tests a separate explicitly authorized environment job. Keep production migrations/deployment behind a clear release gate, not an automatic side effect of every push. Use minimum repository token permissions; do not expose deployment keys to untrusted pull-request code. Pin/review workflow dependencies. The exact GitHub Actions file has not been written or executed in this handoff.

Document rollback for application code, database compatibility and external storage separately. A green workflow only proves the checks it ran.

## 15. Frontend direction and development schedule

### 15.1 Sequence and realistic timing

The user expanded the working window from seven to twelve days, with roughly up to four days intended for backend gap closure and earlier frontend start if closure took two or three. Do not assume exactly how many days remain from historical messages. Recalculate the calendar with Sufiyan; protect the academic submission deadline rather than claiming the original window restarted today.

Proposed remaining work blocks, adjusted after actual test results:

| Block | Work | Exit condition |
|---|---|---|
| First session | Restore latest source, preserve first failure, finish corrected native run | B01 evidence complete |
| Backend verification | Native baseline/races, current audit, prioritized security fixes | Reproducible test evidence; no unresolved high-risk defect |
| Backend feature/lifecycle closure | Reminder acceptance, storage retry/inventory, email/AI live test journeys | Requirements gaps resolved or explicit limited infrastructure acceptance |
| Integration | Review source branches, test combined tree, publish/merge | Accepted main with history and old branches retained |
| Frontend foundation | Routes/layout/navigation, design tokens, accessible shell, auth client | Working student/admin entry and session behavior |
| Frontend vertical slices | Academic then career then productivity/AI/analytics/admin journeys | End-to-end usable flows with real API, not static mock pages |
| Release and submission | Browser acceptance, deployed checks, docs/demo/viva, contingency time | Demonstrable V1 and honest limitations |

Within the proposed twelve-day budget, aim to reserve the majority for frontend integration and final acceptance. Do not compress unresolved data/security defects into the final evening to protect an artificial schedule. If the closure list cannot fit, present concrete trade-offs to the user early.

### 15.2 Frontend architecture

Keep the existing React/Vite stack. Build a shared authenticated shell with separate student/admin navigation. Establish typed API access, loading/error/empty states and route guards first. Do not place Supabase service keys, database URLs or backend secrets in `VITE_` variables or browser bundles.

Suggested student navigation: Overview, Academic, Career, Productivity, AI tools within their related screens, Analytics, Profile. Suggested admin navigation: Overview, Users/Enrollment, Academic Catalog, Content, Feedback/Settings, Reports/Audit. Final labels/layout need user review; they are a proposal, not a completed UI design.

Treat auth refresh as a coordinated client operation: one refresh request at a time, queue/retry eligible requests once, stop on revoked sessions, and avoid infinite 401 loops. Multi-tab refresh races need deliberate handling because rotation accepts one old token only. Browser route guards improve UX; server authorization remains mandatory.

### 15.3 Frontend acceptance scenarios

| Journey | Required behavior |
|---|---|
| Sign in, refresh, logout | Access stays in memory; cookie sent with credentials; revoked tokens stop working; logout clears visible state |
| Create semester and link term | Active options only for new links; historical inactive link visible; date/conflict errors explained |
| Enrollment and syllabus | Admin assigns course; student sees course-scoped syllabus; 409 does not delete personal work |
| Attendance entry | Totals update consistently; manual-to-record transition requires explicit user action |
| Note upload/download | Correct formats/errors; private API retrieval; bearer-auth downloads use fetch/blob where necessary rather than an unauthenticated anchor |
| Resume editing/export | Preserve version semantics; binary PDF response handled as bytes; completion distinguished from AI review |
| Internship/placement | Correct category defaults/filters, manual eligibility, history edit/clear semantics |
| AI suggestions | Label generated output; show/edit before saving into plans/tasks; handle disabled AI, timeouts and quota errors |
| Analytics | Display denominator/empty states and heuristic/history caveats; do not label assignments-created-in-window as completions-in-window |
| Reminder alerts | Match the explicitly agreed alert delivery mechanism; CRUD list alone is not a notification system |
| Admin changes | Role checks, last-admin/status protections where defined, audited enrollment, clear conflict feedback |

Use accessible labels, keyboard navigation, readable error text, contrast, responsive layouts and reduced-motion support where relevant. These are frontend acceptance requirements, not evidence that accessibility has been tested yet.

## 16. Successor instructions and reporting templates

### 16.1 Copyable opening instruction for the next coding assistant

> You are continuing Integrum, not starting a new architecture. Read Integrum-Engineering-Handoff.md and verify the repository identity and branch before editing. Recover exact commit 6a58d18e92f3b425fa21b92d6a03cd8efdabaa1f or an inspected descendant. The old laptop bundle stopped at 86df369. Keep the seven V1 modules and current React/Express/Prisma/PostgreSQL/custom-JWT stack. The first native Windows run passed 25 closure tests but failed the old shutdown harness; the corrected script has not yet been reported as passing on Windows. Finish that verification first, preserve failures, then follow the gap register and closure criteria. Never declare backend complete from schema presence, mocked provider tests or an old progress claim. Preserve strict typing, ownership, atomic writes, file privacy, session revocation and honest analytics semantics. Do not delete/prune branches, force-push, reset user databases, expose credentials, deploy or redesign without the appropriate concrete authorization. After closure, integrate tested changes into main, preserving history and all old branches. Report exact changes, rationale, tests, failures and remaining gates after each slice.

### 16.2 Evidence record template

```markdown
### Verification checkpoint
- Date and environment:
- Branch, HEAD and any uncommitted diff:
- Node / npm / PostgreSQL versions:
- Database safety: generated disposable DB / controlled test environment:
- Provider modes:
- Commands run:
- Expected behavior:
- Actual results and exit codes:
- Tests passed / failed / skipped:
- Log locations (sanitized when shared):
- Cleanup result:
- Defects found and fixed:
- Remaining uncertainty:
- Next action and owner:
```

### 16.3 Change review template

```markdown
### Change
- Problem and affected user journey:
- Invariant that must hold:
- Files and API/schema behavior changed:
- Why this approach fits existing architecture:
- Alternatives deferred and concrete reason:
- Compatibility / migration / session impact:
- Negative and concurrency cases checked:
- Verification evidence:
- Remaining limitation and acceptance decision:
- Commit and publication status:
```

### 16.4 Backend closure approval record

```markdown
### Backend contract closure decision
- Candidate SHA and final main SHA:
- Requirements comparison reviewed:
- Native suite / baseline / race evidence:
- Current security/dependency review:
- Storage lifecycle and provider evidence:
- Email / AI evidence:
- Explicitly accepted nonblocking limitations:
- Production-only gates still open:
- Retained branches and their tip SHAs:
- Backup and rollback references:
- Decision by Sufiyan / reviewer and date:
```

### 16.5 What the successor must not claim

- “All backend work is complete” before the explicit gates are met.
- “All tests passed on native PostgreSQL” when only the closure runner did, or when the smoke command exited 1.
- “Supabase is secure” from local storage tests.
- “Emails are delivered” from a stubbed Resend acceptance response.
- “AI is production-ready” from deterministic mock output.
- “The intermittent storage bug was fixed” when root cause remained unproven.
- “The user authored every commit” because their credentials pushed a bundle.
- “Branches were closed” if they were actually deleted.
- “The frontend exists” because the starter builds.
- “This handoff contains every prior Antigravity chat.” Only selected exports and repository history were available for this preparation.

## 17. Evidence sources and reference index

### 17.1 Repository evidence

Source inspected at `6a58d18`, the local Git log/diff, Prisma schema/migrations, route mounts, representative domain/provider services, native and production test scripts, frontend App.tsx, and workspace manifests are the primary technical evidence. The complete committed tree is in the bundle.

Chronological repository references: `BACKEND_CLOSURE_DAY1.md`, `NATIVE_VERIFICATION.md`, `PROJECT_PROGRESS.md`, `domain_modeling.md`, `ADMIN_FOUNDATION_AUDIT.md`, `ADMIN_PORTAL_IMPLEMENTATION_PLAN.md`, `implementation_plan.md`, `api_auth_design.md`, `er_diagram.md`, README. Not every historical statement in those files was independently re-audited; later source and test evidence govern.

The 21 September native evidence in section 1 comes directly from the user's pasted terminal logs. It is not a new execution by the assistant, and the native result files themselves were not uploaded. Preserve them on the laptop.

### 17.2 Project sources reviewed

- **Mini_Project_Synopsis_AI_Powered_Student_Success_Platform.pdf**: extracted full text, seven-pillar scope, outcomes, exclusions, historical stack/timeline.
- **ChatGPT-Branch · Mini Project Guidance.md**: targeted reading of frozen rules, architecture/domain distinction and change-control policy.
- **ChatGPT-Project Context and Tech Stack-20260825-2311.md**: targeted historical review, including the warning about typecheck suppression during earlier admin work.
- **ChatGPT-Mini Project Guidance.md** and **ChatGPT-Project Alignment with Syllabus.md**: searched for final scope/architecture/rules, used as historical context rather than treating every old proposal as current authority.

These four chat exports total over 41,000 lines. This preparation used targeted retrieval and repository evidence; it does not claim every line or both external Drive chats was freshly read. The original Drive folder supplied by the user was `https://drive.google.com/drive/folders/1bXX0tjCC9PVbbHY6y3HefZIQY6pTS8w7`. If a later requirement dispute depends on unseen chat content, retrieve that content or ask for the exact excerpt instead of inventing it.

### 17.3 External technical references

- [Git merge manual](https://git-scm.com/docs/git-merge): merge preparation, conflict handling, no-commit/abort semantics.
- [Git bundle manual](https://git-scm.com/docs/git-bundle): offline history transport and verification. A bundle transports Git objects/refs, not working-directory-only data.
- [Node child-process documentation](https://nodejs.org/api/child_process.html#subprocesskillsignal): Windows termination behavior underlying the smoke harness correction.
- [GitHub CLI auth login](https://cli.github.com/manual/gh_auth_login) and [auth setup-git](https://cli.github.com/manual/gh_auth_setup-git): browser sign-in and Git credential setup used in earlier transfer guidance.

External services, pricing, hosting capabilities and dependency advisories can change. Verify their current official documentation when implementing deployment. This handoff does not freeze vendor availability or prices.

## 18. Generated source inventory and recovery appendix

The following inventory was extracted from the packaged repository. Paths are repository-relative and become usable after restoring the bundle. Counts and listings describe source presence, not test completeness.

### 18.1 Exact changed-file inventory

```text
M	.gitignore
A	BACKEND_CLOSURE_DAY1.md
A	NATIVE_VERIFICATION.md
M	PROJECT_PROGRESS.md
M	backend/.env.example
M	backend/package.json
A	backend/prisma/migrations/20260919000000_career_classification/migration.sql
A	backend/prisma/migrations/20260919010000_auth_sessions/migration.sql
A	backend/prisma/migrations/20260919020000_storage_cleanup/migration.sql
M	backend/prisma/schema.prisma
A	backend/scripts/retry-storage-cleanup.ts
M	backend/scripts/test-admin-platform.ts
A	backend/scripts/test-day1.test.ts
A	backend/scripts/test-native.mjs
M	backend/scripts/test-p3-p4.ts
A	backend/scripts/test-production-hardening.ts
M	backend/src/app.ts
M	backend/src/config/env.ts
M	backend/src/config/prisma.ts
M	backend/src/controllers/admin/user.controller.ts
M	backend/src/controllers/analytics.controller.ts
M	backend/src/controllers/auth.controller.ts
M	backend/src/controllers/health.controller.ts
M	backend/src/controllers/jobapplication.controller.ts
M	backend/src/controllers/note.controller.ts
M	backend/src/controllers/semester.controller.ts
M	backend/src/controllers/subject.controller.ts
M	backend/src/controllers/user.controller.ts
M	backend/src/middleware/authenticate.ts
M	backend/src/middleware/errorHandler.ts
M	backend/src/middleware/maintenanceMode.ts
M	backend/src/middleware/validateRequest.ts
M	backend/src/routes/admin/user.routes.ts
M	backend/src/routes/analytics.routes.ts
M	backend/src/routes/jobapplication.routes.ts
M	backend/src/routes/semester.routes.ts
M	backend/src/routes/subject.routes.ts
M	backend/src/schemas/admin/user.schema.ts
M	backend/src/schemas/ai.schema.ts
M	backend/src/schemas/jobapplication.schema.ts
M	backend/src/schemas/semester.schema.ts
M	backend/src/schemas/subject.schema.ts
M	backend/src/services/admin/academic.service.ts
M	backend/src/services/admin/report.service.ts
M	backend/src/services/admin/user.service.ts
M	backend/src/services/ai/ai.provider.ts
M	backend/src/services/ai/gemini.provider.ts
M	backend/src/services/ai/mock.provider.ts
M	backend/src/services/analytics.service.ts
A	backend/src/services/attendance-consistency.ts
M	backend/src/services/attendance.service.ts
M	backend/src/services/auth.service.ts
M	backend/src/services/email.service.ts
M	backend/src/services/jobapplication.service.ts
M	backend/src/services/note.service.ts
M	backend/src/services/semester.service.ts
A	backend/src/services/storage/cleanup.ts
A	backend/src/services/storage/file-transfer.ts
M	backend/src/services/storage/local.storage.ts
M	backend/src/services/storage/supabase.storage.ts
M	backend/src/services/subject.service.ts
M	backend/src/services/task.service.ts
M	backend/src/services/user.service.ts
M	backend/src/utils/jwt.ts
A	backend/src/utils/withTimeout.ts
A	backend/tsconfig.tests.json
M	frontend/tsconfig.app.json
M	package-lock.json
M	package.json
```

### 18.2 Full commit identities

```text
60c60bf42be46c87309e2b6973ac6f54b90c12a7 fix(backend): validate ownership and complete private file retrieval
21c48868c7e7fe6be150b3d6780c0d747dd5eeb4 feat(career): add application classification and interview history
2fb21f3a6adced687b1d56011f3b19565e73a696 feat(analytics): complete student performance and career metrics
1de5745e977dafcf1d244bb12675dcd697fe6780 feat(ai): expand validated study plan recommendations
60c974bc06815ecd4d03746283057f5d1e6eb02e fix(hardening): verify production runtime and repair build gates
f9e5abfdbe7c3dabafb75d2fe0194d4efa27c0fc fix(auth): rotate refresh tokens and revoke database sessions
5777dbc4d55cb2cab852d7a537928c81e1da1b6a feat(email): integrate Resend and recover from delivery failures
f7b639ca3797b1462f4617aa26716b493d1bd355 fix(storage): queue cascade cleanup and retry failed deletions
232e0618ac22bc2f1a16924cfdf13db85dbfd4ef fix(deps): patch Prisma tooling dependencies with verified overrides
f91362ce31638c9a5336b806d266fa4fbc43bb1f fix(academic): make attendance mutations and totals atomic
e66b3645a9a79429ae48308add85dbf2d8263295 fix(reports): apply cohort and date filters consistently
df6d17626d3cde3680b69c9a3bf9517045422d72 fix(academic): expose guarded student term linkage and date edits
d35ac724a28c111b78782717fd266f33e0a637c8 docs: record storage tracing and uninterrupted verification results
9e5caddb4f2e6cabc41ba0a6b17c356f8b74d1be fix(academic): add audited admin-controlled course enrollment
49b1f0bd085eb4c3bb3ec4e16ff411a57ccf75eb fix(academic): add course-scoped syllabus lookup and subject links
86df369855ffeda9e25b79044331555b2a3480da test: prepare isolated native PostgreSQL verification runner
6a58d18e92f3b425fa21b92d6a03cd8efdabaa1f fix: verify graceful shutdown in Windows smoke test
```

### 18.3 Migration order

```text
20260806143454_init
20260808143347_add_user_auth_fields
20260812152558_init_reminders
20260813171135_complete_academic_hub
20260820114243_v1_core_gaps_identity_academic
20260821142706_v1_career_hub_p3
20260824093648_add_admin_portal_schema
20260904124311_add_note_file_id
20260904130657_add_student_profile_uploaded_resume
20260919000000_career_classification
20260919010000_auth_sessions
20260919020000_storage_cleanup
```

### 18.4 Schema entities

```text
enum Role
enum AssignmentStatus
enum Priority
enum ContentPriority
enum TaskStatus
enum SkillCategory
enum ApplicationStatus
enum NotificationType
enum AIExecutionStatus
enum AIModule
enum StudyPlanStatus
enum AttendanceStatus
enum CalendarEventType
enum AnnouncementType
enum ContentTargetScope
enum InstitutionalEventCategory
enum ResourceCategory
enum FeedbackCategory
enum FeedbackStatus
enum AcademicTermType
enum SystemSettingKey
model User
model StudentProfile
model AdminProfile
model StudentSettings
model Notification
model Department
model Course
model MasterSubject
model AcademicTerm
model Semester
model Subject
model Assignment
model Note
model StudyPlan
model AttendanceRecord
model CalendarEvent
model Announcement
model InstitutionalEvent
model AcademicResource
model Feedback
model AdminAuditLog
model SystemSetting
model Task
model Reminder
model StudentAnalytics
model Resume
model ResumeVersion
model Skill
model JobApplication
model Certification
model Project
model AIExecutionLog
enum ApplicationType
enum EligibilityStatus
model AuthSession
model StorageCleanup
```

### 18.5 Route mounts and method inventory

These are literal registration lines. Multiline route calls are listed only where the method/path occurs on one line; consult the route file for omitted multiline arguments, schemas and middleware. This is navigation support, not an OpenAPI specification.

App mounts:

```typescript
app.use(helmet());
app.use(
  app.use(morgan('dev'));
  app.use(globalLimiter);
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);
  app.use('/api/v1/auth/forgot-password', authLimiter);
  app.use('/api/v1/auth/reset-password', authLimiter);
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));
app.use(cookieParser());
app.use(compression());
app.use(maintenanceMode);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/semesters', semesterRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/reminders', reminderRoutes);
app.use('/api/v1/study-plans', studyPlanRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/resumes', resumeRoutes);
app.use('/api/v1/skills', skillRoutes);
app.use('/api/v1/job-applications', jobApplicationRoutes);
app.use('/api/v1/certifications', certificationRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use(notFound);
app.use(errorHandler);
```

**`backend/src/routes/admin/academic.routes.ts`**

```typescript
router.post('/departments', validateRequest(createDepartmentSchema), adminAcademicController.createDepartment);
router.get('/departments', validateRequest(listDepartmentsQuerySchema), adminAcademicController.listDepartments);
router.get('/departments/:id', adminAcademicController.getDepartmentById);
router.patch('/departments/:id', validateRequest(updateDepartmentSchema), adminAcademicController.updateDepartment);
router.delete('/departments/:id', adminAcademicController.deleteDepartment);
router.post('/courses', validateRequest(createCourseSchema), adminAcademicController.createCourse);
router.get('/courses', validateRequest(listCoursesQuerySchema), adminAcademicController.listCourses);
router.get('/courses/:id', adminAcademicController.getCourseById);
router.patch('/courses/:id', validateRequest(updateCourseSchema), adminAcademicController.updateCourse);
router.delete('/courses/:id', adminAcademicController.deleteCourse);
router.post('/master-subjects', validateRequest(createMasterSubjectSchema), adminAcademicController.createMasterSubject);
router.get('/master-subjects', validateRequest(listMasterSubjectsQuerySchema), adminAcademicController.listMasterSubjects);
router.get('/master-subjects/:id', adminAcademicController.getMasterSubjectById);
router.patch('/master-subjects/:id', validateRequest(updateMasterSubjectSchema), adminAcademicController.updateMasterSubject);
router.delete('/master-subjects/:id', adminAcademicController.deleteMasterSubject);
router.post('/terms', validateRequest(createAcademicTermSchema), adminAcademicController.createAcademicTerm);
router.get('/terms', validateRequest(listAcademicTermsQuerySchema), adminAcademicController.listAcademicTerms);
router.get('/terms/:id', adminAcademicController.getAcademicTermById);
router.patch('/terms/:id', validateRequest(updateAcademicTermSchema), adminAcademicController.updateAcademicTerm);
router.delete('/terms/:id', adminAcademicController.deleteAcademicTerm);
```

**`backend/src/routes/admin/content.routes.ts`**

```typescript
router.post('/announcements', validateRequest(createAnnouncementSchema), adminContentController.createAnnouncement);
router.get('/announcements', validateRequest(listAnnouncementsQuerySchema), adminContentController.listAnnouncements);
router.get('/announcements/:id', adminContentController.getAnnouncementById);
router.patch('/announcements/:id', validateRequest(updateAnnouncementSchema), adminContentController.updateAnnouncement);
router.patch('/announcements/:id/publish', adminContentController.publishAnnouncement);
router.patch('/announcements/:id/unpublish', adminContentController.unpublishAnnouncement);
router.delete('/announcements/:id', adminContentController.deleteAnnouncement);
router.post('/events', validateRequest(createInstitutionalEventSchema), adminContentController.createEvent);
router.get('/events', validateRequest(listInstitutionalEventsQuerySchema), adminContentController.listEvents);
router.get('/events/:id', adminContentController.getEventById);
router.patch('/events/:id', validateRequest(updateInstitutionalEventSchema), adminContentController.updateEvent);
router.delete('/events/:id', adminContentController.deleteEvent);
router.post('/resources', validateRequest(createAcademicResourceSchema), adminContentController.createResource);
router.get('/resources', validateRequest(listAcademicResourcesQuerySchema), adminContentController.listResources);
router.get('/resources/:id', adminContentController.getResourceById);
router.patch('/resources/:id', validateRequest(updateAcademicResourceSchema), adminContentController.updateResource);
router.delete('/resources/:id', adminContentController.deleteResource);
```

**`backend/src/routes/admin/index.ts`**

```typescript
router.use(authenticate, authorize('ADMIN'));
router.get('/ping', (req, res) => {
router.use('/users', userRoutes);
router.use('/academics', academicRoutes);
router.use('/content', contentRoutes);
router.use('/platform', platformRoutes);
router.use('/reports', reportRoutes);
```

**`backend/src/routes/admin/platform.routes.ts`**

```typescript
router.get('/dashboard', adminPlatformController.getDashboard);
router.get('/audit-logs', validateRequest(listAuditLogsQuerySchema), adminPlatformController.listAuditLogs);
router.get('/feedback', validateRequest(listFeedbackQuerySchema), adminPlatformController.listFeedback);
router.get('/feedback/:id', adminPlatformController.getFeedbackById);
router.patch('/feedback/:id', validateRequest(updateFeedbackAdminSchema), adminPlatformController.updateFeedback);
router.get('/settings', adminPlatformController.getSettings);
router.patch('/settings/:key', validateRequest(updateSystemSettingSchema), adminPlatformController.updateSetting);
```

**`backend/src/routes/admin/report.routes.ts`**

```typescript
router.get('/users', validateRequest(reportQuerySchema), adminReportController.getUserReport);
router.get('/academics', validateRequest(reportQuerySchema), adminReportController.getAcademicReport);
router.get('/usage', validateRequest(reportQuerySchema), adminReportController.getUsageReport);
router.get('/health', adminReportController.getHealthReport);
```

**`backend/src/routes/admin/user.routes.ts`**

```typescript
router.get('/students', validateRequest(listStudentsQuerySchema), adminUserController.listStudents);
router.get('/admins', validateRequest(listAdminsQuerySchema), adminUserController.listAdmins);
router.post('/admins', validateRequest(createAdminSchema), adminUserController.createAdmin);
router.patch('/:id/status', validateRequest(updateUserStatusSchema), adminUserController.updateUserStatus);
router.patch('/:id/role', validateRequest(updateUserRoleSchema), adminUserController.updateUserRole);
router.patch('/:id/enrollment', validateRequest(updateStudentEnrollmentSchema), adminUserController.updateStudentEnrollment);
```

**`backend/src/routes/ai.routes.ts`**

```typescript
router.use(authenticate, authorize('STUDENT'));
router.use(
router.post(
router.post('/resume/:id/analyze', asyncHandler(analyzeResume));
router.post('/notes/:id/summarize', asyncHandler(summarizeNote));
router.post('/notes/:id/key-points', asyncHandler(extractKeyPoints));
router.post('/notes/:id/questions', asyncHandler(generateQuestions));
router.post('/notes/:id/flashcards', asyncHandler(generateFlashcards));
```

**`backend/src/routes/analytics.routes.ts`**

```typescript
router.use(authenticate, authorize('STUDENT'));
router.get('/subject-performance', getSubjectPerformance);
router.get('/internship-stats', getInternshipStats);
router.get('/dashboard', validateRequest(getAnalyticsQuerySchema), getStudentDashboard);
router.get('/skills-progress', getSkillsProgress);
router.get('/placement-readiness', getPlacementReadiness);
router.get('/activity', validateRequest(getActivityQuerySchema), getActivityBreakdown);
```

**`backend/src/routes/assignment.routes.ts`**

```typescript
router.use(authenticate, authorize('STUDENT'));
router.post('/', validateRequest(createAssignmentSchema), assignmentController.createAssignment);
router.get('/', assignmentController.getAssignments);
router.get('/:id', assignmentController.getAssignmentById);
router.patch('/:id', validateRequest(updateAssignmentSchema), assignmentController.updateAssignment);
router.delete('/:id', assignmentController.deleteAssignment);
```

**`backend/src/routes/attendance.routes.ts`**

```typescript
router.use(authenticate);
router.use(authorize('STUDENT'));
router.post('/', validate(createAttendanceRecordSchema), createAttendanceRecord);
router.get('/', getAttendanceRecords);
router.get('/report', getAttendanceReport); // A-4: must be before /:id
router.get('/:id', getAttendanceRecordById);
router.patch('/:id', validate(updateAttendanceRecordSchema), updateAttendanceRecord);
router.delete('/:id', deleteAttendanceRecord);
```

**`backend/src/routes/auth.routes.ts`**

```typescript
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);
router.post('/verify-email', validateRequest(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', authenticate, authController.resendVerification);
```

**`backend/src/routes/calendar.routes.ts`**

```typescript
router.use(authenticate);
router.use(authorize('STUDENT'));
router.post('/', validate(createCalendarEventSchema), createCalendarEvent);
router.get('/', getCalendarEvents);
router.get('/:id', getCalendarEventById);
router.patch('/:id', validate(updateCalendarEventSchema), updateCalendarEvent);
router.delete('/:id', deleteCalendarEvent);
```

**`backend/src/routes/catalog.routes.ts`**

```typescript
router.use(authenticate);
router.get('/departments', catalogController.getDepartments);
router.get('/courses', catalogController.getCourses);
router.get('/subjects', catalogController.getSubjects);
router.get('/terms', catalogController.getTerms);
```

**`backend/src/routes/certification.routes.ts`**

```typescript
router.use(authenticate, authorize('STUDENT'));
router.get('/expiring', getExpiringCertifications); // P4: must be before /:id
router.post('/', validateRequest(createCertificationSchema), createCertification);
router.get('/', getCertifications);
router.get('/:id', getCertificationById);
router.patch('/:id', validateRequest(updateCertificationSchema), updateCertification);
router.delete('/:id', deleteCertification);
```

**`backend/src/routes/content.routes.ts`**

```typescript
router.use(authenticate);
router.get('/announcements', contentController.getAnnouncements);
router.get('/events', contentController.getEvents);
router.get('/resources', contentController.getResources);
```

**`backend/src/routes/feedback.routes.ts`**

```typescript
router.post(
```

**`backend/src/routes/health.routes.ts`**

```typescript
router.get('/', asyncHandler(healthCheck));
```

**`backend/src/routes/jobapplication.routes.ts`**

```typescript
router.use(authenticate, authorize('STUDENT'));
router.post('/', validateRequest(createJobApplicationSchema), createApplication);
router.get('/', validateRequest(listJobApplicationsSchema), getApplications);
router.get('/internships', validateRequest(listJobApplicationsSchema), getApplications);
router.get('/placements', validateRequest(listJobApplicationsSchema), getApplications);
router.get('/:id', getApplicationById);
router.patch('/:id', validateRequest(updateJobApplicationSchema), updateApplication);
router.delete('/:id', deleteApplication);
```

**`backend/src/routes/note.routes.ts`**

```typescript
router.use(authenticate);
router.use(authorize('STUDENT'));
router.post('/', validate(createNoteSchema), createNote);
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.patch('/:id', validate(updateNoteSchema), updateNote);
router.delete('/:id', deleteNote);
router.post('/:noteId/upload', uploadLimiter, noteUpload.single('file'), uploadNoteFile);
router.get('/:noteId/file', streamNoteFile);
```

**`backend/src/routes/project.routes.ts`**

```typescript
router.use(authenticate, authorize('STUDENT'));
router.post('/', validateRequest(createProjectSchema), createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.patch('/:id', validateRequest(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);
```

**`backend/src/routes/reminder.routes.ts`**

```typescript
router.use(authenticate, authorize('STUDENT'));
router.post('/', validateRequest(createReminderSchema), createReminder);
router.get('/', getReminders);
router.get('/:id', getReminderById);
router.patch('/:id', validateRequest(updateReminderSchema), updateReminder);
router.delete('/:id', deleteReminder);
```

**`backend/src/routes/resume.routes.ts`**

```typescript
router.use(authenticate, authorize('STUDENT'));
router.get('/templates', getResumeTemplates);
router.post('/', validateRequest(createResumeSchema), createResume);
router.get('/', getResumes);
router.get('/:id', getResumeById);
router.get('/:id/pdf', exportResumePdf); // G3: PDF binary export
router.patch('/:id', validateRequest(updateResumeSchema), updateResume);
router.delete('/:id', deleteResume);
```

**`backend/src/routes/semester.routes.ts`**

```typescript
router.use(authenticate, authorize('STUDENT'));
router.post('/', validateRequest(createSemesterSchema), semesterController.createSemester);
router.get('/', semesterController.getSemesters);
router.get('/academic-terms', validateRequest(academicTermLookupSchema), semesterController.listAcademicTerms);
router.get('/:id', semesterController.getSemesterById);
router.patch('/:id', validateRequest(updateSemesterSchema), semesterController.updateSemester);
router.delete('/:id', semesterController.deleteSemester);
```

**`backend/src/routes/skill.routes.ts`**

```typescript
router.use(authenticate, authorize('STUDENT'));
router.post('/', validateRequest(createSkillSchema), createSkill);
router.get('/', getSkills);
router.get('/:id', getSkillById);
router.patch('/:id', validateRequest(updateSkillSchema), updateSkill);
router.delete('/:id', deleteSkill);
```

**`backend/src/routes/studyplan.routes.ts`**

```typescript
router.use(authenticate);
router.use(authorize('STUDENT'));
router.post('/', validate(createStudyPlanSchema), createStudyPlan);
router.get('/', getStudyPlans);
router.get('/:id', getStudyPlanById);
router.patch('/:id', validate(updateStudyPlanSchema), updateStudyPlan);
router.delete('/:id', deleteStudyPlan);
```

**`backend/src/routes/subject.routes.ts`**

```typescript
router.use(authenticate, authorize('STUDENT'));
router.post('/', validateRequest(createSubjectSchema), subjectController.createSubject);
router.get('/', subjectController.getSubjects);
router.get('/syllabus', validateRequest(syllabusLookupSchema), subjectController.listSyllabus);
router.get('/:id', subjectController.getSubjectById);
router.patch('/:id', validateRequest(updateSubjectSchema), subjectController.updateSubject);
router.delete('/:id', subjectController.deleteSubject);
```

**`backend/src/routes/task.routes.ts`**

```typescript
router.use(authenticate, authorize('STUDENT'));
router.post('/', validateRequest(createTaskSchema), taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/upcoming', taskController.getUpcomingTasks); // I-6: must be before /:id
router.get('/:id', taskController.getTaskById);
router.patch('/:id', validateRequest(updateTaskSchema), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
```

**`backend/src/routes/user.routes.ts`**

```typescript
router.use(authenticate);
router.get('/me', userController.getProfile);
router.patch('/me', authorize('STUDENT'), validateRequest(updateProfileSchema), userController.updateProfile);
router.post('/me/resume-upload', uploadLimiter, resumeUpload.single('file'), uploadResume);
router.get('/me/resume-file', streamResume);
router.get('/admin-only', authorize('ADMIN'), (_req, res) => {
```

### 18.6 Workspace scripts at the snapshot

`package.json`

```json
{
  "dev": "npm run dev --workspaces",
  "build": "npm run build --workspace frontend && npm run build --workspace backend",
  "lint": "eslint .",
  "format": "prettier --write ."
}
```

`backend/package.json`

```json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "seed": "tsx prisma/seed.ts",
  "test": "echo \"Error: no test specified\" && exit 1",
  "test:closure": "tsc -p tsconfig.tests.json && node --import tsx --test scripts/test-day1.test.ts",
  "test:hardening": "tsc -p tsconfig.tests.json && node --import tsx scripts/test-production-hardening.ts",
  "storage:cleanup": "node --import tsx scripts/retry-storage-cleanup.ts",
  "test:native": "node scripts/test-native.mjs"
}
```

`frontend/package.json`

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "oxlint",
  "preview": "vite preview"
}
```

`shared/package.json`

```json
{
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

### 18.7 Exact corrected production smoke test

This is the version committed in 6a58d18. It is included so the Windows fix is recoverable even without a download link. Prefer restoring the bundle rather than copying source by hand.

```typescript
import 'dotenv/config';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';

async function main() {
assert.equal(process.env.NODE_ENV, 'test');
assert(new URL(process.env.DATABASE_URL!).pathname.endsWith('_test'));
const rejected = spawnSync(process.execPath, ['-e', "require('./dist/config/env.js')"], {
  env: { ...process.env, NODE_ENV: 'production', JWT_ACCESS_SECRET: 'weak', JWT_REFRESH_SECRET: 'weak' },
  stdio: 'ignore', timeout: 5000,
});
assert.equal(rejected.status, 1, 'Production refuses weak secrets');
// Windows kill(SIGTERM) force-terminates the process. This test-only launcher
// invokes the real signal handler over IPC; production server code stays unchanged.
const windowsShutdown = process.platform === 'win32';
const serverArgs = windowsShutdown ? ['-e', `
  require('./dist/server.js');
  process.once('message', message => {
    if (message === 'integrum-test-shutdown') process.emit('SIGTERM');
  });
`] : ['dist/server.js'];
const child = spawn(process.execPath, serverArgs, {
  env: { ...process.env, NODE_ENV: 'production', PORT: '5099', TRUST_PROXY_HOPS: '0',
    JWT_ACCESS_SECRET: randomBytes(32).toString('hex'), JWT_REFRESH_SECRET: randomBytes(32).toString('hex') },
  stdio: windowsShutdown ? ['ignore', 'pipe', 'pipe', 'ipc'] : ['ignore', 'pipe', 'pipe'],
});
const exited = once(child, 'exit');
let output = '';
assert(child.stdout && child.stderr, 'Compiled server output pipes exist');
child.stdout.on('data', data => { output += data.toString(); });
child.stderr.on('data', () => {});
const base = 'http://127.0.0.1:5099/api/v1';
try {
  for (let i = 0; i < 100 && !output.includes('Server is running'); i++) {
    assert.equal(child.exitCode, null, 'Compiled server exited before listening');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert(output.includes('Server is running'), 'Compiled server did not start');
  const health = await fetch(base + '/health');
  assert.equal(health.status, 200);
  assert.equal((await health.json() as any).data.database, 'connected');
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(health.headers.get('x-powered-by'), null);
  const denied = await fetch(base + '/users/me'); assert.equal(denied.status, 401);
  const malformed = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(malformed.status, 400);
  const oversized = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: 'x'.repeat(270000) }) });
  assert.equal(oversized.status, 413);
  let status = 0;
  for (let i = 0; i < 11; i++) {
    const response = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    status = response.status;
    await response.text();
    if (status === 429) break;
  }
  assert.equal(status, 429, 'Production auth rate limit is enforced');
  console.log('PASS: compiled production server, database health, headers, authentication, body limits and rate limiting');
} finally {
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
  try {
    if (windowsShutdown) {
      await new Promise<void>((resolve, reject) => {
        child.send('integrum-test-shutdown', error => error ? reject(error) : resolve());
      });
    } else {
      child.kill('SIGTERM');
    }
    const [code, signal] = await exited;
    assert.equal(signal, null, 'Compiled server was not forcibly terminated');
    assert.equal(code, 0, 'Compiled server shuts down cleanly');
    console.log('PASS: compiled server shutdown handler completed cleanly');
  } finally {
    clearTimeout(timer);
  }
}

}
main().catch(error => { console.error(error); process.exitCode = 1; });
```

### 18.8 Exact native verification runner

The hard-coded administrator identity/password below is a deliberately disposable test fixture. It must never become a real deployed account. The runner targets only its generated local test database.

```javascript
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';

const require = createRequire(import.meta.url);
const backend = fileURLToPath(new URL('../', import.meta.url));
const raw = process.env.NATIVE_TEST_ADMIN_URL;
if (!raw) throw new Error('Set NATIVE_TEST_ADMIN_URL to a local PostgreSQL maintenance database URL. Do not paste credentials into chat.');
let adminUrl;
try { adminUrl = new URL(raw); } catch { throw new Error('NATIVE_TEST_ADMIN_URL must be a valid PostgreSQL URL.'); }
if (!['postgres:', 'postgresql:'].includes(adminUrl.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(adminUrl.hostname) ||
    adminUrl.pathname !== '/postgres' || adminUrl.search || adminUrl.hash) {
  throw new Error('Only a loopback PostgreSQL URL for /postgres without query parameters is accepted.');
}
const database = `integrum_native_${randomBytes(8).toString('hex')}_test`;
const testUrl = new URL(adminUrl); testUrl.pathname = `/${database}`;
const logDir = path.join(backend, 'test-results', database);
await mkdir(logDir, { recursive: true });
const childEnv = {
  ...process.env, DATABASE_URL: testUrl.toString(), NODE_ENV: 'test',
  JWT_ACCESS_SECRET: randomBytes(32).toString('hex'), JWT_REFRESH_SECRET: randomBytes(32).toString('hex'),
  ACCESS_TOKEN_EXPIRES_IN: '15m', REFRESH_TOKEN_EXPIRES_IN: '7d', BCRYPT_SALT_ROUNDS: '4',
  CLIENT_URL: 'http://localhost:5173', PORT: '5000', TRUST_PROXY_HOPS: '0',
  AI_PROVIDER: 'mock', STORAGE_PROVIDER: 'local', EMAIL_PROVIDER: 'console',
  SEED_ADMIN_EMAIL: 'native-admin@integrum.test', SEED_ADMIN_PASSWORD: 'NativeTestOnly123!',
};
delete childEnv.NATIVE_TEST_ADMIN_URL;
function sanitize(text) {
  return text.replaceAll(raw, '[maintenance URL]').replaceAll(testUrl.toString(), '[test URL]')
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/g, '[database URL]')
    .replace(/\b[a-f0-9]{64}\b/gi, '[redacted test token]');
}
async function run(name, args) {
  console.log(`Running ${name}`);
  let output = '';
  const child = spawn(process.execPath, args, { cwd: backend, env: childEnv, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  const timer = setTimeout(() => child.kill(), 180000);
  let code;
  try {
    code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', resolve); });
  } finally { clearTimeout(timer); }
  await writeFile(path.join(logDir, `${name}.log`), sanitize(output));
  if (code !== 0) throw new Error(`${name} failed; inspect its local log.`);
  console.log(`PASS ${name}`);
}
async function verifyConnections() {
  const a = new pg.Client({ connectionString: testUrl.toString(), connectionTimeoutMillis: 5000 });
  const b = new pg.Client({ connectionString: testUrl.toString(), connectionTimeoutMillis: 5000 });
  let pending;
  try {
    await a.connect(); await b.connect();
    const version = (await a.query('SELECT version() AS version')).rows[0].version;
    await writeFile(path.join(logDir, 'server.txt'), version + '\n');
    await a.query('CREATE TABLE native_lock_probe (id integer PRIMARY KEY, value integer NOT NULL)');
    await a.query('INSERT INTO native_lock_probe VALUES (1, 0)');
    await b.query("SET statement_timeout = '10s'");
    const pid = (await b.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    await a.query('BEGIN');
    await a.query('UPDATE native_lock_probe SET value = 100 WHERE id = 1');
    pending = b.query('UPDATE native_lock_probe SET value = value + 1 WHERE id = 1').then(() => null, e => e);
    let blocked = false;
    for (let i = 0; i < 40; i++) {
      // Clear the statistics snapshot so each check observes the other connection.
      await a.query('SELECT pg_stat_clear_snapshot()');
      const row = (await a.query('SELECT wait_event_type FROM pg_stat_activity WHERE pid = $1', [pid])).rows[0];
      if (row?.wait_event_type === 'Lock') { blocked = true; break; }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert(blocked, 'The second connection must wait for the first transaction');
    await a.query('ROLLBACK');
    const error = await pending; if (error) throw error;
    assert.equal((await a.query('SELECT value FROM native_lock_probe WHERE id = 1')).rows[0].value, 1);
    await a.query('DROP TABLE native_lock_probe');
    console.log('PASS independent connections, row lock and rollback');
  } finally {
    await a.query('ROLLBACK').catch(() => {});
    if (pending) await pending;
    await Promise.allSettled([a.end(), b.end()]);
  }
}
const admin = new pg.Client({ connectionString: raw, connectionTimeoutMillis: 5000 });
let created = false;
let passed = false;
let cleanupSucceeded = false;
try {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${database}"`); created = true;
  console.log(`Created disposable database ${database}`);
  await verifyConnections();
  const prisma = path.resolve(path.dirname(require.resolve('prisma/package.json')), require('prisma/package.json').bin.prisma);
  const tsc = path.resolve(path.dirname(require.resolve('typescript/package.json')), require('typescript/package.json').bin.tsc);
  await run('migrations', [prisma, 'migrate', 'deploy']);
  await run('migration-status', [prisma, 'migrate', 'status']);
  await run('generate', [prisma, 'generate']);
  await run('build', [tsc, '-p', 'tsconfig.json']);
  await run('test-types', [tsc, '-p', 'tsconfig.tests.json']);
  await run('seed', ['--import', 'tsx', 'prisma/seed.ts']);
  await run('closure', ['--import', 'tsx', '--test', 'scripts/test-day1.test.ts']);
  await run('production-smoke', ['--import', 'tsx', 'scripts/test-production-hardening.ts']);
  passed = true;
} catch (error) {
  console.error(sanitize(error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
} finally {
  if (created) {
    try {
      await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()', [database]);
      await admin.query(`DROP DATABASE "${database}"`);
      cleanupSucceeded = true;
      console.log(`Removed disposable database ${database}`);
    } catch {
      console.error(`Cleanup failed: remove only ${database} manually after closing its connections.`);
      process.exitCode = 1;
    }
  }
  await admin.end().catch(() => {});
  await writeFile(path.join(logDir, 'result.json'), JSON.stringify({ database, testsPassed: passed, cleanupSucceeded, completedAt: new Date().toISOString() }, null, 2));
  console.log(`Logs: ${logDir}`);
}
```

### 18.9 Historical temporary PGlite harness

These two files were outside Git in `test-runtime`. They explain earlier evidence and are reproduced for continuity. They are **not a native PostgreSQL runner**. In particular, the schema reset is permitted only because this harness owns an in-memory database. Do not transplant it into a shared database. Provider/seed environment must be explicitly set to test values before use; these files are not a turnkey production command. The old server log text says nine migrations but the code applies every migration directory (twelve at this snapshot). The regression server stop path assumes Linux SIGTERM behavior.

`server.mjs`

```javascript
import { PGlite } from '@electric-sql/pglite';
import { createServer } from 'pglite-server';
import { readdir, readFile } from 'node:fs/promises';
const db = new PGlite();
await db.waitReady;
const root = '../integrum/backend/prisma/migrations';
for (const name of (await readdir(new URL(root, import.meta.url))).sort()) {
  if (name === 'migration_lock.toml') continue;
  await db.exec(await readFile(new URL(`${root}/${name}/migration.sql`, import.meta.url), 'utf8'));
}
export const server = createServer(db, {logLevel: 0});
await new Promise(resolve => server.listen(55432, '127.0.0.1', resolve));
export { db };
console.log('Isolated PGlite database ready; nine migration SQL files applied');
```

`regression.mjs`

```javascript
import { server, db } from './server.mjs';
import { spawn } from 'node:child_process';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
const cwd = new URL('../integrum/backend/', import.meta.url);
const logs = new URL('./logs/', import.meta.url); await mkdir(logs, { recursive: true });
const migrations = new URL('../integrum/backend/prisma/migrations/', import.meta.url);
const suites = ['test-admin-foundation','test-admin-users','test-admin-academics','test-admin-content','test-admin-platform','test-admin-reports','test-admin','test-p1-p2','test-p3-p4','test-ai-notes','test-analytics','test-notes-upload','test-profile-resume-upload','test-resume-pdf-export'];
function start(args, name) {
  const log = createWriteStream(new URL(name+'.log', logs));
  const child=spawn(process.execPath,['--import','tsx',...args],{cwd,stdio:['ignore','pipe','pipe']});
  child.stdout.pipe(log);child.stderr.pipe(log);return child;
}
async function wait(child, ms=60000) {
  return new Promise(resolve=>{const timer=setTimeout(()=>child.kill('SIGTERM'),ms);child.on('exit',(code,signal)=>{clearTimeout(timer);resolve({code,signal})})});
}
const results=[];
for(const name of (process.argv.length > 2 ? process.argv.slice(2) : suites)) {
  // This database was created in-memory by this runner. No external DB reset.
  await db.exec('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  for(const m of (await readdir(migrations)).sort()) if(m!=='migration_lock.toml') await db.exec(await readFile(new URL(`${m}/migration.sql`,migrations),'utf8'));
  const seed=await wait(start(['prisma/seed.ts'],name+'-seed'));
  if(seed.code!==0){results.push({name,seed});console.log(JSON.stringify(results.at(-1)));break;}
  const app=start(['src/server.ts'],name+'-server');
  let ready=false;
  for(let i=0;i<100;i++){try{const r=await fetch('http://127.0.0.1:5000/api/v1/health');if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100));}
  const result=ready?await wait(start([`scripts/${name}.ts`],name)): {code:1,signal:'not-ready'};
  const stopped=wait(app,5000); app.kill('SIGTERM'); await stopped;
  results.push({name,...result});console.log(JSON.stringify(results.at(-1)));
}
await writeFile(new URL(process.argv.length > 2 ? 'regression-recheck-results.json' : 'regression-results.json',logs),JSON.stringify(results,null,2));
server.close();await db.close();process.exit(results.every(r=>r.code===0)?0:1);
```

### 18.10 Handoff preservation note

This handoff was prepared without changing application code, running new native tests, merging, deleting branches or publishing to GitHub. The bundle includes the latest committed code and has been verified and restored into a separate checkout for integrity checking. Keep the downloaded ZIP, both old and new laptop test logs, and any independent original-laptop work. The next developer should add this handoff to project documentation in a reviewed documentation commit if desired; it is not itself inside the bundled Git history.

---

## 19. Addendum — complete 26-feature workflow comparison

**Added at the user's request on 21 September 2026. Source remains `6a58d18e92f3b425fa21b92d6a03cd8efdabaa1f`.** Sections 1–18 above are preserved verbatim. This addendum supplies finer source-based qualifications wherever an earlier overview was broad or provisional. No application fix, new test execution, merge or deployment was performed for this addendum. The Windows verification status remains pending.

Read this addendum together with the original handoff. An AI continuing the project must not stop after the original contents list. Additional sections:

- 19: All 26 features and their requested subfunctions, current workflows, gaps, repair directions and acceptance tests.
- 20: Every current Prisma entity and its lifecycle, including support entities.
- 21: Integrated student/admin workflows and missing connections.
- 22: Additional source findings and ordered repair instructions.
- 23: Original-request coverage and decision-rationale cross-reference.
- 24: Explicit successor execution contract and completion evidence.

### 19.1 How to interpret the comparison

**Exists** means an actual code path was located. **Partial** means some subfunctions exist but the complete promised journey does not. **Absent** means no corresponding implementation was found in the inspected source, not that the database cannot be extended. **UI absent** applies to every feature below: the frontend is still the starter. **Needs verification** means source presence is insufficient to certify runtime behavior. New acceptance tests listed below are instructions for future work, not claimed test results.

Feature IDs below count the user's **3 + 5 + 4 + 2 + 3 + 4 + 5 = 26** features. They are different from older task numbers T1–T9 and admin internal functionality counts. No completion percentage is inferred from those counts.

### F01 — Identity & Access: Authentication

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Login | Password comparison, active-user check, access/refresh issuance and AuthSession creation | Login permits an unverified user; verification enforcement is a policy decision, not currently enforced by login |
| Register | Registration setting gate, STUDENT user, hashed password, mandatory baseline and verification token | Account persists if mail delivery fails; response includes `verificationEmailSent` |
| Forgot Password | Generic response, one-hour hashed token, Resend/console send; reset atomically consumes token and revokes sessions | Email body currently describes a raw token/API operation; real browser reset page and delivery remain |
| Email Verification | Verify-token and authenticated resend-verification routes exist | Live delivery, expiry recovery and concurrent token handling need verification |

**Current workflow:** `/auth/register` checks registration settings, commits User and student baseline, then sends email outside the transaction. `/auth/login` verifies credentials and creates a session; frontend receives access token and refresh cookie. Refresh rotates a matching old token hash. Logout removes current session. Verification marks `isVerified`; reset changes password and invalidates all sessions.

**Entities/source:** User, StudentProfile, StudentSettings, StudentAnalytics, AuthSession; `auth.service.ts`, `auth.routes.ts`, auth controller, JWT/cookie/authentication helpers, `ensureStudentBaseline`.

**Gap instructions:** implement browser-friendly verification/reset links or a clearly designed token-entry journey; keep raw secrets out of logs/URLs passed to analytics. Confirm whether verified email must gate any actions before adding a new login restriction. Add resend throttling and outage/retry tests; do not invent a missing resend endpoint—the existing route is `POST /api/v1/auth/resend-verification`. Verification currently reads then updates by user ID rather than conditionally matching the token at update time; reproduce concurrent verify/resend before patching with CAS/transactional consumption. Preserve reset's existing atomic semantics.

**Acceptance:** duplicate registration, inactive login, wrong password, one refresh winner, old-token rejection, current-session logout, all-session reset revocation, verification expiry/reuse/resend, provider outage without lost account, and actual browser recovery. Existing session tests do not automatically cover every new verification race.

### F02 — Identity & Access: Student Profile

| Requested subfunction | Existing behavior | Gap or interpretation |
|---|---|---|
| Personal Details | First/last name and profile read/update | UI and empty-field behavior remain |
| Education | University, enrollment/graduation years; enrollment references course/department | Not a normalized education-history list; resume JSON education is separate |
| Skills | Skill API exists under the same StudentProfile | Profile endpoint does not itself synchronize Skill rows with resume JSON |
| Career Goals | Text field through profile PATCH | No goal taxonomy or recommendation engine implied |
| Social Links | LinkedIn/GitHub/portfolio/Twitter URL fields | Clearing/partial object semantics need client tests |
| Resume Upload | PDF multipart upload, stored file reference, authenticated download | Separate from Resume/ResumeVersion builder; no PDF-to-builder import |

**Current workflow:** authenticated `/users/me` reads user/profile/settings metadata. Student PATCH updates permitted profile fields. Skills, certifications and projects are separate owner-scoped APIs. Admin enrollment supplies institutional linkage; the student cannot self-assign course through profile PATCH. Upload writes a unique object, conditionally attaches its ID and cleans detached files.

**Gap instructions:** decide whether basic education fields meet V1; do not duplicate education data without source-of-truth rules. Compose profile UI from existing APIs and explicitly distinguish uploaded PDF from editable builder resumes. Introduce a structured education entity only for a confirmed requirement. Review omitted versus explicit-clear behavior before form implementation; preserve enrollment authority. Downloads currently select the configured provider, so a future storage-provider switch needs the repair described in section 22.

**Acceptance:** own profile only, immutable role/course from student PATCH, separate skill CRUD visible in profile UI, correct education dates, partial social-link changes, upload failure compensation, replacement and cross-user download denial.

### F03 — Identity & Access: Dashboard

| Requested subfunction | Existing behavior | Remaining work |
|---|---|---|
| Personalised Overview | `/analytics/dashboard` aggregates the current student's metrics | UI absent; figures require the documented denominators |
| Upcoming Tasks | `/tasks/upcoming` returns not-DONE tasks with dueDate strictly in the future, sorted ascending | Overdue tasks are excluded; decide a separate overdue presentation |
| Quick Actions | Domain create/update APIs are available | Quick-action controls/navigation absent; no extra backend endpoint is intrinsically required |
| Recent Activity | `/analytics/activity` returns an activity breakdown | Not a complete cross-entity event feed; tasks use updatedAt proxy |

**Current workflow:** dashboard read queries task/reminder/career/academic data, computes metrics and upserts StudentAnalytics. Upcoming-task lookup is separate. Activity aggregates selected sources; there is no durable generic student activity-event entity.

**Gap instructions:** compose overview and upcoming tasks without inventing a new metrics definition. Define “recent activity”: selected recent records may suffice for V1, but label them accurately; a historical event feed requires event data. Never expose AdminAuditLog as a student's activity feed. Keep overdue and undated tasks visible somewhere, rather than losing them because they are not “upcoming.”

**Acceptance:** two users see different fixtures; empty profile renders zero/empty states; future task appears, DONE/overdue exclusions are intentional; quick actions create through existing authorized APIs; activity order/timezone is stable.

### F04 — Academic Hub: Study Planner

| Requested subfunction | Existing behavior | Remaining work |
|---|---|---|
| Study Schedule | StudyPlan targetDate and linked Tasks | No structured session start/end recurrence in StudyPlan |
| Daily Goals | Free-text `goals` and tasks can express goals | No per-day goal records or individual goal completion |
| Weekly Planner | AI returns weekly session recommendations | Recommendations are not persisted weekly sessions |
| Progress Tracking | Manually writable progressPercentage and ACTIVE/COMPLETED status | Task completion does not automatically update plan progress; status/progress can diverge |

**Current workflow:** create StudyPlan with title/optional target/goals/status/progress; create tasks referencing the owned plan; edit plan manually; delete plan causes task links to become null while tasks survive. Completing a task changes task status only.

**Gap instructions:** define minimum useful V1 planning journey with Sufiyan. Prefer task-based dated schedules if that meets the requirement; otherwise propose a small schedule/session representation. Define manual versus calculated progress explicitly, including no-task and reopened-task cases; never overwrite user-entered goals silently. Provide an accept/edit/save operation for generated plans if persistence is required, using an atomic write or a clearly recoverable client workflow. Add explicit task unlink support if needed—the current task schema accepts UUID but not null.

**Acceptance:** create plan with daily tasks; reload persisted plan; complete/reopen tasks under the agreed progress policy; reschedule safely; reject another student's plan; deleting plan retains personal tasks and removes links; retrying accepted generation does not duplicate tasks.

### F05 — Academic Hub: Notes Manager

| Requested subfunction | Existing behavior | Remaining work |
|---|---|---|
| Upload | Multipart upload limited to 10 MiB with extension and detected-type allowlists | Type detection is not malware scanning or proof of format internals |
| Subject-wise Organisation | Every note belongs to an owned Subject; subjectId filter | UI absent |
| Tags & Search | Tag arrays and exact tag filtering exist | **Title/content search query is absent in the inspected notes controller/service** |
| PDF/DOCX/PPT support | PDF, DOCX, PPT and PPTX accepted by allowlists | Test real fixtures for each; generic CFB container acceptance is broader than validating a PowerPoint document |

**Current workflow:** create an owned note with text/tags/optional legacy fileUrl; upload separately to attach fileId; retrieve text via note API or bytes via authenticated file endpoint; replacement uses CAS and compensation; note/cascade deletion enters cleanup lifecycle. AI note operations require textual content and return 400 for attachment-only notes.

**Gap instructions:** add validated bounded `search` for title/content if this is the intended V1 search; combine it with subject/tag filters inside the ownership predicate. Add pagination/order rules before unbounded lists grow. Do not call tag filtering “full text search.” Validate detected format against intended extension/content, especially legacy `.ppt` CFB files, using positive/negative fixtures. Do not add OCR/extraction implicitly. Define how legacy fileUrl and uploaded fileId coexist; do not assume arbitrary fileUrl has the privacy guarantees of private storage.

**Acceptance:** owner searches exact fixtures and another user's matching text is excluded; combined tag/subject/search and empty results; valid four formats; renamed invalid files; file size rejection; stale upload; private bytes; attachment-only AI rejection with actionable message.

### F06 — Academic Hub: Assignment Manager

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Assignment List | Owned assignments, optional subject filter, subject metadata | Sorting/pagination/UX to verify |
| Deadlines | Optional dueDate | No automatic CalendarEvent or Reminder write |
| Submission Status | PENDING/SUBMITTED/GRADED stored and student-editable | Tracking status, not a teacher grading/submission portal |
| Priority Levels | LOW/MEDIUM/HIGH | UI must preserve enum/defaults |

**Current workflow:** verify subject ownership → create assignment → list/update status/due date/priority → derive completion in analytics → delete directly or by subject cascade. No upload-submission/grading entity exists.

**Gap instructions:** avoid building a faculty workflow outside V1. If changing due dates should update calendar/reminders, use a derived calendar or a stable linked reminder lifecycle rather than copy unrelated rows. Define overdue state as derived, not an undocumented new stored status. Review typed update inputs and optional-field clearing while preserving existing contracts.

**Acceptance:** ownership at creation and mutation, default status/priority, nullable/cleared dates per agreed schema, analytics change for SUBMITTED/GRADED, deadline edit propagates to any implemented alert view, deletion cancels related alerts without deleting unrelated reminders.

### F07 — Academic Hub: Attendance Tracker

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Subject-wise Attendance | Owned AttendanceRecord rows and subject counters | Historical manual totals require explicit transition |
| Attendance % | PRESENT/LATE divided by all records or supported manual totals | EXCUSED counts in denominator; do not silently reinterpret |
| Attendance Goals | Subject attendanceGoal and report logic | Confirm goal/empty-data display matches source |
| Reports | Attendance report and analytics/admin reports | Date bases and manual-total exclusions differ intentionally by report |

**Current workflow:** select owned subject → add/update/delete record in a transaction → recalculate counters → return data → reports recompute derived values. Manual counters and individual records cannot be mixed silently. Delete final record returns zero totals.

**Gap instructions:** keep section 7.4 invariants. Review legacy data in read-only inventory before repair. Test native contention and rollback. If institutional attendance policy changes, obtain a decision and version the formula consistently across services, UI and reports. No automatic date uniqueness: more than one class can occur on a day.

**Acceptance:** known denominator examples including LATE/EXCUSED; invalid bounds; manual-to-record conflict; failed aggregate write rolls back record; simultaneous updates maintain totals; goal alerts reflect agreed arithmetic; owner isolation.

### F08 — Academic Hub: Academic Calendar

| Requested subfunction | Existing behavior | Remaining work |
|---|---|---|
| Semester Calendar | Personal Semester dates and optional AcademicTerm reference | No consolidated calendar projection |
| Exam Schedule | Personal CalendarEvent of type EXAM | No automatic exam timetable feed beyond existing institutional/personal events |
| Deadlines | Assignments, tasks, study plans and applications contain dates | No automatic unified deadline view or synchronization |
| College Events | Scoped published InstitutionalEvent feed plus personal COLLEGE_EVENT | Distinguish institution-authored and personal events |

**Current workflow:** student manually creates CalendarEvent with date/endDate/type; institutional content is fetched separately according to current course/department; semesters may refer to institutional terms. These are separate sources, not a single CalendarEvent-backed integration.

**Gap instructions:** prefer a read-only combined calendar projection with source type/ID, owner/scope and edit link, avoiding duplicate stored events. Define timezone and all-day semantics. **Current personal calendar schemas validate individual timestamps but do not compare endDate with date, including partial PATCH**; add merged-range validation and tests. Do not let the client mutate institution-authored records through personal calendar APIs.

**Acceptance:** invalid create/end-only PATCH rejected; timezone boundary fixtures; semester/exam/assignment/institutional-event visibility; scoped events excluded for foreign course; editing source deadline updates projection once; deleting source removes projection.

### F09 — Career Hub: Resume Builder

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Resume Creation | Resume parent plus initial ResumeVersion JSON | Content structure validation and editor integration matter |
| Templates | Template identifiers and renderer support | Variants may share layout; no claim of distinct polished designs |
| PDF Export | Owner-checked binary PDFKit export of latest version | Browser must handle bytes; multilingual/long-content rendering needs representative testing |

**Current workflow:** create parent/version; content or template change creates another version; metadata-only edit updates parent; retrieval lists versions; export selects latest; deleting parent cascades versions. AI review updates score/feedback on the version it analyzed, not the content itself.

**Gap instructions:** keep resume-upload PDF separate from builder. Define active-resume semantics: multiple parents can be active because no unique active constraint is established here. Make latest-version selection deterministic across export/read/review when timestamps tie. Preserve old versions; avoid overwriting them to simplify UI. If version rollback is needed, create a new version using selected old content rather than rewriting history.

**Acceptance:** content/template edits create versions, metadata edit does not; previous content preserved; stable selection when times tie; foreign resume denial; PDF signature/content/disposition; long sections/page breaks; active-selection policy and readiness consistency.

### F10 — Career Hub: Skill Tracker

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Technical Skills | TECHNICAL Skill category | Self-reported proficiency, not an assessment |
| Soft Skills | SOFT category | Same ownership/model |
| Certifications | Certification dates/issuer/credential links and expiring lookup | Lookup is not a renewal notification |
| Personal Projects | Project title/description/technologies/URLs/dates/isOngoing | Does not automatically populate resume JSON |

**Current workflow:** student creates and maintains separate Skill, Certification and Project rows; analytics calculates current category/proficiency/count metrics; certification expiry query identifies candidates. All belong directly to StudentProfile and cascade with it.

**Gap instructions:** compose them in profile/career UI. Decide explicit import/copy actions into resume rather than silently changing historical resume versions. Verify start/end/expiry and ongoing/null behavior across schemas; add merged PATCH range guards where absent. Add renewal alerts via F14 once agreed. Do not infer verified proficiency from user-entered numbers.

**Acceptance:** category/proficiency boundaries, per-user filtering, expired/upcoming/null-expiry cases, project date changes, foreign edit/delete denial, explicit resume-copy preview, consistent analytics after edit/delete.

### F11 — Career Hub: Internship Tracker

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Applied Companies | JobApplication companyName/role; INTERNSHIP category | Student-maintained records, not externally sourced company list |
| Application Status | APPLIED/INTERVIEWING/OFFERED/REJECTED | Current state, not immutable transition history |
| Interview Schedule | interviewDate/interviewRound and interviewHistory | No automatic calendar entry or alert |
| Offer Tracking | offerDetails structured JSON | Existing offers do not imply acceptance workflow or recruiter integrations |

**Current workflow:** create application, defaulting to INTERNSHIP and UNKNOWN eligibility; update fields/status/history/offer; list `/job-applications/internships`; analytics counts current internship statuses; delete removes record.

**Gap instructions:** expose manual entry clearly. Validate dates/history/offer fields; define which interview date is upcoming when both convenience fields and history exist. Decide whether multiple interviews require a structured schedule, without adding a recruiter portal. Connect reminder/calendar views by stable application ID if required. Treat existing migration defaults as defaults, not inferred true history.

**Acceptance:** category filtering, history clearing with [], nullable fields per schema, malformed history, future interviews, offer serialization, ownership and correct internship-only counts.

### F12 — Career Hub: Placement Tracker

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Company List | PLACEMENT applications with company fields | No independent placement opportunity/company catalog |
| Eligibility Status | Manual UNKNOWN/ELIGIBLE/NOT_ELIGIBLE | No rules based on marks/skills or external screening |
| Placement Progress | Current application status | Not a full institution-wide placement campaign workflow |
| Interview History | Validated bounded JSON entries | Not normalized immutable event records |

**Current workflow:** same owner-scoped JobApplication service with PLACEMENT discriminator, fixed placement list route, manual eligibility and history updates. Separate internship and placement route filters preserve category distinction.

**Gap instructions:** confirm the initial “company list” means a student's tracked placements. If institution-published opportunities are required, present that specific difference before adding models; do not pretend it already exists. Label manual eligibility and heuristic readiness separately. Reuse common application components while preserving category filters; do not duplicate services that drift.

**Acceptance:** placement list excludes internships; no payload/query bypass of fixed category filtering; unknown eligibility visible; history persists; cross-user mutation denied; category changes have documented analytics effect.

### F13 — Productivity Hub: Task Manager

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Personal Tasks | Student-owned Task CRUD | No separate personal category enum |
| Academic Tasks | Optional owned studyPlanId | No direct assignment/subject relation; academic meaning is by plan/context |
| Priority Management | LOW/MEDIUM/HIGH | Defaults and sorting UI remain |
| Completion Tracking | TODO/IN_PROGRESS/DONE | No completedAt timestamp or immutable completion event |

**Current workflow:** create task, optionally verify/link owned StudyPlan; edit metadata/status; list all or upcoming; delete task. Task completion does not update StudyPlan progress automatically. Deleting the plan sets studyPlanId null and preserves the task.

**Gap instructions:** define whether academic tasks need richer associations; do not duplicate Assignment as Task automatically. Add explicit clearing of optional studyPlanId/dueDate if the UI must support it—current schemas reject null despite some service branches accepting it. If accurate productivity dates are required, add completedAt with defined reopen/re-complete behavior and a conservative legacy-data strategy. Do not backfill precise completion dates from updatedAt as if they were known facts.

**Acceptance:** own-plan link/foreign-plan rejection; unlinked tasks; optional clearing; state transitions; completing then editing does not shift historical completion once corrected; deletion leaves unrelated plan/tasks intact.

### F14 — Productivity Hub: Reminder System

| Requested subfunction | Existing behavior | Remaining work |
|---|---|---|
| Assignment Reminders | Generic Reminder title/description/triggerAt can be entered manually | No assignment reference, automatic scheduling or delivery |
| Exam Alerts | Manual generic reminder possible | No CalendarEvent-to-alert pipeline |
| Interview Reminders | Manual generic reminder possible | No JobApplication-to-alert pipeline |
| Certification Renewal Alerts | Expiring-certifications lookup identifies dates | No dispatch into Notification/email/browser |

**Current workflow:** create/list/update/delete Reminder, mark isCompleted. Notification is a separate schema model with triggerTime/isRead; no runtime inbox/dispatcher was found. Stored due times are not delivered alerts.

**Gap instructions:** this is a V1 workflow gap requiring an explicit implementation/acceptance decision. Specify delivery channel first: in-app inbox at minimum if agreed; email only if required. Reuse Notification as the recipient-visible item and give scheduled work stable source identity, occurrence time and deduplication identity. On source reschedule/cancel/delete, cancel or replace pending work; retries must not duplicate delivery. Support preferences/timezone, missed execution after restart, and bounded batch processing. Do not run per-request timers as a durable scheduler or let ordinary reminder deletion remove another user's notification.

**Acceptance:** all four source types create the correct scoped alert; due alert appears once; no premature alert; restart/retry duplicates suppressed; edited date cancels old occurrence; deleted source cancels pending work; preference opt-out honored; provider failure retry visible; unrelated reminders preserved. A developer must implement these tests after the channel design, not claim current CRUD tests cover delivery.

### F15 — AI Intelligence Hub: AI Resume Review

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Resume Analysis | Analyze owned builder resume's selected version via provider | Uploaded profile PDF is not parsed as builder content |
| Resume Quality Assessment | atsScore in 0–100 returned and saved on version | LLM assessment, not certified ATS performance |
| Improvement Suggestions | Strengths/weaknesses/improvementFeedback returned | Only atsScore and improvementFeedback persist on the analyzed version |
| Skill Gap Detection | missingSkills array returned | No automatic Skill creation and no calibrated job-specific gap assessment |

**Current workflow:** create AIExecutionLog RUNNING → verify resume ownership and select latest version → call provider → validate output → update selected version score/feedback → mark log SUCCESS → return full response. Failure records FAILED and mapped error. A concurrent edit creates a newer version; response should remain clearly associated with the older version actually reviewed.

**Gap instructions:** include analyzed version identity in the client contract if needed to avoid attaching feedback to current content incorrectly. Decide whether full structured analysis must be recoverable after reload; persisting it requires a documented field/entity change, not fake reconstruction from feedback text. Clarify “missing skills” is a suggestion. Review output-size bounds, request budget, and log sanitization. A DB failure after provider success needs consistent reporting/retry behavior.

**Acceptance:** foreign resume rejected; no-version case; malformed output rejected; score bounds; version edited during review; response/persisted feedback agree; live provider evidence; no automatic modification of resume content/skills.

### F16 — AI Intelligence Hub: AI Study Planner

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Personalised Timetable | Input topic/target/goals, own subject context and cached attendance, weeklySchedule output | No actual availability/time-of-day constraints or calendar conflict solving |
| Revision Planning | revisionPlan array | Recommendation only |
| Topic Prioritisation | topicPriorities with HIGH/MEDIUM/LOW and reasons | Recommendation only |
| Goal Recommendations | goalRecommendations array | Does not automatically update stored goals |

**Current workflow:** log start → read StudentAnalytics cache and owned subjects → call mock/Gemini → validate expanded schema → mark success → return plan. No StudyPlan, Task or CalendarEvent is created. Cached attendance may be stale until dashboard computation refreshes it.

**Gap instructions:** make cache freshness explicit or compute fresh source metrics before personalization. Add accept/edit/save workflow through F04 with user confirmation of generated content. Do not call a list of weekday durations a conflict-free timetable. Existing new arrays have useful bounds, but original title/recommendedTargetDate/overview/task fields are loosely validated; strengthen semantic dates/nonempty/bounds where the client needs them. Do not introduce a recommendation-engine module.

**Acceptance:** input ownership and context isolation; stale-cache behavior; invalid/empty/provider outputs; dates match contract; generated proposal changes no DB plans until accepted; accept once persists expected objects and retry cannot duplicate them; live quality review.

### F17 — AI Intelligence Hub: AI Notes Assistant

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Notes Summarisation | Summary and keyPoints response | Text content required; not attachment extraction |
| Key Point Extraction | Structured points with importance | Response not automatically stored as note content |
| Question Generation | Question/answer/difficulty arrays | No quiz-attempt history or scoring system |
| Flashcard Generation | Front/back arrays | No persistent deck/revision scheduler |

**Current workflow:** authorized student and AI-enabled setting → execution log → owned Note with nonempty textual content → provider operation → Zod output validation → execution status → response. AI output is returned, not saved as a separate artifact or conversation history.

**Gap instructions:** present generated aids without overwriting source notes. If V1 requires saving results, define explicit user action and minimal storage rather than assuming AIExecutionLog holds output. Validate nonempty arrays/strings and payload bounds where required—current schemas allow empty arrays for several operations. Avoid logging raw content or provider credentials. Attachment-only notes must display the existing clear unsupported message.

**Acceptance:** all four operations, wrong owner, empty/attachment-only note, AI disabled, malformed output, bounded timeout, repeated request/log behavior, live content usefulness; generated aids must not silently mutate original text.

### F18 — Analytics Hub: Academic Analytics

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Study Progress | Average stored progressPercentage and completed-plan rate | Progress is manual, not derived from daily goal events |
| Attendance Percentage | Subject totals with fallback to records when appropriate | Preserve manual/record and EXCUSED policies |
| Assignment Completion Rate | Current SUBMITTED/GRADED divided by total | Not a grade or historical completion timestamp |
| Subject Performance | Per-subject attendance and assignment breakdown | No inferred marks from targetGrade |

**Current workflow:** owner-scoped queries derive metrics; dashboard also upserts selected StudentAnalytics fields. Admin academic reports add cohort/date filtering with distinct explicit date semantics.

**Gap instructions:** choose one canonical formula per metric and reuse it across dashboard, subject screens and reports where date scopes match. Do not trust the cached StudentAnalytics row as the source of all career/academic metrics; only selected fields are updated by dashboard. Explain empty denominators and data exclusions. Avoid claiming manual plan progress reflects completed tasks.

**Acceptance:** known counts, empty user, manual versus records, unequal class counts across subjects (weighted aggregate), status changes, cross-user isolation, report date window boundaries, source edit followed by refreshed metric.

### F19 — Analytics Hub: Career Analytics

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Resume Completion | Five-section content-presence percentage | Not resume quality; uploaded PDF alone does not populate sections |
| Skills Progress | Category counts and current average proficiency | Current snapshot, no longitudinal proficiency history |
| Internship Application Statistics | INTERNSHIP-only status/offer aggregates | Current states, not event funnel conversion history |
| Placement Readiness | Weighted heuristic from skills/resume ATS/applications/certifications/projects | Not an eligibility or employment probability |

**Current workflow:** query student's corresponding entities and calculate. Completion selects active/latest deterministically; readiness currently uses first resume from an unordered parent query, so multiple resumes can disagree.

**Gap instructions:** align selected-resume semantics and version tie-breakers; document weights and saturation. Decide whether “skills progress” requires a time trend or current progress indicator; a time trend requires recorded historical observations. Do not fabricate an improvement curve from current proficiency. Keep manual eligibility separate from readiness score.

**Acceptance:** multiple resumes/active flags, incomplete placeholder sections, category/proficiency boundaries, internship/placement exclusion, weighted known-value heuristic and empty account, no stale version score mistaken for new content.

### F20 — Analytics Hub: Productivity Analytics

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Daily Productivity | Activity breakdown for selected date range | Task DONE rows counted by updatedAt |
| Weekly Activity | Existing activity endpoint and time range controls | Not complete event history across every entity |
| Task Completion Rate | Current DONE / total | Does not express on-time completion |
| Goal Achievement | COMPLETED StudyPlans / all plans | Plans counted, not individual daily goals |

**Current workflow:** reads tasks/plans and selected activity sources, returns aggregates; no event-sourced productivity ledger. Changing a completed task's title can change its apparent activity date.

**Gap instructions:** add completedAt only if accurate completion windows are accepted as a V1 requirement; define reopening and re-completion. Preserve unknown history in old rows instead of inventing past dates. Align date boundaries/timezone across frontend and reports. Rename labels if using current-state proportions rather than historical events.

**Acceptance:** completion then metadata edit, reopening, cross-midnight dates, empty denominator, day/week boundary, independent user data; confirm goal labels refer to plans unless a daily-goal model is introduced.

### F21 — Analytics Hub: Visual Dashboard

| Requested subfunction | Existing behavior | Remaining work |
|---|---|---|
| Charts | Backend metrics available | Product chart components absent |
| Graphs | Some trend/breakdown data available | Graphs absent; don't fabricate historical series |
| Progress Indicators | Completion/progress metrics available | Accessible indicators and explanatory labels absent |
| Performance Reports | Student analytics and admin JSON reports | Role-appropriate report screens absent; downloadable report files not established |

**Current workflow:** backend returns JSON; starter frontend does not render the product. This feature is **frontend absent**, not a reason to rewrite backend formulas.

**Gap instructions:** build typed adapters and reusable accessible chart components after contract closure. Use real endpoint data with loading/error/empty states and text/table alternatives. Role-scope the screen and data source. Define export explicitly if required; JSON report APIs do not imply PDF/CSV export. Keep report meanings from sections 7.6 and F18–F20.

**Acceptance:** known fixtures displayed accurately, labels/denominators/tooltips, no NaN/Infinity, responsive keyboard-accessible navigation, chart/table agree, user cannot view admin reports, unavailable API produces an honest error rather than dummy numbers.

### F22 — Administration Portal: User Management

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Student Accounts | Student listing; registration; baseline helper; admin enrollment | No blanket hard-delete user API established by this audit |
| Administrator Accounts | Admin list/create and profiles | Authentication/permissions require runtime review |
| Role Management | Promotion/demotion, audit, self-role guard, last-admin guard | Historical profiles can coexist; permissionsLevel is not proven fine-grained authorization |
| Account Status | Activate/deactivate, audit, self/last-admin guards | Native concurrent last-admin operations need targeted testing |

**Current workflow:** admin-authorized route → validated input → transactional status/role/profile changes plus audit. Promotion may retain StudentProfile while adding AdminProfile; demotion ensures student baseline. Deactivation increments authVersion; live authentication reads current user role/status. Current student data is retained on role change rather than deleted.

**Gap instructions:** never delete historical student work just because a user becomes admin. Clarify that “one role” does not mean only one profile row can ever exist. Check last-admin invariant under two concurrent changes; a count in separate transactions may need serialization. Explicitly decide if role changes should revoke sessions or rely on live role checking. Do not grant extra authority based on profile presence or permissionsLevel unless enforced server-side.

**Acceptance:** student blocked from admin API, safe admin creation, cannot demote/deactivate self where guarded, final active admin retained under concurrency, role changes preserve domain data, revocation behavior, atomic audit rollback and enrollment constraints.

### F23 — Administration Portal: Academic Management

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Departments | Catalog CRUD, unique name/code, guarded course dependencies | Content-scope deletion consequences need review |
| Courses | Department association, duration/semester counts, references/deletion guards | Course changes affect current enrollment report/content scope |
| Subjects | MasterSubject catalog plus optional personal Subject links | Master and personal subjects are distinct entities |
| Semester Configuration | Institutional AcademicTerm CRUD/active state and personal semester linkage | Does not automatically create every student's semesters |

**Current workflow:** admin creates Department → Course → MasterSubject and AcademicTerm; enrolls student through user management; student creates personal Semester/Subject and optionally links catalogs. Shared/exclusive locks/CAS protect newly completed linkage paths. Admin deletes are restricted according to service/DB guards; some nullable content references use SetNull.

**Gap instructions:** review all affected references before deleting or moving catalogs, including content audiences. A course/department deletion must not turn targeted resources into global resources. The resource feed treats both scope IDs null as global, and current schema sets nullable catalog refs null on delete: this is a concrete risk requiring a regression and policy. Preserve catalog browsing separately from linking permissions; `/catalog/subjects` is a broader authenticated catalog while `/subjects/syllabus` is enrollment-scoped, not an authorization contradiction by itself.

**Acceptance:** full catalog→enrollment→link journey; invalid course semester count; missing/cross-course references; historical inactive links; blocked moves/deletes; concurrent link/delete; resource audience never widens silently on catalog deletion.

### F24 — Administration Portal: Content Management

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Announcements | Announcement rows, publishing/expiry and target scopes | UI absent; publication versus count semantics need care |
| Notices | Announcement type NOTICE | Same lifecycle, not a separate entity |
| Events | InstitutionalEvent with category, publication and scope | Separate from personal CalendarEvent |
| Resources | AcademicResource metadata/fileUrl and scoped read feed | Not the same private-upload pipeline as student Note files |

**Current workflow:** admin validates scope, writes/audits content; announcement feed requires published, publishedAt reached, unexpired and ALL/current department/current course audience. Event feed uses publication/scope and optional upcoming filter. Resources use null/current department/current course scope and return stored URLs; no resource publication flag exists in the inspected model.

**Gap instructions:** validate feed queries explicitly; current direct enum casts/coercions deserve invalid-query tests rather than assumed safety. Define resource URL trust, privacy and lifecycle independently from private notes. Before deleting a course/department, preserve intended audience through restriction/archive/reassignment, never accidental SetNull-to-global publication. Verify admin counts are not labeled “currently visible” unless expiry/time filters match the actual feed.

**Acceptance:** draft/future/expired announcement hidden, intended student sees correct scoped item, unenrolled only global content, publication toggles, event date boundary, invalid filters return controlled errors, resource scope on catalog deletion, no unauthorized content edit.

### F25 — Administration Portal: Platform Management

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| Dashboard Statistics | Counts across users/catalog/career/AI/content/feedback | Operational totals, not complete observability or consistent snapshot |
| Activity Logs | AdminAuditLog listing/filtering | Not every student action or full infrastructure logs |
| Feedback Management | Student submit; admin list/detail/update status/notes/resolver | Student own-feedback follow-up list is absent from inspected feedback routes |
| System Configuration | Allowlisted SystemSetting writes and gates for registration/AI/maintenance | Admin permissionsLevel field does not establish per-setting permission rules |

**Current workflow:** student submits Feedback PENDING; admin reviews/changes status with audit and resolver metadata. Settings are seeded/queried and applied by runtime gates. Admin dashboard counts entities; audit records actions. User rows referenced by authors/audit/settings can be protected by Restrict relations.

**Gap instructions:** determine whether students need to see feedback resolution; add owner-scoped read endpoint if accepted, not admin note leakage. Test maintenance-mode bypass and auth against current role/session. Document defaults when settings missing, and ensure fallback does not unexpectedly enable a disabled safety control. Define operational logs separately from audit trail; avoid secret-bearing raw request/AI content in either.

**Acceptance:** feedback status transitions/resolver fields, foreign student denial, admin audit atomically matches mutation, supported/unsupported settings, registration and AI gates act immediately, maintenance behavior and last-admin access, honest dashboard counts.

### F26 — Administration Portal: Reporting

| Requested subfunction | Existing behavior | Remaining qualification |
|---|---|---|
| User Reports | `/admin/reports/users`: cohort/date totals and registrations | Current enrollment, not historical membership |
| Academic Reports | `/admin/reports/academics`: attendance/assignments/subjects | Date basis and manual-total exclusion are explicit |
| Usage Analytics | `/admin/reports/usage`: AI execution and career activity | Not browser clickstream or full product usage instrumentation |
| Platform Health Reports | `/admin/reports/health`: process uptime, SELECT 1 latency, memory/runtime | Not Supabase storage/email/Gemini availability or a historical uptime SLA |

**Current workflow:** ADMIN gate → report query validation → consistent catalog/date filters → aggregate current entities → JSON response. Health catches database probe failure and labels report DEGRADED; authentication itself depends on DB, so an authenticated health report may be unreachable during a full DB outage. The separate public health endpoint has its own 503 behavior.

**Gap instructions:** preserve repaired filters/UTC grouping; document snapshot/nonhistorical limits. UI must not label career createdAt buckets as application appliedDate events. Add operational provider probes only with bounded cost and purpose, not on every public health request. Keep detailed memory/runtime telemetry admin-only. PDF/CSV exports are a separate explicit feature, not implied by “reports.”

**Acceptance:** empty and mixed cohorts, valid/invalid cross-filters, exact date boundaries, non-UTC runtime, manual attendance exclusion metadata, admin/student separation, DB outage response contract, counts match known fixtures; no false all-provider health claim.

## 20. Entity-by-entity lifecycle and correctness obligations

There are **34 Prisma models** at this snapshot. Every model is accounted for below. Relationships are schema-backed, but lifecycle APIs do not exist for every model. Deletion descriptions explain database behavior; they do not authorize deleting real data. Hard deletion of a User can also be blocked by restrictive author/audit/settings references, despite cascades on owned student data.

| Entity | Creation and read workflow | Update / deletion behavior | Obligation for successor |
|---|---|---|---|
| User | Register creates STUDENT; admin creation supplies ADMIN; auth reads credentials/live state | Role/status changes audited; password reset revokes sessions; hard deletion not a general advertised API | Never use profile presence instead of current role; preserve last-admin and audit-reference restrictions |
| StudentProfile | Baseline helper on registration/demotion; unique userId; read through profile | Self edits allowed fields; admin controls course; child domain records cascade on deletion; resume file triggers cleanup | Preserve historical student work across role changes; scope every child journey through this ID |
| AdminProfile | Admin creation/promotion; tied uniquely to User | Role changes can retain it; department reference SetNull | permissionsLevel is metadata unless enforced; do not infer permissions from stale profile |
| StudentSettings | Baseline creates it with defaultSemesterId; profile read includes preferences | User delete cascades; semester deletion nulls default; no complete write API found | If adding preference/default writes, validate owned semester, typed preferences and null behavior |
| Notification | Model contains user, title/message/type, triggerTime and isRead | User cascade; no inbox/dispatch runtime found | Implement recipient-scoped creation/read/read-state and deduplication only after delivery design |
| Department | Admin catalog CRUD; authenticated catalog read | Course Restrict; other nullable references can SetNull | Prevent targeted resources becoming global on deletion; audit and inspect dependencies |
| Course | Admin creates under Department; catalog exposes metadata | Master subjects Restrict; student/content refs vary; service blocks student/master dependents | Coordinate enrollment/catalog changes; review all content audience side effects |
| MasterSubject | Admin syllabus catalog under Course; general catalog and scoped syllabus reads | Unique course/code; referenced move/delete guarded; personal Subject ref schema SetNull | Keep linkage authorization distinct from broad catalog browsing; preserve existing personal subjects |
| AcademicTerm | Admin creates dates/type/year/active; student active lookup or general catalog | Personal semester links; service deletion/reference guard; schema SetNull | Preserve inactive historical links; validate merged dates and concurrent references |
| Semester | Baseline creates default 'Semester 1' with roughly four-month dates, or student creates; owned reads | Personal edits/link CAS; child Subject cascade; default setting SetNull | Default baseline is a placeholder, not institutional enrollment or accurate term auto-configuration |
| Subject | Student creates under owned Semester, optionally links syllabus | Attendance-consistent updates; Assignment/Note/AttendanceRecord cascade | Preserve totals, ownership and master-link guards; file cascade cleanup must survive deletion |
| Assignment | Student creates under Subject; own list/detail | Manual status/priority/due date; Subject cascade | Deadline changes are not currently propagated; future linked alerts must cancel/recompute |
| Note | Student creates text/tags/legacy URL under Subject; file upload separate | CAS attachment; owned CRUD; detach/delete trigger cleanup | Add actual search, preserve private file rules, distinguish text/URL/upload and provider provenance |
| StudyPlan | Student CRUD or future explicit AI acceptance; owner reads | Manual progress/status; deletion leaves Task rows with null link | Define schedule/goal/progress semantics; no automatic AI persistence or progress rollup assumed |
| AttendanceRecord | Owned-subject record write; reads/reporting | Transactional create/update/delete plus counter recalc; Subject cascade | Keep rollback atomic and counting policy consistent; no generic daily uniqueness assumption |
| CalendarEvent | Student manually records class/exam/holiday/college event | Own edit/delete; profile cascade | Add merged date-range guard; no implicit link to assignment/application/institution event |
| Announcement | Admin writes type ANNOUNCEMENT/NOTICE, audience and publication fields | Publish/unpublish/expiry affects read feed; author Restrict; scope nullable | Keep audience/visibility invariant through catalog changes and publication transitions |
| InstitutionalEvent | Admin writes date/category/audience/publication; scoped feed | Edit/delete; author Restrict; scope nullable | Do not duplicate as personal event without source identity; validate scope and ranges |
| AcademicResource | Admin stores title/URL/type/category/scope; scoped feed | CRUD; author Restrict; course/department SetNull | No private-storage ownership assumed; **null scope means global in feed**, so deletion needs protection |
| Feedback | Student submit PENDING; admin list/detail | Admin status/notes/resolver with audit; profile cascade, resolver SetNull | Decide own-student follow-up read; don't expose internal adminNotes accidentally |
| AdminAuditLog | Service creates alongside selected admin mutations; admin reads | No ordinary editing flow; actor Restrict | Keep atomic mutation/audit, preserve actor and before/after intent, define retention separately |
| SystemSetting | Seed/admin allowed keys; runtime gates read | Audited update, editor User Restrict | Validate value/key and defaults; do not turn malformed values into permissive settings silently |
| Task | Student creates personal or owned-plan task; all/upcoming reads | Manual status/priority; plan delete SetNull; profile cascade | Add explicit clearing/accurate completion time only with defined semantics and tests |
| Reminder | Student CRUD with triggerAt/isCompleted | Independent of source due dates; profile cascade | isCompleted is not isDelivered; add durable linkage/dispatch instead of claiming alerts exist |
| StudentAnalytics | Baseline creates cache; dashboard derives and upserts selected fields | Profile cascade; no student manual editing | Cache freshness explicit; averageAtsScore is not shown to be refreshed by dashboard's upsert |
| Resume | Student creates parent with version, title/active flag; owned reads | Content/template writes add version; deletion cascades versions | Clarify active uniqueness and selection; uploaded profile PDF is separate |
| ResumeVersion | Nested create from resume edit; latest/all versions read | AI can update atsScore/reviewFeedback; content edits create new row | Tie review to exact version; timestamps need deterministic tie-breakers; no hidden overwrite of content |
| Skill | Student records name/category/proficiency; analytics reads | Owned CRUD; profile cascade | Self-report label; no automatic sync to resume content or historical skill progression |
| JobApplication | Student creates INTERNSHIP/PLACEMENT record; filtered reads | Manual eligibility/status/interview/history/offer edits; profile cascade | Preserve category defaults and scope; future reminders need stable source relationship |
| Certification | Student records issuer/obtained/expiry/credential; expiring read | Owned edits/delete; profile cascade | Expiry read is not renewal notification; define ranges, no-expiry and lead-time policy |
| Project | Student records technologies/URLs/start/end/ongoing | Owned CRUD; profile cascade | Validate partial dates/ongoing semantics and explicitly copy to resume only if desired |
| AIExecutionLog | AI service creates RUNNING, then SUCCESS/FAILED | completedAt/errorMessage updated; profile cascade | Metadata log, not stored AI output/history; avoid secret errors; handle abandoned RUNNING executions |
| AuthSession | Login creates ID/hashed refresh/expiry; authentication and refresh read | Conditional refresh rotation; logout/reset delete; User cascade | Deny expired/revoked access; define retention and concurrency; raw token never stored |
| StorageCleanup | Triggers/compensation record detached object and provider | Retry increments attempts; successful delete removes job; retained after owner deletion | Protect referenced objects; schedule bounded retry; investigate unknown provider and orphan inventory |

### 20.1 Four distinctions the next AI must retain

1. **Role versus profile:** User.role is singular, but StudentProfile and AdminProfile can coexist after role changes. The old conceptual “one or the other” description is not the current lifecycle invariant. Preserving both may protect historical work.
2. **Catalog versus personal data:** Course/MasterSubject/AcademicTerm are institution-managed references; Semester/Subject are student-owned working records. Linking does not copy, overwrite or transfer ownership.
3. **Reminder versus notification:** Reminder stores user planning intent; Notification could store a recipient-visible alert. No current dispatcher connects them.
4. **Cache/log versus source/output:** StudentAnalytics is derived/cache data; AIExecutionLog records execution metadata. Neither implies a full historical event ledger or persisted generated plan/flashcard deck.

## 21. Integrated workflows: original intent, current connections, missing connections

### 21.1 Student onboarding to academic work

```mermaid
flowchart TD
    Register["Register student"] --> Baseline["Profile, default semester, settings and analytics"]
    Register --> Verify["Verification email and token flow"]
    Admin["Admin assigns course"] --> Profile["Current enrollment"]
    Baseline --> Profile
    Profile --> Choose["Student selects term and syllabus"]
    Choose --> Personal["Owned semester and subjects"]
    Personal --> Work["Assignments, notes and attendance"]
```

**Works now:** baseline provisioning, course enrollment, active-term selection and scoped syllabus linkage are implemented. **Not automatic:** registration does not infer college course, create the full syllabus, or select the true academic term. The default semester is a placeholder. UI onboarding should ask the student to review it and show enrollment status; no hidden deletion of the default semester if it already contains work.

**Repair sequence:** verify source selection and backend errors; implement onboarding UI using existing APIs; if bulk syllabus import is wanted, propose an explicit idempotent operation with preview instead of repeatedly creating duplicates. Test role change and interrupted onboarding recovery.

### 21.2 Deadline to calendar to reminder

```mermaid
flowchart TD
    Sources["Assignment, exam, interview or certification date"] --> Existing["Stored in its domain record"]
    Existing --> Projection["Proposed calendar projection"]
    Existing --> Schedule["Proposed linked reminder scheduling"]
    Schedule --> Delivery["Proposed deduplicated delivery"]
    Delivery --> Inbox["Proposed notification inbox"]
    Existing --> Changes["Source rescheduled or removed"]
    Changes --> Projection
    Changes --> Schedule
```

The projection/scheduling/delivery/inbox nodes are **proposed missing integration**, not implemented behavior. Existing independent CalendarEvent and Reminder CRUD can support manual planning but do not establish this chain.

**Required decisions:** alert channel, timezone, lead time, preferences, cancellation, source identity and retry semantics. Build one complete assignment-reminder vertical slice first, then extend the same pattern to exams/interviews/renewal. Keep late/missed alerts distinguishable from on-time delivery. Source deletion must not leave a misleading future alert.

### 21.3 AI recommendation to saved study work

Current: topic/goals + own subject context + cached analytics → provider → validated proposal → response. Missing if a persistent planner is promised: review/edit → accept → saved plan/tasks/sessions → progress feedback. The frontend must not claim success after generating a proposal when the student expects it to survive reload.

**Implementation direction:** use existing StudyPlan/Task when they can represent the accepted outcome; otherwise approve a minimal session representation. Save the accepted logical unit atomically or provide an explicit recoverable multi-step state. Introduce an idempotency mechanism if retries can create duplicates. Keep rejection/cancellation free of unintended persisted tasks. Do not auto-run AI from every dashboard render.

### 21.4 Profile and career evidence to resume and readiness

Current: Profile, Skill, Certification and Project are separate from ResumeVersion JSON. User manually supplies builder content; AI analyzes one version and persists score/feedback; readiness reads current career data. Uploaded profile PDF is an independent file.

**Missing/decision:** a convenient “use my profile/skills/projects” action may be desirable, but no implicit synchronization exists. Prefer a previewed one-time import into a **new** ResumeVersion. Track source fields without overwriting personalized resume wording. Ensure metrics select the same intended resume/version and explain stale AI review after content edits.

### 21.5 Admin content and student visibility

Current: admin writes scoped content → feed derives student's current enrollment → publication/time/scope predicate → response. This chain is implemented, unlike reminder delivery. Enrollment changes can intentionally change future feed visibility; historical membership is not recorded.

**Gap to repair:** nullable catalog references can change resource audience on catalog deletion. Ensure explicit archive/reassign/restrict behavior. Also clarify that broad authenticated catalog browsing exposes institutional catalog data, while personal record access remains owner-scoped. Do not over-restrict public-to-institution catalog data merely to mimic personal ownership, or relax personal links based on catalog visibility.

### 21.6 Delete user work to delete files

Current: authorized deletion of Note/Subject/Semester or a controlled profile cascade → database deletes and transactional cleanup jobs → immediate best effort where implemented → explicit retry for queued provider. Missing operational pieces: scheduled worker, unknown-provider handling, crash-before-attachment reconciliation, full provider identity and live tests.

A normal student API cannot necessarily hard-delete User just because the schema cascades student children. Authored admin content/audit/settings can restrict deletion. Establish actor-history retention before creating such an endpoint. Any new bulk-delete API must be reviewed for all 34 entity effects, not only the academic hierarchy.

### 21.7 Dashboard to AI personalization: cache freshness

Current dashboard calculation writes attendance/task cache, while study-plan AI reads that cache. A student can change attendance and request AI without opening the dashboard, leaving cached input stale. This is a source-based workflow concern, not a measured provider failure.

**Repair options:** compute fresh source values when forming AI context; or establish cache invalidation/version/freshness metadata with documented refresh policy. Prefer the smallest reliable approach for V1. Test attendance edit → AI request without dashboard → correct context. Do not force users to visit a screen to make backend data correct.

## 22. Additional gap register and precise implementation instructions

These findings supplement B01–B14; they do not erase earlier gates. **Observed** means source behavior was read. **Candidate risk** means a problematic scenario is supported by code reasoning but has not been reproduced in this addendum. No new runtime test pass is claimed.

| ID | Finding and evidence status | Required action and focused test | Priority / scope |
|---|---|---|---|
| W01 | **Observed:** no title/content note search in controller/service | Validated bounded search + tag/subject conjunction inside ownership scope; cross-student matching fixture must remain invisible | V1 functional gap |
| W02 | **Observed:** manual planner progress and free-text goals; no persisted weekly sessions | Decide minimal schedule/daily-goal contract; implement accepted persistence/progress rules; reload/complete/reopen/retry tests | V1 workflow decision |
| W03 | **Observed:** reminders CRUD has no alert delivery pipeline | Choose channel and implement linked, durable, deduplicated scheduling/cancellation; all four promised source journeys | V1 functional gap |
| W04 | **Observed:** personal calendar does not validate merged start/end ordering | Add create and partial PATCH range validation; backwards range returns 400 with no mutation | Correctness fix |
| W05 | **Observed:** no combined deadlines/institutional/personal calendar | Implement scoped derived projection or agreed equivalent; source update/delete reflected once | V1 integration gap |
| W06 | **Observed:** task optional UUID/date fields reject null; service has clearing-oriented branches | Decide documented clear semantics; align schema/types/service, preserve ownership, add unlink/date-clear tests | Form/API contract gap |
| W07 | **Observed:** task activity uses updatedAt; daily boundary uses server-local midnight, weekly default is trailing seven days | Decide reporting timezone/calendar versus rolling week; add completedAt only if needed with honest legacy data; midnight/edit/reopen tests | Reporting correctness/label decision |
| W08 | **Observed:** readiness parent resume selection unordered; latest version ordering differs across services | Shared deterministic selector or documented intentional distinction; multiple active/tied timestamp fixtures | Correctness improvement |
| W09 | **Observed:** AI reads analytics cache refreshed by dashboard | Fresh calculation or explicit invalidation; edit attendance then generate without dashboard | Cross-module correctness |
| W10 | **Observed:** resend verification exists; email messages contain raw token/API text; verify uses read-then-update | Browser journey and resend throttle/outage tests; reproduce verify/resend race and conditionally consume token | Security/recovery review |
| W11 | **Observed source; candidate exposure:** resource course/department refs SetNull on deletion and both-null feed means global | Reproduce deletion of a catalog with targeted resource but no guarded student/master dependents; restrict/archive/reassign without audience widening | Potential high-priority confidentiality defect; investigate before release |
| W12 | **Observed:** notes/resume retrieval chooses current configured provider rather than recorded provider | Resolve provider from record with explicit legacy policy and namespace; old files remain retrievable after planned switch; cleanup uses original provider | Storage correctness gate if changing provider |
| W13 | **Observed:** Supabase upload/signed URL errors include provider text; generic CFB accepted for notes | Sanitize exposed detail; real-format and renamed CFB negative fixtures; define file validation guarantee | Security hardening |
| W14 | **Candidate race:** last-active-admin guards count other admins without established global serialization | Native two-admin concurrent deactivate/demote test; serialize invariant if violation reproduces | High-impact access continuity |
| W15 | **Observed:** catalog/content feed queries cast enums/coerce raw query values without route Zod parsing | Add route-specific schemas/pagination/bounds; arrays/invalid enum/NaN inputs produce controlled 400 | API robustness |
| W16 | **Observed:** AI full results not generally persisted; resume stores only score and feedback | Define recoverability required by feature; explicit save or full structured result schema, not reconstructing missing data | V1 UX/persistence decision |
| W17 | **Observed:** student feedback submit exists but no own-list/read route found | Add only if student resolution follow-up is accepted; owner-only projection excludes internal notes | Workflow improvement |
| W18 | **Observed:** authentication catches non-ApiError failures as invalid-token 401 | Distinguish DB outage from invalid credentials without leaking internals; DB-down request should not trigger misleading client refresh/logout loops | Failure-contract review |
| W19 | **Observed:** settings/default-semester model but no complete user write path | Define minimal preferences/default selection; ownership validation and deleted-semester fallback | Supporting UX gap |
| W20 | **Observed:** admin content counts can use different visibility predicates from feeds | Label counts as stored/published/currently visible correctly or align predicates; future/expired fixtures | Honest reporting |

### 22.1 Priority order for these additions

1. Preserve source and finish B01 native verification. Addendum writing is not a reason to discard the earlier Windows test evidence.
2. Investigate confidentiality/access-continuity candidates W11/W14 and existing storage/security gates with small controlled reproductions. A candidate is not a proven incident; a passing unrelated suite does not clear it.
3. Repair direct contract defects W04/W06/W15/W18 and add focused tests. Keep security and data-preservation semantics from original commits.
4. Confirm V1 workflow decisions W01–W05/W10/W16/W19; implement coherent vertical slices for planner, calendar and reminders, with user-approved semantics where ambiguous.
5. Repair consistency W07–W09/W12 and label choices, then run affected modules and final native baseline.
6. Complete live-provider and deployment-specific gates, integrate reviewed branches as section 13 describes, then implement frontend against accepted contracts.

This sequence is a recommendation for execution, not permission to expand architecture or create a dozen new subsystems. Consolidate related fixes where they share one invariant and can be reviewed together. Do not bundle unrelated security, UI and schema rewrites into an unreviewable patch.

### 22.2 How to implement a gap without losing the original idea

For each W/B item, write: original promised outcome → observed actual behavior → minimal missing behavior → affected entities → API/schema change → failure/concurrency behavior → acceptance test → evidence. Classify the change using section 2.3. Where existing APIs suffice, compose them; where they cannot persist a promised concept, propose the smallest compatible extension. Never silently downgrade the promise by relabeling a partial implementation complete.

Examples:

- Notes search can be a bounded owner-scoped query; it does not require a new search service.
- Calendar can derive source dates rather than clone assignments into CalendarEvent rows.
- Reminder delivery requires durable state and retries, but does not inherently require microservices.
- Resume “use my skills” should create a previewed version, not keep rewriting old resume JSON on every skill edit.
- A public catalog is not a student-owned record; use visibility policy appropriate to each entity.

### 22.3 Clarifications to the preserved earlier sections

The original document remains intact as requested. Apply these explicit refinements when interpreting it:

| Earlier broad/provisional wording | More precise finding from this addendum |
|---|---|
| Notes “text/tag/search features” | Text storage and tag filtering exist; title/content search was not implemented in the inspected query path |
| Resend verification listed as possible improvement/to confirm | Authenticated resend endpoint and service **already exist**; improve throttling, recovery and UI, not duplicate endpoint |
| Recent activity backend available | Existing activity endpoint returns task-completion/attendance aggregates; it is not a recent-action list |
| Profile is student OR admin conceptually | Role is singular; historical profiles can coexist across promotion/demotion |
| Production rate limits described collectively | Global/auth limiters are production-only; shared uploadLimiter middleware itself has no NODE_ENV guard in inspected source |
| Calendar timestamps considered supported | Timestamp parsing exists; merged date/endDate ordering guard is absent for personal CalendarEvent |
| Institutional deletion guards present | Guards exist for specific dependencies; targeted AcademicResource audience after nullable reference deletion still needs investigation |
| Readiness/AI context consistency pending | Unordered readiness resume and dashboard-refreshed AI cache are concrete source-level inconsistencies to test |

These refinements are not retroactive claims that original tests failed. They identify untested or missing behavior that broader workflow inspection surfaced.

## 23. Cross-reference against the original handoff request

This is the explicit requirement checklist for the next AI. No clause of the user's requested scope should be silently omitted. “Rationale” means the decision summary, alternatives, trade-offs and evidence needed to understand the work; it does not require a private internal reasoning transcript.

| User requested | Where addressed | How the next AI must use it |
|---|---|---|
| All changes made by the assistant | Section 6: all 17 commits; 18.1 paths; 18.2 full SHAs; full bundle | Inspect exact diffs when touching repaired behavior; do not attribute all inherited code to this assistant |
| Idea, reasons and goals behind changes | Section 6 problem/goal columns; section 7 contracts/rationale; 22.2 examples | Preserve the invariant rather than copying code without understanding |
| What remains and what should be done | B01–B14 in section 9; W01–W20 in section 22; F01–F26 gap instructions | Distinguish implementation, verification, infrastructure and product-decision work |
| Handling errors, gaps and blockers | Section 12 repair loop/severity/error guide; section 22 priorities | Reproduce, fix minimally, verify, retain evidence; no retry-until-green |
| Policies, rules and instructions | Sections 2.3, 12, 13, 14, 16 and 24 | Preserve scope, typing, ownership, safety, Git history and user authority |
| Merging branches | Section 13 staged integration/runbook | Merge actual fetched main and approved source tip; verify ancestry and combined tree |
| Possible merge conflicts and resolution | Section 13.5 conflict table and abort/recovery | Preserve both sides' legitimate functionality; no blanket ours/theirs |
| Keep branches after merge | Sections 2.3, 13.1 and 13.6 | Retain refs; no prune/delete/automatic PR head deletion |
| Project direction from now on | Sections 9–10, 15, 22.1 and 24 | Close backend gaps, integrate stable main, then build product frontend and verify deployment |
| Initial core functionality targeted | Section 2 frozen pillars; all 26 feature cards with each requested subfunction | Use exact scope as acceptance input, not a schema/model count |
| Implemented versus not implemented | Section 5 overview; section 19 detailed subfunction tables | Mark partial/absent/unverified explicitly; UI remains absent |
| Ways existing implementations could be better | Section 7 improvement notes; each F-card gap direction; section 22 | Prioritize by user outcome/risk; no architecture expansion disguised as cleanup |
| What was performed and how tested | Sections 6 and 8; first native result section 1; exact scripts in section 18 | Separate local PGlite, user-provided native and live-service evidence |
| Whether the change reached its goal | Section 6 goal/evidence column and 23.1 below | Implementation success does not imply final backend or production closure |
| Markdown and useful diagrams | Entire document with tables, source blocks and Mermaid diagrams | Read diagram labels distinguishing current versus proposed workflow |
| How backend should be closed | Sections 9–11 and 24.2 | Use explicit evidence-based gates, not confidence or milestone wording |
| Requirements for a closed backend | Section 10 plus workflow-specific tests F01–F26 | Reconcile promised workflows as well as tests/security/infrastructure |
| Entity behavior and full workflows | Section 20 all 34 models; section 21 cross-entity journeys | Follow ownership, mutations, deletion effects, outputs and missing edges |
| Instructions for correcting workflow gaps | Every feature's Gap instructions/Acceptance; sections 22 and 24 | Convert each selected gap into a reviewed implementation/test slice |
| Maximum useful continuity after subscription change | Sections 1–3, bundle/checksums, exact scripts and successor prompt | Recover from offline package; do not depend on this workspace or model remaining available |
| Avoid mistakes | Verification/backup/conflict guardrails throughout | Verify and stop on uncertainty; never promise that defects are impossible |

### 23.1 Goal outcome summary

| Goal area | Achieved in implementation? | Evidence boundary / what remains |
|---|---|---|
| Persist parsed validation and prevent cross-owner task/file access | Implemented and exercised | Final broader contract audit still needed; inherited routes vary in validation |
| Repair private local file retrieval/replacement | Implemented and exercised | Real Supabase and provider-switch/read provenance remain open |
| Add T6 classification/eligibility/history | Implemented and exercised | Manual fields, not automated eligibility/company feed |
| Add T7 canonical metrics | Implemented and exercised | Readiness selection, historical labels and frontend remain |
| Add T8 expanded AI study-plan contract | Implemented and exercised with mock/stub | Live output and accepted-plan persistence/usable scheduling remain |
| Harden production build/error/security behavior | Implemented portions build/smoke tested | T9 is not closed; new workflow findings plus final native/live gates remain |
| Revoke sessions and rotate refresh | Implemented and exercised, including native closure | Extended native races, role policy and session maintenance remain |
| Integrate email provider and outage handling | Adapter and selected recovery implemented/stub tested | Existing resend/verify refinement, browser journey and actual delivery remain |
| Durable cleanup for detached/cascaded files | Queue/triggers/retry implemented and exercised | Operational schedule, inventory, unknown provider, crash orphans and live provider remain |
| Remove known dependency findings at remediation checkpoint | Historical production audit zero after controlled overrides | Re-run current audit; advisory state can change |
| Attendance atomicity and manual/record protection | Implemented, fault-injection tests and native closure passed | Historical data inventory, full contention cases and policy review remain |
| Correct report scope/time semantics | Implemented and known-value tested | Current-membership/no-history limits and UI labels remain |
| Complete enrollment/term/syllabus write journeys | Implemented and exercised | Full cross-entity lifecycle and concurrency—including content deletion—still need review |
| Explain intermittent file reappearance | Evidence preserved and narrower reproduction performed | **Root cause not proven**; no fabricated success claim |
| Make native verification reproducible | Guarded runner implemented; first native closure passed | Corrected Windows smoke full-run success still unreported |
| Fix Windows shutdown harness | Implemented, typechecked and both paths exercised on Linux | Real Windows rerun needed |
| Deliver complete usable V1 | **Not achieved yet** | Workflow gaps, frontend and release work explicitly listed |

## 24. Explicit execution contract for the next AI

### 24.1 Start without losing or redoing work

1. Read sections 1–3 and 19–24, then the detailed contracts and relevant source. Verify the downloaded bundle/checksum and actual Git tree. Do not confuse a copied source file with an imported commit.
2. Ask for the latest native-run output only if it is not supplied. Do not assume the pending corrected run succeeded. Preserve first failure logs.
3. Inventory current laptop and remote branch changes before merging. The user may have worked after this snapshot; source at the handoff SHA is a baseline, not permission to overwrite newer work.
4. For each selected gap, retrieve its concrete source and test context, establish a small reproduction, then implement within agreed scope. Do not treat proposed gap instructions as executed patches.
5. Document outcome with sections 16.2/16.3 templates. Keep implementation status separate from validation status, UI status and production status.
6. When product semantics are ambiguous—alert channel, daily goals, active resume, EXCUSED attendance, verified-email restriction—present the concrete choice and impact to Sufiyan before changing behavior. Do not repeatedly ask for permission for already-authorized routine fixes.
7. Do not start sweeping refactors, deployments, secret rotation, destructive migrations or branch deletion under the label “handoff completion.”

### 24.2 Feature acceptance worksheet

For **each F01–F26**, the closure record must contain:

```markdown
- Feature ID and exact requested subfunctions:
- Actor and user-visible successful journey:
- Endpoint(s), schema(s), service(s), model(s):
- Input validation and ownership/role checks:
- Persistence and reload behavior:
- Updates, optional-field clearing and concurrency:
- Delete/cascade and external side effects:
- Failure, retry, cancellation and idempotency:
- Other modules affected (calendar, notifications, analytics, AI, audit):
- Implemented / partial / absent / decision-needed:
- Source-based finding versus runtime reproduction:
- Test commands and commit/tree tested:
- Positive, negative, boundary and relevant concurrency results:
- UI status and provider/deployment evidence:
- Remaining limitation, exact impact and user acceptance if applicable:
```

Do not use a single boolean “feature complete” when only one subfunction passes. Conversely, do not rebuild an existing API because its UI is absent. State exactly which layer needs work.

### 24.3 Integration acceptance cases spanning entities

Before claiming the backend supports the integrated product, demonstrate these coherent journeys in a disposable environment, using the accepted final implementation:

| Journey | Required proof |
|---|---|
| Register → verify/recover → profile → enrollment → syllabus | Baseline works; delivery/recovery semantics known; institutional scope correct; user cannot self-escalate |
| Subject → assignment → deadline calendar → reminder | Source data preserved; agreed projection/alert exists; edits/deletion propagate without duplicates |
| Subject → note file → retrieval → AI aids | Correct private bytes; text requirement explicit; source not overwritten; output persistence matches promise |
| Plan → tasks → completion → analytics | Progress/manual policy explicit; correct owner links, dates and denominators; no fake historical completion |
| Skill/project/certification → resume version → review → readiness | No silent synchronization; correct version attribution, scores and selection |
| Internship/placement → interview/offer → calendar/alert | Correct category/manual eligibility; selected interview occurrence; cancellation/reschedule works |
| Admin content → student feed → catalog change | Publication/time/audience enforced; audience never broadens by accidental null scope |
| Admin status/role → sessions → audit | Access changes immediately as designed; last admin preserved; historical domain data retained; audit atomic |
| Parent deletion → descendants → cleanup | Required relational cascades/restrictions and file queue apply; no live object deleted; retry operational |
| Dependency outage → API/UI recovery | Sanitized dependency error; no lost committed data, false success or infinite refresh/retry loop |

These cases may expose missing integration that unit/CRUD tests cannot. Implement only the accepted minimal contract, then verify the whole journey.

### 24.4 Authoritative status after this addition

- Existing engineering handoff content was retained byte-for-byte; sections 19–24 were appended.
- All 26 user-listed features and their named subfunctions now have an explicit comparison, current workflow, gap direction and acceptance criteria.
- All 34 current Prisma models have lifecycle coverage.
- Additional source risks and refinements were documented; none is represented as a newly reproduced runtime failure unless already evidenced earlier.
- Application code remains at `6a58d18`; Git bundle contents and bundle SHA-256 remain unchanged.
- The Markdown and ZIP package were refreshed together; their own file hashes changed because the document grew.
- No new native test success, main merge, GitHub push or deployment is claimed.
- Read the source again at the actual next development commit before acting; this document is a precise handoff snapshot, not a substitute for inspecting subsequent changes.

## 25. Phase 3 Reconciliation Acceptance, Phase 4 Implementation, and Final Backend Gates

### 25.1 Phase 3 Reconciliation Acceptance and Bounded Evidence Follow-ups

Phase 3 reconciliation was accepted based on evidence at checkpoint `ec68594` (and prototype checkpoint `ab3cae0`), with targeted evidence completions resolved in the subsequent checkpoint:
- **53/53 native tests passing** in `scripts/test-day1.test.ts`.
- Clean compiled production smoke check (`test-production-hardening.ts` with security headers, trust proxy, rate limiting, and clean IPC child shutdown code 0).
- Uniquely named disposable PostgreSQL database migrated, seeded, verified, and dropped without residual test state.

#### Detailed Follow-up Resolutions

1. **Interview Round Identity & Legacy Reconciliation:**
   - In `backend/src/services/jobapplication.service.ts`, `normalizeInterviewHistory` now assigns persistent one-time IDs (`randomUUID()`) to any rounds submitted without client IDs, persists them in `interviewHistory`, returns them in the API response, and preserves them on subsequent updates.
   - For applications in the database that had legacy rounds without IDs, any update automatically backfills them with stable IDs.
   - Legacy reminders with array-position keys (`round-${index}`) are reconciled in-place to `round-${round.id}` during update transactions without duplicate delivery or cancellation.
   - Reordering rounds in `interviewHistory` preserves reminder links without cancellation or recreation. Deleting a round cleanly transitions only that round's reminder to `CANCELLED`.
   - *Status in Ledger:* B06 remains open as a tracking gate for executing any required historical production database backfill prior to public deployment.
2. **AI Study Plan Acceptance Transactional Rollback:**
   - Pre-write input validation occurs strictly **before** database writes (returning 400 Bad Request on invalid payloads prior to opening the Prisma transaction).
   - Post-write transactional rollback was verified by injecting a temporary PostgreSQL trigger (`BEFORE INSERT ON "Task"`). The parent `StudyPlan` row was written, but child `Task` insertion triggered the exception, cleanly rolling back both the plan and tasks with zero orphan state.

---

### 25.2 Phase 4 Implementation: Data Consistency, Metrics, and Semantics

Phase 4 addressed six core data consistency and semantic areas:

| Area | Focus / Gap | Problem & Implementation Resolution |
|---|---|---|
| **W07** | Task completion timestamps, atomic transitions, and date boundaries | **Problem:** Using mutable `updatedAt` caused legacy task edits to alter historical completion dates, and local date boundaries created midnight overlaps.<br>**Resolution:** Added `completedAt DateTime?` to `Task` model with additive migration `20261017000000_v1_task_completed_at`. `taskService.createTask` sets `completedAt = now` if status is `DONE`. `taskService.updateTask` wraps read and write inside `prisma.$transaction`: atomically sets `completedAt = now` on TODO/IN_PROGRESS -> DONE, preserves original `completedAt` on repeated DONE requests or field edits via `existing.completedAt ?? new Date()`, and clears `completedAt = null` on reopening to TODO/IN_PROGRESS. Concurrency verified via parallel requests. `getActivityBreakdown` queries strictly by `completedAt: { gte: from, lt: to }` using UTC start-inclusive, end-exclusive boundaries. Legacy tasks with null `completedAt` are excluded from dated activity windows but retained in total task counts. |
| **W08** | Deterministic canonical résumé selection | **Problem:** Inconsistent résumé resolution across analytics and AI; non-deterministic version sorting.<br>**Resolution:** Implemented and exported `getCanonicalResume(studentProfileId, explicitResumeId?)` selector in `analytics.service.ts`. Priority: active résumé (`isActive: desc`), most recently updated (`updatedAt: desc`), stable tie-breaker (`id: asc`), with latest version ordered deterministically by `[{ createdAt: 'desc' }, { id: 'desc' }]`. If an explicit `resumeId` is requested, student ownership is verified, throwing 404 if missing or unauthorized. Applied consistently across `getResumeCompletion`, `getPlacementReadiness`, and AI `analyzeResume`. |
| **W09 & B10** | Fresh academic context for AI study planning | **Problem:** Outdated or absent student analytics cache; unweighted average of subject attendance percentages; conflation of 0% attendance with missing data.<br>**Resolution:** `aiService.generateStudyPlanRecommendation` queries fresh academic context via `analyticsService.getSubjectPerformance` and enrolled subjects in parallel. Calculates aggregate attendance from summed counts across all active subjects: `(sum(attendedClasses) / sum(totalClasses)) * 100`. Defines zero-record semantics (`hasAttendanceData: false` when `totalClasses === 0`), distinguishing "No attendance data recorded yet" from genuine 0.0% attendance. Attaches structured `contextUsed` metadata to output schema. |
| **W12** | Storage provider routing on retrieval and cleanup | **Problem:** File downloads and deletions routed through ambient `STORAGE_PROVIDER` configuration rather than the provider recorded at upload time.<br>**Resolution:** Enhanced `getStorageProvider(recordedProvider)` to route strictly to the recorded provider stored on `note.fileStorageProvider` or `studentProfile.resumeStorageProvider`. `noteService.getFileAttachment` and `userService.getResumeAttachment` return `{ fileId, provider }`. `streamNoteFile`, `streamResume`, `deleteNote`, and the transactional cleanup trigger worker all dispatch through the recorded provider. Verified in tests by switching default `STORAGE_PROVIDER = 'supabase'`: retrieval and deletion of existing `local` files succeed without misrouting. |
| **W20** | Admin platform content counts matching student visibility rules | **Problem:** Admin dashboard counted draft, future-scheduled, and expired announcements and notices as active content.<br>**Resolution:** Updated `adminPlatformService.getDashboardMetrics()` to apply complete student publication and expiry predicates. Announcements & Notices: `isPublished: true`, `publishedAt: { lte: now, not: null }`, and `OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]`. Institutional Events: `isPublished: true`. Represents globally eligible published content; boundary tests verified exact +1 delta against baseline metrics while excluding drafts, future-scheduled, and expired items. |
| **B10** | Attendance semantics and placement readiness saturation fixture | **Problem:** Unverified EXCUSED attendance denominator policy; missing reproducible test fixture for placement readiness score.<br>**Resolution:** Documented application policy: `attendedClasses / (present + late + absent + excused)`. Implemented exact reproducible 95.0-point placement readiness saturation fixture with isolated test data: 10 skills (100% saturation × 0.25 = 25 pts), canonical résumé ATS score 80 (80% × 0.25 = 20 pts), 7 job applications (100% saturation × 0.20 = 20 pts), 4 certifications (100% saturation × 0.15 = 15 pts), and 5 projects (100% saturation × 0.15 = 15 pts), summing to exactly 95.0 points. |

---

### 25.3 Native Verification Results (54/54 Passing)

The test suite was executed natively on Windows against a freshly generated disposable PostgreSQL database:
- **Test Command:** `npm.cmd run test:native --workspace backend`
- **PostgreSQL Version:** PostgreSQL 18.4 on x86_64-windows (msvc-19.44.35227, 64-bit)
- **Total Tests:** 54 passed, 0 failed (expanded with W07 row-lock concurrency, status-omitted edits, legacy completion dates, and full reduced-scope frontend workflows).
- **All 8 Stages Passed:**
  1. `PASS independent connections, row lock and rollback`
  2. `PASS migrations` (`20261017000000_v1_task_completed_at` applied cleanly)
  3. `PASS migration-status`
  4. `PASS generate` (Prisma client generated)
  5. `PASS build` (TypeScript backend compiled cleanly)
  6. `PASS test-types` (Strict test TypeScript check passed)
  7. `PASS seed` (Seed executed successfully)
  8. `PASS closure` (`scripts/test-day1.test.ts`: **54 passed, 0 failed**, duration ~13.2s)
  9. `PASS production-smoke` (`scripts/test-production-hardening.ts`: compiled server boot, headers, auth, rate limiting, and clean IPC shutdown)
  10. Disposable database dropped cleanly; `testsPassed: true`, `cleanupSucceeded: true`.

---

### 25.4 Commit Ledger for Phase 4 & Follow-ups

- `4466baa` feat(tasks): add completedAt timestamp lifecycle and atomic transitions (W07)
- `9be3644` feat(analytics): add canonical resume selection, UTC date bounds, and readiness heuristic (W07, W08, B10)
- `57ee31b` feat(ai): provide weighted fresh attendance and zero-record semantics (W09, B10)
- `5f9cdc6` feat(storage): enforce recorded storage provider routing on file retrieval and cleanup (W12)
- `25cf348` feat(admin): scope platform metrics to active published content rules (W20)
- `48ba2ed` test(closure): add Phase 4 verification and injected post-write rollback test
- `1e9db41` docs(handoff): document Phase 3 follow-ups, Phase 4 verification, and pending closure gates
- `d933791` feat(career): implement persistent interview round IDs and legacy reminder reconciliation
- `0e8f040` feat(tasks): enforce atomic transaction and timestamp preservation on task completion (W07)
- `3774367` test(closure): add provider-switch, concurrent task completion, and legacy interview reconciliation tests
- `b2187b9` docs(handoff): update gate ledger B03/B06/B08, W20 predicates, and frontend delivery bottleneck
- `e0d65fb` fix(tasks): enforce row-level lock serialization on completion and test simultaneous transitions (W07)

---

### 25.5 Authoritative Status of Remaining Backend Closure Gates

Passing 54/54 native tests establishes internal semantic consistency, API contracts, and browser client integration, but does **not** constitute complete backend closure or live-provider readiness. The authoritative remaining gates:

| Gate | Description | Status | Next Required Action |
|---|---|---|---|
| **B01** | Windows native smoke & shutdown | **CLOSED** | Verified exit code 0, clean IPC shutdown on Windows. |
| **B02** | Baseline regression manifest | **PENDING** | Port/execute 14 baseline scripts in isolated native databases. |
| **B03** | Domain concurrency verification | **PENDING** | Multi-connection stress tests for refresh token rotation, enrollment locks, attendance race conditions, catalog moves, and last-active-admin demotion. |
| **B04** | Live storage provider verification | **PENDING** | Dedicated Supabase project/private bucket upload, signed URL expiration, private access verification, and cascade cleanup. |
| **B05** | Storage lifecycle & orphan recovery | **PENDING** | Scheduled background worker and dry-run reconciliation for detached/unreferenced files. |
| **B06** | V1 workflow feature reconciliation | **PENDING (Subitem Open)** | Workflow closure substantially reconciled; interview-round persistent identity and legacy reconciliation remains an active subitem for live production backfill. |
| **B07** | Live email delivery | **PENDING** | Verification of real Resend email delivery, rate limiting, and recovery in authorized test environment. |
| **B08** | Live AI integration | **PENDING** | Small authorized live tests for approved features using model configured via `env.GEMINI_MODEL` (defaulting to `gemini-3.6-flash` if unset). |
| **B09** | Security review & dependency audit | **PENDING** | Final audit of dependencies and route authorization. |
| **B10** | Data semantics & metrics consistency | **CLOSED** | EXCUSED policy documented, canonical résumé selector, UTC date windows, and 95-point fixture verified. |
| **B11** | Integration merge gate | **PENDING** | Merge candidate review across branches without deleting historical branches. |
| **B12** | Production hosting & cookie topology | **PENDING** | Real browser session cookie, CORS, proxy headers, and secret management. |
| **B13** | CI/CD pipeline & database recovery | **PENDING** | Repeatable CI native testing workflow and database backup/restore drills. |
| **B14** | Maintenance & background jobs | **PENDING** | Expired session cleanup job, durable outbox. |

---

## 26. Reduced-Scope Frontend Integration & Deployment Status

### 26.1 Connected Student Screens Matrix

| Screen / Capability | Status | Backend Endpoints Connected | Verified Workflows |
|---|---|---|---|
| **Authentication & Session** | **Connected locally** | `POST /auth/login`<br>`POST /auth/register`<br>`POST /auth/refresh`<br>`POST /auth/logout`<br>`GET /users/me` | In-memory token storage (zero tokens in `localStorage`), silent session restore on reload via HttpOnly cookie with single-flight mutex, verified logout clearing cookies. |
| **Student Personal Subjects** | **Connected locally** | `GET /semesters`<br>`POST /semesters`<br>`GET /subjects`<br>`POST /subjects` | Student-managed semester and subject tracking (personal subjects bound to semester). Institutional master catalog data (`MasterSubject`, `Course`, `Department`) and official student enrollment workflows are separate admin/institutional capabilities not covered by these student endpoints. |
| **Course Assignments** | **Connected locally** | `GET /assignments`<br>`POST /assignments`<br>`PATCH /assignments/:id`<br>`DELETE /assignments/:id` | Creating assignments bound to real `subjectId`, priority levels (`LOW`, `MEDIUM`, `HIGH`), status tracking, due dates, assignment cards on dashboard. |
| **Productivity Tasks (W07)** | **Connected locally** | `GET /tasks`<br>`POST /tasks`<br>`PATCH /tasks/:id`<br>`DELETE /tasks/:id` | Task creation, status toggle (`TODO` ↔ `DONE`), row-lock serialization, `completedAt` timestamp preservation, title-only edits preserving completion dates, task deletion. |
| **Study Notes (Text)** | **Connected locally** | `GET /notes`<br>`POST /notes`<br>`PATCH /notes/:id`<br>`DELETE /notes/:id` | Creating text study notes linked to enrolled subjects, tag filtering, full modal note view/read, deletion. |
| **Academic Calendar & Deadlines** | **Connected locally** | `GET /calendar/unified`<br>`GET /calendar`<br>`POST /calendar`<br>`DELETE /calendar/:id` | Unified agenda aggregation supporting sources: `PERSONAL` (student events), `ASSIGNMENT` (due dates), `TASK` (due dates), `INTERVIEW` (job interview rounds), `INSTITUTIONAL` (published college events). Student event deletion verified. |
| **In-App Notifications** | **Connected locally** | `GET /notifications`<br>`PATCH /notifications/:id/read`<br>`PATCH /notifications/read-all` | Notification bell icon with unread count badge, notification popover drawer, individual mark as read, mark all read. |
| **Interactive Client Calculators** | **Connected locally** | Client-Side Pure Functions | Pomodoro timer (25m/50m/5m), Safe-Bunk threshold calculator with 75% cutoff formula, GPA simulator. |
| **Student Profile & Settings** | **Connected locally** | `GET /users/me` | Displays student profile and matriculation info (B.Sc. CS, R.K. Talreja College, Semester 5). Clarification: The current UI displays user identity, institutional matriculation, and verification architecture notes; fine-grained user settings controls (custom notification switches, appearance preferences) remain static/default view and are not yet exposed as interactive form inputs. |

### 26.2 Unsupported / Backend-Gated Capabilities (Explicitly Disabled)

| Capability | Current UI Treatment | Backend Dependency Gate |
|---|---|---|
| **Live AI Study Plan Generator** | Labeled as `[Live Provider Gate Pending]` | Pending **B08** live Gemini quota & endpoint validation. |
| **External File Upload (Supabase Storage)** | Labeled as `[Local Storage Only]` | Pending **B04** live Supabase bucket and signed URL verification. |
| **Career Hub (Job Applications & ATS)** | Deferred to Phase 2 Frontend Integration | Backend routes fully tested; UI hub intentionally unmounted to maintain focused student scope. |

### 26.3 Canonical Multi-Platform Deployment Configuration (Vercel + Render + Supabase)

According to the approved project synopsis (Section 4: Software Requirements), the canonical production topology comprises:

| Tier | Platform | Role & Configuration | Artifacts |
|---|---|---|---|
| **Frontend** | **Vercel** | React + Vite Single Page Application (`https://<app>.vercel.app`).<br>Root Directory: `.` (repository root)<br>Build Command: `npm run build --workspace frontend`<br>Output Directory: `frontend/dist`<br>Proxy Rewrites: `/api/:path* -> https://<assigned-render-host>/api/:path*` (updated with actual assigned Render URL) | [`vercel.json`](file:///d:/ALL_PROJECTS/integrum-backend-transfer/vercel.json) |
| **Backend** | **Render** | Node.js / Express Web Service + continuous background reminder processor.<br>Branch: `fix/backend-closure-day1`<br>Build Command: `npm install && npm run build --workspace backend` (runs `prisma generate && tsc`)<br>Pre-Deploy Command: `npm run db:migrate --workspace backend`<br>Start Command: `node backend/dist/server.js` | [`render.yaml`](file:///d:/ALL_PROJECTS/integrum-backend-transfer/render.yaml) |
| **Database** | **Supabase** | Managed PostgreSQL database (`aws-0-[region].pooler.supabase.com`). Dual connection topology: transaction pooler on port 6543 (runtime `DATABASE_URL`) and direct connection on port 5432 (migration `DIRECT_URL`). | [`backend/prisma.config.ts`](file:///d:/ALL_PROJECTS/integrum-backend-transfer/backend/prisma.config.ts) |
| **Version Control** | **GitHub** | Canonical Git repository (`https://github.com/sufiyanshaikh06/integrum`). Branch `fix/backend-closure-day1`. | Git repository |

#### 26.3.1 Selected Architecture: Model B (Vercel Proxy Rewrites)

To provide reliable authentication across modern browsers (avoiding third-party cookie blocking on Safari and Chrome), **Model B: Vercel Proxy Rewrites** is the selected deployment architecture:

1. **Proxy Routing in `vercel.json`:**
   - The rewrite `/api/:path* -> https://<assigned-render-host>/api/:path*` is placed **strictly before** the SPA fallback route `/(.*) -> /index.html`.
   - The destination is updated with the actual assigned Render URL before deploying Vercel.
   - The browser communicates exclusively with `https://<app>.vercel.app/api/v1/...`.
   - Vercel reverse-proxies requests to Render, maintaining **same-origin semantics** for the browser.

2. **Cookie Lifetime & Serialized Header Specifications:**
   - **Express Configuration:** The server configures `res.cookie('refreshToken', token, { maxAge: 604800000, httpOnly: true, secure: true, sameSite: 'lax' })`. Express expects `maxAge` in **milliseconds** (`7 * 24 * 60 * 60 * 1000 = 604,800,000 ms`).
   - **Render Configuration:** `COOKIE_SAME_SITE` is explicitly set to `lax` in `render.yaml` to match Model B.
   - **Serialized HTTP Header:** The Node.js cookie serializer converts milliseconds to integer **seconds** for the standard HTTP `Max-Age` attribute.
   - **Observed Header:**
     ```http
     Set-Cookie: refreshToken=<token>; Max-Age=604800; Path=/; Expires=Sat, 24 Oct 2026 04:46:08 GMT; HttpOnly; Secure; SameSite=Lax
     ```
   - This reconciles the documentation: Express code uses `604800000` ms, while the emitted wire header is `Max-Age=604800` s.

#### 26.3.2 Supabase Database Connection Separation (Runtime vs. Migration)

Supabase PostgreSQL utilizes PgBouncer for connection pooling. Running Prisma migrations through transaction pooling causes migration failures because PgBouncer in transaction mode does not support session-level advisory locks or prepared statements. The configuration strictly separates these two channels:

1. **Runtime Application Queries (`DATABASE_URL` — Port 6543):**
   - Targets the transaction pooler on port `6543`:
     ```env
     DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
     ```
   - Consumed at runtime by `@prisma/adapter-pg` via a connection `Pool` in [`backend/src/config/prisma.ts`](file:///d:/ALL_PROJECTS/integrum-backend-transfer/backend/src/config/prisma.ts).

2. **Prisma Schema Migrations (`DIRECT_URL` — Port 5432):**
   - Targets the direct database connection or session pooler on port `5432`:
     ```env
     DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
     ```
   - Declared as a required secret in `render.yaml` (`sync: false`).
   - Consumed by Prisma CLI in [`backend/prisma.config.ts`](file:///d:/ALL_PROJECTS/integrum-backend-transfer/backend/prisma.config.ts).
   - **Production Requirement:** In production (`NODE_ENV === 'production'`), `backend/prisma.config.ts` **strictly requires** `DIRECT_URL` and refuses to run migrations if it is missing, preventing silent fallbacks to transaction pooling.

#### 26.3.3 Scheduled Delivery vs. In-Process Processor Execution & Render Free Semantics

1. **Automatic Scheduled Delivery Verification:**
   - In-process timer runs via `reminderService.startReminderProcessor(env.REMINDER_INTERVAL_MS)` (default 60000ms, configurable).
   - In `test-browser-workflow.ts` (Stage 9), scheduled delivery was verified **without manually calling `processDueReminders()`**. A due reminder was created, the in-process background timer ticked automatically, claimed the record, transitioned status to `DELIVERED`, and created the student notification.
   - The browser UI then received the notification upon poll/reload and marked it read.

2. **Render Free Tier Sleep Characteristics:**
   - On the Render Free tier, web services spin down to sleep after **15 minutes** of zero incoming HTTP requests.
   - While asleep, Node's process is paused, and the in-process `setInterval` timer **does not run**.
   - Timely background reminder delivery during dormancy cannot be guaranteed by an in-process timer alone on a sleeping instance.
   - When any incoming HTTP request arrives (from user activity or an external cron health ping), the instance wakes up (cold start ~30–50s).
   - Upon wake-up, `reminderService.startReminderProcessor()` initializes and immediately sweeps overdue reminders that accumulated during dormancy, ensuring no notifications are permanently lost.

#### 26.3.4 Production Identity & Verification Fixtures

- **Primary Demo Account:** Sufiyan Shaikh (`sufiyan.shaikh@example.com` / `password123`) matriculated at R.K. Talreja College (B.Sc. Computer Science, Semester 5).
- **Secondary Isolation Fixture:** Ahmed Khan (`ahmed.khan.*@example.com` / `Password123!`), utilized during automated browser verification to prove zero cross-tenant record leakage.
- **Display-Only Settings:** User profile and matriculation data are rendered; individual settings switches (email/SMS notifications) remain display-only in this release phase.
- **Landing Design Notice:** The current React build uses the functional prototype landing hero; integration with the extended standalone landing HTML design remains tracked as a separate design task.

---

### 26.4 Verified Deployment Preparation & Step-by-Step Account Configuration Guide

The repository preparation at branch `fix/backend-closure-day1` is complete. To deploy the stack securely without pasting database credentials into chat, follow these interactive setup steps:

#### Step 1: Supabase Managed PostgreSQL
1. Log in to [supabase.com](https://supabase.com) and navigate to your project.
2. Go to **Project Settings** → **Database** → **Connection string**.
3. Copy the two distinct connection strings:
   - **Transaction Pooler (Port 6543):** Select "Transaction" mode with `pgbouncer=true`. Keep this for Render's `DATABASE_URL`.
   - **Session Pooler / Direct Connection (Port 5432):** Select "Session" or "Direct" connection on port 5432. Keep this for Render's `DIRECT_URL`.

#### Step 2: Render Web Service Deployment
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **Blueprint** (or **Web Service**).
3. Connect your GitHub repository `sufiyanshaikh06/integrum` and select branch `fix/backend-closure-day1`.
4. Render will parse [`render.yaml`](file:///d:/ALL_PROJECTS/integrum-backend-transfer/render.yaml):
   - Service name: `integrum-backend`
   - Build Command: `npm install && npm run build --workspace backend` (runs `prisma generate && tsc`)
   - Pre-deploy Command: `npm run db:migrate --workspace backend` (executes `prisma migrate deploy` over port 5432)
   - Start Command: `node backend/dist/server.js`
5. Fill in the prompted secret environment variables in the Render dashboard:
   - `DATABASE_URL`: Your Supabase transaction pooler URI (port 6543).
   - `DIRECT_URL`: Your Supabase direct connection URI (port 5432).
   - `CLIENT_URL`: `https://<your-vercel-domain>` (can be updated once Vercel is created).
6. Click **Apply / Deploy**. Once deployed, copy your assigned Render service URL (e.g. `https://integrum-backend-xxxx.onrender.com`).

#### Step 3: Vercel Frontend Deployment
1. Update `destination` in [`vercel.json`](file:///d:/ALL_PROJECTS/integrum-backend-transfer/vercel.json) to match the assigned Render URL from Step 2:
   ```json
   "destination": "https://<your-assigned-render-url>/api/:path*"
   ```
2. Commit and push the updated `vercel.json` to branch `fix/backend-closure-day1`.
3. In [vercel.com](https://vercel.com), click **Add New...** → **Project**, import `sufiyanshaikh06/integrum`, and select branch `fix/backend-closure-day1`.
4. Keep the root directory as `.` (repository root). Vercel will automatically read `vercel.json` (`buildCommand: npm run build --workspace frontend`, `outputDirectory: frontend/dist`).
5. Click **Deploy**. Vercel will build the frontend and serve it with the `/api/*` reverse proxy pointing to your live Render backend.

#### Step 4: Live Verification
Once both services are live:
1. Verify backend health: `GET https://<your-assigned-render-url>/health` returning `{ status: "ok" }`.
2. Open the deployed Vercel URL in your browser:
   - Sign in with demo credentials: `sufiyan.shaikh@example.com` / `password123`.
   - Verify `refreshToken` cookie is set with `SameSite=Lax; Secure; HttpOnly`.
   - Verify browser navigation, task completion, and session persistence across page reload.




