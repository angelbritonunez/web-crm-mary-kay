"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Lock, Sparkles } from "lucide-react"
import UserMenu from "@/components/UserMenu"
import { homeFor } from "@/lib/auth-config"
import { usePlan } from "@/hooks/usePlan"
import type { Role } from "@/types"

const consultorItems = [
  { label: "Dashboard",    href: "/dashboard",  minPlan: "free"  },
  { label: "Clientes",     href: "/clients",    minPlan: "free"  },
  { label: "Ventas",       href: "/sales",      minPlan: "free"  },
  { label: "Seguimientos", href: "/followups",  minPlan: "free"  },
  { label: "Agenda",       href: "/agenda",     minPlan: "pro"   },
  { label: "Métricas",     href: "/metrics",    minPlan: "pro"   },
] as const

const adminItems = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Usuarios",  href: "/operador/users"  },
]

const operadorItems = [
  { label: "Usuarios", href: "/operador/users" },
]

const PLAN_TIER: Record<string, number> = { free: 0, basic: 1, pro: 2 }
const PLAN_BADGE: Record<string, string> = { basic: "Basic", pro: "Pro" }

export default function Navbar({ role = "consultora" }: { role?: Role }) {
  const pathname = usePathname()
  const { plan } = usePlan()

  const items =
    role === "admin"    ? adminItems :
    role === "operador" ? operadorItems :
    consultorItems

  return (
    <div className="bg-white border-b border-gray-100 h-14 flex items-center px-6 justify-between sticky top-0 z-50">

      {/* ── Izquierda: Brand ── */}
      <Link href={homeFor(role)} className="flex items-center gap-2.5 no-underline">
        <div className="bg-[#E75480] rounded-xl w-8 h-8 flex items-center justify-center flex-shrink-0">
          <Sparkles size={16} stroke="white" strokeWidth={2} />
        </div>
        <span className="font-semibold text-gray-900 text-base tracking-tight">
          GlowSuite
        </span>
      </Link>

      {/* ── Centro: Links de navegación ── */}
      <nav className="flex items-center gap-1">
        {items.map((item) => {
          const active   = pathname.startsWith(item.href)
          const minPlan  = "minPlan" in item ? (item as { minPlan: string }).minPlan : "free"
          const locked   = role === "consultora" && PLAN_TIER[plan] < PLAN_TIER[minPlan]
          const badge    = PLAN_BADGE[minPlan] ?? null
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition",
                active  ? "text-[#E75480] bg-[#FFF0F4] font-medium" :
                locked  ? "text-gray-400 hover:text-gray-500 hover:bg-gray-50" :
                          "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              {item.label}
              {locked && badge && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold bg-gray-100 text-gray-400 rounded-full px-1.5 py-0.5 leading-none">
                  <Lock size={8} strokeWidth={2.5} />
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Derecha: Avatar + dropdown ── */}
      <div className="flex items-center gap-2">
        <UserMenu />
      </div>

    </div>
  )
}
