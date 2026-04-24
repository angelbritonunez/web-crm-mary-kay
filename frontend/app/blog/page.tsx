import type { Metadata } from "next"
import Link from "next/link"
import { posts } from "./posts"

export const metadata: Metadata = {
  title: "Blog — Consejos para consultoras de venta directa",
  description:
    "Aprende a organizar tu negocio de venta directa: clientes, ventas, cobros y seguimientos. Consejos prácticos para consultoras de Mary Kay, Yanbal, Avon y más en RD.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.glowsuitecrm.com/blog" },
}

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-pink-50 to-white border-b border-pink-100 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-medium text-[#E75480] uppercase tracking-widest mb-3">
            Blog
          </p>
          <h1 className="text-4xl font-bold text-[#1A1A2E] mb-4">
            Recursos para consultoras de venta directa
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Guías prácticas para organizar tu negocio, gestionar clientes y
            vender más con el sistema 2+2+2.
          </p>
        </div>
      </section>

      {/* Post grid */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group border border-gray-100 rounded-2xl p-6 hover:border-pink-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium bg-pink-50 text-[#E75480] px-3 py-1 rounded-full">
                  {post.category}
                </span>
                <span className="text-xs text-gray-400">{post.readTime} min de lectura</span>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A2E] mb-2 group-hover:text-[#E75480] transition-colors">
                {post.title}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                {post.excerpt}
              </p>
              <p className="mt-4 text-sm font-medium text-[#E75480]">
                Leer artículo →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
