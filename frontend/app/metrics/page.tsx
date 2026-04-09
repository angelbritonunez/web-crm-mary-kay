"use client"

import { useEffect, useState } from "react"
import { getMetrics } from "@/lib/api"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────

type Period = "week" | "month" | "last_month" | "year"

type Summary = {
  revenue: number
  revenue_prev: number
  sales_count: number
  sales_count_prev: number
  new_clients: number
  new_clients_prev: number
  conversion_rate: number
}

type ChartPoint = { date: string; revenue: number }
type PaymentItem = { type: string; total: number; count: number }
type ProductItem = { name: string; quantity: number; revenue: number }
type FollowupStats = { sent: number; pending: number; converted: number; rate: number }
type ClientPipeline = { prospects: number; customers: number; later: number; total: number }
type SkinItem = { skin_type: string; count: number }

type MetricsData = {
  summary: Summary
  revenue_chart: ChartPoint[]
  by_payment_type: PaymentItem[]
  top_products: ProductItem[]
  followup_stats: FollowupStats
  client_pipeline: ClientPipeline
  skin_type_dist: SkinItem[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 0,
  }).format(n)
}

function trendPct(current: number, prev: number): number | null {
  if (prev === 0) return null
  return Math.round(((current - prev) / prev) * 100)
}

