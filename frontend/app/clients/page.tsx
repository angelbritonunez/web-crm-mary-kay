"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

export default function NewClient() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState("")
  const [status, setStatus] = useState("prospect") // ✅ FIX
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [skinType, setSkinType] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skinTypeError, setSkinTypeError] = useState(false)

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10)

    const part1 = digits.slice(0, 3)
    const part2 = digits.slice(3, 6)
    const part3 = digits.slice(6, 10)

    if (digits.length <= 3) return part1
    if (digits.length <= 6) return `(${part1}) ${part2}`

    return `(${part1}) ${part2}-${part3}`
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    // 🚨 VALIDACIÓN
    if (!skinType) {
      setSkinTypeError(true)
      return
    }

    setSkinTypeError(false)
    setLoading(true)
    setError(null)

    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push("/login")
        return
      }

      const cleanPhone = phone.replace(/\D/g, "")

      const { data, error } = await supabase
        .from("clients")
        .insert([
          {
            name,
            phone: cleanPhone,
            email: email || null,
            skin_type: skinType,
            status, // ✅ ya siempre tiene valor válido
            user_id: userData.user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      router.push(`/clients/${data.id}`)

    } catch (err: any) {
      console.error(err)
      setError("Error creando el cliente")
    } finally {
      setLoading(false)
    }
  }

  // ✅ status ya no es problema → no lo incluimos
  const isFormValid = name && phone && skinType

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6">
          Nuevo cliente
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Nombre */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Nombre</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
          />
        </div>

        {/* Teléfono */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Teléfono</label>
          <input
            type="text"
            required
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            placeholder="(000) 000-0000"
            className="w-full border px-3 py-2 rounded-lg"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Email (opcional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
          />
        </div>

        {/* Status cliente */}
        <div className="mb-4">
          <label className="block text-sm mb-1">
            Estado del cliente
          </label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg bg-white"
          >
            <option value="prospect">No ha comprado</option>
            <option value="customer">Ya compró</option>
            <option value="later">Más adelante</option>
          </select>
        </div>

        {/* Tipo de piel */}
        <div className="mb-6">
          <label className="block text-sm mb-1">
            Tipo de piel <span className="text-pink-500">*</span>
          </label>

          <select
            value={skinType}
            onChange={(e) => {
              setSkinType(e.target.value)
              if (e.target.value) setSkinTypeError(false)
            }}
            className={`w-full border px-3 py-2 rounded-lg ${
              skinTypeError ? "border-red-500" : ""
            }`}
          >
            <option value="">Seleccionar</option>
            <option value="Seca">Seca</option>
            <option value="Grasa">Grasa</option>
            <option value="Mixta">Mixta</option>
            <option value="Normal">Normal</option>
            <option value="Sensible piel grasa">Sensible piel grasa</option>
            <option value="Sensible piel seca">Sensible piel seca</option>
            <option value="Envejecimiento moderado">Envejecimiento moderado</option>
            <option value="Envejecimiento avanzado">Envejecimiento avanzado</option>
          </select>

          {skinTypeError && (
            <p className="text-sm text-red-500 mt-1">
              Debes seleccionar un tipo de piel
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className={`flex-1 py-2 rounded-lg text-white ${
              loading || !isFormValid
                ? "bg-pink-300 cursor-not-allowed"
                : "bg-pink-500"
            }`}
          >
            {loading ? "Guardando..." : "Guardar cliente"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex-1 border border-gray-300 py-2 rounded-lg"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}