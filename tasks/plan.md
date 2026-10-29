# Implementation Plan: Integrum Anti-Slop UI Redesign, Functional Restoration & Full Project Regression

## Overview
Transform Integrum from generic "AI-slop" styling into a clean, editorial, production-grade academic platform while repairing all broken frontend logic, authentication lifecycles, and state synchronization. Once both design and functionality are restored to a high standard, execute comprehensive regression verification across both frontend (browser inspector + lint) and backend suites.

---

## Architecture & Design Decisions

### 1. Art Direction & Typography (`design-taste-frontend` Workspace Spec)
- **Primary Typeface:** `Instrument Sans` (400, 500, 600) with tabular figures (`tabular-nums`) for all academic metrics, timestamps, and calculator displays.
- **Display Accent:** `Instrument Serif` (400, 500) for select editorial titles only (no mid-sentence italic styling).
- **House Palette:**
  - Page Ground: `#ffffff`
  - Tonal Surface: `#f9f9f9`
  - Deep Ink: `#1f201d`
  - Muted Text: `#636361`
  - Academic Accent: `#1b6e66` (Deep Spruce Teal)
  - Semantic Status: Positive `#2e7d32` / Warning `#92400e` / Negative `#b42318`
- **Strict House Rules Enforcement:**
  - Zero emoji as UI icons. Use clean typography, authentic unicode structural marks, or real imagery.
  - No 1px hairlines / thin rules where unnecessary; separate sections by tonal steps and generous white space (120–240px gaps).
  - No resting box-shadows or gradients; shadows only on floating overlays (modals, dropdown menus).
  - No pill badges / eyebrows above headings.
  - Headlines constrained to $\le 2$ lines across all viewports (1440px, 768px, 390px).
  - Real interface fragments marked `data-ui` with real academic course ledgers.

### 2. Functional Architecture & Offline-First Resilience
- **Persistent Session State:** Stop `checkAuth()` on initial mount from blindly evicting authenticated students to the landing page on reload when the backend is offline. Retain local-first session credentials gracefully.
- **Authentication Resilience:** Enable robust fallback authentication in `handleStudentLogin`, `handleAdminLogin`, and `handleRegister` so the user is never locked out with `Failed to fetch`.
- **Bidirectional State Synchronization:** Connect the landing page simulator to real app collections (tasks, safe-bunk attendance records) so inputs persist into the full student workspace.
- **Strict Error Handling:** Wrap all API mutations in optimistic local updates with non-blocking error toasts.

---

## Task Breakdown & Checkpoints

### Phase 1: Visual Design & Anti-Slop Redesign (`design-taste-frontend`)
- [ ] **Task 1: Design Tokens & Typography Foundation**
  - Update `index.html` to load Google Fonts: `Instrument Sans` and `Instrument Serif`.
  - Rewrite CSS custom properties in `index.css` to the dealt palette (`--ground`, `--surface`, `--accent: #1b6e66`, `--text: #1f201d`).
  - Purge global resting box-shadows, gradients, and hairline borders.
- [ ] **Task 2: Overhaul Landing Page (`LandingPhase.tsx`)**
  - Tighten hero headline to 2 lines max; eliminate the italic serif tag.
  - Remove all `.lp-pill` badges, decorative `01/02/03` numbers, and emoji icons.
  - Replace the fake Mac traffic-light window with an authentic, typeset student workspace preview (`data-ui`).
  - Rebuild the Safe-Bunk Calculator section into a high-contrast editorial math engine.
  - Re-structure Features, Architecture, Governance, and Footer into crisp, content-led typographic layouts.
- [ ] **Task 3: Overhaul Auth & Shell Components (`LoginPhase.tsx`, `Header.tsx`, `Sidebar.tsx`)**
  - Replace emoji in login tabs and sidebar links with clean typographic markers.
  - Style portal cards, header indicators, and navigation rails with calm editorial tokens.
- [ ] **Task 4: Gate Verification via Tasteskill Tools**
  - Run `node .agents/skills/design-taste-frontend/scripts/lint.mjs frontend/src` to eliminate all FAILs.
  - Run `node .agents/skills/design-taste-frontend/scripts/inspect.mjs http://localhost:4173/` to achieve 0 FAIL across 1440, 768, and 390 viewports.

### Checkpoint: Design Gate Passed
- [ ] `lint.mjs` returns 0 FAIL.
- [ ] `inspect.mjs` returns 0 FAIL.
- [ ] Visual screenshots reviewed and verified.

---

### Phase 2: Functionality Restoration & Defect Resolution
- [ ] **Task 5: Fix Session Persistence & Page Reload Kickout**
  - Update `checkAuth()` in `App.tsx` so unauthenticated/offline status does not overwrite `'app'` phase when a user is in local demo or previously authenticated.
- [ ] **Task 6: Resilient Authentication (Student, Admin, Registration)**
  - Implement reliable local-first fallback for `handleStudentLogin`, `handleAdminLogin`, and `handleRegister` so demo or offline users can sign in and register smoothly without network lockouts.
- [ ] **Task 7: State Synchronization & Calculator Alignment**
  - Align the Safe-Bunk recovery math between `LandingPhase.tsx` and `AttendanceView.tsx`.
  - Wire simulator interactions (adding tasks, completing items) directly into the app's persistent storage.
- [ ] **Task 8: End-to-End View Verification**
  - Test and verify interactive workflows: Task creation/toggle, Attendance simulation, Calendar view, Notes creation, Resume inspection, and Admin circular dispatch.

### Checkpoint: Core Functionality Operational
- [ ] Refreshing the page while in workspace stays in the workspace.
- [ ] Registration and login succeed seamlessly with or without live backend.
- [ ] All primary tabs navigate without errors.

---

### Phase 3: Comprehensive Regression Testing
- [ ] **Task 9: Backend & API Regression Suite**
  - Run `npm test:closure` or focused test scripts in `backend/` to verify database, auth, and API health.
- [ ] **Task 10: Real-Browser End-to-End Regression**
  - Run `backend/scripts/test-browser-workflow.ts` (or headless Playwright suite) to verify student and admin journeys end-to-end.
- [ ] **Task 11: Production Build & Asset Gate Check**
  - Run `npm --prefix frontend run build` to verify clean TypeScript compilation and bundle generation.
  - Run final `inspect.mjs` gate on production build.

---

## Risks and Mitigations
| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| CSS token changes breaking existing view layouts | High | Inspect all views against base tokens; preserve functional layout classes |
| Offline demo fallback conflicting with live backend | Medium | Follow try-network-first with seamless local fallback pattern |
| Playwright browser script requiring local PostgreSQL | High | Verify environment prerequisites and use mock/local configurations where applicable |
