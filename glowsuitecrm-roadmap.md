# GlowSuite — Roadmap de Producto

**Última actualización:** 2026-04-24 (logo kit oficial integrado en todas las páginas)
**Fase actual:** Piloto activo — plan Free disponible al público, Basic/Pro pendientes de precio

---

## Contexto del producto

**GlowSuite** es un CRM para consultoras de belleza en la República Dominicana, construido específicamente para el flujo de trabajo de Mary Kay: registrar clientes, registrar ventas, hacer seguimiento post-venta (ciclo 2-2-2) y cobrar. El producto corre en `glowsuitecrm.com`.

**Equipo fundador:**
| Nombre | Rol |
|--------|-----|
| Ángel Brito | CEO & Fundador |
| Esmeiry Carmona | Directora de Operaciones |
| Luisa Ramírez | Co-fundadora & Embajadora Comercial |

**Stack:**
- Frontend: Next.js 16 App Router + React 19 + Tailwind CSS 4 → Vercel
- Backend: Python FastAPI (arquitectura modular) → Render
- Base de datos y Auth: Supabase (DEV: `glowsuite-dev`, PROD: `glowsuite`)
- Email transaccional: Resend via `noreply@glowsuitecrm.com`

---

## Estado general

| Área | Estado |
|------|--------|
| Infraestructura DEV/PROD | ✅ Activo |
| Autenticación y registro | ✅ Activo |
| Landing page + Logo Kit | ✅ Activo |
| SEO + metadata + robots/sitemap | ✅ Activo |
| Blog SEO (4 artículos + JSON-LD) | ✅ Activo |
| Posicionamiento legal (no afiliación) | ✅ Activo |
| Core CRM (clientes, ventas, seguimientos) | ✅ Activo |
| Métricas y dashboard | ✅ Activo |
| Ganancias y metas | ✅ Activo |
| Crédito y cobros | ✅ Activo |
| Panel de administración | ✅ Activo |
| Planes Free/Basic/Pro | ✅ Activo |
| SMTP branded (Resend) | ✅ Activo |
| WhatsApp automático | ⏸ En pausa |
| Agenda / reservas | 🔲 Pendiente |
| Link de registro de clientes | 🔲 Pendiente |
| Pasarela de pagos (Stripe) | 🔲 Pendiente |

---

## Planes de suscripción

| Feature | Free | Basic | Pro |
|---------|:----:|:-----:|:---:|
| Clientes, ventas, dashboard | ✅ | ✅ | ✅ |
| Seguimientos 2+2+2 | ✅ | ✅ | ✅ |
| Metas de negocio / workspace | ✅ | ✅ | ✅ |
| Crédito y cobros | ❌ | ✅ | ✅ |
| Métricas avanzadas | ❌ | ❌ | ✅ (próximamente) |
| WhatsApp automático | ❌ | ❌ | ✅ (próximamente) |
| Link de registro de clientes | ❌ | ❌ | ✅ (próximamente) |
| Agenda / reservas | ❌ | ❌ | ✅ (próximamente) |

**Precios (landing):** Free $0 / Basic $9 USD / Pro $19 USD
**Asignación:** manual por admin/operador desde `/operador/users` — sin pasarela de pago por ahora.
**Piloto:** Basic y Pro desactivados en la landing, solo Free disponible para registro público.

---

## Features completadas

### Infra — Ambientes DEV / PROD ✅
Dos proyectos Supabase independientes. Local apunta a DEV siempre. PROD solo se toca desde Vercel/Render/MCP.
- DEV: `glowsuite-dev` (`bawkkmcoqctbjxaqqgcx`)
- PROD: `glowsuite` (`nmfszmssahhposvaodml`)
- Regla: migraciones primero en DEV, luego replicar en PROD via Supabase MCP.

---

### Feature 1 — Dashboard métricas ✅
KPIs de ventas con filtro por período (semana / mes / mes anterior / año), gráfica SVG de evolución, top productos, formas de pago, pipeline de prospectos, seguimientos y tipo de piel.

**Endpoint:** `GET /metrics?period=week|month|last_month|year`
**Ruta frontend:** `/metrics` (requiere plan Pro — "próximamente" en UI)

---

### Feature 2 — Ganancia y metas ✅
La consultora registra su meta mensual en su perfil. El dashboard y métricas muestran la ganancia neta y el progreso contra la meta.

**Lógica:** precio catálogo = 100%, consultora paga 50% a Mary Kay, retiene el otro 50%.
`profit = total_venta - (subtotal_items × 0.5)`

**DB:** `sales.profit`, `profiles.monthly_goal`
**Rutas:** `/profile` (ingresar meta), `/dashboard` (barra de progreso), `/metrics` (KPI ganancia neta)

---

