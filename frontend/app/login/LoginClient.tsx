"use client"

import { useState, useEffect, Suspense } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowLeft } from "lucide-react"
import AuthCard from "@/components/ui/AuthCard"
import AuthInput from "@/components/ui/AuthInput"
import AuthButton from "@/components/ui/AuthButton"
import { getMe } from "@/lib/api"

function LoginForm() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get("desactivado") === "1") {
      setError("Tu cuenta está desactivada. Comunícate con tu administrador.")
    }
  }, [searchParams])

  const handleForgotPassword = async () => {
    setResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: "https://glowsuitecrm.com/auth/update-password",
    })
    setResetLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setResetSent(true)
    }
  }

  const handleLogin = async () => {
    setLoading(true)
    setError("")

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      try {
        const profile = await getMe(data.session?.access_token, data.user?.id)
        const { role } = profile
        if (role === "admin" || role === "operador") {
          router.push("/operador/users")
        } else {
          router.push("/dashboard")
        }
      } catch (e: any) {
        await supabase.auth.signOut()
        setError(e.status === 403
          ? e.message
          : "No se pudo verificar tu cuenta. Intenta de nuevo."
        )
      }
    }
  }

  if (forgotMode) {
    return (
      <AuthCard
        icon={<Sparkles size={32} color="white" />}
        title="GlowSuite CRM"
        subtitle="Tu negocio, organizado."
        caption="Para vendedoras independientes"
      >
        <div className="w-full max-w-sm mx-auto flex flex-col gap-5">
          <button
            onClick={() => { setForgotMode(false); setResetSent(false); setError("") }}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 w-fit"
          >
            <ArrowLeft size={14} /> Volver
          </button>

          {resetSent ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <Mail size={28} className="text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Revisa tu correo</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Enviamos un link a <strong>{resetEmail}</strong> para restablecer tu contraseña.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">¿Olvidaste tu contraseña?</h2>
                <p className="text-sm text-gray-500 mt-1 mb-6">Te enviamos un link para restablecerla</p>
              </div>

              <AuthInput
                label="Correo electrónico"
                type="email"
                placeholder="ejemplo@correo.com"
                value={resetEmail}
                onChange={setResetEmail}
                leftIcon={<Mail size={16} />}
              />

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <AuthButton onClick={handleForgotPassword} loading={resetLoading}>
                Enviar link
              </AuthButton>
            </>
          )}
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      icon={<Sparkles size={32} color="white" />}
      title="GlowSuite CRM"
      subtitle="Tu negocio, organizado."
      caption="Para vendedoras independientes"
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

        <p
          className="text-sm text-gray-400 hover:underline text-center cursor-pointer"
          onClick={() => { setForgotMode(true); setError(""); setResetEmail(email) }}
        >
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