function formatChartDate(date: string, period: Period): string {
  if (period === "year") {
    const [y, m] = date.split("-")
    return new Intl.DateTimeFormat("es-DO", { month: "short" }).format(
      new Date(Number(y), Number(m) - 1, 1)
    )
  }
  const d = new Date(date + "T12:00:00")
  return new Intl.DateTimeFormat("es-DO", { day: "numeric", month: "short" }).format(d)
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Trend({ current, prev }: { current: number; prev: number }) {
  const pct = trendPct(current, prev)
  if (pct === null) return <span className="text-xs text-gray-300">—</span>
  if (pct > 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
        <TrendingUp size={12} />
        +{pct}%
      </span>
    )
  if (pct < 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-red-500">
        <TrendingDown size={12} />
        {pct}%
      </span>
    )
  return (
    <span className="flex items-center gap-0.5 text-xs font-medium text-gray-400">
      <Minus size={12} />
      Sin cambio
    </span>
  )
}

function KpiCard({
  label,
  value,
  current,
  prev,
  sub,
}: {
  label: string
  value: string
  current: number
  prev: number
  sub?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 leading-none mb-1.5">{value}</p>
      <div className="flex items-center gap-2">
        <Trend current={current} prev={prev} />
        {sub && <span className="text-xs text-gray-300">{sub}</span>}
      </div>
    </div>
  )
}

function AreaChart({ data, period }: { data: ChartPoint[]; period: Period }) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-28 text-sm text-gray-300">
        Sin datos suficientes
      </div>
    )
  }

  const W = 800
  const H = 110
  const PAD_X = 4
  const PAD_Y = 8
  const max = Math.max(...data.map((d) => d.revenue), 1)

  const pts = data.map((d, i) => {
    const x = PAD_X + (i / (data.length - 1)) * (W - PAD_X * 2)
    const y = H - PAD_Y - (d.revenue / max) * (H - PAD_Y * 2)
    return { x, y, ...d }
  })

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`

  // Show a label every N points to avoid crowding
  const labelEvery = data.length <= 7 ? 1 : data.length <= 14 ? 2 : data.length <= 31 ? 4 : 1

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" style={{ height: 130 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E75480" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#E75480" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Baseline */}
        <line
          x1={PAD_X}
          y1={H}
          x2={W - PAD_X}
          y2={H}
          stroke="#F3F4F6"
          strokeWidth="1"
        />

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#E75480"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots + labels */}
        {pts.map((p, i) => {
          const showLabel = i % labelEvery === 0 || i === pts.length - 1
          return (
            <g key={i}>
              {p.revenue > 0 && (
                <circle cx={p.x} cy={p.y} r="3" fill="#E75480" />
              )}
              {showLabel && (
                <text
                  x={p.x}
                  y={H + 14}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#D1D5DB"
                >
                  {formatChartDate(p.date, period)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function HBar({ label, value, max, sub }: { label: string; value: number; max: number; sub: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs text-gray-700 font-medium truncate max-w-[60%]">{label}</span>
        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{sub}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#E75480] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function DonutChart({ items, total }: { items: PaymentItem[]; total: number }) {
  if (items.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-gray-300">
        Sin ventas en el período
      </div>
    )
  }

  const COLORS = ["#E75480", "#6366F1", "#10B981", "#F59E0B", "#8B5CF6"]
  const R = 40
  const CX = 60
  const CY = 50
  const stroke = 14
  const circ = 2 * Math.PI * R

  let cumulative = 0
  const segments = items.map((item, i) => {
    const pct = item.total / total
    const dash = pct * circ
    const offset = circ - cumulative * circ
    cumulative += pct
    return { ...item, dash, offset, color: COLORS[i % COLORS.length], pct }
  })

  return (
    <div className="flex items-center gap-4">
      <svg width="120" height="100" viewBox="0 0 120 100">
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${seg.dash} ${circ}`}
            strokeDashoffset={seg.offset}
            transform={`rotate(-90 ${CX} ${CY})`}
          />
        ))}
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#111827">
          {items.length > 0 ? items[0].count + (items[1]?.count || 0) : 0}
        </text>
        <text x={CX} y={CY + 8} textAnchor="middle" fontSize="8" fill="#9CA3AF">
          ventas
        </text>
      </svg>
      <div className="space-y-2 flex-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-gray-700 capitalize block truncate">
                {seg.type}
              </span>
              <span className="text-xs text-gray-400">{fmt(seg.total)}</span>
            </div>
            <span className="text-xs font-semibold text-gray-500">
              {Math.round(seg.pct * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function MetricsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <div className="h-3 bg-gray-100 rounded w-20 mb-2" />
            <div className="h-7 bg-gray-100 rounded w-28 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-14" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="h-4 bg-gray-100 rounded w-32 mb-4" />
        <div className="h-32 bg-gray-50 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="h-4 bg-gray-100 rounded w-28 mb-4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-4 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

const PERIODS: { key: Period; label: string }[] = [
  { key: "week",       label: "Esta semana" },
  { key: "month",      label: "Este mes" },
  { key: "last_month", label: "Mes anterior" },
  { key: "year",       label: "Este año" },
]

export default function MetricsPage() {
  const [period, setPeriod] = useState<Period>("month")
  const [data, setData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getMetrics(period)
      .then((d) => setData(d))
      .catch((e) => setError(e.message || "Error cargando métricas"))
      .finally(() => setLoading(false))
  }, [period])

  const s = data?.summary

  const totalPayment = (data?.by_payment_type || []).reduce((a, b) => a + b.total, 0)
  const maxProduct = Math.max(...(data?.top_products || []).map((p) => p.revenue), 1)
  const maxSkin = Math.max(...(data?.skin_type_dist || []).map((s) => s.count), 1)
  const pipe = data?.client_pipeline
  const fup = data?.followup_stats

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? ""
  const prevLabel =
    period === "week"
      ? "semana anterior"
      : period === "month"
      ? "mes anterior"
      : period === "last_month"
      ? "2 meses atrás"
      : "año anterior"

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Métricas</h1>
          <p className="text-xs text-gray-400 mt-0.5">Rendimiento de tu negocio en tiempo real</p>
        </div>

        {/* Period tabs */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={
                period === p.key
                  ? "bg-white text-[#E75480] font-semibold rounded-md px-3 py-1.5 text-xs shadow-sm transition"
                  : "text-gray-500 hover:text-gray-700 rounded-md px-3 py-1.5 text-xs transition"
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <MetricsSkeleton />
      ) : (
        <>
          {/* ── KPI cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="Ingresos"
              value={fmt(s?.revenue ?? 0)}
              current={s?.revenue ?? 0}
              prev={s?.revenue_prev ?? 0}
              sub={`vs ${prevLabel}`}
            />
            <KpiCard
              label="Ventas"
              value={String(s?.sales_count ?? 0)}
              current={s?.sales_count ?? 0}
              prev={s?.sales_count_prev ?? 0}
              sub={`vs ${prevLabel}`}
            />
            <KpiCard
              label="Clientas nuevas"
              value={String(s?.new_clients ?? 0)}
              current={s?.new_clients ?? 0}
              prev={s?.new_clients_prev ?? 0}
              sub={`vs ${prevLabel}`}
            />
            <KpiCard
              label="Conversión global"
              value={`${s?.conversion_rate ?? 0}%`}
              current={s?.conversion_rate ?? 0}
              prev={0}
              sub="prospectos → clientas"
            />
          </div>

          {/* ── Revenue chart ── */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-50 px-5 py-4 flex justify-between items-center">
              <div>
                <span className="text-sm font-semibold text-gray-800">Ingresos por {period === "year" ? "mes" : "día"}</span>
                <p className="text-xs text-gray-400 mt-0.5">{periodLabel}</p>
              </div>
              <span className="text-sm font-bold text-[#E75480]">{fmt(s?.revenue ?? 0)}</span>
            </div>
            <div className="px-4 pt-3 pb-2">
              <AreaChart data={data?.revenue_chart ?? []} period={period} />
            </div>
          </div>

          {/* ── Productos + Pago ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Top productos */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-50 px-5 py-4">
                <span className="text-sm font-semibold text-gray-800">Top productos</span>
                <p className="text-xs text-gray-400 mt-0.5">Por ingresos generados en el período</p>
              </div>
              <div className="p-5">
                {(data?.top_products || []).length === 0 ? (
                  <p className="text-sm text-gray-300 text-center py-4">Sin ventas en el período</p>
                ) : (
                  data!.top_products.map((p) => (
                    <HBar
                      key={p.name}
                      label={p.name}
                      value={p.revenue}
                      max={maxProduct}
                      sub={`${fmt(p.revenue)} · ${p.quantity} uds`}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Tipo de pago */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-50 px-5 py-4">
                <span className="text-sm font-semibold text-gray-800">Forma de pago</span>
                <p className="text-xs text-gray-400 mt-0.5">Distribución de ventas por método</p>
              </div>
              <div className="p-5">
                <DonutChart items={data?.by_payment_type ?? []} total={totalPayment} />
              </div>
            </div>
          </div>

          {/* ── Pipeline + Seguimientos ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Pipeline de clientas */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-50 px-5 py-4">
                <span className="text-sm font-semibold text-gray-800">Pipeline de clientas</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  {pipe?.total ?? 0} contactos en total
                </p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Clientas activas</span>
                    <span className="text-xs text-[#C0395E] font-semibold">
                      {pipe?.customers ?? 0}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#E75480] rounded-full transition-all duration-500"
                      style={{ width: `${pipe?.total ? ((pipe.customers / pipe.total) * 100) : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Prospectos</span>
                    <span className="text-xs text-gray-500 font-semibold">
                      {pipe?.prospects ?? 0}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                      style={{ width: `${pipe?.total ? ((pipe.prospects / pipe.total) * 100) : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Para más adelante</span>
                    <span className="text-xs text-yellow-600 font-semibold">
                      {pipe?.later ?? 0}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${pipe?.total ? ((pipe.later / pipe.total) * 100) : 0}%` }}
                    />
                  </div>
                </div>

                {/* Conversion rate callout */}
                {(pipe?.total ?? 0) > 0 && (
                  <div className="bg-[#FFF0F4] rounded-lg px-4 py-3 mt-2">
                    <p className="text-xs text-[#C0395E] font-medium">
                      {s?.conversion_rate ?? 0}% de tus contactos son clientas activas
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Seguimientos */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-50 px-5 py-4">
                <span className="text-sm font-semibold text-gray-800">Seguimientos</span>
                <p className="text-xs text-gray-400 mt-0.5">Estado del sistema 2+2+2</p>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <span className="text-xl font-bold text-gray-800 block">{fup?.sent ?? 0}</span>
                    <span className="text-xs text-gray-400 mt-0.5 block">Enviados</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <span className="text-xl font-bold text-[#E75480] block">{fup?.pending ?? 0}</span>
                    <span className="text-xs text-gray-400 mt-0.5 block">Pendientes</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <span className="text-xl font-bold text-emerald-600 block">{fup?.converted ?? 0}</span>
                    <span className="text-xs text-gray-400 mt-0.5 block">Convertidos</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Tasa de conversión</span>
                    <span className="text-xs font-bold text-emerald-600">{fup?.rate ?? 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${fup?.rate ?? 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {fup?.converted ?? 0} ventas originadas desde un seguimiento
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tipo de piel ── */}
          {(data?.skin_type_dist || []).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-50 px-5 py-4">
                <span className="text-sm font-semibold text-gray-800">Distribución por tipo de piel</span>
                <p className="text-xs text-gray-400 mt-0.5">Perfil de tu cartera de clientas</p>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {data!.skin_type_dist.map((item) => (
                  <HBar
                    key={item.skin_type}
                    label={item.skin_type}
                    value={item.count}
                    max={maxSkin}
                    sub={`${item.count} ${item.count === 1 ? "clienta" : "clientas"}`}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
