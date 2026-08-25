# Administration Portal — V1 Architecture & Implementation Plan (Revised)

> **Scope:** 5 Core Administration Features (20 Functionalities) + Authenticated Catalog/Content Feeds  
> **Status:** Implementation Complete & Verified (Phases A1 – A7.1)  
> **Target System:** Integrum Backend (`backend/`)  
> **Prerequisites:** Identity, Academic, Productivity, Career, AI Notes, and Analytics gap-closure verified & passing.  

---

## P1 — Frozen Administration Portal V1 Scope

```text
Administration Portal (V1 Backend Scope — 20 Functionalities Across 5 Features)
│
├── 1. User Management (4 Functionalities)
│   ├── 1.1 Student Accounts (Paginated List, Search by name/email, Filter by active/verified/course, Profile View)
│   ├── 1.2 Administrator Accounts (Paginated List, Direct Admin Provisioning with permissionsLevel & departmentId)
│   ├── 1.3 Role Management (STUDENT ↔ ADMIN Profile-Aware Transitions with Centralized Baseline Provisioning)
│   └── 1.4 Account Status (Activate / Deactivate with Self-Protection & Last-Admin Guardrails)
│
├── 2. Academic Management (4 Functionalities)
│   ├── 2.1 Departments (Institutional Department Catalog CRUD with Restrictive Deletion)
│   ├── 2.2 Courses / Programs (Degree Programs under Departments with duration & semester invariants)
│   ├── 2.3 Subjects Catalog (MasterSubject Syllabus Templates linked to Course)
│   └── 2.4 Semester Configuration (AcademicTerm Calendar Cycles with AcademicTermType enum)
│
├── 3. Content Management (4 Functionalities)
│   ├── 3.1 Announcements (Campus/Dept/Course Broadcasts with Scope Invariants & Draft Semantics)
│   ├── 3.2 Notices (High-Priority Academic Notices & Circulars via ContentPriority enum)
│   ├── 3.3 Institutional Events (Campus-Wide / Exam / College Events with strict scope invariants)
│   └── 3.4 Academic Resources (Shared Syllabus, Question Papers, Guides)
│
├── 4. Platform Management (4 Functionalities)
│   ├── 4.1 Dashboard Statistics (Aggregated User, Academic, AI & Career counts)
│   ├── 4.2 Activity / Audit Logs (Append-Only Admin Action History with Durable Actor Attribution)
│   ├── 4.3 Feedback Management (Two-Sided: Student Submit ↔ Admin Review/Resolve at /admin/platform/feedback)
│   └── 4.4 System Configuration (Enforced V1 Settings: MAINTENANCE_MODE, ALLOW_STUDENT_REGISTRATION, AI_FEATURES_ENABLED)
│
└── 5. Reporting (4 Functionalities)
    ├── 5.1 User Reports (Registration Trends, Active/Inactive Ratios, Cohort Distribution)
    ├── 5.2 Academic Reports (Institutional Attendance Averages & Assignment Completion Aggregates)
    ├── 5.3 Usage Analytics (AI Execution Performance & Job Application Funnel Metrics)
    └── 5.4 Platform Health Reports (Uptime, Database Latency, Process Memory & Diagnostics)

Authenticated Student/Application Feeds:
├── Catalog Feeds: GET /api/v1/catalog/departments, /courses, /subjects, /terms (Requires Authenticate)
├── Content Feeds: GET /api/v1/content/announcements, /events, /resources (Requires Authenticate + Scope Filtering)
└── Feedback Input: POST /api/v1/feedback (Requires Authenticate + STUDENT role)
```

---

## P2 — Architecture & Route Structure

### 1. Request Flow Architecture

```text
Client (Postman / Frontend Dashboard)
      │
      ▼
Express Router (/api/v1/admin/*)
      │
      ▼
authenticate Middleware
  ├── Verifies JWT Access Token
  ├── Checks User.isActive (403 if deactivated)
  └── Populates req.user with { id, email, role, studentProfile, adminProfile }
      │
      ▼
authorize('ADMIN') Middleware
  └── Checks req.user.role === 'ADMIN' (403 Forbidden if not)
      │
      ▼
Admin Controller (Validates request params/query/body via Zod middleware)
      │
      ▼
Admin Service (Enforces business logic, safety guards & audit attribution)
      │
      ├── 1. Performs Transactional Database Operations via Prisma
      └── 2. Emits Append-Only Record to AdminAuditLog (actorUserId = req.user.id)
      │
      ▼
PostgreSQL Database
```

