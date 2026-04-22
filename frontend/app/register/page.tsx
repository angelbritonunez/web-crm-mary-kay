import { Metadata } from "next"
import RegisterClient from "./RegisterClient"

export const metadata: Metadata = {
  title: "Crear cuenta gratis",
  description:
    "Regístrate en GlowSuite CRM gratis. Sin tarjeta de crédito. Empieza a organizar tu negocio hoy.",
}

export default function RegisterPage() {
  return <RegisterClient />
}
