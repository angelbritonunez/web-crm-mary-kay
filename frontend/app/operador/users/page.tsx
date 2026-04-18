"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Users, UserCheck, UserX, Plus, RefreshCw, MessageCircle, ToggleLeft, ToggleRight, X } from "lucide-react"

import type { Role, AdminUser, SubscriptionPlan } from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10)
  const p1 = digits.slice(0, 3)
  const p2 = digits.slice(3, 6)
  const p3 = digits.slice(6, 10)
  if (digits.length <= 3) return p1
  if (digits.length <= 6) return `(${p1}) ${p2}`
  return `(${p1}) ${p2}-${p3}`
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" })
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "Nunca"
  return new Date(iso).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function displayName(u: AdminUser): string {
  const full = [u.first_name, u.last_name].filter(Boolean).join(" ")
  return full || u.email
}

const ROLE_LABELS: Record<Role, string> = {
  consultora: "Consultora",
  admin: "Admin",
  operador: "Operador",
}

function MembershipBadge({ days, isActive }: { days: number | null; isActive: boolean }) {
  if (days === null) return <span className="text-gray-300">—</span>
  if (!isActive) return <span className="text-xs text-gray-400 italic">Inactiva</span>
  if (days === 0) return (
    <span className="inline-flex items-center gap-1 bg-red-50 text-red-500 text-xs font-semibold rounded-full px-2.5 py-0.5">
      Vencida
    </span>
  )
  if (days <= 5) return (
    <span className="inline-flex items-center gap-1 bg-red-50 text-red-500 text-xs font-semibold rounded-full px-2.5 py-0.5">
      {days}d
    </span>
  )
  if (days <= 10) return (
    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-500 text-xs font-semibold rounded-full px-2.5 py-0.5">
      {days}d
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full px-2.5 py-0.5">
      {days}d
    </span>
  )
}

const ROLE_STYLES: Record<Role, string> = {
  consultora: "bg-pink-50 text-pink-600",
  admin:      "bg-purple-50 text-purple-600",
  operador:   "bg-blue-50 text-blue-600",
}

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free:  "Free",
  basic: "Basic",
  pro:   "Pro",
}

const PLAN_STYLES: Record<SubscriptionPlan, string> = {
  free:  "bg-gray-100 text-gray-500",
  basic: "bg-blue-50 text-blue-600",
  pro:   "bg-[#FFF0F4] text-[#E75480]",
}


// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-[#FFF0F4] flex items-center justify-center flex-shrink-0 text-[#E75480]">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ── Create user modal ──────────────────────────────────────────────────────────