### 2. Standardized URL Map

```text
Route Group                        Mount Path                         Controller
───────────────────────────────────────────────────────────────────────────────────────────────
Admin User Management             /api/v1/admin/users                adminUser.controller.ts
Admin Academic Catalog            /api/v1/admin/academics            adminAcademic.controller.ts
Admin Content Management          /api/v1/admin/content              adminContent.controller.ts
Admin Platform Management         /api/v1/admin/platform             adminPlatform.controller.ts
Admin Reporting & Analytics       /api/v1/admin/reports              adminReport.controller.ts

Authenticated Catalog Feeds       /api/v1/catalog                    catalog.controller.ts
Authenticated Content Feeds       /api/v1/content                    content.controller.ts
Student Feedback Submission       /api/v1/feedback                   feedback.controller.ts
```

---

## P3 — Database Architecture & Non-Destructive Schema Design

### 1. Catalog vs. Personal Instance Pattern

```text
INSTITUTIONAL MASTER CATALOG (ADMIN-OWNED — RESTRICTIVE DELETION)
Department ──(1:N Restrict)──> Course ──(1:N Restrict)──> MasterSubject
AcademicTerm (Global Calendar Term Cycle)

OPTIONAL BRIDGES
StudentProfile.courseId?       ──(SetNull)──> Course (Department derived via Course.departmentId)
Semester.academicTermId?       ──(SetNull)──> AcademicTerm
Subject.masterSubjectId?       ──(SetNull)──> MasterSubject
AdminProfile.departmentId?     ──(SetNull)──> Department (replaces legacy raw string)

STUDENT OPERATIONAL DATA (STUDENT-OWNED — UNTOUCHED & AUTONOMOUS)
StudentProfile (1:N Cascade) ──> Semester (1:N Cascade) ──> Subject (1:N Cascade) ──> [Assignment, Note, AttendanceRecord]
CalendarEvent (Strictly private personal entries with mandatory studentProfileId)
```

### 2. Exact Prisma Schema Additions & Relations

