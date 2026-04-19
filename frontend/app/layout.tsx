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
  description: "CRM para consultoras de belleza independientes",
  icons: {
    icon: "/favicon.svg",
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