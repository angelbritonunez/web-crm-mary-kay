"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

type FollowupItem = {
  id: string
  type: "day2" | "week2" | "month2"
  scheduled_date: string
  status: string
  mensaje: string | null
  client_name: string
  client_phone: string
  isOverdue: boolean
}

type ClientItem = {
  id: string
  name: string
  phone: string
  skin_type?: string | null
  status: string
}

type DashboardData = {
  firstName: string
  followups: FollowupItem[]
  clients: ClientItem[]
  vencidos: number
  totalPending: number
  ventas_mes: number
  revenue_mes: number
  convPct: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "").slice(0, 10)
  if (digits.length < 10) return phone || "Sin teléfono"
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 0,
  }).format(amount)
}

function buildWAUrl(phone: string, msg: string): string {
  let digits = (phone || "").replace(/\D/g, "")
  if (digits && !digits.startsWith("1")) digits = "1" + digits
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
}

function formatBriefDate(): string {
  return new Intl.DateTimeFormat("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Santo_Domingo",
  }).format(new Date())
}

function buildVersion(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `v${y}.${m}.${d}`
}

// ── Skeleton sub-components ───────────────────────────────────────────────────

function FollowupSkeleton() {
  return (
    <div className="border border-gray-100 rounded-xl p-4 mb-3 animate-pulse">
      <div className="flex justify-between mb-2">
        <div className="h-4 bg-gray-100 rounded w-32" />
        <div className="h-4 bg-gray-100 rounded w-16" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-full mb-1" />
      <div className="h-3 bg-gray-100 rounded w-3/4 mb-3" />
      <div className="flex gap-2">
        <div className="h-8 bg-gray-100 rounded-lg flex-1" />
        <div className="h-8 bg-gray-100 rounded-lg w-20" />
      </div>
    </div>
  )
}

