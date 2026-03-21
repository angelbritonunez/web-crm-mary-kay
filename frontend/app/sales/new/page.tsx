"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createSale } from "@/lib/api"
import { createClient } from "@/lib/supabase"

export default function NewSale() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const clientIdFromURL = searchParams.get("client_id")

  const [products, setProducts] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [clientId, setClientId] = useState(clientIdFromURL || "")
  
  const [paymentType, setPaymentType] = useState("efectivo") // ✅ FIX

  const [discount, setDiscount] = useState<number | "">("")

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Todos")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace(/^/, "RD$")
  }

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from("products").select("*")
      setProducts(data || [])
    }
    fetchProducts()
  }, [])

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory =
      category === "Todos" || p.category === category
    return matchSearch && matchCategory
  })

  const addProduct = (product: any) => {
    const exists = selectedProducts.find((p) => p.id === product.id)

    if (exists) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.id === product.id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      )
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }])
    }
  }

  const isSelected = (id: string) => {
    return selectedProducts.some((p) => p.id === id)
  }

  const getQuantity = (id: string) => {
    const p = selectedProducts.find((p) => p.id === id)
    return p?.quantity || 0
  }

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      setSelectedProducts(selectedProducts.filter((p) => p.id !== id))
      return
    }

    setSelectedProducts(
      selectedProducts.map((p) =>
        p.id === id ? { ...p, quantity: qty } : p
      )
    )
  }

  const subtotal = selectedProducts.reduce(
    (acc, p) => acc + p.price * p.quantity,
    0
  )

  const discountValue = Number(discount) || 0
  const total = subtotal - (subtotal * discountValue) / 100

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!clientId) {
        setError("Debe seleccionar un cliente")
        setLoading(false)
        return
      }

      const payload = {
        client_id: clientId,
        total,
        discount: discountValue,
        payment_type: paymentType,
        items: selectedProducts.map((p) => ({
          product_id: p.id,
          quantity: p.quantity,
          price: p.price,
        })),
      }

      console.log("Payload enviado:", payload)

      await createSale(payload)

      router.push(`/clients/${clientId}`)

    } catch (err: any) {
      console.error("ERROR REAL:", err)
      setError("Error registrando la venta. Ver consola.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      <h1 className="text-2xl font-semibold mb-1">Nueva venta</h1>
      <p className="text-sm text-gray-500 mb-6">
        Selecciona los productos y completa el resumen
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-500">{error}</div>
      )}

      <input
        placeholder="Buscar productos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2 rounded-full border text-sm"
      />

      {/* 🔥 SELECTOR DE PAGO (LO QUE TE FALTABA) */}
      <div className="mb-6">
        <label className="text-sm font-medium">Tipo de pago</label>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
          className="w-full border px-3 py-2 rounded-lg mt-1"
        >
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="tarjeta">Tarjeta</option>
        </select>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        <div className="md:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">

            {filteredProducts.map((p) => {
              const selected = isSelected(p.id)
              const qty = getQuantity(p.id)

              return (
                <div
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className={`p-5 rounded-2xl border transition cursor-pointer
                  ${selected
                      ? "border-[#E75480] bg-pink-50 shadow-md"
                      : "bg-white hover:shadow-sm"
                    }`}
                >
                  <p className="font-semibold text-sm mt-3">{p.name}</p>
                  <p className="text-sm text-gray-500 mt-1 mb-4">
                    {formatCurrency(p.price)}
                  </p>

                  {!selected ? (
                    <button className="text-xs border rounded-full px-4 py-1">
                      + Agregar
                    </button>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#E75480]">✔ Agregado</span>

                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button onClick={() => updateQuantity(p.id, qty - 1)}>-</button>
                        <span>{qty}</span>
                        <button onClick={() => updateQuantity(p.id, qty + 1)}>+</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

          </div>
        </div>

        <div className="bg-white border rounded-2xl p-6 sticky top-6">

          <h2 className="font-semibold mb-4">Resumen</h2>

          {selectedProducts.map((p) => (
            <div key={p.id} className="flex justify-between text-sm mb-2">
              <span>{p.name} x{p.quantity}</span>
              <span>{formatCurrency(p.price * p.quantity)}</span>
            </div>
          ))}

          <div className="mt-6 border-t pt-4">
            <p className="text-sm text-gray-500">
              Subtotal: {formatCurrency(subtotal)}
            </p>

            <p className="text-2xl font-bold mt-1">
              {formatCurrency(total)}
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || selectedProducts.length === 0}
            className="w-full mt-6 bg-[#E75480] text-white py-3 rounded-xl"
          >
            {loading ? "Procesando..." : "Finalizar venta"}
          </button>

        </div>
      </div>
    </div>
  )
}