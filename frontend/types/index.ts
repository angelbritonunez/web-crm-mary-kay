// ── Auth ──────────────────────────────────────────────────────────────────────

export type Role = "consultora" | "admin" | "operador"

// ── Clients ───────────────────────────────────────────────────────────────────

export type Client = {
  id: string
  name: string
  phone: string
  email?: string | null
  skin_type: string | null
  status: string
  followup_enabled: boolean
  created_at: string
}

export type ClientItem = {
  id: string
  name: string
  phone: string
  skin_type?: string | null
  status: string
}

// ── Sales ─────────────────────────────────────────────────────────────────────

export type SaleItem = {
  quantity: number
  price: number
  product: { name: string } | null
}

export type Sale = {
  id: string
  total: number
  amount_paid: number
  discount: number
  payment_type: string
  status: string
  created_at: string
  sale_date: string | null
  notes: string | null
  sale_items: SaleItem[]
}

export type Payment = {
  id: string
  amount: number
  payment_type: string
  payment_date: string
  notes: string | null
}

export type Receivable = {
  sale_id: string
  client_name: string
  client_phone: string
  total: number
  amount_paid: number
  balance: number
  status: string
  sale_date: string
}

// ── Products ──────────────────────────────────────────────────────────────────

export type Product = {
  id: string
  name: string
  price: number
  category: string
}

export type SelectedProduct = Product & { quantity: number }

// ── Followups ─────────────────────────────────────────────────────────────────

export type FollowupType = "day2" | "week2" | "month2"

/** Used in the client detail page (/clients/[id]) */
export type ClientFollowup = {
  id: string
  type: FollowupType
  scheduled_date: string
  status: string
  mensaje: string | null
}

/** Used in the followups workspace (/followups) */
export type WorkspaceFollowup = {
  id: string
  type: FollowupType
  scheduled_date: string
  client_name: string
  client_status: string
  phone: string
  mensaje: string
  bucket: "overdue" | "today" | "upcoming"
}

/** Used in the dashboard (/dashboard) */
export type DashboardFollowup = {
  id: string
  type: FollowupType
  scheduled_date: string
  status: string
  mensaje: string | null
  client_name: string
  client_phone: string
  client_status: string
  isOverdue: boolean
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export type DashboardData = {
  firstName: string
  followups: DashboardFollowup[]
  clients: ClientItem[]
  vencidos: number
  totalPending: number
  ventas_mes: number
  revenue_mes: number
  profit_mes: number
  convPct: number
  monthly_goal: number | null
  total_owed: number
  receivables_count: number
}

// ── Metrics ───────────────────────────────────────────────────────────────────

export type Period = "week" | "month" | "last_month" | "year"

export type Summary = {
  revenue: number
  revenue_prev: number
  profit: number
  profit_prev: number
  sales_count: number
  sales_count_prev: number
  new_clients: number
  new_clients_prev: number
  conversion_rate: number
  monthly_goal: number | null
}

export type ChartPoint = { date: string; revenue: number }
export type PaymentItem = { type: string; total: number; count: number }
export type ProductItem = { name: string; quantity: number; revenue: number }
export type FollowupStats = { sent: number; pending: number; converted: number; rate: number }
export type ClientPipeline = { prospects: number; customers: number; total: number }
export type SkinItem = { skin_type: string; count: number }

export type MetricsData = {
  summary: Summary
  revenue_chart: ChartPoint[]
  by_payment_type: PaymentItem[]
  top_products: ProductItem[]
  followup_stats: FollowupStats
  client_pipeline: ClientPipeline
  skin_type_dist: SkinItem[]
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export type SubscriptionPlan = "free" | "basic" | "pro"

export type AdminUser = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: Role
  is_active: boolean
  notes: string | null
  created_at: string
  last_sign_in_at: string | null
  days_remaining: number | null
  subscription_plan: SubscriptionPlan
}

// ── Admin Dashboard ────────────────────────────────────────────────────────────

export type AdminDashboardConsultora = {
  id: string
  name: string
  email: string
  is_active: boolean
  subscription_plan: SubscriptionPlan
  sales_count: number
  revenue: number
  total_customers: number
  last_sign_in: string | null
  days_remaining: number | null
}

export type AdminDashboardData = {
  platform: {
    total_users: number
    active: number
    inactive: number
    expiring_soon: { id: string; name: string; days_remaining: number }[]
    plans: { free: number; basic: number; pro: number }
  }
  this_month: {
    sales_count: number
    revenue: number
    new_clients: number
    followups_sent: number
    followups_pending: number
  }
  monthly_trend: { month: string; revenue: number }[]
  consultoras: AdminDashboardConsultora[]
}
