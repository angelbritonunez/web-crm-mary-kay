import ClientLayout from "@/components/ClientLayout"
import "./globals.css"

export const metadata = {
  title: "GlowSuite",
  description: "CRM para consultoras de belleza independientes",
}

export default function RootLayout({ children }: any) {
  return (
    <html lang="es">
      <body className="bg-[#F9FAFB] text-gray-900">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}