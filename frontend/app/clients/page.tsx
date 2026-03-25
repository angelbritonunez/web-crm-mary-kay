"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

type Client = {
  id: string
  name: string
  phone: string
  status: string
  skin_type: string
}

export default function ClientsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setClients(data)
      }

      setLoading(false)
    }

    fetchClients()
  }, [])

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

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.phone.includes(search)
  )

  const getStatusUI = (status: string) => {
    if (status === "customer") {
      return {
        label: "Cliente",
        className: "bg-pink-100 text-[#E75480]",
      }
    }

    if (status === "later") {
      return {
        label: "Más adelante",
        className: "bg-yellow-100 text-yellow-700",
      }
    }

    return {
      label: "Prospecto",
      className: "bg-gray-100 text-gray-600",
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center border rounded-2xl px-6 py-4 mb-6 bg-white">
        <h1 className="text-xl font-semibold">Clientes</h1>

        <button
          onClick={() => router.push("/clients/new")}
          className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full text-sm"
        >
          Nuevo cliente
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar cliente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded-xl px-4 py-3 mb-6 bg-white outline-none"
      />

      {loading ? (
        <p className="text-gray-500">Cargando clientes...</p>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white border rounded-xl p-6 text-center">
          <p className="text-gray-500">
            {search
              ? "No se encontraron clientes"
              : "Aún no tienes clientes registrados"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClients.map((client) => {
            const statusUI = getStatusUI(client.status)

            return (
              <div
                key={client.id}
                onClick={() => router.push(`/clients/${client.id}`)}
                className="bg-white border rounded-xl p-4 cursor-pointer hover:shadow-sm transition"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatPhone(client.phone)}
                    </p>

                    <span
                      className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full ${statusUI.className}`}
                    >
                      {statusUI.label}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {client.skin_type && (
                      <span className="rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium text-[#E75480]">
                        {client.skin_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}