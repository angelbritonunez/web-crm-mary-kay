  "use client"

  import { useEffect, useMemo, useState } from "react"
  import { createClient } from "@/lib/supabase"
  import { useRouter } from "next/navigation"
  import { getFollowups, completeFollowup } from "@/lib/api"

  type Profile = {
    nombre?: string | null
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
    created_at?: string
  }

  export default function Dashboard() {
    const router = useRouter()

    const [profile, setProfile] = useState<Profile | null>(null)
    const [todayFollowups, setTodayFollowups] = useState<FollowupItem[]>([])
    const [overdueFollowups, setOverdueFollowups] = useState<FollowupItem[]>([])
  const [upcomingFollowups, setUpcomingFollowups] = useState<FollowupItem[]>([])
    const [clients, setClients] = useState<ClientItem[]>([])
    const [loading, setLoading] = useState(true)

    const openWhatsApp = (phone: string, message: string) => {
      const cleanPhone = (phone || "").replace(/\D/g, "")
      if (!cleanPhone) return
      const url = `https://wa.me/1${cleanPhone}?text=${encodeURIComponent(message)}`
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

    const getFollowupLabel = (date: string) => {
      const today = new Date()
      const target = new Date(date)

      const diff = Math.round(
        (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (diff <= 2) return "2 días"
      if (diff <= 14) return "2 semanas"
      return "2 meses"
    }

    const getMessage = (f: FollowupItem) => {
      if (f.mensaje && f.mensaje.trim() !== "") return f.mensaje

      const name = f.client_name || "cliente"
      const label = getFollowupLabel(f.scheduled_date)

      if (label === "2 días") {
        return `Hola ${name}, ¿cómo te fue con el producto que compraste?`
      }

      if (label === "2 semanas") {
        return `Hola ${name}, paso por aquí para saber cómo te ha ido con el producto.`
      }

      return `Hola ${name}, te escribo para darte seguimiento y ver si necesitas algo más.`
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
            .select("nombre")
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
}

          const { data: clientsData, error: clientsError } = await supabase
            .from("clients")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(6)

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

      setTodayFollowups((prev) => prev.filter((f) => f.id !== id))
setOverdueFollowups((prev) => prev.filter((f) => f.id !== id))
setUpcomingFollowups((prev) => prev.filter((f) => f.id !== id))
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

    return (
      <div className="space-y-8">
        <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                Bienvenida, {profile?.nombre || "Consultora"}
              </h1>
              <p className="text-sm font-medium text-[#E75480]">Nunca es demasiado tarde para ser lo que podrías haber sido.</p>
            </div>

            <div className="flex flex-wrap gap-3">
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Seguimientos del día
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Prioriza los contactos que debes atender hoy.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {todayFollowups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    No hay seguimientos pendientes para hoy
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Cuando tengas tareas programadas aparecerán aquí.
                  </p>
                </div>
              ) : (
                todayFollowups.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-2xl border border-gray-200 p-5 transition hover:border-gray-300"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-gray-900">
                            {f.client_name}
                          </p>
                          <span className="rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium text-[#E75480]">
                            {getFollowupLabel(f.scheduled_date)}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span>{f.type || "Seguimiento"}</span>
                          <span>•</span>
                          <span>{formatShortDate(f.scheduled_date)}</span>
                        </div>

                        <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                          {getMessage(f)}
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => {
                            openWhatsApp(f.phone, getMessage(f))
                            markAsSent(f.id)
                          }}
                          className="rounded-xl bg-[#E75480] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          Enviar
                        </button>

                        <button
                          onClick={() => markAsSent(f.id)}
                          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          Marcar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
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
                  clients.map((c) => (
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
                        </div>

                        {c.skin_type ? (
                          <span className="shrink-0 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium text-[#E75480]">
                            {c.skin_type}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }