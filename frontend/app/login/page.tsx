import { Metadata } from "next"
import LoginClient from "./LoginClient"

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu cuenta de GlowSuite CRM.",
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return <LoginClient />
}
