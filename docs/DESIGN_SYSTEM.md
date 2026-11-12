# Design System: Integrum (v2)

Integrum implements an anti-slop, modern academic design language tailored for students and academic administrators. It blends editorial elegance with high-contrast utility and fluid responsiveness.

---

## 1. Visual Principles

1. **Calm, Focused, and Academic:** Generous white space, warm background neutrals, and clear typographic hierarchy eliminate visual clutter, allowing students to focus on coursework and deadlines.
2. **Utility & State Clarity:** Academic risk is visible at a glance. Status badges (e.g. 75% attendance threshold, overdue coursework) immediately communicate actionable condition using WCAG-compliant color pairs.
3. **Intentional Editorial Typography:** Combines *Fraunces* (warm, variable serif) for editorial hero headings with *Nunito* (highly readable, geometric sans-serif) for dense data grids and controls.
4. **Subtle 3D Depth & Elevation:** Interactive WebGL geometry (`ThreeHeroCanvas.tsx`) adds a modern aesthetic dimension without degrading Core Web Vitals or distracting from primary tasks.

---

## 2. Color Tokens

> **Rule:** Never hardcode raw hex values in UI components; always reference these defined CSS custom properties.

### A. Theme Preset Palette Engine (`themePresets.ts`)
Students and administrators can select from 5 curated primary presets in their Profile view:

| Preset Name | Primary Hex | Dark Hex | Hover Hex | Accent Light | Character |
|---|---|---|---|---|---|
| **Plum (v2 Default)** | `#442C43` | `#C4A5C3` | `#322031` | `#EAE6EA` | Scholarly, distinguished, warm |
| **Pine Teal** | `#0F4C42` | `#2DD4BF` | `#0C3D35` | `#E3F1EF` | Focused, calm, analytical |
| **Slate Indigo** | `#2A364F` | `#93C5FD` | `#1E273A` | `#E6EAF2` | Modern, technical, balanced |
| **Royal Periwinkle** | `#3F5F94` | `#8FACD9` | `#314B77` | `#EFF3F9` | Crisp, institutional, collegiate |
| **Warm Apricot** | `#D9734E` | `#E9A07F` | `#BA5E3C` | `#FBEAE1` | Energetic, creative, warm |

### B. Core Surface & Text Tokens (`integrum-v2.css`)

| Token | Light Mode Value | Dark Mode Value (`body.dark`) | Usage & Contrast |
|---|---|---|---|
| `--bg` | `#F5F3F6` | `#141517` | Root page background |
| `--bg-2` | `#ECE9EE` | `#1D1F21` | Sidebar and panel backgrounds |
| `--bg-3` | `#E2DFE6` | `#292C2F` | Sub-panel dividers and active row highlights |
| `--surface` | `#FFFFFF` | `#1D1F21` | Cards, modals, dropdown menus |
| `--border` | `#CFCBD3` | `#3A3E40` | Card borders and input outlines |
| `--text-1` | `#1F2123` | `#E8E9EA` | Primary headlines and high-contrast text (>10:1) |
| `--text-2` | `#43474A` | `#B4B7B9` | Secondary body text and labels (>5.5:1) |
| `--text-3` | `#5C6064` | `#8E9194` | Captions, timestamps, disabled indicators (4.5:1) |
| `--action` | `var(--primary)` | `#8FACD9` | Primary CTA buttons (auto-inverts in dark mode) |
| `--on-action` | `#FFFFFF` | `#14151A` | Text on primary buttons |
| `--action-hover`| `var(--primary-hover)`| `#A5BDE3` | Primary button hover state |

### C. Semantic Status Tokens (Three-Tier: Base / Tint / Text-Safe Ink)

All status labels pair a tint background (`-light`) with an accessible ink foreground (`-ink`), guaranteeing >4.5:1 contrast:

| Status Role | Base Hex | Light Tint (`-light`) | Text-Safe Ink (`-ink`) | Dark Mode Ink | Academic Meaning |
|---|---|---|---|---|---|
| **Success** | `#10B981` | `#D1FAE5` | `#065F46` | `#6EE7B7` | Attendance >= 75%, Assignment Submitted, Job Offered |
| **Warning** | `#F59E0B` | `#FEF3C7` | `#92400E` | `#FCD34D` | Attendance 70–74%, Impending Deadline (<24h) |
| **Error / Deficit**| `#EF4444` | `#FEE2E2` | `#991B1B` | `#FCA5A5` | Attendance < 70%, Overdue Assignment, Code Expired |
| **Info** | `#3B82F6` | `#DBEAFE` | `#1E40AF` | `#93C5FD` | AI Insights, Circulars, Calendar Reminders |

---

## 3. Typography Scale

- **Display Font:** *Fraunces* (Fallback: Georgia, serif) — reserved for hero titles and major section headers.
- **Body & UI Font:** *Nunito* (Fallback: system-ui, sans-serif) — used for all data cards, navigation, forms, and table text.

### Fluid Type Scale
Integrum uses CSS `clamp()` to scale fluidly from mobile viewport (320px) to desktop (1440px):

