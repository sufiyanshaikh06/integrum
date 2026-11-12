# PRD: Integrum (AI-Powered Student Success Platform)

**Status:** Approved | **Owner:** Product & Engineering | **Last Updated:** 2026-11-11

---

## 1. Problem Statement

Higher education students, faculty, and academic administrators currently navigate a fragmented web of disconnected point solutions:
- **Students** manage their academic life across siloed tools: institutional portals for registration, spreadsheets for attendance tracking, Google Drive/WhatsApp for study notes, external sites for resume drafting, and personal to-do apps for deadlines. This fragmentation leads to attendance shortfalls, missed coursework deadlines, and uncoordinated exam preparation.
- **Faculty & Department Heads (HODs)** struggle with manual cohort tracking, lack real-time visibility into student attendance deficits, and spend hours configuring course rosters and syllabus lecture delivery quotas.
- **Independent Learners** seeking self-paced academic structure are excluded or burdened by rigid, institution-specific LMS bureaucracy when they simply need a structured study ecosystem.

**Integrum** solves this by unifying academic course governance, attendance tracking, AI-assisted study planning, personal productivity, and career lifecycle management into a single, cohesive, multi-tenant web application.

---

## 2. Target Personas

### Primary Personas
1. **Institutional College/Engineering Student (Undergraduate/Postgraduate):** Needs immediate access to their semester curriculum, real-time calculations on how many lectures they can safely miss or need to attend to maintain 75%, deadline tracking, and AI-assisted exam preparation.
2. **Independent Learner:** Self-directed learner who needs a distraction-free, personal study workspace to organize learning goals, manage personal notes, build resumes, and track job applications without institutional clutter.

### Secondary Personas
3. **Department Head / Institutional Administrator:** Requires institutional governance tools to provision locked registration codes (e.g., `CSE-2026-S5`), monitor cohort enrollment capacity, inspect faculty workload, and broadcast official circulars.
4. **Faculty Member / Course Lecturer:** Responsible for delivering 40 lectures per course, recording attendance, evaluating assignments, and providing student academic feedback.

---

## 3. Goals and Non-Goals

### Measurable Goals (v1)
- **G1 (Frictionless Onboarding):** An institutional student signs up with an institution code and roll number, automatically inheriting their locked 5-course semester curriculum, 40-lecture target, and 75% attendance threshold in **under 60 seconds**.
- **G2 (Real-Time Attendance Intelligence):** Instantaneous calculation of lecture attendance percentage, safe margin calculation ("can miss X more lectures" or "must attend Y consecutive lectures"), with automated low-attendance warnings when falling below 75%.
- **G3 (Sub-5s AI Study Planning):** AI-generated personalized study plans breakdown complex course syllabi into scheduled study sessions within **5 seconds** (backed by Google Gemini with graceful offline fallback).
- **G4 (Integrated Career Readiness):** End-to-end career toolkit enabling students to maintain a categorized skill matrix, build standardized resumes, and track job application statuses across a Kanban pipeline.
- **G5 (Strict Role Isolation):** 100% boundary isolation between administrative governance views (`/api/v1/admin/*`) and student personal workspaces (`ADR-001`).

### Explicit Non-Goals (v1)
- **NG1 (No Native Mobile Apps):** Responsive Progressive Web App (PWA) only; no native iOS (Swift) or Android (Kotlin) app store binaries in v1.
- **NG2 (No Real-Time Social Chat):** No peer-to-peer instant messaging or direct student-to-student social feeds. Communication is strictly asynchronous via official department announcements and circulars.
- **NG3 (No Financial / Tuition Payment Gateway):** Integrum does not process tuition fees, lab dues, or bursary payments in v1.
- **NG4 (No Hardware Biometric Hardware Integration):** Lecture attendance is recorded digitally by authenticated faculty or verified administrators, not physical RFID/fingerprint turnstiles.

---

## 4. Features & Priorities (P0 / P1 / P2)

