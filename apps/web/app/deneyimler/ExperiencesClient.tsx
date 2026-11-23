'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, Info, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react'
import ExperienceListCard from '@/components/experience/ExperienceListCard'
import { CAPTAIN_APP_URL } from '@/lib/siteLinks'
import {
  ALL_EXPERIENCES,
  EXPERIENCE_GROUPS,
  EXPERIENCE_TYPES,
  groupBySlug,
  groupOf,
  groupOfType,
  typeBySlug,
  type ExperienceType,
} from '@/lib/content/experienceTypes'
import { categoryLabel, type ExperienceCard } from '@/lib/experienceFormat'
import { CheckRow, Counter, RangeFilter, Toggle, niceBounds, type Range } from '../tekne-kiralama/RentalClient'

type Sort = 'recommended' | 'price-asc' | 'price-desc' | 'duration'
const SORTS: { value: Sort; label: string }[] = [
  { value: 'recommended', label: 'Önerilen' },
  { value: 'price-asc', label: 'Fiyat: Düşükten yükseğe' },
  { value: 'price-desc', label: 'Fiyat: Yüksekten düşüğe' },
  { value: 'duration', label: 'Süre: Kısadan uzuna' },
]

type Duration = 'all' | 'short' | 'half' | 'long'
const DURATIONS: { value: Duration; label: string; test: (m: number) => boolean }[] = [
  { value: 'all', label: 'Tüm süreler', test: () => true },
  { value: 'short', label: '3 saate kadar', test: m => m <= 180 },
  { value: 'half', label: '3–6 saat', test: m => m > 180 && m <= 360 },
  { value: 'long', label: '6 saatten uzun', test: m => m > 360 },
]

interface Filters {
  duration: Duration
  price: Range
  freeCancel: boolean
  pickup: boolean
  guests: number
}

/** Sayfanın dört ana başlığı (fotoğraflı kartlar): Tüm deneyimler + gruplar. */
const HEADINGS: { slug: string; label: string; image: string }[] = [
  { slug: ALL_EXPERIENCES.slug, label: ALL_EXPERIENCES.label, image: ALL_EXPERIENCES.image },
  ...EXPERIENCE_GROUPS.map(g => ({ slug: g.slug, label: g.label, image: g.image })),
]

/**
 * "Tüm deneyimler" altındaki tür çipleri, grup sırasıyla. Tek türlü grup
 * (Özel tekne) zaten bir ana başlık olduğu için ayrıca çip olmaz.
 */
const ALL_CHIP_TYPES: ExperienceType[] = [
  ...EXPERIENCE_GROUPS.filter(g => g.types.length > 1).flatMap(g => g.types),
  ...EXPERIENCE_TYPES.filter(t => !groupOfType(t.slug)).map(t => t.slug),
]
  .map(slug => typeBySlug(slug))
  .filter((t): t is ExperienceType => !!t)

const norm = (s: string) => s.toLocaleLowerCase('tr').trim()
const priceStep = (r: Range) => (r[1] - r[0] <= 2000 ? 50 : r[1] - r[0] <= 10000 ? 100 : 500)
const isFull = (r: Range, b: Range) => r[0] <= b[0] && r[1] >= b[1]
const inType = (e: ExperienceCard, t: ExperienceType | null) => !t || e.categories.some(c => t.categories.includes(c))

interface Props {
  experiences: ExperienceCard[]
  /** ?tur= ile gelen ana başlık (yoksa tüm deneyimler) */
  initialGroup: string | null
  /** ?tur= eski bir tür bağlantısıysa, başlığın altında seçili çip */
  initialType: string | null
  /** ?q= ya da ana sayfa aramasından gelen ?city= */
  initialQuery: string
}

/**
 * Deneyimler sayfası (GetYourGuide liste düzeni): başlık ve arama, dört ana
 * başlık (Tüm deneyimler · Özel tekne · Geziler · Aktiviteler), tür ve filtre
 * çipleri, sonuç sayısı ve kart ızgarası.
 */
