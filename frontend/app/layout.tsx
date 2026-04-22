import { Metadata } from "next"
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

export const metadata: Metadata = {
  metadataBase: new URL("https://www.glowsuitecrm.com"),
  title: {
    default: "GlowSuite CRM — CRM para vendedoras independientes en RD",
    template: "%s | GlowSuite CRM",
  },
  description:
    "GlowSuite CRM organiza tus clientes, ventas y seguimientos en un solo lugar. Diseñado para consultoras de belleza en la República Dominicana. Empieza gratis.",
  keywords: [
    "CRM venta directa",
    "CRM consultoras belleza",
    "CRM República Dominicana",
    "app para consultoras Mary Kay",
    "herramienta seguimiento clientes belleza",
    "gestión ventas Yanbal",
    "CRM Avon consultoras",
    "cobros venta directa RD",
    "seguimiento post-venta belleza",
    "GlowSuite CRM",
  ],
  authors: [{ name: "GlowSuite CRM" }],
  creator: "GlowSuite CRM",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "es_DO",
    url: "https://www.glowsuitecrm.com",
    siteName: "GlowSuite CRM",
    title: "GlowSuite CRM — Tu negocio organizado, en un solo lugar",
    description:
      "CRM para consultoras de belleza en República Dominicana. Seguimientos 2+2+2, cobros y gestión de clientes — todo desde un solo lugar.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "GlowSuite CRM — CRM para vendedoras independientes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GlowSuite CRM — Tu negocio organizado",
    description: "CRM para consultoras de belleza en República Dominicana.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: "https://www.glowsuitecrm.com",
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