| ID | Feature | Priority | Target Persona | Description |
|---|---|---|---|---|
| **F1** | Multi-Tenant Auth & Registration Engine | **P0** | All Roles | Email/password authentication, JWT HTTP-only cookies, role selection, dynamic code validation (`CSE-2026-S5`), and independent learner toggle. |
| **F2** | Locked Curriculum & Attendance Tracking | **P0** | Student, Faculty | Automatic 5-course semester provisioning, 40-lecture targets, 75% threshold, status indicators (Safe/Warning/Deficit), and session-by-session marking. |
| **F3** | AI Study Planner & Assistant | **P0** | Student | Syllabus topic ingestion, exam target breakdown, structured study session generation using Google Gemini with offline mock fallback. |
| **F4** | Student Productivity Suite | **P0** | Student | Personal task manager (Todo/In Progress/Done), rich markdown notes, calendar event synchronization, and proactive reminders. |
| **F5** | Department Registration Code Engine | **P1** | Admin, HOD | Generate semester-locked admission codes, configure max cohort capacity (`maxUses`), toggle active status, and drill down into registered rosters. |
| **F6** | Career Hub & Resume Builder | **P1** | Student | Technical & soft skills matrix, structured resume generator with PDF export, and job application Kanban/list pipeline tracker. |
| **F7** | Cloud File Storage & Lifecycle Cleanup | **P1** | Student, Admin | Secure upload for note attachments and profile photos via Supabase Storage with automated DB queue cleanup (`StorageCleanupQueue`). |
| **F8** | Administrative Governance & Analytics | **P2** | Admin, Super Admin | Campus audit logs, faculty lecture delivery gauges, NAAC accreditation profile fields, and server-side PDF dossier export. |
| **F9** | Design System & Theme Customization | **P2** | All Roles | 5 curated color presets (Plum, Pine Teal, Slate Indigo, Royal Periwinkle, Apricot), 3D WebGL hero canvas, dark/light/system theme toggles. |

---

## 5. User Stories & Acceptance Criteria

### US-1 (F1): Institutional Student Registration with Locked Curriculum
> **As an** institutional student  
> **I want to** enter my institution registration code (e.g. `CSE-2026-S5`) and University Roll Number during sign-up  
> **So that** my semester courses, attendance goals, and department notifications are instantly configured without manual data entry.

**Acceptance Criteria:**
- [ ] Given a valid, active registration code with remaining capacity (`usedCount < maxUses`), registration succeeds and increments `usedCount`.
- [ ] Automatically links the student to the matching `Institution`, `Department`, and `Semester`.
- [ ] Automatically provisions the 5 semester master `Subject` records, setting baseline attendance tracking (40 lectures per course, 75% target).
- [ ] Entering an invalid or expired code returns a descriptive error: `"Invalid or expired department registration code"`.
- [ ] Registration sets secure, HTTP-only `accessToken` and `refreshToken` cookies; user lands on the populated Dashboard.

### US-2 (F2): Attendance Margin & Low-Attendance Alert
> **As a** student  
> **I want to** see exactly how many more lectures I can miss or must attend  
> **So that** I stay above the mandatory 75% institutional threshold.

**Acceptance Criteria:**
- [ ] Course card displays total lectures conducted, lectures attended, and current percentage.
- [ ] If percentage >= 75%: displays green badge with count of safe lectures that can be missed before falling below 75%.
- [ ] If percentage < 75%: displays red warning badge with count of consecutive lectures required to recover to 75%.
- [ ] Recalculation is atomic via `attendance-consistency.ts` upon each newly logged attendance record.

### US-3 (F3): AI-Assisted Study Plan Creation
> **As an** independent or institutional learner  
> **I want to** generate an optimized study plan for an upcoming exam  
> **So that** I have a structured daily revision roadmap.

**Acceptance Criteria:**
- [ ] User provides course subject, target exam date, and key syllabus topics.
- [ ] System calls Google Gemini API via `gemini.provider.ts` with a 10-second timeout.
- [ ] On network or API failure, system gracefully falls back to `mock.provider.ts` without crashing or returning an unhandled 500.
- [ ] Returns structured JSON validated with Zod, persisting a `StudyPlan` record and discrete `StudySession` tasks linked to the user.

### US-4 (F5): Dynamic Department Registration Code Generation
> **As a** Department Head (HOD)  
> **I want to** generate cohort registration codes locked to an academic year and semester  
> **So that** only admitted students in my department can access the departmental curriculum.

