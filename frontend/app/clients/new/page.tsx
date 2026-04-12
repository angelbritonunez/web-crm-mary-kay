"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/api"

const SKIN_TYPES = [
  "Seca",
  "Grasa",
  "Mixta",
  "Normal",
  "Sensible piel grasa",
  "Sensible piel seca",
  "Envejecimiento moderado",
  "Envejecimiento avanzado",
]

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10)
  const p1 = digits.slice(0, 3)
  const p2 = digits.slice(3, 6)
  const p3 = digits.slice(6, 10)
  if (digits.length <= 3) return p1
  if (digits.length <= 6) return `(${p1}) ${p2}`
  return `(${p1}) ${p2}-${p3}`
}

const inputClass =
  "w-full border border-gray-200 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E75480] focus:border-transparent transition"

const labelClass = "block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide"

export default function NewClientPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState("prospect")
  const [skinType, setSkinType] = useState("")
  const [followupEnabled, setFollowupEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skinTypeError, setSkinTypeError] = useState(false)

  const isFormValid = name.trim() && phone.trim() && skinType

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!skinType) {
      setSkinTypeError(true)
      return
    }

    setSkinTypeError(false)
    setLoading(true)
    setError(null)

    try {
      const data = await createClient({
        name: name.trim(),
        phone: phone.replace(/\D/g, ""),
        email: email.trim() || undefined,
        skin_type: skinType,
        status,
        followup_enabled: followupEnabled,
      })

      const client = Array.isArray(data) ? data[0] : data
      router.push(`/clients/${client.id}`)
    } catch (err: any) {
      console.error(err)
      setError("No se pudo guardar el cliente. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Nuevo cliente
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Completa los datos para registrar un nuevo contacto.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/clients")}
          className="text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition"
        >
          ← Volver
        </button>
      </div>

      {/* ── Form card ── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">

        <form onSubmit={handleSubmit}>

          {/* Scrollable body */}
          <div className="px-6 py-5 space-y-5 max-h-[calc(100vh-16rem)] overflow-y-auto">

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* ── Row 1: Nombre + Teléfono ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Nombre <span className="text-[#E75480] normal-case tracking-normal">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. María García"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Teléfono <span className="text-[#E75480] normal-case tracking-normal">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="(000) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>

            {/* ── Row 2: Email + Estado ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Estado</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={inputClass}
                >
                  <option value="prospect">Prospecto — no ha comprado</option>
                  <option value="customer">Cliente — ya compró</option>
                </select>
              </div>
            </div>

            {/* ── Row 3: Tipo de piel ── */}
            <div>
              <label className={labelClass}>
                Tipo de piel <span className="text-[#E75480] normal-case tracking-normal">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SKIN_TYPES.map((type) => {
                  const active = skinType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSkinType(type)
                        setSkinTypeError(false)
                      }}
                      className={`rounded-full text-xs font-medium px-3 py-1.5 border transition ${
                        active
                          ? "bg-[#E75480] text-white border-[#E75480]"
                          : "bg-white text-gray-500 border-gray-200 hover:border-[#E75480] hover:text-[#E75480]"
                      }`}
                    >
                      {type}
                    </button>
                  )
                })}
              </div>
              {skinTypeError && (
                <p className="text-xs text-red-500 mt-2">
                  Selecciona un tipo de piel.
                </p>
              )}
            </div>

            {/* ── Row 4: Seguimiento automático ── */}
            <div
              className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 cursor-pointer transition ${
                followupEnabled
                  ? "border-[#E75480] bg-[#FFF0F4]"
                  : "border-gray-200 bg-gray-50"
              }`}
              onClick={() => setFollowupEnabled((v) => !v)}
            >
              {/* Custom toggle */}
              <div
                className={`mt-0.5 w-9 h-5 rounded-full flex items-center flex-shrink-0 transition-colors ${
                  followupEnabled ? "bg-[#E75480]" : "bg-gray-200"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                    followupEnabled ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    followupEnabled ? "text-[#C0395E]" : "text-gray-600"
                  }`}
                >
                  Seguimiento automático 2+2+2
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Se enviarán recordatorios a los 2 días, 2 semanas y 2 meses después de cada venta.
                </p>
              </div>
            </div>

          </div>

          {/* ── Sticky footer with actions ── */}
          <div className="border-t border-gray-50 px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/clients")}
              className="bg-white border border-gray-200 text-gray-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`rounded-lg px-5 py-2 text-sm font-semibold text-white transition ${
                loading || !isFormValid
                  ? "bg-[#E75480]/40 cursor-not-allowed"
                  : "bg-[#E75480] hover:bg-[#d04070]"
              }`}
            >
              {loading ? "Guardando..." : "Guardar cliente"}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
