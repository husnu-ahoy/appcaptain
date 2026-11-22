'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessagesSquare } from 'lucide-react'
import { toBoatDetailViewModel, type BookingDTO, type GuestConversationDTO } from '@ahoy/shared'
import { fetchBoat, fetchMyBookings, fetchMyConversations } from '@/lib/api'
import { useSessionUser } from '@/lib/favorites'
import { bookingStatus, formatRangeShort } from '@/lib/bookingDisplay'
import AccountGate, { AccountLoading } from '@/components/account/AccountGate'
import { MessagesArt } from '@/components/account/AccountArt'
import InboxThread from './InboxThread'
import InboxDetails, { type BoatInfo } from './InboxDetails'

const POLL_MS = 15_000
/** Liste küçük resimleri için en fazla bu kadar ilan indirilir. */
const MAX_BOAT_FETCH = 20
/** Bu genişlikte detay paneli konuşmanın yanında açık başlar. */
const WIDE_QUERY = '(min-width: 1280px)'

type Filter = 'all' | 'booking' | 'inquiry'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'booking', label: 'Rezervasyonlar' },
  { key: 'inquiry', label: 'Sorular' },
]

function listTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric', year: '2-digit' })
}

export default function InboxClient() {
  const router = useRouter()
  const params = useSearchParams()
  const activeId = params.get('c')
  const { user, ready } = useSessionUser()

  const [convs, setConvs] = useState<GuestConversationDTO[] | null>(null)
  const [listError, setListError] = useState(false)
  const [bookings, setBookings] = useState<Map<string, BookingDTO>>(() => new Map())
  const [boats, setBoats] = useState<Map<string, BoatInfo | null>>(() => new Map())
  const [filter, setFilter] = useState<Filter>('all')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const requestedBoats = useRef(new Set<string>())

  // Geniş ekranda detay paneli açık başlar (Airbnb'deki gibi); dar ekranda istenince açılır.
  useEffect(() => {
    setDetailsOpen(window.matchMedia(WIDE_QUERY).matches)
  }, [])

  const loadList = useCallback(async () => {
    try {
      setConvs(await fetchMyConversations())
      setListError(false)
    } catch {
      setListError(true)
    }
  }, [])

  const loadBookings = useCallback(async () => {
    const items = await fetchMyBookings()
    setBookings(new Map(items.map(b => [b.id, b])))
  }, [])

  useEffect(() => {
    if (!user) return
    void loadList()
    void loadBookings()
    const t = window.setInterval(() => void loadList(), POLL_MS)
    return () => window.clearInterval(t)
  }, [user, loadList, loadBookings])

  // Kaptan bir talebi onaylayınca (durum değişince) ücret gibi ayrıntılar için rezervasyonları tazele.
  const bookingsRef = useRef(bookings)
  bookingsRef.current = bookings
  useEffect(() => {
    if (!convs) return
    const stale = convs.some(c => c.booking && bookingsRef.current.get(c.booking.id)?.status !== c.booking.status)
    if (stale) void loadBookings()
  }, [convs, loadBookings])

  const coverOf = useCallback(
    (c: GuestConversationDTO): string | null =>
      (c.booking ? bookings.get(c.booking.id)?.boat?.coverPhoto : null) ?? (c.boatId ? boats.get(c.boatId)?.model.gallery[0]?.url : null) ?? null,
    [bookings, boats],
  )

  // İlan bilgileri: açık konuşmanınki (detay paneli) + fotoğrafı bilinmeyenlerin küçük resimleri.
  useEffect(() => {
    if (!convs) return
    const wanted: string[] = []
    const active = convs.find(c => c.id === activeId)
    if (active?.boatId) wanted.push(active.boatId)
    for (const c of convs) {
      if (wanted.length >= MAX_BOAT_FETCH) break
      if (c.boatId && !wanted.includes(c.boatId) && !(c.booking && bookings.get(c.booking.id)?.boat?.coverPhoto)) wanted.push(c.boatId)
    }
    const fresh = wanted.filter(id => !requestedBoats.current.has(id))
    if (fresh.length === 0) return
    fresh.forEach(id => requestedBoats.current.add(id))
    void Promise.all(
      fresh.map(async id => {
        const boat = await fetchBoat(id)
        const info: BoatInfo | null = boat ? { model: toBoatDetailViewModel(boat), owner: boat.owner ?? null } : null
        return [id, info] as const
      }),
    ).then(entries => setBoats(prev => new Map([...prev, ...entries])))
  }, [convs, activeId, bookings])

  // Listeden konuşma açmak geçmişe eklenir: telefonda geri tuşu listeye döner.
  const openedFromList = useRef(false)
  const select = (id: string | null) => {
    if (id && !window.matchMedia(WIDE_QUERY).matches) setDetailsOpen(false)
    const url = id ? `/mesajlarim?c=${encodeURIComponent(id)}` : '/mesajlarim'
    if (id && !activeId) {
      openedFromList.current = true
      router.push(url, { scroll: false })
    } else if (!id && openedFromList.current) {
      openedFromList.current = false
      router.back()
    } else {
      router.replace(url, { scroll: false })
    }
  }

  const counts = useMemo(() => {
    const list = convs ?? []
    return { all: list.length, booking: list.filter(c => c.booking).length, inquiry: list.filter(c => !c.booking).length }
  }, [convs])

  if (!ready) return <AccountLoading />

  if (!user) {
    return (
      <div className="sh-acc-page">
        <AccountGate art={<MessagesArt />} title="Mesajlar" text="Kaptanlarla yazışmalarını ve rezervasyon taleplerini görmek için giriş yap." />
      </div>
    )
  }

  if (convs && convs.length === 0) {
    return (
      <div className="sh-acc-page">
        <div className="sh-container">
          <header className="sh-acc-head">
            <h1>Mesajlar</h1>
          </header>
          <div className="sh-acc-empty">
            <div className="sh-acc-art" aria-hidden="true">
              <MessagesArt />
            </div>
            <h2>Henüz mesajın yok</h2>
            <p>İlan sayfasındaki “Kaptana mesaj gönder” ile soru sorduğunda ya da rezervasyon talebi gönderdiğinde yazışmaların burada görünür.</p>
            <Link href="/tekne-kiralama" className="sh-acc-cta">
              Tekneleri keşfet
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const visible = (convs ?? []).filter(c => filter === 'all' || (filter === 'booking' ? !!c.booking : !c.booking))
  const active = convs?.find(c => c.id === activeId) ?? null
  const activeBooking = active?.booking ? bookings.get(active.booking.id) : undefined
  const activeBoat = active?.boatId ? boats.get(active.boatId) : undefined

  return (
    <div className="sh-ib-page">
      <div className={`sh-ib${activeId ? ' has-thread' : ''}${activeId && detailsOpen ? ' has-details' : ''}`}>
        <aside className="sh-ib-list" aria-label="Konuşmalar">
          <header className="sh-ib-list-head">
            <h1>Mesajlar</h1>
            <div className="sh-ib-filters" role="group" aria-label="Konuşmaları süz">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  type="button"
                  className={filter === f.key ? 'is-on' : undefined}
                  aria-pressed={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  disabled={f.key !== 'all' && counts[f.key] === 0}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </header>

          <div className="sh-ib-rows">
            {convs === null ? (
              listError ? (
                <div className="sh-ib-none">
                  <p>Mesajların yüklenemedi.</p>
                  <button type="button" className="sh-ibd-link" onClick={() => void loadList()}>
                    Tekrar dene
                  </button>
                </div>
              ) : (
                Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="sh-ib-row is-skel" aria-hidden="true">
                    <span className="sh-ib-thumb" />
                    <span className="sh-ib-row-main">
                      <i />
                      <i />
                    </span>
                  </div>
                ))
              )
            ) : visible.length === 0 ? (
              <p className="sh-ib-none">Bu filtrede konuşma yok.</p>
            ) : (
              visible.map(c => {
                const isActive = c.id === activeId
                const photo = coverOf(c)
                const name = c.boat?.name ?? 'Tekne'
                const status = c.booking ? bookingStatus(c.booking.status) : null
                const city = c.boatId ? boats.get(c.boatId)?.model.location?.city : null
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`sh-ib-row${isActive ? ' is-active' : ''}`}
                    onClick={() => select(c.id)}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <span className="sh-ib-thumb">
                      {photo ? <Image src={photo} alt="" fill sizes="64px" /> : <span aria-hidden="true">{name.charAt(0).toLocaleUpperCase('tr')}</span>}
                    </span>
                    <span className="sh-ib-row-main">
                      <span className="sh-ib-row-top">
                        <b>{name}</b>
                        <time dateTime={c.lastAt}>{listTime(c.lastAt)}</time>
                      </span>
                      <span className="sh-ib-row-msg">{c.lastMessage ?? (c.booking ? 'Rezervasyon talebi gönderildi' : 'Yeni konuşma')}</span>
                      <span className="sh-ib-row-meta">
                        {status && c.booking ? (
                          <>
                            <i className={`sh-ib-dot is-${status.tone}`} aria-hidden="true" />
                            {status.label} · {formatRangeShort(c.booking.startDate, c.booking.endDate)}
                          </>
                        ) : (
                          <>Soru{city ? ` · ${city}` : ''}</>
                        )}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <section className="sh-ib-thread" aria-label="Konuşma">
          {activeId ? (
            <InboxThread
              key={activeId}
              conversationId={activeId}
              conversation={active}
              boat={activeBoat}
              coverPhoto={active ? coverOf(active) : null}
              detailsOpen={detailsOpen}
              onToggleDetails={() => setDetailsOpen(o => !o)}
              onBack={() => select(null)}
              onActivity={() => void loadList()}
            />
          ) : (
            <div className="sh-ib-pick">
              <MessagesSquare size={34} strokeWidth={1.5} aria-hidden="true" />
              <b>Bir konuşma seç</b>
              <p>Kaptanlarla yazışmaların ve rezervasyon taleplerinin ayrıntıları burada açılır.</p>
            </div>
          )}
        </section>

        {activeId && detailsOpen && (
          <aside className="sh-ib-details" aria-label="Konuşma detayları">
            <InboxDetails conversation={active} booking={activeBooking} boat={activeBoat} onClose={() => setDetailsOpen(false)} />
          </aside>
        )}
      </div>
    </div>
  )
}
