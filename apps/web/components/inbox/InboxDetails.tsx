'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  CalendarCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock3,
  Headset,
  MapPin,
  MessageCircle,
  Sailboat,
  X,
} from 'lucide-react'
import type { BoatDetailViewModel, BookingDTO, GuestConversationDTO, PublicBoatOwnerDTO } from '@ahoy/shared'
import { SUPPORT } from '@/lib/account'
import { RENTAL_TYPE_LABEL, bookingStatus, formatDayLong, isSameDay, type StatusTone } from '@/lib/bookingDisplay'
import { formatMoney } from '@/lib/boatFormat'

/** İlan sayfasının herkese açık verisinden türetilen tekne bilgisi. */
export interface BoatInfo {
  model: BoatDetailViewModel
  owner: PublicBoatOwnerDTO | null
}

const STATUS_ICON: Record<StatusTone, ReactNode> = {
  pending: <Clock3 size={22} strokeWidth={1.8} />,
  ok: <CircleCheck size={22} strokeWidth={1.8} />,
  bad: <CircleX size={22} strokeWidth={1.8} />,
  muted: <CircleX size={22} strokeWidth={1.8} />,
  done: <CalendarCheck size={22} strokeWidth={1.8} />,
}

interface Props {
  conversation: GuestConversationDTO | null
  booking: BookingDTO | undefined
  /** undefined: yükleniyor, null: ilan artık yayında değil */
  boat: BoatInfo | null | undefined
  onClose: () => void
}

