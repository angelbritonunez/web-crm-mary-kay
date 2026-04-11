"use client"

// REGISTRO DESHABILITADO TEMPORALMENTE
// El acceso a GlowSuite es por invitación — el admin crea las cuentas desde /admin/users.
// Para rehabilitar el registro público, descomentar todo el código de abajo.

import { useRouter } from "next/navigation"
import { Sparkles, Lock } from "lucide-react"
import AuthCard from "@/components/ui/AuthCard"

export default function RegisterPage() {
  const router = useRouter()

  return (
    <AuthCard
      icon={<Sparkles size={32} color="white" />}
      title="GlowSuite"
      subtitle="Tu negocio, organizado."
      caption="Para consultoras independientes"
    >
      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-5 text-center">
        <div className="w-14 h-14 rounded-full bg-[#FFF0F4] flex items-center justify-center">
          <Lock size={24} className="text-[#E75480]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Acceso por invitación</h2>
          <p className="text-sm text-gray-400 mt-2">
            El registro en GlowSuite es solo por invitación.<br />
            Contacta al administrador para obtener acceso.
          </p>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="text-sm font-medium text-[#E75480] hover:underline"
        >
          ← Volver al inicio de sesión
        </button>
      </div>
    </AuthCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO PÚBLICO — descomentar cuando se habilite
// ─────────────────────────────────────────────────────────────────────────────

// "use client"
//
// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import { createClient } from "@/lib/supabase"
// import { Eye, EyeOff, Sparkles } from "lucide-react"
// import AuthCard from "@/components/ui/AuthCard"
// import AuthInput from "@/components/ui/AuthInput"
// import AuthButton from "@/components/ui/AuthButton"
//
// export default function RegisterPage() {
//   const router = useRouter()
//   const supabase = createClient()
//
//   const [nombre, setNombre] = useState("")
//   const [apellido, setApellido] = useState("")
//   const [email, setEmail] = useState("")
//   const [telefono, setTelefono] = useState("")
//   const [password, setPassword] = useState("")
//   const [confirmPassword, setConfirmPassword] = useState("")
//   const [showPassword, setShowPassword] = useState(false)
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [success, setSuccess] = useState(false)
//   const [error, setError] = useState("")
//
//   const passwordMismatch =
//     password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword
//
//   const handleRegister = async () => {
//     setError("")
//
//     if (!nombre || !apellido || !email || !telefono || !password || !confirmPassword) {
//       setError("Completa todos los campos")
//       return
//     }
//
//     if (password !== confirmPassword) {
//       setError("Las contraseñas no coinciden")
//       return
//     }
//
//     if (password.length < 6) {
//       setError("La contraseña debe tener al menos 6 caracteres")
//       return
//     }
//
//     setLoading(true)
//
//     const { error: signUpError } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: { first_name: nombre, last_name: apellido, phone: telefono },
//       },
//     })
//
//     setLoading(false)
//
//     if (signUpError) {
//       setError(signUpError.message)
//       return
//     }
//
//     setSuccess(true)
//     setTimeout(() => router.push("/login"), 3000)
//   }
//
//   return (
//     <AuthCard
//       icon={<Sparkles size={32} color="white" />}
//       title="GlowSuite"
//       subtitle="Empieza a crecer hoy."
//       caption="Crea tu cuenta gratis"
//     >
//       <div className="w-full max-w-sm mx-auto flex flex-col gap-5">
//         <div>
//           <h2 className="text-2xl font-semibold text-gray-800">Crear cuenta</h2>
//           <p className="text-sm text-gray-500 mt-1 mb-6">Completa tus datos para empezar</p>
//         </div>
//
//         <div className="grid grid-cols-2 gap-4">
//           <AuthInput label="Nombre" type="text" placeholder="Ana" value={nombre} onChange={setNombre} />
//           <AuthInput label="Apellido" type="text" placeholder="García" value={apellido} onChange={setApellido} />
//         </div>
//
//         <AuthInput label="Correo electrónico" type="email" placeholder="ejemplo@correo.com" value={email} onChange={setEmail} />
//         <AuthInput label="Teléfono" type="tel" placeholder="809-000-0000" value={telefono} onChange={setTelefono} />
//
//         <AuthInput
//           label="Contraseña"
//           type={showPassword ? "text" : "password"}
//           placeholder="••••••••"
//           value={password}
//           onChange={setPassword}
//           rightIcon={<span onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</span>}
//         />
//
//         <AuthInput
//           label="Confirmar contraseña"
//           type={showConfirmPassword ? "text" : "password"}
//           placeholder="••••••••"
//           value={confirmPassword}
//           onChange={setConfirmPassword}
//           error={passwordMismatch ? "Las contraseñas no coinciden" : undefined}
//           rightIcon={<span onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</span>}
//         />
//
//         {error && <p className="text-red-500 text-sm text-center">{error}</p>}
//         {success && <p className="text-green-600 text-sm text-center">Revisa tu correo para confirmar tu cuenta</p>}
//
//         <AuthButton onClick={handleRegister} loading={loading} disabled={success}>
//           Crear cuenta
//         </AuthButton>
//
//         <p className="text-sm text-gray-500 text-center">
//           ¿Ya tienes cuenta?{" "}
//           <span className="cursor-pointer hover:underline font-medium" style={{ color: "#E75480" }} onClick={() => router.push("/login")}>
//             Iniciar sesión →
//           </span>
//         </p>
//       </div>
//     </AuthCard>
//   )
// }
