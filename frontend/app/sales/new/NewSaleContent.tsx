"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createSale } from "@/lib/api"
import { createClient } from "@/lib/supabase"

export default function NewSaleContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const clientIdFromURL = searchParams.get("client_id")

  const [products, setProducts] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [clientId, setClientId] = useState(clientIdFromURL || "")

  const [paymentType, setPaymentType] = useState("efectivo")
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

  // ✅ FIX TOTAL (nunca negativo)
  const total = Math.max(
    0,
    subtotal - (subtotal * discountValue) / 100
  )

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

      await createSale(payload)

      router.push(`/clients/${clientId}`)

    } catch (err: any) {
      console.error(err)
      setError("Error registrando la venta.")
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

      <div className="relative mb-6">
        <input
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-full border bg-white text-sm shadow-sm focus:outline-none"
        />
        <span className="absolute left-4 top-3 text-gray-400">🔍</span>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["Todos", "skincare", "makeup"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm border ${
              category === cat
                ? "bg-[#E75480] text-white border-[#E75480]"
                : "bg-white text-gray-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">

        <div className="col-span-8">
          <div className="grid grid-cols-3 gap-5">

            {filteredProducts.map((p) => {
              const selected = isSelected(p.id)
              const qty = getQuantity(p.id)

              return (
                <div
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className={`p-5 rounded-2xl border transition cursor-pointer ${
                    selected
                      ? "border-[#E75480] bg-[#FDE7EF]"
                      : "bg-white hover:shadow-sm"
                  }`}
                >
                  <span className="text-[10px] uppercase text-gray-400 tracking-wide">
                    {p.category}
                  </span>

                  <p className="font-semibold text-sm mt-2">{p.name}</p>

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

        <div className="col-span-4">
          <div className="bg-white border rounded-2xl p-6 sticky top-6 shadow-sm">

            <h2 className="font-semibold mb-4">Resumen</h2>

            {selectedProducts.length === 0 && (
              <p className="text-sm text-gray-400">No hay productos agregados</p>
            )}

            {selectedProducts.map((p) => (
              <div key={p.id} className="flex justify-between items-center text-sm mb-3">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-gray-400">
                    {formatCurrency(p.price)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(p.id, p.quantity - 1)}>-</button>
                  <span>{p.quantity}</span>
                  <button onClick={() => updateQuantity(p.id, p.quantity + 1)}>+</button>
                </div>
              </div>
            ))}

            {/* 🔥 DESCUENTO FIX */}
            <div className="mt-6">
              <label className="text-sm text-gray-500">
                Descuento (%)
              </label>

              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                step={1}
                value={discount}
                onChange={(e) => {
                  let value = e.target.value

                  if (value === "") {
                    setDiscount("")
                    return
                  }

                  let num = Number(value)

                  if (num < 0) num = 0
                  if (num > 100) num = 100

                  setDiscount(num)
                }}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                placeholder="0"
              />
            </div>

            <div className="mt-4">
              <label className="text-sm text-gray-500">Método de pago</label>

              <div className="flex mt-2 bg-gray-100 rounded-xl p-1">
                {["efectivo", "transferencia"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setPaymentType(type)}
                    className={`flex-1 py-2 text-sm rounded-lg ${
                      paymentType === type
                        ? "bg-white shadow text-[#E75480]"
                        : "text-gray-500"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between text-lg font-semibold mt-2">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || selectedProducts.length === 0}
              className="w-full mt-6 bg-[#E75480] text-white py-3 rounded-xl font-medium shadow-md hover:opacity-90"
            >
              {loading ? "Procesando..." : "Guardar venta"}
            </button>

          </div>
        </div>

      </div>
    </div>
  )
}