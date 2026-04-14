"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"
import { getMe } from "@/lib/api"
import type { Role } from "@/types"

const ALLOWED_ROUTES: Record<Role, string[]> = {
  consultora: ["/dashboard", "/clients", "/sales", "/metrics", "/followups", "/profile"],
  admin:      ["/dashboard", "/clients", "/sales", "/metrics", "/followups", "/profile", "/admin"],
  operador:   ["/admin/users", "/profile"],
}

const DEFAULT_REDIRECT: Record<Role, string> = {
  consultora: "/dashboard",
  admin:      "/admin/users",
  operador:   "/admin/users",
}

function isAllowed(role: Role, pathname: string): boolean {
  return (ALLOWED_ROUTES[role] ?? ALLOWED_ROUTES.consultora).some((p) => pathname.startsWith(p))
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>("consultora")
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()

    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      setUser(session.user)

      let profile: { role: string; must_change_password: boolean }
      try {
        profile = await getMe(session.user.id)
      } catch (e: any) {
        // Network error (backend down/cold start): keep the session alive, don't sign out
        if (!e.status) return
        // 403 means account disabled by admin
        await supabase.auth.signOut()
        router.push(e.status === 403 ? "/login?desactivado=1" : "/login")
        return
      }

      const resolvedRole = (profile.role as Role) || "consultora"
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
        const resolvedRole = (profile.role as Role) || "consultora"
        setRole(resolvedRole)
        if (!isAllowed(resolvedRole, pathname)) {
          router.push(DEFAULT_REDIRECT[resolvedRole] ?? "/dashboard")
        }
      } catch (e: any) {
        if (!e.status) return
        await supabase.auth.signOut()
        router.push(e.status === 403 ? "/login?desactivado=1" : "/login")
      }
    })

    return () => { subscription.unsubscribe() }
  }, [])

  return { user, role }
}
