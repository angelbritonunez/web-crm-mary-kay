"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import UserMenu from "@/components/UserMenu"

export default function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Clientes", href: "/clients" },
  ]

  return (
    <div className="w-full border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* LOGO */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <span className="text-[#E75480] text-xl">✦</span>
          <span className="font-semibold text-gray-900 group-hover:text-[#E75480] transition">
            Mary Kay
          </span>
        </Link>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-6">

          {/* NAV */}
          <div className="flex gap-6">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm transition ${
                    active
                      ? "text-[#E75480] font-medium"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* AVATAR */}
          <UserMenu />

        </div>
      </div>
    </div>
  )
}