export default function InboxDetails({ conversation, booking, boat, onClose }: Props) {
  const ref = conversation?.booking ?? null
  const status = ref ? bookingStatus(ref.status) : null
  const model = boat?.model
  const title = model?.title ?? conversation?.boat?.name ?? booking?.boat?.name ?? 'Tekne'
  const photos = model?.gallery.length ? model.gallery.map(g => g.url) : booking?.boat?.coverPhoto ? [booking.boat.coverPhoto] : []
  const place = model?.location ? [model.location.marina, model.location.city].filter(Boolean).join(', ') || model.location.summary : null
  const facts = model?.stats.map(s => s.value) ?? []
  const boatId = conversation?.boatId ?? booking?.boatId ?? null

  return (
    <div className="sh-ibd">
      <header className="sh-ibd-head">
        <button type="button" className="sh-ib-icon sh-ibd-back" onClick={onClose} aria-label="Konuşmaya dön">
          <ArrowLeft size={20} />
        </button>
        <h2>Detaylar</h2>
        <button type="button" className="sh-ib-icon sh-ibd-close" onClick={onClose} aria-label="Detayları kapat">
          <X size={20} />
        </button>
      </header>

      <div className="sh-ibd-body">
        <Gallery photos={photos} title={title} />

        <section className="sh-ibd-boat">
          <h3>{title}</h3>
          {boat === undefined && boatId && (
            <span className="sh-ibd-skel" aria-hidden="true">
              <i />
              <i />
            </span>
          )}
          {(model?.subtitle || model?.boatTypeLabel) && <p>{[model.subtitle, model.boatTypeLabel].filter(Boolean).join(' · ')}</p>}
          {place && (
            <p className="sh-ibd-place">
              <MapPin size={16} strokeWidth={1.8} aria-hidden="true" /> {place}
            </p>
          )}
          {facts.length > 0 && <p className="sh-ibd-facts">{facts.join(' · ')}</p>}
          {boat === null && <p className="sh-ibd-muted">Bu ilan şu an yayında değil.</p>}
          {boatId && boat !== null && (
            <Link href={`/listing/${boatId}`} className="sh-ibd-link">
              İlanı görüntüle
            </Link>
          )}
        </section>

        {status ? (
          <section className={`sh-ibd-status is-${status.tone}`}>
            <span className="sh-ibd-status-ico" aria-hidden="true">
              {STATUS_ICON[status.tone]}
            </span>
            <div>
              <b>{status.title}</b>
              {status.text && <p>{status.text}</p>}
              {ref?.status === 'REJECTED' && booking?.rejectionNote && <p className="sh-ibd-quote">“{booking.rejectionNote}”</p>}
              {ref?.status === 'REJECTED' && (
                <Link href="/tekne-kiralama" className="sh-ibd-link">
                  Benzer tekneleri gör
                </Link>
              )}
            </div>
          </section>
        ) : (
          <section className="sh-ibd-status is-muted">
            <span className="sh-ibd-status-ico" aria-hidden="true">
              <CalendarClock size={22} strokeWidth={1.8} />
            </span>
            <div>
              <b>Henüz rezervasyon talebin yok</b>
              <p>Tarihlerini seçip talep gönderdiğinde kaptanın yanıtı ve rezervasyon bilgilerin burada görünür.</p>
              {boatId && boat !== null && (
                <Link href={`/listing/${boatId}`} className="sh-ibd-btn">
                  Tarih seç
                </Link>
              )}
            </div>
          </section>
        )}

        {ref && (
          <section className="sh-ibd-sect">
            <h3>Rezervasyon bilgilerin</h3>
            <dl className="sh-ibd-dl">
              {isSameDay(ref.startDate, ref.endDate) ? (
                <>
                  <div>
                    <dt>Tarih</dt>
                    <dd>{formatDayLong(ref.startDate)}</dd>
                  </div>
                  {booking?.startTime && booking.endTime && (
                    <div>
                      <dt>Saat</dt>
                      <dd>
                        {booking.startTime}–{booking.endTime}
                      </dd>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <dt>Başlangıç</dt>
                    <dd>
                      {formatDayLong(ref.startDate)}
                      {booking?.startTime ? `, ${booking.startTime}` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt>Bitiş</dt>
                    <dd>
                      {formatDayLong(ref.endDate)}
                      {booking?.endTime ? `, ${booking.endTime}` : ''}
                    </dd>
                  </div>
                </>
              )}
              {booking && (
                <div>
                  <dt>Misafir</dt>
                  <dd>{booking.guestCount} kişi</dd>
                </div>
              )}
              {booking?.rentalType && RENTAL_TYPE_LABEL[booking.rentalType] && (
                <div>
                  <dt>Kiralama</dt>
                  <dd>{RENTAL_TYPE_LABEL[booking.rentalType]}</dd>
                </div>
              )}
              {booking && (
                <div>
                  <dt>Talep tarihi</dt>
                  <dd>{new Date(booking.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {ref && (ref.status === 'PENDING' || ref.status === 'APPROVED' || ref.status === 'COMPLETED') && (
          <section className="sh-ibd-sect">
            <h3>Ücret</h3>
            {booking?.totalPrice != null && ref.status !== 'PENDING' ? (
              <dl className="sh-ibd-dl">
                <div className="is-total">
                  <dt>Toplam</dt>
                  <dd>{formatMoney(booking.totalPrice, booking.currency)}</dd>
                </div>
              </dl>
            ) : (
              <p className="sh-ibd-muted">
                {ref.status === 'PENDING'
                  ? 'Toplam ücret, kaptan talebini onayladığında netleşir.'
                  : 'Ücret bilgisi için kaptana bu konuşmadan yazabilirsin.'}
              </p>
            )}
          </section>
        )}

        {model?.cancellationLabel && (
          <section className="sh-ibd-sect">
            <h3>İptal politikası</h3>
            <p className="sh-ibd-text">
              <b>{model.cancellationLabel}.</b> Kaptanın belirlediği iptal politikası uygulanır. Ayrıntılar için kaptana bu konuşmadan sorabilirsin.
            </p>
          </section>
        )}

        <section className="sh-ibd-sect">
          <h3>Yardıma mı ihtiyacın var?</h3>
          <ul className="sh-ibd-help">
            <li>
              <a href={SUPPORT.whatsapp.href} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={20} strokeWidth={1.7} aria-hidden="true" />
                <span>
                  WhatsApp destek hattı
                  <small>{SUPPORT.whatsapp.label}</small>
                </span>
              </a>
            </li>
            <li>
              <a href={SUPPORT.phone.href}>
                <Headset size={20} strokeWidth={1.7} aria-hidden="true" />
                <span>
                  Çağrı merkezi
                  <small>{SUPPORT.phone.label}</small>
                </span>
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}

function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [index, setIndex] = useState(0)
  const count = photos.length
  if (count === 0) {
    return (
      <div className="sh-ibd-gallery is-empty" aria-hidden="true">
        <Sailboat size={40} strokeWidth={1.4} />
      </div>
    )
  }
  const i = Math.min(index, count - 1)
  const src = photos[i] ?? photos[0]!
  return (
    <div className="sh-ibd-gallery">
      <Image key={src} src={src} alt={i === 0 ? title : ''} fill sizes="(max-width: 860px) 100vw, 360px" />
      {count > 1 && (
        <>
          <button type="button" className="sh-ibd-nav is-prev" onClick={() => setIndex((i - 1 + count) % count)} aria-label="Önceki fotoğraf">
            <ChevronLeft size={18} strokeWidth={2.2} />
          </button>
          <button type="button" className="sh-ibd-nav is-next" onClick={() => setIndex((i + 1) % count)} aria-label="Sonraki fotoğraf">
            <ChevronRight size={18} strokeWidth={2.2} />
          </button>
          <span className="sh-ibd-dots" aria-hidden="true">
            {photos.slice(0, 5).map((p, n) => (
              <i key={p} className={n === Math.min(i, 4) ? 'is-on' : undefined} />
            ))}
          </span>
        </>
      )}
    </div>
  )
}