### Feature 3 — Crédito y cobros ✅
Las clientas no siempre pagan completo. El sistema permite registrar abonos parciales y llevar historial de pagos por venta.

**DB:** tabla `payments` (sale_id, amount, payment_type, payment_date), `sales.amount_paid`, `sales.status` extendido: `pendiente | parcial | pagado`
**Endpoints:** `POST /sales/{id}/payments`, `GET /sales/{id}/payments`, `GET /receivables`
**UI:** formulario de abono en `/clients/[id]`, vista de cuentas por cobrar en `/dashboard`

---

### Feature 6 — Panel de administración ✅
Panel para que admin/operador gestione las consultoras del sistema.

**Funciones:** CRUD de usuarios, cambio de plan y estado (activo/inactivo), reset de contraseña, KPIs generales.
**DB:** `profiles.role` (`consultora | admin | operador`), `profiles.is_active`, `profiles.subscription_plan`
**Rutas:** `/admin/dashboard` (admin), `/operador/users` (admin + operador)
**Endpoints:** `GET/POST/PATCH/DELETE /admin/users`, `POST /admin/users/{id}/reset-password`, `GET /admin/dashboard`

---

### Feature 7 — Workspace seguimientos + cobros ✅
Vista unificada en una sola pantalla: seguimientos pendientes (overdue / hoy / próximos) + cuentas por cobrar. Elimina tener que navegar entre dos secciones.

**Ruta frontend:** `/followups`

---

### Feature 9 — Planes Free / Basic / Pro ✅
Sistema de membresía con tres tiers. Guards en frontend bloquean features según el plan de la consultora y muestran el `UpgradeBanner` correspondiente.

**Implementación:**
- `profiles.subscription_plan TEXT DEFAULT 'free'`
- `hooks/usePlan.ts` → `{ plan, loading, can(requiredPlan) }`
- `UpgradeBanner.tsx` — basic: lock + CTA WhatsApp; pro: "Próximamente" con Clock icon
- Badge de plan en `/profile` (solo consultoras)
- Navbar filtra items según `minPlan`

---

### Landing page + Logo Kit ✅
Página pública en `/` con presentación del producto, capturas de pantalla, sección de precios, equipo y CTA de registro.

**Logo kit oficial:** `public/logos/` — 8 variantes SVG (`horizontal`, `horizontal-white`, `horizontal-dark`, `horizontal-mono`, `stacked`, `icon`, `icon-dark`, `icon-outline`).
- `public/logo.svg` y `public/favicon.svg` — archivos base (horizontal color e ícono); usados por landing, terminos, privacidad.
- `Navbar.tsx` — logo horizontal color (`/logos/glowsuite-crm-horizontal.svg`) sobre fondo blanco.
- `AuthCard.tsx` — logo horizontal white (`/logos/glowsuite-crm-horizontal-white.svg`) sobre panel rosa `#E75480`.
- Blog y ayuda — nav con logo horizontal color añadida.
- `app/opengraph-image.tsx` — OG 1200×630 construido inline con JSX (no puede cargar SVG externos).

**Convención:** "GlowSuite" — Glow en `#E75480`, Suite en `#1A1A2E`. Nunca construir el logo con iconos Lucide + texto.

---

### SEO completo ✅
Metadata estructurada, robots.txt, sitemap.xml, JSON-LD y patrón server wrapper para todas las páginas. Validado en producción el 2026-04-22.

**Implementación:**
- `app/layout.tsx` — metadata global con title template, OG, Twitter card, canonical, keywords nominativas
- `app/robots.ts` / `app/sitemap.ts` — convenciones Next.js para `/robots.txt` y `/sitemap.xml`
- `app/page.tsx` — server component con metadata específica + JSON-LD `SoftwareApplication`
- `app/LandingEffects.tsx` — efectos DOM (tab slider, fade-up) extraídos como `"use client"`
- Patrón `page.tsx` (server) + `*Client.tsx` (client) aplicado a todas las rutas con metadata

**Valores actuales landing (`app/page.tsx`):**
- `title`: "GlowSuite CRM — CRM para consultoras de belleza en RD" (53 chars — optimizado para SERPs)
- `description`: "Organiza tus clientes, ventas y seguimientos con el sistema 2+2+2. Para consultoras de Mary Kay, Yanbal, Avon y venta directa en RD. Empieza gratis hoy." (153 chars)

**Rutas indexables:** `/`, `/register`, `/blog`, `/blog/[slug]`, `/ayuda`, `/terminos`, `/privacidad`
**Rutas bloqueadas:** `/dashboard`, `/clients`, `/sales`, `/followups`, `/metrics`, `/profile`, `/admin`, `/operador`, `/auth/`

**Validación en producción (2026-04-22):** title, description, keywords, canonical, robots, googlebot, OG completo, Twitter card, JSON-LD, robots.txt y sitemap.xml — todos confirmados. Sin hreflang (sitio monolingüe, no crítico).

