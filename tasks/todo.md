# Integrum Anti-Slop Redesign, Functionality Repair & Regression Checklist

## Phase 1: Visual Design & Anti-Slop Redesign (`design-taste-frontend`)
- [x] Task 1: Update design tokens, font links (Instrument Sans/Serif), and remove global hairlines/shadows/gradients
- [x] Task 2: Purge generic AI marketing SaaS boilerplate (cards, fake sales pitch, generic testimonials) and replace with authentic academic instruments:
  - Official October 2026 Examination Schedule table (`data-ui="exam-roster"`)
  - University Attendance Ordinance 6086 mathematical calculation & interactive simulator (`data-ui="safe-bunk-calc"`)
  - Semester 5 Curriculum Specifications matrix (`data-ui="curriculum-matrix"`)
  - Historical electrical engineering lecture hall archival photograph (Wikimedia Commons) with academic provenance caption
- [x] Task 3: Overhaul `LoginPhase.tsx`, `Header.tsx`, `Sidebar.tsx`, `Modals.tsx`, and all view components to remove emoji and assistant-purple accents
- [x] Task 4: Run `lint.mjs` and `inspect.mjs` to achieve 0 FAIL and clean measurements across 1440px, 768px, and 390px viewports

## Checkpoint 1: Design Gate Passed
- [x] `lint.mjs` returns 0 FAIL (0 FAIL across all 29 source files)
- [x] `inspect.mjs` returns 0 FAIL, 1 defended WARN (`[below-fold]`)
- [x] Visual screenshots reviewed and verified (`desktop-fold.jpg`, `tablet-fold.jpg`, `mobile-fold.jpg`)

## Phase 2: Functionality Restoration & Defect Resolution
- [x] Task 5: Fix session persistence & page reload kickout in `App.tsx` (restore session from HttpOnly cookie without eviction)
- [x] Task 6: Implement resilient authentication (Student login, Admin login, and Registration) with offline fallback and profile name resolution (`Sufiyan Shaikh`)
- [x] Task 7: Synchronize simulator state with persistent student workspace & align safe-bunk math
- [x] Task 8: Verify end-to-end user workflows across views

## Checkpoint 2: Functionality Operational
- [x] Page reload in workspace retains active session
- [x] Login and Registration succeed reliably
- [x] Task, attendance, and study workflows operate without console errors

## Phase 3: Comprehensive Regression Testing
- [x] Task 9: Run backend test suites (`test-day1.test.ts`, `test-production-hardening.ts`) -> ALL PASSED
- [x] Task 10: Run real-browser end-to-end tests (`test-browser-workflow.ts`) -> ALL 13 STAGES PASSED
- [x] Task 11: Production build and native regression verification (`test-native.mjs`) -> ALL PASSED (exit code 0)

## Phase 4: Creative 3D WebGL Frontend & Real-World Profile System (`creative-3d-frontend`)
- [x] Task 12: Install `.agents/skills/creative-3d-frontend/SKILL.md` with instructions for 3D WebGL, modern typography, fluid mobile responsiveness, and input underlines
- [x] Task 13: Install `three` and `@types/three`; build `ThreeHeroCanvas.tsx` (interactive 3D academic crystal polyhedron, orbiting cycles, stellar particles, pointer/touch tracking, `IntersectionObserver` pause)
- [x] Task 14: Overhaul `LandingPhase.tsx`:
  - Header: Only Student Sign In & Student Register; NO administration login on the header
  - Hero: Asymmetric layout with 3D WebGL canvas
  - Student & platform capabilities: Regulation 6086 Safe-Bunk Calculator & Simulator, Exam Timetable, Curriculum Matrix
  - Dedicated Platform FAQ accordion section above Faculty Governance
  - Faculty & University Administration Governance section near ending with "Request a Demo" modal and "Faculty & Admin Sign In" entry point
  - Footer & About section with institutional overview, official GitHub repository links, and architecture references
- [x] Task 15: Overhaul `LoginPhase.tsx`:
  - Underline text input styling on all text bars
  - Show/Hide password toggle buttons on all password fields
  - Confirm Password field with real-time matching indicator on student registration
  - Purged all "Ahmed Khan" or "example.com" placeholders
  - Dedicated views for Student Login, Student Registration, and Faculty/Admin Sign In
- [x] Task 16: Purge mock/stale data for newly registered profiles in `App.tsx` and views:
  - Clean slate (`tasks = []`, `assignments = []`, `notes = []`, `subjects = []`) for new registrations
  - Inviting empty states with "+ Add Subject" / "+ Add Task" calls-to-action
- [x] Task 17: Full automated verification:
  - `npm run build`: built in 626ms
  - `test-browser-workflow.ts`: 13/13 real browser stages passed (exit code 0)
  - `test-native.mjs`: all migration, row-lock, closure, smoke, and browser suites passed (exit code 0)

## Phase 5: Feedback Resolution, Logo Standardization, Bunk Purge & Advisor Redesign
- [x] Task 18: Logo standardization with circular border and italic *i* slanting toward top-right corner in `IntegrumLogo.tsx`, `LandingPhase.tsx`, `Sidebar.tsx`, `Header.tsx`, and `LoginPhase.tsx`
- [x] Task 19: Complete removal of "Safe Bunk" / "bunk" terminology across all components, views, calculations, tooltips, and styles (0 occurrences in repo)
- [x] Task 20: Redesign Landing Page to focus on product pillars (Attendance Health, Course Hub, Study Sprints, Unified Calendar, Career Hub, AI Advisor) instead of raw exam/syllabus tables
- [x] Task 21: Modal architecture fixes:
  - Full-viewport centered modal overlay (`.modal-overlay.open`)
  - Request Institutional Demo dialog perfectly centered
  - Modal footers configured with Cancel on the left and Save/Submit on the right (`justify-content: space-between`)
- [x] Task 22: Tactile button improvements:
  - `.btn` default padding, radius, hover elevation, and `:active` click transforms (`translateY(1px)`)
  - Fixed stretched pipe Save button in `ProfileView.tsx`
  - Consistently right-aligned and padded Add buttons across all views
- [x] Task 23: Profile & Settings overhaul:
  - Removed "academic identity" and exam venue allocations
  - Real display settings (Dark/Light mode toggle, compact density, notification preferences)
  - Account security & password management
  - Local JSON workspace backup & data portability
- [x] Task 24: AI Academic Advisor overhaul (`AIAssistantView.tsx`):
  - Fixed-height container with scrollable message history (like ChatGPT)
  - Pinned bottom input bar that does not move down on prompt entry
  - Auto-scroll to latest message
  - Genuine, comprehensive technical responses for algorithms, database normalization, study revision plans, and attendance standing
- [x] Task 25: Automated Regression Verification:
  - `frontend` production build: built in 548ms (exit code 0)
  - `backend` compilation: TypeScript & Prisma generated cleanly (exit code 0)
  - `test-browser-workflow.ts`: 13/13 real browser stages passed (exit code 0)
  - `test-native.mjs`: all test suites (row-lock, migrations, types, seed, closure, smoke, browser) passed (exit code 0)
