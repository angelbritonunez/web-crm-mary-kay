"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/Navbar"
import { useAuth } from "@/hooks/useAuth"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth()
  const pathname = usePathname()

  if (pathname === "/") {
    return <>{children}</>
  }

  return (
    <>
      {user && <Navbar role={role} />}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </>
  )
}
