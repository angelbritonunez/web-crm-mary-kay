const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// 🔥 TEMPORAL MVP (luego esto vendrá de auth)
const USER_ID = "0134935d-be82-4cc1-ae75-c6b010db0bc6"

// 🔹 CLIENTS
export const createClient = async (data: {
  name: string
  phone: string
  skin_type: string
}) => {
  const res = await fetch(`${API_URL}/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": USER_ID, // 🔥 NUEVO
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) throw new Error("Error creando cliente")

  return res.json()
}

// 🔹 SALES
export const createSale = async (data: {
  client_id: string
  total: number
  discount: number
  payment_type: string
  items: {
    product_id: string
    quantity: number
    price: number
  }[]
}) => {
  const res = await fetch(`${API_URL}/sales`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": USER_ID, // 🔥 FIX AQUÍ
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

// 🔹 GET CLIENTS
export const getClients = async () => {
  const res = await fetch(`${API_URL}/test-db`, {
    headers: {
      "x-user-id": USER_ID, // opcional pero consistente
    },
  })

  if (!res.ok) throw new Error("Error obteniendo clientes")

  return res.json()
}