"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createSale, getClients, getProducts } from "@/lib/api"
import { Eye, EyeOff, Search, X } from "lucide-react"
import type { Product, SelectedProduct, ClientItem } from "@/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "").slice(0, 10)
  if (digits.length < 10) return phone || ""
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 0,
  }).format(amount)
}

const inputClass =
  "w-full border border-gray-200 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E75480] focus:border-transparent transition"

const labelClass =
  "block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide"

const CATEGORIES = ["Todos", "skincare", "makeup", "fragancia"]

// ── Component ─────────────────────────────────────────────────────────────────

export default function NewSaleContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientIdFromURL = searchParams.get("client_id")

  // Products
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [category, setCategory] = useState("Todos")

  // Client autocomplete
  const [clients, setClients] = useState<ClientItem[]>([])
  const [clientSearch, setClientSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null)
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const clientRef = useRef<HTMLDivElement>(null)

  // Form extras
  const [paymentType, setPaymentType] = useState("efectivo")
  const [discount, setDiscount] = useState<number | "">("")
  const [notes, setNotes] = useState("")
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [showProfit, setShowProfit] = useState(false)
  const [paymentMode, setPaymentMode] = useState<"completo" | "parcial">("completo")
  const [initialPayment, setInitialPayment] = useState<number | "">("")

  // Status
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load products + clients in parallel; auto-select from URL
  useEffect(() => {
    const init = async () => {
      try {
        const [productsRes, clientsRes] = await Promise.all([
          getProducts(),
          getClients(),
        ])

        const loadedProducts = (productsRes.data as Product[]) || []
        const loadedClients = (clientsRes.data as ClientItem[]) || []

        setProducts(loadedProducts)
        setClients(loadedClients)

        if (clientIdFromURL) {
          const match = loadedClients.find((c) => c.id === clientIdFromURL)
          if (match) {
            setSelectedClient(match)
            setClientSearch(match.name)
          }
        }
      } catch {
        // silently fail — form still usable without preloaded data
      }
    }

    init()
  }, [clientIdFromURL])

  // Close client dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Filtered lists
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name
      .toLowerCase()
      .includes(productSearch.toLowerCase())
    const matchCat = category === "Todos" || p.category === category
    return matchSearch && matchCat
  })

  const filteredClients = clients.filter((c) => {
    const q = clientSearch.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone || "").includes(clientSearch)
    )
  })

  // Product handlers
  const addProduct = (product: Product) => {
    const exists = selectedProducts.find((p) => p.id === product.id)
    if (exists) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      )
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }])
    }
  }

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      setSelectedProducts(selectedProducts.filter((p) => p.id !== id))
      return
    }
    setSelectedProducts(
      selectedProducts.map((p) => (p.id === id ? { ...p, quantity: qty } : p))
    )
  }

  const isSelected = (id: string) => selectedProducts.some((p) => p.id === id)
  const getQuantity = (id: string) =>
    selectedProducts.find((p) => p.id === id)?.quantity || 0

  // Totals
  const subtotal = selectedProducts.reduce(
    (acc, p) => acc + p.price * p.quantity,
    0
  )
  const discountValue = Math.min(50, Number(discount) || 0)
  const total = Math.max(0, subtotal - (subtotal * discountValue) / 100)
  const profit = total - subtotal * 0.5

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClient) {
      setError("Selecciona un cliente antes de guardar.")
      return
    }
    if (selectedProducts.length === 0) {
      setError("Agrega al menos un producto.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const sourceFollowupId = localStorage.getItem("source_followup_id")

      const initialAmt =
        paymentMode === "completo"
          ? total
          : Math.min(Number(initialPayment) || 0, total)

      await createSale({
        client_id: selectedClient.id,
        total,
        discount: discountValue,
        payment_type: paymentType,
        source_followup_id: sourceFollowupId,
        notes: notes.trim() || undefined,
        sale_date: saleDate || undefined,
        initial_payment: initialAmt,
        items: selectedProducts.map((p) => ({
          product_id: p.id,
          quantity: p.quantity,
          price: p.price,
        })),
      })

      localStorage.removeItem("source_followup_id")
      router.push(`/clients/${selectedClient.id}`)
    } catch (err) {
      console.error(err)
      setError("No se pudo guardar la venta. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = !!selectedClient && selectedProducts.length > 0

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Nueva venta
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Selecciona el cliente y los productos para registrar la venta.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="bg-white border border-gray-200 text-gray-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition"
        >
          ← Volver
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* ── Two-column form ── */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-[1fr_300px] gap-5 items-start">

          {/* ── Left: form sections ── */}
          <div className="space-y-4">

            {/* Section 1 — Cliente */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-visible">
              <div className="border-b border-gray-50 px-5 py-4">
                <span className="text-sm font-semibold text-gray-800">
                  Cliente
                </span>
                <p className="text-xs text-gray-400 mt-0.5">
                  Busca por nombre o número de teléfono
                </p>
              </div>

              <div className="p-5">
                {selectedClient ? (
                  <div className="flex items-center justify-between bg-[#FFF0F4] border border-[#FADADD] rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {selectedClient.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatPhone(selectedClient.phone)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClient(null)
                        setClientSearch("")
                      }}
                      className="text-gray-300 hover:text-gray-500 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative" ref={clientRef}>
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                      />
                      <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value)
                          setShowClientDropdown(true)
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E75480] focus:border-transparent transition"
                      />
                    </div>

                    {showClientDropdown && (
                      <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-52 overflow-y-auto">
                        {filteredClients.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-400">
                            No se encontraron clientes
                          </div>
                        ) : (
                          filteredClients.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setSelectedClient(c)
                                setClientSearch(c.name)
                                setShowClientDropdown(false)
                              }}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between border-b border-gray-50 last:border-0"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {c.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {formatPhone(c.phone)}
                                </p>
                              </div>
                              <span
                                className={`rounded-full text-xs font-medium px-2.5 py-0.5 ${
                                  c.status === "customer"
                                    ? "bg-[#FFF0F4] text-[#C0395E]"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {c.status === "customer" ? "Cliente" : "Prospecto"}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section 2 — Productos */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-50 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-gray-800">
                      Productos
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Haz clic para agregar productos a la venta
                    </p>
                  </div>
                  {selectedProducts.length > 0 && (
                    <span className="bg-[#E75480] text-white rounded-full text-xs font-semibold px-2.5 py-0.5">
                      {selectedProducts.reduce((a, p) => a + p.quantity, 0)}{" "}
                      items
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* Search + category pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-0">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                    />
                    <input
                      type="text"
                      placeholder="Buscar producto..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E75480] focus:border-transparent transition"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`rounded-full text-xs font-medium px-3 py-1.5 border transition ${
                          category === cat
                            ? "bg-[#E75480] text-white border-[#E75480]"
                            : "bg-white text-gray-500 border-gray-200 hover:border-[#E75480] hover:text-[#E75480]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product grid */}
                <div className="max-h-72 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                      No se encontraron productos
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5 pr-1">
                      {filteredProducts.map((p) => {
                        const selected = isSelected(p.id)
                        const qty = getQuantity(p.id)

                        return (
                          <div
                            key={p.id}
                            onClick={() => addProduct(p)}
                            className={`rounded-xl border p-3.5 cursor-pointer transition ${
                              selected
                                ? "border-[#E75480] bg-[#FFF0F4]"
                                : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50"
                            }`}
                          >
                            <span className="text-[10px] uppercase tracking-wider text-gray-300 font-medium">
                              {p.category}
                            </span>
                            <p className="text-sm font-semibold text-gray-800 mt-1 leading-tight">
                              {p.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatCurrency(p.price)}
                            </p>

                            {selected ? (
                              <div
                                className="flex items-center justify-between mt-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="text-xs font-medium text-[#C0395E]">
                                  ✓ Agregado
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(p.id, qty - 1)
                                    }
                                    className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 text-xs flex items-center justify-center hover:border-[#E75480] hover:text-[#E75480] transition"
                                  >
                                    −
                                  </button>
                                  <span className="text-sm font-semibold text-gray-700 w-4 text-center">
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(p.id, qty + 1)
                                    }
                                    className="w-6 h-6 rounded-full border border-gray-200 text-gray-500 text-xs flex items-center justify-center hover:border-[#E75480] hover:text-[#E75480] transition"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="mt-3 text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-500 hover:border-[#E75480] hover:text-[#E75480] transition"
                              >
                                + Agregar
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3 — Detalles adicionales */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-50 px-5 py-4">
                <span className="text-sm font-semibold text-gray-800">
                  Detalles adicionales
                </span>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Notas (opcional)</label>
                  <textarea
                    rows={3}
                    placeholder="Observaciones sobre la venta..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E75480] focus:border-transparent resize-none transition"
                  />
                </div>
                <div>
                  <label className={labelClass}>Fecha de venta</label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ── Right: sticky summary ── */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden sticky top-20">
            <div className="border-b border-gray-50 px-5 py-4">
              <span className="text-sm font-semibold text-gray-800">
                Resumen
              </span>
            </div>

            <div className="p-5 space-y-4">

              {/* Selected products mini-list */}
              <div className="space-y-2 min-h-[48px]">
                {selectedProducts.length === 0 ? (
                  <p className="text-xs text-gray-300 text-center py-2">
                    Aún no has agregado productos
                  </p>
                ) : (
                  selectedProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-700 truncate">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {formatCurrency(p.price)} × {p.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQuantity(p.id, p.quantity - 1)}
                          className="w-5 h-5 rounded-full border border-gray-200 text-gray-400 text-xs flex items-center justify-center hover:border-[#E75480] hover:text-[#E75480] transition"
                        >
                          −
                        </button>
                        <span className="text-xs font-semibold text-gray-700 w-4 text-center">
                          {p.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(p.id, p.quantity + 1)}
                          className="w-5 h-5 rounded-full border border-gray-200 text-gray-400 text-xs flex items-center justify-center hover:border-[#E75480] hover:text-[#E75480] transition"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 shrink-0 w-16 text-right">
                        {formatCurrency(p.price * p.quantity)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Discount */}
              <div>
                <label className={labelClass}>Descuento (%)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={50}
                  value={discount}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === "") {
                      setDiscount("")
                      return
                    }
                    let n = Number(v)
                    if (n < 0) n = 0
                    if (n > 50) n = 50
                    setDiscount(n)
                  }}
                  placeholder="0"
                  className={inputClass}
                />
              </div>

              {/* Payment mode */}
              <div>
                <label className={labelClass}>Pago inicial</label>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-2.5">
                  {[
                    { key: "completo", label: "Pago completo" },
                    { key: "parcial",  label: "Abono parcial" },
                  ].map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setPaymentMode(m.key as "completo" | "parcial")}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg transition ${
                        paymentMode === m.key
                          ? "bg-white shadow-sm text-[#E75480]"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {paymentMode === "parcial" && (
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={total}
                    value={initialPayment}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === "") { setInitialPayment(""); return }
                      const n = Math.min(Number(v), total)
                      setInitialPayment(n < 0 ? 0 : n)
                    }}
                    placeholder={`Monto a abonar (máx ${formatCurrency(total)})`}
                    className={inputClass}
                  />
                )}
              </div>

              {/* Payment type */}
              <div>
                <label className={labelClass}>Método de pago</label>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  {["efectivo", "transferencia"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPaymentType(type)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition ${
                        paymentType === type
                          ? "bg-white shadow-sm text-[#E75480]"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-50 pt-4 space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {discountValue > 0 && (
                  <div className="flex justify-between text-xs text-[#C0395E]">
                    <span>Descuento {discountValue}%</span>
                    <span>
                      −{formatCurrency((subtotal * discountValue) / 100)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Utilidad est.</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-medium ${
                        profit > 0 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {showProfit ? formatCurrency(profit) : "••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowProfit(!showProfit)}
                      className="text-gray-300 hover:text-[#E75480] transition"
                    >
                      {showProfit ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between font-semibold text-gray-800 pt-2 border-t border-gray-50">
                  <span className="text-sm">Total</span>
                  <span className="text-base text-[#E75480]">
                    {formatCurrency(total)}
                  </span>
                </div>

                {paymentMode === "parcial" && total > 0 && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2.5 mt-1">
                    <div className="flex justify-between text-xs text-yellow-700 mb-0.5">
                      <span>Abono inicial</span>
                      <span className="font-semibold">{formatCurrency(Math.min(Number(initialPayment) || 0, total))}</span>
                    </div>
                    <div className="flex justify-between text-xs text-yellow-700">
                      <span>Queda pendiente</span>
                      <span className="font-semibold">{formatCurrency(Math.max(0, total - (Math.min(Number(initialPayment) || 0, total))))}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white transition ${
                    loading || !canSubmit
                      ? "bg-[#E75480]/40 cursor-not-allowed"
                      : "bg-[#E75480] hover:bg-[#d04070]"
                  }`}
                >
                  {loading ? "Guardando..." : "Guardar venta"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="w-full rounded-lg py-2 text-sm font-medium text-gray-500 border border-gray-200 bg-white hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
              </div>

            </div>
          </div>

        </div>
      </form>
    </div>
  )
}
