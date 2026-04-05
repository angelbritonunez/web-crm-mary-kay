"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [firstName, setFirstNombre] = useState("")
  const [lastName, setLastNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [empresa, setEmpresa] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10)

    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  const handlePhoneChange = (value: string) => {
    setTelefono(formatPhone(value))
  }

  const handleRegister = async () => {
    if (!firstName || !lastName || !telefono || !empresa || !email || !password || !confirmPassword)  {
      alert("Completa todos los campos")
      return
    }

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden")
      return
    }

    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)

    try {
      //CREAR USUARIO
const { error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    data: {
      first_name: firstName,
      last_name: lastName,
      phone: telefono,
      empresa: empresa,
    }
  }
})

if (signUpError) {
  alert(signUpError.message)
  setLoading(false)
  return
}

      //ACTUALIZAR PROFILE 
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    data: {
      first_name: firstName,
      last_name: lastName,
      phone: telefono,
      empresa: empresa,
    }
  }
})

      alert("Cuenta creada correctamente. Verifica tu correo.")
      router.push("/login")

    } catch (err) {
      alert("Ocurrió un error al crear la cuenta")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
      <div className="w-full max-w-[480px] rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">

        {/* LOGO */}
        <div className="flex justify-center mb-4">
          <div className="text-[36px] text-[#E75480]">◈</div>
        </div>

        {/* TITLE */}
        <h1 className="text-center text-[26px] font-semibold text-gray-900 mb-6">
          Crear cuenta
        </h1>

        <div className="border-t mb-6" />

        <div className="space-y-4">

          <input
            type="text"
            placeholder="Nombre"
            value={firstName}
            onChange={(e) => setFirstNombre(e.target.value)}
            className="w-full h-[50px] rounded-xl border px-4 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />

           <input
            type="text"
            placeholder="Apellido"
            value={lastName}
            onChange={(e) => setLastNombre(e.target.value)}
            className="w-full h-[50px] rounded-xl border px-4 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />

          <input
            type="text"
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className="w-full h-[50px] rounded-xl border px-4 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />

          <select
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="w-full h-[50px] rounded-xl border px-4 focus:outline-none focus:ring-2 focus:ring-pink-200"
          >
            <option value="">Selecciona una empresa</option>
            <option value="Mary Kay">Mary Kay</option>
          </select>

          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-[50px] rounded-xl border px-4 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-[50px] rounded-xl border px-4 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />

          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full h-[50px] rounded-xl border px-4 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full h-[50px] bg-[#E75480] text-white rounded-xl font-medium hover:opacity-90 transition"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </div>

        <div className="mt-6 text-center">
          <span
            onClick={() => router.push("/login")}
            className="cursor-pointer text-[#E75480] font-medium"
          >
            Ya tengo cuenta
          </span>
        </div>
      </div>
    </div>
  )
}