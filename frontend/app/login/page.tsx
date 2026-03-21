"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      
      <div className="bg-white p-10 rounded-2xl shadow-lg border w-full max-w-lg">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="text-pink-400 text-3xl">🌸</div>
        </div>

        {/* Title */}
        <h2 className="text-center text-3xl font-semibold text-gray-700 mb-8">
          Iniciar sesión
        </h2>

        {/* Email */}
        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-2">
            Correo electrónico
          </label>
          <input
            type="email"
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>

        {/* Password */}
        <div className="mb-6 relative">
          <label className="block text-sm text-gray-600 mb-2">
            Contraseña
          </label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />

          <div
            className="absolute right-4 top-[44px] cursor-pointer text-gray-400"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-pink-400 hover:bg-pink-500 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
        >
          {loading ? "Cargando..." : "Entrar"}
        </button>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200"></div>

        {/* Links */}
        <div className="text-center text-sm">
          <p className="text-gray-500 hover:underline cursor-pointer">
            ¿Olvidaste tu contraseña?
          </p>

          <p
            className="mt-2 text-gray-600 hover:underline cursor-pointer"
            onClick={() => router.push("/register")}
          >
            Crear cuenta
          </p>
        </div>
      </div>
    </div>
  )
}