```prisma
// ─── NEW ENUMS ─────────────────────────────────────────────────────────

enum AnnouncementType {
  ANNOUNCEMENT
  NOTICE
}

enum ContentPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum ContentTargetScope {
  ALL
  DEPARTMENT
  COURSE
}

enum InstitutionalEventCategory {
  EXAM
  HOLIDAY
  COLLEGE_EVENT
  SEMINAR
  WORKSHOP
}

enum ResourceCategory {
  SYLLABUS
  PREVIOUS_PAPER
  STUDY_GUIDE
  TEMPLATE
  OTHER
}

enum FeedbackCategory {
  BUG_REPORT
  FEATURE_REQUEST
  ACADEMIC_QUERY
  GENERAL
}

enum FeedbackStatus {
  PENDING
  UNDER_REVIEW
  RESOLVED
  DISMISSED
}

enum AcademicTermType {
  ODD
  EVEN
  SUMMER
}

enum SystemSettingKey {
  MAINTENANCE_MODE
  ALLOW_STUDENT_REGISTRATION
  AI_FEATURES_ENABLED
}

// ─── 10 NEW MODELS ──────────────────────────────────────────────────────

model Department {
  id               String              @id @default(uuid())
  name             String              @unique
  code             String              @unique // e.g. "CSE", "ECE", "MECH"
  description      String?             @db.Text
  headOfDepartment String?
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt

  courses          Course[]
  adminProfiles    AdminProfile[]
  announcements    Announcement[]
  resources        AcademicResource[]
  events           InstitutionalEvent[]
}

model Course {
  id             String              @id @default(uuid())
  departmentId   String
  department     Department          @relation(fields: [departmentId], references: [id], onDelete: Restrict)
  name           String
  code           String              @unique // e.g. "BTECH_CSE", "BCA"
  durationYears  Int                 @default(4)
  totalSemesters Int                 @default(8)
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  masterSubjects MasterSubject[]
  students       StudentProfile[]
  announcements  Announcement[]
  resources      AcademicResource[]
  events         InstitutionalEvent[]
}

model MasterSubject {
  id             String    @id @default(uuid())
  courseId       String
  course         Course    @relation(fields: [courseId], references: [id], onDelete: Restrict)
  name           String
  code           String    // e.g. "CS401"
  credits        Int       @default(3)
  semesterNumber Int       @default(1)
  description    String?   @db.Text
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  studentSubjects Subject[]

  @@unique([courseId, code])
}

model AcademicTerm {
  id           String           @id @default(uuid())
  name         String           // e.g. "Fall 2026", "Spring 2027"
  academicYear Int              // e.g. 2026
  termType     AcademicTermType @default(ODD)
  startDate    DateTime
  endDate      DateTime
  isActive     Boolean          @default(true)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  semesters    Semester[]
}

model Announcement {
  id             String             @id @default(uuid())
  type           AnnouncementType   @default(ANNOUNCEMENT)
  title          String
  content        String             @db.Text
  priority       ContentPriority    @default(MEDIUM)
  targetScope    ContentTargetScope @default(ALL)
  departmentId   String?
  department     Department?        @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  courseId       String?
  course         Course?            @relation(fields: [courseId], references: [id], onDelete: SetNull)
  isPublished    Boolean            @default(false)
  publishedAt    DateTime?
  expiresAt      DateTime?
  authorUserId   String
  author         User               @relation(fields: [authorUserId], references: [id], onDelete: Restrict)
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
}

model InstitutionalEvent {
  id              String                     @id @default(uuid())
  title           String
  description     String?                    @db.Text
  category        InstitutionalEventCategory @default(COLLEGE_EVENT)
  startDate       DateTime
  endDate         DateTime?
  location        String?
  targetScope     ContentTargetScope         @default(ALL)
  departmentId    String?
  department      Department?                @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  courseId        String?
  course          Course?                    @relation(fields: [courseId], references: [id], onDelete: SetNull)
  isPublished     Boolean                    @default(true)
  createdByUserId String
  createdByUser   User                       @relation(fields: [createdByUserId], references: [id], onDelete: Restrict)
  createdAt       DateTime                   @default(now())
  updatedAt       DateTime                   @updatedAt
}

model AcademicResource {
  id               String           @id @default(uuid())
  title            String
  description      String?          @db.Text
  fileUrl          String
  fileType         String           // e.g. "PDF", "DOCX", "ZIP"
  category         ResourceCategory @default(SYLLABUS)
  departmentId     String?
  department       Department?      @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  courseId         String?
  course           Course?          @relation(fields: [courseId], references: [id], onDelete: SetNull)
  uploadedByUserId String
  uploadedByUser   User             @relation(fields: [uploadedByUserId], references: [id], onDelete: Restrict)
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
}

model Feedback {
  id               String           @id @default(uuid())
  studentProfileId String
  studentProfile   StudentProfile   @relation(fields: [studentProfileId], references: [id], onDelete: Cascade)
  category         FeedbackCategory @default(GENERAL)
  subject          String
  message          String           @db.Text
  status           FeedbackStatus   @default(PENDING)
  adminNotes       String?          @db.Text
  resolvedByUserId String?
  resolvedByUser   User?            @relation("ResolvedFeedbacks", fields: [resolvedByUserId], references: [id], onDelete: SetNull)
  resolvedAt       DateTime?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
}

model AdminAuditLog {
  id          String   @id @default(uuid())
  actorUserId String
  actorUser   User     @relation(fields: [actorUserId], references: [id], onDelete: Restrict)
  action      String   // e.g. "USER_ROLE_UPDATED", "USER_STATUS_TOGGLED", "SETTING_UPDATED"
  targetType  String   // e.g. "User", "Department", "SystemSetting"
  targetId    String?
  details     Json?    // { previousValue, newValue, reason }
  ipAddress   String?
  createdAt   DateTime @default(now())
}

model SystemSetting {
  id              String           @id @default(uuid())
  key             SystemSettingKey @unique
  value           Json             // Typed JSON value (boolean or string)
  description     String?
  updatedByUserId String
  updatedByUser   User             @relation(fields: [updatedByUserId], references: [id], onDelete: Restrict)
  updatedAt       DateTime         @updatedAt
}
```

---

## P4 — Security, RBAC & Enforcement Guardrails

