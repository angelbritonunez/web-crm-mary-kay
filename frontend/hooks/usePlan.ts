"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import type { SubscriptionPlan } from "@/types"

export function usePlan() {
  const [plan, setPlan] = useState<SubscriptionPlan>("free")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }

      const { data } = await supabase
        .from("profiles")
        .select("subscription_plan")
        .eq("id", session.user.id)
        .single()

      if (data?.subscription_plan) {
        setPlan(data.subscription_plan as SubscriptionPlan)
      }
      setLoading(false)
    }

    fetch()
  }, [])

  const can = (requiredPlan: SubscriptionPlan): boolean => {
    const tiers: SubscriptionPlan[] = ["free", "basic", "pro"]
    return tiers.indexOf(plan) >= tiers.indexOf(requiredPlan)
  }

  return { plan, loading, can }
}
