---
trigger: glob
globs: "frontend/src/components/**, frontend/src/styles/**, frontend/src/App.tsx, *.css"
description: "UI and Design System guardrail — activates when touching UI code."
---
Before editing styling or UI components:
1. Consult `docs/DESIGN_SYSTEM.md`.
2. Use defined CSS tokens (e.g. `integrum-v2.css`, `--accent`, `--surface`); avoid unvetted raw colors.
3. Ensure interactive elements maintain accessible touch targets and visible focus rings.
4. Maintain separation between student workspace and administrative governance views.
