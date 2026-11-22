'use client'

import Link from 'next/link'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Bus,
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  Info,
  Languages,
  MapPin,
  Navigation,
  PlayCircle,
  Share,
  Sparkles,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { ExperienceDTO } from '@ahoy/shared'
import AhoyGuarantee from '@/components/sh/AhoyGuarantee'
import ShareModal from '@/components/sh/ShareModal'
import { dayOf } from '@/lib/bookingDisplay'
import { formatLongDate } from '@/lib/boatFormat'
import { typeHref, typeOfCategory } from '@/lib/content/experienceTypes'
import {
  cancellationText,
  cancellationTitle,
  categoryLabel,
  difficultyLabel,
  durationLabel,
  estimate,
  fromPrice,
  isFreeCancellation,
  joinTr,
  meetingTimes,
  money,
  placeOf,
  priceUnitLabel,
  productTypeLabel,
  ticketLabel,
  tierWhen,
  type ExperienceCard,
  type Party,
} from '@/lib/experienceFormat'
import ExperienceAvailability from './ExperienceAvailability'
import ExperienceBookingCard, { type BookingState } from './ExperienceBookingCard'
import ExperienceGallery from './ExperienceGallery'
import ExperienceListCard from './ExperienceListCard'
import SeaEdge from './SeaEdge'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
/** Yapışkan başlığın altında kalmasın diye kaydırmada bırakılan boşluk. */
const SCROLL_OFFSET = 112

interface Feature {
  icon: LucideIcon
  title: string
  text: string
}

const toIso = (d: string | Date) => (typeof d === 'string' ? d : d.toISOString())

/** "16:30" + 240 dk → "20:30" */
function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  const t = ((h ?? 0) * 60 + (m ?? 0) + minutes) % 1440
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="sh-xp-row">
      <h3>{label}</h3>
      <div className="sh-xp-row-body">{children}</div>
    </div>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="sh-xp-bullets">
      {items.map(i => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  )
}

/**
 * Deneyim detayı (GetYourGuide düzeni): başlık ve rozetler, solda galeri + bilgiler,
 * sağda yapışkan rezervasyon kartı; "Uygunluk durumu" seçim panelini açar.
 * Tekne ilan sayfasından (ListingDetail) bilerek farklı bir düzendir.
 */
