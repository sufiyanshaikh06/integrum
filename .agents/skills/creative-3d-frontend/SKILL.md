---
name: creative-3d-frontend
description: Instructions for highly creative, fluidly responsive web design with interactive 3D WebGL elements, modern design aesthetics, intentional typography, and robust responsive layouts.
---

# Creative & 3D Frontend Guidelines

## 1. Aesthetic Direction
- Avoid generic AI templates (e.g., standard rounded cards, center-only layouts, default purple/cyan gradients, or overly bland grayscale).
- Apply rich, intentional palettes with high-contrast typography pairings (display serif or neo-grotesque header + refined neutral body).
- Use smooth micro-interactions, subtle glassmorphism/textures, and asymmetric layout grids.
- Ensure all interactive controls have clear hover, focus, active, and disabled states.

## 2. Responsiveness
- Build mobile-first with fluid scaling (`clamp()`, viewport units, dynamic CSS variables).
- Ensure interactive elements feature accessible touch targets (minimum 44x44px).
- Navigation bars must fold gracefully into mobile-friendly drawers or clean stacked layouts without clipping or overflow.
- Dashboards and tables must adapt to mobile viewports with horizontal scrolling wrappers or stacked summary cards.

## 3. 3D & WebGL Integration
- Integrate Three.js using native Canvas WebGL shaders, geometries, and lighting.
- Optimize scenes: keep polygon counts low, use efficient geometries, and suspend the animation loop when off-screen (via `IntersectionObserver` or `requestAnimationFrame` lifecycle hooks).
- Set up responsive camera adjustments (`aspect`, `fov`) on window resize events.
- Provide a lightweight CSS fallback or static frame on low-power devices.
- Support smooth user interactions (e.g. pointer/mouse tracking, gentle rotational inertia, particle depth).

## 4. Forms & Authentication Experience
- Modern underline or minimal border text input styling with floating or clean labels.
- Toggleable Show/Hide password visibility button with accessible SVG icons.
- Mandatory Confirm Password verification on registration with instantaneous match feedback.
- Clean, realistic placeholders without generic test strings like "Ahmed Khan" or "example.com".
- Authentic backend database registration and session persistence.
