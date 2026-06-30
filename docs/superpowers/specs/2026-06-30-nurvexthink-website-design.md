# NurvexThink — Main Website Design Spec

**Date:** 2026-06-30
**Status:** Approved (design phase)
**Owner:** Fatima Abdul Raheem (CEO)

---

## 1. Overview

NurvexThink is a software company that builds and publishes software products, takes
custom software orders on demand, and writes blog posts about its work. This spec covers
the **main website** — the public hub that showcases products (with links to their live
apps), hosts the blog, captures custom-software leads, and provides an admin dashboard for
the team to manage content.

**Out of scope (separate future specs):** the individual software products themselves.
Each product is its own repository and deployment, linked to from this site.

### Goals
- Premium, dark/metallic brand presence with signature 3D visuals.
- Showcase published software with links to live apps.
- Blog (created/edited via an admin dashboard, no coding required to publish).
- Capture custom-software leads via a simple form.
- $0 to launch (free tiers), with a clear paid-upgrade path.

### Non-goals (deferred)
- Client accounts / order-tracking dashboard (lead form only at launch).
- Online payments (Stripe) — later phase.
- Multi-language/i18n.

---

## 2. Brand

Standardized name: **NurvexThink** (display) / **nurvexthink** (lowercase: domains, repos, handles).

Theme is derived from the logo (navy/slate "N" + metallic silver "T" on black):

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0A0A0B` | near-black background |
| `--primary-1` | `#1E2A44` | navy/slate (gradient start) |
| `--primary-2` | `#2D3A5C` | slate (gradient end) |
| `--accent-1` | `#C0C5CE` | metallic silver (gradient start) |
| `--accent-2` | `#E8EBF0` | bright silver (gradient end) |

- **Fonts:** Space Grotesk / Sora (headings), Inter (body).
- **Vibe:** dark-mode-first, glassmorphism panels, metallic gradients on hover, 3D "NT" hero.

---

## 3. Architecture

**Approach A (chosen): Next.js + Supabase on Vercel. No separate backend server.**

```
[ Browser ]
    |  HTTPS
[ Next.js 15 App Router on Vercel ]
    |  - React Server Components (data fetching, SEO)
    |  - Client Components (3D, interactivity) at the leaves
    |  - Route Handlers / Server Actions (form mutations)
    |
[ Supabase Cloud ]
    - Postgres (data)         - Auth (admin login)
    - Storage (images)        - Edge Functions (custom logic, if needed)
    - Row Level Security (RLS) on every table
```

### Stack
| Layer | Choice |
|---|---|
| Language | TypeScript |
| Framework | Next.js 15 (App Router) + React |
| Styling | Tailwind CSS + shadcn/ui |
| 3D | React Three Fiber + drei + Three.js (Spline optional for no-code scenes) |
| Animation | Framer Motion (+ GSAP for advanced sequences) |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Hosting | Vercel (site) + Supabase Cloud (backend) |
| Deploy | Public GitHub repo + GitHub Actions + Vercel token |

---

## 4. Components / Pages

| Route | Type | Purpose |
|---|---|---|
| `/` | public | Home: 3D metallic "NT" hero, featured products, CTA |
| `/products` | public | Grid of published software |
| `/products/[slug]` | public | Product detail + link to live app + repo |
| `/blog` | public | Blog list |
| `/blog/[slug]` | public | Blog post |
| `/order` | public | "Request custom software" lead form |
| `/about` | public | Company + team |
| `/contact` | public | Contact info |
| `/admin` | protected | Dashboard: manage products, blog posts, view leads |
| `/admin/login` | public | Admin auth (Supabase) |

Each page/unit has a single clear purpose, communicates through props/Supabase queries,
and can be understood and tested independently.

---

## 5. Data model (Supabase)

### Tables
- **`profiles`** — `id (= auth.users.id)`, `email`, `full_name`, `role` (`owner` | `admin`), `created_at`
- **`products`** — `id`, `slug` (unique), `name`, `summary`, `description`, `cover_image`,
  `live_url`, `repo_url`, `tags (text[])`, `featured (bool)`, `published (bool)`, `created_at`, `updated_at`
- **`blog_posts`** — `id`, `slug` (unique), `title`, `excerpt`, `content`, `cover_image`,
  `author_id (-> profiles)`, `status` (`draft` | `published`), `published_at`, `created_at`, `updated_at`
- **`orders`** — `id`, `name`, `email`, `company`, `project_type`, `budget`, `details`,
  `status` (`new` | `contacted` | `closed`), `created_at`

### Storage buckets
- `product-images` (public read, admin write)
- `blog-images` (public read, admin write)

