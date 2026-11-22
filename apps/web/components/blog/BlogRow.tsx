import Image from 'next/image'
import Link from 'next/link'
import type { BlogPost } from '@/types/content'

/** Blog yazısı satırı: kart yok; solda künye, ortada başlık ve özet, sağda küçük görsel. Satırın tamamı tıklanır. */
export default function BlogRow({ post, published, headingLevel = 'h3' }: { post: BlogPost; published: boolean; headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel
  return (
    <li className="sh-bl-row">
      <div className="sh-bl-meta">
        <span className="sh-bl-tag">{post.tag}</span>
        <span>{post.date}</span>
        <span>{post.readTime}</span>
      </div>
      <div className="sh-bl-main">
        <Heading className="sh-bl-title">
          <Link href={post.href} className="sh-bl-link">
            {post.title}
          </Link>
        </Heading>
        <p className="sh-bl-excerpt">{post.excerpt}</p>
        {!published && <span className="sh-bl-soon">Yakında</span>}
      </div>
      <div className="sh-bl-thumb">
        <Image src={post.image} alt="" fill sizes="(max-width: 860px) 112px, 240px" />
      </div>
    </li>
  )
}
