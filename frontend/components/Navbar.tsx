"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles } from "lucide-react"
import UserMenu from "@/components/UserMenu"

const navItems = [
  { label: "Dashboard",     href: "/dashboard" },
  { label: "Clientes",      href: "/clients" },
  { label: "Ventas",        href: "/sales" },
  { label: "Seguimientos",  href: "/followups" },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <div className="bg-white border-b border-gray-100 h-14 flex items-center px-6 justify-between sticky top-0 z-50">

      {/* ── Izquierda: Brand ── */}
      <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
        <div className="bg-[#E75480] rounded-xl w-8 h-8 flex items-center justify-center flex-shrink-0">
          <Sparkles size={16} stroke="white" strokeWidth={2} />
        </div>
        <span className="font-semibold text-gray-900 text-base tracking-tight">
          GlowSuite
        </span>
      </Link>

      {/* ── Centro: Links de navegación ── */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "text-[#E75480] bg-[#FFF0F4] font-medium rounded-lg px-3 py-1.5 text-sm transition"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-1.5 text-sm transition"
              }
            >
              {item.label}
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
