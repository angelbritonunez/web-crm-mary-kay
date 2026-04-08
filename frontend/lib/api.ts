import { createClient as createSupabaseClient } from "@/lib/supabase"


const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Helper para obtener el usuario autenticado
const getUserId = async () => {
  const supabase = createSupabaseClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Usuario no autenticado")
  }

  return user.id
}

// CLIENTS
export const createClient = async (data: {
  name: string
  phone: string
  skin_type: string
  followup_enabled?: boolean
}) => {
  const userId = await getUserId()

  const res = await fetch(`${API_URL}/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify({
      ...data,
      followup_enabled: data.followup_enabled ?? true,
    }),
  })

  if (!res.ok) throw new Error("Error creando cliente")

  return res.json()
}

// SALES
export const createSale = async (data: {
  client_id: string
  total: number
  discount: number
  payment_type: string
  source_followup_id?: string | null
  items: {
    product_id: string
    quantity: number
    price: number
  }[]
}) => {
  const userId = await getUserId()

  const res = await fetch(`${API_URL}/sales`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    console.error("Error backend:", error)
    throw new Error("Error creando venta")
  }

  return res.json()
}

// FOLLOWUPS
export const getFollowups = async () => {
  const userId = await getUserId()

  const res = await fetch(`${API_URL}/followups`, {
    headers: {
      "x-user-id": userId,
    },
  })

  if (!res.ok) {
    const error = await res.json()
    console.error("Error backend followups:", error)
    throw new Error("Error obteniendo followups")
  }

  return res.json()
}

// COMPLETE FOLLOWUP
export const completeFollowup = async (id: string) => {
  const userId = await getUserId()

  const res = await fetch(`${API_URL}/followups/${id}/complete`, {
    method: "POST",
    headers: {
      "x-user-id": userId,
    },
  })

  if (!res.ok) {
    throw new Error("Error completando followup")
  }

  return res.json()
}


export const getClients = async () => {
  const userId = await getUserId()

  const res = await fetch(`${API_URL}/clients`, {
    headers: {
      "x-user-id": userId,
    },
  })

  if (!res.ok) {
    const error = await res.text()
    console.error("BACKEND ERROR:", error)
    throw new Error("Error obteniendo clientes")
  }

  return res.json()
}