| Scale Step | CSS Variable | Range (Min → Max) | Weight | Usage |
|---|---|---|---|---|
| **Step -1** | `--step--1` | `0.80rem → 0.90rem` (13–14px) | 600–700 | Status chips, timestamps, table metadata |
| **Step 0** | `--step-0` | `1.00rem → 1.125rem` (16–18px) | 400–600 | Default body text, form input labels |
| **Step 1** | `--step-1` | `1.20rem → 1.50rem` (19–24px) | 700 | Card titles, modal headers, subsection headers |
| **Step 2** | `--step-2` | `1.50rem → 2.10rem` (24–34px) | 700 | View page headers, primary section titles |
| **Step 3** | `--step-3` | `2.00rem → 3.10rem` (32–50px) | 800 | Large dashboard metrics, statistics callouts |
| **Step 4** | `--step-4` | `2.60rem → 4.60rem` (42–74px) | 800 (Display) | Landing page marketing sub-hero |
| **Step 5** | `--step-5` | `3.00rem → 7.00rem` (48–112px) | 900 (Display) | Landing hero headline |

---

## 4. Spacing, Geometry & Elevation

### Spacing Scale
- Fluid layout tokens:
  - `--space-1`: `0.25rem → 0.40rem` (4–6px)
  - `--space-2`: `0.50rem → 0.80rem` (8–13px)
  - `--space-3`: `0.90rem → 1.40rem` (14–22px)
  - `--space-4`: `1.40rem → 2.40rem` (22–38px)
  - `--space-5`: `2.40rem → 4.50rem` (38–72px)
  - `--space-6`: `3.50rem → 8.00rem` (56–128px)
  - `--gutter`: `16px → 48px` (page edge padding)

### Geometry & Border Radius
- `--radius-sm`: `8px` (buttons, inputs, code blocks)
- `--radius-md`: `16px` (dropdown menus, sub-panels)
- `--radius-lg`: `24px` (feature cards, alert boxes)
- `--radius-xl`: `32px` (primary dashboard cards, modals)
- `--radius-pill`: `999px` (status badges, action pills, avatars)
- Shell dimensions: `--sidebar-w: 260px`, `--header-h: 64px`.

### Elevation & Shadows
- `--shadow-sm`: `0 4px 12px rgba(37,40,42,.05)` (subtle card rest)
- `--shadow-md`: `0 8px 24px -4px rgba(37,40,42,.10)` (elevated buttons, dropdowns)
- `--shadow-lg`: `0 16px 32px -8px rgba(37,40,42,.14)` (hovered cards)
- `--shadow-xl`: `0 28px 56px -14px rgba(68,44,67,.28)` (dialog modals, glass overlays)

---

## 5. Component Standards & Layout

### A. Buttons (`.btn`)
- **Primary (`.btn-primary`):** Filled with `--action`, text in `--on-action`. Minimum height: 48px. Rounded pill geometry.
- **Ghost (`.btn-ghost`):** Transparent background with `--border` outline and `--text-1` label.
- **Interactive Feedback:** Spring physics on hover (`transform: translateY(-2px)` with `cubic-bezier(.34,1.56,.64,1)`).
- **Focus Ring:** 3px solid `--secondary` with 3px offset (`:focus-visible`).

### B. Academic Cards (`.card`)
- Built with `--surface` background, 1px `--border`, and `--radius-xl` corners.
- Micro-interaction: Smooth hover lift (`translateY(-4px)` with subtle `-0.4deg` rotation and `--shadow-lg`).

### C. Glassmorphism Panels (`.glass`)
- Semi-transparent backdrop blur (`backdrop-filter: blur(18px) saturate(140%)`), paired with high-translucency border (`--glass-border`). Used on modals and header bars.

### D. Status Chips (`.chip`)
- Compact inline pill indicators (`.chip-success`, `.chip-warning`, `.chip-error`, `.chip-info`) providing instant visual feedback on attendance safety, task priority, and submission grades.

### E. Responsive Layout Grids
- **Auto-Grid (`.auto-grid`):** Self-arranging responsive layout without hardcoded media queries: `repeat(auto-fit, minmax(min(100%, 280px), 1fr))`.
- **Bento Grid (`.bento-grid`):** 12-column dashboard layout (12 columns desktop, 6 columns tablet, 1 column mobile).
- **Content Wrapper (`.wrap`):** Centered max container: `width: min(1240px, 100% - 2 * var(--gutter))`.

---

## 6. Accessibility & Performance Checklist (WCAG 2.1 AA)

- [x] **Color Contrast:** All body text (`--text-1`, `--text-2`) meets minimum 5.5:1 ratio against `--bg` and `--surface`. Captions (`--text-3`) maintain at least 4.5:1.
- [x] **Touch Target Sizing:** All clickable buttons, inputs, and tab triggers maintain minimum 48px height and 44x44px clickable area.
- [x] **Keyboard Navigation:** Full focus navigation via `:focus-visible` with 3px high-contrast `--secondary` outline.
- [x] **Dark Mode Compliance:** Automated media query detection (`prefers-color-scheme`) with seamless user preference override stored in `localStorage`.
- [x] **Motion Safety:** All animations respect `prefers-reduced-motion: reduce`, dropping spring transforms to instant opacity transitions.
