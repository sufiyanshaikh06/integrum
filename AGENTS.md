# Integrum

Integrum is an integrated academic, productivity, and career management ecosystem for higher education institutions and independent learners.
Full product specification: docs/PRD.md

## Session Continuity
If `.agents/session-state.md` exists, read it at the start of your turn to resume in-flight work and avoid repeating failed approaches.

## Commands (Windows: prefix with `cmd /c` in PowerShell if script execution is restricted)
- Install: `npm install`
- Run local dev: `npm run dev` (Frontend: http://localhost:5173, Backend: http://localhost:5000)
- Build Frontend: `npm run build:frontend`
- Build Backend: `npm run build:backend`
- Full Monorepo Build: `npm run build`
- Run Closure Tests: `npm run test:closure`
- Run Linting: `npm run lint`

## Read Before You Work (Mandatory)
| Task Type | Read First |
|---|---|
| New feature, requirement, or behavior change | `docs/PRD.md` |
| Any UI, layout, theme token, or component change | `docs/DESIGN_SYSTEM.md` |
| New route, service, module, or architectural flow | `docs/ARCHITECTURE.md` |
| Database schema change, query, or migration | `docs/DATABASE.md` |
| Authentication, session cookies, RBAC, or secrets | `docs/SECURITY.md` |
| Writing application code, naming, or conventions | `docs/CODE_STYLE.md` |
| Before claiming a task is done, verification gates | `docs/TESTING.md` |

## Hard Rules
- **No suppressions:** Zero tolerance for `@ts-ignore`, `eslint-disable`, or stub `throw new Error("Not implemented")` (`CONSTRAINTS.md`).
- **Secrets hygiene:** Never commit `.env` files, API keys, or raw JWT secrets to git.
- **Strict role isolation:** Student routes and institutional administration (`/api/v1/admin/*`) must remain authorization-gated (`ADR-001`).
- **Database discipline:** Never alter PostgreSQL schemas manually; always apply version-controlled Prisma migrations.
- **Storage hygiene:** Every file deletion must register with `StorageCleanupQueue` to prevent orphaned blobs.
- **Verification before claims:** Never claim completion without fresh verification evidence (builds and tests exit 0).

## How to Work
1. Restate the task and specify which files in `docs/` and source you will touch.
2. Make the minimal necessary change that satisfies the requirement without unnecessary bloat.
3. Run verification (`npm run build:frontend` and `npm run build:backend`) and ensure exit code 0.
4. If a decision changes an architectural rule or schema, update the corresponding doc in `docs/` in the same commit.
