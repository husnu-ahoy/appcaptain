import Image from 'next/image'
import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { categoryLabel, durationLabel, money, priceUnitLabel, type ExperienceCard } from '@/lib/experienceFormat'

/**
 * Deneyim kartı (GetYourGuide düzeni): üstte tek fotoğraf, altında kategori · yer
 * satırı, kalın başlık, süre · dil · alınma bilgisi ve sağ altta başlangıç fiyatı.
 * Tekne kartından (BoatListCard) bilerek farklıdır.
 */
export default function ExperienceListCard({ exp, sizes }: { exp: ExperienceCard; sizes?: string }) {
  const href = `/deneyimler/${exp.id}`
  const kicker = [categoryLabel(exp.category), exp.place].filter(Boolean).join(' · ')
  const meta = [
    durationLabel(exp.durationMinutes),
    exp.languages.length ? exp.languages.slice(0, 2).join(', ') : null,
    exp.pickup ? 'Otelden alınma' : null,
  ].filter(Boolean) as string[]

  return (
    <article className="sh-xc">
      <Link href={href} className="sh-xc-link">
        <div className="sh-xc-media">
          {exp.photo ? (
            <Image src={exp.photo} alt={exp.title} fill sizes={sizes ?? '(max-width: 600px) 40vw, (max-width: 1100px) 45vw, 300px'} />
          ) : (
            <span className="sh-xc-noimg" aria-hidden="true" />
          )}
          {exp.sample && <span className="sh-xc-badge">Örnek</span>}
        </div>

        <div className="sh-xc-body">
          {kicker && <p className="sh-xc-kicker">{kicker}</p>}
          <h3 className="sh-xc-title">{exp.title}</h3>
          <p className="sh-xc-meta">
            {meta.map((m, i) => (
              <span key={m}>
                {m}
                {i < meta.length - 1 && <i aria-hidden="true"> • </i>}
              </span>
            ))}
          </p>
          {exp.freeCancellation && (
            <p className="sh-xc-ok">
              <Check size={15} strokeWidth={2.6} aria-hidden="true" /> Ücretsiz iptal
            </p>
          )}

          <div className="sh-xc-foot">
            <span className="sh-xc-new">
              <Sparkles size={14} strokeWidth={2} aria-hidden="true" /> Yeni
            </span>
            {exp.basePrice > 0 ? (
              <p className="sh-xc-price">
                <small>Başlangıç fiyatı</small>
                <b>{money(exp.basePrice, exp.currency)}</b>
                <span>{priceUnitLabel(exp.pricingType)}</span>
              </p>
            ) : (
              <p className="sh-xc-price">
                <span>Fiyat için iletişime geç</span>
              </p>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
