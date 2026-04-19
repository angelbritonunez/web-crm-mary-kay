import { DM_Sans } from "next/font/google"
import ClientLayout from "@/components/ClientLayout"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-dm-sans",
})

export const metadata = {
  title: "GlowSuite — El CRM para consultoras de belleza",
  description:
    "Elimina el caos de tu consultora. Seguimientos automáticos 2+2+2, cobros pendientes y clientas organizadas — todo en un solo lugar.",
  metadataBase: new URL("https://glowsuite-crm.vercel.app"),
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "GlowSuite — El CRM para consultoras de belleza",
    description:
      "Elimina el caos de tu consultora. Seguimientos automáticos, cobros y clientas — todo en un solo lugar.",
    url: "https://glowsuite-crm.vercel.app",
    siteName: "GlowSuite",
    locale: "es_DO",
    type: "website",
  },
}

export default function RootLayout({ children }: any) {
  return (
    <html lang="es" className={dmSans.variable}>
      <body className="bg-[#F9FAFB] text-gray-900">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}