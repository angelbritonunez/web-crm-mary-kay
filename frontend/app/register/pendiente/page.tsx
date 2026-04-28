import { MailCheck } from "lucide-react"
import AuthCard from "@/components/ui/AuthCard"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Revisa tu correo — GlowSuite CRM",
  robots: { index: false, follow: false },
}

export default function PendientePage() {
  return (
    <AuthCard
      subtitle="Ya casi estás lista."
      caption="Un paso más"
    >
      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-5 text-center py-4">
        <div className="w-16 h-16 rounded-full bg-[#FFF0F4] flex items-center justify-center">
          <MailCheck size={30} className="text-[#E75480]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Revisa tu correo</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Te enviamos un enlace de confirmación. Ábrelo para activar tu cuenta y comenzar a usar GlowSuite CRM.
          </p>
        </div>
        <p className="text-xs text-gray-400">
          ¿No lo ves? Revisa la carpeta de spam o correo no deseado.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium hover:underline"
          style={{ color: "#E75480" }}
        >
          Volver al inicio de sesión →
        </Link>
      </div>
    </AuthCard>
  )
}
