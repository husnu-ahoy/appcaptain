'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { useSessionUser } from '@/lib/favorites'
import { PASSWORD_RECOVERY_EVENT, clearPasswordRecovery, isPasswordRecovery, supabase } from '@/lib/supabase'
import { SUPPORT, authErrorText, loginProviders } from '@/lib/account'
import SettingsRow, { useFlash } from './SettingsRow'

const MIN_PASSWORD = 8
const PROVIDER_LABEL: Record<string, string> = { google: 'Google', apple: 'Apple', facebook: 'Facebook' }

export default function LoginSecurity() {
  const router = useRouter()
  const { user } = useSessionUser()
  const [editing, setEditing] = useState<string | null>(null)
  const [recovery, setRecovery] = useState(false)
  const flash = useFlash()

  // Şifre sıfırlama bağlantısıyla gelindiyse formu hemen aç.
  useEffect(() => {
    const check = () => {
      if (!isPasswordRecovery()) return
      setRecovery(true)
      setEditing('password')
    }
    check()
    window.addEventListener(PASSWORD_RECOVERY_EVENT, check)
    return () => window.removeEventListener(PASSWORD_RECOVERY_EVENT, check)
  }, [])

  if (!user) return null

  const providers = loginProviders(user)
  const hasPassword = providers.length === 0 || providers.includes('email')
  const social = providers.filter(p => p !== 'email').map(p => PROVIDER_LABEL[p] ?? p)

  const passwordSaved = () => {
    clearPasswordRecovery()
    setRecovery(false)
    setEditing(null)
    flash.show('Şifren güncellendi')
  }

  return (
    <>
      <header className="sh-set-head">
        <h2>Giriş ve güvenlik</h2>
        {flash.node}
      </header>

      {recovery && (
        <div className="sh-set-banner" role="status">
          <KeyRound size={22} strokeWidth={1.7} aria-hidden="true" />
          <div>
            <b>Yeni şifreni belirle</b>
            <p>Şifre sıfırlama bağlantısıyla giriş yaptın. Hesabını güvene almak için şimdi yeni bir şifre seç.</p>
          </div>
        </div>
      )}

      <section className="sh-set-group" aria-labelledby="sec-login">
        <h3 id="sec-login" className="sh-set-group-title">
          Giriş
        </h3>
        <div className="sh-set-rows">
          <SettingsRow
            id="password"
            label="Şifre"
            value={hasPassword ? '••••••••' : undefined}
            hint={
              hasPassword
                ? 'Hesabına e-posta adresin ve şifrenle giriş yaparsın.'
                : `Hesabına ${social.join(' ve ')} ile giriş yapıyorsun. İstersen e-postanla giriş yapabilmek için bir şifre de belirleyebilirsin.`
            }
            action={hasPassword ? 'Güncelle' : 'Şifre belirle'}
            editing={editing}
            onEdit={id => {
              setEditing(id)
              if (id === null && recovery) {
                clearPasswordRecovery()
                setRecovery(false)
              }
            }}
            description={`En az ${MIN_PASSWORD} karakter. Başka sitelerde kullanmadığın bir şifre seç.`}
          >
            <PasswordForm email={user.email ?? null} onSaved={passwordSaved} />
          </SettingsRow>

          {social.length > 0 && (
            <SettingsRow id="social" label="Bağlı hesaplar" value={social.join(', ')} editing={editing} onEdit={setEditing} hint="Bu hesaplarla da giriş yapabilirsin." />
          )}
        </div>
      </section>

      <section className="sh-set-group" aria-labelledby="sec-sessions">
        <h3 id="sec-sessions" className="sh-set-group-title">
          Oturumlar
        </h3>
        <div className="sh-set-rows">
          <SettingsRow
            id="sessions"
            label="Tüm cihazlardan çıkış yap"
            hint="Hesabının açık olduğu tüm tarayıcı ve cihazlardaki oturumları kapatır."
            action="Çıkış yap"
            editing={editing}
            onEdit={setEditing}
            description="Bu cihaz dahil, hesabının açık olduğu her yerden çıkış yapacaksın. Devam etmek istiyor musun?"
          >
            <GlobalSignOut
              onDone={() => router.push('/')}
              onCancel={() => setEditing(null)}
            />
          </SettingsRow>
        </div>
      </section>

      <section className="sh-set-group" aria-labelledby="sec-account">
        <h3 id="sec-account" className="sh-set-group-title">
          Hesap
        </h3>
        <div className="sh-set-rows">
          <SettingsRow
            id="close"
            label="Hesabını kapat"
            editing={editing}
            onEdit={setEditing}
            hint={
              <>
                Hesabını ve kişisel verilerini sildirmek istersen{' '}
                <a href={SUPPORT.whatsapp.href} target="_blank" rel="noopener noreferrer">
                  WhatsApp destek hattımıza
                </a>{' '}
                yaz.
              </>
            }
          />
        </div>
      </section>
    </>
  )
}

