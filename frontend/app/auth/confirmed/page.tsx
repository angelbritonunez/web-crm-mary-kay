"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { CheckCircle } from "lucide-react"
import AuthCard from "@/components/ui/AuthCard"

export default function ConfirmedPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Supabase auto-crea una sesión desde el hash fragment del email de verificación.
    // La cerramos y redirigimos al login para que la consultora ingrese sus credenciales.
    supabase.auth.signOut().then(() => {
      router.push("/login")
    })
  }, [supabase, router])

  return (
    <AuthCard
      subtitle="Tu negocio, organizado."
      caption="Para vendedoras independientes"
    >
      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-5 text-center py-4">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle size={28} className="text-green-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">¡Correo confirmado!</h2>
          <p className="text-sm text-gray-500 mt-2">
            Tu cuenta está activa. Redirigiendo al inicio de sesión…
          </p>
        </div>
      </div>
    </AuthCard>
  )
}
