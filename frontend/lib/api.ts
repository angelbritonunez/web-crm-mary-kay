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

// AUTH
export const getMe = async (userId: string): Promise<{ role: string; subscription_plan: string }> => {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { "x-user-id": userId },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const error = new Error(err.detail || "Error obteniendo perfil") as any
    error.status = res.status
    throw error
  }
  return res.json()
}

// CLIENTS
export const createClient = async (data: {
  name: string
  phone: string
  skin_type: string
  status?: string
  email?: string
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

export const updateClient = async (
  clientId: string,
  data: { name: string; phone: string; skin_type: string; status?: string; email?: string; followup_enabled?: boolean }
) => {
  const userId = await getUserId()
  const res = await fetch(`${API_URL}/clients/${clientId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-user-id": userId },
    body: JSON.stringify({ ...data, followup_enabled: data.followup_enabled ?? true }),
  })
  if (!res.ok) throw new Error("Error actualizando cliente")
  return res.json()
}

export const deleteClient = async (clientId: string) => {
  const userId = await getUserId()
  const res = await fetch(`${API_URL}/clients/${clientId}`, {
    method: "DELETE",
    headers: { "x-user-id": userId },
  })
  if (!res.ok) throw new Error("Error eliminando cliente")
  return res.json()
}

// SALES
export const deleteSale = async (saleId: string) => {
  const userId = await getUserId()
  const res = await fetch(`${API_URL}/sales/${saleId}`, {
    method: "DELETE",
    headers: { "x-user-id": userId },
  })
  if (!res.ok) throw new Error("Error eliminando venta")
  return res.json()
}

export const createSale = async (data: {
  client_id: string
  total: number
  discount: number
  payment_type: string
  source_followup_id?: string | null
  notes?: string
  sale_date?: string
  initial_payment?: number
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

// UPDATE FOLLOWUP
export const updateFollowup = async (id: string, data: { mensaje: string }) => {
  const userId = await getUserId()
  const res = await fetch(`${API_URL}/followups/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-user-id": userId },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Error actualizando seguimiento")
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


// PAYMENTS
export const addPayment = async (
  saleId: string,
  data: { amount: number; payment_type: string; payment_date?: string; notes?: string }
) => {
  const userId = await getUserId()
  const res = await fetch(`${API_URL}/sales/${saleId}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": userId },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Error registrando abono")
  return res.json()
}

export const getSalePayments = async (saleId: string) => {
  const userId = await getUserId()
  const res = await fetch(`${API_URL}/sales/${saleId}/payments`, {
    headers: { "x-user-id": userId },
  })
  if (!res.ok) throw new Error("Error obteniendo pagos")
  return res.json()
}

export const getReceivables = async () => {
  const userId = await getUserId()
  const res = await fetch(`${API_URL}/receivables`, {
    headers: { "x-user-id": userId },
  })
  if (!res.ok) throw new Error("Error obteniendo cuentas por cobrar")
  return res.json()
}

// DASHBOARD
export const getDashboard = async () => {
  const userId = await getUserId()
  const res = await fetch(`${API_URL}/dashboard`, {
    headers: { "x-user-id": userId },
  })
  if (!res.ok) throw new Error("Error obteniendo dashboard")
  return res.json()
}

// METRICS
export const getMetrics = async (period: string = "month") => {
  const userId = await getUserId()

  const res = await fetch(`${API_URL}/metrics?period=${period}`, {
    headers: { "x-user-id": userId },
  })

  if (!res.ok) throw new Error("Error obteniendo métricas")
  return res.json()
}

// ADMIN DASHBOARD
export const getAdminDashboard = async () => {
  const userId = await getUserId()
  const res = await fetch(`${API_URL}/admin/dashboard`, {
    headers: { "x-user-id": userId },
  })
  if (!res.ok) throw new Error("Error obteniendo dashboard admin")
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

// PRODUCTS
export const getProducts = async () => {
  const res = await fetch(`${API_URL}/products`)
  if (!res.ok) throw new Error("Error obteniendo productos")
  return res.json()
}