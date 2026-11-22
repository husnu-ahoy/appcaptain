'use client'

import { useCallback, useState, type ReactNode } from 'react'
import AuthModal from '@/components/auth/AuthModal'

/** Hesap sayfalarında oturum yokken gösterilen giriş çağrısı. */
export default function AccountGate({ art, title, text }: { art: ReactNode; title: string; text: string }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <div className="sh-acc-empty sh-acc-empty--page">
      <div className="sh-acc-art" aria-hidden="true">
        {art}
      </div>
      <h1>{title}</h1>
      <p>{text}</p>
      <button type="button" className="sh-acc-cta" onClick={() => setOpen(true)}>
        Giriş yap
      </button>
      {open && <AuthModal reason={text} onClose={close} />}
    </div>
  )
}

/** Oturum okunurken: sayfa zıplamasın diye yer tutar. */
export function AccountLoading() {
  return (
    <div className="sh-acc-loading" role="status" aria-label="Yükleniyor">
      <span className="sh-acc-spinner" aria-hidden="true" />
    </div>
  )
}
