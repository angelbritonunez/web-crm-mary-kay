import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { posts } from "../posts"
import { articleContent } from "./content"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = posts.find((p) => p.slug === slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    robots: { index: true, follow: true },
    alternates: { canonical: `https://www.glowsuitecrm.com/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
      url: `https://www.glowsuitecrm.com/blog/${post.slug}`,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = posts.find((p) => p.slug === slug)
  if (!post) notFound()

  const content = articleContent[slug]
  if (!content) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: {
      "@type": "Organization",
      name: "GlowSuite CRM",
      url: "https://www.glowsuitecrm.com",
    },
    publisher: {
      "@type": "Organization",
      name: "GlowSuite CRM",
      url: "https://www.glowsuitecrm.com",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-white">
        {/* Breadcrumb */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="max-w-2xl mx-auto text-sm text-gray-400">
            <Link href="/blog" className="hover:text-[#E75480] transition-colors">
              Blog
            </Link>
            {" / "}
            <span className="text-gray-600">{post.category}</span>
          </div>
        </div>

        {/* Article header */}
        <header className="max-w-2xl mx-auto px-4 pt-12 pb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium bg-pink-50 text-[#E75480] px-3 py-1 rounded-full">
              {post.category}
            </span>
            <span className="text-xs text-gray-400">{post.readTime} min de lectura</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-400">
              {new Date(post.publishedAt).toLocaleDateString("es-DO", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">{post.excerpt}</p>
        </header>

        {/* Article body */}
        <article className="max-w-2xl mx-auto px-4 pb-16 prose prose-pink prose-lg">
          {content}
        </article>

        {/* CTA */}
        <section className="bg-pink-50 border-t border-pink-100 py-14 px-4 text-center">
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-3">
            Organiza tu negocio con GlowSuite CRM
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            El sistema 2+2+2, gestión de clientes, ventas y cobros en un solo lugar. Gratis para empezar.
          </p>
          <Link
            href="/register"
            className="inline-block bg-[#E75480] text-white px-8 py-3 rounded-lg font-medium hover:bg-pink-600 transition-colors"
          >
            Empezar gratis
          </Link>
        </section>

        {/* More posts */}
        <section className="max-w-4xl mx-auto px-4 py-14">
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-6">Más artículos</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {posts
              .filter((p) => p.slug !== slug)
              .slice(0, 3)
              .map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group border border-gray-100 rounded-xl p-4 hover:border-pink-200 hover:shadow-sm transition-all"
                >
                  <span className="text-xs font-medium text-[#E75480]">
                    {related.category}
                  </span>
                  <h3 className="mt-1 text-sm font-semibold text-[#1A1A2E] group-hover:text-[#E75480] transition-colors leading-snug">
                    {related.title}
                  </h3>
                </Link>
              ))}
          </div>
        </section>
      </main>
    </>
  )
}
