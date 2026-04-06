"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { getFollowups, completeFollowup } from "@/lib/api"
import { APP_VERSION } from "@/src/config/version"

type Profile = {
  first_name?: string | null
}

type FollowupItem = {
  id: string
  mensaje: string | null
  type: string | null
  scheduled_date: string
  client_name: string
  phone: string
}

type ClientItem = {
  id: string
  name: string
  phone: string
  skin_type?: string | null
  status?: string,
  created_at?: string
}

const CARDS_PER_PAGE = 10

export default function Dashboard() {
  const router = useRouter()

  const [metrics, setMetrics] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [todayFollowups, setTodayFollowups] = useState<FollowupItem[]>([])
  const [overdueFollowups, setOverdueFollowups] = useState<FollowupItem[]>([])
  const [editedMessages, setEditedMessages] = useState<Record<string, string>>({})
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [discardingId, setDiscardingId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE)

  const priorityFollowups = [
    ...overdueFollowups,
    ...todayFollowups
  ].sort(
    (a, b) =>
      new Date(a.scheduled_date).getTime() -
      new Date(b.scheduled_date).getTime()
  )
  const totalToday = priorityFollowups.length
  const [upcomingFollowups, setUpcomingFollowups] = useState<FollowupItem[]>([])
  const [clients, setClients] = useState<ClientItem[]>([])
  const [loading, setLoading] = useState(true)

  const openWhatsApp = (phone: string, message: string) => {
    const cleanPhone = (phone || "").replace(/\D/g, "")
    if (!cleanPhone) return
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank")
  }

  const formatPhone = (phone: string) => {
    const digits = (phone || "").replace(/\D/g, "").slice(0, 10)

    const part1 = digits.slice(0, 3)
    const part2 = digits.slice(3, 6)
    const part3 = digits.slice(6, 10)

    if (!digits) return "Sin teléfono"
    if (digits.length <= 3) return `(${part1}`
    if (digits.length <= 6) return `(${part1}) ${part2}`
    return `(${part1}) ${part2}-${part3}`
  }

  const getFollowupLabel = (type: string | null) => {
    switch (type) {
      case "day2":
        return "2 días"
      case "week2":
        return "2 semanas"
      case "month2":
        return "2 meses"
      default:
        return "Seguimiento"
    }
  }

  const formatShortDate = (date: string) => {
    const value = new Date(date)
    if (Number.isNaN(value.getTime())) return "Fecha no disponible"

    return value.toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  // Build a phone → name lookup from all loaded clients so we can resolve
  // names even if the API returns a placeholder like "Cliente 1".
  const phoneToName = useMemo(() => {
    const map: Record<string, string> = {}
    clients.forEach((c) => {
      const digits = (c.phone || "").replace(/\D/g, "")
      if (digits) map[digits] = c.name
    })
    return map
  }, [clients])

  const resolveClientName = (f: FollowupItem) => {
    const digits = (f.phone || "").replace(/\D/g, "")
    return (digits && phoneToName[digits]) || f.client_name || "Cliente"
  }

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true

    const init = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (!isMounted) return

        if (userError || !user) {
          setLoading(false)
          router.push("/login")
          return
        }

        const userId = user.id

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", userId)
          .maybeSingle()

        if (profileError) {
          console.error("PROFILE ERROR:", profileError)
        }

        if (isMounted) {
          setProfile(profileData || null)
        }

        const today = new Date()
        const start = new Date(today)
        start.setHours(0, 0, 0, 0)

        const end = new Date(today)
        end.setHours(23, 59, 59, 999)

        const data = await getFollowups()

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/metrics/followups`, {
          headers: {
            "x-user-id": user.id,
          },
        })

        const dataMetrics = await res.json()

        if (isMounted) {
          setMetrics(dataMetrics)
        }

        const mapItem = (f: any) => ({
          id: f.id,
          mensaje: f.mensaje,
          type: f.type,
          scheduled_date: f.scheduled_date,
          client_name: f.client_name,
          phone: f.phone,
        })

        if (isMounted) {
          setTodayFollowups((data.today || []).map(mapItem))
          setOverdueFollowups((data.overdue || []).map(mapItem))
          setUpcomingFollowups((data.upcoming || []).map(mapItem))
          setVisibleCount(CARDS_PER_PAGE)
        }

        // Load all clients (no limit) so name lookup covers all followups.
        // The "Clientes recientes" widget uses .slice(0, 6) for display.
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        if (clientsError) {
          console.error("CLIENTS ERROR:", clientsError)
        }

        if (isMounted) {
          setClients((clientsData as ClientItem[]) || [])
          setLoading(false)
        }
      } catch (error) {
        console.error("ERROR GENERAL DASHBOARD:", error)
        if (isMounted) setLoading(false)
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [router])

  const stats = useMemo(() => {
    const totalClients = clients.length
    const pendingFollowups =
      todayFollowups.length +
      overdueFollowups.length +
      upcomingFollowups.length
    const clientsWithPhone = clients.filter((c) => (c.phone || "").trim() !== "").length

    return {
      totalClients,
      pendingFollowups,
      clientsWithPhone,
    }
  }, [clients, todayFollowups, overdueFollowups, upcomingFollowups])

  const markAsSent = async (id: string) => {
    const supabase = createClient()

    const { error } = await supabase
      .from("followups")
      .update({ status: "sent" })
      .eq("id", id)

    if (error) {
      console.error("Error actualizando followup:", error)
      return
    }

    setDiscardingId(null)
    setTodayFollowups((prev) => prev.filter((f) => f.id !== id))
    setOverdueFollowups((prev) => prev.filter((f) => f.id !== id))
    setUpcomingFollowups((prev) => prev.filter((f) => f.id !== id))
  }

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="h-7 w-56 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-4 w-80 animate-pulse rounded bg-gray-100" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
              <div className="mt-4 h-8 w-16 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
            <div className="mt-6 space-y-4">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-gray-100 p-5"
                >
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="mt-3 h-3 w-24 animate-pulse rounded bg-gray-100" />
                  <div className="mt-4 h-16 animate-pulse rounded bg-gray-50" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
            <div className="mt-6 space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-gray-100 p-4"
                >
                  <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                  <div className="mt-3 h-3 w-24 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const visibleFollowups = priorityFollowups.slice(0, visibleCount)
  const hasMore = priorityFollowups.length > visibleCount

  // Grammatically correct counter in Spanish
  const counterText =
    totalToday === 1
      ? "Tienes 1 cliente para contactar hoy"
      : `Tienes ${totalToday} clientes para contactar hoy`

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* LEFT: bienvenida */}
          <div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
              Bienvenida, {profile?.first_name || "Consultora"}
            </h1>
            <p className="text-sm font-medium text-[#E75480]">
              Nunca es demasiado tarde para ser lo que podrías haber sido.
            </p>
          </div>

          {/* RIGHT: métricas + botón */}
          <div className="flex items-center gap-4">

            {metrics && (
              <div className="flex items-center gap-4 rounded-xl bg-gray-50 px-4 py-2">
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">
                    {metrics.sent_followups}
                  </p>
                  <p className="text-[11px] text-gray-500">Msgs</p>
                </div>

                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">
                    {metrics.converted_sales}
                  </p>
                  <p className="text-[11px] text-gray-500">Ventas</p>
                </div>

                <div className="text-center">
                  <p className="text-sm font-semibold text-[#E75480]">
                    {metrics.conversion_rate}%
                  </p>
                  <p className="text-[11px] text-gray-500">Conv.</p>
                </div>
              </div>
            )}

            <button
              onClick={() => router.push("/clients/new")}
              className="rounded-2xl bg-[#E75480] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              + Nuevo cliente
            </button>

          </div>

        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
          {/* Section header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Seguimientos del día
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Prioriza los contactos que debes atender hoy.
              </p>
            </div>

            {totalToday > 0 && (
              <span className="rounded-full bg-[#E75480] px-3 py-1 text-xs font-semibold text-white">
                {totalToday}
              </span>
            )}
          </div>

          {/* Counter banner */}
          {totalToday > 0 ? (
            <div className="mt-4 rounded-xl bg-pink-50 px-4 py-2.5">
              <p className="text-sm font-medium text-[#E75480]">{counterText}</p>
            </div>
          ) : null}

          {/* Card list */}
          <div className="mt-5 space-y-3">
            {priorityFollowups.length === 0 ? (
              /* ── Empty state ── */
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100">
                  <svg className="h-6 w-6 text-[#E75480]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-800">
                  ¡Todo al día!
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  No tienes seguimientos pendientes para hoy.
                </p>
              </div>
            ) : (
              <>
                {visibleFollowups.map((f) => {
                  const message = editedMessages[f.id] ?? f.mensaje ?? ""
                  const isExpanded = expandedCards.has(f.id)
                  const isDiscarting = discardingId === f.id

                  const d = new Date(f.scheduled_date)
                  d.setHours(0, 0, 0, 0)
                  const isOverdue = d < today

                  const clientName = resolveClientName(f)

                  return (
                    <div
                      key={f.id}
                      className={`rounded-2xl border p-4 transition-colors ${
                        isOverdue
                          ? "border-red-200 bg-red-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {/* ── Row 1: name + badges ── */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-base font-bold text-gray-900">
                            {clientName}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-[#E75480]">
                              {getFollowupLabel(f.type)}
                            </span>
                            {isOverdue && (
                              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                                Vencido
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {formatShortDate(f.scheduled_date)}
                            </span>
                          </div>
                        </div>
                        <span className="shrink-0 text-sm text-gray-400">
                          {formatPhone(f.phone)}
                        </span>
                      </div>

                      {/* ── Row 2: message preview / editable textarea ── */}
                      {isExpanded ? (
                        <textarea
                          value={message}
                          onChange={(e) =>
                            setEditedMessages((prev) => ({
                              ...prev,
                              [f.id]: e.target.value,
                            }))
                          }
                          rows={4}
                          className="mt-3 w-full rounded-xl bg-gray-50 p-3 text-sm leading-6 text-gray-700 resize-none border border-[#E75480] focus:outline-none"
                        />
                      ) : (
                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-600">
                          {message || <span className="italic text-gray-400">Sin mensaje</span>}
                        </p>
                      )}

                      <button
                        onClick={() => toggleExpand(f.id)}
                        className="mt-1 text-xs font-medium text-[#E75480] hover:underline"
                      >
                        {isExpanded ? "Cerrar" : "Editar mensaje"}
                      </button>

                      {/* ── Row 3: actions ── */}
                      <div className="mt-3 flex items-center gap-2">
                        {/* Primary — Enviar */}
                        <button
                          onClick={() => {
                            localStorage.setItem("source_followup_id", f.id)
                            openWhatsApp(f.phone, message)
                          }}
                          className="flex-1 rounded-xl bg-[#E75480] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                        >
                          Enviar por WhatsApp
                        </button>

                        {/* Ghost — Descartar with inline confirmation */}
                        {isDiscarting ? (
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              onClick={() => markAsSent(f.id)}
                              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setDiscardingId(null)}
                              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDiscardingId(f.id)}
                            className="shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 transition hover:border-gray-300 hover:bg-gray-50"
                          >
                            Descartar
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* ── Pagination: Ver más ── */}
                {hasMore && (
                  <button
                    onClick={() => setVisibleCount((n) => n + CARDS_PER_PAGE)}
                    className="w-full rounded-2xl border border-dashed border-gray-200 py-3 text-sm font-medium text-gray-500 transition hover:border-[#E75480] hover:text-[#E75480]"
                  >
                    Ver más ({priorityFollowups.length - visibleCount} restantes)
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Clientes recientes
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Acceso rápido a tus contactos más recientes.
                </p>
              </div>

              <button
                onClick={() => router.push("/clients")}
                className="text-sm font-medium text-[#E75480] transition hover:opacity-80"
              >
                Ver todos
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {clients.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    No tienes clientes registrados
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Agrega tu primer cliente para comenzar a gestionar ventas y
                    seguimientos.
                  </p>
                </div>
              ) : (
                clients.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => router.push(`/clients/${c.id}`)}
                    className="block w-full rounded-2xl border border-gray-200 p-4 text-left transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {c.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {formatPhone(c.phone)}
                        </p>

                        <span
                          className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full ${c.status === "customer"
                              ? "bg-pink-100 text-[#E75480]"
                              : c.status === "later"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {c.status === "customer"
                            ? "Cliente"
                            : c.status === "later"
                              ? "Más adelante"
                              : "Prospecto"}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {c.skin_type && (
                          <span className="shrink-0 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium text-[#E75480]">
                            {c.skin_type}
                          </span>
                        )}
                      </div>

                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
      <div className="fixed bottom-2 right-4 text-xs text-gray-400">
        v{APP_VERSION}
      </div>
    </div>
  )
}
