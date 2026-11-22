import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Star } from 'lucide-react'

import { CAPTAINS, getAllCaptainSlugs, getCaptainBySlug } from '../data'
import { displayName, fmtCount, fmtPrice, fmtRating, locative, photo } from '../format'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return getAllCaptainSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const captain = getCaptainBySlug(slug)
  if (!captain) return { title: 'Kaptan bulunamadı — Ahoy' }
  return {
    title: `${captain.name} — Kaptan Profili | Ahoy`,
    description: `${captain.name} · ${captain.title} · ${captain.basePort}. Deneyimi, tekneleri ve misafir yorumları.`,
  }
}

export default async function CaptainDetailPage({ params }: Props) {
  const { slug } = await params
  const captain = getCaptainBySlug(slug)
  if (!captain) notFound()

  const name = displayName(captain.name)
  const others = CAPTAINS.filter(c => c.id !== captain.id).slice(0, 3)
  const cityHref = `/tekne-kiralama?city=${encodeURIComponent(captain.basePort)}`

  return (
    <div className="sh-home sh-cp">
      {/* künye */}
      <header className="sh-cp-head">
        <div className="sh-container">
          <nav className="sh-crumbs" aria-label="Sayfa yolu">
            <Link href="/">Ana sayfa</Link>
            <span aria-hidden="true">/</span>
            <Link href="/kaptanlar">Kaptanlar</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{name}</span>
          </nav>

          <div className="sh-cp-head-grid">
            <div className="sh-cp-portrait">
              <Image src={photo(captain.avatar, 900)} alt={captain.name} fill priority sizes="(max-width: 860px) 136px, (max-width: 1199px) 320px, 400px" />
            </div>
            <div className="sh-cp-head-text">
              <p className="sh-bl-meta sh-bl-meta--row">
                <span className="sh-bl-tag">
                  Kaptan · {captain.basePort}, {captain.region}
                </span>
                {captain.superCaptain && <span className="sh-cp-super">Süper Kaptan</span>}
              </p>
              <h1 className="sh-cp-h1">{name}</h1>
              <p className="sh-cp-lede">{captain.title}</p>

              <dl className="sh-cp-strip">
                <div>
                  <dt>{fmtCount(captain.reviewCount)} yorum</dt>
                  <dd>
                    <Star size={26} strokeWidth={0} fill="currentColor" aria-hidden="true" />
                    {fmtRating(captain.rating)}
                  </dd>
                </div>
                <div>
                  <dt>deneyim</dt>
                  <dd>{captain.yearsExperience} yıl</dd>
                </div>
                <div>
                  <dt>sefer</dt>
                  <dd>{fmtCount(captain.tripCount)}+</dd>
                </div>
              </dl>

              <div className="sh-cp-ctas">
                <Link href={cityHref} className="sh-btn sh-btn--navy">
                  {locative(captain.basePort)} tekne ara
                </Link>
                <a href="#yorumlar" className="sh-link-arrow">
                  Yorumları oku
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* hakkında, tekneler, yorumlar */}
      <section className="sh-sect sh-sect--white sh-pg-sect">
        <div className="sh-container">
          <div className="sh-cp-block">
            <h2>Hakkında</h2>
            <div>
              <p className="sh-cp-bio">{captain.bio}</p>
              <dl className="sh-cp-details">
                <div>
                  <dt>Belgeler</dt>
                  <dd>{captain.license}</dd>
                </div>
                <div>
                  <dt>Uzmanlık</dt>
                  <dd>{captain.specialties.join(' · ')}</dd>
                </div>
                <div>
                  <dt>Diller</dt>
                  <dd>{captain.languages.join(', ')}</dd>
                </div>
              </dl>
            </div>
          </div>

          {captain.boats.length > 0 && (
            <div className="sh-cp-block">
              <h2>Tekneleri</h2>
              <div>
                <ul className="sh-cp-boats">
                  {captain.boats.map(boat => (
                    <li key={boat.id} className="sh-cp-boat">
                      <div className="sh-cp-boat-img">
                        <Image src={boat.image} alt="" fill sizes="(max-width: 860px) 104px, 176px" />
                      </div>
                      <div className="sh-cp-boat-text">
                        <h3>{boat.name}</h3>
                        <p>
                          {boat.type} · {boat.lengthM} m · {boat.guests} kişi · {boat.location}
                        </p>
                      </div>
                      <p className="sh-cp-boat-price">
                        {fmtPrice(boat.pricePerNight)}
                        <small>gecelik</small>
                      </p>
                    </li>
                  ))}
                </ul>
                <Link href={cityHref} className="sh-link-arrow sh-cp-more-link">
                  {locative(captain.basePort)}ki tüm tekneler <ArrowRight size={18} strokeWidth={1.9} aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}

          {captain.reviews.length > 0 && (
            <div className="sh-cp-block" id="yorumlar">
              <h2>Misafir yorumları</h2>
              <div>
                <p className="sh-cp-score">
                  <b>
                    <Star size={34} strokeWidth={0} fill="currentColor" aria-hidden="true" />
                    {fmtRating(captain.rating)}
                  </b>
                  <span>{fmtCount(captain.reviewCount)} değerlendirme</span>
                </p>
                <ul className="sh-cp-reviews">
                  {captain.reviews.map(review => (
                    <li key={review.id} className="sh-cp-review">
                      <blockquote>
                        <p>{review.text}</p>
                      </blockquote>
                      <p className="sh-cp-review-by">
                        <b>{review.authorName}</b>
                        <span>{review.tripLabel}</span>
                        <span>{review.date}</span>
                        <span className="sh-cp-review-stars" aria-label={`${review.rating} / 5`}>
                          <Star size={13} strokeWidth={0} fill="currentColor" aria-hidden="true" />
                          {review.rating}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* diğer kaptanlar */}
      <section className="sh-sect sh-sect--cream sh-cp-others" aria-labelledby="cp-others">
        <div className="sh-container">
          <div className="sh-ar-more-head">
            <h2 id="cp-others" className="sh-ar-more-title">
              Diğer kaptanlar
            </h2>
            <Link href="/kaptanlar" className="sh-link-arrow">
              Tüm kaptanlar <ArrowRight size={18} strokeWidth={1.9} aria-hidden="true" />
            </Link>
          </div>
          <ul className="sh-cp-mini">
            {others.map(c => (
              <li key={c.id}>
                <Link href={`/kaptanlar/${c.slug}`} className="sh-cp-mini-link">
                  <span className="sh-cp-mini-photo">
                    <Image src={c.avatar} alt="" fill sizes="64px" />
                  </span>
                  <span className="sh-cp-mini-text">
                    <b>{displayName(c.name)}</b>
                    <small>
                      {c.basePort} · {c.title}
                    </small>
                  </span>
                  <ArrowRight size={18} strokeWidth={1.9} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
