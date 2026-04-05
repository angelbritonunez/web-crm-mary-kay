"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  })

  // 🔥 NUEVO: estado original
  const [originalForm, setOriginalForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  })

  // 🔹 LOAD USER + PROFILE
  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/login")
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone")
          .eq("id", user.id)
          .maybeSingle()

        if (profileError) {
          console.error("PROFILE ERROR:", profileError)
        }

        if (isMounted) {
          const initialData = {
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            phone: profile?.phone || "",
            email: user.email || "",
          }

          setForm(initialData)
          setOriginalForm(initialData) // 🔥 snapshot
          setLoading(false)
        }
      } catch (err) {
        console.error("LOAD PROFILE ERROR:", err)
        if (isMounted) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [router, supabase])

  // 🔹 HANDLE INPUT
  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // 🔥 NUEVO: detectar cambios
  const isDirty =
    form.first_name.trim() !== originalForm.first_name.trim() ||
    form.last_name.trim() !== originalForm.last_name.trim() ||
    form.phone.trim() !== originalForm.phone.trim()

  // 🔹 VALIDATION
  const validate = () => {
    if (!form.first_name.trim()) return "El nombre es obligatorio"
    if (!form.last_name.trim()) return "El apellido es obligatorio"
    return null
  }

  // 🔹 SAVE
  const handleSave = async () => {
    setError(null)
    setSuccess(false)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone.replace(/\D/g, ""),
        })
        .eq("id", user.id)

      if (error) {
        console.error("UPDATE ERROR:", error)
        setError("Error actualizando el perfil")
        return
      }

      setSuccess(true)

      // 🔥 RESET estado original después de guardar
      setOriginalForm({
        ...form,
      })
    } catch (err) {
      console.error("SAVE ERROR:", err)
      setError("Ocurrió un error inesperado")
    } finally {
      setSaving(false)
    }
  }

  // 🔹 LOADING UI
  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-6">
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
          <div className="mt-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 🔹 UI
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-xl space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Mi perfil
          </h1>
          <p className="text-sm text-gray-500">
            Gestiona tu información personal.
          </p>
        </div>

        {/* CARD */}
        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          {/* Nombre */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => handleChange("first_name", e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E75480]"
            />
          </div>

          {/* Apellido */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Apellido
            </label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E75480]"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E75480]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              disabled
              className="mt-1 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
          </div>

          {/* ERROR */}
          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="text-sm text-green-600">
              Perfil actualizado correctamente
            </div>
          )}

          {/* ACTION */}
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={`w-full rounded-2xl px-4 py-2.5 text-sm font-medium text-white transition 
              ${
                saving || !isDirty
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#E75480] hover:opacity-90"
              }`}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  )
}