function CreateUserModal({
  userId,
  callerRole,
  onClose,
  onCreated,
}: {
  userId: string
  callerRole: Role
  onClose: () => void
  onCreated: (email: string, password: string, phone: string, firstName: string) => void
}) {
  const [email, setEmail]         = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName]   = useState("")
  const [phone, setPhone]         = useState("")
  const [role, setRole]           = useState<Role>("consultora")
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Operador can only create consultoras
  const availableRoles: Role[] = callerRole === "admin"
    ? ["consultora", "operador", "admin"]
    : ["consultora"]

  const handleCreate = async () => {
    if (!email.trim() || !firstName.trim()) {
      setError("Email y nombre son obligatorios.")
      return
    }
    if (!phone.trim()) {
      setError("El teléfono es obligatorio para enviar las credenciales por WhatsApp.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.replace(/\D/g, ""),
          role,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Error creando usuario")
      onCreated(data.email, data.temp_password, phone.replace(/\D/g, ""), firstName.trim())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E75480] focus:border-transparent transition"
  const labelClass = "block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-md mx-4 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <span className="font-semibold text-gray-900 text-sm">Nuevo usuario</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          {/* Rol */}
          <div>
            <label className={labelClass}>
              Rol <span className="text-[#E75480] normal-case">*</span>
            </label>
            <div className="flex gap-2">
              {availableRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                    role === r
                      ? "bg-[#E75480] text-white border-[#E75480]"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>
              Email <span className="text-[#E75480] normal-case">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              className={inputClass}
            />
          </div>

          {/* Nombre / Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                Nombre <span className="text-[#E75480] normal-case">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="María"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Apellido</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="García"
                className={inputClass}
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className={labelClass}>
              Teléfono (WhatsApp) <span className="text-[#E75480] normal-case">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              placeholder="(809) 000-0000"
              className={inputClass}
            />
            <p className="text-[11px] text-gray-300 mt-1">10 dígitos. Se usará para enviar las credenciales por WhatsApp.</p>
          </div>

          <p className="text-xs text-gray-400">Se generará una contraseña temporal automáticamente.</p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition">
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="bg-[#E75480] text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-[#d04070] disabled:opacity-50 transition"
          >
            {saving ? "Creando..." : "Crear usuario"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Credentials modal ──────────────────────────────────────────────────────────

function CredentialsModal({ email, password, phone, firstName, onClose }: {
  email: string; password: string; phone: string; firstName: string; onClose: () => void
}) {
  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login"
  const waMessage = [
    `¡Hola, ${firstName}! Te damos la bienvenida a GlowSuite 💄`,
    ``,
    `Tus credenciales de acceso son:`,
    `📧 Email: ${email}`,
    `🔑 Contraseña temporal: ${password}`,
    ``,
    `🔗 Ingresa aquí: ${loginUrl}`,
  ].join("\n")
  const waMessageEncoded = encodeURIComponent(waMessage)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-sm mx-4 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <span className="font-semibold text-gray-900 text-sm">Usuario creado</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3">
            <p className="text-sm font-medium text-green-700 mb-2">Credenciales temporales</p>
            <p className="text-xs text-green-600">Email: <span className="font-mono font-semibold">{email}</span></p>
            <p className="text-xs text-green-600 mt-1">Contraseña: <span className="font-mono font-semibold">{password}</span></p>
          </div>
          <p className="text-xs text-gray-400">El usuario podrá cambiar su contraseña desde su perfil.</p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition">
            Cerrar
          </button>
          <a
            href={`https://wa.me/${phone}?text=${waMessageEncoded}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-green-600 transition"
          >
            <MessageCircle size={15} />
            Enviar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function OperadorUsersPage() {
  const router = useRouter()
  const [userId, setUserId]         = useState<string | null>(null)
  const [callerRole, setCallerRole] = useState<Role>("consultora")
  const [users, setUsers]           = useState<AdminUser[]>([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [credentials, setCredentials] = useState<{ email: string; password: string; phone: string; firstName: string } | null>(null)
  const [search, setSearch]           = useState("")
  const [filterPlan, setFilterPlan]     = useState<"all" | SubscriptionPlan>("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [filterRole, setFilterRole]     = useState<"all" | Role>("all")
  const [togglingId, setTogglingId]     = useState<string | null>(null)
  const [changingPlanId, setChangingPlanId] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<{ id: string; value: string } | null>(null)
  const [resetResult, setResetResult]     = useState<{ id: string; password: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null) // user_id

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()

      // getSession reads from local storage — reliable on first render
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push("/login"); return }

      const user = session.user

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      const role: Role = profile?.role ?? "consultora"
      if (role !== "admin" && role !== "operador") { router.push("/dashboard"); return }

      setUserId(user.id)
      setCallerRole(role)
      await fetchUsers(user.id)
    }
    init()
  }, [router])

  const fetchUsers = async (uid: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/users`, { headers: { "x-user-id": uid } })
      const data = await res.json()
      setUsers(data.data || [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const handleChangePlan = async (u: AdminUser, plan: SubscriptionPlan) => {
    if (!userId || plan === u.subscription_plan) return
    setChangingPlanId(u.id)
    await fetch(`${API_URL}/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ subscription_plan: plan }),
    })
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, subscription_plan: plan } : x))
    setChangingPlanId(null)
  }

  const handleToggleActive = async (u: AdminUser) => {
    if (!userId) return
    setTogglingId(u.id)
    await fetch(`${API_URL}/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ is_active: !u.is_active }),
    })
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_active: !u.is_active } : x))
    setTogglingId(null)
  }

  const handleSaveNotes = async () => {
    if (!userId || !editingNotes) return
    await fetch(`${API_URL}/admin/users/${editingNotes.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ notes: editingNotes.value }),
    })
    setUsers((prev) => prev.map((u) => u.id === editingNotes.id ? { ...u, notes: editingNotes.value } : u))
    setEditingNotes(null)
  }

  const handleResetPassword = async (uid: string) => {
    if (!userId) return
    const res = await fetch(`${API_URL}/admin/users/${uid}/reset-password`, {
      method: "POST",
      headers: { "x-user-id": userId },
    })
    const data = await res.json()
    if (data.temp_password) setResetResult({ id: uid, password: data.temp_password })
  }

  const handleDeleteUser = async (uid: string) => {
    if (!userId) return
    await fetch(`${API_URL}/admin/users/${uid}`, {
      method: "DELETE",
      headers: { "x-user-id": userId },
    })
    setUsers((prev) => prev.filter((u) => u.id !== uid))
    setConfirmDelete(null)
  }

  const handleUserCreated = (email: string, password: string, phone: string, firstName: string) => {
    setShowCreate(false)
    setCredentials({ email, password, phone, firstName })
    if (userId) fetchUsers(userId)
  }

  const total    = users.length
  const activos  = users.filter((u) => u.is_active).length
  const inactivos = users.filter((u) => !u.is_active).length

  const hasActiveFilters = search.trim() || filterPlan !== "all" || filterStatus !== "all" || filterRole !== "all"

  const filteredUsers = users.filter((u) => {
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchesSearch =
        (u.first_name || "").toLowerCase().includes(q) ||
        (u.last_name  || "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      if (!matchesSearch) return false
    }
    if (filterPlan !== "all" && u.subscription_plan !== filterPlan) return false
    if (filterStatus === "active"   && !u.is_active) return false
    if (filterStatus === "inactive" && u.is_active)  return false
    if (filterRole !== "all" && u.role !== filterRole) return false
    return true
  })

  const clearFilters = () => {
    setSearch("")
    setFilterPlan("all")
    setFilterStatus("all")
    setFilterRole("all")
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl border border-gray-100 px-5 py-4 animate-pulse h-20" />)}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Gestión de usuarios</h1>
          <p className="text-sm text-gray-400 mt-0.5">Administra el acceso y la información de cada usuario</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => userId && fetchUsers(userId)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition"
          >
            <RefreshCw size={14} />
            Actualizar
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-[#E75480] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#d04070] transition"
          >
            <Plus size={15} />
            Nuevo usuario
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Total registrados" value={total}    icon={<Users size={18} />} />
        <KpiCard label="Activos"           value={activos}  icon={<UserCheck size={18} />} />
        <KpiCard label="Inactivos"         value={inactivos} icon={<UserX size={18} />} />
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-50 px-5 py-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-800 mr-1">Usuarios</span>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-52 border border-gray-200 rounded-lg bg-gray-50 pl-8 pr-3 py-1.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E75480] focus:border-transparent transition"
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>

          {/* Plan filter */}
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value as "all" | SubscriptionPlan)}
            className="border border-gray-200 rounded-lg bg-gray-50 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#E75480] focus:border-transparent transition cursor-pointer"
          >
            <option value="all">Plan: Todos</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
            className="border border-gray-200 rounded-lg bg-gray-50 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#E75480] focus:border-transparent transition cursor-pointer"
          >
            <option value="all">Estado: Todos</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>

          {/* Role filter — only visible to admin */}
          {callerRole === "admin" && (
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as "all" | Role)}
              className="border border-gray-200 rounded-lg bg-gray-50 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#E75480] focus:border-transparent transition cursor-pointer"
            >
              <option value="all">Rol: Todos</option>
              <option value="consultora">Consultora</option>
              <option value="operador">Operador</option>
              <option value="admin">Admin</option>
            </select>
          )}

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition"
            >
              <X size={12} />
              Limpiar
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Usuario</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Rol</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Plan</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Membresía</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Último acceso</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Desde</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Notas</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                    {hasActiveFilters ? "No hay usuarios que coincidan con los filtros aplicados." : "No hay usuarios registrados."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition">
                    {/* Nombre / email */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E75480] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-semibold">
                            {(u.first_name || u.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 leading-tight">{displayName(u)}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Rol */}
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${ROLE_STYLES[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    {/* Plan */}
                    <td className="px-4 py-3 text-center">
                      {u.role === "consultora" ? (
                        <select
                          value={u.subscription_plan}
                          disabled={changingPlanId === u.id}
                          onChange={(e) => handleChangePlan(u, e.target.value as SubscriptionPlan)}
                          className="text-xs font-semibold rounded-full px-2.5 py-0.5 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E75480] disabled:opacity-50 transition"
                          style={{ backgroundColor: u.subscription_plan === "pro" ? "#FFF0F4" : u.subscription_plan === "basic" ? "#EFF6FF" : "#F3F4F6",
                                   color: u.subscription_plan === "pro" ? "#E75480" : u.subscription_plan === "basic" ? "#2563EB" : "#6B7280" }}
                        >
                          <option value="free">Free</option>
                          <option value="basic">Basic</option>
                          <option value="pro">Pro</option>
                        </select>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {/* Membresía */}
                    <td className="px-4 py-3 text-center">
                      <MembershipBadge days={u.days_remaining} isActive={u.is_active} />
                    </td>
                    {/* Fechas */}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(u.last_sign_in_at)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(u.created_at)}</td>
                    {/* Toggle activo — no se puede desactivar al propio admin */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={togglingId === u.id || u.role === "admin"}
                        title={u.role === "admin" ? "No se puede desactivar un admin" : undefined}
                        className="disabled:opacity-40 transition"
                      >
                        {u.is_active
                          ? <ToggleRight size={24} className="text-[#E75480]" />
                          : <ToggleLeft size={24} className="text-gray-300" />}
                      </button>
                    </td>
                    {/* Notas */}
                    <td className="px-4 py-3 max-w-[160px]">
                      {editingNotes?.id === u.id ? (
                        <input
                          autoFocus
                          value={editingNotes.value}
                          onChange={(e) => setEditingNotes({ id: u.id, value: e.target.value })}
                          onBlur={handleSaveNotes}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveNotes()}
                          className="text-xs border border-[#E75480] rounded px-2 py-1 w-full focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingNotes({ id: u.id, value: u.notes || "" })}
                          className="text-xs text-gray-400 hover:text-gray-700 truncate max-full text-left transition"
                          title={u.notes || "Agregar nota"}
                        >
                          {u.notes || <span className="italic text-gray-300">Agregar nota</span>}
                        </button>
                      )}
                    </td>
                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {resetResult?.id === u.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono text-green-600 bg-green-50 rounded px-2 py-0.5">
                              {resetResult.password}
                            </span>
                            <button onClick={() => setResetResult(null)} className="text-gray-300 hover:text-gray-500">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleResetPassword(u.id)}
                            className="text-xs text-gray-400 hover:text-[#E75480] border border-gray-200 rounded-lg px-2.5 py-1 hover:border-[#E75480] transition"
                          >
                            Reset contraseña
                          </button>
                        )}
                        {callerRole === "admin" && u.role !== "admin" && (
                          confirmDelete === u.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="text-xs bg-red-500 text-white rounded-lg px-2.5 py-1 hover:bg-red-600 transition"
                              >
                                Confirmar
                              </button>
                              <button onClick={() => setConfirmDelete(null)} className="text-gray-300 hover:text-gray-500">
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(u.id)}
                              className="text-xs text-red-400 hover:text-red-600 border border-red-200 rounded-lg px-2.5 py-1 hover:border-red-400 transition"
                            >
                              Eliminar
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ── */}
      {showCreate && userId && (
        <CreateUserModal
          userId={userId}
          callerRole={callerRole}
          onClose={() => setShowCreate(false)}
          onCreated={handleUserCreated}
        />
      )}

      {credentials && (
        <CredentialsModal
          email={credentials.email}
          password={credentials.password}
          phone={credentials.phone}
          firstName={credentials.firstName}
          onClose={() => setCredentials(null)}
        />
      )}
    </div>
  )
}
