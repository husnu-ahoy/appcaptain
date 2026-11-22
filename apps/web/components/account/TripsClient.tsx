'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Sailboat } from 'lucide-react'
import type { BookingDTO } from '@ahoy/shared'
import { fetchMyBookings, fetchMyConversations } from '@/lib/api'
import { useSessionUser } from '@/lib/favorites'
import { formatMoney } from '@/lib/boatFormat'
import { RENTAL_TYPE_LABEL, bookingStatus, dayOf, formatRange, isUpcoming, type StatusTone } from '@/lib/bookingDisplay'
import AccountGate, { AccountLoading } from './AccountGate'
import { TripsArt } from './AccountArt'

interface Trip {
  booking: BookingDTO
  conversationId: string | null
  label: string
  tone: StatusTone
}

function toTrip(booking: BookingDTO, conversationId: string | null): Trip {
  const status = bookingStatus(booking.status)
  // Tarihi geçmiş ama hâlâ bekleyen talep: kaptan zamanında yanıt vermemiş.
  if (booking.status === 'PENDING' && !isUpcoming(booking.endDate)) return { booking, conversationId, label: 'Yanıtlanmadı', tone: 'muted' }
  return { booking, conversationId, label: status.label, tone: status.tone }
}

const byStart = (a: Trip, b: Trip) => dayOf(a.booking.startDate).getTime() - dayOf(b.booking.startDate).getTime()

export default function TripsClient() {
  const { user, ready } = useSessionUser()
  const [trips, setTrips] = useState<Trip[] | null>(null)

  useEffect(() => {
    if (!user) return
    let alive = true
    Promise.all([fetchMyBookings(), fetchMyConversations().catch(() => [])]).then(([bookings, convs]) => {
      if (!alive) return
      const threadOf = new Map(convs.filter(c => c.bookingId).map(c => [c.bookingId as string, c.id]))
      setTrips(bookings.map(b => toTrip(b, threadOf.get(b.id) ?? null)))
    })
    return () => {
      alive = false
    }
  }, [user])

  if (!ready) return <AccountLoading />
  if (!user) {
    return (
      <div className="sh-acc-page">
        <AccountGate art={<TripsArt />} title="Rezervasyonlarım" text="Rezervasyon taleplerini ve onaylanan yolculuklarını görmek için giriş yap." />
      </div>
    )
  }

  const closed = (t: Trip) => t.booking.status === 'REJECTED' || t.booking.status === 'CANCELLED'
  const upcoming = (trips ?? []).filter(t => !closed(t) && t.booking.status !== 'COMPLETED' && isUpcoming(t.booking.endDate)).sort(byStart)
  const past = (trips ?? []).filter(t => !closed(t) && !upcoming.includes(t)).sort((a, b) => byStart(b, a))
  const ended = (trips ?? []).filter(closed).sort((a, b) => byStart(b, a))

  return (
    <div className="sh-acc-page">
      <div className="sh-container">
        <header className="sh-acc-head">
          <h1>Rezervasyonlarım</h1>
        </header>

        {trips === null ? (
          <ul className="sh-rsv-list" aria-busy="true" aria-label="Rezervasyonlar yükleniyor">
            {[0, 1].map(i => (
              <li key={i} className="sh-rsv is-skel" aria-hidden="true">
                <span className="sh-rsv-photo" />
                <span className="sh-rsv-main">
                  <i />
                  <i />
                  <i />
                </span>
              </li>
            ))}
          </ul>
        ) : trips.length === 0 ? (
          <div className="sh-acc-empty">
            <div className="sh-acc-art" aria-hidden="true">
              <TripsArt />
            </div>
            <h2>Henüz rezervasyonun yok</h2>
            <p>Bir tekne seçip tarihlerini belirlediğinde talebin burada görünür; kaptanın yanıtını da buradan takip edersin.</p>
            <Link href="/tekne-kiralama" className="sh-acc-cta">
              Tekneleri keşfet
            </Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="sh-rsv-sect" aria-labelledby="trips-upcoming">
                <h2 id="trips-upcoming">Yaklaşan</h2>
                <ul className="sh-rsv-list">
                  {upcoming.map(t => (
                    <TripRow key={t.booking.id} trip={t} large />
                  ))}
                </ul>
              </section>
            )}
            {upcoming.length === 0 && (
              <section className="sh-rsv-sect">
                <div className="sh-rsv-next">
                  <div>
                    <b>Yaklaşan bir yolculuğun yok</b>
                    <p>Yeni bir rota için tekneleri keşfetmeye ne dersin?</p>
                  </div>
                  <Link href="/tekne-kiralama" className="sh-acc-cta sh-acc-cta--ghost">
                    Tekneleri keşfet
                  </Link>
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section className="sh-rsv-sect" aria-labelledby="trips-past">
                <h2 id="trips-past">Geçmiş</h2>
                <ul className="sh-rsv-list">
                  {past.map(t => (
                    <TripRow key={t.booking.id} trip={t} />
                  ))}
                </ul>
              </section>
            )}
            {ended.length > 0 && (
              <section className="sh-rsv-sect" aria-labelledby="trips-ended">
                <h2 id="trips-ended">İptal edilen ve onaylanmayan</h2>
                <ul className="sh-rsv-list">
                  {ended.map(t => (
                    <TripRow key={t.booking.id} trip={t} />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TripRow({ trip, large = false }: { trip: Trip; large?: boolean }) {
  const { booking: b, conversationId } = trip
  const name = b.boat?.name ?? 'Tekne'
  const thread = conversationId ? `/mesajlarim?c=${encodeURIComponent(conversationId)}` : '/mesajlarim'
  const details = [`${b.guestCount} misafir`, RENTAL_TYPE_LABEL[b.rentalType]].filter(Boolean).join(' · ')
  const price =
    b.totalPrice != null && (b.status === 'APPROVED' || b.status === 'COMPLETED')
      ? `Toplam ${formatMoney(b.totalPrice, b.currency)}`
      : b.status === 'PENDING' && trip.tone === 'pending'
        ? 'Ücret, kaptan onayladığında netleşir'
        : null

  return (
    <li className={`sh-rsv${large ? ' is-large' : ''}`}>
      <Link href={thread} className="sh-rsv-photo" tabIndex={-1} aria-hidden="true">
        {b.boat?.coverPhoto ? (
          <Image src={b.boat.coverPhoto} alt="" fill sizes={large ? '(max-width: 860px) 100vw, 280px' : '120px'} />
        ) : (
          <Sailboat size={large ? 34 : 24} strokeWidth={1.4} />
        )}
      </Link>
      <div className="sh-rsv-main">
        <p className="sh-rsv-status">
          <i className={`sh-ib-dot is-${trip.tone}`} aria-hidden="true" />
          {trip.label}
        </p>
        <h3>
          <Link href={thread}>{name}</Link>
        </h3>
        <p className="sh-rsv-dates">
          {formatRange(b.startDate, b.endDate)}
          {b.startTime && b.endTime ? ` · ${b.startTime}–${b.endTime}` : ''}
        </p>
        <p className="sh-rsv-meta">{details}</p>
        {price && <p className="sh-rsv-price">{price}</p>}
        {b.status === 'REJECTED' && b.rejectionNote && <p className="sh-rsv-note">Kaptanın notu: “{b.rejectionNote}”</p>}
        <div className="sh-rsv-actions">
          <Link href={thread} className="sh-rsv-btn">
            Mesajlar
          </Link>
          {b.boatId && (
            <Link href={`/listing/${b.boatId}`} className="sh-rsv-link">
              İlanı gör
            </Link>
          )}
        </div>
      </div>
    </li>
  )
}
