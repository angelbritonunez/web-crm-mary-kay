"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { getAdminDashboard } from "@/lib/api"
import { Users, UserCheck, UserX, ShoppingBag, TrendingUp, UserPlus, Bell } from "lucide-react"
import type { AdminDashboardData, AdminDashboardConsultora, SubscriptionPlan } from "@/types"

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 0,
  }).format(n)
}

function fmtDate(iso: string | null): string {
  if (!iso) return "Nunca"
  return new Date(iso).toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-")
  return new Intl.DateTimeFormat("es-DO", { month: "short", year: "2-digit" }).format(
    new Date(Number(y), Number(m) - 1, 1)
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          accent ? "bg-[#E75480] text-white" : "bg-[#FFF0F4] text-[#E75480]"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function MonthlyTrendChart({ data }: { data: { month: string; revenue: number }[] }) {
  if (!data.length) return null

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const BAR_H = 100

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-50 px-5 py-4">
        <span className="text-sm font-semibold text-gray-800">Tendencia de ingresos</span>
        <p className="text-xs text-gray-400 mt-0.5">Últimos 6 meses · todas las consultoras</p>
      </div>
      <div className="px-5 py-5">
        <div className="flex items-end gap-3 h-[140px]">
          {data.map((d) => {
            const barH = maxRevenue > 0 ? Math.max(4, (d.revenue / maxRevenue) * BAR_H) : 4
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                  {d.revenue > 0 ? fmt(d.revenue) : "—"}
                </span>
                <div className="w-full flex items-end" style={{ height: `${BAR_H}px` }}>
                  <div
                    className="w-full rounded-t-md bg-[#E75480] transition-all duration-500"
                    style={{ height: `${barH}px` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap capitalize">
                  {monthLabel(d.month)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const PLAN_STYLES: Record<SubscriptionPlan, string> = {
  free:  "bg-gray-100 text-gray-500",
  basic: "bg-blue-50 text-blue-600",
  pro:   "bg-[#FFF0F4] text-[#E75480]",
}
const PLAN_LABELS: Record<SubscriptionPlan, string> = { free: "Free", basic: "Basic", pro: "Pro" }

function PlanBadge({ plan }: { plan: SubscriptionPlan }) {
  return (
    <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${PLAN_STYLES[plan]}`}>
      {PLAN_LABELS[plan]}
    </span>
  )
}

function MembershipBadge({ days, isActive }: { days: number | null; isActive: boolean }) {
  if (!isActive) return <span className="text-xs text-gray-400 italic">Inactiva</span>
  if (days === null) return <span className="text-gray-300">—</span>
  if (days === 0)
    return (
      <span className="inline-flex items-center bg-red-50 text-red-500 text-xs font-semibold rounded-full px-2.5 py-0.5">
        Vencida
      </span>
    )
  if (days <= 5)
    return (
      <span className="inline-flex items-center bg-red-50 text-red-500 text-xs font-semibold rounded-full px-2.5 py-0.5">
        {days}d
      </span>
    )
  if (days <= 10)
    return (
      <span className="inline-flex items-center bg-amber-50 text-amber-500 text-xs font-semibold rounded-full px-2.5 py-0.5">
        {days}d
      </span>
    )
  return (
    <span className="inline-flex items-center bg-green-50 text-green-600 text-xs font-semibold rounded-full px-2.5 py-0.5">
      {days}d
    </span>
  )
}

function ConsultorasTable({ consultoras }: { consultoras: AdminDashboardConsultora[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-50 px-5 py-4">
        <span className="text-sm font-semibold text-gray-800">Performance por consultora</span>
        <p className="text-xs text-gray-400 mt-0.5">Ventas e ingresos del mes en curso · ordenado por ingresos</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Consultora</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Plan</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Membresía</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Ventas mes</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Ingresos mes</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Clientes</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Último acceso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {consultoras.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                  No hay consultoras registradas.
                </td>
              </tr>
            ) : (
              consultoras.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E75480] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">
                          {c.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 leading-tight">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <PlanBadge plan={c.subscription_plan} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <MembershipBadge days={c.days_remaining} isActive={c.is_active} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-gray-800">{c.sales_count}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-gray-800">{fmt(c.revenue)}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{c.total_customers}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {fmtDate(c.last_sign_in)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push("/login"); return }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (profile?.role !== "admin") { router.push("/dashboard"); return }

      try {
        const res = await getAdminDashboard()
        setData(res)
      } catch {
        // keep loading=false, show empty state
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 px-5 py-4 animate-pulse h-20" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 px-5 py-4 animate-pulse h-20" />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse h-52" />
        <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse h-64" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-400 text-sm">
        No se pudo cargar el dashboard. Intenta de nuevo.
      </div>
    )
  }

  const { platform, this_month, monthly_trend, consultoras } = data
  const expiring = platform.expiring_soon

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Visión general del negocio</p>
      </div>

      {/* ── Bloque 1: Estado de la plataforma ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Total consultoras" value={platform.total_users} icon={<Users size={18} />} />
        <KpiCard label="Activas" value={platform.active} icon={<UserCheck size={18} />} accent />
        <KpiCard label="Inactivas" value={platform.inactive} icon={<UserX size={18} />} />
      </div>

      {/* ── Bloque 1b: Distribución por plan ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-gray-500">F</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 leading-none">{platform.plans.free}</p>
            <p className="text-xs text-gray-400 mt-0.5">Plan Free</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-blue-600">B</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 leading-none">{platform.plans.basic}</p>
            <p className="text-xs text-gray-400 mt-0.5">Plan Basic</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#FFF0F4] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[#E75480]">P</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 leading-none">{platform.plans.pro}</p>
            <p className="text-xs text-gray-400 mt-0.5">Plan Pro</p>
          </div>
        </div>
      </div>

      {/* ── Alerta membresías por vencer ── */}
      {expiring.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <Bell size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {expiring.length === 1
                ? "1 membresía vence en los próximos 7 días"
                : `${expiring.length} membresías vencen en los próximos 7 días`}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {expiring.map((e) => `${e.name} (${e.days_remaining}d)`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* ── Bloque 2: Actividad del mes ── */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          Actividad del mes · todas las consultoras
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            label="Ventas registradas"
            value={this_month.sales_count}
            icon={<ShoppingBag size={18} />}
          />
          <KpiCard
            label="Ingresos totales"
            value={fmt(this_month.revenue)}
            icon={<TrendingUp size={18} />}
            accent
          />
          <KpiCard
            label="Clientes nuevos"
            value={this_month.new_clients}
            icon={<UserPlus size={18} />}
          />
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0F4] flex items-center justify-center flex-shrink-0 text-[#E75480]">
              <Bell size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-none">{this_month.followups_sent}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Seguim. enviados
                {this_month.followups_pending > 0 && (
                  <span className="ml-1 text-amber-500">· {this_month.followups_pending} pend.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bloque 3: Tendencia ── */}
      <MonthlyTrendChart data={monthly_trend} />

      {/* ── Bloque 4: Performance por consultora ── */}
      <ConsultorasTable consultoras={consultoras} />

    </div>
  )
}
