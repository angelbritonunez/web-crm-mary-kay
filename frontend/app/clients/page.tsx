"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { getClients } from "@/lib/api" // 🔥 NUEVO

type Client = {
  id: string
  name: string
  phone: string
  skin_type?: string | null
  created_at?: string
}

export default function ClientsPage() {
  const router = useRouter()

  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await getClients()

        // ⚠️ Ajuste porque tu endpoint devuelve {status, data}
        setClients(res.data || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  const filteredClients = useMemo(() => {
    return clients.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, clients])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border rounded-3xl p-6">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="mt-2 h-3 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <section className="bg-white border rounded-3xl p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Clientes
            </h1>
          </div>

          <button
            onClick={() => router.push("/clients/new")}
            className="bg-[#E75480] text-white px-4 py-2.5 rounded-2xl text-sm font-medium"
          >
            Nuevo cliente
          </button>

        </div>
      </section>

      {/* SEARCH */}
      <section>
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
        />
      </section>

      {/* LIST */}
      <section className="space-y-4">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 bg-white border rounded-2xl">
            <p className="text-gray-700 font-medium">
              No se encontraron clientes
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Intenta con otro nombre o registra uno nuevo
            </p>
          </div>
        ) : (
          filteredClients.map((c) => (
            <div
              key={c.id}
              onClick={() => router.push(`/clients/${c.id}`)}
              className="bg-white p-5 rounded-2xl border cursor-pointer hover:border-gray-300 transition"
            >
              <div className="flex justify-between items-start">

                <div>
                  <p className="font-semibold text-gray-900">
                    {c.name}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    {formatPhone(c.phone)}
                  </p>
                </div>

                {c.skin_type && (
                  <span className="text-xs bg-pink-50 text-[#E75480] px-2 py-1 rounded-full">
                    {c.skin_type}
                  </span>
                )}

              </div>
            </div>
          ))
        )}
      </section>

    </div>
  )
}