function PasswordForm({ email, onSaved }: { email: string | null; onSaved: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsReset, setNeedsReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < MIN_PASSWORD) return setError(`Şifren en az ${MIN_PASSWORD} karakter olmalı.`)
    if (password !== confirm) return setError('Şifreler birbiriyle aynı değil.')
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (!err) return onSaved()
    const message = authErrorText(err.message)
    if (message === 'REAUTH') {
      setNeedsReset(true)
      setError('Güvenliğin için kimliğini yeniden doğrulaman gerekiyor. E-postana bir şifre sıfırlama bağlantısı gönderebiliriz.')
    } else {
      setError(message)
    }
  }

  const sendReset = async () => {
    if (!email) return
    setSaving(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/hesabim` })
    setSaving(false)
    if (err) return setError(authErrorText(err.message))
    setResetSent(true)
    setError(null)
  }

  if (resetSent) {
    return (
      <p className="sh-set-sent" role="status">
        {email} adresine bir şifre sıfırlama bağlantısı gönderdik. Bağlantıya tıkladığında yeni şifreni buradan belirleyebilirsin.
      </p>
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="sh-set-fields">
        <label className="sh-set-field sh-set-field--pw">
          <small>Yeni şifre</small>
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
            autoFocus
          />
          <button type="button" className="sh-set-eye" onClick={() => setShow(s => !s)} aria-label={show ? 'Şifreyi gizle' : 'Şifreyi göster'}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </label>
        <label className="sh-set-field">
          <small>Yeni şifre (tekrar)</small>
          <input type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
        </label>
      </div>
      {error && (
        <p className="sh-auth-error sh-set-error" role="alert">
          {error}
        </p>
      )}
      <div className="sh-set-actions">
        {needsReset && email ? (
          <button type="button" className="sh-set-save" onClick={() => void sendReset()} disabled={saving}>
            {saving ? 'Gönderiliyor…' : 'Sıfırlama bağlantısı gönder'}
          </button>
        ) : (
          <button type="submit" className="sh-set-save" disabled={saving}>
            {saving ? 'Kaydediliyor…' : 'Şifreyi güncelle'}
          </button>
        )}
      </div>
    </form>
  )
}

function GlobalSignOut({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setBusy(true)
    const { error: err } = await supabase.auth.signOut({ scope: 'global' })
    setBusy(false)
    if (err) return setError(authErrorText(err.message))
    onDone()
  }

  return (
    <div>
      {error && (
        <p className="sh-auth-error sh-set-error" role="alert">
          {error}
        </p>
      )}
      <div className="sh-set-actions">
        <button type="button" className="sh-set-save" onClick={() => void run()} disabled={busy}>
          {busy ? 'Çıkış yapılıyor…' : 'Tüm cihazlardan çıkış yap'}
        </button>
        <button type="button" className="sh-set-textbtn" onClick={onCancel} disabled={busy}>
          Vazgeç
        </button>
      </div>
    </div>
  )
}
