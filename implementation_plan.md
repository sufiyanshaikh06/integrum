# Implementation Plan: Integrum - AI-Powered Student Success Platform

This plan outlines the technical architecture, project structure, engineering standards, and detailed development sequence for **Integrum**, a full-stack web application designed to be an integrated academic, productivity, and career management ecosystem for students.

## 🎯 Goal Description
To design and build an AI-enabled full-stack web application that centralizes a student's academic planning, productivity tracking, and career preparation. The platform will replace multiple disconnected tools with a unified experience.

## 🚨 Technical Decisions Finalized
> [!NOTE]
> Based on the review, the following technical decisions are locked in:
> * **UI Library:** Tailwind CSS + shadcn/ui + Framer Motion (for subtle micro-animations).
> * **Authentication:** Custom JWT authentication with bcrypt using Express (No Supabase Auth).
> * **AI Provider:** Abstracted AI service (e.g., `AIService` interface) to easily swap between LLM providers (Gemini, OpenAI, Claude).
> * **Validation:** Zod for shared schema validation across frontend, backend, and API.

## 🏗️ Proposed Architecture

The system follows a Layered Three-Tier Architecture:

### 1. Presentation Layer (Frontend)
- **Framework**: React with TypeScript (bootstrapped via Vite).
- **Styling**: Tailwind CSS + shadcn/ui + Framer Motion.
- **State Management**: React Context / Zustand.
- **Routing**: React Router.

### 2. Business Logic Layer (Backend)
- **Framework**: Node.js with Express.js (TypeScript).
- **Architecture**: Modular API design (Controllers, Services, Routes).
- **Authentication**: JWT with bcrypt.
- **AI Integration**: Abstracted `AIService` interface for LLM integrations.

### 3. Data Layer (Database)
- **Database**: PostgreSQL (Supabase PostgreSQL or Neon).
- **ORM**: Prisma ORM for type-safe database interactions and migrations.

## 📦 Directory Structure & Shared Types

We will use a monorepo-style structure containing three main directories:

```text
integrem/
├── shared/                   # Shared TypeScript types and Zod schemas
│   ├── types/                # Interfaces (User, Assignment, StudyPlan)
│   ├── schemas/              # Zod validation schemas
│   └── constants/            # Shared constants and enums
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # shadcn/ui and custom components
│   │   ├── pages/            # Page-level components
│   │   ├── services/         # API integration
│   │   └── ...
└── backend/                  # Node.js/Express backend
    ├── prisma/               # Prisma schema and migrations
    ├── src/
    │   ├── controllers/      # Request handlers
    │   ├── services/         # Business logic & AI abstractions
    │   ├── routes/           # REST endpoints
    │   ├── middlewares/      # Zod validation, JWT verification
    │   └── ...
```

## 📐 Engineering & Naming Standards

To maintain consistency, we will strictly enforce the following standards:

### Naming Conventions
* **Files & Folders**: `kebab-case` (e.g., `user-controller.ts`, `study-planner/`)
* **React Components**: `PascalCase` (e.g., `StudyPlanner.tsx`, `DashboardCard.tsx`)
* **React Hooks**: `camelCase` (e.g., `useAuth`, `useFetchAssignments`)
* **Variables & Functions**: `camelCase` (e.g., `getUserById`, `isCompleted`)
* **Constants & Enums**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`, `Roles.ADMIN`)
* **Types, Interfaces, Classes, DTOs & Prisma Models**: `PascalCase` (e.g., `UserDto`, `Assignment`, `StudyPlan`)

### Quality & CI/CD
* **Formatting & Linting**: ESLint + Prettier.
* **Commit Conventions**: Conventional Commits (e.g., `feat:`, `fix:`, `chore:`).
* **Testing**: Continuous testing (Unit and Integration) during every sprint, not deferred to the end.
* **CI Pipeline**: GitHub Actions running on every push:
  * `npm run lint`
  * TypeScript compilation (`tsc`)
  * `npm test`
  * Prisma schema validation

## 🚀 Revised Engineering Order

We will follow a professional engineering sequence to ensure a solid foundation before coding UI or controllers.

### Phase 1: Engineering Standards & Repository Setup
- Initialize Git repository.
- Setup `frontend`, `backend`, and `shared` workspaces.
- Configure ESLint, Prettier, TypeScript, and GitHub Actions CI pipeline.

### Phase 2: Domain Modeling & Database Design
- Identify core entities: `Student`, `Semester`, `Subject`, `Assignment`, `StudyPlan`, `Task`, `Resume`, `Skill`, `InternshipApplication`, `PlacementApplication`, `Reminder`, `AnalyticsSnapshot`, `Admin`, `Announcement`.
- Design relationships, constraints, and indexes.
- Create the ER Diagram and finalize the `schema.prisma`.
- Formulate database migration and seeding strategy.

### Phase 3: REST API & Authentication Specification
- Design REST API endpoints, request/response formats, HTTP status codes, and pagination/filtering rules.
- Design JWT-based authentication and role-based authorization requirements.
- Define shared Zod validation schemas in the `shared` directory.

### Phase 4: UI/UX & Design System
- Setup Tailwind CSS, shadcn/ui, and Framer Motion.
- Establish design tokens (colors, typography).
- Build layout wireframes and reusable core components (Buttons, Inputs, Cards, Navigation).

### Phase 5: Core Implementation (Sprints)
- **Sprint 1 - Identity**: Registration, Login, JWT Middleware, Student Profiles.
- **Sprint 2 - Academic Hub**: Subjects, Assignments, Attendance, Study Planner endpoints and UI.
- **Sprint 3 - Productivity & Career Hub**: Tasks, Reminders, Resumes, Skills, Internships.
- **Sprint 4 - Analytics Foundation**: Aggregate data for Academic, Career, and Productivity metrics *before* AI features.
- **Sprint 5 - AI Intelligence Hub**: Implement abstracted `AIService` and connect LLM APIs for Resume Review, Study Planning, and Notes summarization.

### Phase 6: Continuous Testing & Deployment
- Final integration testing and bug fixes.
- Deploy database to Supabase/Neon.
- Deploy Backend to Render.
- Deploy Frontend to Vercel.
- Final documentation and report generation.

## ❓ Open Questions
> [!WARNING]
> The plan is now aligned with professional software engineering standards. Please review the revised engineering order and let me know if you approve this approach so we can begin **Phase 1: Engineering Standards & Repository Setup**.
