# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack GlowSuite CRM for beauty consultants in the Dominican Republic. Spanish-language UI for tracking clients, sales, and automated followup scheduling (2-day, 2-week, 2-month cycles).

## Commands

### Frontend (run from `frontend/`)
```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run lint      # Run ESLint
```

### Backend (run from `backend/`)
```bash
uvicorn app.main:app --reload   # Start dev server (localhost:8000)
```

No test suite exists yet.

## Architecture

**Monorepo** with two independent apps:
- `frontend/` — Next.js 16 App Router + React 19 + Tailwind CSS 4
- `backend/` — Python FastAPI + Pydantic + Supabase

### Data Flow

1. All authenticated routes require Supabase Auth session
2. Frontend calls FastAPI backend at `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`)
3. Every backend request includes `x-user-id` header (Supabase user UUID) — this is how user isolation works (no JWT validation on backend, just the header)
4. Backend uses Supabase service key to query/mutate data, always filtering by `user_id`

### Frontend Structure

- `app/` — Next.js App Router pages (file-based routing)
- `components/ClientLayout.tsx` — wraps all authenticated pages; handles auth state and redirects
- `lib/api.ts` — all backend API calls (centralizes `x-user-id` header injection)
- `lib/supabase.js` — Supabase browser client singleton

### Backend Structure

All logic lives in `backend/app/main.py` (single-file FastAPI app). Routes have **no `/api/` prefix**:
- `GET/POST /clients` — CRUD for clients (skin type, status: prospect/customer/later)
- `POST /sales` — create sales with items; auto-generates followups; transitions prospect→customer
- `GET /followups` — list pending followups; categorized as overdue/today/upcoming
- `POST /followups/{id}/complete` — mark followup as sent
- `GET /metrics/followups` — followup send rate and conversion tracking

`backend/app/db.py` — Supabase client using service key (bypasses RLS)
`backend/app/config.py` — loads env vars

### Mixed Data Access Pattern

Most data mutations go through FastAPI, but some reads query Supabase directly from the frontend:
- **Via FastAPI** (`lib/api.ts`): `createClient`, `getClients`, `createSale`, `getFollowups`, `completeFollowup`
- **Via Supabase directly**: client profile page (`/clients/[id]`) fetches client details and full sales history with joined `sale_items` and `products`

### Key Domain Concepts

- **Followups:** Auto-scheduled at 2 days, 2 weeks, and 2 months after a sale. Followup `type` values are `day2`, `week2`, `month2`. Message templates are generated in the backend's `generate_message()` function.
- **Client status:** `prospect` → `customer` automatically when first sale is recorded. Also `later` for deferred prospects.
- **Followup toggle:** Per-client `followup_enabled` flag controls whether the 2+2+2 schedule is created.
- **Timezone:** All scheduled dates use America/Santo_Domingo timezone.
- **Products table:** Referenced in `sale_items` joins; managed directly in Supabase (no backend CRUD endpoint).

### Subscription Plans

Three tiers: `free` | `basic` | `pro`. Stored in `profiles.subscription_plan`.

- **Hook:** `hooks/usePlan.ts` — exposes `{ plan, loading, can(requiredPlan) }`. Read plan from Supabase directly (no backend call).
- **Guard pattern:** `if (!planLoading && !can("basic")) return <UpgradeBanner requiredPlan="basic" />`
- **UpgradeBanner** (`components/UpgradeBanner.tsx`) — calls `usePlan()` internally; shows current plan + required plan. No props needed beyond `requiredPlan`.
- **Plan visibility standard:** the consultora must always know her current plan. Two mandatory touchpoints:
  1. `UpgradeBanner` — "Estás en el plan **X**. Esta función está disponible a partir del plan **Y**."
  2. Profile header (`/profile`) — badge de plan junto al badge de rol (solo visible para consultoras).
- **Plan colors:** Free → gray, Basic → blue, Pro → pink (`#E75480`)
- **Feature matrix:** Free = clientes/ventas/seguimientos básicos; Basic adds crédito, ganancias, workspace; Pro adds métricas avanzadas, WhatsApp, link registro, agenda.
- **Assignment:** manual por operador/admin desde `/operador/users` — sin pasarela de pago por ahora.

### Styling Conventions

- Tailwind CSS 4 with a custom pink theme (`#E75480`)
- Inline Tailwind classes (no CSS modules)
- Mobile-first with `md:` / `lg:` breakpoints
- Icons via `lucide-react`

## Environments

Two Supabase projects — local always apunta a DEV, PROD solo vive en los hostings:

| Ambiente | Supabase project | Frontend | Backend |
|----------|-----------------|----------|---------|
| DEV | `glowsuite-dev` (bawkkmcoqctbjxaqqgcx) | `frontend/.env.local` | `backend/.env` |
| PROD | `glowsuite` (nmfszmssahhposvaodml) | Variables en Vercel | Variables en Render |

**Regla:** nunca tocar variables de PROD localmente. Cualquier migración se aplica primero en DEV, se prueba, y luego se aplica en PROD via Supabase MCP apuntando al proyecto `nmfszmssahhposvaodml`.

## Environment Setup

**Frontend DEV** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://bawkkmcoqctbjxaqqgcx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key de glowsuite-dev>
```

**Backend DEV** (`backend/.env`):
```
SUPABASE_URL=https://bawkkmcoqctbjxaqqgcx.supabase.co
SUPABASE_KEY=<service_role key de glowsuite-dev>
```

**Frontend PROD** (Vercel environment variables):
```
NEXT_PUBLIC_API_URL=<URL del backend en Render>
NEXT_PUBLIC_SUPABASE_URL=https://nmfszmssahhposvaodml.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key de glowsuite PROD>
```

**Backend PROD** (Render environment variables):
```
SUPABASE_URL=https://nmfszmssahhposvaodml.supabase.co
SUPABASE_KEY=<service_role key de glowsuite PROD>
```
