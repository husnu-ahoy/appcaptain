'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown, CircleCheck, Languages, Minus, Plus, User } from 'lucide-react'
import type { ExperienceDTO } from '@ahoy/shared'
import RangeCalendar from '@/components/sh/RangeCalendar'
import { estimate, formatDayTime, fromPrice, isFreeCancellation, money, priceUnitLabel, type Party } from '@/lib/experienceFormat'

type Pop = 'party' | 'date' | 'lang' | null

/** Kart, mobil kopyası ve uygunluk paneli aynı seçimi paylaşır (ExperienceDetail tutar). */
export interface BookingState {
  party: Party
  setParty: (p: Party) => void
  date: Date | null
  setDate: (d: Date | null) => void
  language: string | null
  setLanguage: (l: string) => void
}

/** "Yetişkin x 2, Çocuk x 1" — grup fiyatında yalnızca toplam kişi. */
export function partyLabel(exp: ExperienceDTO, p: Party): string {
  if (exp.pricingType === 'PER_GROUP') return `${p.adults + p.children} kişi`
  return p.children > 0 ? `Yetişkin x ${p.adults}, Çocuk x ${p.children}` : `Yetişkin x ${p.adults}`
}

/** "2 yetişkin, 1 çocuk" */
export function partyText(exp: ExperienceDTO, p: Party): string {
  if (exp.pricingType === 'PER_GROUP') return `${p.adults + p.children} kişi`
  return p.children > 0 ? `${p.adults} yetişkin, ${p.children} çocuk` : `${p.adults} yetişkin`
}

function Stepper({
  label,
  hint,
  value,
  min,
  canAdd,
  onChange,
}: {
  label: string
  hint?: string
  value: number
  min: number
  canAdd: boolean
  onChange: (v: number) => void
}) {
  return (
    <div className="sh-xb-row">
      <span>
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </span>
      <div className="sh-stepper sh-stepper--sm">
        <button type="button" aria-label={`${label} azalt`} disabled={value <= min} onClick={() => onChange(value - 1)}>
          <Minus size={15} />
        </button>
        <output aria-live="polite">{value}</output>
        <button type="button" aria-label={`${label} arttır`} disabled={!canAdd} onClick={() => onChange(value + 1)}>
          <Plus size={15} />
        </button>
      </div>
    </div>
  )
}

/**
 * Rezervasyon kartı (GetYourGuide düzeni): başlangıç fiyatı, kişi / tarih / dil
 * seçicileri ve "Uygunluk durumu". Masaüstünde yan sütunda yapışkan, mobilde
 * sayfa akışında (variant="inline") gösterilir.
 */