### 1. Sensitive Data Restrictions & Guards
1. **Password & Token Protection:** All admin user listings strip `passwordHash`, `verificationTokenHash`, `passwordResetTokenHash`.
2. **Self-Action Protections:** An admin cannot deactivate or demote their own account.
3. **Last-Admin Safeguard:** An admin status update or role change verifies that at least one other active `ADMIN` account remains in the database before proceeding.
4. **Append-Only Auditing:** `AdminAuditLog` is created for sensitive state transitions (`USER_ROLE_UPDATED`, `USER_STATUS_TOGGLED`, `SETTING_UPDATED`, `ANNOUNCEMENT_PUBLISHED`).

### 2. Centralized Baseline Provisioning Invariant

```typescript
/**
 * Shared helper that provisions mandatory student baseline records identically
 * for normal registration and for ADMIN -> STUDENT role demotion.
 */
export async function ensureStudentBaseline(
  tx: Prisma.TransactionClient,
  user: { id: string; email: string },
  nameData?: { firstName?: string; lastName?: string }
) {
  let profile = await tx.studentProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    profile = await tx.studentProfile.create({
      data: {
        userId: user.id,
        firstName: nameData?.firstName || 'Student',
        lastName: nameData?.lastName || 'User',
      }
    });
  }

  // 1. Ensure default semester exists
  let semester = await tx.semester.findFirst({ where: { studentProfileId: profile.id } });
  if (!semester) {
    const now = new Date();
    const semesterEnd = new Date();
    semesterEnd.setMonth(now.getMonth() + 4);
    semester = await tx.semester.create({
      data: {
        studentProfileId: profile.id,
        name: 'Semester 1',
        startDate: now,
        endDate: semesterEnd,
      }
    });
  }

  // 2. Ensure StudentSettings exists
  const settings = await tx.studentSettings.findUnique({ where: { userId: user.id } });
  if (!settings) {
    await tx.studentSettings.create({
      data: { userId: user.id, defaultSemesterId: semester.id }
    });
  }

  // 3. Ensure StudentAnalytics exists
  const analytics = await tx.studentAnalytics.findUnique({ where: { studentProfileId: profile.id } });
  if (!analytics) {
    await tx.studentAnalytics.create({ data: { studentProfileId: profile.id } });
  }

  return profile;
}
```

### 3. Enforced System Settings Rules
- `MAINTENANCE_MODE` (boolean): Gated via middleware on `/api/v1` routes; students receive `503 Service Unavailable` with maintenance message; admin routes and `/health` remain operational.
- `ALLOW_STUDENT_REGISTRATION` (boolean): Checked at `POST /auth/register`; rejects registration with `403 Forbidden` if false.
- `AI_FEATURES_ENABLED` (boolean): Checked at `AIService` / AI routes; returns `403 Forbidden` if false.

---

## P5 — Implementation Backlog (Phases A1 → A7)

```text
Phase A1 — Admin Foundation & Seeding
  ├── Task A1.1: Prisma Schema Migration (10 Models + 4 Model Extensions + Restrictive onDelete)
  ├── Task A1.2: Strict Idempotent Admin Seed Script (prisma/seed.ts via SEED_ADMIN_EMAIL/PASSWORD)
  └── Task A1.3: Update Express Types & authenticate.ts (select adminProfile) + Admin Router Mount

Phase A2 — User Management Module
  ├── Task A2.1: User Schemas & Validation (admin.user.schema.ts)
  ├── Task A2.2: User Service (List, Filter, Search, Pagination, Audit Trail)
  ├── Task A2.3: Admin Account Provisioning (POST /admin/users/admins)
  ├── Task A2.4: Account Status & Role Management (Status toggle + safe demotion with ensureStudentBaseline)
  └── Task A2.5: User Controller & Routes (/api/v1/admin/users/*)

Phase A3 — Academic Catalog Module
  ├── Task A3.1: Academic Schemas with Domain Invariants (durationYears>0, semesterNumber in bounds)
  ├── Task A3.2: Department, Course, MasterSubject, AcademicTerm Services (Restrictive deletion guards)
  ├── Task A3.3: Admin Academic Controller & Routes (/api/v1/admin/academics/*)
  └── Task A3.4: Authenticated Student Catalog Feeds (/api/v1/catalog/*)

Phase A4 — Content Management Module
  ├── Task A4.1: Content Schemas & Scope Invariants (ALL vs DEPT vs COURSE)
  ├── Task A4.2: Announcements (Draft/Publish lifecycle with ContentPriority enum)
  ├── Task A4.3: Institutional Events & Academic Resources Services & Controllers
  └── Task A4.4: Authenticated Student Content Feeds with Scope & Expiry Filtering (/api/v1/content/*)

Phase A5 — Platform Management Module
  ├── Task A5.1: Admin Dashboard Aggregations (Counts across users, courses, AI, feedback)
  ├── Task A5.2: Append-Only Audit Logging Service & Controller (/api/v1/admin/platform/audit-logs)
  ├── Task A5.3: Two-Sided Feedback (POST /api/v1/feedback + /api/v1/admin/platform/feedback)
  └── Task A5.4: Enforced System Settings Service & Middleware (Maintenance mode, Registration toggle, AI toggle)

Phase A6 — Reporting & Telemetry Module
  ├── Task A6.1: User Cohort & Demographics Report (/api/v1/admin/reports/users)
  ├── Task A6.2: Institutional Academic Performance Report (/api/v1/admin/reports/academics)
  ├── Task A6.3: AI & Career Usage Analytics (/api/v1/admin/reports/usage)
  └── Task A6.4: Platform Health Diagnostic Report (/api/v1/admin/reports/health)

Phase A7 — Full Regression & Documentation
  ├── Task A7.1: Comprehensive Admin Integration Test Suite (scripts/test-admin.ts)
  ├── Task A7.2: Full Regression Pass (All 5 test suites)
  └── Task A7.3: Update PROJECT_PROGRESS.md and Git Commit/Push
```

