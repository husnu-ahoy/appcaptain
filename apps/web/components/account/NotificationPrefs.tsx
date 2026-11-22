'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { useSessionUser } from '@/lib/favorites'
import { readMarketing, readProfile, saveMetadata, type MarketingPrefs } from '@/lib/account'
import { useFlash } from './SettingsRow'

type Channel = 'email' | 'sms'

/**
 * Kampanya izinleri. Varsayılan kapalıdır; yalnızca kullanıcının açtığı kanal kaydedilir
 * (user_metadata.marketing, değişiklik zamanıyla birlikte).
 */
export default function NotificationPrefs() {
  const { user } = useSessionUser()
  const [busy, setBusy] = useState<Channel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const flash = useFlash()
  if (!user) return null

  const prefs = readMarketing(user)
  const phone = readProfile(user).phone

  const toggle = async (channel: Channel, on: boolean) => {
    setBusy(channel)
    setError(null)
    const next: MarketingPrefs = { ...prefs, [channel]: on, updatedAt: new Date().toISOString() }
    try {
      await saveMetadata({ marketing: next })
      flash.show(on ? 'İznin kaydedildi' : 'İznin geri alındı')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tercihin kaydedilemedi.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <header className="sh-set-head">
        <h2>Bildirimler</h2>
        {flash.node}
      </header>

      <section className="sh-set-group" aria-labelledby="notif-marketing">
        <h3 id="notif-marketing" className="sh-set-group-title">
          Kampanyalar ve fırsatlar
        </h3>
        <p className="sh-set-group-desc">
          Sezon fırsatlarından, yeni rotalardan ve sana özel kampanyalardan haberdar olmak istersen izin ver. İznini istediğin zaman buradan geri
          alabilirsin.
        </p>
        {error && (
          <p className="sh-auth-error sh-set-error" role="alert">
            {error}
          </p>
        )}
        <div className="sh-set-rows">
          <SwitchRow
            label="E-posta"
            hint={user.email ?? undefined}
            on={prefs.email}
            busy={busy === 'email'}
            onChange={on => void toggle('email', on)}
          />
          <SwitchRow
            label="SMS"
            hint={
              phone || (
                <>
                  SMS için önce <Link href="/hesabim">telefon numaranı ekle</Link>.
                </>
              )
            }
            on={prefs.sms}
            busy={busy === 'sms'}
            disabled={!phone && !prefs.sms}
            onChange={on => void toggle('sms', on)}
          />
        </div>
        {prefs.updatedAt && (
          <p className="sh-set-foot">
            Son değişiklik:{' '}
            {new Date(prefs.updatedAt).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </section>
    </>
  )
}

function SwitchRow({
  label,
  hint,
  on,
  busy,
  disabled,
  onChange,
}: {
  label: string
  hint?: ReactNode
  on: boolean
  busy: boolean
  disabled?: boolean
  onChange: (on: boolean) => void
}) {
  const id = `switch-${label.toLowerCase().replace(/\W+/g, '-')}`
  return (
    <div className="sh-set-row sh-set-row--switch">
      <div className="sh-set-row-text">
        <h3 id={id}>{label}</h3>
        {hint && <p className="sh-set-row-hint">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={id}
        className={`sh-set-switch${on ? ' is-on' : ''}${busy ? ' is-busy' : ''}`}
        disabled={disabled || busy}
        onClick={() => onChange(!on)}
      >
        <span />
      </button>
    </div>
  )
}
