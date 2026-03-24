"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

export default function ClientProfile() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [client, setClient] = useState<any>(null)
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const formatPhone = (phone: string) => {
    if (!phone) return "Sin teléfono"
    const digits = phone.replace(/\D/g, "").slice(0, 10)
    if (digits.length < 10) return phone
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace(/^/, "RD$")
  }

  // ✅ NUEVO: tiempo como cliente
  const getClientSince = (date: string) => {
    if (!date) return ""

    const created = new Date(date)
    const now = new Date()

    const diffMonths =
      (now.getFullYear() - created.getFullYear()) * 12 +
      (now.getMonth() - created.getMonth())

    if (diffMonths <= 0) return "Nuevo cliente"
    if (diffMonths === 1) return "Cliente desde hace 1 mes"
    if (diffMonths < 12) return `Cliente desde hace ${diffMonths} meses`

    const years = Math.floor(diffMonths / 12)
    return `Cliente desde hace ${years} año${years > 1 ? "s" : ""}`
  }

  useEffect(() => {
    const loadData = async () => {
      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single()

      const { data: salesData } = await supabase
        .from("sales")
        .select(`
          *,
          sale_items (
            quantity,
            price,
            product:products ( name )
          )
        `)
        .eq("client_id", id)
        .order("created_at", { ascending: false })

      setClient(clientData)
      setSales(salesData || [])
      setLoading(false)
    }

    loadData()
  }, [id])

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  const status = client?.status || "prospect"

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <section className="bg-white border rounded-3xl p-6">

        <div className="flex justify-between items-start flex-wrap gap-4">

<div className="space-y-3">

  {/* 🔹 NOMBRE + STATUS */}
  <div className="flex items-center gap-3 flex-wrap">
    <h1 className="text-2xl font-semibold text-gray-900">
      {client?.name}
    </h1>



<span
  className={`text-xs px-3 py-1 rounded-full font-medium ${
    status === "customer"
      ? "bg-pink-100 text-[#E75480]"
      : status === "later"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-gray-100 text-gray-600"
  }`}
>
  {status === "customer"
    ? "Cliente"
    : status === "later"
    ? "Más adelante"
    : "Prospecto"}
</span>
  </div>

  {/* 🔹 TELÉFONO */}
  <p className="text-sm text-gray-500">
    {formatPhone(client?.phone)}
  </p>

  {/* 🔹 METADATA */}
  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">

    {client?.email && (
      <span className="flex items-center gap-1">
        📧 {client.email}
      </span>
    )}

    {client?.skin_type && (
      <span className="bg-pink-50 text-[#E75480] px-2.5 py-1 rounded-full font-medium">
        {client.skin_type}
      </span>
    )}

    {client?.created_at && (
      <span className="text-gray-400">
        {getClientSince(client.created_at)}
      </span>
    )}

  </div>

</div>

          {/* CTA */}
          <button
            onClick={() => router.push(`/sales/new?client_id=${id}`)}
            className="bg-[#E75480] text-white px-4 py-2 rounded-xl text-sm"
          >
            + Nueva venta
          </button>

        </div>

      </section>

      {/* HISTORIAL */}
      <section className="bg-white border rounded-3xl p-6">

        <h2 className="text-lg font-semibold mb-6">
          Historial de compras
        </h2>

        {sales.length === 0 ? (
          <p className="text-gray-500">
            No hay compras registradas
          </p>
        ) : (
          <div className="space-y-6">

            {sales.map((sale) => {

              const subtotal = sale.sale_items?.reduce(
                (acc: number, item: any) =>
                  acc + Number(item.price) * Number(item.quantity),
                0
              )

              const discountAmount = sale.discount
                ? (subtotal * sale.discount) / 100
                : 0

              const total = subtotal - discountAmount

              return (
                <div
                  key={sale.id}
                  className="border rounded-2xl p-5"
                >

                  <div className="flex justify-between mb-4">
                    <p className="text-sm text-gray-500">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </p>

                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {sale.payment_type || "N/A"}
                    </span>
                  </div>

                  {/* ITEMS */}
                  <div className="space-y-2 text-sm">

                    {sale.sale_items?.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between"
                      >
                        <span>
                          {item.product?.name} x{item.quantity}
                        </span>

                        <span>
                          {formatCurrency(
                            Number(item.price) * Number(item.quantity)
                          )}
                        </span>
                      </div>
                    ))}

                  </div>

                  {/* TOTALS */}
                  <div className="mt-4 pt-4 border-t space-y-1 text-sm">

                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>

                    {sale.discount > 0 && (
                      <div className="flex justify-between text-[#E75480]">
                        <span>Descuento ({sale.discount}%)</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-semibold text-base mt-2">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>

                  </div>

                </div>
              )
            })}

          </div>
        )}

      </section>

    </div>
  )
}