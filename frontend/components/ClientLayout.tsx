"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase"
import type { Session } from "@supabase/supabase-js"
import Navbar from "@/components/Navbar"
import { getMe } from "@/lib/api"

const ALLOWED_ROUTES: Record<string, string[]> = {
  consultora: ["/dashboard", "/clients", "/sales", "/metrics", "/followups", "/profile"],
  admin:      ["/dashboard", "/clients", "/sales", "/metrics", "/followups", "/profile", "/admin"],
  operador:   ["/admin/users", "/profile"],
}

const DEFAULT_REDIRECT: Record<string, string> = {
  consultora: "/dashboard",
  admin:      "/admin/users",
  operador:   "/admin/users",
}

function isAllowed(role: string, pathname: string): boolean {
  const allowed = ALLOWED_ROUTES[role] ?? ALLOWED_ROUTES.consultora
  return allowed.some((p) => pathname.startsWith(p))
}

export default function ClientLayout({ children }: any) {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string>("consultora")
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()

    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const user = session.user
      setUser(user)

      let profile: { role: string; must_change_password: boolean }
      try {
        profile = await getMe(user.id)
      } catch (e: any) {
        await supabase.auth.signOut()
        router.push(e.status === 403 ? "/login?desactivado=1" : "/login")
        return
      }

      const resolvedRole = profile.role || "consultora"
      setRole(resolvedRole)

      if (profile.must_change_password) {
        router.push("/profile?mustChange=1")
      } else if (!isAllowed(resolvedRole, pathname)) {
        router.push(DEFAULT_REDIRECT[resolvedRole] ?? "/dashboard")
      }
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      if (!session?.user) {
        setUser(null)
        setRole("consultora")
        return
      }
      setUser(session.user)
      try {
        const profile = await getMe(session.user.id)
        const resolvedRole = profile.role || "consultora"
        setRole(resolvedRole)
        if (!isAllowed(resolvedRole, pathname)) {
          router.push(DEFAULT_REDIRECT[resolvedRole] ?? "/dashboard")
        }
      } catch (e: any) {
        await supabase.auth.signOut()
        router.push(e.status === 403 ? "/login?desactivado=1" : "/login")
      }
    })

    return () => { subscription.unsubscribe() }
  }, [])

  return (
    <>
      {user && <Navbar role={role} />}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </>
  )
}
