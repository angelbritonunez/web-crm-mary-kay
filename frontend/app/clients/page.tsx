"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getClients } from "@/lib/api"
import { Search } from "lucide-react"
import type { Client } from "@/types"

function formatPhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "").slice(0, 10)
  if (digits.length < 10) return phone || "Sin teléfono"
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function StatusBadge({ status }: { status: string }) {
  if (status === "customer")
    return (
      <span className="rounded-full text-xs font-medium px-2.5 py-0.5 bg-[#FFF0F4] text-[#C0395E]">
        Cliente
      </span>
    )
  return (
    <span className="rounded-full text-xs font-medium px-2.5 py-0.5 bg-gray-100 text-gray-500">
      Prospecto
    </span>
  )
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "customer" | "prospect">("all")

  useEffect(() => {
    const init = async () => {
      try {
        const res = await getClients()
        const data = res.data ?? res
        setClients(data as Client[])
      } catch {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  const filtered = clients.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const customerCount = clients.filter((c) => c.status === "customer").length
  const prospectCount = clients.filter((c) => c.status === "prospect").length

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Clientes
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Cargando..." : `${clients.length} registradas · ${customerCount} clientes · ${prospectCount} prospectos`}
          </p>
        </div>
        <button
          onClick={() => router.push("/clients/new")}
          className="bg-[#E75480] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#d04070] transition whitespace-nowrap"
        >
          + Nuevo cliente
        </button>
      </div>

      {/* ── Main card ── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">

        {/* Sticky search + filter header */}
        <div className="border-b border-gray-50 px-5 py-3 space-y-2.5">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
            />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E75480] focus:border-transparent transition"
            />
          </div>
          <div className="flex gap-1.5">
            {(["all", "customer", "prospect"] as const).map((s) => {
              const label = s === "all" ? "Todos" : s === "customer" ? "Clientes" : "Prospectos"
              const active = statusFilter === s
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    active
                      ? "bg-[#E75480] text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Scrollable list */}
        <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
          {loading ? (
            /* Skeletons */
            <div className="divide-y divide-gray-50">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-5 py-4 animate-pulse">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 bg-gray-100 rounded w-36" />
                    <div className="h-4 bg-gray-100 rounded w-16" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-28 mb-2" />
                  <div className="h-5 bg-gray-100 rounded-full w-16" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-sm font-medium text-gray-600">
                {search || statusFilter !== "all"
                  ? "No se encontraron resultados"
                  : "No tienes clientes registrados"}
              </p>
              {!search && statusFilter === "all" && (
                <p className="text-xs text-gray-400 mt-1">
                  Agrega tu primer cliente para comenzar.
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/clients/${c.id}`)}
                  className="px-5 py-4 hover:bg-gray-50/60 cursor-pointer transition"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {c.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatPhone(c.phone)}
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={c.status} />
                      </div>
                    </div>
                    {c.skin_type && (
                      <span className="shrink-0 rounded-full text-xs font-medium px-2.5 py-0.5 bg-pink-50 text-[#E75480]">
                        {c.skin_type}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