function ClientSkeleton() {
  return (
    <div className="px-5 py-3.5 border-b border-gray-50 animate-pulse">
      <div className="flex justify-between mb-1">
        <div className="h-4 bg-gray-100 rounded w-28" />
        <div className="h-4 bg-gray-100 rounded w-16" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-24 mb-1.5" />
      <div className="h-5 bg-gray-100 rounded-full w-16" />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) throw new Error("No autenticado")

        const uid = user.id
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        const [profileRes, followupsRes, clientsRes, salesRes, allClientsRes] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("first_name, email")
              .eq("id", uid)
              .single(),
            supabase
              .from("followups")
              .select("id, type, scheduled_date, status, mensaje, clients(name, phone)")
              .eq("user_id", uid)
              .eq("status", "pending")
              .order("scheduled_date", { ascending: true })
              .limit(50),
            supabase
              .from("clients")
              .select("id, name, phone, skin_type, status")
              .eq("user_id", uid)
              .order("created_at", { ascending: false })
              .limit(5),
            supabase
              .from("sales")
              .select("id, total, status, created_at")
              .eq("user_id", uid)
              .gte("created_at", startOfMonth),
            supabase
              .from("clients")
              .select("id, status")
              .eq("user_id", uid),
          ])

        const profile = profileRes.data
        const firstName =
          profile?.first_name ||
          profile?.email?.split("@")[0] ||
          user.email?.split("@")[0] ||
          "Consultora"

        const nowDate = new Date()
        const followups: FollowupItem[] = (followupsRes.data || []).map(
          (f: any) => ({
            id: f.id,
            type: f.type,
            scheduled_date: f.scheduled_date,
            status: f.status,
            mensaje: f.mensaje,
            client_name: f.clients?.name || "Cliente",
            client_phone: f.clients?.phone || "",
            isOverdue: new Date(f.scheduled_date) < nowDate,
          })
        )

        const vencidos = followups.filter((f) => f.isOverdue).length
        const totalPending = followups.length

        type SaleRow = { id: string; total: number | null; status: string; created_at: string }
        type ClientStatusRow = { id: string; status: string }

        const sales = (salesRes.data || []) as SaleRow[]
        const ventas_mes = sales.length
        const revenue_mes = sales.reduce(
          (sum: number, s) => sum + (Number(s.total) || 0),
          0
        )

        const allClients = (allClientsRes.data || []) as ClientStatusRow[]
        const customers = allClients.filter(
          (c) => c.status === "customer"
        ).length
        const totalClientes = allClients.length
        const convPct =
          totalClientes > 0
            ? Math.round((customers / totalClientes) * 100)
            : 0

        setData({
          firstName,
          followups,
          clients: (clientsRes.data as ClientItem[]) || [],
          vencidos,
          totalPending,
          ventas_mes,
          revenue_mes,
          convPct,
        })
      } catch (err: any) {
        setError(err.message || "Error cargando datos")
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const visibleFollowups = (data?.followups || []).filter(
    (f) => !dismissed.has(f.id)
  )

  const handleSaveMessage = async (id: string) => {
    const supabase = createClient()
    await supabase.from("followups").update({ mensaje: editText }).eq("id", id)
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        followups: prev.followups.map((f) =>
          f.id === id ? { ...f, mensaje: editText } : f
        ),
      }
    })
    setEditingId(null)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Sección 1: Hero Morning Brief ── */}
      <div className="bg-[#E75480] rounded-2xl relative overflow-hidden p-6 mb-4 flex items-center justify-between gap-4 flex-wrap">
        {/* Decorative circles */}
        <div className="absolute top-[-40px] right-[-40px] w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute bottom-[-30px] left-[40%] w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute top-[10px] left-[-20px] w-20 h-20 bg-white/10 rounded-full" />

        {/* Left: greeting */}
        <div className="relative z-10">
          <p className="text-white/70 text-xs uppercase tracking-widest">
            {formatBriefDate()}
          </p>
          <h1 className="text-white text-2xl font-bold tracking-tight mt-1">
            Bienvenida, {loading ? "..." : (data?.firstName || "Consultora")}
          </h1>
          <p className="text-white/75 text-sm mt-1">
            Nunca es demasiado tarde para ser lo que podrías haber sido.
          </p>
        </div>

        {/* Center: stats */}
        <div className="relative z-10 bg-white/15 rounded-2xl flex divide-x divide-white/20">
          <div className="px-5 py-3 text-center">
            <span className="text-white text-xl font-bold block">
              {loading ? "—" : (data?.vencidos ?? 0)}
            </span>
            <span className="text-white/70 text-xs uppercase tracking-wider block mt-0.5">
              Msgs hoy
            </span>
          </div>
          <div className="px-5 py-3 text-center">
            <span className="text-white text-xl font-bold block">
              {loading ? "—" : (data?.ventas_mes ?? 0)}
            </span>
            <span className="text-white/70 text-xs uppercase tracking-wider block mt-0.5">
              Ventas
            </span>
          </div>
          <div className="px-5 py-3 text-center">
            <span className="text-white text-xl font-bold block">
              {loading ? "—" : `${data?.convPct ?? 0}%`}
            </span>
            <span className="text-white/70 text-xs uppercase tracking-wider block mt-0.5">
              Conv
            </span>
          </div>
          <div className="px-5 py-3 text-center">
            <span className="text-white text-xl font-bold block">
              {loading ? "—" : formatCurrency(data?.revenue_mes ?? 0)}
            </span>
            <span className="text-white/70 text-xs uppercase tracking-wider block mt-0.5">
              Ingresos
            </span>
          </div>
        </div>

        {/* Right: CTA */}
        <Link
          href="/clients/new"
          className="relative z-10 bg-white text-[#E75480] rounded-lg px-4 py-2 text-sm font-semibold hover:bg-pink-50 transition whitespace-nowrap"
        >
          + Nuevo cliente
        </Link>
      </div>

      {/* ── Sección 2: Alert strip ── */}
      {!loading && (data?.vencidos ?? 0) > 0 && (
        <div className="bg-[#FFF0F4] border border-[#FADADD] rounded-xl px-4 py-2.5 flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-[#E75480] animate-pulse flex-shrink-0" />
          <span className="text-[#C0395E] text-sm font-medium">
            Tienes {data!.vencidos} clientes para contactar hoy
          </span>
          <span className="ml-auto bg-[#E75480] text-white rounded-full text-xs font-semibold px-3 py-0.5">
            {data!.totalPending} pendientes
          </span>
        </div>
      )}

      {/* ── Sección 3: Grid principal ── */}
      <div className="grid grid-cols-[1fr_340px] gap-5 items-start">

        {/* Columna izquierda — Seguimientos del día */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-50 px-5 py-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold text-gray-800">
                Seguimientos del día
              </span>
              <span className="bg-[#E75480] text-white rounded-full text-xs font-semibold px-2.5 py-0.5">
                {loading ? "—" : visibleFollowups.length}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Prioriza los contactos que debes atender hoy
            </p>
          </div>

          <div className="p-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
            {loading ? (
              <>
                <FollowupSkeleton />
                <FollowupSkeleton />
                <FollowupSkeleton />
              </>
            ) : visibleFollowups.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                ¡Todo al día! No hay seguimientos pendientes.
              </div>
            ) : (
              visibleFollowups.map((fup) => {
                const isEditing = editingId === fup.id
                const message = fup.mensaje || ""

                const typeLabel =
                  fup.type === "day2"
                    ? "2 días"
                    : fup.type === "week2"
                    ? "2 semanas"
                    : "2 meses"

                const typeBadgeClass =
                  fup.type === "day2"
                    ? "bg-[#FFF0F4] text-[#C0395E]"
                    : fup.type === "week2"
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-green-50 text-green-700"

                const dateFormatted = new Intl.DateTimeFormat("es-DO", {
                  day: "2-digit",
                  month: "short",
                  timeZone: "America/Santo_Domingo",
                }).format(new Date(fup.scheduled_date))

                return (
                  <div
                    key={fup.id}
                    className="border border-gray-100 rounded-xl p-4 mb-3 bg-white"
                  >
                    {/* Row 1: name + badges + phone */}
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div>
                        <span className="font-semibold text-sm text-gray-800">
                          {fup.client_name}
                        </span>
                        {fup.client_phone && (
                          <span className="text-gray-400 text-xs ml-1">
                            · {formatPhone(fup.client_phone)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5 items-center flex-wrap justify-end">
                        <span
                          className={`rounded-full text-xs font-medium px-2.5 py-0.5 ${typeBadgeClass}`}
                        >
                          {typeLabel}
                        </span>
                        {fup.isOverdue && (
                          <span className="bg-[#E75480] text-white rounded-full text-xs font-medium px-2.5 py-0.5">
                            Vencido
                          </span>
                        )}
                        <span className="text-xs text-gray-300">
                          {dateFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: message or textarea */}
                    {isEditing ? (
                      <>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg p-2.5 text-xs text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#E75480] resize-none min-h-16 mb-2"
                          autoFocus
                        />
                        <div className="flex gap-2 mb-2">
                          <button
                            onClick={() => handleSaveMessage(fup.id)}
                            className="bg-[#E75480] text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#d04070] transition"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-400 text-xs hover:text-gray-600 px-2 py-1.5"
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500 leading-relaxed my-2">
                          {message ? (
                            message
                          ) : (
                            <span className="text-gray-300 italic">
                              Sin mensaje — editar antes de enviar
                            </span>
                          )}
                        </p>
                        <button
                          onClick={() => {
                            setEditingId(fup.id)
                            setEditText(fup.mensaje || "")
                          }}
                          className="text-xs text-[#E75480] font-medium hover:underline block mb-2 bg-transparent border-none p-0 cursor-pointer"
                        >
                          Editar mensaje
                        </button>
                      </>
                    )}

                    {/* Row 3: actions */}
                    <div className="flex gap-2">
                      <a
                        href={buildWAUrl(fup.client_phone, message)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#E75480] text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#d04070] transition"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.477 2 2 6.477 2 12c0 1.989.58 3.842 1.583 5.405L2.046 22l4.729-1.518A9.956 9.956 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182a8.18 8.18 0 0 1-4.17-1.14l-.299-.177-3.093.994.957-3.026-.198-.316A8.143 8.143 0 0 1 3.818 12c0-4.511 3.671-8.182 8.182-8.182 4.51 0 8.182 3.671 8.182 8.182 0 4.51-3.671 8.182-8.182 8.182z" />
                        </svg>
                        Enviar por WhatsApp
                      </a>
                      <button
                        onClick={() =>
                          setDismissed((prev) => new Set([...prev, fup.id]))
                        }
                        className="bg-gray-50 text-gray-500 border border-gray-200 rounded-lg py-2 px-3 text-xs font-medium hover:bg-gray-100 transition"
                      >
                        Descartar
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Columna derecha — Clientes recientes */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-50 px-5 py-4 flex justify-between items-start">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                Clientes recientes
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Acceso rápido a tus contactos más recientes
              </p>
            </div>
            <Link
              href="/clients"
              className="text-xs text-[#E75480] font-medium hover:underline"
            >
              Ver todos
            </Link>
          </div>

          {loading ? (
            <>
              <ClientSkeleton />
              <ClientSkeleton />
              <ClientSkeleton />
              <ClientSkeleton />
              <ClientSkeleton />
            </>
          ) : (data?.clients || []).length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">
              No tienes clientes registrados.
            </div>
          ) : (
            (data?.clients || []).map((c) => (
              <div
                key={c.id}
                onClick={() => router.push(`/clients/${c.id}`)}
                className="px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 cursor-pointer transition"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-gray-800">
                    {c.name}
                  </span>
                  {c.skin_type && (
                    <span className="text-xs text-[#E75480] font-medium">
                      {c.skin_type}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mb-1.5">
                  {formatPhone(c.phone)}
                </div>
                <span
                  className={`rounded-full text-xs font-medium px-2.5 py-0.5 ${
                    c.status === "customer"
                      ? "bg-[#FFF0F4] text-[#C0395E]"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {c.status === "customer" ? "Cliente" : "Prospecto"}
                </span>
              </div>
            ))
          )}

          <Link
            href="/clients"
            className="block text-center py-3 text-xs text-[#E75480] font-medium hover:bg-gray-50 border-t border-gray-50 transition"
          >
            Ver todos los clientes →
          </Link>
          <div className="text-right px-5 py-2 text-xs text-gray-200">
            {buildVersion()}
          </div>
        </div>

      </div>
    </div>
  )
}
