# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack CRM for Mary Kay consultants in the Dominican Republic. Spanish-language UI for tracking clients, sales, and automated followup scheduling (2-day, 2-week, 2-month cycles).

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

All logic lives in `backend/app/main.py` (single-file FastAPI app):
- `/api/clients` — CRUD for clients (skin type, status: prospect/customer/later)
- `/api/sales` — create sales with items; auto-generates followups; transitions prospect→customer
- `/api/followups` — list/complete/mark-sent; categorized as overdue/today/upcoming
- `/api/metrics` — followup send rate and conversion tracking

`backend/app/db.py` — Supabase client using service key (bypasses RLS)
`backend/app/config.py` — loads env vars

### Key Domain Concepts

- **Followups:** Auto-scheduled at 2 days, 2 weeks, and 2 months after a sale. Each has a type (`2_days`, `2_weeks`, `2_months`), status, and message template. Templates are backend-driven and editable by the user before sending.
- **Client status:** `prospect` → `customer` automatically when first sale is recorded. Also `later` for deferred prospects.
- **Followup toggle:** Per-client `followup_enabled` flag controls whether the 2+2+2 schedule is created.
- **Timezone:** All scheduled dates use America/Santo_Domingo timezone.

### Styling Conventions

- Tailwind CSS 4 with a custom pink theme (`#E75480`)
- Inline Tailwind classes (no CSS modules)
- Mobile-first with `md:` / `lg:` breakpoints
- Icons via `lucide-react`

## Environment Setup

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=<supabase project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
```

**Backend** (`backend/.env`):
```
SUPABASE_URL=<supabase project url>
SUPABASE_KEY=<supabase service role key>
```
