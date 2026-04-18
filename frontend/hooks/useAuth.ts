"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"
import { getMe } from "@/lib/api"
import type { Role } from "@/types"
import { DEFAULT_REDIRECT, isAllowed } from "@/lib/auth-config"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>("consultora")
  const router = useRouter()
  const pathname = usePathname()

  // Keep a ref so onAuthStateChange always reads the current pathname,
  // not the stale value captured when the effect first ran.
  const pathnameRef = useRef(pathname)
  useEffect(() => { pathnameRef.current = pathname }, [pathname])

  useEffect(() => {
    const supabase = createClient()

    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      setUser(session.user)

      let profile: { role: string; subscription_plan: string }
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

      if (!isAllowed(resolvedRole, pathnameRef.current)) {
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
        if (!isAllowed(resolvedRole, pathnameRef.current)) {
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
