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
- `components/ClientLayout.tsx` — wraps all authenticated pages; handles auth state, redirects, and renders footer with disclaimer
- `lib/api.ts` — all backend API calls (centralizes `x-user-id` header injection)
- `lib/supabase.js` — Supabase browser client singleton

### SEO — Patrón de metadata

Las páginas con `"use client"` no pueden exportar `metadata` de Next.js. El patrón aplicado en todo el proyecto:
- `app/foo/page.tsx` — Server Component que exporta `metadata` y renderiza `<FooClient />`
- `app/foo/FooClient.tsx` — el componente original con `"use client"` (hooks, estado, efectos)
- `app/LandingEffects.tsx` — efectos DOM de la landing (tab slider, fade-up) extraídos como client component; `app/page.tsx` es servidor
- `app/robots.ts` — genera `/robots.txt`; desindexar todas las rutas autenticadas
- `app/sitemap.ts` — genera `/sitemap.xml`; solo las 4 rutas públicas
- `app/opengraph-image.tsx` — imagen OG 1200×630 generada con `ImageResponse`

**Rutas autenticadas** → `robots: { index: false, follow: false }` en su `page.tsx` server wrapper.

**Guías de longitud para metadata:**
- `title`: máximo ~55 caracteres (Google trunca a ~60). Ejemplo actual landing: *"GlowSuite CRM — CRM para consultoras de belleza en RD"* (53 chars)
- `description`: 150–160 caracteres. Ejemplo actual landing: *"Organiza tus clientes, ventas y seguimientos con el sistema 2+2+2. Para consultoras de Mary Kay, Yanbal, Avon y venta directa en RD. Empieza gratis hoy."* (153 chars)

### Posicionamiento de marca

GlowSuite CRM es un **software independiente** sin afiliación con ninguna empresa de venta directa. Reglas de copy:
- Mencionar "Mary Kay, Yanbal, Avon" está permitido en contexto **nominative fair use** (descriptivo, no implica afiliación)
- Disclaimer de no afiliación obligatorio en: footer landing, footer layout autenticado, Términos Art. 00, Política de Privacidad sección "Datos y terceros", Ayuda FAQ
- Keywords SEO con nombres de marcas en `metadata.keywords` (no visibles en UI) **y** en `metadata.description` de la landing (nominative fair use)

### Backend Structure

Modular FastAPI app. `main.py` (47 lines) registers routers only. Routes have **no `/api/` prefix**:

| Router | Routes |
|--------|--------|
| `routers/clients.py` | GET/POST/PATCH/DELETE `/clients` |
| `routers/sales.py` | POST/DELETE `/sales`, GET/POST `/sales/{id}/payments`, GET `/receivables` |
| `routers/followups.py` | GET `/followups`, POST `/followups/{id}/complete`, PATCH `/followups/{id}` |
| `routers/metrics.py` | GET `/metrics`, GET `/metrics/followups` |
| `routers/dashboard.py` | GET `/dashboard` |
| `routers/products.py` | GET `/products` |
| `routers/auth.py` | GET `/auth/me` |
| `routers/admin.py` | GET/POST/PATCH/DELETE `/admin/users`, GET `/admin/dashboard`, POST `/admin/users/{id}/reset-password` |

`backend/app/db.py` — Supabase client using service key (bypasses RLS)
`backend/app/config.py` — loads `SUPABASE_URL`, `SUPABASE_KEY`, `ALLOWED_ORIGIN`
`backend/app/services/` — business logic (`followup_service.py`, `sale_service.py`)
`backend/app/schemas/` — Pydantic models (`clients.py`, `sales.py`)

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

### Auth Flow

- **Login:** `app/login/page.tsx` — incluye flujo inline de recuperación de contraseña
- **Recuperación de contraseña:** llama `supabase.auth.resetPasswordForEmail()` con `redirectTo: https://glowsuitecrm.com/auth/update-password`
- **Nueva contraseña:** `app/auth/update-password/page.tsx` — Supabase crea sesión automáticamente desde el token del email; la ruta está en `PUBLIC_ROUTES` para evitar redirect al dashboard
- **Confirmación de cuenta:** `app/auth/confirmed/page.tsx` — hace `signOut()` para evitar auto-login
- **Rutas públicas:** definidas en `lib/auth-config.ts` → `PUBLIC_ROUTES`. Cualquier ruta auth nueva debe agregarse ahí o `useAuth` redirige al dashboard
- **Roles:** `consultora` | `admin` | `operador`. Definidos en `lib/auth-config.ts` → `ALLOWED_ROUTES` y `DEFAULT_REDIRECT`. Guardados en `profiles.role`
  - `consultora` → redirige a `/dashboard`
  - `admin` → redirige a `/admin/dashboard`
  - `operador` → redirige a `/operador/users`

### Styling Conventions

- Tailwind CSS 4 with a custom pink theme (`#E75480`)
- Inline Tailwind classes (no CSS modules)
- Mobile-first with `md:` / `lg:` breakpoints
- Icons via `lucide-react`

## Dominio y Email

- **Dominio:** `glowsuitecrm.com` — comprado en Namecheap, apunta a Vercel (frontend)
- **SMTP transaccional:** Resend — `noreply@glowsuitecrm.com`, configurado en Supabase PROD (Settings → Auth → SMTP). Host: `smtp.resend.com:465`, user: `resend`, password: API key de Resend
- **Templates de email:** personalizados en Supabase PROD → Authentication → Email Templates (HTML en español con branding GlowSuite)
- **Email de contacto:** pendiente — reenvío desde `hola@glowsuitecrm.com` a Gmail (Namecheap Email Forwarding, aún no configurado)

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
ALLOWED_ORIGIN=http://localhost:3000
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
ALLOWED_ORIGIN=https://glowsuitecrm.com
```

## Documentación del proyecto

| Archivo | Propósito |
|---------|-----------|
| `glowsuitecrm-roadmap.md` | Roadmap de producto — features completadas, en pausa, pendientes, deuda técnica |
| `glowsuitecrm-infra-report.md` | Análisis de infraestructura — riesgo de migración Vercel/Render → CF/Railway |
| `glowsuite-test-script.md` | Script de pruebas funcionales — consultora (correr antes de mergear a main) |
| `glowsuite-test-script-admin.md` | Script de pruebas — flujo admin |
| `glowsuite-test-script-operador.md` | Script de pruebas — flujo operador |
| `glowsuite-presentacion-piloto.md` | Presentación del piloto para el equipo |
