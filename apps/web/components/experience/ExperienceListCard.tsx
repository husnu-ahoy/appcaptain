import Image from 'next/image'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { durationLabel, money, priceUnitLabel, type ExperienceCard } from '@/lib/experienceFormat'

/**
 * Deneyim kartı (GetYourGuide düzeni): üstte fotoğraf, altında kalın başlık,
 * yer · süre · dil satırı, varsa ücretsiz iptal ve sağ altta başlangıç fiyatı.
 * Tekne kartından (BoatListCard) bilerek farklıdır.
 */
export default function ExperienceListCard({ exp, sizes }: { exp: ExperienceCard; sizes?: string }) {
  const href = `/deneyimler/${exp.id}`
  const meta = [
    exp.place,
    durationLabel(exp.durationMinutes),
    exp.languages.length ? exp.languages.slice(0, 2).join(', ') : null,
    exp.pickup ? 'Otelden alınma' : null,
  ].filter(Boolean) as string[]

  return (
    <article className="sh-xc">
      <Link href={href} className="sh-xc-link">
        <div className="sh-xc-media">
          {exp.photo ? (
            <Image src={exp.photo} alt={exp.title} fill sizes={sizes ?? '(max-width: 600px) 40vw, (max-width: 960px) 45vw, (max-width: 1200px) 30vw, 300px'} />
          ) : (
            <span className="sh-xc-noimg" aria-hidden="true" />
          )}
          {exp.sample && <span className="sh-xc-badge">Örnek deneyim</span>}
        </div>

        <div className="sh-xc-body">
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
            {exp.basePrice > 0 ? (
              <p className="sh-xc-price">
                <small>Başlangıç fiyatı</small>
                <span className="sh-xc-amount">
                  <b>{money(exp.basePrice, exp.currency)}</b> {priceUnitLabel(exp.pricingType)}
                </span>
              </p>
            ) : (
              <p className="sh-xc-price">
                <small>Fiyat için iletişime geç</small>
              </p>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
