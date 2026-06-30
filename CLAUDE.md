# CLAUDE.md — NurvexThink Main Website

Guidance for Claude Code (and the team) when working in this repository.

## What this is

The **main website** for **NurvexThink**, a software company that builds & publishes
software products, takes custom-software orders, and blogs about its work. This site is the
public hub: product showcase (links to live apps), blog, custom-order lead form, and an
admin dashboard for managing content.

> Brand spelling is **NurvexThink** (display) / **nurvexthink** (lowercase: repos, domains,
> handles). Do not use other spellings.

Individual software products are **separate repos/deployments**, not part of this repo.

## Stack (locked)

- **Language:** TypeScript
- **Framework:** Next.js 15 (App Router) + React
- **Styling:** Tailwind CSS + shadcn/ui
- **3D:** React Three Fiber + drei + Three.js (Spline optional for no-code scenes)
- **Animation:** Framer Motion (+ GSAP for advanced work)
- **Backend:** Supabase — Postgres, Auth, Storage, Edge Functions (this IS the backend; no Render server)
- **Hosting:** Vercel (site) + Supabase Cloud (backend)
- **Deploy:** Public GitHub repo + GitHub Actions + Vercel token

## Theme (from the logo)

| Token | Value |
|---|---|
| `--bg` | `#0A0A0B` (near-black) |
| `--primary-1 → 2` | `#1E2A44 → #2D3A5C` (navy/slate) |
| `--accent-1 → 2` | `#C0C5CE → #E8EBF0` (metallic silver) |

Fonts: Space Grotesk / Sora (headings), Inter (body). Dark-mode-first, glassmorphism, metallic gradients.

## Data model (Supabase)

Tables: `profiles`, `products`, `blog_posts`, `orders`. Storage: `product-images`,
`blog-images`. See `docs/superpowers/specs/2026-06-30-nurvexthink-website-design.md` §5.

## Security rules (non-negotiable)

- **RLS enabled on every table.** Supabase is default-deny — add explicit policies.
- **`service_role` key: server-side only.** Never in client code or the repo. Use env/secrets.
- `anon` key is public-safe (RLS protects data).
- Index every column used in an RLS policy.
- Admin routes guarded by Supabase Auth + role check (`profiles.role`).

## Performance rules

- **Next.js:** Server Components by default; `"use client"` only at leaves; `next/image` +
  `priority` for the hero; lean on React Compiler; cache/revalidate fetches.
- **3D (R3F):** `frameloop="demand"`; mutate via `useFrame`+refs (never state in the loop);
  compressed textures (KTX2) + models (GLB/Draco); `useGLTF.preload()`; LOD via `<Detailed>`;
  dispose GPU resources; lazy-load 3D so it never blocks first paint; monitor with `r3f-perf`.

Detailed rules live in `.claude/skills/nurvexthink-nextjs-perf` and
`.claude/skills/nurvexthink-3d-perf`. The installed `supabase` and
`supabase-postgres-best-practices` skills cover backend/DB.

## Git & GitHub workflow

- Repo: `nurvexthink/nurvexthink-web` (public).
- `main` is PR-protected (1 review required); **no direct pushes to main**.
- Branch per feature: `feat/...`, `fix/...`, `chore/...`.
- **Conventional Commits:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Deploy is automatic on merge to `main` via GitHub Actions → Vercel.
- Secrets (Supabase keys, Vercel token) live in Vercel + GitHub Actions, never in the repo.

## Organizations & accounts

- **GitHub org:** `nurvexthink`. **Supabase org:** `nurvexthink`.
- **Admins:**
  - Shared/company: `nurvexthink@gmail.com` (Owner — continuity/recovery)
  - **CEO — Fatima Abdul Raheem**: `fatima.abdulraheemdev.17@gmail.com` (Owner; **primary committing account for the nurvexthink org**)
  - CFO — Muhammad Ali: `muhammadalidev3@gmail.com` (Owner/Maintainer)
- Require 2FA org-wide. Enable Dependabot + secret scanning.

## Environment variables (set in Vercel / GitHub Actions, not the repo)

```
# Project ref: axbsghyqhhdaiylcksbv  (dashboard: https://supabase.com/dashboard/project/axbsghyqhhdaiylcksbv)
NEXT_PUBLIC_SUPABASE_URL=https://axbsghyqhhdaiylcksbv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # public-safe; copy from Supabase > Project Settings > API
SUPABASE_SERVICE_ROLE_KEY=        # server-side ONLY; never commit; set in Vercel/Actions secrets
```

## Where things live

- `docs/superpowers/specs/` — design specs (start with the website design doc).
- `.claude/skills/` — project-specific best-practice skills.
- `brand/` — logo and brand assets.
