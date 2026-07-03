# Animated Ambient Logo Background — Design Spec

**Date:** 2026-07-03
**Status:** Approved (design phase)
**Owner:** Fatima Abdul Raheem (CEO)

## 1. Overview

Replace the current per-section static backdrops with a single **site-wide animated ambient
background**: a large, low-opacity **NT monogram watermark** that gently drifts and "shines",
floating over slow-moving aurora glows and a faint blueprint grid. The effect is
**theme-aware** (distinct palettes for dark and light) and reacts subtly to the mouse for depth.

It renders **once**, behind all public pages, and is suppressed on `/admin`.

### Goals

- A premium, branded atmosphere that reinforces the NurvexThink mark on every public page.
- A tasteful "shine" that sweeps across the logo watermark, clipped to the letterforms.
- Smooth, GPU-friendly motion that never harms readability or Core Web Vitals.
- Fully theme-aware, honoring `prefers-reduced-motion`.

### Non-goals

- No canvas/WebGL/shader background (the hero already owns one GPU context).
- No per-page configuration or CMS control of the background.
- Not shown on admin pages (kept clean and functional).

## 2. Locked decisions

| Decision | Choice |
|---|---|
| Scope | **Site-wide** — one fixed layer behind all public pages; excluded on `/admin*` |
| Style | **Layered atmosphere** — centered NT monogram + drifting aurora + faint grid + shine |
| Motion | **Ambient + mouse parallax** (parallax disabled on touch and reduced-motion) |
| Intensity | **Balanced** — clearly present, always behind content; watermark ~6–10% opacity |
| Technique | **Pure CSS transforms + inline SVG** (no canvas/WebGL) |

## 3. Approach

Chosen: **CSS transforms + inline SVG**, animating only `transform` and `opacity` so all
motion runs on the compositor. Rejected alternatives: a WebGL/canvas shader (a second
always-on GPU context site-wide — overkill, worse battery, conflicts with the "lazy-load 3D so
it never blocks paint" rule) and animated SVG filters / `feTurbulence` (CPU-heavy, hard to
theme).

## 4. Architecture

One client component, mounted once in the root layout.

| Unit | Responsibility |
|---|---|
| `src/components/ambient-background.tsx` (`"use client"`) | The `fixed inset-0 -z-10 pointer-events-none` layer, `aria-hidden`. Owns the mouse-parallax effect and visibility rules. Returns `null` on `/admin*`. |
| `src/components/nt-mark.tsx` | The traced NT monogram as a reusable inline SVG (`<symbol>`/`<path>`), tintable via `currentColor`/CSS vars. Swappable for an official SVG later. |
| `src/app/globals.css` | New keyframes (`aurora-drift`, `gleam-sweep`, `breathe`) and `.ambient-*` classes, theme-aware through existing tokens. |
| `src/app/layout.tsx` | Mounts `<AmbientBackground />` as the first child of `<body>`. |

**Isolation:** `nt-mark.tsx` knows only how to draw the monogram; `ambient-background.tsx`
composes layers and handles interaction; `globals.css` owns the motion. Each can be understood
and changed independently.

### 4.1 Layering (back → front)

1. **Base** — existing `--background` token (untouched; painted by `<body>`).
2. **Aurora** — 2–3 large soft radial-gradient blobs, slowly drifting + breathing.
3. **Grid** — the existing faint blueprint grid, full-page, edge-masked (`mask-fade-y`-style).
4. **Monogram watermark** — large, centered NT, low opacity, gently breathing.
5. **Shine** — a diagonal light band sweeping across the monogram every ~6–8 s, **clipped to
   the letter shapes** via an SVG `clipPath` so the gleam only rides the logo.

The ambient layer lives at `-z-10` as a child of `<body>`. Per CSS paint order, a negative
`z-index` child paints **above** the body's own `bg-background` fill but **below** all in-flow
content — so it is visible in transparent regions and correctly hidden behind opaque `bg-card`
surfaces.

### 4.2 Mouse parallax

A single `pointermove` listener (throttled with `requestAnimationFrame`) writes normalized
`--mx` / `--my` (−1…1) CSS variables on the layer root. Each layer translates a different
magnitude toward the cursor (monogram least, aurora most) for depth. The listener is **not
attached** when `(hover: none)` (touch) or `prefers-reduced-motion: reduce`.

## 5. Theme-aware palette (from existing tokens)

| Layer | Dark | Light |
|---|---|---|
| Aurora | indigo `#5C7CFA` + navy `#1E2A44` | indigo `#8AA0FF` + cool blue, softer |
| Monogram fill | silver `#C0C5CE → #E8EBF0`, ~8% opacity | navy `#1E2A44 → #2D3A5C`, low opacity |
| Gleam | bright silver / white | white / indigo |
| Grid | existing `--grid-line` (faint silver) | existing `--grid-line` (faint navy) |

Colors are driven by existing CSS custom properties, so the `.dark` class switch flips the
whole background automatically.

## 6. Integration adjustments

- **Home hero** ([src/app/page.tsx](../../../src/app/page.tsx)): remove the now-redundant local
  `.bg-grid` (the global grid covers it); keep the 3D crystal and a subtle local `.bg-glow` for
  focal emphasis at the top of the hero.
- **Admin** ([src/app/admin/(panel)/](../../../src/app/admin)): background suppressed via the
  `usePathname` check in `ambient-background.tsx`.

## 7. Performance & accessibility

- Animate **only** `transform` / `opacity`; `will-change` applied sparingly and scoped.
- `pointer-events: none` and `aria-hidden="true"` on the whole layer.
- Full `prefers-reduced-motion` support: the existing global guard in `globals.css` freezes
  animation; the parallax listener additionally self-disables.
- No layout thrash, no per-frame React state, no new dependencies.

## 8. Testing

- Component render test (`src/components/ambient-background.test.tsx`) matching the existing
  `navbar.test.tsx` pattern: asserts the layer renders `aria-hidden`, and renders **nothing**
  on an `/admin` path (mocked `usePathname`).
- Keep the green bar: `npm run build`, `npm run typecheck`, `npm run lint`, `npm test` all pass.
- Manual: verify the shine sweep, aurora drift, and mouse parallax in both themes; confirm the
  background disappears on `/admin` and that content readability is unaffected.

## 9. Asset note

The provided `public/logo.jpeg` is a raster JPEG on a black background — it cannot be tinted or
masked. We therefore **trace a clean transparent SVG** of the NT monogram for `nt-mark.tsx`. It
will closely match the mark; an official SVG can be dropped in later without other changes.

## 10. Build order

1. Add `nt-mark.tsx` (traced SVG monogram).
2. Add keyframes + `.ambient-*` classes to `globals.css` (theme-aware).
3. Build `ambient-background.tsx` (layers + parallax + `/admin` suppression).
4. Mount in `layout.tsx`; trim the home hero's redundant grid.
5. Add the render test; run the full green-bar suite.
6. Visual QA in both themes; tune opacity/timing.
