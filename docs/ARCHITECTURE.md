# Architecture: Integrum

Integrum is an integrated academic, productivity, and career management platform for higher education institutions and independent learners.

---

## 1. Tech Stack

| Layer | Choice | Justification |
|---|---|---|
| **Frontend Framework** | React 19 + Vite 8 + TypeScript | High-performance SPA with modern React primitives, type safety, and fast HMR. |
| **Styling & 3D** | Tailwind CSS + Custom Design Tokens + Three.js | Token-driven styling (`integrum-v2.css`) paired with interactive 3D WebGL hero graphics. |
| **Backend Runtime** | Node.js + Express 5 (`express@^5.2.1`) + TypeScript | Lightweight RESTful services with native Promise rejection handling in Express 5. |
| **ORM & Database** | Prisma 7 (`@prisma/client@^7.9.1`) + PostgreSQL | Type-safe migrations, connection pooling via `@prisma/adapter-pg`, and relational integrity. |
| **Authentication** | JWT in HTTP-Only Cookies + bcrypt | Stateless auth via signed `accessToken` (15m) and `refreshToken` (7d) cookies; passwords hashed with bcrypt. |
| **Validation** | Zod (backend schemas & shared contracts) | Runtime input validation preventing parameter injection and type mismatches. |
| **File Storage** | Supabase Storage (`@supabase/storage-js`) / Local Fallback | Cloud object storage for documents, notes, and avatars with an async DB cleanup queue. |
| **AI Integration** | Google Gemini (`@google/generative-ai`) / Mock Provider | Provider abstraction for syllabus summarization, study plan drafting, and career advice. |
| **PDF Generation** | PDFKit (`pdfkit`) | Server-side programmatic PDF generation for transcripts, study plans, and attendance summaries. |
| **Hosting Topology** | Vercel (Frontend) + Render (Backend) + Supabase (DB) | Segregated operational topology with continuous health checks and maintenance-mode switches. |

---

## 2. System Architecture Diagram

```
                             ┌──────────────────────────────────────┐
                             │       Browser (React 19 SPA)         │
                             │  - Views: Admin, Student, Faculty    │
                             │  - State: Auth Context, Theme Tokens │
                             │  - 3D: ThreeHeroCanvas (WebGL)       │
                             └──────────────────┬───────────────────┘
                                                │
                                HTTPS / REST    │  Credentials (HTTP-only JWT cookies)
                                Base: /api/v1   ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Express 5 API Server (Render)                                                          │
│                                                                                        │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Security & Routing Pipeline:                                                       │ │
│ │ Helmet (CSP) -> CORS (with credentials) -> Rate Limiters -> Cookie Parser          │ │
│ │ -> Maintenance Mode Check -> authenticate -> authorize (Role RBAC)                 │ │
│ │ -> validateRequest (Zod)                                                           │ │
│ └─────────────────────────────────────────┬──────────────────────────────────────────┘ │
│                                           │                                            │
│ ┌─────────────────────────────────────────▼──────────────────────────────────────────┐ │
│ │ Domain Controllers & Business Services:                                            │ │
│ │ • Academic: semester, subject, attendance-consistency, studyplan, assignment       │ │
│ │ • Administrative: institutional governance, registration codes, audit, reports     │ │
│ │ • Productivity: tasks, reminders, notes, calendar, notifications                  │ │
│ │ • Career: resumes, skills, certifications, job applications                         │ │
│ │ • Analytics & AI: study velocity, Gemini AI provider, PDF renderer                 │ │
│ └──────────────────────┬──────────────────────┬──────────────────────┬───────────────┘ │
│                        │                      │                      │                 │
│         Prisma Client  ▼        Storage API   ▼         Gemini API   ▼                 │
│         (@prisma/adapter-pg)   (Signed URLs)          (Generative AI)                  │
└────────────────────────┼──────────────────────┼──────────────────────┼─────────────────┘
                         │                      │                      │
                         ▼                      ▼                      ▼
               ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
               │  PostgreSQL DB   │   │ Supabase Storage │   │  Google Gemini   │
               │   (Supabase)     │   │   (or Local)     │   │   (or Mock)      │
               └──────────────────┘   └─────────┬────────┘   └──────────────────┘
                         ▲                      │
                         │ StorageCleanupQueue  │
                         └──────────────────────┘
```

