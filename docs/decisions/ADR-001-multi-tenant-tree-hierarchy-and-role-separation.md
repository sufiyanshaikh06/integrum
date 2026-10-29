# ADR-001: Multi-Tenant Tree Hierarchy, Locked Semester Registration Codes, and Role-Specific Profile Segregation

## Status
Accepted

## Date
2026-10-29

## Context
EduSphere / Integrum required a robust, scalable architectural model for campus governance, academic curriculum provisioning, and multi-tenant user access:
1. **Tree Hierarchy**: The platform needed a clear ownership model from Root (Super User / Platform Owner) down to Nodes (Institutions / Universities), Branches (Departments such as CSE, IT), Leaves (Faculty members and Students).
2. **Registration & Locked Curricula**: Rather than having students manually select and configure courses and attendance thresholds, institutional students must register using an institution code (e.g. `CSE-2026-S5`) and a university-assigned roll number format (e.g. `2625001`). Upon registration, the student must automatically inherit the exact locked semester curriculum (5 courses), lecture delivery targets (40 lectures per course), and attendance threshold (75%).
3. **Independent Learner Isolation**: Students without an institutional affiliation must be able to register as Independent Learners, receiving a clean, distraction-free workspace completely free of institutional exam circulars, lecture schedules, and attendance requirements.
4. **Dedicated Profile Segregation**: Institutional Admins, Department Heads (HODs), Faculty members, and Students perform radically different functions. They cannot share a monolithic or student-centric profile page. Each role requires dedicated profile interfaces with appropriate identity metrics, governance controls, and teaching responsibilities.

## Decision
We implemented a hierarchical multi-tenant tree structure in both the PostgreSQL schema (via Prisma ORM) and the React frontend:

### 1. Hierarchical Authority Tree
- **Level 0 (Root / Super User)**: System Owner with root permissions. Provisions `Institution` entities and appoints master `Institution Admin` accounts (`Role: SUPER_ADMIN`, `Role: INSTITUTION_ADMIN`).
- **Level 1 (Node / Institution Admin)**: Governs the university or college campus (`Institution`). Has rights to provision `Department` entities (CSE, IT, etc.) and appoint `Department Heads` (HODs).
- **Level 2 (Branch / Department Head)**: Governs the specific academic branch. Has rights to create/assign `FacultyProfile` members, configure semester curricula (Semester 1–8), and generate active `DepartmentRegistrationCode` records.
- **Level 3 (Staff / Faculty Member)**: Teaching lecturers and lab in-charges (`Role: FACULTY`). Delivers scheduled lectures towards the 40-lecture quota, marks lecture attendance, evaluates coursework, and posts department circulars.
- **Level 4 (Leaves / Students)**:
  - **Institutional Student**: Enrolls via `institutionCode` (`CSE-2026-S5`) and assigned roll number (`2625001`). Automatically provisioned with the department's 40-lecture master course curriculum and connected to institutional exam schedules and circulars.
  - **Independent Learner**: Registers via an explicit toggle without code/roll number. Receives a private personal workspace with zero institutional clutter (attendance and calendar views display clear connection prompts rather than institutional data).

### 2. On-the-Fly Registration Code Engine
Implemented in `AdminView.tsx`:
- Generates codes locked to Semester (1–8) and Academic Year (e.g. `CSE-2026-S5`).
- Configures maximum cohort seat capacity (`maxUses`) and tracks real-time enrollments (`usedCount`).
- Provides active/inactive toggles to open or close admissions.
- Provides a drilldown modal showing the exact roster of students registered via that code.

### 3. Dedicated Role-Specific Profile Views
Implemented in `ProfileView.tsx`:
- **Institution Admin Profile**: Displays Institution Name, Code (`MU-ENG`), NAAC Accreditation, Official Website, Contact Phone, and Managed Departments count.
- **Department Head Profile**: Displays Department Name, Code (`CSE`), HOD Designation, Faculty Count, Enrolled Students Count, and Active Codes summary.
- **Faculty Member Profile**: Displays Faculty ID (`FAC-2026-08`), Academic Designation, Department, Specialization, Office Consultation Hours, and Assigned Courses with lecture progress gauges.
- **Student Profile**: Displays Student Roll Number (`2625001`), Branch & Semester, Institutional connection badge, 3-way Theme Selector (`Auto System`, `Light`, `Dark`), and JSON Workspace Export/Import.
- Includes a top perspective switcher allowing administrators and faculty to inspect and update each role's profile.

## Alternatives Considered

### Alternative 1: Flat Role System with Manual Course Selection
- **Pros**: Fewer database models.
- **Cons**: Burdened students with configuring individual course codes, lecture counts, and attendance goals. Error-prone and unrealistic for university cohorts.
- **Rejected**: Does not fulfill university workflow requirements.

### Alternative 2: Unified Single Profile View with Conditional Fields
- **Pros**: Single component with simple form.
- **Cons**: Cluttered form fields where teachers would see student GPA and students would see accreditation inputs; lacked domain-specific metrics.
- **Rejected**: The user explicitly requested separate profile pages so each tier can manage effectively.

## Consequences
- **Positive**: Strict data integrity, zero manual setup for incoming students, real-time cohort visibility for department heads, and clear role boundaries.
- **Operational**: Department registration codes must be generated before student admission batches open.
- **Verification**: Verified via `cmd /c npm run build:backend` and `cmd /c npm run build:frontend`, both exiting with code 0 and zero TypeScript errors.