export default function ExperienceBookingCard({
  exp,
  variant,
  state,
  onCheck,
}: {
  exp: ExperienceDTO
  variant: 'aside' | 'inline'
  state: BookingState
  onCheck: () => void
}) {
  const { party, setParty, date, setDate, language, setLanguage } = state
  const [pop, setPop] = useState<Pop>(null)
  const [needDate, setNeedDate] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const uid = useId()

  useEffect(() => {
    if (!pop) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setPop(null)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPop(null)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [pop])

  const perPerson = exp.pricingType !== 'PER_GROUP'
  const childAllowed = perPerson && !!exp.childDiscountPercent
  const max = exp.maxParticipants || 20
  const total = party.adults + party.children
  const est = estimate(exp, party, date)
  const price = date ? est.price : fromPrice(exp)
  const toggle = (p: Exclude<Pop, null>) => setPop(cur => (cur === p ? null : p))
  const free = isFreeCancellation(exp.cancellationPolicy)

  const check = () => {
    if (!date) {
      setNeedDate(true)
      setPop('date')
      return
    }
    setPop(null)
    onCheck()
  }

  return (
    <aside className={`sh-xb sh-xb--${variant}`} aria-label="Rezervasyon" id={variant === 'inline' ? 'rezervasyon' : undefined}>
      <div className="sh-xb-price">
        <small>{date ? (est.season ? `${est.season} fiyatı` : 'Seçtiğin gün için fiyat') : 'Başlangıç fiyatı'}</small>
        <p>
          <b>{money(price, exp.currency)}</b> <span>{priceUnitLabel(exp.pricingType)}</span>
        </p>
      </div>

      <div className="sh-xb-fields" ref={ref}>
        {/* kişi sayısı */}
        <div className="sh-xb-field">
          <button
            type="button"
            className={`sh-xb-select${pop === 'party' ? ' is-open' : ''}`}
            aria-expanded={pop === 'party'}
            aria-controls={`${uid}-party`}
            onClick={() => toggle('party')}
          >
            <User size={20} strokeWidth={1.8} aria-hidden="true" />
            <span>{partyLabel(exp, party)}</span>
            <ChevronDown size={18} strokeWidth={2.4} className="sh-xb-caret" aria-hidden="true" />
          </button>
          {pop === 'party' && (
            <div className="sh-xb-pop" id={`${uid}-party`} role="group" aria-label="Katılımcı sayısı">
              <Stepper
                label={perPerson ? 'Yetişkin' : 'Kişi sayısı'}
                hint={!childAllowed && exp.minAge ? `${exp.minAge} yaş ve üzeri` : undefined}
                value={party.adults}
                min={1}
                canAdd={total < max}
                onChange={adults => setParty({ ...party, adults })}
              />
              {childAllowed && (
                <Stepper
                  label="Çocuk"
                  hint={`%${exp.childDiscountPercent} indirimli${exp.minAge ? ` · ${exp.minAge} yaş ve üzeri` : ''}`}
                  value={party.children}
                  min={0}
                  canAdd={total < max}
                  onChange={children => setParty({ ...party, children })}
                />
              )}
              <p className="sh-xb-pop-note">
                En fazla {max} kişi{exp.minParticipants > 1 ? ` · en az ${exp.minParticipants} kişiyle yapılır` : ''}.
              </p>
              <button type="button" className="sh-xb-done" onClick={() => setPop(null)}>
                Tamam
              </button>
            </div>
          )}
        </div>

        {/* tarih */}
        <div className="sh-xb-field">
          <button
            type="button"
            className={`sh-xb-select${pop === 'date' ? ' is-open' : ''}${needDate && !date ? ' is-alert' : ''}`}
            aria-expanded={pop === 'date'}
            aria-controls={`${uid}-date`}
            onClick={() => toggle('date')}
          >
            <CalendarDays size={20} strokeWidth={1.8} aria-hidden="true" />
            <span className={date ? undefined : 'is-empty'}>{date ? formatDayTime(date, false) : 'Tarih seçin'}</span>
            <ChevronDown size={18} strokeWidth={2.4} className="sh-xb-caret" aria-hidden="true" />
          </button>
          {pop === 'date' && (
            <div className="sh-xb-pop sh-xb-pop--cal" id={`${uid}-date`} role="group" aria-label="Katılım tarihi">
              <RangeCalendar
                single
                value={{ start: date, end: date }}
                onChange={r => {
                  setDate(r.start)
                  if (r.start) {
                    setNeedDate(false)
                    setPop(null)
                  }
                }}
              />
            </div>
          )}
          {needDate && !date && pop !== 'date' && <p className="sh-xb-hint">Uygunluğu görmek için önce bir tarih seç.</p>}
        </div>

        {/* dil */}
        {exp.languages.length > 1 ? (
          <div className="sh-xb-field">
            <button
              type="button"
              className={`sh-xb-select${pop === 'lang' ? ' is-open' : ''}`}
              aria-expanded={pop === 'lang'}
              aria-haspopup="listbox"
              aria-controls={`${uid}-lang`}
              onClick={() => toggle('lang')}
            >
              <Languages size={20} strokeWidth={1.8} aria-hidden="true" />
              <span>{language ?? 'Dil seçin'}</span>
              <ChevronDown size={18} strokeWidth={2.4} className="sh-xb-caret" aria-hidden="true" />
            </button>
            {pop === 'lang' && (
              <ul className="sh-xb-pop sh-xb-pop--list" id={`${uid}-lang`} role="listbox" aria-label="Rehberlik dili">
                {exp.languages.map(l => (
                  <li key={l}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={l === language}
                      onClick={() => {
                        setLanguage(l)
                        setPop(null)
                      }}
                    >
                      {l}
                      {l === language && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : exp.languages.length === 1 ? (
          <div className="sh-xb-field">
            <p className="sh-xb-select sh-xb-select--static">
              <Languages size={20} strokeWidth={1.8} aria-hidden="true" />
              <span>{exp.languages[0]}</span>
            </p>
          </div>
        ) : null}
      </div>

      <button type="button" className="sh-xb-cta" onClick={check}>
        Uygunluk durumu
      </button>

      <ul className="sh-xb-perks">
        {free && (
          <li>
            <CircleCheck size={22} strokeWidth={1.8} aria-hidden="true" />
            <div>
              <b>Ücretsiz iptal</b>
              <p>Deneyimden {exp.cancellationPolicy === 'FREE_48H' ? '48' : '24'} saat öncesine kadar ücretsiz iptal edebilirsin.</p>
            </div>
          </li>
        )}
        <li>
          <CircleCheck size={22} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <b>Önce talep, sonra ödeme</b>
            <p>Talebini gönderirken hiçbir ücret ödemezsin.</p>
          </div>
        </li>
      </ul>
    </aside>
  )
}
