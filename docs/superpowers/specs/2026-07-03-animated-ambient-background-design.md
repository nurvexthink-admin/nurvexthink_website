# Animated Ambient Logo Background — Design Spec

**Date:** 2026-07-03 (updated same day to the as-built design)
**Status:** Approved & implemented
**Owner:** Fatima Abdul Raheem (CEO)

## 1. Overview

Replace the per-section static backdrops with a single **site-wide animated ambient
background**: the **real NurvexThink mark, extruded into true 3D**, slowly turning like a
physical object on a turntable, floating over slow-moving aurora glows and a faint blueprint
grid. The watermark **is** the hero visual — the home headline sits directly over it, so the
site has exactly **one** live WebGL scene.

The effect is **theme-aware** (opacity/lift per theme; the logo keeps its true colours in
light mode) and reacts subtly to the mouse for depth. It renders **once**, behind all public
pages, and is suppressed on `/admin`.

### Goals

- A premium, branded atmosphere that reinforces the real NurvexThink mark on every public page.
- True 3D: depth, beveled edges, metallic shine as the mark turns.
- Smooth, GPU-friendly motion that never harms readability or Core Web Vitals.
- Fully theme-aware, honoring `prefers-reduced-motion`.

### Non-goals

- No second live 3D scene (the old hero crystal/canvas was removed in favour of this one).
- No per-page configuration or CMS control of the background.
- Not shown on admin pages (kept clean and functional).

## 2. Locked decisions (as built)

| Decision | Choice |
|---|---|
| Scope | **Site-wide** — one fixed layer behind all public pages; excluded on `/admin*` |
| Watermark | **The real logo in true 3D** — auto-traced outlines, extruded, beveled, metallic PBR |
| Motion | Slow full **360° turn (~22 s)** + gentle float, plus **mouse parallax** on the layer (parallax off on touch and reduced-motion) |
| Colour | **True logo colours in both themes** (no light-mode tint); dark mode gets a brightness lift to read on black |
| Materials | Navy N: deep `#1C2848`, glossy clearcoat. Silver T: bright `#DDE2EA`, high metalness |
| Architecture | **One WebGL scene site-wide** (lazy-loaded R3F canvas, dpr ≤ 1.5) + CSS-only aurora/grid |

## 3. Approach

The watermark is a real extruded mesh (React Three Fiber), because a flat image cannot show
true perspective, bevels, or specular shine. Everything else (aurora, grid, parallax) stays
**pure CSS transforms/opacity** on the compositor. Rejected: multiple canvases (hero + background)
— duplicate GPU cost and two copies of the mark on screen; CSS-3D image tricks — no real depth
or lighting.

### Logo fidelity

`public/logo.jpeg` is raster on black, so the pipeline is: knock out the background →
`public/logo-mark.png` (transparent, cropped) → **auto-trace with potrace** into two smooth
vector path sets (navy N, silver T) stored in `src/components/logo-shapes.ts`. The trace was
visually verified against the original; regenerate it if the brand mark ever changes.

## 4. Architecture

| Unit | Responsibility |
|---|---|
| `src/components/ambient-background.tsx` (`"use client"`) | The `fixed inset-0 -z-10 pointer-events-none` layer, `aria-hidden`. Owns mouse parallax and visibility rules; returns `null` on `/admin*`. Lazy-loads the 3D scene. |
| `src/components/ambient-logo-3d.tsx` | The one WebGL scene: extruded logo (SVGLoader → `ExtrudeGeometry`, bevels), metallic materials, brand-coloured Lightformer environment, 360° turntable via `useFrame` + refs. `dpr=[1,1.5]`, `frameloop="demand"` under reduced motion. Disposes geometries on unmount. |
| `src/components/logo-shapes.ts` | The traced vector outlines of the real mark (data only). |
| `src/app/globals.css` | Ambient tokens (`--amb-*`), aurora/grid keyframes, `.ambient-*` classes. Size, opacity, per-theme filter, and parallax live on the CSS wrapper — the 3D scene stays theme-blind. |
| `src/app/layout.tsx` | Mounts `<AmbientBackground />` once, as the first child of `<body>`. |

### 4.1 Layering (back → front)

1. **Base** — existing `--background` token (painted by `<body>`).
2. **Aurora** — three large soft radial-gradient blobs, slowly drifting + breathing (CSS).
3. **Grid** — the faint blueprint grid, full-page, edge-masked (CSS).
4. **3D logo watermark** — centred, `min(72vw, 860px)` wide, slowly turning; opacity/lift from
   theme tokens.

The layer sits at `-z-10` as a child of `<body>`: it paints above the body's background fill
but below all in-flow content, so opaque `bg-card` surfaces naturally mask it.

### 4.2 Mouse parallax

One rAF-throttled `pointermove` listener writes normalized `--amb-mx/--amb-my` (−1…1) onto the
layer root; each CSS layer translates a different magnitude (grid least, aurora most). Not
attached when `(hover: none)` or `prefers-reduced-motion: reduce`.

## 5. Theme behaviour

| Token | Dark | Light |
|---|---|---|
| `--amb-logo-opacity` | `0.34` | `0.30` |
| `--amb-logo-filter` | `brightness(1.5)` (lift to read on black) | `none` (true colours) |
| Aurora colours | indigo/navy, stronger | indigo/blue, softer |

The 3D materials never change per theme — only the CSS wrapper's opacity/filter do.

## 6. Performance & accessibility

- One lazy-loaded WebGL scene site-wide (`next/dynamic`, `ssr:false`) — never blocks first paint;
  dpr capped at 1.5 (the layer is faint; extra resolution is wasted GPU).
- Turntable animates via `useFrame` ref mutation — no React state in the loop.
- Aurora/grid animate only `transform`/`opacity`; `pointer-events: none`; `aria-hidden`.
- Reduced motion: canvas drops to `frameloop="demand"` (static frame), CSS animations freeze via
  the global guard, parallax listener self-disables.
- Manually created geometries are disposed on unmount.

## 7. Testing

- `src/components/ambient-background.test.tsx`: layer renders `aria-hidden` on public pages;
  the 3D watermark mounts inside its wrapper (scene stubbed under jsdom); renders **nothing**
  on `/admin` paths.
- Green bar: `npm run build`, `typecheck`, `lint`, `test` all pass.
- Manual: rotation, float, parallax verified in both themes; content readability confirmed;
  `/admin` suppression confirmed.

## 8. Build order (as executed)

1. Knock out the logo background → `public/logo-mark.png`; auto-trace → `logo-shapes.ts`.
2. Extruded 3D scene (`ambient-logo-3d.tsx`) with metallic materials + brand lighting.
3. Ambient layer (`ambient-background.tsx`): aurora + grid + 3D watermark + parallax +
   `/admin` suppression; mounted once in `layout.tsx`.
4. Removed the hero's separate 3D canvas (crystal) — the watermark is the hero visual.
5. Tests + full green bar; visual QA in both themes; tuned opacity/brightness/materials.
