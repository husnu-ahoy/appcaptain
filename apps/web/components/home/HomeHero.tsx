'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { BedDouble, CalendarCheck, CalendarDays, MapPin, Minus, Plus, Search, Users, X } from 'lucide-react'
import RangeCalendar, { type DateRangeValue } from '@/components/sh/RangeCalendar'
import { toISODate } from '@/lib/boatFormat'
import { HERO_SUGGESTIONS, PROMOS } from './content'
import DealBanner from './DealBanner'

const fmtDate = (d: Date) => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })

type Tab = 'rental' | 'experience' | 'cruise'
type Field = 'location' | 'checkin' | 'checkout' | 'date' | 'guests' | 'cabins' | null

const TABS: { key: Tab; label: string }[] = [
  { key: 'rental', label: 'Tekne Kirala' },
  { key: 'experience', label: 'Deneyimler' },
  { key: 'cruise', label: 'Mavi Yolculuk' },
]

// Mobil hero sekmeleri — markanın üç ana yolu; seçime göre arama metni ve hedef sayfa değişir.
const MOBILE_TABS: { key: Tab; label: string; placeholder: string }[] = [
  { key: 'rental', label: 'Tekne Kirala', placeholder: 'Kiralama için liman seç' },
  { key: 'experience', label: 'Deneyimler', placeholder: 'Deneyim için bölge seç' },
  { key: 'cruise', label: 'Mavi Yolculuk', placeholder: 'Mavi yolculuk için liman seç' },
]

const SEARCH_LABEL: Record<Tab, string> = { rental: 'Tekne ara', experience: 'Deneyim ara', cruise: 'Mavi yolculuk ara' }
const MAX_CABINS = 10

/**
 * Sekmeye göre sorulan alanlar:
 *   Tekne kirala  → yer, check-in, check-out
 *   Deneyimler    → yer, tarih, kişi (değişmedi)
 *   Mavi yolculuk → yer, check-in, check-out, kabin
 * Tekne aramasında tarihler ve kabin sayısı /tekne-kiralama'ya taşınır.
 */
