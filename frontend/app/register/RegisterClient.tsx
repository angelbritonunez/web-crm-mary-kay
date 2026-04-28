"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Eye, EyeOff, Sparkles } from "lucide-react"
import AuthCard from "@/components/ui/AuthCard"
import AuthInput from "@/components/ui/AuthInput"
import AuthButton from "@/components/ui/AuthButton"

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [empresa, setEmpresa] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const passwordMismatch =
    password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword

  const handleTelefonoChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10)
    let formatted = digits
    if (digits.length > 6) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    } else if (digits.length > 3) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    } else if (digits.length > 0) {
      formatted = `(${digits}`
    }
    setTelefono(formatted)
  }

  const handleRegister = async () => {
    setError("")

    if (!nombre || !apellido || !email || !telefono || !empresa || !password || !confirmPassword) {
      setError("Completa todos los campos")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: nombre, last_name: apellido, full_name: `${nombre} ${apellido}`, phone: telefono, company: empresa },
        emailRedirectTo: `${window.location.origin}/auth/confirmed`,
      },
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push("/login"), 4000)
  }

  return (
    <AuthCard
      subtitle="Empieza a crecer hoy."
      caption="Crea tu cuenta gratis"
    >
      <div className="w-full max-w-sm mx-auto flex flex-col gap-5">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Crear cuenta</h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">Completa tus datos para empezar</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[#FFF0F4] flex items-center justify-center">
              <Sparkles size={24} className="text-[#E75480]" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">¡Cuenta creada!</p>
              <p className="text-sm text-gray-500 mt-1">
                Revisa tu correo para confirmar tu cuenta.<br />
                Te redirigimos al inicio de sesión…
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AuthInput label="Nombre" type="text" placeholder="Ana" value={nombre} onChange={setNombre} />
              <AuthInput label="Apellido" type="text" placeholder="García" value={apellido} onChange={setApellido} />
            </div>

            <AuthInput label="Correo electrónico" type="email" placeholder="ejemplo@correo.com" value={email} onChange={setEmail} />
            <AuthInput label="Teléfono" type="tel" placeholder="(809) 555-1234" value={telefono} onChange={handleTelefonoChange} />

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">Empresa</label>
              <select
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#E75480] text-sm text-gray-700"
              >
                <option value="">Selecciona tu empresa</option>
                <option value="Mary Kay">Mary Kay</option>
                <option value="Avon">Avon</option>
                <option value="Amway">Amway</option>
                <option value="Yanbal">Yanbal</option>
              </select>
            </div>

            <AuthInput
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              rightIcon={
                <span onClick={() => setShowPassword(!showPassword)} className="cursor-pointer">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </span>
              }
            />

            <AuthInput
              label="Confirmar contraseña"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={passwordMismatch ? "Las contraseñas no coinciden" : undefined}
              rightIcon={
                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="cursor-pointer">
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </span>
              }
            />

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <AuthButton onClick={handleRegister} loading={loading}>
              Crear cuenta
            </AuthButton>

            <p className="text-sm text-gray-500 text-center">
              ¿Ya tienes cuenta?{" "}
              <span
                className="cursor-pointer hover:underline font-medium"
                style={{ color: "#E75480" }}
                onClick={() => router.push("/login")}
              >
                Iniciar sesión →
              </span>
            </p>
          </>
        )}
      </div>
    </AuthCard>
  )
}
