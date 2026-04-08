"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

// ── Types ─────────────────────────────────────────────────────────────────────

type Client = {
  id: string
  name: string
  phone: string
  email?: string | null
  skin_type: string | null
  status: string
  followup_enabled: boolean
  created_at: string
}

type SaleItem = {
  quantity: number
  price: number
  product: { name: string } | null
}

type Sale = {
  id: string
  total: number
  discount: number
  payment_type: string
  status: string
  created_at: string
  sale_items: SaleItem[]
}

type Followup = {
  id: string
  type: string
  scheduled_date: string
  status: string
  mensaje: string | null
}

type Tab = "info" | "sales" | "followups"

// ── Constants ─────────────────────────────────────────────────────────────────

const SKIN_TYPES = [
  "Seca",
  "Grasa",
  "Mixta",
  "Normal",
  "Sensible piel grasa",
  "Sensible piel seca",
  "Envejecimiento moderado",
  "Envejecimiento avanzado",
]

const inputClass =
  "w-full border border-gray-200 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E75480] focus:border-transparent transition"

const labelClass =
  "block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "").slice(0, 10)
  if (digits.length < 10) return phone || "Sin teléfono"
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10)
  const p1 = digits.slice(0, 3)
  const p2 = digits.slice(3, 6)
  const p3 = digits.slice(6, 10)
  if (digits.length <= 3) return p1
  if (digits.length <= 6) return `(${p1}) ${p2}`
  return `(${p1}) ${p2}-${p3}`
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Santo_Domingo",
  }).format(new Date(date))
}

// ── Badge components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "customer")
    return (
      <span className="rounded-full text-xs font-medium px-2.5 py-0.5 bg-[#FFF0F4] text-[#C0395E]">
        Cliente
      </span>
    )
  if (status === "later")
    return (
      <span className="rounded-full text-xs font-medium px-2.5 py-0.5 bg-yellow-50 text-yellow-700">
        Más adelante
      </span>
    )
  return (
    <span className="rounded-full text-xs font-medium px-2.5 py-0.5 bg-gray-100 text-gray-500">
      Prospecto
    </span>
  )
}

