# GlowSuite CRM — Infrastructure Analysis Report

**Generated:** 2026-04-22
**Purpose:** Risk assessment for two infrastructure swaps:
- **Swap 1:** Vercel Pro → Cloudflare Pages
- **Swap 2:** Render → Railway

---

## 1. Frontend Framework & Configuration

### Framework
- **Next.js:** 16.1.7 (App Router)
- **React:** 19.2.3
- **TypeScript:** 5.x
- **Styling:** Tailwind CSS 4 (PostCSS)
- **Package version:** 2026.04.19

### Rendering Strategy
- **Hybrid: Server Components + Client Components**
- Landing page (`app/page.tsx`), legal pages (`terminos`, `privacidad`, `ayuda`, `sales`), and all route wrappers are **Server Components** — export `metadata`, no `"use client"`
- All interactive pages use the `page.tsx` (server) + `*Client.tsx` (client) pattern introduced for SEO
- `app/robots.ts` and `app/sitemap.ts` — Next.js convention files, statically rendered
- `app/opengraph-image.tsx` — Edge Runtime (`ImageResponse`)
- No `getServerSideProps`, `getStaticProps`, or `generateStaticParams`
- No `revalidate` directives (no ISR)

### Vercel-Specific Features
| Feature | Used | Notes |
|---------|------|-------|
| SSR | ⚠️ | Route wrappers + landing are Server Components; interactive pages remain client-rendered |
| ISR / revalidate | ❌ | Not used |
| Edge Middleware | ❌ | No `middleware.ts` file |
| API Routes | ⚠️ | One route: `/auth/callback` (simple redirect) |
| next/image optimization | ❌ | Not used |
| `@vercel/*` packages | ❌ | None in package.json |
| `vercel.json` | ❌ | File does not exist |
| Build Output API | ❌ | Not used |

### API Routes
| Path | Method | Purpose |
|------|--------|---------|
| `/app/auth/callback/route.ts` | GET | Supabase OAuth callback — redirects to `/login?confirmed=1` |

Full content:
```typescript
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/login?confirmed=1`)
}
```

### `next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```
Minimal config — no custom webpack, rewrites, redirects, or image domains.

---

## 2. Backend Configuration

### Runtime
- **Language:** Python (version not pinned in requirements.txt)
- **Framework:** FastAPI 0.135.1
- **Server:** Uvicorn 0.42.0 (ASGI)
- **Validation:** Pydantic 2.12.5
- **Entry point:** `uvicorn app.main:app --reload`
- **Architecture:** Modular — `main.py` (47 lines) + `routers/` + `services/` + `schemas/` (~1,491 lines total)

### Long-Running & Background Features
| Feature | Present | Notes |
|---------|---------|-------|
| Long-running processes (>5 min) | ❌ | All endpoints are request-response only |
| WebSockets | ❌ | Package installed but zero `@app.websocket()` decorators |
| Cron jobs | ❌ | None — followups are data-driven, created at sale time |
| Background workers | ❌ | No Celery, RQ, APScheduler, or task queues |
| Scheduled tasks | ❌ | No platform-native scheduling used |
| Persistent connections | ❌ | Stateless HTTP only |

### Render-Specific Features
| Feature | Present |
|---------|---------|
| `render.yaml` | ❌ |
| Render-specific env vars | ❌ |
| Render Cron Jobs | ❌ |
| Render Background Workers | ❌ |
| Persistent Disks | ❌ |

### CORS
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Permissive — all origins allowed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Endpoint Inventory
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/` | Health check |
| GET | `/auth/me` | Current user profile |
| GET/POST | `/clients` | List / create clients |
| PATCH | `/clients/{client_id}` | Update client |
| DELETE | `/clients/{client_id}` | Delete client |
| POST | `/sales` | Create sale + followups + profit calc |
| DELETE | `/sales/{sale_id}` | Delete sale |
| POST/GET | `/sales/{sale_id}/payments` | Payment recording & history |
| GET | `/receivables` | Outstanding balances |
| GET | `/followups` | List pending followups |
| POST | `/followups/{id}/complete` | Mark followup as sent |
| PATCH | `/followups/{id}` | Update followup |
| GET | `/dashboard` | Dashboard summary stats |
| GET | `/metrics` | Full analytics with period filter |
| GET | `/metrics/followups` | Followup conversion rate |
| GET | `/products` | List products |
| GET | `/admin/users` | List all users (admin) |
| POST | `/admin/users` | Create user (admin) |
| PATCH | `/admin/users/{user_id}` | Update user / plan (admin) |
| DELETE | `/admin/users/{user_id}` | Delete user (admin) |
| POST | `/admin/users/{user_id}/reset-password` | Trigger password reset (admin) |
| GET | `/admin/dashboard` | Admin dashboard stats |

---

## 3. Environment Variables

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Backend (`backend/.env`)
```
SUPABASE_URL
SUPABASE_KEY
```

