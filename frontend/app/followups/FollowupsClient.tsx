"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock } from "lucide-react"
import { getFollowups, getReceivables, completeFollowup, updateFollowup, addPayment } from "@/lib/api"
import { usePlan } from "@/hooks/usePlan"
import UpgradeBanner from "@/components/UpgradeBanner"
import type { WorkspaceFollowup, Receivable } from "@/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPhone(phone: string): string {
  const d = (phone || "").replace(/\D/g, "").slice(0, 10)
  if (d.length < 10) return phone || "—"
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return new Date(y, m - 1, d, 12).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" })
}

function buildWAUrl(phone: string, msg: string): string {
  let d = (phone || "").replace(/\D/g, "")
  if (d && !d.startsWith("1")) d = "1" + d
  return `https://wa.me/${d}?text=${encodeURIComponent(msg)}`
}

const TYPE_LABEL: Record<string, string> = { day2: "2 días", week2: "2 semanas", month2: "2 meses" }
const TYPE_STYLE: Record<string, string> = {
  day2:   "bg-[#FFF0F4] text-[#C0395E]",
  week2:  "bg-indigo-50 text-indigo-700",
  month2: "bg-green-50 text-green-700",
}
const BUCKET_LABEL: Record<string, string> = { overdue: "Vencidos", today: "Hoy", upcoming: "Próximos" }

// ── WA Icon ───────────────────────────────────────────────────────────────────

function WAIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.477 2 2 6.477 2 12c0 1.989.58 3.842 1.583 5.405L2.046 22l4.729-1.518A9.956 9.956 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182a8.18 8.18 0 0 1-4.17-1.14l-.299-.177-3.093.994.957-3.026-.198-.316A8.143 8.143 0 0 1 3.818 12c0-4.511 3.671-8.182 8.182-8.182 4.51 0 8.182 3.671 8.182 8.182 0 4.51-3.671 8.182-8.182 8.182z" />
    </svg>
  )
}

// ── Main content ──────────────────────────────────────────────────────────────

function FollowupsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { can } = usePlan()
  const initialTab = searchParams.get("tab") === "cobros" && can("basic") ? "cobros" : "seguimientos"

  const [tab, setTab]             = useState<"seguimientos" | "cobros">(initialTab)
  const [filter, setFilter]       = useState<"overdue" | "today" | "upcoming" | "all">("all")
  const [followups, setFollowups] = useState<WorkspaceFollowup[]>([])
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [totalOwed, setTotalOwed] = useState(0)
  const [loading, setLoading]     = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText]   = useState("")
  const [completing, setCompleting] = useState<string | null>(null)

  // Abono inline state
  const [abonoId, setAbonoId]         = useState<string | null>(null)
  const [abonoAmount, setAbonoAmount] = useState("")
  const [abonoType, setAbonoType]     = useState<"efectivo" | "transferencia">("efectivo")
  const [savingAbono, setSavingAbono] = useState(false)

  // Cobro message edit state
  const [cobroMessages, setCobroMessages]   = useState<Record<string, string>>({})
  const [editingCobroId, setEditingCobroId] = useState<string | null>(null)
  const [editCobroText, setEditCobroText]   = useState("")

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      // Load independently so one failure doesn't block the other
      const [fRes, rRes] = await Promise.allSettled([getFollowups(), getReceivables()])

      if (fRes.status === "rejected") {
        // Auth error → redirect to login; other errors → show empty state
        if (String(fRes.reason).includes("autenticado")) { router.push("/login"); return }
      } else {
        const data = fRes.value
        if (data.error) {
          console.error("Error en seguimientos:", data.error)
        } else {
          const all: WorkspaceFollowup[] = [
            ...(data.overdue  || []).map((f: any) => ({ ...f, bucket: "overdue"  as const })),
            ...(data.today    || []).map((f: any) => ({ ...f, bucket: "today"    as const })),
            ...(data.upcoming || []).map((f: any) => ({ ...f, bucket: "upcoming" as const })),
          ]
          setFollowups(all)
        }
      }

      if (rRes.status === "rejected") {
        if (String(rRes.reason).includes("autenticado")) { router.push("/login"); return }
      } else {
        const data = rRes.value
        const rcv = data.receivables || []
        setReceivables(rcv)
        setTotalOwed(data.total_owed || 0)
        const msgs: Record<string, string> = {}
        rcv.forEach((r: Receivable) => {
          msgs[r.sale_id] = `Hola ${r.client_name.split(" ")[0]} Espero que estés disfrutando muchísimo tus productos. Te escribo porque quedó un pendiente del saldo de tu última compra y quiero tenerlo al día para seguir consintiéndote como te mereces ✨ ¿Te comparto el número de cuenta y quedamos al día? 🌸`
        })
        setCobroMessages(msgs)
      }

      setLoading(false)
    }
    load()
  }, [])

  // ── Seguimientos handlers ─────────────────────────────────────────────────

  const handleSaveMessage = async (id: string) => {
    await updateFollowup(id, { mensaje: editText })
    setFollowups((prev) => prev.map((f) => f.id === id ? { ...f, mensaje: editText } : f))
    setEditingId(null)
  }

  const handleComplete = async (id: string) => {
    setCompleting(id)
    await completeFollowup(id)
    setFollowups((prev) => prev.filter((f) => f.id !== id))
    setCompleting(null)
  }

  // ── Cobros handlers ───────────────────────────────────────────────────────

  const handleAbono = async (saleId: string, balance: number) => {
    const amount = parseFloat(abonoAmount)
    if (!amount || amount <= 0 || amount > balance) return
    setSavingAbono(true)
    try {
      await addPayment(saleId, { amount, payment_type: abonoType })
      setReceivables((prev) => prev.map((r) => {
        if (r.sale_id !== saleId) return r
        const newPaid = r.amount_paid + amount
        const newBalance = r.total - newPaid
        return { ...r, amount_paid: newPaid, balance: newBalance, status: newBalance <= 0 ? "pagado" : "parcial" }
      }).filter((r) => r.balance > 0))
      setAbonoId(null)
      setAbonoAmount("")
    } finally {
      setSavingAbono(false)
    }
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const filtered = filter === "all" ? followups : followups.filter((f) => f.bucket === filter)
  const counts = {
    overdue:  followups.filter((f) => f.bucket === "overdue").length,
    today:    followups.filter((f) => f.bucket === "today").length,
    upcoming: followups.filter((f) => f.bucket === "upcoming").length,
  }

  // ── Skeleton ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-gray-100 rounded-lg animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3 animate-pulse">
          {[1,2,3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Seguimientos</h1>
        <p className="text-sm text-gray-400 mt-0.5">Gestiona tus contactos pendientes y cobros en un solo lugar</p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {/* Tab: Seguimientos */}
        <button
          onClick={() => setTab("seguimientos")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
            tab === "seguimientos" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="flex items-center gap-2">
            Seguimientos 2+2+2
            {followups.length > 0 && (
              <span className="bg-[#E75480] text-white text-xs font-semibold rounded-full px-2 py-0.5 leading-none">
                {followups.length}
              </span>
            )}
          </span>
        </button>

        {/* Tab: Cobros pendientes */}
        {can("basic") ? (
          <button
            onClick={() => setTab("cobros")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              tab === "cobros" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              Cobros pendientes
              {receivables.length > 0 && (
                <span className="bg-orange-400 text-white text-xs font-semibold rounded-full px-2 py-0.5 leading-none">
                  {receivables.length}
                </span>
              )}
            </span>
          </button>
        ) : (
          <button
            disabled
            className="px-5 py-2 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed flex items-center gap-2"
          >
            Cobros pendientes
            <span className="flex items-center gap-0.5 text-[10px] font-semibold bg-gray-200 text-gray-400 rounded-full px-1.5 py-0.5 leading-none">
              <Lock size={8} strokeWidth={2.5} />
              Basic
            </span>
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: SEGUIMIENTOS                                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === "seguimientos" && (
        <div className="space-y-3">

          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "overdue", "today", "upcoming"] as const).map((f) => {
              const label = f === "all" ? `Todos (${followups.length})` : `${BUCKET_LABEL[f]} (${counts[f]})`
              const active = filter === f
              const isOverdue = f === "overdue" && counts.overdue > 0
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                    active
                      ? isOverdue
                        ? "bg-[#E75480] text-white border-[#E75480]"
                        : "bg-gray-900 text-white border-gray-900"
                      : isOverdue
                        ? "bg-[#FFF0F4] text-[#C0395E] border-[#FADADD] hover:bg-[#FFE0E8]"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Cards */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400 text-sm">
              {filter === "all" ? "¡Todo al día! No tienes seguimientos pendientes." : `No hay seguimientos en esta categoría.`}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((fup) => {
                const isEditing = editingId === fup.id
                const isCompleting = completing === fup.id
                const dateStr = new Date(fup.scheduled_date).toLocaleDateString("es-DO", {
                  day: "2-digit", month: "short", timeZone: "America/Santo_Domingo",
                })

                return (
                  <div key={fup.id} className="bg-white rounded-xl border border-gray-100 p-4">
                    {/* Row 1 */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-gray-800">{fup.client_name}</span>
                        <span className={`rounded-full text-xs font-medium px-2 py-0.5 ${
                          fup.client_status === "customer"
                            ? "bg-[#FFF0F4] text-[#C0395E]"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {fup.client_status === "customer" ? "Cliente" : "Prospecto"}
                        </span>
                        {fup.phone && (
                          <span className="text-xs text-gray-400">· {formatPhone(fup.phone)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                        <span className={`rounded-full text-xs font-medium px-2.5 py-0.5 ${TYPE_STYLE[fup.type]}`}>
                          {TYPE_LABEL[fup.type]}
                        </span>
                        {fup.bucket === "overdue" && (
                          <span className="bg-[#E75480] text-white rounded-full text-xs font-medium px-2.5 py-0.5">
                            Vencido
                          </span>
                        )}
                        {fup.bucket === "today" && (
                          <span className="bg-amber-50 text-amber-600 rounded-full text-xs font-medium px-2.5 py-0.5">
                            Hoy
                          </span>
                        )}
                        <span className="text-xs text-gray-300">{dateStr}</span>
                      </div>
                    </div>

                    {/* Row 2: message */}
                    {isEditing ? (
                      <div className="mb-3">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg p-2.5 text-xs text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#E75480] resize-none min-h-[64px] mb-2"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveMessage(fup.id)} className="bg-[#E75480] text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#d04070] transition">
                            Guardar
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 text-xs hover:text-gray-600 px-2 py-1.5">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {fup.mensaje || <span className="italic text-gray-300">Sin mensaje</span>}
                        </p>
                        <button
                          onClick={() => { setEditingId(fup.id); setEditText(fup.mensaje || "") }}
                          className="text-xs text-[#E75480] font-medium hover:underline mt-1"
                        >
                          Editar mensaje
                        </button>
                      </div>
                    )}

                    {/* Row 3: actions */}
                    <div className="flex gap-2">
                      <a
                        href={buildWAUrl(fup.phone, fup.mensaje)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#E75480] text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#d04070] transition"
                      >
                        <WAIcon /> Enviar por WhatsApp
                      </a>
                      <button
                        onClick={() => handleComplete(fup.id)}
                        disabled={isCompleting}
                        className="bg-gray-50 text-gray-600 border border-gray-200 rounded-lg py-2 px-3 text-xs font-medium hover:bg-gray-100 transition disabled:opacity-50"
                      >
                        {isCompleting ? "..." : "Marcar enviado"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: COBROS                                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === "cobros" && !can("basic") && <UpgradeBanner requiredPlan="basic" />}
      {tab === "cobros" && can("basic") && (
        <div className="space-y-3">

          {/* Summary strip */}
          {receivables.length > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-orange-700 font-medium">
                {receivables.length} {receivables.length === 1 ? "venta" : "ventas"} con saldo pendiente
              </span>
              <span className="text-sm font-bold text-orange-500">{formatCurrency(totalOwed)}</span>
            </div>
          )}

          {receivables.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400 text-sm">
              ¡Sin cobros pendientes! Todas las ventas están al día.
            </div>
          ) : (
            <div className="space-y-2">
              {receivables.map((r) => {
                const waMsg = cobroMessages[r.sale_id] ?? ""
                const isAbono = abonoId === r.sale_id
                const isEditingCobro = editingCobroId === r.sale_id

                return (
                  <div key={r.sale_id} className="bg-white rounded-xl border border-gray-100 p-4">
                    {/* Row 1: client + amounts */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-sm text-gray-800">{r.client_name}</p>
                          <span className="rounded-full text-xs font-medium px-2 py-0.5 bg-[#FFF0F4] text-[#C0395E]">
                            Cliente
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{formatPhone(r.client_phone)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Compra: {formatDate(r.sale_date)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-orange-500">{formatCurrency(r.balance)}</p>
                        <p className="text-xs text-gray-400">de {formatCurrency(r.total)}</p>
                        <span className={`inline-block mt-1 rounded-full text-xs font-medium px-2.5 py-0.5 ${
                          r.status === "pendiente" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
                        }`}>
                          {r.status === "pendiente" ? "Sin pago" : "Abono parcial"}
                        </span>
                      </div>
                    </div>

                    {/* Message preview */}
                    {isEditingCobro ? (
                      <div className="mb-3">
                        <textarea
                          value={editCobroText}
                          onChange={(e) => setEditCobroText(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg p-2.5 text-xs text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#E75480] resize-none min-h-[64px] mb-2"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCobroMessages((prev) => ({ ...prev, [r.sale_id]: editCobroText }))
                              setEditingCobroId(null)
                            }}
                            className="bg-[#E75480] text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#d04070] transition"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingCobroId(null)}
                            className="text-gray-400 text-xs hover:text-gray-600 px-2 py-1.5"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 leading-relaxed">{waMsg}</p>
                        <button
                          onClick={() => { setEditingCobroId(r.sale_id); setEditCobroText(waMsg) }}
                          className="text-xs text-[#E75480] font-medium hover:underline mt-1"
                        >
                          Editar mensaje
                        </button>
                      </div>
                    )}

                    {/* Abono inline form */}
                    {isAbono && (
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-3 space-y-2">
                        <p className="text-xs font-medium text-gray-600">Registrar abono</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">RD$</span>
                            <input
                              type="number"
                              min={1}
                              max={r.balance}
                              value={abonoAmount}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value)
                                if (isNaN(val) || val < 0) { setAbonoAmount(""); return }
                                setAbonoAmount(String(Math.min(val, r.balance)))
                              }}
                              placeholder="0"
                              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75480] bg-white"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Máx: {formatCurrency(r.balance)}</p>
                          </div>
                          <select
                            value={abonoType}
                            onChange={(e) => setAbonoType(e.target.value as "efectivo" | "transferencia")}
                            className="border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#E75480]"
                          >
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAbono(r.sale_id, r.balance)}
                            disabled={savingAbono || !abonoAmount}
                            className="bg-[#E75480] text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#d04070] disabled:opacity-50 transition"
                          >
                            {savingAbono ? "Guardando..." : "Guardar abono"}
                          </button>
                          <button
                            onClick={() => { setAbonoId(null); setAbonoAmount("") }}
                            className="text-gray-400 text-xs hover:text-gray-600 px-2 py-1.5"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <a
                        href={buildWAUrl(r.client_phone, waMsg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#E75480] text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#d04070] transition"
                      >
                        <WAIcon /> Enviar cobro por WhatsApp
                      </a>
                      {!isAbono && (
                        <button
                          onClick={() => { setAbonoId(r.sale_id); setAbonoAmount("") }}
                          className="bg-gray-50 text-gray-600 border border-gray-200 rounded-lg py-2 px-3 text-xs font-medium hover:bg-gray-100 transition"
                        >
                          Registrar abono
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function FollowupsPage() {
  return (
    <Suspense>
      <FollowupsContent />
    </Suspense>
  )
}
