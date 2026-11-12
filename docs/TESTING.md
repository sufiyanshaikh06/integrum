# Testing Strategy & Definition of Done: Integrum

Integrum employs a layered verification strategy combining automated unit test runners, database concurrency hardening suites, native transaction verification, and headless browser workflow tests.

---

## 1. Test Layers & Taxonomy

| Layer | Execution Tool | Target Scope | Run Command (Windows) |
|---|---|---|---|
| **Unit & Contract Tests** | Node.js Test Runner + `tsx` | Pure utility functions, Zod schema boundaries, token generators, and mock AI adapters. | `cmd /c npm run test:closure` |
| **Production Hardening** | Node.js Test Runner + `tsx` | Rate limiters, security headers, cookie flags, and timeout protections. | `cmd /c npm run test:hardening` |
| **Native DB Verification** | Node.js + PostgreSQL | Real connection pooling, row-level locks, transaction rollbacks, and Prisma migration state. | `cmd /c npm run test:native` |
| **Domain Suites** | Node.js Test Runner | Academic hub, Admin governance, Career pipeline, and Storage cleanup queue. | `node --import tsx backend/scripts/test-[domain].ts` |
| **Browser Workflow (E2E)** | Playwright (headless) | Multi-role user journeys: student onboarding, curriculum lock, attendance marking, admin drilldown. | `node --import tsx backend/scripts/test-browser-workflow.ts` |
| **Static Verification** | TypeScript Compiler (`tsc`) | Complete monorepo type checking with zero errors (`-b` in frontend, `tsc` in backend). | `cmd /c npm run build` |

---

## 2. Critical Verification Invariants (What Must Be Tested)

1. **Attendance Margin Recalibration (`attendance-consistency.ts`):**
   - Recalculating percentage when a new class is attended or missed.
   - Accurately computing the safe margin (`can miss X more lectures without falling below 75%`).
   - Accurately computing the recovery requirement (`must attend Y consecutive lectures to recover to 75%`).
   - Enqueueing an automated academic alert notification when crossing below 75%.
2. **Department Registration Code Engine:**
   - Registration succeeds and increments `usedCount` when capacity remains (`usedCount < maxUses`).
   - Registration is rejected with HTTP 400 when code is expired, inactive, or exhausted (`usedCount >= maxUses`).
   - Registration provisions the locked 5-course curriculum and 40-lecture baseline targets.
3. **Role Authorization & Boundary Gates:**
   - Requests to `/api/v1/admin/*` by `STUDENT` or unauthenticated users must return HTTP 403 Forbidden.
   - Faculty members cannot modify campus-wide department entities or system settings.
4. **Resilient AI Fallback:**
   - When Google Gemini API encounters a network timeout or provider rejection, the system must fall back gracefully to `mock.provider.ts` without throwing unhandled exceptions or returning an internal 500 error.
5. **Storage Cleanup Queue Atomicity:**
   - Deleting a note, resume, or avatar must atomically insert an entry into `StorageCleanup` inside the same database transaction.
6. **Session Revocation Invariant:**
   - Incrementing `User.authVersion` must immediately cause subsequent API calls with existing access tokens to fail with HTTP 401 Unauthorized.

---

## 3. What Not to Test

- **Third-Party Framework Internals:** Do not write tests verifying Express router mechanics, React rendering pipelines, or the Prisma Rust query engine.
- **Pure Styling & CSS Tokens:** Do not write brittle assertions testing raw CSS class strings, hex values, or responsive layout padding.
- **External Network Endpoints in CI:** Real Google Gemini or Resend delivery APIs must not be invoked during automated test runs; use mock providers and stubs.

---

## 4. Test Placement & Naming Conventions

- **Directory:** Integration and domain verification suites reside in `backend/scripts/`:
  - `backend/scripts/test-day1.test.ts` (Core day-1 closure suite)
  - `backend/scripts/test-production-hardening.ts` (Security, headers, limits)
  - `backend/scripts/test-native.mjs` (Windows PostgreSQL native checks)
  - `backend/scripts/test-admin-*.ts` (Admin academic and governance suites)
  - `backend/scripts/test-browser-workflow.ts` (Headless browser stage runner)
- **Behavioral Naming Standard:** Test descriptions must clearly describe the invariant under test:
  ```typescript
  it("rejects registration when department code has reached maximum cohort capacity", async () => { ... });
  it("automatically recalculates attendance quota and updates safe margin upon class attendance", async () => { ... });
  ```

---

## 5. Definition of Done (Strict Verification Gate)

Before declaring any feature, bugfix, or refactor complete, the following gates must pass with fresh evidence:

```
[ ] 1. REQUIREMENTS VERIFIED: Changes satisfy the acceptance criteria in docs/PRD.md.
[ ] 2. CONSTRAINTS COMPLIANT: Zero new @ts-ignore, eslint-disable, or unimplemented stubs (CONSTRAINTS.md).
[ ] 3. BACKEND COMPILES: `cmd /c npm run build:backend` completes with exit code 0.
[ ] 4. FRONTEND COMPILES: `cmd /c npm run build:frontend` completes with exit code 0.
[ ] 5. LINTER CLEAN: `cmd /c npm run lint` passes with 0 errors.
[ ] 6. DATABASE CONSISTENCY: Any schema change includes a timestamped migration in backend/prisma/migrations/ and updates docs/DATABASE.md.
[ ] 7. ARCHITECTURE & DOCS SYNC: Any route, model, or architectural change is synchronized with docs/ in the same commit.
```