---

## P6 — Task-by-Task Implementation Specifications

### Phase A1: Foundation, Migration & Seeding

#### Task A1.1: Schema Migration & Prisma Client Generation
- **Files to Modify:** `backend/prisma/schema.prisma`
- **Actions:**
  1. Add 9 new enums (`AnnouncementType`, `ContentPriority`, `ContentTargetScope`, `InstitutionalEventCategory`, `ResourceCategory`, `FeedbackCategory`, `FeedbackStatus`, `AcademicTermType`, `SystemSettingKey`).
  2. Add 10 new models (`Department`, `Course`, `MasterSubject`, `AcademicTerm`, `Announcement`, `InstitutionalEvent`, `AcademicResource`, `Feedback`, `AdminAuditLog`, `SystemSetting`).
  3. Extend existing models (`StudentProfile.courseId?`, `Semester.academicTermId?`, `Subject.masterSubjectId?`, `AdminProfile.departmentId?`).
  4. Run `cmd.exe /c npx prisma migrate dev --name add_admin_portal_schema` and `cmd.exe /c npx prisma generate`.

#### Task A1.2: Strict Idempotent Admin Seeding Script
- **Files to Create:** `backend/prisma/seed.ts`
- **Files to Modify:** `backend/package.json`
- **Actions:**
  1. Script reads `process.env.SEED_ADMIN_EMAIL` and `process.env.SEED_ADMIN_PASSWORD`. If either is missing, fails immediately with `Error: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be configured in environment. No default credentials are permitted.`
  2. Hashes password with bcrypt (10 salt rounds) and upserts `User` (role: `ADMIN`, `isVerified: true`, `isActive: true`) and associated `AdminProfile`.
  3. Also seeds initial `SystemSetting` defaults (`MAINTENANCE_MODE: false`, `ALLOW_STUDENT_REGISTRATION: true`, `AI_FEATURES_ENABLED: true`).
  4. Wire into `package.json` under `"prisma": { "seed": "tsx prisma/seed.ts" }`.

#### Task A1.3: Update Express Types & Extend `authenticate.ts`
- **Files to Modify:** `backend/src/middleware/authenticate.ts`, `backend/src/app.ts`
- **Files to Create:** `backend/src/types/express/index.d.ts` (or update declare namespace in `authenticate.ts`), `backend/src/routes/admin/index.ts`
- **Actions:**
  1. Declare `Express.Request.user` type to include:
     ```typescript
     interface AuthenticatedUser {
       id: string;
       email: string;
       role: 'STUDENT' | 'ADMIN';
       isActive: boolean;
       studentProfile?: { id: string; courseId?: string | null } | null;
       adminProfile?: { id: string; permissionsLevel: number; departmentId?: string | null } | null;
     }
     ```
  2. Update `authenticate.ts` Prisma query to select both `studentProfile` (including `courseId`) and `adminProfile`.
  3. Mount `/api/v1/admin` in `app.ts` with `authenticate, authorize('ADMIN')`.