function FollowupTypeBadge({ type }: { type: string }) {
  if (type === "day2")
    return (
      <span className="rounded-full text-xs font-medium px-2.5 py-0.5 bg-[#FFF0F4] text-[#C0395E]">
        2 días
      </span>
    )
  if (type === "week2")
    return (
      <span className="rounded-full text-xs font-medium px-2.5 py-0.5 bg-indigo-50 text-indigo-700">
        2 semanas
      </span>
    )
  return (
    <span className="rounded-full text-xs font-medium px-2.5 py-0.5 bg-green-50 text-green-700">
      2 meses
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [client, setClient] = useState<Client | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [followups, setFollowups] = useState<Followup[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("info")

  // Edit form state — mirrors /clients/new
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState("prospect")
  const [skinType, setSkinType] = useState("")
  const [followupEnabled, setFollowupEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Delete flow
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()

      const [clientRes, salesRes, followupsRes] = await Promise.all([
        supabase.from("clients").select("*").eq("id", id).single(),
        supabase
          .from("sales")
          .select(
            "id, total, discount, payment_type, status, created_at, sale_items(quantity, price, product:products(name))"
          )
          .eq("client_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("followups")
          .select("id, type, scheduled_date, status, mensaje")
          .eq("client_id", id)
          .order("scheduled_date", { ascending: false }),
      ])

      const c = clientRes.data as Client | null
      if (c) {
        setClient(c)
        setName(c.name)
        setPhone(formatPhone(c.phone))
        setEmail(c.email || "")
        setStatus(c.status)
        setSkinType(c.skin_type || "")
        setFollowupEnabled(c.followup_enabled ?? true)
      }

      setSales((salesRes.data as Sale[]) || [])
      setFollowups((followupsRes.data as Followup[]) || [])
      setLoading(false)
    }

    init()
  }, [id])

  const handleSave = async () => {
    if (!client) return
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    const supabase = createClient()
    const { error } = await supabase
      .from("clients")
      .update({
        name: name.trim(),
        phone: phone.replace(/\D/g, ""),
        email: email.trim() || null,
        skin_type: skinType,
        status,
        followup_enabled: followupEnabled,
      })
      .eq("id", client.id)

    if (error) {
      setSaveError("No se pudo guardar. Intenta de nuevo.")
    } else {
      setClient((prev) =>
        prev
          ? {
              ...prev,
              name: name.trim(),
              phone: phone.replace(/\D/g, ""),
              email: email.trim() || null,
              skin_type: skinType,
              status,
              followup_enabled: followupEnabled,
            }
          : prev
      )
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    }

    setSaving(false)
  }

  const handleDelete = async () => {
    if (!client) return
    setDeleting(true)

    const supabase = createClient()
    await supabase.from("clients").delete().eq("id", client.id)

    router.push("/clients")
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "info", label: "Información" },
    { key: "sales", label: "Historial de ventas", count: sales.length },
    { key: "followups", label: "Seguimientos", count: followups.length },
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 animate-pulse">
          <div className="h-6 bg-gray-100 rounded w-40 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-28" />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 px-6 py-14 text-center">
        <p className="text-sm text-gray-500">Cliente no encontrado.</p>
        <button
          onClick={() => router.push("/clients")}
          className="mt-4 text-sm text-[#E75480] hover:underline"
        >
          ← Volver a clientes
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Header card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">

          {/* Left: identity */}
          <div className="flex items-start gap-4">
            {/* Avatar circle */}
            <div className="w-12 h-12 rounded-full bg-[#E75480] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-semibold">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                {client.name}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {formatPhone(client.phone)}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <StatusBadge status={client.status} />
                {client.skin_type && (
                  <span className="rounded-full text-xs font-medium px-2.5 py-0.5 bg-pink-50 text-[#E75480]">
                    {client.skin_type}
                  </span>
                )}
                <span className="text-xs text-gray-300">
                  Desde {formatDate(client.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() =>
                router.push(`/sales/new?client_id=${client.id}`)
              }
              className="bg-[#E75480] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#d04070] transition"
            >
              + Nueva venta
            </button>
            <button
              onClick={() => router.push("/clients")}
              className="bg-white border border-gray-200 text-gray-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition"
            >
              ← Volver
            </button>
          </div>

        </div>
      </div>

      {/* ── Tab bar + content card ── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">

        {/* Tab bar */}
        <div className="border-b border-gray-50 px-5 flex gap-1 pt-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg mb-[-1px] border-b-2 transition ${
                activeTab === tab.key
                  ? "text-[#E75480] border-[#E75480] font-medium"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`rounded-full text-xs font-semibold px-1.5 py-0.5 ${
                    activeTab === tab.key
                      ? "bg-[#FFF0F4] text-[#C0395E]"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Scrollable tab content */}
        <div className="max-h-[calc(100vh-18rem)] overflow-y-auto">

          {/* ── Tab: Información ── */}
          {activeTab === "info" && (
            <div className="px-6 py-5 space-y-5">

              {saveError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-lg px-4 py-3">
                  Cambios guardados correctamente.
                </div>
              )}

              {/* Row 1: Nombre + Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Row 2: Email + Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Estado</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={inputClass}
                  >
                    <option value="prospect">Prospecto — no ha comprado</option>
                    <option value="customer">Cliente — ya compró</option>
                    <option value="later">Más adelante</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Tipo de piel */}
              <div>
                <label className={labelClass}>Tipo de piel</label>
                <div className="flex flex-wrap gap-2">
                  {SKIN_TYPES.map((type) => {
                    const active = skinType === type
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSkinType(type)}
                        className={`rounded-full text-xs font-medium px-3 py-1.5 border transition ${
                          active
                            ? "bg-[#E75480] text-white border-[#E75480]"
                            : "bg-white text-gray-500 border-gray-200 hover:border-[#E75480] hover:text-[#E75480]"
                        }`}
                      >
                        {type}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Row 4: Seguimiento toggle */}
              <div
                onClick={() => setFollowupEnabled((v) => !v)}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 cursor-pointer transition ${
                  followupEnabled
                    ? "border-[#E75480] bg-[#FFF0F4]"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div
                  className={`mt-0.5 w-9 h-5 rounded-full flex items-center flex-shrink-0 transition-colors ${
                    followupEnabled ? "bg-[#E75480]" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                      followupEnabled ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      followupEnabled ? "text-[#C0395E]" : "text-gray-600"
                    }`}
                  >
                    Seguimiento automático 2+2+2
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Recordatorios a los 2 días, 2 semanas y 2 meses después de cada venta.
                  </p>
                </div>
              </div>

              {/* Save / Delete actions */}
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-50">

                {/* Delete */}
                <div>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500">¿Eliminar este cliente?</span>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-red-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-red-600 transition disabled:opacity-50"
                      >
                        {deleting ? "Eliminando..." : "Confirmar"}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="bg-white border border-red-200 text-red-400 rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-50 hover:text-red-500 transition"
                    >
                      Eliminar cliente
                    </button>
                  )}
                </div>

                {/* Save */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold text-white transition ${
                    saving
                      ? "bg-[#E75480]/40 cursor-not-allowed"
                      : "bg-[#E75480] hover:bg-[#d04070]"
                  }`}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>

              </div>
            </div>
          )}

          {/* ── Tab: Historial de ventas ── */}
          {activeTab === "sales" && (
            <div className="divide-y divide-gray-50">
              {sales.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <p className="text-sm font-medium text-gray-600">
                    Sin compras registradas
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Las ventas aparecerán aquí una vez que se registren.
                  </p>
                  <button
                    onClick={() =>
                      router.push(`/sales/new?client_id=${client.id}`)
                    }
                    className="mt-4 bg-[#E75480] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#d04070] transition"
                  >
                    + Registrar venta
                  </button>
                </div>
              ) : (
                sales.map((sale) => {
                  const subtotal = sale.sale_items?.reduce(
                    (acc, item) =>
                      acc + Number(item.price) * Number(item.quantity),
                    0
                  ) ?? 0
                  const discountAmt = sale.discount
                    ? (subtotal * sale.discount) / 100
                    : 0
                  const total = subtotal - discountAmt

                  return (
                    <div key={sale.id} className="px-6 py-4">
                      {/* Sale header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-400">
                          {formatDate(sale.created_at)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full text-xs font-medium px-2.5 py-0.5 bg-gray-100 text-gray-500">
                            {sale.payment_type || "Efectivo"}
                          </span>
                          {sale.status === "pagado" ? (
                            <span className="rounded-full text-xs font-medium px-2.5 py-0.5 bg-green-50 text-green-700">
                              Pagado
                            </span>
                          ) : (
                            <span className="rounded-full text-xs font-medium px-2.5 py-0.5 bg-yellow-50 text-yellow-700">
                              Pendiente
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5">
                        {sale.sale_items?.map((item, i) => (
                          <div
                            key={i}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-600">
                              {item.product?.name ?? "Producto"} ×{item.quantity}
                            </span>
                            <span className="text-gray-700 font-medium">
                              {formatCurrency(
                                Number(item.price) * Number(item.quantity)
                              )}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
                        {sale.discount > 0 && (
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Descuento {sale.discount}%</span>
                            <span>−{formatCurrency(discountAmt)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold text-gray-800">
                          <span>Total</span>
                          <span>{formatCurrency(total)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* ── Tab: Seguimientos ── */}
          {activeTab === "followups" && (
            <div className="divide-y divide-gray-50">
              {followups.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <p className="text-sm font-medium text-gray-600">
                    Sin seguimientos registrados
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Los seguimientos se generan automáticamente al registrar una venta.
                  </p>
                </div>
              ) : (
                followups.map((f) => {
                  const isOverdue =
                    f.status === "pending" &&
                    new Date(f.scheduled_date) < new Date()

                  return (
                    <div
                      key={f.id}
                      className={`px-6 py-4 ${
                        isOverdue ? "bg-red-50/40" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <FollowupTypeBadge type={f.type} />
                          {isOverdue && (
                            <span className="rounded-full text-xs font-medium px-2.5 py-0.5 bg-[#E75480] text-white">
                              Vencido
                            </span>
                          )}
                          {f.status === "sent" && (
                            <span className="rounded-full text-xs font-medium px-2.5 py-0.5 bg-green-50 text-green-700">
                              Enviado
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-300 shrink-0">
                          {formatDate(f.scheduled_date)}
                        </span>
                      </div>
                      {f.mensaje && (
                        <p className="text-xs text-gray-500 leading-relaxed mt-1">
                          {f.mensaje}
                        </p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
