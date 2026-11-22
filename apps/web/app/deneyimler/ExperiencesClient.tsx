'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  Anchor,
  ArrowDownWideNarrow,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  RotateCcw,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react'
import ExperienceListCard from '@/components/experience/ExperienceListCard'
import SeaEdge from '@/components/experience/SeaEdge'
import { typeIcon } from '@/components/experience/typeIcons'
import { CAPTAIN_APP_URL } from '@/lib/siteLinks'
import { ALL_EXPERIENCES, EXPERIENCE_TYPES, typeBySlug, type ExperienceType } from '@/lib/content/experienceTypes'
import { categoryLabel, money, priceUnitLabel, type ExperienceCard } from '@/lib/experienceFormat'
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

interface Tab {
  slug: string
  label: string
  image: string
  word?: string
  count: number
}

/** Manşetteki kelimenin değişme aralığı (ms). */
const WORD_EVERY = 2600

const norm = (s: string) => s.toLocaleLowerCase('tr').trim()
const priceStep = (r: Range) => (r[1] - r[0] <= 2000 ? 50 : r[1] - r[0] <= 10000 ? 100 : 500)
const isFull = (r: Range, b: Range) => r[0] <= b[0] && r[1] >= b[1]
const inType = (e: ExperienceCard, t: ExperienceType | null) => !t || e.categories.some(c => t.categories.includes(c))

/** "gün batımı, koy turu ve şnorkel" */
const joinWords = (list: string[]) => (list.length < 2 ? list.join('') : `${list.slice(0, -1).join(', ')} ve ${list[list.length - 1]}`)

/** Akış bugünkü sürece göre: deneyim talebi WhatsApp destek hattına gider, gönderirken ödeme alınmaz. */
const HOW = [
  { icon: Search, title: 'Deneyimini seç', text: 'Türlere göz at; süreye, fiyata ve ücretsiz iptale göre süz.' },
  { icon: CalendarDays, title: 'Gününü ve kişi sayını belirle', text: 'Tahmini tutarı ve ücretsiz iptalin son gününü hemen gör.' },
  { icon: Send, title: 'Talebini gönder', text: 'Talebin hazır bir mesajla WhatsApp destek hattımıza gider; gönderirken ödeme yapmazsın.' },
]

interface Props {
  experiences: ExperienceCard[]
  /** ?tur= ile gelen deneyim türü (yoksa tümü) */
  initialType: string | null
  /** ?q= ya da ana sayfa aramasından gelen ?city= */
  initialQuery: string
}

/**
 * Deneyimler ana sayfası: üstte arama, ardından kart görünümlü tür sekmeleri
 * (günlük turlar, gün batımı, su sporları…) ve seçilen türün deneyim listesi.
 */
