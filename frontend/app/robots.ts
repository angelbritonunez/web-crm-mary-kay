import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/register", "/terminos", "/privacidad", "/ayuda"],
        disallow: [
          "/dashboard",
          "/clients",
          "/sales",
          "/followups",
          "/metrics",
          "/profile",
          "/admin",
          "/operador",
          "/auth/",
        ],
      },
    ],
    sitemap: "https://www.glowsuitecrm.com/sitemap.xml",
  }
}
