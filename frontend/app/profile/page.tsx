"use client"

import { useEffect, useState, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { usePlan } from "@/hooks/usePlan"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10)
  const p1 = digits.slice(0, 3)
  const p2 = digits.slice(3, 6)
  const p3 = digits.slice(6, 10)
  if (digits.length <= 3) return p1
  if (digits.length <= 6) return `(${p1}) ${p2}`
  return `(${p1}) ${p2}-${p3}`
}

const inputClass =
  "w-full border border-gray-200 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E75480] focus:border-transparent transition"

const inputDisabledClass =
  "w-full border border-gray-100 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed"

const labelClass =
  "block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide"

// ── Sub-components ────────────────────────────────────────────────────────────


function SaveButton({
  onClick,
  saving,
  disabled,
  label = "Guardar cambios",
  savingLabel = "Guardando...",
  status,
}: {
  onClick: () => void
  saving: boolean
  disabled: boolean
  label?: string
  savingLabel?: string
  status?: { type: "error" | "success"; msg: string } | null
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-1">
      {status && (
        <span className={`text-xs font-medium ${status.type === "error" ? "text-red-500" : "text-green-600"}`}>
          {status.msg}
        </span>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={saving || disabled}
        className={`rounded-lg px-5 py-2 text-sm font-semibold text-white transition ${
          saving || disabled
            ? "bg-[#E75480]/40 cursor-not-allowed"
            : "bg-[#E75480] hover:bg-[#d04070]"
        }`}
      >
        {saving ? savingLabel : label}
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

function ProfileContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const mustChange   = searchParams.get("mustChange") === "1"
  const { can } = usePlan()

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [role, setRole] = useState<string>("consultora")

  // Personal info
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [originalInfo, setOriginalInfo] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  })
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoStatus, setInfoStatus] = useState<{
    type: "error" | "success"
    msg: string
  } | null>(null)

  // Meta mensual
  const [monthlyGoal, setMonthlyGoal] = useState<string>("")
  const [originalGoal, setOriginalGoal] = useState<string>("")
  const [savingGoal, setSavingGoal] = useState(false)
  const [goalStatus, setGoalStatus] = useState<{ type: "error" | "success"; msg: string } | null>(null)

  // Password
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "error" | "success"
    msg: string
  } | null>(null)

  // Danger zone
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push("/login")
        return
      }

      setUserId(user.id)
      setEmail(user.email || "")

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, monthly_goal, role")
        .eq("id", user.id)
        .maybeSingle()

      if (profileError) console.error("Error cargando perfil:", profileError)

      const fn = profile?.first_name || ""
      const ln = profile?.last_name || ""
      const ph = profile?.phone ? formatPhoneInput(profile.phone) : ""
      const goal = profile?.monthly_goal ? String(profile.monthly_goal) : ""

      setFirstName(fn)
      setLastName(ln)
      setPhone(ph)
      setOriginalInfo({ firstName: fn, lastName: ln, phone: ph })
      setMonthlyGoal(goal)
      setOriginalGoal(goal)
      setRole(profile?.role || "consultora")
      setLoading(false)
    }

    init()
  }, [router])

  // Derived
  const initials = firstName
    ? `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ""}`.toUpperCase()
    : email.charAt(0).toUpperCase() || "U"

  const displayName =
    firstName || lastName ? `${firstName} ${lastName}`.trim() : email

  const infoIsDirty =
    firstName.trim() !== originalInfo.firstName.trim() ||
    lastName.trim() !== originalInfo.lastName.trim() ||
    phone.trim() !== originalInfo.phone.trim()

  const passwordReady =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSaveInfo = async () => {
    if (!firstName.trim()) {
      setInfoStatus({ type: "error", msg: "El nombre es obligatorio." })
      return
    }
    setSavingInfo(true)
    setInfoStatus(null)

    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.replace(/\D/g, ""),
      })
      .eq("id", userId)

    if (error) {
      setInfoStatus({ type: "error", msg: "No se pudo guardar. Intenta de nuevo." })
    } else {
      setOriginalInfo({ firstName: firstName.trim(), lastName: lastName.trim(), phone })
      setInfoStatus({ type: "success", msg: "Información personal actualizada." })
      setTimeout(() => setInfoStatus(null), 3000)
    }
    setSavingInfo(false)
  }

  const handleSaveGoal = async () => {
    setSavingGoal(true)
    setGoalStatus(null)
    const supabase = createClient()
    const goalValue = monthlyGoal.trim() === "" ? null : Number(monthlyGoal)
    if (goalValue !== null && (isNaN(goalValue) || goalValue < 0)) {
      setGoalStatus({ type: "error", msg: "Ingresa un monto válido en pesos." })
      setSavingGoal(false)
      return
    }
    const { error } = await supabase
      .from("profiles")
      .update({ monthly_goal: goalValue })
      .eq("id", userId)
    if (error) {
      setGoalStatus({ type: "error", msg: "No se pudo guardar. Intenta de nuevo." })
    } else {
      setOriginalGoal(monthlyGoal)
      setGoalStatus({ type: "success", msg: "Meta mensual actualizada." })
      setTimeout(() => setGoalStatus(null), 3000)
    }
    setSavingGoal(false)
  }

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ type: "error", msg: "Completa todos los campos." })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", msg: "La nueva contraseña no coincide." })
      return
    }
    if (newPassword.length < 6) {
      setPasswordStatus({
        type: "error",
        msg: "La contraseña debe tener al menos 6 caracteres.",
      })
      return
    }

    setSavingPassword(true)
    setPasswordStatus(null)

    const supabase = createClient()

    // Verify current password via re-authentication
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    })

    if (signInError) {
      setPasswordStatus({ type: "error", msg: "La contraseña actual es incorrecta." })
      setSavingPassword(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setPasswordStatus({ type: "error", msg: "No se pudo actualizar la contraseña." })
    } else {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordStatus({ type: "success", msg: "Contraseña actualizada correctamente." })
      // Clear must_change_password flag if this was a forced change
      if (mustChange) {
        const supabase2 = createClient()
        await supabase2.from("profiles").update({ must_change_password: false }).eq("id", userId)
        const dest = role === "admin" ? "/admin/dashboard" : role === "operador" ? "/operador/users" : "/dashboard"
        setTimeout(() => router.push(dest), 1500)
      } else {
        setTimeout(() => setPasswordStatus(null), 3000)
      }
    }
    setSavingPassword(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut({ scope: "local" })
    router.push("/login")
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-gray-100 rounded w-40" />
              <div className="h-3 bg-gray-100 rounded w-52" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Banner cambio de contraseña obligatorio ── */}
      {mustChange && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-amber-500 text-lg leading-none mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Debes cambiar tu contraseña</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Por seguridad, cambia la contraseña temporal antes de continuar. Ve a la sección <strong>Seguridad</strong> más abajo.
            </p>
          </div>
        </div>
      )}

      {/* ── Profile header ── */}
      <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#E75480] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-semibold leading-none">
              {initials}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              {displayName}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{email}</p>
            <div className="mt-1.5">
              <span className="rounded-full text-xs font-medium px-2.5 py-0.5 bg-[#FFF0F4] text-[#C0395E] capitalize">
                {role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="space-y-4 max-h-[calc(100vh-14rem)] overflow-y-auto pb-2">

        {/* ── Información personal ── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-50 px-5 py-4">
            <span className="text-sm font-semibold text-gray-800">
              Información personal
            </span>
            <p className="text-xs text-gray-400 mt-0.5">
              Nombre, teléfono y correo electrónico
            </p>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Nombre{" "}
                  <span className="text-[#E75480] normal-case tracking-normal">
                    *
                  </span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ej. María"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Apellido</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ej. García"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Teléfono</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                  placeholder="(000) 000-0000"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className={inputDisabledClass}
                />
                <p className="text-[11px] text-gray-300 mt-1">
                  El email no se puede cambiar aquí.
                </p>
              </div>
            </div>

            <SaveButton
              onClick={handleSaveInfo}
              saving={savingInfo}
              disabled={!infoIsDirty}
              status={infoStatus}
            />
          </div>
        </div>

        {/* ── Metas de negocio (consultoras Basic+) ── */}
        {role !== "admin" && role !== "operador" && can("basic") && <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-50 px-5 py-4">
            <span className="text-sm font-semibold text-gray-800">Metas de negocio</span>
            <p className="text-xs text-gray-400 mt-0.5">
              Define tu objetivo mensual de ingresos
            </p>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div>
              <label className={labelClass}>Meta mensual (DOP)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                  RD$
                </span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={monthlyGoal}
                  onChange={(e) => setMonthlyGoal(e.target.value)}
                  placeholder="Ej. 25000"
                  className="w-full border border-gray-200 rounded-lg bg-gray-50 pl-10 pr-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E75480] focus:border-transparent transition"
                />
              </div>
              <p className="text-[11px] text-gray-300 mt-1.5">
                Visible en tu dashboard y página de métricas como progreso mensual.
              </p>
            </div>
            <SaveButton
              onClick={handleSaveGoal}
              saving={savingGoal}
              disabled={monthlyGoal === originalGoal}
              label="Guardar meta"
              savingLabel="Guardando..."
              status={goalStatus}
            />
          </div>
        </div>}

        {/* ── Seguridad ── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-50 px-5 py-4">
            <span className="text-sm font-semibold text-gray-800">
              Seguridad
            </span>
            <p className="text-xs text-gray-400 mt-0.5">
              Cambia tu contraseña de acceso
            </p>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div>
              <label className={labelClass}>Contraseña actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
            </div>

            <SaveButton
              onClick={handleSavePassword}
              saving={savingPassword}
              disabled={!passwordReady}
              label="Actualizar contraseña"
              savingLabel="Actualizando..."
              status={passwordStatus}
            />
          </div>
        </div>

        {/* ── Sesión y cuenta ── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-50 px-5 py-4">
            <span className="text-sm font-semibold text-gray-800">
              Sesión y cuenta
            </span>
          </div>
          <div className="px-5 py-5 space-y-4">

            {/* Logout */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Cerrar sesión
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Cierra tu sesión en este dispositivo.
                </p>
              </div>
              {confirmLogout ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="bg-red-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-red-600 transition disabled:opacity-50"
                  >
                    {loggingOut ? "Saliendo..." : "Confirmar"}
                  </button>
                  <button
                    onClick={() => setConfirmLogout(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmLogout(true)}
                  className="shrink-0 bg-white border border-gray-200 text-gray-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cerrar sesión
                </button>
              )}
            </div>

            <div className="border-t border-gray-50" />

            {/* Delete account */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Eliminar cuenta
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Esta acción es permanente e irreversible.
                </p>
              </div>
              {confirmDelete ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-red-400">¿Estás segura?</span>
                  <button className="bg-red-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-red-600 transition">
                    Eliminar
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="shrink-0 bg-white border border-red-200 text-red-400 rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-50 hover:text-red-500 transition"
                >
                  Eliminar cuenta
                </button>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileContent />
    </Suspense>
  )
}