export default function ExperiencesClient({ experiences, initialType, initialQuery }: Props) {
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
  const [typeSlug, setTypeSlug] = useState<string | null>(typeBySlug(initialType)?.slug ?? null)
  const [q, setQ] = useState(initialQuery)
  const [f, setF] = useState<Filters>(blank)
  const [sort, setSort] = useState<Sort>('recommended')
  const [sortOpen, setSortOpen] = useState(false)
  const [modal, setModal] = useState(false)
  const [edges, setEdges] = useState({ left: false, right: false })
  const sortRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const typesRef = useRef<HTMLElement>(null)
  const resultsRef = useRef<HTMLElement>(null)

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setF(cur => ({ ...cur, [key]: value }))
  const activeType = typeBySlug(typeSlug)

  /* ---------- tür sekmeleri: sayılar tüm deneyimler üzerinden, filtrelerden bağımsız ---------- */
  const tabs = useMemo<Tab[]>(() => {
    const list = EXPERIENCE_TYPES.map(t => ({ type: t, count: experiences.filter(e => inType(e, t)).length }))
    return [
      { slug: ALL_EXPERIENCES.slug, label: ALL_EXPERIENCES.label, image: ALL_EXPERIENCES.image, count: experiences.length },
      ...list
        .filter(({ type, count }) => !type.hideWhenEmpty || count > 0 || type.slug === typeSlug)
        .map(({ type, count }) => ({ slug: type.slug, label: type.label, image: type.image, word: type.word, count })),
    ]
  }, [experiences, typeSlug])
  const activeSlug = typeSlug ?? ALL_EXPERIENCES.slug
  const activeCount = tabs.find(t => t.slug === activeSlug)?.count ?? 0

  /* ---------- manşet: yalnızca deneyimi olan türlerin kelimeleri döner ---------- */
  const words = useMemo(() => tabs.filter(t => t.count > 0 && t.word).map(t => t.word!), [tabs])
  const [wordIndex, setWordIndex] = useState(0)
  useEffect(() => {
    if (words.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setWordIndex(i => (i + 1) % words.length), WORD_EVERY)
    return () => window.clearInterval(id)
  }, [words.length])
  const word = words[wordIndex % Math.max(1, words.length)] ?? 'yeni bir rota'
  const featured = experiences.find(e => e.photo) ?? null

  /* ---------- adres çubuğu ve sekme başlığı ---------- */
  useEffect(() => {
    const qs = new URLSearchParams()
    if (typeSlug) qs.set('tur', typeSlug)
    if (q.trim()) qs.set('q', q.trim())
    window.history.replaceState(null, '', `${window.location.pathname}${qs.toString() ? `?${qs}` : ''}`)
    document.title = activeType ? `${activeType.label} — Ahoy` : 'Deneyimler — Ahoy'
  }, [typeSlug, q, activeType])

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

  /* ---------- sekme şeridi: kaydırma okları, seçili kart görünür ---------- */
  useEffect(() => {
    const el = stripRef.current
    if (!el) return
    const update = () => setEdges({ left: el.scrollLeft > 8, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [tabs.length])

  useEffect(() => {
    const el = stripRef.current
    const active = el?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!el || !active) return
    const left = active.offsetLeft - el.offsetLeft
    if (left < el.scrollLeft || left + active.offsetWidth > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: left - (el.clientWidth - active.offsetWidth) / 2, behavior: 'smooth' })
    }
  }, [activeSlug])

  const scrollStrip = (dir: number) => {
    const el = stripRef.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  /** Liste ekranın altında kaldıysa sekme şeridini yukarı alır: sekmeler görünür kalır, sonuçlar altında açılır. */
  const selectType = (slug: string) => {
    setTypeSlug(slug === ALL_EXPERIENCES.slug ? null : slug)
    const results = resultsRef.current
    const types = typesRef.current
    if (!results || !types || results.getBoundingClientRect().top < window.innerHeight * 0.7) return
    const nav = document.querySelector('.sh-nav')?.getBoundingClientRect().height ?? 96
    window.scrollTo({ top: types.getBoundingClientRect().top + window.scrollY - nav - 8, behavior: 'smooth' })
  }

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1
    const next =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1) : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? last : null
    if (next == null) return
    e.preventDefault()
    selectType(tabs[next]!.slug)
    stripRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  /* ---------- liste ---------- */
  const scoped = useMemo(() => experiences.filter(e => inType(e, activeType)), [experiences, activeType])
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

  const moneyFmt = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: bounds.currency, maximumFractionDigits: 0 }).format(n)
  const priceOn = !isFull(f.price, bounds.price)
  const activeFilters = [f.duration !== 'all', priceOn, f.freeCancel, f.pickup, f.guests > 0].filter(Boolean).length
  const reset = () => {
    setF(blank)
    setQ('')
  }
  const hasSample = experiences.some(e => e.sample)
  const typeEmpty = activeCount === 0
  const heading = activeType?.label ?? ALL_EXPERIENCES.label
  const sub = activeType?.desc ?? ALL_EXPERIENCES.desc
  const HeadIcon = typeIcon(activeSlug)

  return (
    <div className="sh-home sh-xh">
      {/* ---------- üst: banner + arama ---------- */}
      <section className="sh-xh-hero">
        <div className="sh-container">
          <nav className="sh-crumbs" aria-label="Sayfa yolu">
            <Link href="/">Ana sayfa</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Deneyimler</span>
          </nav>
          <div className="sh-xh-banner">
            <Image src="/deneyimler/hero-deneyimler.webp" alt="" fill priority sizes="(max-width: 1280px) 100vw, 1280px" />
            <div className="sh-xh-banner-in">
              <p className="sh-xh-kicker">Ahoy deneyimleri</p>
              <h1>
                <span className="sr-only">Denizde {words.length ? joinWords(words) : 'yeni bir rota'} seni bekliyor</span>
                <span aria-hidden="true">
                  Denizde{' '}
                  <span className="sh-xh-rot">
                    <span key={word} className="sh-xh-rot-word">
                      {word}
                    </span>
                    <svg key={`s-${word}`} className="sh-xh-swoosh" viewBox="0 0 300 20" preserveAspectRatio="none">
                      <path d="M4 14 C 70 4, 190 2, 296 11" />
                    </svg>
                  </span>
                  <br />
                  seni bekliyor
                </span>
              </h1>
              <p className="sh-xh-lede">Kaptanların düzenlediği turları, aktiviteleri ve dersleri keşfet; gününü seç, talebini gönder.</p>
              <form
                className="sh-xh-search"
                role="search"
                onSubmit={e => {
                  e.preventDefault()
                  resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
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
            {featured && (
              <Link href={`/deneyimler/${featured.id}`} className="sh-xh-feature">
                <span className="sh-xh-feature-img">
                  <Image src={featured.photo!} alt="" fill sizes="88px" />
                </span>
                <span className="sh-xh-feature-body">
                  <small>{featured.sample ? 'Örnek deneyim' : 'Keşfetmeye buradan başla'}</small>
                  <b>{featured.title}</b>
                  {featured.basePrice > 0 && (
                    <span>
                      {money(featured.basePrice, featured.currency)} · {priceUnitLabel(featured.pricingType)}
                    </span>
                  )}
                </span>
                <span className="sh-xh-feature-go" aria-hidden="true">
                  <ArrowRight size={18} strokeWidth={2.4} />
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ---------- deneyim türleri (sekmeler) ---------- */}
      <section className="sh-xh-types sh-x-reveal" ref={typesRef} aria-labelledby="xh-types-title">
        <div className="sh-container">
          <div className="sh-xh-types-head">
            <h2 id="xh-types-title">Ne yapmak istersin?</h2>
            {(edges.left || edges.right) && (
              <div className="sh-xh-arrows">
                <button type="button" className="sh-xh-arrow" onClick={() => scrollStrip(-1)} disabled={!edges.left} aria-label="Önceki türler">
                  <ChevronLeft size={18} strokeWidth={2.4} />
                </button>
                <button type="button" className="sh-xh-arrow" onClick={() => scrollStrip(1)} disabled={!edges.right} aria-label="Sonraki türler">
                  <ChevronRight size={18} strokeWidth={2.4} />
                </button>
              </div>
            )}
          </div>
          <div className="sh-xt" ref={stripRef} role="tablist" aria-label="Deneyim türleri">
            {tabs.map((t, i) => {
              const on = t.slug === activeSlug
              const Icon = typeIcon(t.slug)
              const all = t.slug === ALL_EXPERIENCES.slug
              return (
                <button
                  key={t.slug}
                  id={`xt-${t.slug}`}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls="xh-results"
                  tabIndex={on ? 0 : -1}
                  className={`sh-xt-card${on ? ' is-on' : ''}${t.count === 0 ? ' is-empty' : ''}`}
                  onClick={() => selectType(t.slug)}
                  onKeyDown={e => onTabKey(e, i)}
                >
                  <span className={`sh-xt-img${all ? ' sh-xt-img--all' : ''}`}>
                    {all ? <Icon className="sh-xt-all-art" strokeWidth={1.1} aria-hidden="true" /> : <Image src={t.image} alt="" fill sizes="(max-width: 860px) 132px, 170px" />}
                    <span className="sh-xt-ico" aria-hidden="true">
                      <Icon size={16} strokeWidth={2.2} />
                    </span>
                    {on && (
                      <span className="sh-xt-check" aria-hidden="true">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                    <span className="sh-xt-cap">
                      <span className="sh-xt-label">{t.label}</span>
                      <span className="sh-xt-count">{t.count > 0 ? `${t.count} deneyim` : 'Henüz yok'}</span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------- seçilen türün listesi ---------- */}
      <section className="sh-xh-results" id="xh-results" ref={resultsRef} role="tabpanel" aria-labelledby={`xt-${activeSlug}`}>
        <div className="sh-container">
          <header className="sh-xh-head">
            <div>
              <h2>
                <span className="sh-xh-head-ico" aria-hidden="true">
                  <HeadIcon size={22} strokeWidth={2} />
                </span>
                {heading}
              </h2>
              <p>{sub}</p>
            </div>
            {!typeEmpty && (
              <p className="sh-xh-count" aria-live="polite">
                {filtered.length} deneyim
              </p>
            )}
          </header>

          {!typeEmpty && (
            <div className="sh-xh-bar">
              <div className="sh-xh-chips" role="group" aria-label="Filtreler">
                <button type="button" className="sh-xh-chip sh-xh-chip--more" onClick={() => setModal(true)}>
                  <SlidersHorizontal size={16} strokeWidth={2} aria-hidden="true" /> Filtreler
                  {activeFilters > 0 && <span className="sh-xh-badge">{activeFilters}</span>}
                </button>
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
                {DURATIONS.slice(1).map(d => (
                  <button
                    key={d.value}
                    type="button"
                    className={`sh-xh-chip${f.duration === d.value ? ' is-on' : ''}`}
                    aria-pressed={f.duration === d.value}
                    onClick={() => set('duration', f.duration === d.value ? 'all' : d.value)}
                  >
                    {d.label}
                  </button>
                ))}
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

              <div className="sh-xh-sort" ref={sortRef}>
                <button type="button" className="sh-xh-sort-btn" onClick={() => setSortOpen(o => !o)} aria-haspopup="listbox" aria-expanded={sortOpen}>
                  <ArrowDownWideNarrow size={16} strokeWidth={2} aria-hidden="true" />
                  <span>
                    Sırala: <b>{SORTS.find(s => s.value === sort)?.label}</b>
                  </span>
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
          )}

          {hasSample && !typeEmpty && (
            <div className="sh-xh-note" role="note">
              <Info size={20} strokeWidth={1.8} aria-hidden="true" />
              <p>
                Yayında henüz deneyim yok. Aşağıdaki <b>örnek deneyim</b>, kaptanların Kaptan Paneli’nden ekleyeceği deneyimlerin nasıl görüneceğini
                gösterir; rezervasyona kapalıdır.
              </p>
            </div>
          )}

          {typeEmpty ? (
            <div className="sh-xh-empty">
              <span className="sh-xh-empty-img">
                <Image src={activeType?.image ?? ALL_EXPERIENCES.image} alt="" fill sizes="160px" />
              </span>
              <h3>Bu türde henüz deneyim yok</h3>
              <p>Kaptanlar {activeType ? `“${activeType.label.toLocaleLowerCase('tr')}”` : 'bu türde'} deneyim ekleyip yayına aldığında burada listelenecek.</p>
              <div className="sh-xh-empty-actions">
                {experiences.length > 0 && (
                  <button type="button" className="sh-btn sh-btn--navy" onClick={() => selectType(ALL_EXPERIENCES.slug)}>
                    Tüm deneyimleri gör
                  </button>
                )}
                <a href={CAPTAIN_APP_URL} className="sh-btn sh-btn--white">
                  Deneyimini ekle <ArrowUpRight size={17} strokeWidth={2} aria-hidden="true" />
                </a>
              </div>
            </div>
          ) : filtered.length > 0 ? (
            <div className="sh-xc-grid">
              {filtered.map(e => (
                <ExperienceListCard key={e.id} exp={e} />
              ))}
            </div>
          ) : (
            <div className="sh-xh-empty">
              <span className="sh-xh-empty-ico">
                <Sparkles size={30} strokeWidth={1.6} />
              </span>
              <h3>{q.trim() ? `“${q.trim()}” için uygun deneyim bulunamadı` : 'Seçtiğin filtrelere uygun deneyim yok'}</h3>
              <p>Filtreleri gevşetmeyi ya da farklı bir arama yapmayı deneyebilirsin.</p>
              <div className="sh-xh-empty-actions">
                <button type="button" className="sh-btn sh-btn--navy" onClick={reset}>
                  <RotateCcw size={16} aria-hidden="true" /> Filtreleri temizle
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ---------- nasıl çalışır ---------- */}
      <section className="sh-xh-how sh-x-reveal" aria-labelledby="xh-how-title">
        <div className="sh-container">
          <div className="sh-xh-how-in">
            <p className="sh-xh-how-kicker">Nasıl çalışır?</p>
            <h2 id="xh-how-title">Üç adımda denize</h2>
            <ol className="sh-xh-steps">
              {HOW.map(({ icon: StepIcon, title, text }, i) => (
                <li key={title}>
                  <span className="sh-xh-step-ico">
                    <StepIcon size={24} strokeWidth={1.9} aria-hidden="true" />
                    <i aria-hidden="true">{i + 1}</i>
                  </span>
                  <b>{title}</b>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- kaptanlar için ---------- */}
      <section className="sh-xh-cta sh-x-reveal" aria-labelledby="xh-cta-title">
        <div className="sh-container">
          <div className="sh-xh-cta-in">
            <div className="sh-xh-cta-text">
              <p className="sh-xh-cta-kicker">
                <Anchor size={15} strokeWidth={2.4} aria-hidden="true" /> Kaptanlar için
              </p>
              <h2 id="xh-cta-title">Deneyimini Ahoy’da yayınla.</h2>
              <p>Düzenlediğin turu, aktiviteyi ya da dersi Kaptan Paneli’nden ekle; onaylanıp yayına alındığında bu sayfada listelenir.</p>
              <a href={CAPTAIN_APP_URL} className="sh-btn sh-btn--white">
                Kaptan Paneli’ne git <ArrowUpRight size={18} strokeWidth={2} aria-hidden="true" />
              </a>
            </div>
            <div className="sh-xh-cta-art" aria-hidden="true">
              <span className="sh-xh-polaroid sh-xh-polaroid--a">
                <span>
                  <Image src="/deneyimler/turler/dersler.webp" alt="" fill sizes="170px" />
                </span>
              </span>
              <span className="sh-xh-polaroid sh-xh-polaroid--b">
                <span>
                  <Image src="/deneyimler/turler/ozel-deneyimler.webp" alt="" fill sizes="170px" />
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <SeaEdge />

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