---

### Phase A2: User Management Subsystem

- **Files to Create:**
  - `backend/src/schemas/admin/user.schema.ts`
  - `backend/src/services/admin/user.service.ts`
  - `backend/src/controllers/admin/user.controller.ts`
  - `backend/src/routes/admin/user.routes.ts`
- **Endpoints:**
  - `GET /api/v1/admin/users/students`: Query params `{ page, limit, search, isActive, isVerified, courseId }`. Returns paginated list with profile details. Strips sensitive tokens.
  - `GET /api/v1/admin/users/admins`: Query params `{ page, limit, search, departmentId }`. Returns paginated list of administrators.
  - `POST /api/v1/admin/users/admins`: Body `{ email, password, firstName, lastName, departmentId?, permissionsLevel? }`. Creates User (role: ADMIN) + AdminProfile in a transaction and records audit log.
  - `PATCH /api/v1/admin/users/:id/status`: Body `{ isActive: boolean }`. Verifies target is not self; if deactivating an admin, verifies at least 1 other active admin exists. Logs `USER_STATUS_TOGGLED`.
  - `PATCH /api/v1/admin/users/:id/role`: Body `{ role: 'STUDENT' | 'ADMIN' }`. Verifies target is not self; if demoting, verifies other active admins exist; calls `ensureStudentBaseline(tx, user)` on demotion; logs `USER_ROLE_UPDATED`.

---

### Phase A3: Academic Catalog Subsystem & Feeds

- **Files to Create:**
  - `backend/src/schemas/admin/academic.schema.ts`
  - `backend/src/services/admin/academic.service.ts`
  - `backend/src/controllers/admin/academic.controller.ts`
  - `backend/src/routes/admin/academic.routes.ts`
  - `backend/src/controllers/catalog.controller.ts`
  - `backend/src/routes/catalog.routes.ts`
- **Domain Invariants:**
  - `Department.code` and `Course.code` uppercase trimmed strings.
  - `Course.durationYears >= 1`, `Course.totalSemesters >= 1`.
  - `MasterSubject.credits >= 1`, `1 <= MasterSubject.semesterNumber <= Course.totalSemesters`.
  - `AcademicTerm.startDate < AcademicTerm.endDate`.
  - Deletion guards: Cannot delete Department with existing Courses; cannot delete Course with existing MasterSubjects.
- **Admin Endpoints:** Full CRUD on `/departments`, `/courses`, `/master-subjects`, `/terms`.
- **Authenticated Student Feeds:** `GET /api/v1/catalog/departments`, `/courses`, `/subjects?courseId=...`, `/terms`.

---

### Phase A4: Content Management Subsystem & Feeds

- **Files to Create:**
  - `backend/src/schemas/admin/content.schema.ts`
  - `backend/src/services/admin/content.service.ts`
  - `backend/src/controllers/admin/content.controller.ts`
  - `backend/src/routes/admin/content.routes.ts`
  - `backend/src/controllers/content.controller.ts`
  - `backend/src/routes/content.routes.ts`
- **Scope Invariants:**
  - `targetScope = ALL` → `departmentId = null`, `courseId = null`.
  - `targetScope = DEPARTMENT` → `departmentId` required, `courseId = null`.
  - `targetScope = COURSE` → `courseId` required, `departmentId` derived from course.
- **Publishing Semantics:**
  - Drafts created with `isPublished: false`, `publishedAt: null`.
  - `PATCH /admin/content/announcements/:id/publish` sets `isPublished = true`, `publishedAt = now()`.
- **Student Content Feeds:**
  - `GET /api/v1/content/announcements`, `GET /api/v1/content/events`, `GET /api/v1/content/resources`.
  - Filters: `isPublished = true`, `publishedAt <= now`, unexpired, matching target scope for the authenticated user's department/course.

---

### Phase A5: Platform Management Subsystem

- **Files to Create:**
  - `backend/src/schemas/admin/platform.schema.ts`
  - `backend/src/services/admin/platform.service.ts`
  - `backend/src/controllers/admin/platform.controller.ts`
  - `backend/src/routes/admin/platform.routes.ts`
  - `backend/src/controllers/feedback.controller.ts`
  - `backend/src/routes/feedback.routes.ts`
  - `backend/src/middleware/maintenanceMode.ts`
