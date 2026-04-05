"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const menuRef = useRef<HTMLDivElement>(null)

 const [initial, setInitial] = useState("?")

  // ✅ CERRAR AL HACER CLICK FUERA
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
  const loadUserInitial = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .single()

    if (profile?.first_name) {
      setInitial(profile.first_name.charAt(0).toUpperCase())
    } else if (user.email) {
      setInitial(user.email.charAt(0).toUpperCase())
    }
  }

  loadUserInitial()
}, [])

  const handleLogout = async () => {
    setLoading(true)

    await supabase.auth.signOut()

    setLoading(false)
    setOpen(false) // ✅ cerrar dropdown

    router.push("/login")
  }

  return (
    <div className="relative" ref={menuRef}>

      {/* AVATAR */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 border px-3 py-1.5 rounded-full hover:shadow-sm transition bg-white"
      >
        <div className="w-8 h-8 rounded-full bg-[#E75480] text-white flex items-center justify-center text-sm font-semibold">
          {initial}
        </div>
        <ChevronDown size={16} className="text-gray-500" />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white border rounded-xl shadow-lg p-2 z-50 animate-in fade-in zoom-in-95">

          <Link
            href="/profile"
            onClick={() => setOpen(false)} // ✅ cerrar al navegar
            className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-sm transition"
          >
            Mi perfil
          </Link>

          <div className="border-t my-2" />

          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-500 disabled:opacity-50 transition"
          >
            {loading ? "Cerrando..." : "Cerrar sesión"}
          </button>

        </div>
      )}
    </div>
  )
}