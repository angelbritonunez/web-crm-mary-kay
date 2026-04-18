"use client"

import { Lock, Clock } from "lucide-react"
import type { SubscriptionPlan } from "@/types"

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free:  "Free",
  basic: "Basic",
  pro:   "Pro",
}

const PLAN_COLORS: Record<SubscriptionPlan, string> = {
  free:  "bg-gray-100 text-gray-500",
  basic: "bg-blue-50 text-blue-600",
  pro:   "bg-[#FFF0F4] text-[#E75480]",
}

const WA_MESSAGE_BASIC = "Hola, me gustaría actualizar mi plan GlowSuite a Basic para acceder a más funciones. ¿Cómo procedo?"
const ADMIN_PHONE = "18499259226"

export default function UpgradeBanner({ requiredPlan }: { requiredPlan: Exclude<SubscriptionPlan, "free"> }) {
  if (requiredPlan === "pro") {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FFF0F4] flex items-center justify-center mb-5">
          <Clock size={24} className="text-[#E75480]" />
        </div>

        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Próximamente
        </h2>

        <p className="text-sm text-gray-400 max-w-sm">
          Esta función estará disponible en el plan{" "}
          <span className={`inline-block text-xs font-semibold rounded-full px-2.5 py-0.5 ${PLAN_COLORS.pro}`}>
            Pro
          </span>
          . Estamos trabajando en ello.
        </p>
      </div>
    )
  }

  const waUrl = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(WA_MESSAGE_BASIC)}`

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <Lock size={24} className="text-gray-400" />
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        Función no disponible en tu plan actual
      </h2>

      <p className="text-sm text-gray-400 mb-1 max-w-sm">
        Esta función está disponible a partir del plan{" "}
        <span className={`inline-block text-xs font-semibold rounded-full px-2.5 py-0.5 ${PLAN_COLORS[requiredPlan]}`}>
          {PLAN_LABELS[requiredPlan]}
        </span>
        .
      </p>

      <p className="text-sm text-gray-400 mb-6 max-w-sm">
        Para activarla, contacta a tu administrador.
      </p>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-[#25D366] text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-[#1ebe5d] transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.477 2 2 6.477 2 12c0 1.989.58 3.842 1.583 5.405L2.046 22l4.729-1.518A9.956 9.956 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182a8.18 8.18 0 0 1-4.17-1.14l-.299-.177-3.093.994.957-3.026-.198-.316A8.143 8.143 0 0 1 3.818 12c0-4.511 3.671-8.182 8.182-8.182 4.51 0 8.182 3.671 8.182 8.182 0 4.51-3.671 8.182-8.182 8.182z"/>
        </svg>
        Contactar administrador
      </a>
    </div>
  )
}