export default function ExperiencesClient({ experiences, initialGroup, initialType, initialQuery }: Props) {
  const bounds = useMemo(() => {
    const prices = experiences.map(e => e.basePrice).filter(p => p > 0)
    const raw = niceBounds(prices, 10)
    return {
      price: niceBounds(prices, priceStep(raw)),
      currency: experiences[0]?.currency ?? 'TRY',
      maxGuests: Math.max(12, ...experiences.map(e => e.maxParticipants)),
    }
  }, [experiences])

  const blank = useMemo<Filters>(() => ({ duration: 'all', price: bounds.price, freeCancel: false, pickup: false, guests: 0 }), [bounds])
  const [groupSlug, setGroupSlug] = useState<string | null>(groupBySlug(initialGroup)?.slug ?? null)
  const [typeSlug, setTypeSlug] = useState<string | null>(typeBySlug(initialType)?.slug ?? null)
  const [q, setQ] = useState(initialQuery)
  const [f, setF] = useState<Filters>(blank)
  const [sort, setSort] = useState<Sort>('recommended')
  const [sortOpen, setSortOpen] = useState(false)
  const [modal, setModal] = useState(false)
  const [edges, setEdges] = useState({ left: false, right: false })
  const sortRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const chipsRef = useRef<HTMLDivElement>(null)

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setF(cur => ({ ...cur, [key]: value }))
  const activeGroup = groupBySlug(groupSlug)
  const activeType = typeBySlug(typeSlug)
  const activeSlug = activeGroup?.slug ?? ALL_EXPERIENCES.slug

  /* ---------- adres çubuğu ve sekme başlığı ---------- */
  useEffect(() => {
    const qs = new URLSearchParams()
    const tur = typeSlug ?? groupSlug
    if (tur) qs.set('tur', tur)
    if (q.trim()) qs.set('q', q.trim())
    window.history.replaceState(null, '', `${window.location.pathname}${qs.toString() ? `?${qs}` : ''}`)
    document.title = activeType ? `${activeType.label} — Ahoy` : activeGroup ? `${activeGroup.label} — Ahoy deneyimleri` : 'Deneyimler — Ahoy'
  }, [typeSlug, groupSlug, q, activeType, activeGroup])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => {
    if (!modal) return
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setModal(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [modal])

  /* ---------- ana başlıklar ---------- */
  const selectGroup = (slug: string) => {
    setGroupSlug(slug === ALL_EXPERIENCES.slug ? null : slug)
    setTypeSlug(null)
  }

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = HEADINGS.length - 1
    const next =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1) : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? last : null
    if (next == null) return
    e.preventDefault()
    selectGroup(HEADINGS[next]!.slug)
    tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  /* ---------- liste ---------- */
  const inGroup = useMemo(
    () => (activeGroup ? experiences.filter(e => groupOf(e)?.slug === activeGroup.slug) : experiences),
    [experiences, activeGroup],
  )

  /** Başlığın altındaki tür çipleri: yalnızca deneyimi olan türler (seçili olan her zaman görünür). */
  const typeChips = useMemo(() => {
    if (activeGroup && activeGroup.types.length < 2) return []
    const pool = activeGroup ? activeGroup.types.map(slug => typeBySlug(slug)).filter((t): t is ExperienceType => !!t) : ALL_CHIP_TYPES
    return pool.filter(t => t.slug === typeSlug || inGroup.some(e => inType(e, t)))
  }, [activeGroup, inGroup, typeSlug])

  const scoped = useMemo(() => inGroup.filter(e => inType(e, activeType)), [inGroup, activeType])
  const hasFreeCancel = scoped.some(e => e.freeCancellation)
  const hasPickup = scoped.some(e => e.pickup)

  const filtered = useMemo(() => {
    const nq = norm(q)
    const dur = DURATIONS.find(d => d.value === f.duration) ?? DURATIONS[0]!
    const list = scoped.filter(e => {
      if (nq && ![e.title, e.shortDescription, e.place ?? '', categoryLabel(e.category) ?? ''].some(t => norm(t).includes(nq))) return false
      if (!dur.test(e.durationMinutes)) return false
      if (!isFull(f.price, bounds.price) && (e.basePrice < f.price[0] || e.basePrice > f.price[1])) return false
      if (f.freeCancel && !e.freeCancellation) return false
      if (f.pickup && !e.pickup) return false
      if (f.guests && e.maxParticipants < f.guests) return false
      return true
    })
    switch (sort) {
      case 'price-asc':
        return [...list].sort((a, b) => a.basePrice - b.basePrice)
      case 'price-desc':
        return [...list].sort((a, b) => b.basePrice - a.basePrice)
      case 'duration':
        return [...list].sort((a, b) => a.durationMinutes - b.durationMinutes)
      default:
        return list
    }
  }, [scoped, q, f, bounds, sort])

  /* ---------- çip şeridi: taşarsa kenarda ok ---------- */
  useEffect(() => {
    const el = chipsRef.current
    if (!el) return
    const update = () => setEdges({ left: el.scrollLeft > 8, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [typeChips.length, hasFreeCancel, hasPickup, inGroup.length])

  const scrollChips = (dir: number) => {
    const el = chipsRef.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' })
  }

  const moneyFmt = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: bounds.currency, maximumFractionDigits: 0 }).format(n)
  const priceOn = !isFull(f.price, bounds.price)
  const durationOn = DURATIONS.find(d => d.value === f.duration && d.value !== 'all')
  const activeFilters = [durationOn, priceOn, f.freeCancel, f.pickup, f.guests > 0].filter(Boolean).length
  const reset = () => {
    setF(blank)
    setQ('')
    setTypeSlug(null)
  }
  const hasSample = experiences.some(e => e.sample)
  /** Başlık kartlarındaki sayılar: tüm deneyimler üzerinden, filtrelerden bağımsız. */
  const headingCounts = useMemo(() => {
    const counts: Record<string, number> = { [ALL_EXPERIENCES.slug]: experiences.length }
    for (const e of experiences) {
      const g = groupOf(e)
      if (g) counts[g.slug] = (counts[g.slug] ?? 0) + 1
    }
    return counts
  }, [experiences])
  const headingEmpty = inGroup.length === 0
  const scopeLabel = activeType?.label ?? activeGroup?.label ?? ALL_EXPERIENCES.label

  return (
    <div className="sh-home sh-xh">
      {/* ---------- başlık, arama ve dört ana başlık ---------- */}
      <section className="sh-xh-top">
        <div className="sh-container">
          <nav className="sh-crumbs" aria-label="Sayfa yolu">
            <Link href="/">Ana sayfa</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Deneyimler</span>
          </nav>

          <div className="sh-xh-title-row">
            <h1>Deneyimler</h1>
            <form className="sh-xh-search" role="search" onSubmit={e => e.preventDefault()}>
              <Search size={20} strokeWidth={2} aria-hidden="true" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Deneyim, koy ya da şehir ara" aria-label="Deneyim, koy ya da şehir ara" />
              {q && (
                <button type="button" className="sh-xh-search-clear" onClick={() => setQ('')} aria-label="Aramayı temizle">
                  <X size={16} strokeWidth={2.4} />
                </button>
              )}
              <button type="submit" className="sh-btn sh-btn--navy">
                Ara
              </button>
            </form>
          </div>

          <div className="sh-xh-cards" ref={tabsRef} role="tablist" aria-label="Deneyim başlıkları">
            {HEADINGS.map((h, i) => {
              const on = h.slug === activeSlug
              const count = headingCounts[h.slug] ?? 0
              return (
                <button
                  key={h.slug}
                  id={`xh-tab-${h.slug}`}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls="xh-results"
                  tabIndex={on ? 0 : -1}
                  className={`sh-xh-card${on ? ' is-on' : ''}`}
                  onClick={() => selectGroup(h.slug)}
                  onKeyDown={e => onTabKey(e, i)}
                >
                  <Image src={h.image} alt="" fill sizes="(max-width: 860px) 46vw, 310px" />
                  <span className="sh-xh-card-text">
                    <span className="sh-xh-card-label">{h.label}</span>
                    <span className="sh-xh-card-count">{count > 0 ? `${count} deneyim` : 'Henüz yok'}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------- seçili başlığın listesi ---------- */}
      <section className="sh-xh-results" id="xh-results" role="tabpanel" aria-labelledby={`xh-tab-${activeSlug}`}>
        <div className="sh-container">
          {headingEmpty ? (
            <div className="sh-xh-empty">
              <h2>Bu başlıkta henüz deneyim yok</h2>
              <p>{activeGroup?.desc} Kaptanlar bu başlıkta deneyim ekleyip yayına aldığında burada listelenecek.</p>
              <div className="sh-xh-empty-actions">
                {experiences.length > 0 && (
                  <button type="button" className="sh-btn sh-btn--navy" onClick={() => selectGroup(ALL_EXPERIENCES.slug)}>
                    Tüm deneyimleri gör
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className={`sh-xh-chips-wrap${edges.left ? ' is-fade-l' : ''}${edges.right ? ' is-fade-r' : ''}`}>
                {edges.left && (
                  <button type="button" className="sh-xh-chips-arrow is-left" onClick={() => scrollChips(-1)} aria-label="Önceki filtreler">
                    <ChevronLeft size={18} strokeWidth={2.4} />
                  </button>
                )}
                <div className="sh-xh-chips" ref={chipsRef} role="group" aria-label="Türler ve filtreler">
                  <button type="button" className="sh-xh-chip sh-xh-chip--filters" onClick={() => setModal(true)}>
                    <SlidersHorizontal size={17} strokeWidth={2} aria-hidden="true" /> Filtreler
                    {activeFilters > 0 && <span className="sh-xh-badge">{activeFilters}</span>}
                  </button>
                  {typeChips.map(t => {
                    const on = t.slug === typeSlug
                    return (
                      <button key={t.slug} type="button" className={`sh-xh-chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => setTypeSlug(on ? null : t.slug)}>
                        {t.label}
                      </button>
                    )
                  })}
                  {typeChips.length > 0 && (hasFreeCancel || hasPickup || activeFilters > 0) && <span className="sh-xh-chip-sep" aria-hidden="true" />}
                  {hasFreeCancel && (
                    <button type="button" className={`sh-xh-chip${f.freeCancel ? ' is-on' : ''}`} aria-pressed={f.freeCancel} onClick={() => set('freeCancel', !f.freeCancel)}>
                      Ücretsiz iptal
                    </button>
                  )}
                  {hasPickup && (
                    <button type="button" className={`sh-xh-chip${f.pickup ? ' is-on' : ''}`} aria-pressed={f.pickup} onClick={() => set('pickup', !f.pickup)}>
                      Otelden alınma
                    </button>
                  )}
                  {durationOn && (
                    <button type="button" className="sh-xh-chip is-on" onClick={() => set('duration', 'all')}>
                      {durationOn.label} <X size={14} strokeWidth={2.4} aria-label="Kaldır" />
                    </button>
                  )}
                  {priceOn && (
                    <button type="button" className="sh-xh-chip is-on" onClick={() => set('price', bounds.price)}>
                      {moneyFmt(f.price[0])} – {moneyFmt(f.price[1])} <X size={14} strokeWidth={2.4} aria-label="Kaldır" />
                    </button>
                  )}
                  {f.guests > 0 && (
                    <button type="button" className="sh-xh-chip is-on" onClick={() => set('guests', 0)}>
                      {f.guests}+ kişi <X size={14} strokeWidth={2.4} aria-label="Kaldır" />
                    </button>
                  )}
                </div>
                {edges.right && (
                  <button type="button" className="sh-xh-chips-arrow is-right" onClick={() => scrollChips(1)} aria-label="Sonraki filtreler">
                    <ChevronRight size={18} strokeWidth={2.4} />
                  </button>
                )}
              </div>

              <div className="sh-xh-countrow">
                <p className="sh-xh-count" aria-live="polite">
                  {q.trim() ? (
                    <>
                      “{q.trim()}” için <b>{filtered.length}</b> sonuç
                    </>
                  ) : (
                    <>
                      <b>{filtered.length}</b> sonuç: {scopeLabel}
                    </>
                  )}
                </p>
                <div className="sh-xh-sort" ref={sortRef}>
                  <button type="button" className="sh-xh-sort-btn" onClick={() => setSortOpen(o => !o)} aria-haspopup="listbox" aria-expanded={sortOpen}>
                    <span>
                      Sırala: <b>{SORTS.find(s => s.value === sort)?.label}</b>
                    </span>
                    <ChevronDown size={16} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                  {sortOpen && (
                    <ul className="sh-pop sh-pop-list sh-xh-sort-list" role="listbox" aria-label="Sıralama">
                      {SORTS.map(s => (
                        <li key={s.value}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={sort === s.value}
                            className="sh-pop-item sh-xh-sort-item"
                            onClick={() => {
                              setSort(s.value)
                              setSortOpen(false)
                            }}
                          >
                            <b>{s.label}</b>
                            {sort === s.value && <Check size={16} aria-hidden="true" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {hasSample && (
                <div className="sh-xh-note" role="note">
                  <Info size={18} strokeWidth={2} aria-hidden="true" />
                  <p>
                    Yayında henüz deneyim yok. Aşağıdaki <b>örnek deneyimler</b>, kaptanların ekleyeceği deneyimlerin nasıl görüneceğini gösterir;
                    rezervasyona kapalıdır.
                  </p>
                </div>
              )}

              {filtered.length > 0 ? (
                <div className="sh-xc-grid">
                  {filtered.map(e => (
                    <ExperienceListCard key={e.id} exp={e} />
                  ))}
                </div>
              ) : (
                <div className="sh-xh-empty">
                  <h2>{q.trim() ? `“${q.trim()}” için uygun deneyim bulunamadı` : 'Seçtiğin filtrelere uygun deneyim yok'}</h2>
                  <p>Filtreleri gevşetmeyi ya da farklı bir arama yapmayı deneyebilirsin.</p>
                  <div className="sh-xh-empty-actions">
                    <button type="button" className="sh-btn sh-btn--navy" onClick={reset}>
                      <RotateCcw size={16} aria-hidden="true" /> Filtreleri temizle
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <p className="sh-xh-captain">
            <span>
              <b>Deneyim düzenleyen bir kaptan mısın?</b> Turunu ya da aktiviteni Kaptan Paneli’nden ekle; onaylanınca burada listelenir.
            </span>
            <a href={CAPTAIN_APP_URL}>
              Kaptan Paneli’ne git <ArrowUpRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </a>
          </p>
        </div>
      </section>

      {modal &&
        createPortal(
          <div className="sh-modal-overlay" onClick={() => setModal(false)}>
            <div className="sh-modal sh-xh-modal" role="dialog" aria-modal="true" aria-labelledby="xh-modal-title" onClick={e => e.stopPropagation()}>
              <header className="sh-xh-modal-head">
                <button type="button" className="sh-icon-btn" onClick={() => setModal(false)} aria-label="Kapat">
                  <X size={20} />
                </button>
                <h2 id="xh-modal-title">Filtreler</h2>
                <span aria-hidden="true" />
              </header>
              <div className="sh-modal-body">
                <div className="sh-flt">
                  <section className="sh-flt-sec">
                    <h3>Süre</h3>
                    <div className="sh-check-list">
                      {DURATIONS.map(d => (
                        <CheckRow key={d.value} radio on={f.duration === d.value} label={d.label} onClick={() => set('duration', d.value)} />
                      ))}
                    </div>
                  </section>
                  {bounds.price[1] > bounds.price[0] && (
                    <section className="sh-flt-sec">
                      <h3>Fiyat aralığı</h3>
                      <RangeFilter
                        bounds={bounds.price}
                        step={priceStep(bounds.price)}
                        value={f.price}
                        onChange={v => set('price', v)}
                        format={moneyFmt}
                        unit={bounds.currency === 'EUR' ? '€' : bounds.currency === 'TRY' ? '₺' : bounds.currency}
                        plusAtMax
                      />
                    </section>
                  )}
                  <section className="sh-flt-sec">
                    <Counter label="Kişi sayısı" value={f.guests} max={bounds.maxGuests} onChange={v => set('guests', v)} />
                  </section>
                  {(hasFreeCancel || hasPickup) && (
                    <section className="sh-flt-sec">
                      {hasFreeCancel && (
                        <Toggle on={f.freeCancel} onChange={v => set('freeCancel', v)} label="Ücretsiz iptal" hint="24 ya da 48 saat öncesine kadar ücretsiz iptal" />
                      )}
                      {hasPickup && (
                        <Toggle on={f.pickup} onChange={v => set('pickup', v)} label="Otelden alınma" hint="Kaptanın otelden alınma hizmeti sunduğu deneyimler" />
                      )}
                    </section>
                  )}
                </div>
              </div>
              <footer className="sh-modal-foot">
                <button type="button" className="sh-link-btn" onClick={() => setF(blank)}>
                  Temizle
                </button>
                <button type="button" className="sh-btn sh-btn--navy" onClick={() => setModal(false)}>
                  {filtered.length} deneyimi göster
                </button>
              </footer>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