**Fix canónicas (2026-04-24):** Google Search Console detectó inconsistencia — algunas páginas declaraban canónicas sin www (`https://glowsuitecrm.com/...`). Corregido en `app/blog/page.tsx`, `app/blog/[slug]/page.tsx` (canonical + OG url + JSON-LD author/publisher), `app/terminos/page.tsx` y `app/sitemap.ts`. URL canónica estándar: `https://www.glowsuitecrm.com`.

---

### Blog SEO — 4 artículos + JSON-LD ✅

Contenido editorial en `/blog` orientado a SEO long-tail para consultoras de venta directa en RD. Rich snippets en Google para `/ayuda`.

**Rutas:**
- `/blog` — índice con grid de 4 artículos (Server Component, `metadata` + canonical)
- `/blog/[slug]` — artículos individuales (`generateStaticParams`, `generateMetadata`, JSON-LD `Article`, OG `article`)
- `/ayuda` — reemplazada con diseño Tailwind + JSON-LD `FAQPage` (20 preguntas en 6 categorías)

**Artículos publicados (2026-04-22):**
1. `como-organizar-clientes-mary-kay` — Organización (6 min)
2. `sistema-2-2-2-seguimiento-post-venta` — Ventas (7 min)
3. `como-llevar-cuentas-negocio-venta-directa` — Finanzas (8 min)
4. `como-saber-quien-te-debe-dinero-belleza` — Cobros (5 min)

**Fuente de verdad:** `frontend/app/blog/posts.ts` (sincronizar con `sitemap.ts` al agregar artículos)

**Dependencia:** `@tailwindcss/typography` (dev) — activado con `@plugin "@tailwindcss/typography"` en `globals.css`

**Acceso:** link "Blog" en el footer de la landing. `/blog` agregado a `PUBLIC_ROUTES` con check `startsWith` para cubrir subrutas.

---

### Posicionamiento legal — No afiliación ✅
Disclaimer de software independiente en todos los puntos de contacto legales y UI.

**Implementación:**
- Footer landing (`app/page.tsx`) — texto centrado debajo del copyright
- Footer layout autenticado (`components/ClientLayout.tsx`) — mismo disclaimer para páginas de app
- `app/terminos/page.tsx` — Art. 00 "Independencia y no afiliación" al inicio del documento
- `app/privacidad/page.tsx` — sección "Datos y terceros" al inicio
- `app/ayuda/page.tsx` — FAQ "¿GlowSuite CRM es oficial de Mary Kay?" en nueva categoría "Sobre GlowSuite CRM"
- Copy landing: hero menciona "venta directa"; nominative fair use bajo precios; badge en sección equipo
- `metadata.keywords` en `layout.tsx` incluye keywords de marca (nominative fair use, no visibles en UI)

---

### Autenticación — Registro y recuperación de contraseña ✅
Flujo completo de auth sin invite: registro público → email de confirmación → login manual. Recuperación de contraseña por email.

**Páginas:**
- `/register` — registro público de consultoras
- `/auth/confirmed` — post-confirmación; hace `signOut()` para evitar auto-login
- `/login` — incluye flujo inline de "olvidé mi contraseña"
- `/auth/update-password` — establece nueva contraseña desde token del email

**DB trigger:** `on_auth_user_created` → auto-crea fila en `profiles` con `role='consultora'`, `is_active=true`, `plan='free'`

---

### SMTP Branded — Resend ✅
Emails de auth salen desde `noreply@glowsuitecrm.com` con nombre de remitente "GlowSuite".

**Configuración en Supabase PROD:** `smtp.resend.com:465`, user: `resend`, password: API key de Resend
**Dominio:** verificado en Namecheap con registros TXT + MX → Resend

---

### Refactor — Arquitectura modular backend ✅
El backend pasó de un `main.py` monolítico (756 líneas) a una arquitectura en capas:
- `routers/` — 8 módulos de rutas
- `services/` — lógica de negocio separada (`followup_service`, `sale_service`)
- `schemas/` — modelos Pydantic (`clients`, `sales`)
- `main.py` — 47 líneas, solo registra routers y middleware

---

## Features en pausa

### Feature 4 — Recordatorios WhatsApp ⏸

**Estado:** diseño cerrado, implementación bloqueada por pasos previos en Meta.

**Decisiones tomadas:**
| Decisión | Resolución |
|---------|------------|
| API a usar | Meta WhatsApp Cloud API (oficial, gratis hasta 1,000 conv/mes) |
| Número por consultora o centralizado | Cada consultora usa su propio número Business |
| Disparo automático o manual | Manual — la consultora revisa el mensaje antes de enviar |
| Sin número Business (fallback) | `wa.me` link (cero regresión) |
| Templates | Globales (un set aprobado para todas) |

