# Phase 2A: Domain Modeling (Integrum)

This document establishes the conceptual blueprint for the Integrum platform. Before defining the database schema, we must map out the core business entities, their properties, relationships, and business rules.

## Enums (Domain Constants)
Before defining entities, we establish our core enumerations:
- **Role**: `STUDENT`, `ADMIN`
- **AssignmentStatus**: `PENDING`, `SUBMITTED`, `GRADED`
- **Priority**: `HIGH`, `MEDIUM`, `LOW`
- **TaskStatus**: `TODO`, `IN_PROGRESS`, `DONE`
- **SkillCategory**: `TECHNICAL`, `SOFT`
- **ApplicationStatus**: `APPLIED`, `INTERVIEWING`, `OFFERED`, `REJECTED`
- **NotificationType**: `ASSIGNMENT_REMINDER`, `AI_INSIGHT`, `PLACEMENT_ALERT`, `ADMIN_ANNOUNCEMENT`

## Core Entities & Boundaries

### 1. Identity, Access & Settings
- **User**: The root entity of the system handling authentication.
  - *Attributes*: ID, Email, PasswordHash, Role, IsVerified, CreatedAt, UpdatedAt.
  - *Relationships*: Has one `StudentProfile` OR one `AdminProfile`. Has one `StudentSettings`. Has many `Notification`.
- **StudentProfile**: Contains personalized data for a student.
  - *Attributes*: FirstName, LastName, University, EnrollmentYear, GraduationYear.
  - *Relationships*: Belongs to `User`. Has many `Semester`, `Task`, `StudyPlan`, `Resume`, `Skill`, `StudentAnalytics`, `AIInteraction`.
- **AdminProfile**: Contains personalized data for administrators.
  - *Attributes*: FirstName, LastName, Department, PermissionsLevel.
  - *Relationships*: Belongs to `User`.
- **StudentSettings**: User preferences for V1.
  - *Attributes*: NotificationPreferences (JSON), DefaultSemesterId.
  - *Relationships*: Belongs to `User`.
- **Notification**: Universal notification system.
  - *Attributes*: Title, Message, Type (NotificationType), TriggerTime, IsRead.
  - *Relationships*: Belongs to `User`.

### 2. Academic Hub (Ownership: Profile -> Semester -> Subject)
- **Semester**: Represents an academic term.
  - *Attributes*: Name (e.g., "Fall 2026"), StartDate, EndDate.
  - *Relationships*: Belongs to `StudentProfile`. Has many `Subject`.
- **Subject**: A course the student is currently taking.
  - *Attributes*: Name, Code, Credits, TargetGrade, TotalClasses, AttendedClasses.
  - *Relationships*: Belongs to `Semester`. Has many `Assignment`, `Note`.
- **Assignment**: Academic deliverables.
  - *Attributes*: Title, Description, DueDate, Priority, Status.
  - *Relationships*: Belongs to `Subject`.
- **Note**: Study materials or lectures.
  - *Attributes*: Title, Content, FileUrl, Tags.
  - *Relationships*: Belongs to `Subject`.
- **StudyPlan**: AI-generated or manually created schedule for studying.
  - *Attributes*: Title, TargetDate, Goals.
  - *Relationships*: Belongs to `StudentProfile`. Has many `Task`.

### 3. Productivity & Analytics Hub
- **Task**: Generic to-do items (can be academic or personal).
  - *Attributes*: Title, Description, DueDate, Status.
  - *Relationships*: Belongs to `StudentProfile`. Optionally belongs to `StudyPlan`.
- **StudentAnalytics**: Derived data (materialized view/cache) aggregating academic and career metrics.
  - *Attributes*: AttendancePercentage, TaskCompletionRate, AverageAtsScore, LastCalculated.
  - *Relationships*: Belongs to `StudentProfile`.
  - *Note*: This is derived data updated by system processes, not primary editable data.

### 4. Career Hub
- **Resume**: The parent container for a student's resume.
  - *Attributes*: Title, IsActive.
  - *Relationships*: Belongs to `StudentProfile`. Has many `ResumeVersion`.
- **ResumeVersion**: Enables version history without overwriting previous iterations.
  - *Attributes*: Content (JSON/Markdown), AtsScore, Feedback, CreatedAt.
  - *Relationships*: Belongs to `Resume`.
- **Skill**: Tracked technical and soft skills.
  - *Attributes*: Name, Category, ProficiencyLevel.
  - *Relationships*: Belongs to `StudentProfile`.
- **JobApplication**: Tracked internships and placements.
  - *Attributes*: CompanyName, Role, AppliedDate, Status.
  - *Relationships*: Belongs to `StudentProfile`.

### 5. AI Execution History
- **AIExecutionLog**: Records metadata of AI operations rather than full conversation history.
  - *Attributes*: Module, Operation, Status, StartedAt, CompletedAt, Duration, ModelUsed, ErrorMessage.
  - *Relationships*: Belongs to `StudentProfile`.

## Business Rules
1. **Separation of Concerns**: A `User` handles authentication; `StudentProfile` and `AdminProfile` handle domain logic.
2. **Cascading Deletes**: If a `StudentProfile` is deleted, all their academic, career, and AI execution data must be purged.
3. **Resume Versioning**: When a user updates a resume via AI or manually, a new `ResumeVersion` is created rather than overwriting the active one.
4. **Ownership Principle**: Every domain entity has exactly one primary owner. Child entities reference only their immediate parent. Relationships to higher-level entities are traversed through the ownership hierarchy rather than duplicated (e.g., Assignment → Subject → Semester → StudentProfile).
5. **Analytics Consistency**: `StudentAnalytics` is strictly derived/cached data calculated from academic and career entities. It is never edited manually.