### RLS (enabled on EVERY table, default-deny)
- `products`/`blog_posts`: public `SELECT` where `published = true` / `status = 'published'`; admins full access.
- `orders`: public `INSERT` only (with basic validation); admins `SELECT`/`UPDATE`; no public read.
- `profiles`: a user can read/update own row; admins can read all.
- **Index every column referenced in an RLS policy** (e.g., `published`, `status`, `author_id`).

---

## 6. Security

- RLS on every public-schema table, no exceptions (Supabase is default-deny).
- `service_role` key is **server-side only** — never in client code or the repo. Stored as a
  Vercel/GitHub Actions secret.
- `anon` key is public-safe because RLS protects the data.
- Lead form: validate input server-side; add basic anti-spam (honeypot / rate limit) on insert.
- Admin routes guarded by Supabase Auth + middleware; `/admin` checks `profiles.role`.

---

## 7. Deployment & GitHub

- **Repo:** `nurvexthink/nurvexthink-web` (public).
- **Vercel project:** named independently (e.g., `nurvexthink`), custom domain later.
- **Deploy:** GitHub Actions builds and deploys with a Vercel token on merge to `main`.
  This sidesteps Vercel Hobby's org-private-repo + commit-author restrictions, so all three
  admins' merged work deploys for free.
- **Env vars / secrets** live in Vercel + GitHub Actions, never in the repo.
- **Branch protection:** `main` requires a PR + 1 review; no direct pushes.
- **Commit identity:** Fatima Abdul Raheem (CEO), `fatima.abdulraheemdev.17@gmail.com`, is the
  committing GitHub account for the `nurvexthink` org.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`…).

### Vercel/GitHub deployment notes (researched)
- A Vercel project name can differ from the GitHub username and repo name — no limitation.
- Vercel Hobby cannot deploy private repos owned by a GitHub org, and only the owner's
  commits trigger deploys → resolved by public repo + GitHub Actions (chosen), or by
  upgrading to Vercel Pro Team (~$20/seat/mo) later.
- Cloudflare Pages is the fallback host (more generous org/team free tier, rougher Next.js support).

---

## 8. Org management

### GitHub org (`nurvexthink`)
- Repos: `nurvexthink-web` + one repo per published product.
- Roles: CEO + shared `nurvexthink@gmail.com` = Owners; CFO = Owner or Maintainer.
- Require 2FA org-wide; enable Dependabot + secret scanning.
- Protect `main` with required PR review.

### Supabase org (`nurvexthink`)
- One Supabase project for the main site; each product needing a DB gets its own project.
- Invite all 3 admins; Owners for CEO + shared account, Developer/Admin for CFO.
- Split into staging + prod projects when it matters (start with one).
- Daily backups (paid tier) when justified.

---

## 9. Performance & quality (researched best practices)

### Next.js
- Server Components by default; keep `"use client"` at the leaves.
- `next/image` with `priority` for the above-the-fold hero (LCP).
- Lean on the React Compiler (Next 15+); cache/revalidate `fetch`.
- Target Core Web Vitals (LCP, INP, CLS).

### React Three Fiber / Three.js
- `frameloop="demand"` — render only on change.
- Mutate via `useFrame` + refs, never React state in the loop.
- Compressed textures (KTX2/Basis), compressed models (GLB + Draco), `useGLTF.preload()`.
- LOD via drei `<Detailed>`; dispose GPU resources; lazy-load 3D so it never blocks first paint.
- Monitor with `r3f-perf`.

### Supabase / Postgres
- Index columns used in RLS policies and frequent filters.
- Test RLS with Studio impersonation before launch.

These are encoded as reusable Claude skills in `.claude/skills/`:
`nurvexthink-nextjs-perf`, `nurvexthink-3d-perf` (plus the installed `supabase` and
`supabase-postgres-best-practices`).

---

## 10. Testing

- Unit/component tests for form validation and admin auth logic.
- RLS policy tests (Studio impersonation, or `supabase test db` with pgTAP).
- Lighthouse/Core Web Vitals check before launch.
- Manual: lead form submits → row in `orders`; admin can publish a product/post → appears publicly.

---

## 11. Build order (high level — detailed in the implementation plan)

1. Repo + tooling: Next.js + TS + Tailwind + shadcn, CLAUDE.md, skills, CI.
2. Brand/theme system + layout shell (nav, footer, dark theme).
3. Supabase project + schema + RLS + seed data.
4. Public pages: Home (with 3D hero), Products, Blog, Order form.
5. Admin auth + dashboard CRUD (products, blog, orders).
6. 3D hero polish + performance pass.
7. Deploy pipeline (GitHub Actions → Vercel) + domain.

---

## 12. Open items / future phases
- Client accounts + order tracking.
- Stripe payments.
- Staging Supabase environment.
- Per-product repos and deployments (separate specs).