**Templates pendientes de aprobación Meta (categoría UTILITY):**
| Template | Variables |
|--------|-----------|
| `seguimiento_2_dias` | `{{1}}` nombre clienta, `{{2}}` producto |
| `seguimiento_2_semanas` | `{{1}}` nombre clienta |
| `seguimiento_2_meses` | `{{1}}` nombre clienta |
| `cobro_pendiente` | `{{1}}` nombre clienta, `{{2}}` monto, `{{3}}` fecha |

**Flujo de envío propuesto:**
1. Consultora ve seguimiento pendiente en `/followups`
2. Click "Enviar por WhatsApp" → modal con preview del mensaje (variables rellenas, editables)
3. Confirma → backend llama Meta Cloud API con `phone_number_id` de la consultora
4. Webhook recibe estado (sent/delivered/read/failed) → followup se marca enviado automáticamente

**DB necesaria:**
```sql
ALTER TABLE profiles ADD COLUMN wa_phone_number_id TEXT;
ALTER TABLE profiles ADD COLUMN wa_access_token TEXT;
ALTER TABLE profiles ADD COLUMN wa_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE followups ADD COLUMN wa_message_id TEXT;
ALTER TABLE followups ADD COLUMN wa_status TEXT;
```

**Endpoints nuevos:**
- `POST /followups/{id}/send-whatsapp`
- `POST /webhooks/whatsapp`
- `POST /auth/whatsapp/connect`

**Pasos previos antes de implementar:**
- [ ] Crear Meta App como plataforma (no negocio individual)
- [ ] Habilitar permisos `whatsapp_business_management` + `whatsapp_business_messaging`
- [ ] Someter los 4 templates para aprobación
- [ ] Decidir cifrado para `wa_access_token` en Supabase
- [ ] Verificar Facebook Business Manager

---

## Features pendientes

### Feature 5 — Agenda / reservas 🔲

**Contexto:** la consultora necesita agendar citas con clientas (demostraciones, pruebas de productos, retoques). No existe en el sistema todavía.
**Plan:** Pro (próximamente)

**Requiere:**
- Tabla nueva `appointments` (no existe)
- CRUD completo en backend
- Vista de calendario en frontend
- Integración futura con Feature 4 (WhatsApp) para recordatorios automáticos

---

### Feature 8 — Link de registro de clientes 🔲

**Contexto:** la consultora comparte un link único y la clienta llena sus propios datos. Elimina el paso manual de registrar a cada clienta.
**Plan:** Pro (próximamente)

**Flujo propuesto:**
1. Consultora en `/clients` → "Generar enlace de registro"
2. Sistema genera token único atado a su `user_id` → URL: `/register/[token]`
3. Consultora comparte el link (WhatsApp, etc.)
4. Clienta abre el link → formulario público sin login: nombre, teléfono, tipo de piel
5. Backend crea el cliente en `clients` con el `user_id` de la consultora

**DB necesaria:**
```sql
CREATE TABLE registration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  consultant_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE
);
```

**Endpoints nuevos:**
- `POST /registration-tokens` — genera/devuelve token activo
- `GET /register/{token}` — valida token, devuelve nombre de consultora
- `POST /register/{token}` — crea cliente (sin auth)

**Ruta pública frontend:** `/register/[token]`

---

### Pasarela de pagos (Stripe) 🔲

**Contexto:** hoy el admin asigna planes manualmente. Cuando salga el piloto, las consultoras deben poder suscribirse solas.
**Decisiones pendientes:**
- [ ] Precio mensual de Basic y Pro
- [ ] ¿Precio anual con descuento?
- [ ] ¿Qué pasa con las usuarias del piloto al terminar?
- [ ] ¿Trial de 1 mes al registrarse?

---

## Deuda técnica — Seguridad

Re-auditada 2026-04-22. S1/S2/S3 confirmados resueltos o no aplicables al stack actual.

| # | Problema | Severidad | Estado | Detalle |
|---|---------|-----------|--------|---------|
| S4 | Sin rate limiting en FastAPI | Baja→Media | ⏸ Diferir | Implementar **antes** de Feature 8 — el endpoint público `/register/[token]` lo expone |
| S5 | `x-user-id` sin validación JWT | Media | ✅ Resuelto | Middleware en `main.py` valida JWT de Supabase y verifica que `sub == x-user-id` en cada request autenticado |
| S6 | Endpoint `/test-db` expuesto sin auth | Alta | ✅ Resuelto | Eliminado de `main.py` |

---

## Email de contacto

`hola@glowsuitecrm.com` → pendiente configurar reenvío a Gmail desde Namecheap Email Forwarding.

---

*Documento generado por Claude Code — refleja el estado del branch `main` al 2026-04-24.*
