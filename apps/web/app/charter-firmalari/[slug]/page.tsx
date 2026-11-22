import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Check, MapPin } from 'lucide-react'
import { FIRMS, getFirmBySlug } from '../data'
import FirmMark from '../FirmMark'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return FIRMS.map(firm => ({ slug: firm.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const firm = getFirmBySlug(slug)
  if (!firm) {
    return { title: 'Charter firması bulunamadı — Ahoy' }
  }
  return {
    title: `${firm.name} — Charter firması | Ahoy`,
    description: `${firm.name} (${firm.city}, ${firm.countryLabel}) için rotaları, filo bilgilerini ve kampanyaları incele.`,
  }
}

const SECTIONS = [
  { id: 'genel', label: 'Genel bilgiler' },
  { id: 'rotalar', label: 'Rotalar' },
  { id: 'kampanyalar', label: 'Kampanyalar' },
  { id: 'filo', label: 'Filo' },
]

export default async function CharterFirmDetailPage({ params }: Props) {
  const { slug } = await params
  const firm = getFirmBySlug(slug)
  if (!firm) notFound()

  // Ahoy'daki tekneler Türkiye'de: oradaki firmalar şehir filtresine, diğerleri genel aramaya yönlenir
  const boatsHref = (city: string) =>
    firm.countryId === 'tr' ? `/tekne-kiralama?city=${encodeURIComponent(city)}` : '/tekne-kiralama'
  const others = FIRMS.filter(f => f.id !== firm.id)

  return (
    <div className="sh-home sh-rl-page sh-cf-page">
      <div className="sh-container">
        <nav className="sh-crumbs" aria-label="Sayfa yolu">
          <Link href="/">Ana sayfa</Link>
          <span aria-hidden="true">/</span>
          <Link href="/charter-firmalari">Charter firmaları</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{firm.name}</span>
        </nav>
        <header className="sh-cf-hero">
          <FirmMark firm={firm} size="lg" />
          <div>
            <h1 className="sh-rl-title">{firm.name}</h1>
            <p className="sh-cf-loc">
              <MapPin size={16} strokeWidth={2} aria-hidden="true" /> {firm.city}, {firm.countryLabel}
            </p>
          </div>
        </header>
        <nav className="sh-cf-anchors" aria-label="Bu sayfada">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} className="sh-chip">
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      {/* beyaz tabaka: firma bilgileri + tekne arama kartı */}
      <div className="sh-rl-sheet">
        <div className="sh-container sh-cf-grid">
          <article className="sh-cf-article">
            <section id="genel" className="sh-cf-sec" aria-labelledby="cf-genel">
              <h2 id="cf-genel">Genel bilgiler</h2>
              <p>{firm.summary}</p>
              <h3>Bagaj</h3>
              <p>{firm.luggagePolicy}</p>
            </section>

            <section id="rotalar" className="sh-cf-sec" aria-labelledby="cf-rotalar">
              <h2 id="cf-rotalar">Popüler rotalar</h2>
              <ul className="sh-cf-routes">
                {firm.routes.map(r => (
                  <li key={`${r.from}-${r.to}`}>
                    <span>{r.from}</span>
                    <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
                    <span>{r.to}</span>
                    <Link href={boatsHref(r.from)} className="sh-link-arrow">
                      Tekne bul
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section id="kampanyalar" className="sh-cf-sec" aria-labelledby="cf-kampanyalar">
              <h2 id="cf-kampanyalar">Kampanyalar</h2>
              <ul className="sh-cf-checks">
                {firm.discounts.map(d => (
                  <li key={d}>
                    <Check size={18} strokeWidth={2.4} aria-hidden="true" /> {d}
                  </li>
                ))}
              </ul>
            </section>

            <section id="filo" className="sh-cf-sec" aria-labelledby="cf-filo">
              <h2 id="cf-filo">Filo</h2>
              <ul className="sh-cf-checks">
                {firm.fleetHighlights.map(item => (
                  <li key={item}>
                    <Check size={18} strokeWidth={2.4} aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>
            </section>
          </article>

          <aside className="sh-cf-aside" aria-label="Tekne ara">
            <div className="sh-cf-card">
              <h2>{firm.countryId === 'tr' ? `${firm.city} çıkışlı tekneler` : 'Ahoy’daki tekneler'}</h2>
              <p>Müsaitliğe bak, sana uygun tekneyi seç ve rezervasyon talebini gönder.</p>
              <Link href={boatsHref(firm.city)} className="sh-btn sh-btn--navy">
                Tekneleri gör <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
              </Link>
              <Link href="/charter-firmalari" className="sh-link-btn">
                Tüm charter firmaları
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* krem bant: diğer firmalar */}
      {others.length > 0 && (
        <div className="sh-rl-band sh-cf-band">
          <div className="sh-container">
            <h2 className="sh-cf-more-title">Diğer charter firmaları</h2>
            <ul className="sh-cf-more">
              {others.map(f => (
                <li key={f.id}>
                  <Link href={`/charter-firmalari/${f.slug}`} className="sh-cf-more-link">
                    <FirmMark firm={f} />
                    <span className="sh-cf-more-text">
                      <b>{f.name}</b>
                      <small>
                        {f.city}, {f.countryLabel}
                      </small>
                    </span>
                    <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
