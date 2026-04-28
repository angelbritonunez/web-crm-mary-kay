import type { Role } from "@/types"

export const PUBLIC_ROUTES = ["/", "/login", "/register", "/auth/confirmed", "/auth/update-password", "/terminos", "/privacidad", "/ayuda", "/blog", "/register/pendiente"]

export const ALLOWED_ROUTES: Record<Role, string[]> = {
  consultora: ["/dashboard", "/clients", "/sales", "/metrics", "/followups", "/profile"],
  admin:      ["/admin/dashboard", "/operador/users", "/profile"],
  operador:   ["/operador/users", "/profile"],
}

export const DEFAULT_REDIRECT: Record<Role, string> = {
  consultora: "/dashboard",
  admin:      "/admin/dashboard",
  operador:   "/operador/users",
}

export function isAllowed(role: Role, pathname: string): boolean {
  return (ALLOWED_ROUTES[role] ?? ALLOWED_ROUTES.consultora).some((p) => pathname.startsWith(p))
}

export function homeFor(role: Role): string {
  return DEFAULT_REDIRECT[role] ?? "/dashboard"
}
