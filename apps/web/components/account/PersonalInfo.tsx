'use client'

import { useState, type FormEvent } from 'react'
import { MessageSquareText, UserRoundCheck } from 'lucide-react'
import { useSessionUser } from '@/lib/favorites'
import {
  DIAL_CODES,
  SUPPORT,
  formatPhone,
  fullName,
  isValidPhone,
  readProfile,
  refreshSessionQuietly,
  saveMetadata,
  splitPhone,
} from '@/lib/account'
import SettingsRow, { Unset, useFlash } from './SettingsRow'

const clean = (s: string) => s.trim().replace(/\s+/g, ' ')

export default function PersonalInfo() {
  const { user } = useSessionUser()
  const [editing, setEditing] = useState<string | null>(null)
  const flash = useFlash()
  if (!user) return null

  const profile = readProfile(user)
  const name = fullName(user)
  const saved = (message: string) => {
    setEditing(null)
    flash.show(message)
  }

  return (
    <>
      <header className="sh-set-head">
        <h2>Kişisel bilgiler</h2>
        {flash.node}
      </header>

      <div className="sh-set-cols">
        <div className="sh-set-rows">
          <SettingsRow
            id="name"
            label="Ad soyad"
            value={name || <Unset />}
            action={name ? 'Düzenle' : 'Ekle'}
            editing={editing}
            onEdit={setEditing}
            description="Kimliğindeki gibi yaz. Kaptanla yazışmalarında bu ad görünür, rezervasyon formuna da otomatik eklenir."
          >
            <NameForm firstName={profile.firstName} lastName={profile.lastName} onSaved={() => saved('Adın güncellendi')} />
          </SettingsRow>

          <SettingsRow
            id="email"
            label="E-posta adresi"
            value={user.email ?? <Unset />}
            editing={editing}
            onEdit={setEditing}
            hint={
              <>
                Rezervasyonların ve mesajların bu adrese bağlı olduğu için e-posta adresi buradan değiştirilemez. Değiştirmen gerekirse{' '}
                <a href={SUPPORT.whatsapp.href} target="_blank" rel="noopener noreferrer">
                  WhatsApp destek hattımıza
                </a>{' '}
                yaz.
              </>
            }
          />

          <SettingsRow
            id="phone"
            label="Telefon numarası"
            value={profile.phone || <Unset />}
            action={profile.phone ? 'Düzenle' : 'Ekle'}
            editing={editing}
            onEdit={setEditing}
            description="Rezervasyon talebi gönderirken forma otomatik eklenir; kaptan talebinle ilgili sana bu numaradan ulaşabilir."
          >
            <PhoneForm
              initial={profile.phone}
              onSaved={removed => saved(removed ? 'Telefon numaran kaldırıldı' : 'Telefon numaran kaydedildi')}
            />
          </SettingsRow>
        </div>

        <aside className="sh-set-aside">
          <div className="sh-set-info">
            <div>
              <UserRoundCheck size={30} strokeWidth={1.4} aria-hidden="true" />
              <h3>Bu bilgiler ne işe yarar?</h3>
              <p>Rezervasyon formunu senin yerine doldururuz. Böylece talep gönderirken bilgilerini tekrar yazmazsın.</p>
            </div>
            <div>
              <MessageSquareText size={30} strokeWidth={1.4} aria-hidden="true" />
              <h3>Kaptan neyi görür?</h3>
              <p>
                Kaptana mesaj yazdığında adını ve e-posta adresini görür. Rezervasyon talebi gönderdiğinde telefon numaran da o teknenin kaptanıyla paylaşılır.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

function NameForm({ firstName, lastName, onSaved }: { firstName: string; lastName: string; onSaved: () => void }) {
  const [first, setFirst] = useState(firstName)
  const [last, setLast] = useState(lastName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const f = clean(first)
    const l = clean(last)
    if (!f) return setError('Adını yaz.')
    setSaving(true)
    setError(null)
    try {
      await saveMetadata({ first_name: f, last_name: l || null, full_name: `${f} ${l}`.trim() })
      await refreshSessionQuietly()
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Değişiklik kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="sh-set-fields sh-set-fields--2">
        <label className="sh-set-field">
          <small>Ad</small>
          <input value={first} onChange={e => setFirst(e.target.value)} maxLength={60} autoComplete="given-name" autoFocus />
        </label>
        <label className="sh-set-field">
          <small>Soyad</small>
          <input value={last} onChange={e => setLast(e.target.value)} maxLength={60} autoComplete="family-name" />
        </label>
      </div>
      {error && (
        <p className="sh-auth-error sh-set-error" role="alert">
          {error}
        </p>
      )}
      <div className="sh-set-actions">
        <button type="submit" className="sh-set-save" disabled={saving}>
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>
    </form>
  )
}

function PhoneForm({ initial, onSaved }: { initial: string; onSaved: (removed: boolean) => void }) {
  const start = splitPhone(initial)
  const [dial, setDial] = useState(start.dial)
  const [number, setNumber] = useState(start.number)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async (phone: string | null) => {
    setSaving(true)
    setError(null)
    try {
      await saveMetadata({ phone })
      onSaved(phone === null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Değişiklik kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!isValidPhone(number)) return setError('Geçerli bir telefon numarası yaz.')
    void save(formatPhone(dial, number))
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="sh-set-fields sh-set-fields--phone">
        <label className="sh-set-field sh-set-field--select">
          <small>Ülke kodu</small>
          <select value={dial} onChange={e => setDial(e.target.value)} autoComplete="tel-country-code">
            {DIAL_CODES.map(d => (
              <option key={d.code} value={d.code}>
                {d.country} ({d.code})
              </option>
            ))}
          </select>
        </label>
        <label className="sh-set-field">
          <small>Telefon numarası</small>
          <input
            type="tel"
            inputMode="tel"
            value={number}
            onChange={e => setNumber(e.target.value)}
            placeholder={dial === '+90' ? '5xx xxx xx xx' : undefined}
            autoComplete="tel-national"
            maxLength={20}
            autoFocus
          />
        </label>
      </div>
      {error && (
        <p className="sh-auth-error sh-set-error" role="alert">
          {error}
        </p>
      )}
      <div className="sh-set-actions">
        <button type="submit" className="sh-set-save" disabled={saving}>
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        {initial && (
          <button type="button" className="sh-set-textbtn" onClick={() => void save(null)} disabled={saving}>
            Numarayı kaldır
          </button>
        )}
      </div>
    </form>
  )
}