**Acceptance Criteria:**
- [ ] HOD selects Semester (1–8), Academic Year (e.g., 2026), and maximum student cohort capacity (`maxUses`).
- [ ] Code is uniquely generated (e.g. `CSE-2026-S5`).
- [ ] HOD can toggle the code active/inactive at any time to immediately close or reopen registration.
- [ ] Drilldown modal lists the full roster of students registered via that code with roll numbers.

---

## 6. Key User Flows

### Flow 1: Institutional Student Onboarding
```
Landing Page (/)
   │
   ▼
[Sign In / Register Modal]
   │
   ├── Select Role: Student
   ├── Enter Name, Email, Password
   ├── Enter Roll Number (e.g. 2625001)
   └── Enter Department Code (e.g. CSE-2026-S5)
         │
         ▼
[Server: Validate Code -> Create User -> Bind Department -> Provision 5 Subjects -> Issue Cookies]
         │
         ▼
Dashboard (/dashboard)
   └── Populated with Semester 5 Subjects, 40-lecture quotas, and 75% attendance targets
```

### Flow 2: Independent Learner Onboarding
```
Landing Page (/)
   │
   ▼
[Sign In / Register Modal]
   │
   ├── Toggle "Register as Independent Learner"
   ├── Enter Name, Email, Password
   └── (No Roll Number or Institution Code required)
         │
         ▼
[Server: Create Independent User -> Issue Cookies]
         │
         ▼
Personal Workspace (/dashboard)
   └── Clean workspace; attendance displays connection prompt; full access to Notes, Tasks, AI, Resumes
```

---

## 7. Screen & View Inventory

The frontend SPA implements the following dedicated views:

| Route / Stage | Component View | Description | Access Roles |
|---|---|---|---|
| `/` (Landing) | `LandingPhase.tsx` | Marketing hero with Three.js 3D canvas, feature highlights, and curriculum showcase | Public |
| `/login` | `LoginPhase.tsx` | Authentication portal with role switcher, student code inputs, and independent learner toggle | Public |
| `/dashboard` | `DashboardView.tsx` | Main command center: academic status, attendance gauges, upcoming deadlines, AI insights | All Authenticated |
| `/attendance` | `AttendanceView.tsx` | Course-by-course attendance grid, 75% threshold gauges, safe margin indicators | Student, Faculty |
| `/study` | `StudyView.tsx` | AI study plan generator, active study sessions, revision timelines, syllabus notes | Student, Independent |
| `/assignments`| `AssignmentsView.tsx` | Coursework submissions, due date tracker, grade indicators | Student, Faculty |
| `/tasks` | `TasksView.tsx` | Kanban / list task tracker with priority tagging (Low, Medium, High) | All Authenticated |
| `/notes` | `NotesView.tsx` | Rich markdown note-taking with cloud attachments and course tagging | All Authenticated |
| `/reminders` | `RemindersView.tsx` | Timed reminders with automated notification delivery queue | All Authenticated |
| `/calendar` | `CalendarView.tsx` | Unified schedule: lecture times, exam dates, assignment deadlines, study sessions | All Authenticated |
| `/skills` | `SkillsView.tsx` | Technical and soft skills proficiency matrix with progress tracking | Student, Independent |
| `/resumes` | `ResumesView.tsx` | Section-based resume builder with live preview and JSON/PDF export | Student, Independent |
| `/jobs` | `JobsView.tsx` | Job and internship application tracker (Applied, Interviewing, Offered, Rejected) | Student, Independent |
| `/ai` | `AIAssistantView.tsx` | Conversational academic assistant: syllabus queries, summarization, exam tips | All Authenticated |
| `/profile` | `ProfileView.tsx` | Segregated role profile (Institution Admin, HOD, Faculty, Student) with theme switcher | All Authenticated |
| `/admin` | `AdminView.tsx` | Department codes, cohort capacity, faculty assignments, system audit logs | Admin, Super Admin |

---

## 8. Open Questions & Roadmap

- [ ] **PWA Offline Sync:** Should local notes and tasks be cached in IndexedDB for full offline editing when disconnected from the server? *(Target: v1.1)*
- [ ] **Syllabus PDF Parsing:** Enable direct upload of university syllabus PDFs to automatically parse course codes and topics using Gemini Vision. *(Target: v1.2)*
- [ ] **Email Digest Notifications:** Expand reminder processor to send scheduled morning email digests via Resend. *(Target: v1.1)*