### Code References
- `process.env.NEXT_PUBLIC_API_URL` — `frontend/lib/api.ts`
- `process.env.NEXT_PUBLIC_SUPABASE_URL` — `frontend/lib/supabase/client.ts`
- `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` — `frontend/lib/supabase/client.ts`
- `os.getenv("SUPABASE_URL")` — `backend/app/config.py`
- `os.getenv("SUPABASE_KEY")` — `backend/app/config.py`

**Total external service dependencies:** 2
- Supabase — DB, Auth, Storage
- Resend — SMTP transaccional (`noreply@glowsuitecrm.com`) configurado en Supabase PROD

---

## 4. Deployment Config Files

| File | Exists | Notes |
|------|--------|-------|
| `vercel.json` | ❌ | Not present |
| `render.yaml` | ❌ | Not present |
| `railway.toml` | ❌ | Not present |
| `netlify.toml` | ❌ | Not present |
| `Dockerfile` | ❌ | Not present |
| `docker-compose.yml` | ❌ | Not present |
| `Procfile` | ❌ | Not present |
| `.vercelignore` | ❌ | Not present |
| `frontend/next.config.ts` | ✅ | Minimal (see Section 1) |

**No deployment lock-in configuration exists.** The project relies entirely on platform defaults.

---

## 5. Package.json — Full Dependencies

