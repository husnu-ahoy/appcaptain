import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import ArticleProgress from '@/components/blog/ArticleProgress'
import TableOfContents from '@/components/blog/TableOfContents'
import ArticleShare from '@/components/blog/ArticleShare'
import BlogRow from '@/components/blog/BlogRow'
import { getBlogPostBySlug, getBlogPosts, isBlogPostPublished } from '@/lib/data'
import type { BlogPostFull, BlogSection } from '@/types/content'

export async function generateStaticParams() {
  return getBlogPosts().map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) return { title: 'Yazı bulunamadı — Ahoy Blog' }
  return {
    title: `${post.title} — Ahoy Blog`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, images: [post.image] },
  }
}

const headingId = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9ğüşıöç ]/gi, '').replace(/\s+/g, '-')

/** İçerik blokları: kartsız, okumaya odaklı. Not kutularındaki emoji ikonları gösterilmez. */
function renderSection(section: BlogSection, idx: number) {
  switch (section.type) {
    case 'heading': {
      const Tag = `h${section.level}` as 'h2' | 'h3'
      return (
        <Tag key={idx} id={headingId(section.text)}>
          {section.text}
        </Tag>
      )
    }
    case 'paragraph':
      return <div key={idx} dangerouslySetInnerHTML={{ __html: section.html }} />
    case 'quote':
      return (
        <blockquote key={idx} className="sh-prose-quote">
          <p>{section.text}</p>
          {section.attribution && <cite>{section.attribution}</cite>}
        </blockquote>
      )
    case 'callout':
      return (
        <aside key={idx} className="sh-prose-note">
          <b>{section.title}</b>
          <p>{section.body}</p>
        </aside>
      )
    case 'image':
      return (
        <figure key={idx}>
          <div className="sh-prose-img">
            <Image src={section.src} alt={section.alt} fill sizes="(max-width: 860px) 100vw, 720px" />
          </div>
          {section.caption && <figcaption>{section.caption}</figcaption>}
        </figure>
      )
    case 'list':
      return (
        <ul key={idx}>
          {section.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
    case 'divider':
      return <hr key={idx} />
    default:
      return null
  }
}

function extractToc(content: BlogSection[]) {
  let num = 0
  const result: { id: string; text: string; num: number }[] = []
  for (const s of content) {
    if (s.type === 'heading' && s.level === 2) {
      num++
      result.push({ id: headingId(s.text), text: s.text.replace(/^\d+\.\s*/, ''), num })
    }
  }
  return result
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post: BlogPostFull | null = getBlogPostBySlug(slug)
  if (!post) notFound()

  const published = isBlogPostPublished(post.slug)
  const allPosts = getBlogPosts()
  const related = post.relatedSlugs.map(s => allPosts.find(p => p.slug === s)).filter(Boolean) as typeof allPosts
  const toc = extractToc(post.content)

  return (
    <div className="sh-home sh-ar">
      <ArticleProgress />

      {/* başlık */}
      <header className="sh-ar-head">
        <div className="sh-container">
          <nav className="sh-crumbs" aria-label="Sayfa yolu">
            <Link href="/">Ana sayfa</Link>
            <span aria-hidden="true">/</span>
            <Link href="/blog">Blog</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{post.tag}</span>
          </nav>
          <div className="sh-ar-headtext">
            <p className="sh-bl-meta sh-bl-meta--row">
              <span className="sh-bl-tag">{post.tag}</span>
              <span>{post.readTime}</span>
              {!published && <span className="sh-bl-soon">Yakında</span>}
            </p>
            <h1 className="sh-ar-title">{post.title}</h1>
            <p className="sh-ar-lede">{post.excerpt}</p>
            <p className="sh-ar-byline">
              <b>{post.author.name}</b>
              <span>{post.author.title}</span>
              <span>{post.date}</span>
            </p>
          </div>
          <div className="sh-ar-cover">
            <Image src={post.image} alt={post.title} fill priority sizes="(max-width: 1320px) 100vw, 1280px" />
          </div>
        </div>
      </header>

      {/* yazı */}
      <section className="sh-sect sh-sect--white sh-ar-sect">
        <div className={`sh-container sh-ar-grid${toc.length ? '' : ' sh-ar-grid--solo'}`}>
          {toc.length > 0 && (
            <div className="sh-ar-side">
              <TableOfContents items={toc} />
            </div>
          )}
          <article className="sh-ar-body">
            <div className="sh-prose">{post.content.map((section, idx) => renderSection(section, idx))}</div>

            <footer className="sh-ar-end">
              <p className="sh-ar-tags">{post.tags.join(' · ')}</p>
              <ArticleShare title={post.title} />
              <p className="sh-ar-author">
                Yazan <b>{post.author.name}</b>, {post.author.title}
              </p>
            </footer>
          </article>
        </div>
      </section>

      {/* okumaya devam et */}
      {related.length > 0 && (
        <section className="sh-sect sh-sect--cream sh-ar-more" aria-labelledby="ar-more">
          <div className="sh-container">
            <div className="sh-ar-more-head">
              <h2 id="ar-more" className="sh-ar-more-title">
                Okumaya devam et
              </h2>
              <Link href="/blog" className="sh-link-arrow">
                Tüm yazılar <ArrowRight size={18} strokeWidth={1.9} aria-hidden="true" />
              </Link>
            </div>
            <ul className="sh-bl-list">
              {related.map(p => (
                <BlogRow key={p.id} post={p} published={isBlogPostPublished(p.slug)} />
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
