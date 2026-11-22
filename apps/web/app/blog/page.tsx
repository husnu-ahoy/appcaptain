import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import BlogIndex from '@/components/blog/BlogIndex'
import { getBlogCategories, getBlogPosts, isBlogPostPublished } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Deniz Rehberi — Ahoy Blog',
  description: 'Rota tavsiyeleri, kiralama rehberleri, deneyim hikayeleri ve teknik ipuçları. Ahoy\'un deniz rehberi.',
}

export default function BlogPage() {
  const posts = getBlogPosts().map(p => ({ ...p, published: isBlogPostPublished(p.slug) }))
  const featured = posts.find(p => p.featured) ?? posts[0]
  if (!featured) return null
  const rest = posts.filter(p => p.id !== featured.id)

  return (
    <div className="sh-home sh-bl">
      {/* başlık + öne çıkan yazı */}
      <section className="sh-bl-hero" aria-labelledby="bl-title">
        <div className="sh-container">
          <p className="sh-cb-kicker">Ahoy Blog</p>
          <h1 id="bl-title" className="sh-cb-title sh-bl-h1">
            Deniz rehberi
            <span>rotalar, ipuçları, hikâyeler.</span>
          </h1>

          <article className="sh-bl-feature">
            <Link href={featured.href} className="sh-bl-feature-img" tabIndex={-1} aria-hidden="true">
              <Image src={featured.image} alt="" fill priority sizes="(max-width: 860px) 100vw, 720px" />
            </Link>
            <div className="sh-bl-feature-text">
              <p className="sh-bl-meta sh-bl-meta--row">
                <span className="sh-bl-tag">{featured.tag}</span>
                <span>{featured.date}</span>
                <span>{featured.readTime}</span>
              </p>
              <h2 className="sh-bl-feature-title">
                <Link href={featured.href}>{featured.title}</Link>
              </h2>
              <p className="sh-bl-feature-excerpt">{featured.excerpt}</p>
              <Link href={featured.href} className="sh-link-arrow">
                Yazıyı oku <ArrowRight size={18} strokeWidth={1.9} aria-hidden="true" />
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* tüm yazılar */}
      <section className="sh-sect sh-sect--white sh-bl-sect">
        <div className="sh-container">
          <BlogIndex posts={rest} categories={getBlogCategories()} />
        </div>
      </section>

      {/* kapanış */}
      <section className="sh-sect sh-sect--cream sh-cb-end" aria-label="Forum">
        <div className="sh-container">
          <p className="sh-cb-end-sub">Aklında bir soru mu var?</p>
          <Link href="/forum" className="sh-cb-end-link">
            <span>Denizcilere sor</span>
            <ArrowRight size={52} strokeWidth={1.6} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