export default function ExperienceDetail({ exp, similar, sample }: { exp: ExperienceDTO; similar: ExperienceCard[]; sample: boolean }) {
  const times = meetingTimes(exp.meetingTime)
  const [party, setParty] = useState<Party>({ adults: Math.max(1, Math.min(2, exp.maxParticipants || 2)), children: 0 })
  const [date, setDate] = useState<Date | null>(null)
  const [language, setLanguage] = useState<string | null>(exp.languages[0] ?? null)
  const [time, setTime] = useState<string | null>(times[0] ?? null)
  const [pickup, setPickup] = useState(false)
  const [checked, setChecked] = useState(false)
  const [descOpen, setDescOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const closeShare = useCallback(() => setShareOpen(false), [])
  const similarRef = useRef<HTMLDivElement>(null)

  const booking: BookingState = { party, setParty, date, setDate, language, setLanguage }

  const gallery = useMemo(
    () => [exp.coverPhotoUrl, ...exp.photoUrls].filter(Boolean).map((url, i) => ({ url, alt: i === 0 ? exp.title : `${exp.title} — fotoğraf ${i + 1}` })),
    [exp],
  )
  const type = typeOfCategory(exp.category)
  const category = categoryLabel(exp.category)
  const place = placeOf(exp.meetingPoint)
  const duration = durationLabel(exp.durationMinutes)
  const free = isFreeCancellation(exp.cancellationPolicy)
  const est = estimate(exp, party, date)

  const scrollToEl = (el: HTMLElement | null) => {
    if (!el) return
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET, behavior: 'smooth' })
  }

  const onCheck = () => {
    setChecked(true)
    // Panel bir sonraki çizimde oluşur; ardından oraya kaydırılır ve odak taşınır.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = document.getElementById('uygunluk')
        scrollToEl(el)
        el?.focus({ preventScroll: true })
      }),
    )
  }

  /** Görünen kart: masaüstünde yan sütundaki, mobilde sayfa içindeki (diğeri display: none). */
  const visibleCard = () => [...document.querySelectorAll<HTMLElement>('.sh-xb')].find(el => el.offsetParent !== null) ?? null

  const onEdit = () => {
    const card = visibleCard()
    if (card?.classList.contains('sh-xb--inline')) scrollToEl(card)
    else card?.querySelector<HTMLButtonElement>('.sh-xb-select')?.focus()
  }

  /* ---------- öne çıkan özellikler ---------- */
  const feats = [
    free && { icon: CalendarCheck, title: 'Ücretsiz iptal', text: cancellationText(exp.cancellationPolicy, exp.cancellationPolicyText) },
    { icon: Wallet, title: 'Önce talep, sonra ödeme', text: 'Talebini gönderirken hiçbir ücret ödemezsin.' },
    {
      icon: Clock3,
      title: `Süre: ${duration}`,
      text: times.length ? `Başlangıç saati: ${times.join(', ')}` : 'Başlangıç saatini talebinde netleştirirsin.',
    },
    exp.languages.length > 0 && { icon: Languages, title: 'Rehberlik dili', text: joinTr(exp.languages) },
    exp.pickupOffered && {
      icon: Bus,
      title: 'Otelden alınma mevcut',
      text: `${exp.pickupAreas ?? 'Belirli bölgelerdeki oteller'}${exp.pickupFee ? ` · ek ücret ${money(exp.pickupFee, exp.currency)}` : ' · ücretsiz'}`,
    },
    exp.maxParticipants > 0 && {
      icon: Users,
      title: exp.maxParticipants <= 12 ? 'Küçük grup' : 'Grup büyüklüğü',
      text: exp.minParticipants > 1 ? `${exp.minParticipants}–${exp.maxParticipants} kişi` : `En fazla ${exp.maxParticipants} kişi`,
    },
  ].filter(Boolean) as Feature[]

  /* ---------- "Deneyim" satırları ---------- */
  const desc = exp.fullDescription.trim()
  const paragraphs = desc ? desc.split(/\n{2,}/).map(p => p.trim()).filter(Boolean) : []
  const longDesc = desc.length > 420
  const difficulty = difficultyLabel(exp.difficultyLevel)
  const who = [
    exp.minAge ? `${exp.minAge} yaş ve üzeri katılımcılar` : null,
    difficulty ? `Zorluk seviyesi: ${difficulty}` : null,
    ...exp.requiredEquipment,
    ...exp.accessibilityOptions,
    exp.accessibilityInfo,
  ].filter(Boolean) as string[]
  const important = [
    { title: 'Yanına al', items: exp.toBring },
    { title: 'İzin verilmeyenler', items: exp.notAllowed },
    { title: 'Bilmen gerekenler', items: exp.knowBeforeYouGo },
  ].filter(g => g.items.length > 0)
  const prices = [
    `${money(exp.basePrice, exp.currency)} ${priceUnitLabel(exp.pricingType)}${
      exp.pricingType === 'PER_GROUP' && exp.maxParticipants ? ` (en fazla ${exp.maxParticipants} kişi)` : ''
    }`,
    exp.childDiscountPercent && exp.pricingType !== 'PER_GROUP' ? `Çocuklara %${exp.childDiscountPercent} indirim` : null,
    ...exp.seasonalPricingRules.map(
      r => `${r.label} (${formatLongDate(dayOf(toIso(r.startDate)))} – ${formatLongDate(dayOf(toIso(r.endDate)))}): ${money(r.price, exp.currency)}`,
    ),
    exp.pickupOffered ? (exp.pickupFee ? `Otelden alınma: ${money(exp.pickupFee, exp.currency)} ek ücret` : 'Otelden alınma: ücretsiz') : null,
  ].filter(Boolean) as string[]
  const fields = [...exp.customerInfoFields].sort((a, b) => a.sortOrder - b.sortOrder)
  const ticket = ticketLabel(exp.ticketType)

  /* ---------- buluşma ve güzergah ---------- */
  const lat = exp.meetingPointLat
  const lng = exp.meetingPointLng
  const mapUrl =
    lat != null && lng != null && MAPBOX_TOKEN
      ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+183d85(${lng},${lat})/${lng},${lat},13.5,0/900x640@2x?access_token=${MAPBOX_TOKEN}`
      : null
  const directionsUrl =
    lat != null && lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : exp.meetingPoint
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(exp.meetingPoint)}`
        : null
  // Buluşma saati tekse dönüş saati süreden hesaplanır (yaklaşık).
  const clockTimes = times.filter(t => /^\d{2}:\d{2}$/.test(t))
  const startChip = clockTimes.length ? clockTimes.join(' / ') : null
  const endChip =
    clockTimes.length === 1 && exp.durationMinutes > 0 && exp.durationMinutes < 1440 ? `≈ ${addMinutes(clockTimes[0]!, exp.durationMinutes)}` : null
  const steps = [
    exp.meetingPoint && {
      key: 'start',
      icon: MapPin,
      title: 'Buluşma noktası',
      time: startChip,
      text: clockTimes.length || !times.length ? exp.meetingPoint : `${exp.meetingPoint} · ${times.join(', ')}`,
      main: true,
    },
    exp.pickupOffered && { key: 'pickup', icon: Bus, title: 'Otelden alınma (isteğe bağlı)', time: null, text: exp.pickupAreas ?? 'Belirli bölgelerdeki oteller', main: false },
    { key: 'exp', icon: Sparkles, title: category ?? 'Deneyim', time: null, text: `${duration} sürer`, main: false },
    {
      key: 'end',
      icon: Flag,
      title: endChip ? 'Tahmini dönüş' : 'Bitiş',
      time: endChip,
      text: exp.isSameEndPoint || !exp.endPoint ? 'Başlangıç noktasında sona erer' : exp.endPoint,
      main: true,
    },
  ].filter(Boolean) as { key: string; icon: LucideIcon; title: string; time: string | null; text: string; main: boolean }[]

  const scrollSimilar = (dir: number) => {
    const el = similarRef.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <div className="sh-xp">
      <div className="sh-container">
        {sample && (
          <p className="sh-xp-sample" role="note">
            <Info size={18} strokeWidth={1.9} aria-hidden="true" />
            <span>
              Bu bir <b>örnek deneyim</b>: kaptanların Kaptan Paneli’nden eklediği deneyimlerin nasıl görüneceğini gösterir, rezervasyona kapalıdır.
            </span>
          </p>
        )}

        <nav className="sh-crumbs sh-xp-crumbs" aria-label="Sayfa yolu">
          <Link href="/">Ana sayfa</Link>
          <span aria-hidden="true">/</span>
          <Link href="/deneyimler">Deneyimler</Link>
          {type && (
            <>
              <span aria-hidden="true">/</span>
              <Link href={typeHref(type)}>{type.label}</Link>
            </>
          )}
        </nav>

        {/* ---------- başlık ---------- */}
        <header className="sh-xp-head">
          <h1 className="sh-xp-title">{exp.title}</h1>
          <div className="sh-xp-meta">
            <div className="sh-xp-meta-l">
              {category && <span className="sh-xp-badge">{category}</span>}
              <span className="sh-xp-new">
                <Sparkles size={16} strokeWidth={2} aria-hidden="true" /> Yeni deneyim
              </span>
              {place && <span className="sh-xp-dot">{place}</span>}
              {productTypeLabel(exp.productType) && <span className="sh-xp-dot">{productTypeLabel(exp.productType)}</span>}
            </div>
            <button type="button" className="sh-xp-act" onClick={() => setShareOpen(true)}>
              <Share size={18} strokeWidth={2} aria-hidden="true" />
              <span>Paylaş</span>
            </button>
          </div>
        </header>

        <div className="sh-xp-layout">
          <div className="sh-xp-main">
            <ExperienceGallery photos={gallery} title={exp.title} />

            {exp.shortDescription && <p className="sh-xp-lede">{exp.shortDescription}</p>}

            <AhoyGuarantee className="sh-xp-ag" />

            {feats.length > 0 && (
              <ul className="sh-xp-feats">
                {feats.map(({ icon: Icon, title, text }) => (
                  <li key={title}>
                    <span className="sh-xp-feat-ico">
                      <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <div>
                      <b>{title}</b>
                      <p>{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* mobil: kart sayfa akışında */}
            <ExperienceBookingCard exp={exp} variant="inline" state={booking} onCheck={onCheck} />

            {checked && date && (
              <ExperienceAvailability
                exp={exp}
                sample={sample}
                party={party}
                date={date}
                language={language}
                time={time}
                setTime={setTime}
                pickup={pickup}
                setPickup={setPickup}
                onEdit={onEdit}
              />
            )}

            {/* ---------- deneyim ayrıntıları ---------- */}
            <section className="sh-xp-sec" aria-labelledby="xp-about">
              <h2 className="sh-xp-h2" id="xp-about">
                Deneyim
              </h2>
              <div className="sh-xp-rows">
                {exp.highlights.length > 0 && (
                  <Row label="Öne çıkanlar">
                    <ul className="sh-xp-hl">
                      {exp.highlights.map(h => (
                        <li key={h}>
                          <Sparkles size={18} strokeWidth={2} aria-hidden="true" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </Row>
                )}

                {paragraphs.length > 0 && (
                  <Row label="Tam açıklama">
                    <div className={`sh-xp-desc${longDesc && !descOpen ? ' is-clamped' : ''}`}>
                      {paragraphs.map(p => (
                        <p key={p.slice(0, 40)}>{p}</p>
                      ))}
                    </div>
                    {longDesc && (
                      <button type="button" className="sh-xp-more" onClick={() => setDescOpen(o => !o)} aria-expanded={descOpen}>
                        {descOpen ? 'Daha az göster' : 'Daha fazlasını gör'}
                      </button>
                    )}
                    {exp.videoUrl && /^https?:\/\//.test(exp.videoUrl) && (
                      <a href={exp.videoUrl} target="_blank" rel="noopener noreferrer" className="sh-xp-video">
                        <PlayCircle size={19} strokeWidth={1.8} aria-hidden="true" /> Tanıtım videosunu izle
                      </a>
                    )}
                  </Row>
                )}

                {(exp.included.length > 0 || exp.notIncluded.length > 0) && (
                  <Row label="Dahil olanlar">
                    <ul className="sh-xp-inc">
                      {exp.included.map(i => (
                        <li key={`y-${i}`} className="is-yes">
                          <Check size={18} strokeWidth={2.4} aria-label="Dahil" />
                          <span>{i}</span>
                        </li>
                      ))}
                      {exp.notIncluded.map(i => (
                        <li key={`n-${i}`} className="is-no">
                          <X size={18} strokeWidth={2.4} aria-label="Dahil değil" />
                          <span>{i}</span>
                        </li>
                      ))}
                    </ul>
                  </Row>
                )}

                {who.length > 0 && (
                  <Row label="Kimler katılabilir?">
                    <Bullets items={who} />
                  </Row>
                )}

                {important.length > 0 && (
                  <Row label="Önemli bilgiler">
                    <div className="sh-xp-groups">
                      {important.map(g => (
                        <div key={g.title}>
                          <h4>{g.title}</h4>
                          <Bullets items={g.items} />
                        </div>
                      ))}
                    </div>
                  </Row>
                )}

                <Row label="Fiyatlar">
                  <Bullets items={prices} />
                </Row>

                <Row label="İptal politikası">
                  <p className="sh-xp-strong">{cancellationTitle(exp.cancellationPolicy, exp.cancellationPolicyText)}</p>
                  <p className="sh-xp-text">{cancellationText(exp.cancellationPolicy, exp.cancellationPolicyText)}</p>
                  {exp.cancellationTiers.length > 0 && (
                    <table className="sh-xp-tiers">
                      <caption className="sr-only">İade tablosu</caption>
                      <thead>
                        <tr>
                          <th scope="col">İptal zamanı</th>
                          <th scope="col">İade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...exp.cancellationTiers]
                          .sort((a, b) => b.daysBefore - a.daysBefore)
                          .map(t => (
                            <tr key={`${t.daysBefore}-${t.refundPercent}`}>
                              <td>{tierWhen(t.daysBefore)}</td>
                              <td>{t.refundPercent > 0 ? `%${t.refundPercent}` : 'İade yok'}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </Row>

                {(fields.length > 0 || ticket) && (
                  <Row label="Rezervasyon bilgileri">
                    {fields.length > 0 && (
                      <ul className="sh-xp-fields">
                        {fields.map(fld => (
                          <li key={fld.id}>
                            <b>
                              {fld.label} <small>{fld.required ? 'Zorunlu' : 'İsteğe bağlı'}</small>
                            </b>
                            {fld.helpText && <p>{fld.helpText}</p>}
                            {fld.options.length > 0 && <p>Seçenekler: {fld.options.join(', ')}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                    {ticket && <p className="sh-xp-text">Bilet: {ticket}</p>}
                  </Row>
                )}
              </div>
            </section>

            {/* ---------- buluşma ve güzergah ---------- */}
            {exp.meetingPoint && (
              <section className="sh-xp-sec" aria-labelledby="xp-route">
                <h2 className="sh-xp-h2" id="xp-route">
                  Buluşma ve güzergah
                </h2>
                <div className="sh-xp-route">
                  <ol className="sh-xp-steps">
                    {steps.map(({ key, icon: Icon, title, time, text, main }) => (
                      <li key={key} className={main ? 'is-main' : undefined}>
                        <span className="sh-xp-step-dot">
                          <Icon size={main ? 17 : 15} strokeWidth={2.2} aria-hidden="true" />
                        </span>
                        <div>
                          <b>
                            {time && <span className="sh-xp-step-time">{time}</span>}
                            {title}
                          </b>
                          <p>{text}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="sh-xp-map">
                    {mapUrl ? (
                      // Mapbox statik harita — next/image optimizasyonu gerekmiyor.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mapUrl} alt={`${exp.title} buluşma noktası haritası`} loading="lazy" />
                    ) : (
                      <div className="sh-xp-map-fallback">
                        <MapPin size={28} aria-hidden="true" />
                        <span>{exp.meetingPoint}</span>
                      </div>
                    )}
                    {directionsUrl && (
                      <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="sh-btn sh-btn--white sh-xp-map-btn">
                        Yol tarifi al <Navigation size={16} fill="currentColor" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="sh-xp-side">
            <ExperienceBookingCard exp={exp} variant="aside" state={booking} onCheck={onCheck} />
          </div>
        </div>

        {/* ---------- benzer deneyimler ---------- */}
        {similar.length > 0 && (
          <section className="sh-xp-similar" aria-labelledby="xp-similar">
            <div className="sh-xp-similar-head">
              <h2 className="sh-xp-h2" id="xp-similar">
                Bunları da beğenebilirsin
              </h2>
              <div className="sh-xh-arrows">
                <button type="button" className="sh-xh-arrow" onClick={() => scrollSimilar(-1)} aria-label="Önceki deneyimler">
                  <ChevronLeft size={18} strokeWidth={2.4} />
                </button>
                <button type="button" className="sh-xh-arrow" onClick={() => scrollSimilar(1)} aria-label="Sonraki deneyimler">
                  <ChevronRight size={18} strokeWidth={2.4} />
                </button>
              </div>
            </div>
            <div className="sh-xp-similar-track" ref={similarRef}>
              {similar.slice(0, 10).map(e => (
                <ExperienceListCard key={e.id} exp={e} sizes="300px" />
              ))}
            </div>
          </section>
        )}
      </div>

      <SeaEdge />

      {/* ---------- mobil alt çubuk ---------- */}
      <div className="sh-xp-bar">
        <div>
          <small>{date ? (est.season ? `${est.season} · ${formatLongDate(date)}` : formatLongDate(date)) : 'Başlangıç fiyatı'}</small>
          <p>
            <b>{money(date ? est.price : fromPrice(exp), exp.currency)}</b> <span>{priceUnitLabel(exp.pricingType)}</span>
          </p>
        </div>
        <button
          type="button"
          className="sh-xb-cta"
          onClick={() => scrollToEl(document.getElementById(checked && date ? 'uygunluk' : 'rezervasyon'))}
        >
          {checked && date ? 'Seçimini gör' : 'Uygunluk durumu'}
        </button>
      </div>

      {shareOpen && (
        <ShareModal
          url={window.location.href}
          title={exp.title}
          image={gallery[0]?.url ?? null}
          subtitle={[category, place].filter(Boolean).join(' · ')}
          onClose={closeShare}
        />
      )}
    </div>
  )
}