export default function HomeHero() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('rental')
  const [field, setField] = useState<Field>(null)
  const [location, setLocation] = useState('')
  const [guests, setGuests] = useState(0)
  const [cabins, setCabins] = useState(0)
  const [range, setRange] = useState<DateRangeValue>({ start: null, end: null })
  const [sheetOpen, setSheetOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const boatSearch = tab !== 'experience'

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!cardRef.current?.contains(e.target as Node)) setField(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const dateLabel = range.start
    ? `${fmtDate(range.start)} — ${range.end ? fmtDate(range.end) : '?'}`
    : 'Tarihleri seçin'

  const submit = () => {
    const qs = new URLSearchParams()
    const q = location.trim()
    if (q) qs.set('city', q)
    if (boatSearch) {
      // Mavi yolculuk: haftalık kiralanan tekneler, istenen kabin sayısıyla
      if (tab === 'cruise') {
        qs.set('model', 'weekly_charter')
        if (cabins > 0) qs.set('cabins', String(cabins))
      }
      if (range.start) qs.set('start', toISODate(range.start))
      if (range.end) qs.set('end', toISODate(range.end))
    }
    const path = tab === 'experience' ? '/deneyimler' : '/tekne-kiralama'
    const query = qs.toString()
    setField(null)
    router.push(query ? `${path}?${query}` : path)
  }

  const suggestions = HERO_SUGGESTIONS.filter(
    s => !location || s.label.toLocaleLowerCase('tr').includes(location.toLocaleLowerCase('tr')),
  )

  /** Tarih seçimi: giriş seçilince çıkışa, çıkış seçilince (mavi yolculukta) kabine geçilir. */
  const pickRange = (v: DateRangeValue) => {
    setRange(v)
    if (v.start && !v.end) setField('checkout')
    else if (v.start && v.end) setField(tab === 'cruise' ? 'cabins' : null)
  }

  const onFieldKey = (next: Field) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setField(f => (f === next ? null : next))
    }
  }

  const cabinStepper = (
    <div className="sh-guests">
      Kabin sayısı
      <button type="button" aria-label="Azalt" disabled={cabins === 0} onClick={() => setCabins(c => c - 1)}>
        −
      </button>
      <span>{cabins}</span>
      <button type="button" aria-label="Arttır" disabled={cabins >= MAX_CABINS} onClick={() => setCabins(c => c + 1)}>
        +
      </button>
    </div>
  )

  return (
    <section className="sh-hero" aria-label="Ahoy">
      {/* ---------- mobil hero: tam ekran görsel + beyaz başlık ---------- */}
      <div className="sh-mhero">
        {/* Fotoğraf: Artem Bryzgalov, Unsplash (Ölüdeniz, Fethiye) — Unsplash Lisansı */}
        <Image src="/home/hero-mobile-oludeniz.webp" alt="Ölüdeniz lagünü ve kumsalda demirli tekneler, Fethiye" fill priority sizes="100vw" quality={85} />
        <div className="sh-mhero-shade" aria-hidden="true" />
        <div className="sh-mhero-body">
          <h1 className="sh-mhero-title">
            Deniz senin
            <span>yeni rotan.</span>
          </h1>
          <p className="sh-mhero-lede">Yelkenliden lüks yata, dalış turundan gün batımına kadar tüm deniz maceraları tek adreste.</p>
          <div className="sh-mhero-tabs" role="tablist" aria-label="Arama türü">
            {MOBILE_TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={tab === key ? 'is-active' : undefined}
                onClick={() => setTab(key)}
              >
                <span>{label}</span>
              </button>
            ))}
          </div>
          <form
            className="sh-mhero-search"
            role="search"
            onSubmit={e => {
              e.preventDefault()
              submit()
            }}
          >
            <MapPin size={20} fill="currentColor" stroke="#fff" strokeWidth={1.6} aria-hidden="true" />
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder={MOBILE_TABS.find(t => t.key === tab)?.placeholder}
              aria-label="Liman veya bölge"
              list="sh-mhero-places"
              enterKeyHint="search"
            />
            <datalist id="sh-mhero-places">
              {HERO_SUGGESTIONS.map(s => (
                <option key={s.label} value={s.label}>
                  {s.sub}
                </option>
              ))}
            </datalist>
            <button type="submit" aria-label={SEARCH_LABEL[tab]}>
              <Search size={20} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </form>
          {boatSearch && (
            <div className={`sh-mhero-when${tab === 'cruise' ? ' has-cabins' : ''}`}>
              <button type="button" onClick={() => setSheetOpen(true)}>
                <CalendarDays size={18} strokeWidth={1.9} aria-hidden="true" />
                <span>
                  <small>Check-in</small>
                  <b className={range.start ? undefined : 'is-empty'}>{range.start ? fmtDate(range.start) : 'Tarih ekle'}</b>
                </span>
              </button>
              <button type="button" onClick={() => setSheetOpen(true)}>
                <span>
                  <small>Check-out</small>
                  <b className={range.end ? undefined : 'is-empty'}>{range.end ? fmtDate(range.end) : 'Tarih ekle'}</b>
                </span>
              </button>
              {tab === 'cruise' && (
                <button type="button" onClick={() => setSheetOpen(true)}>
                  <BedDouble size={18} strokeWidth={1.9} aria-hidden="true" />
                  <span>
                    <small>Kabin</small>
                    <b className={cabins > 0 ? undefined : 'is-empty'}>{cabins > 0 ? `${cabins} kabin` : 'Ekle'}</b>
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="sh-container sh-hero-stage">
        <div className="sh-hero-photo">
          {/* Fotoğraf: Artem Bryzgalov, Unsplash (Ölüdeniz, Fethiye) — Unsplash Lisansı. Mobil hero ile aynı kare, yatay kesit. */}
          <Image src="/home/hero-oludeniz.webp" alt="Ölüdeniz lagünü, kumsal ve demirli tekneler, Fethiye" fill priority sizes="954px" />
        </div>

        <div className="sh-hero-copy">
          <h1 className="sh-hero-title">
            <span className="l1">Deniz senin</span>
            <span className="l2">yeni rotan.</span>
          </h1>
          <p className="sh-hero-lede">
            Yelkenliden lüks yata, dalış turundan gün batımı deneyimine kadar aradığın tüm deniz maceraları tek bir adreste.
          </p>
        </div>

        {/* data-hero-search: header bu kutu ekrandan çıkınca kompakt aramaya geçer */}
        <div className="sh-hsearch" data-hero-search>
          <div className="sh-htabs" role="tablist" aria-label="Arama türü">
            {TABS.map(t => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={`sh-htab${tab === t.key ? ' sh-htab--active' : ''}`}
                onClick={() => {
                  setTab(t.key)
                  setField(null)
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className={`sh-hcard sh-hcard--${tab}`} ref={cardRef} role="search">
            <div className={`sh-hfield${field === 'location' ? ' is-active' : ''}`} onClick={() => setField('location')}>
              <MapPin size={26} fill="currentColor" stroke="#fff" strokeWidth={1.6} aria-hidden="true" />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="sh-hfield-label">Yer</span>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  onFocus={() => setField('location')}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="Liman veya bölge seçin"
                  aria-label="Liman veya bölge"
                />
              </span>
              {field === 'location' && suggestions.length > 0 && (
                <div className="sh-pop sh-pop-list" onClick={e => e.stopPropagation()}>
                  {suggestions.map(s => (
                    <button
                      key={s.label}
                      type="button"
                      className="sh-pop-item"
                      onClick={() => {
                        setLocation(s.label)
                        setField(boatSearch ? 'checkin' : 'date')
                      }}
                    >
                      <b>{s.label}</b>
                      <span>{s.sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {boatSearch ? (
              <>
                <div
                  className={`sh-hfield${field === 'checkin' ? ' is-active' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-expanded={field === 'checkin' || field === 'checkout'}
                  onClick={() => setField(f => (f === 'checkin' ? null : 'checkin'))}
                  onKeyDown={onFieldKey('checkin')}
                >
                  <CalendarDays size={26} aria-hidden="true" />
                  <span style={{ minWidth: 0 }}>
                    <span className="sh-hfield-label">Check-in</span>
                    <span className={`sh-hfield-value${range.start ? '' : ' is-empty'}`}>{range.start ? fmtDate(range.start) : 'Tarih ekle'}</span>
                  </span>
                </div>
                <div
                  className={`sh-hfield${field === 'checkout' ? ' is-active' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-expanded={field === 'checkin' || field === 'checkout'}
                  onClick={() => setField(f => (f === 'checkout' ? null : 'checkout'))}
                  onKeyDown={onFieldKey('checkout')}
                >
                  <CalendarCheck size={26} aria-hidden="true" />
                  <span style={{ minWidth: 0 }}>
                    <span className="sh-hfield-label">Check-out</span>
                    <span className={`sh-hfield-value${range.end ? '' : ' is-empty'}`}>{range.end ? fmtDate(range.end) : 'Tarih ekle'}</span>
                  </span>
                </div>
                {tab === 'cruise' && (
                  <div
                    className={`sh-hfield${field === 'cabins' ? ' is-active' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-expanded={field === 'cabins'}
                    onClick={() => setField('cabins')}
                    onKeyDown={onFieldKey('cabins')}
                  >
                    <BedDouble size={26} aria-hidden="true" />
                    <span style={{ minWidth: 0 }}>
                      <span className="sh-hfield-label">Kabin</span>
                      <span className={`sh-hfield-value${cabins > 0 ? '' : ' is-empty'}`}>{cabins > 0 ? `${cabins} kabin` : 'Kabin ekle'}</span>
                    </span>
                    {field === 'cabins' && (
                      <div className="sh-pop sh-pop--cabins" onClick={e => e.stopPropagation()}>
                        {cabinStepper}
                        <p className="sh-pop-note">En az bu kadar kabini olan tekneleri gösteririz.</p>
                      </div>
                    )}
                  </div>
                )}
                {(field === 'checkin' || field === 'checkout') && (
                  <div className="sh-pop sh-pop--cal sh-pop--center" onClick={e => e.stopPropagation()}>
                    <p className="sh-pop-title">{field === 'checkin' ? 'Check-in tarihini seç' : 'Check-out tarihini seç'}</p>
                    <RangeCalendar value={range} onChange={pickRange} />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="sh-hfield" role="button" tabIndex={0} onClick={() => setField(f => (f === 'date' ? null : 'date'))}>
                  <CalendarDays size={26} aria-hidden="true" />
                  <span style={{ minWidth: 0 }}>
                    <span className="sh-hfield-label">Ne zaman?</span>
                    <span className="sh-hfield-value">{dateLabel}</span>
                  </span>
                  {field === 'date' && (
                    <div className="sh-pop sh-pop--cal" onClick={e => e.stopPropagation()}>
                      <RangeCalendar
                        value={range}
                        onChange={v => {
                          setRange(v)
                          // Bitiş tarihi seçilince kişi alanına geç (önceki davranış).
                          if (v.start && v.end) setField('guests')
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="sh-hfield" role="button" tabIndex={0} onClick={() => setField('guests')}>
                  <Users size={26} fill="currentColor" aria-hidden="true" />
                  <span style={{ minWidth: 0 }}>
                    <span className="sh-hfield-label">Kişiler</span>
                    <span className="sh-hfield-value">{guests > 0 ? `${guests} misafir` : 'Misafir ekleyin'}</span>
                  </span>
                  {field === 'guests' && (
                    <div className="sh-pop" onClick={e => e.stopPropagation()}>
                      <div className="sh-guests">
                        Misafir sayısı
                        <button type="button" aria-label="Azalt" disabled={guests === 0} onClick={() => setGuests(g => g - 1)}>−</button>
                        <span>{guests}</span>
                        <button type="button" aria-label="Arttır" disabled={guests >= 30} onClick={() => setGuests(g => g + 1)}>+</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <button type="button" className="sh-hsubmit" onClick={submit} aria-label={SEARCH_LABEL[tab]}>
              <Search size={36} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="sh-container sh-promos">
        {PROMOS.map(p => (
          <div key={p.cta} className="sh-promo">
            <Image src={p.img} alt="" fill sizes="(max-width: 860px) 100vw, 402px" />
            <p className="sh-promo-title">
              {p.title[0]}
              <br />
              {p.title[1]}
            </p>
            <Link href={p.href} className="sh-btn sh-btn--white">
              {p.cta}
            </Link>
          </div>
        ))}
      </div>

      <DealBanner />

      {sheetOpen && (
        <TripSheet
          cruise={tab === 'cruise'}
          range={range}
          cabins={cabins}
          onClose={() => setSheetOpen(false)}
          onApply={(r, c) => {
            setRange(r)
            setCabins(c)
            setSheetOpen(false)
          }}
        />
      )}
    </section>
  )
}

/** Mobil: tarih (ve mavi yolculukta kabin) seçimi alttan açılan pencerede. */
function TripSheet({
  cruise,
  range,
  cabins,
  onClose,
  onApply,
}: {
  cruise: boolean
  range: DateRangeValue
  cabins: number
  onClose: () => void
  onApply: (range: DateRangeValue, cabins: number) => void
}) {
  const [r, setR] = useState(range)
  const [c, setC] = useState(cabins)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const title = cruise ? 'Tarih ve kabin' : 'Check-in ve check-out'
  const summary = r.start ? `${fmtDate(r.start)} — ${r.end ? fmtDate(r.end) : 'check-out seç'}` : 'Check-in tarihini seç'

  return createPortal(
    <div className="sh-modal-overlay" onClick={onClose}>
      <div className="sh-modal sh-hsheet" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <header className="sh-hsheet-head">
          <h2>{title}</h2>
          <button type="button" className="sh-icon-btn" onClick={onClose} aria-label="Kapat">
            <X size={20} />
          </button>
        </header>
        <div className="sh-modal-body">
          {cruise && (
            <div className="sh-hsheet-row">
              <span>
                <b>Kabin</b>
                <small>En az bu kadar kabini olan tekneler</small>
              </span>
              <div className="sh-stepper sh-stepper--sm">
                <button type="button" aria-label="Azalt" disabled={c === 0} onClick={() => setC(n => n - 1)}>
                  <Minus size={15} />
                </button>
                <span>
                  <b>{c}</b>
                </span>
                <button type="button" aria-label="Arttır" disabled={c >= MAX_CABINS} onClick={() => setC(n => n + 1)}>
                  <Plus size={15} />
                </button>
              </div>
            </div>
          )}
          <p className="sh-hsheet-label">{summary}</p>
          <RangeCalendar value={r} onChange={setR} />
        </div>
        <footer className="sh-modal-foot">
          <button
            type="button"
            className="sh-link-btn"
            onClick={() => {
              setR({ start: null, end: null })
              setC(0)
            }}
          >
            Temizle
          </button>
          <button type="button" className="sh-btn sh-btn--navy" onClick={() => onApply(r, c)}>
            Tamam
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
