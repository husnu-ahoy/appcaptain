import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ForumBoard from '@/components/forum/ForumBoard'
import { getForumCategories, getForumThreads } from '@/lib/forumData'

export const metadata: Metadata = {
  title: 'Denizci Forumu — Ahoy',
  description: 'Rotalar, koylar, tekne kiralama ve kaptanlık üzerine sorular ve deneyimler. Ahoy denizci forumu.',
}

const RULES = [
  'Saygılı ve yapıcı bir dil kullan.',
  'Telefon, adres gibi kişisel bilgileri paylaşma.',
  'Ticari paylaşımları ilgili kategoriye ekle.',
  'Yeni konu açmadan önce benzer konulara göz at.',
  'Fotoğraf ve videolarda telif haklarına dikkat et.',
]

export default function ForumPage() {
  const categories = getForumCategories().map(({ id, title, description }) => ({ id, title, description }))
  const threads = getForumThreads()
    .map(({ id, categoryId, categoryLabel, title, excerpt, isPinned, author }) => ({
      id,
      categoryId,
      categoryLabel,
      title,
      excerpt,
      isPinned,
      author: { name: author.name, location: author.location },
    }))
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned))

  return (
    <div className="sh-home sh-fm">
      {/* başlık */}
      <section className="sh-pg-hero" aria-labelledby="fm-title">
        <div className="sh-container sh-pg-hero-grid">
          <div>
            <p className="sh-cb-kicker">Ahoy topluluğu</p>
            <h1 id="fm-title" className="sh-cb-title sh-pg-h1">
              Denizci forumu
              <span>sor, anlat, paylaş.</span>
            </h1>
          </div>
          <p className="sh-pg-sub">
            Gizli koylardan kiralama ipuçlarına, kaptan seçiminden tekne bakımına; denizle ilgili soruların ve
            deneyimlerin buluştuğu yer.
          </p>
        </div>
      </section>

      {/* konular + kategoriler, ardından kurallar */}
      <section className="sh-sect sh-sect--white sh-pg-sect">
        <div className="sh-container">
          <ForumBoard categories={categories} threads={threads} />

          <div className="sh-cb-faq sh-fm-rules">
            <h2>Forum kuralları</h2>
            <ol>
              {RULES.map(rule => (
                <li key={rule}>{rule}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* kapanış */}
      <section className="sh-sect sh-sect--cream sh-cb-end" aria-label="Deniz rehberi">
        <div className="sh-container">
          <p className="sh-cb-end-sub">Sorunun cevabı belki deniz rehberinde.</p>
          <Link href="/blog" className="sh-cb-end-link">
            <span>Rehbere göz at</span>
            <ArrowRight size={52} strokeWidth={1.6} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
