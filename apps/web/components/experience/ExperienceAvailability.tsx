'use client'

import { CircleCheck, Clock3, Info, Languages, MapPin } from 'lucide-react'
import type { ExperienceDTO } from '@ahoy/shared'
import { SUPPORT } from '@/lib/account'
import { formatLongDate } from '@/lib/boatFormat'
import {
  cancellationTitle,
  durationLabel,
  estimate,
  formatDayTime,
  freeCancelUntil,
  isFreeCancellation,
  meetingTimes,
  money,
  startAt,
  type Party,
} from '@/lib/experienceFormat'
import { partyText } from './ExperienceBookingCard'

interface Props {
  exp: ExperienceDTO
  sample: boolean
  party: Party
  date: Date
  language: string | null
  time: string | null
  setTime: (t: string) => void
  pickup: boolean
  setPickup: (v: boolean) => void
  onEdit: () => void
}

const isClock = (t: string | null | undefined) => !!t && /^\d{2}:\d{2}$/.test(t)

/**
 * "Uygunluk durumu"ndan sonra açılan seçim paneli (GetYourGuide'daki seçenek kartı):
 * başlangıç saati, otelden alınma, tahmini tutar ve ücretsiz iptal süresi. Deneyimler
 * için çevrimiçi rezervasyon olmadığından talep WhatsApp destek hattına hazır mesajla gider.
 */
export default function ExperienceAvailability({ exp, sample, party, date, language, time, setTime, pickup, setPickup, onEdit }: Props) {
  const times = meetingTimes(exp.meetingTime)
  const selected = time && times.includes(time) ? time : times[0] ?? null
  const clock = isClock(selected)
  const est = estimate(exp, party, date)
  const until = freeCancelUntil(exp, startAt(date, clock ? selected : null))
  const total = party.adults + party.children
  const underMin = exp.minParticipants > 1 && total < exp.minParticipants
  const fields = [...exp.customerInfoFields].sort((a, b) => a.sortOrder - b.sortOrder)
  const who = partyText(exp, party)

  const message = [
    `Merhaba, “${exp.title}” deneyimi için rezervasyon talebi göndermek istiyorum.`,
    `Tarih: ${formatLongDate(date)}${clock ? `, ${selected}` : ''}`,
    `Kişi: ${who}`,
    language ? `Dil: ${language}` : null,
    exp.pickupOffered ? `Otelden alınma: ${pickup ? 'İstiyorum' : 'İstemiyorum'}` : null,
    `Tahmini toplam: ${money(est.total, exp.currency)}`,
    ...fields.map(f => `${f.label}: `),
  ]
    .filter(Boolean)
    .join('\n')
  const whatsappHref = `${SUPPORT.whatsapp.href}?text=${encodeURIComponent(message)}`

  const cancelLine = until ? (
    <p className="sh-xa-cancel is-ok">
      <CircleCheck size={18} strokeWidth={2} aria-hidden="true" /> {formatDayTime(until, clock)} tarihine kadar ücretsiz iptal
    </p>
  ) : isFreeCancellation(exp.cancellationPolicy) ? (
    <p className="sh-xa-cancel">
      <Info size={18} strokeWidth={2} aria-hidden="true" /> Seçtiğin gün için ücretsiz iptal süresi geçmiş olur.
    </p>
  ) : (
    <p className="sh-xa-cancel">
      <Info size={18} strokeWidth={2} aria-hidden="true" /> {cancellationTitle(exp.cancellationPolicy, exp.cancellationPolicyText)}
    </p>
  )

  return (
    <section id="uygunluk" className="sh-xa" aria-labelledby="xa-title" tabIndex={-1}>
      <header className="sh-xa-head">
        <div>
          <h2 id="xa-title">Seçimin</h2>
          <p>
            {formatDayTime(date, false)} · {who}
            {language ? ` · ${language}` : ''}
          </p>
        </div>
        <button type="button" className="sh-xa-edit" onClick={onEdit}>
          Değiştir
        </button>
      </header>

      <div className="sh-xa-opt">
        <div className="sh-xa-main">
          <h3>{exp.title}</h3>
          <ul className="sh-xa-facts">
            <li>
              <Clock3 size={17} strokeWidth={1.9} aria-hidden="true" /> {durationLabel(exp.durationMinutes)}
            </li>
            {language && (
              <li>
                <Languages size={17} strokeWidth={1.9} aria-hidden="true" /> Rehber: {language}
              </li>
            )}
            {exp.meetingPoint && (
              <li>
                <MapPin size={17} strokeWidth={1.9} aria-hidden="true" /> Buluşma: {exp.meetingPoint}
              </li>
            )}
          </ul>

          {times.length > 0 && (
            <div className="sh-xa-times">
              <p id="xa-times-label">Başlangıç saati</p>
              <div role="radiogroup" aria-labelledby="xa-times-label">
                {times.map(t => (
                  <button key={t} type="button" role="radio" aria-checked={t === selected} className={`sh-xa-time${t === selected ? ' is-on' : ''}`} onClick={() => setTime(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {exp.pickupOffered && (
            <label className="sh-xa-pickup">
              <input type="checkbox" checked={pickup} onChange={e => setPickup(e.target.checked)} />
              <span>
                <b>Otelden alınma istiyorum</b>
                <small>
                  {exp.pickupAreas ?? 'Hizmet bölgelerini talebinde sorabilirsin'}
                  {exp.pickupFee ? ` · ek ücret ${money(exp.pickupFee, exp.currency)}` : ' · ücretsiz'}
                </small>
              </span>
            </label>
          )}

          {cancelLine}
        </div>

        <div className="sh-xa-side">
          <dl className="sh-xa-lines">
            {est.lines.map(l => (
              <div key={l.label}>
                <dt>{l.label}</dt>
                <dd>{money(l.amount, exp.currency)}</dd>
              </div>
            ))}
          </dl>
          <div className="sh-xa-total">
            <span>Tahmini toplam</span>
            <b>{money(est.total, exp.currency)}</b>
          </div>
          {est.season && <p className="sh-xa-small">{est.season} fiyatı uygulanır.</p>}
          {exp.pickupOffered && pickup && !!exp.pickupFee && (
            <p className="sh-xa-small">Otelden alınma ücreti ({money(exp.pickupFee, exp.currency)}) bu tutara dahil değildir.</p>
          )}
          {underMin && <p className="sh-xa-warn">Bu deneyim en az {exp.minParticipants} kişiyle yapılır.</p>}
          {sample ? (
            <button type="button" className="sh-xa-cta" disabled>
              Örnek deneyim
            </button>
          ) : (
            <a className="sh-xa-cta" href={whatsappHref} target="_blank" rel="noopener noreferrer">
              WhatsApp ile talep gönder
            </a>
          )}
          <p className="sh-xa-note">
            {sample
              ? 'Bu örnek deneyim rezervasyona kapalıdır; kaptanların eklediği deneyimlerde talep buradan gönderilir.'
              : 'Talepler şimdilik WhatsApp destek hattımız üzerinden alınıyor. Henüz bir ödeme yapmazsın.'}
          </p>
        </div>
      </div>

      {fields.length > 0 && (
        <div className="sh-xa-info">
          <b>Talebinde şu bilgiler de istenecek</b>
          <ul>
            {fields.map(f => (
              <li key={f.id}>
                {f.label} <small>{f.required ? 'Zorunlu' : 'İsteğe bağlı'}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
