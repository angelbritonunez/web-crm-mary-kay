# GlowSuite — Roadmap de Producto

**Última actualización:** 2026-04-22
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
| Landing page | ✅ Activo |
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

### Landing page + Branding ✅
Página pública en `/` con presentación del producto, capturas de pantalla, sección de precios, equipo y CTA de registro.

**Assets:** `public/logo.svg` (bicolor GlowSuite), `public/favicon.svg`, `app/opengraph-image.tsx` (OG 1200×630 para WhatsApp)
**Convención:** "GlowSuite" — Glow en `#E75480`, Suite en `#1A1A2E`. No mencionar "Mary Kay" en copy público.

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

*Documento generado por Claude Code — refleja el estado del branch `develop` al 2026-04-22.*
