import ClientLayout from "@/components/ClientLayout"
import "./globals.css"

export default function RootLayout({ children }: any) {
  return (
    <html lang="en">
      <body className="bg-[#F9FAFB] text-gray-900">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}