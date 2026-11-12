# Code Style & House Rules: Integrum

> **Scope Note:** Standard formatting (semicolons, indentation, trailing commas, single/double quotes) is enforced by ESLint and Prettier.
> This document governs non-lintable architectural patterns, naming conventions, structural size thresholds, and learned project instincts.

---

## 1. Language Standards & Type Safety

- **Strict TypeScript:** TypeScript strict mode is enabled across all workspaces (`backend`, `frontend`, `shared`).
- **No `any`:** The use of `any` is strictly prohibited. Use `unknown` with runtime type guards, Zod schema parsing, or generic constraints.
- **Type Imports:** Prefer `import type { ... }` for type-only imports to aid bundler tree-shaking and preserve clean module boundaries.

---

## 2. Naming Conventions

| Element | Casing Style | Target Format / Example | Rationale |
|---|---|---|---|
| **React Component Files** | `PascalCase.tsx` | `DashboardView.tsx`, `ThreeHeroCanvas.tsx` | Standard React component convention. |
| **Service & Controller Files** | `kebab-case.ts` | `auth.service.ts`, `attendance.controller.ts` | Easy navigation and cross-platform filesystem safety. |
| **Utility Files** | `kebab-case.ts` | `themePresets.ts`, `asyncHandler.ts` | Clean separation from React components. |
| **React Components** | `PascalCase` | `function AdminView()`, `const Header` | Component identifier distinction. |
| **Functions & Methods** | `camelCase` | `calculateAttendanceMargin()`, `verifySession()` | Verb-oriented actions. |
| **Variables & Fields** | `camelCase` | `studentProfileId`, `attendedClasses` | Consistency across models and variables. |
| **Constants & Enums** | `UPPER_SNAKE_CASE` | `COLOR_PRESETS`, `Role.SUPER_ADMIN` | Read-only / immutable indicator. |
| **Types & Interfaces** | `PascalCase` | `StudentProfileData`, `ApiResponseContract` | No Hungarian notation (no `I` or `T` prefix). |
| **Booleans** | `is / has / can` | `isActive`, `hasPermission`, `canMissLecture` | Instant readability of boolean intent. |

---

## 3. Structural Limits & Modularity

- **File Length Target:** Aim to keep files under ~300 lines. When views or services grow large (e.g. monolithic views), decompose into focused sub-components or domain helper services.
- **Function Cohesion:** Functions should accomplish a single responsibility and stay under ~50 lines where feasible.
- **Single Responsibility in Controllers:** Express route controllers handle request extraction, call the service layer, and return standard API responses. Business calculations and database queries must not reside directly in controller bodies.

---

## 4. Architectural Patterns

### A. API Response & Error Standards
- **Standard Success Format:** Always use `ApiResponse.success(res, message, data, statusCode)`:
  ```typescript
  ApiResponse.success(res, 'Attendance updated', result, HTTP_STATUS.OK);
  ```
- **Standard Error Format:** Throw `ApiError` instances rather than unformatted JavaScript `Error` objects:
  ```typescript
  throw ApiError.badRequest('Registration code has expired');
  throw ApiError.unauthorized('Invalid session');
  ```
- **Async Route Handlers:** All controller methods must be wrapped in `asyncHandler` to ensure async rejections propagate cleanly to the Express `errorHandler` middleware.

### B. Validation & Input Sanitation
- **Zod Schema First:** Every endpoint taking user input must validate payloads via `validateRequest(schema)` middleware.
- **Shared Schemas:** Where contracts span frontend and backend, centralize schemas in `shared/schemas/` or mirror strictly typed interfaces.

### C. Dates and Timezones
- **Database Storage:** Always store timestamps in UTC (`DateTime` in Prisma / `timestamptz` in PostgreSQL).
- **Client Presentation:** Format dates to the user's localized timezone strictly in the UI layer.

### D. File Storage Lifecycle & Queue Invariant
- Any file deletion (e.g. note attachment, avatar) must register an entry in `StorageCleanupQueue` (`StorageCleanup` model) in the same Prisma database transaction to guarantee cleanup retry resilience.

---

## 5. Explicit Anti-Patterns (Zero Tolerance)

| Anti-Pattern | Why It Breaks the Project | Required Action |
|---|---|---|
| ❌ Adding `@ts-ignore` or `eslint-disable` | Degrades type safety and silently hides breaking regressions (`CONSTRAINTS.md`). | Fix the underlying type mismatch or narrowing logic. |
| ❌ Stubs like `throw new Error("Not implemented")` | Breaks production user flows unexpectedly. | Implement complete logic or keep feature out of scope. |
| ❌ Direct raw SQL string interpolation | Introduces catastrophic SQL injection risks. | Always use Prisma Client's parameterized query engine. |
| ❌ Hardcoded Hex Colors in React Components | Breaks the 5-theme preset engine and dark mode. | Reference CSS tokens: `var(--primary)`, `var(--surface)`, `var(--action)`. |
| ❌ Unbounded External AI / API Calls | External latency can hang server workers and exhaust DB pools. | Wrap calls in `withTimeout(promise, 10000)`. |
| ❌ Storing Plaintext Passwords / Tokens in DB | Violates data classification and security baseline. | Use bcrypt for passwords; SHA-256 hashes for reset/verification tokens. |

---

## 6. Learned Project Instincts

<!-- Continuous learning: append new repo-specific preferences/corrections below -->
- **Windows PowerShell Execution:** In Windows PowerShell, scripts like `npm.ps1` are subject to script execution restrictions. Always prefix commands with `cmd /c` (e.g. `cmd /c npm run dev`, `cmd /c npm run build:backend`, `cmd /c npm run build:frontend`).
- **Sandbox TCP Sockets:** Standard sandbox execution prohibits background outbound TCP socket loopback without elevated approval. Unit tests in sandbox environments must use mock providers and in-memory stubs rather than binding live local network ports.
- **Prisma Error Classification:** Do not treat all Prisma exceptions as 500s. Transient connection codes (`P1001`, `P1002`, `P1008`, `P1017`) must map to `503 Service Unavailable`, preventing clients from treating temporary database outages as application logic bugs.
- **Frontend Three.js Chunk:** Three.js is bundled into the client bundle (`ThreeHeroCanvas.tsx`). An explicit chunk size warning exception (`E1`) exists in `CONSTRAINTS.md` until code-splitting is introduced.
