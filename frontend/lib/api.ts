import { createClient as createSupabaseClient } from "@/lib/supabase"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const getAuthHeaders = async (json = false, token?: string, userId?: string): Promise<Record<string, string>> => {
  let accessToken = token
  let uid = userId

  if (!accessToken || !uid) {
    const supabase = createSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error("Usuario no autenticado")
    accessToken = session.access_token
    uid = session.user.id
  }

  return {
    "x-user-id": uid!,
    "Authorization": `Bearer ${accessToken!}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
  }
}

// AUTH
export const getMe = async (token?: string, userId?: string): Promise<{ role: string; subscription_plan: string }> => {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: await getAuthHeaders(false, token, userId),
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
  const res = await fetch(`${API_URL}/clients`, {
    method: "POST",
    headers: await getAuthHeaders(true),
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
  const res = await fetch(`${API_URL}/clients/${clientId}`, {
    method: "PATCH",
    headers: await getAuthHeaders(true),
    body: JSON.stringify({ ...data, followup_enabled: data.followup_enabled ?? true }),
  })
  if (!res.ok) throw new Error("Error actualizando cliente")
  return res.json()
}

export const deleteClient = async (clientId: string) => {
  const res = await fetch(`${API_URL}/clients/${clientId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Error eliminando cliente")
  return res.json()
}

// SALES
export const deleteSale = async (saleId: string) => {
  const res = await fetch(`${API_URL}/sales/${saleId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
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
  const res = await fetch(`${API_URL}/sales`, {
    method: "POST",
    headers: await getAuthHeaders(true),
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
  const res = await fetch(`${API_URL}/followups`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) {
    const error = await res.json()
    console.error("Error backend followups:", error)
    throw new Error("Error obteniendo followups")
  }
  return res.json()
}

export const updateFollowup = async (id: string, data: { mensaje: string }) => {
  const res = await fetch(`${API_URL}/followups/${id}`, {
    method: "PATCH",
    headers: await getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Error actualizando seguimiento")
  return res.json()
}

export const completeFollowup = async (id: string) => {
  const res = await fetch(`${API_URL}/followups/${id}/complete`, {
    method: "POST",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Error completando followup")
  return res.json()
}

// PAYMENTS
export const addPayment = async (
  saleId: string,
  data: { amount: number; payment_type: string; payment_date?: string; notes?: string }
) => {
  const res = await fetch(`${API_URL}/sales/${saleId}/payments`, {
    method: "POST",
    headers: await getAuthHeaders(true),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Error registrando abono")
  return res.json()
}

export const getSalePayments = async (saleId: string) => {
  const res = await fetch(`${API_URL}/sales/${saleId}/payments`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Error obteniendo pagos")
  return res.json()
}

export const getReceivables = async () => {
  const res = await fetch(`${API_URL}/receivables`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Error obteniendo cuentas por cobrar")
  return res.json()
}

// DASHBOARD
export const getDashboard = async () => {
  const res = await fetch(`${API_URL}/dashboard`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Error obteniendo dashboard")
  return res.json()
}

// METRICS
export const getMetrics = async (period: string = "month") => {
  const res = await fetch(`${API_URL}/metrics?period=${period}`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Error obteniendo métricas")
  return res.json()
}

// ADMIN DASHBOARD
export const getAdminDashboard = async () => {
  const res = await fetch(`${API_URL}/admin/dashboard`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Error obteniendo dashboard admin")
  return res.json()
}

export const getClients = async () => {
  const res = await fetch(`${API_URL}/clients`, {
    headers: await getAuthHeaders(),
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