### `frontend/package.json`
```json
{
  "name": "glowsuite",
  "version": "2026.04.19",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.99.2",
    "lucide-react": "^0.577.0",
    "next": "16.1.7",
    "react": "19.2.3",
    "react-dom": "19.2.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.7",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

**Platform-specific packages:**
- `@vercel/*` — ❌ None
- `@cloudflare/*` — ❌ None
- `@aws-sdk/*` — ❌ None

### Backend Key Dependencies (`requirements.txt`)

| Package | Version | Used |
|---------|---------|------|
| `fastapi` | 0.135.1 | ✅ Core framework |
| `uvicorn` | 0.42.0 | ✅ ASGI server |
| `pydantic` | 2.12.5 | ✅ Data validation |
| `supabase` | 2.28.2 | ✅ DB client |
| `python-dotenv` | 1.2.2 | ✅ Env loading |
| `httpx` | 0.28.1 | ✅ HTTP client (Supabase SDK) |
| `tzdata` | 2025.3 | ✅ Timezone data (America/Santo_Domingo) |
| `PyJWT` | 2.12.1 | ⚠️ Installed, not directly used |
| `websockets` | 15.0.1 | ⚠️ Installed, not used |
| `realtime` | 2.28.2 | ⚠️ Supabase sub-dep, not used |
| `storage3` | 2.28.2 | ⚠️ Supabase sub-dep, not used |

---

## 6. Directory Structure (2-level)

```
glowsuite/
├── CLAUDE.md
├── glowsuitecrm-infra-report.md   ← this file
├── backend/
│   ├── app/
│   │   ├── main.py                (47 lines — app init + router registration)
│   │   ├── db.py                  (Supabase client init)
│   │   ├── config.py              (env var loading)
│   │   ├── utils.py               (shared helpers)
│   │   ├── routers/               (modular route handlers)
│   │   │   ├── admin.py           (350 lines)
│   │   │   ├── auth.py            (60 lines)
│   │   │   ├── clients.py         (81 lines)
│   │   │   ├── dashboard.py       (115 lines)
│   │   │   ├── followups.py       (100 lines)
│   │   │   ├── metrics.py         (298 lines)
│   │   │   ├── products.py        (10 lines)
│   │   │   └── sales.py           (292 lines)
│   │   ├── services/
│   │   │   ├── followup_service.py (119 lines)
│   │   │   └── sale_service.py     (13 lines)
│   │   └── schemas/
│   │       ├── clients.py          (26 lines)
│   │       └── sales.py            (27 lines)
│   ├── requirements.txt
│   └── .env                       (secrets, not in repo)
└── frontend/
    ├── app/                       (Next.js App Router)
    │   ├── LandingEffects.tsx     (client component — tab slider + fade-up effects)
    │   ├── robots.ts              (→ /robots.txt)
    │   ├── sitemap.ts             (→ /sitemap.xml)
    │   ├── opengraph-image.tsx    (→ /opengraph-image, Edge Runtime)
    │   ├── admin/dashboard/
    │   │   ├── page.tsx           (server wrapper — noindex metadata)
    │   │   └── AdminDashboardClient.tsx
    │   ├── agenda/
    │   ├── auth/
    │   │   ├── callback/          (Supabase OAuth redirect)
    │   │   ├── confirmed/         (post-signup signOut)
    │   │   └── update-password/   (password reset flow)
    │   ├── ayuda/
    │   ├── clients/
    │   │   ├── [id]/
    │   │   ├── new/
    │   │   ├── page.tsx           (server wrapper — noindex metadata)
    │   │   └── ClientsClient.tsx
    │   ├── dashboard/
    │   │   ├── page.tsx           (server wrapper — noindex metadata)
    │   │   └── DashboardClient.tsx
    │   ├── followups/
    │   │   ├── page.tsx           (server wrapper — noindex metadata)
    │   │   └── FollowupsClient.tsx
    │   ├── login/
    │   │   ├── page.tsx           (server wrapper — noindex metadata)
    │   │   └── LoginClient.tsx
    │   ├── metrics/
    │   │   ├── page.tsx           (server wrapper — noindex metadata)
    │   │   └── MetricsClient.tsx
    │   ├── operador/users/
    │   │   ├── page.tsx           (server wrapper — noindex metadata)
    │   │   └── OperadorUsersClient.tsx
    │   ├── privacidad/
    │   ├── profile/
    │   │   ├── page.tsx           (server wrapper — noindex metadata)
    │   │   └── ProfileClient.tsx
    │   ├── register/
    │   │   ├── page.tsx           (server wrapper)
    │   │   └── RegisterClient.tsx
    │   ├── sales/new/
    │   ├── terminos/
    │   ├── layout.tsx             (global metadata — title template, OG, Twitter card)
    │   └── page.tsx               (landing — server component, metadata + JSON-LD)
    ├── components/
    │   ├── ClientLayout.tsx
    │   ├── Navbar.tsx
    │   ├── UpgradeBanner.tsx
    │   ├── UserMenu.tsx
    │   └── ui/
    │       ├── AuthButton.tsx
    │       ├── AuthCard.tsx
    │       └── AuthInput.tsx
    ├── hooks/
    │   ├── useAuth.ts
    │   └── usePlan.ts
    ├── lib/
    │   ├── api.ts
    │   ├── auth-config.ts         (PUBLIC_ROUTES definition)
    │   ├── auth.ts
    │   ├── supabase.js
    │   └── supabase/
    ├── public/
    │   ├── logo.svg
    │   ├── favicon.svg
    │   └── screenshots/           (UI screenshots para landing)
    ├── next.config.ts
    ├── package.json
    ├── tsconfig.json
    ├── postcss.config.mjs
    └── .env.local                 (secrets, not in repo)
```

---

## 7. Migration Risk Assessment

### Swap 1: Vercel Pro → Cloudflare Pages

**Risk Level: 🟡 LOW-MEDIUM** *(subió de 🟢 LOW por introducción de Server Components)*

| Item | Risk | Detail |
|------|------|--------|
| SSR pages | ⚠️ Minor | Route wrappers + landing are now Server Components — need CF Pages adapter to handle them |
| ISR / revalidate | ✅ None | Not used |
| Edge Middleware | ✅ None | No `middleware.ts` |
| next/image | ✅ None | Not used |
| Vercel packages | ✅ None | No `@vercel/*` dependencies |
| API Route `/auth/callback` | ⚠️ Minor | Simple redirect — can be replaced with a Cloudflare Worker or Pages Function |
| `vercel.json` | ✅ None | File doesn't exist, no config to migrate |
| Build command | ✅ Compatible | `npm run build` outputs standard `.next` |

**Action required for Cloudflare Pages:**
1. Add `@cloudflare/next-on-pages` adapter (or use `@opennextjs/cloudflare`)
2. Replace `/auth/callback` route with a Cloudflare Pages Function
3. Set env vars in Cloudflare dashboard: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Known constraint:** Cloudflare Pages uses the Edge Runtime — verify `@supabase/supabase-js` is edge-compatible (it is as of v2).

---

### Swap 2: Render → Railway

**Risk Level: 🟢 VERY LOW**

| Item | Risk | Detail |
|------|------|--------|
| Runtime | ✅ None | Standard Python ASGI — runs anywhere |
| Long-running processes | ✅ None | All endpoints are short request-response |
| WebSockets | ✅ None | Package installed but not used |
| Cron jobs | ✅ None | No scheduled tasks |
| Background workers | ✅ None | Stateless only |
| Render-specific config | ✅ None | No `render.yaml` |
| Persistent disk | ✅ None | No local file storage |
| Environment vars | ✅ Minor | Reconfigure 2 vars in Railway dashboard |

**Action required for Railway:**
1. Create new Railway service pointing to `backend/` directory
2. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Set env vars: `SUPABASE_URL`, `SUPABASE_KEY`
4. Optionally add `railway.toml` for explicit config

---

## 8. Summary

| Swap | Risk Level | Blockers | Actions Required |
|------|-----------|----------|-----------------|
| Vercel → Cloudflare Pages | 🟢 Low | None | Add CF adapter, migrate auth callback route, set env vars |
| Render → Railway | 🟢 Very Low | None | Point to backend dir, set start command, set env vars |

**Both migrations are low-risk.** The project has zero platform-specific lock-in — no `vercel.json`, no `render.yaml`, no platform packages, no edge-only APIs, no background workers, no long-running processes. It's a standard Next.js SPA + Python FastAPI stack that runs on any modern hosting platform.

---

*Report updated by Claude Code on 2026-04-22 (SEO refactor — Server Components introducidos). Original generated 2026-04-09. Archivo: `glowsuitecrm-infra-report.md`*