---

## 3. Multi-Tenant Authority Tree & Role Model

Integrum implements a hierarchical multi-tenant tree structure (governed by `ADR-001`):

```
Level 0: SUPER_ADMIN (Platform Owner)
   └── Level 1: INSTITUTION_ADMIN (University / College Node)
          └── Level 2: Department Heads / Admins (Branch Node, e.g., CSE, IT)
                 ├── Level 3: FACULTY (Staff / Lecturers)
                 └── Level 4: STUDENT (Leaves / Cohorts)
```

1. **Institutional Students**: Register with an `institutionCode` (e.g. `CSE-2026-S5`) and University Roll Number. They automatically inherit the locked semester curriculum (courses, 40-lecture target quota, 75% attendance threshold).
2. **Independent Learners**: Register without an institution code, receiving an isolated personal study workspace without institutional circulars, mandatory lecture quotas, or attendance gates.
3. **Dedicated Profile Segregation**: Institutional Admins, Department Heads, Faculty, and Students each operate dedicated, role-specific profile views with appropriate governance, teaching metrics, and accreditation fields.

---

## 4. Repository & Monorepo Structure

Integrum is organized as an npm workspace monorepo:

```
integrum/
├── .agents/                 # Antigravity workflows, rules, and skills
├── docs/                    # Ground truth documentation (8-Doc Architecture)
│   ├── decisions/           # Architecture Decision Records (ADRs)
│   ├── PRD.md               # Product Requirements Document
│   ├── DESIGN_SYSTEM.md     # Design tokens, typography, and UI rules
│   ├── ARCHITECTURE.md      # This document: system architecture & tech stack
│   ├── DATABASE.md          # Entity relational schema, indexes, and migrations
│   ├── SECURITY.md          # RBAC, cookie hygiene, secrets, and OWASP gates
│   ├── CODE_STYLE.md        # Architecture conventions & learned instincts
│   └── TESTING.md           # Test strategy, closure verification, and DoD
├── AGENTS.md                # Root routing map (<120 lines) for coding agents
├── CONSTRAINTS.md           # Enforced floor and quality gates
├── backend/                 # Express 5 + Prisma API application
│   ├── prisma/
│   │   ├── schema.prisma    # Canonical PostgreSQL database schema
│   │   └── migrations/      # Version-controlled SQL migration history
│   ├── scripts/             # Verification suites (test-day1, test-production-hardening)
│   └── src/
│       ├── app.ts           # Express application configuration & middleware pipeline
│       ├── server.ts        # HTTP server initialization & graceful shutdown
│       ├── config/          # Environment (`env.ts`), Prisma client, rate limiters
│       ├── controllers/     # HTTP route controllers (student & admin domains)
│       ├── middleware/      # authenticate, authorize, validateRequest, errorHandler
│       ├── routes/          # REST route declarations mounted at /api/v1
│       ├── schemas/         # Zod schemas for request validation
│       ├── services/        # Core business logic, academic consistency, storage, AI
│       └── utils/           # ApiError, ApiResponse, jwt, cookies, pdf renderer
├── frontend/                # React 19 + Vite 8 SPA application
│   └── src/
│       ├── App.tsx          # Application shell & stage manager
│       ├── components/      # UI components, modals, sidebar, navigation
│       │   └── views/       # Feature views (AdminView, DashboardView, ProfileView, etc.)
│       ├── services/        # Typed API client (`api.ts`) wrapping backend endpoints
│       ├── styles/          # Theme tokens, custom CSS (`integrum-v2.css`, `index.css`)
│       └── utils/           # Theme presets and formatting utilities
└── shared/                  # Shared contracts, constants, and schemas
```

