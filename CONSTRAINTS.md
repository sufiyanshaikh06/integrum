# CONSTRAINTS.md

Project: Integrum (AI-Powered Student Success Platform)
Last reviewed: 2026-10-29

## Floor (Always Enforced, Zero Tolerance)

- No new suppression comments: `@ts-ignore`, `eslint-disable`, `# noqa`, `# type: ignore`
- No unimplemented stubs: `throw new Error("Not implemented")`, empty `catch {}`
- No skipped or deleted tests without explicit reason and issue reference in the commit message
- No hardcoded secrets, plain tokens, or unhashed passwords in source code
- Strict role isolation: Student profile routes and institutional administration routes must remain authorization-gated
- No weakening of this file to make a build or test pass

## Enforced Quality Gates

| Dimension | Rule | Checked by | Runs at |
|-----------|------|-----------|---------|
| Frontend Types | Zero TypeScript errors | `npx tsc -b` (in frontend) | every edit / pre-commit |
| Backend Types | Zero TypeScript errors | `npx tsc --noEmit` (in backend) | every edit / pre-commit |
| Frontend Build | Production build succeeds cleanly | `npm run build:frontend` | every task end |
| Backend Build | Database generation & compile succeed | `npm run build:backend` | every task end |
| Integration Tests | Backend closure test suite green | `npm test` / native closure runner | task end, CI |
| Browser Tests | Headless Chrome workflow verified | Playwright runner | pre-release / PR |
| Architecture | Separation between student & admin workflows | Route & component role guard checks | every edit |

## Measured, Not Yet Enforced

| Metric | Baseline | Target Direction |
|--------|----------|------------------|
| Frontend build chunk size | ~979 kB (with Three.js bundle) | Code-split to < 500 kB |
| Closure test suite passing count | 55 / 55 | Must not fall |
| Lighthouse Performance Score | Baseline TBD | ≥ 90 |
| Core Web Vitals (LCP) | Baseline TBD | ≤ 2500ms |

## Exceptions

| ID | Rule | Path | Reason | Owner | Expires |
|----|------|------|--------|-------|---------|
| E1 | `chunkSizeWarningLimit` | `frontend/src/ThreeHeroCanvas.tsx` | Three.js WebGL graphics canvas bundled into main chunk | @sufiyan | 2026-12-01 |
