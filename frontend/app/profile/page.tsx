"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

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

function StatusMsg({
  type,
  msg,
}: {
  type: "error" | "success"
  msg: string
}) {
  if (type === "error")
    return (
      <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">
        {msg}
      </div>
    )
  return (
    <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-lg px-4 py-3">
      {msg}
    </div>
  )
}

function SaveButton({
  onClick,
  saving,
  disabled,
  label = "Guardar cambios",
  savingLabel = "Guardando...",
}: {
  onClick: () => void
  saving: boolean
  disabled: boolean
  label?: string
  savingLabel?: string
}) {
  return (
    <div className="flex justify-end pt-1">
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

export default function ProfilePage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState("")

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

  // Business info
  const [businessName, setBusinessName] = useState("")
  const [originalBusiness, setOriginalBusiness] = useState({
    businessName: "",
  })
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [businessStatus, setBusinessStatus] = useState<{
    type: "error" | "success"
    msg: string
  } | null>(null)

  // Password
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "error" | "success"
    msg: string
  } | null>(null)

  // Preferences
  const [followupReminders, setFollowupReminders] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsStatus, setPrefsStatus] = useState<{
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, business_name")
        .eq("id", user.id)
        .maybeSingle()

      const fn = profile?.first_name || ""
      const ln = profile?.last_name || ""
      const ph = profile?.phone ? formatPhoneInput(profile.phone) : ""
      const bn = (profile as any)?.business_name || ""

      setFirstName(fn)
      setLastName(ln)
      setPhone(ph)
      setBusinessName(bn)
      setOriginalInfo({ firstName: fn, lastName: ln, phone: ph })
      setOriginalBusiness({ businessName: bn })
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

  const businessIsDirty =
    businessName.trim() !== originalBusiness.businessName.trim()

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

  const handleSaveBusiness = async () => {
    setSavingBusiness(true)
    setBusinessStatus(null)

    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({ business_name: businessName.trim() || null } as any)
      .eq("id", userId)

    if (error) {
      setBusinessStatus({ type: "error", msg: "No se pudo guardar. Intenta de nuevo." })
    } else {
      setOriginalBusiness({ businessName: businessName.trim() })
      setBusinessStatus({ type: "success", msg: "Información del negocio actualizada." })
      setTimeout(() => setBusinessStatus(null), 3000)
    }
    setSavingBusiness(false)
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
      setTimeout(() => setPasswordStatus(null), 3000)
    }
    setSavingPassword(false)
  }

  const handleSavePrefs = () => {
    setSavingPrefs(true)
    setTimeout(() => {
      setSavingPrefs(false)
      setPrefsStatus({ type: "success", msg: "Preferencias guardadas." })
      setTimeout(() => setPrefsStatus(null), 3000)
    }, 500)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
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
              <span className="rounded-full text-xs font-medium px-2.5 py-0.5 bg-[#FFF0F4] text-[#C0395E]">
                Consultora
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
            {infoStatus && (
              <StatusMsg type={infoStatus.type} msg={infoStatus.msg} />
            )}

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
            />
          </div>
        </div>

        {/* ── Información del negocio ── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-50 px-5 py-4">
            <span className="text-sm font-semibold text-gray-800">
              Información del negocio
            </span>
            <p className="text-xs text-gray-400 mt-0.5">
              Aparece en resúmenes y reportes
            </p>
          </div>
          <div className="px-5 py-5 space-y-4">
            {businessStatus && (
              <StatusMsg type={businessStatus.type} msg={businessStatus.msg} />
            )}
            <div>
              <label className={labelClass}>Nombre del negocio</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej. GlowSuite Beauty"
                className={inputClass}
              />
            </div>
            <SaveButton
              onClick={handleSaveBusiness}
              saving={savingBusiness}
              disabled={!businessIsDirty}
            />
          </div>
        </div>

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
            {passwordStatus && (
              <StatusMsg type={passwordStatus.type} msg={passwordStatus.msg} />
            )}

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
            />
          </div>
        </div>

        {/* ── Preferencias ── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-50 px-5 py-4">
            <span className="text-sm font-semibold text-gray-800">
              Preferencias de la app
            </span>
            <p className="text-xs text-gray-400 mt-0.5">
              Notificaciones y comportamiento por defecto
            </p>
          </div>
          <div className="px-5 py-5 space-y-4">
            {prefsStatus && (
              <StatusMsg type={prefsStatus.type} msg={prefsStatus.msg} />
            )}

            <div
              onClick={() => setFollowupReminders((v) => !v)}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 cursor-pointer transition ${
                followupReminders
                  ? "border-[#E75480] bg-[#FFF0F4]"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div
                className={`mt-0.5 w-9 h-5 rounded-full flex items-center flex-shrink-0 transition-colors ${
                  followupReminders ? "bg-[#E75480]" : "bg-gray-200"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                    followupReminders ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    followupReminders ? "text-[#C0395E]" : "text-gray-600"
                  }`}
                >
                  Recordatorios de seguimiento
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Muestra alertas de seguimientos vencidos al entrar al
                  dashboard.
                </p>
              </div>
            </div>

            <SaveButton
              onClick={handleSavePrefs}
              saving={savingPrefs}
              disabled={false}
              label="Guardar preferencias"
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
