import type { MetadataRoute } from "next"

// Keep this in sync with the posts registry in app/blog/posts.ts
const blogSlugs = [
  "como-organizar-clientes-mary-kay",
  "sistema-2-2-2-seguimiento-post-venta",
  "como-llevar-cuentas-negocio-venta-directa",
  "como-saber-quien-te-debe-dinero-belleza",
]

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.glowsuitecrm.com"

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/ayuda`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/terminos`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/privacidad`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]

  const blogRoutes: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${base}/blog/${slug}`,
    lastModified: new Date("2026-04-22"),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...blogRoutes]
}