---

## 5. End-to-End Request Flows

### Flow A: Institutional Student Registration & Curriculum Lock
1. Student registers via `frontend/src/components/LoginPhase.tsx` with role `STUDENT`, `institutionCode` (e.g. `CSE-2026-S5`), and Roll Number.
2. `auth.controller.ts` calls `auth.service.ts` inside a database transaction:
   - Validates the `DepartmentRegistrationCode` (active status, expiration, quota `usedCount < maxUses`).
   - Increments code usage and creates `User` + `UserProfile` records.
   - Automatically provisions locked `Subject` records matching the department's semester master curriculum.
   - Sets baseline attendance quota tracking (40 lectures per course, 75% target threshold).
3. Issues HTTP-only signed JWT session cookies (`accessToken` and `refreshToken`).
4. UI enters authenticated state and loads the locked student workspace.

### Flow B: Lecture Attendance Marking & Quota Consistency
1. Faculty marks lecture attendance via `attendance.controller.ts`.
2. Request passes `authenticate` and `authorize(['FACULTY', 'ADMIN', 'INSTITUTION_ADMIN'])`.
3. Validated by Zod against `attendance.schema.ts`.
4. `attendance-consistency.ts` updates `AttendanceRecord` and recalibrates aggregate attendance percentage atomically in Prisma.
5. If attendance drops below 75%, an automated `Notification` (`NotificationType: AI_INSIGHT` or `ACADEMIC_ALERT`) is enqueued for the student.

### Flow C: AI-Powered Study Plan Generation
1. Student requests a study plan for an upcoming exam in `AIAssistantView.tsx`.
2. Handled by `studyplan.controller.ts` -> `studyplan.service.ts`.
3. Service formats syllabus topics and exam date into a prompt for `ai.provider.ts`.
4. `gemini.provider.ts` invokes Google Gemini API with fallback to `mock.provider.ts` if offline or unconfigured.
5. Structured JSON response is validated via Zod, persisted as a `StudyPlan` with associated `StudySession` tasks, and returned to client.

---

## 6. Architectural Boundaries & Invariants

1. **Separation of Student and Administrative Domains**:
   - Institutional administration routes (`/api/v1/admin/*`) require `SUPER_ADMIN` or `INSTITUTION_ADMIN` roles.
   - Faculty cannot alter institution-level department configurations; students cannot modify attendance quotas or catalog curricula.
2. **Database Access Restriction**:
   - All queries and mutations must flow through Prisma services in `backend/src/services/`.
   - Raw string SQL interpolation is forbidden; transactions must use Prisma's `$transaction` API.
3. **Storage Hygiene & Orphan Elimination**:
   - Deleting a note, user avatar, or attachment writes an entry to `StorageCleanupQueue`.
   - Asynchronous storage worker (`scripts/retry-storage-cleanup.ts`) reconciles and purges object blobs, preventing orphaned storage leaks.
4. **Resilient AI Subsystem**:
   - All AI calls must pass through `ai.provider.ts` with explicit timeout safeguards (`withTimeout.ts`) and fallback graceful degradation.

---

## 7. Decision Log

- **ADR-001 (2026-10-29)**: Adopted multi-tenant tree hierarchy, locked department registration codes, and dedicated role-specific profile segregation.
- **Express 5 Migration (2026-08)**: Standardized on Express 5.x for native async route error propagation without boilerplate wrappers.
- **Prisma 7 & PostgreSQL Adapter (2026-10)**: Configured `@prisma/adapter-pg` to enable optimized connection pooling and fast cold starts on serverless/container hosts.
- **Stateless HTTP-Only JWT Cookies**: Abandoned localStorage token storage in favor of partitioned, secure HTTP-only cookie authentication to mitigate XSS token theft.