- **Endpoints:**
  - `GET /api/v1/admin/platform/dashboard`: Aggregates live counts (`totalUsers`, `activeStudents`, `activeAdmins`, `totalCourses`, `totalSubjects`, `totalApplications`, `totalAIExecutions`, `pendingFeedbacks`, `publishedAnnouncements`).
  - `GET /api/v1/admin/platform/audit-logs`: Paginated search over `AdminAuditLog` with action/date filters.
  - `POST /api/v1/feedback`: Student submits `{ category, subject, message }`.
  - `GET /api/v1/admin/platform/feedback`: Admin lists feedbacks with status filter.
  - `PATCH /api/v1/admin/platform/feedback/:id`: Admin updates `{ status: 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED', adminNotes }`.
  - `GET /api/v1/admin/platform/settings`: Returns all allow-listed settings.
  - `PATCH /api/v1/admin/platform/settings/:key`: Validates key against allow-list and validates value type (boolean); updates DB and logs audit trail.

---

### Phase A6: Reporting & Telemetry Subsystem

- **Files to Create:**
  - `backend/src/services/admin/report.service.ts`
  - `backend/src/controllers/admin/report.controller.ts`
  - `backend/src/routes/admin/report.routes.ts`
- **Endpoints:**
  - `GET /api/v1/admin/reports/users`: Cohort breakdown by registration period, verification rate %, active vs inactive ratio.
  - `GET /api/v1/admin/reports/academics`: Institutional average attendance %, assignment completion rate %, subject distribution across courses.
  - `GET /api/v1/admin/reports/usage`: Total AI execution count, success rate %, failure rate %, module distribution (Resume vs StudyPlan vs Notes), avg execution duration (ms), job application status distribution.
  - `GET /api/v1/admin/reports/health`: System uptime (seconds), PostgreSQL ping latency (ms), process memory usage (RSS, heapTotal, heapUsed), database connection status.

---

### Phase A7: Full Verification & Stabilization Checkpoint

- **Files to Create:** `backend/scripts/test-admin.ts`
- **Testing Suite:**
  - 30+ assertions covering all 20 admin functionalities, safety guards, role transitions, audit trail emission, student feeds, and maintenance mode gating.
- **Full 5-Suite Regression:**
  - `test-p1-p2.ts` ✅
  - `test-p3-p4.ts` ✅
  - `test-ai-notes.ts` ✅
  - `test-analytics.ts` ✅
  - `test-admin.ts` ✅
- **Documentation & Push:**
  - Update `PROJECT_PROGRESS.md` Section 7 and push to GitHub.

---

## P7 — Final Pre-Execution Checklist

- [x] Strict seed credentials required without default fallbacks.
- [x] Restrictive deletion semantics configured on `AdminAuditLog`, `SystemSetting`, and academic catalog models.
- [x] Dedicated `ContentPriority` enum with `URGENT` support.
- [x] Draft and publishing semantics separated with nullable `publishedAt`.
- [x] Scope targeting invariants defined and enforced in service + student feeds.
- [x] Real system setting enforcement wired into registration, AI, and maintenance middleware.
- [x] Express type declaration extended with `adminProfile`.
- [x] Standardized `/admin/platform/feedback` route structure.
- [x] Reusable `ensureStudentBaseline()` helper centralized for registration and role demotion.
- [x] `AcademicTermType` enum and domain invariants enforced.
- [x] Catalog and content feeds authenticated and scope-filtered.

---

## P8 — Implementation Status & Verification Summary

| Phase | Subsystem / Focus | Status | Git Commit Reference |
|---|---|:---:|---|
| **Phase A1** | Foundation, Schema & Seeding | ✅ **COMPLETE** | `46072ef` |
| **Phase A2** | User Management Subsystem | ✅ **COMPLETE** | `db1cb0e` |
| **Phase A3** | Academic Management Subsystem | ✅ **COMPLETE** | `6276f9f` |
| **Phase A4** | Content Management Subsystem | ✅ **COMPLETE** | `f1ddd01` |
| **Phase A5** | Platform Management & Feedback | ✅ **COMPLETE** | `3fb4d47` |
| **Phase A6** | Reporting & Telemetry Subsystem | ✅ **COMPLETE** | `740d2de` |
| **Phase A7** | Verification, Stabilization & Documentation | ✅ **COMPLETE** | `247bf01` |

> **Administration Portal V1 backend implementation is complete and verified against its 20 promised Administration functionalities.**
