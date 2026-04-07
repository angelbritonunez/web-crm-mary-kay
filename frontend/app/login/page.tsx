"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react"
import AuthCard from "@/components/ui/AuthCard"
import AuthInput from "@/components/ui/AuthInput"
import AuthButton from "@/components/ui/AuthButton"

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <AuthCard
      icon={<Sparkles size={32} color="white" />}
      title="GlowSuite"
      subtitle="Tu negocio, organizado."
      caption="Para consultoras independientes"
    >
      <div className="w-full max-w-sm mx-auto flex flex-col gap-5">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Bienvenida de nuevo</h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">Ingresa tus datos para continuar</p>
        </div>

        <AuthInput
          label="Correo electrónico"
          type="email"
          placeholder="ejemplo@correo.com"
          value={email}
          onChange={setEmail}
          leftIcon={<Mail size={16} />}
        />

        <AuthInput
          label="Contraseña"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          leftIcon={<Lock size={16} />}
          rightIcon={
            <span onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </span>
          }
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="cursor-pointer"
          />
          <label htmlFor="rememberMe" className="text-sm text-gray-500 cursor-pointer">
            Recordarme
          </label>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <AuthButton onClick={handleLogin} loading={loading}>
          Iniciar sesión
        </AuthButton>

        <hr className="my-4 border-gray-200" />

        <p className="text-sm text-gray-400 hover:underline text-center cursor-pointer">
          ¿Olvidaste tu contraseña?
        </p>

        <p className="text-sm text-gray-500 text-center">
          ¿No tienes cuenta?{" "}
          <span
            className="cursor-pointer hover:underline font-medium"
            style={{ color: "#E75480" }}
            onClick={() => router.push("/register")}
          >
            Crear cuenta →
          </span>
        </p>
      </div>
    </AuthCard>
  )
}
