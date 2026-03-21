import { createClient } from "./supabase"

export async function getUserSession() {
  const supabase = createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  return { user, error }
}