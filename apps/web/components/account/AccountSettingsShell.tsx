'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { Bell, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { useSessionUser } from '@/lib/favorites'
import { PASSWORD_RECOVERY_EVENT, isPasswordRecovery, supabase } from '@/lib/supabase'
import { displayName, initials, memberSince } from '@/lib/account'
import AccountGate, { AccountLoading } from './AccountGate'
import { AccountArt } from './AccountArt'

export const SECURITY_PATH = '/hesabim/giris-ve-guvenlik'

const NAV = [
  { href: '/hesabim', label: 'Kişisel bilgiler', icon: UserRound },
  { href: SECURITY_PATH, label: 'Giriş ve güvenlik', icon: ShieldCheck },
  { href: '/hesabim/bildirimler', label: 'Bildirimler', icon: Bell },
]

/** Hesap ayarları çerçevesi: oturum kapısı, yan menü ve içerik alanı. */
export default function AccountSettingsShell({ children }: { children: ReactNode }) {
  const { user, ready } = useSessionUser()
  const pathname = usePathname()
  const router = useRouter()

  // Şifre sıfırlama bağlantısı /hesabim'e döner: yeni şifre formuna yönlendir.
  useEffect(() => {
    const go = () => {
      if (isPasswordRecovery() && pathname !== SECURITY_PATH) router.replace(SECURITY_PATH)
    }
    go()
    window.addEventListener(PASSWORD_RECOVERY_EVENT, go)
    return () => window.removeEventListener(PASSWORD_RECOVERY_EVENT, go)
  }, [pathname, router])

  if (!ready) return <AccountLoading />
  if (!user) {
    return (
      <div className="sh-acc-page">
        <AccountGate art={<AccountArt />} title="Hesap ayarları" text="Kişisel bilgilerini ve hesap ayarlarını yönetmek için giriş yap." />
      </div>
    )
  }

  const since = memberSince(user)
  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="sh-acc-page sh-acc-page--settings">
      <div className="sh-container sh-set">
        <aside className="sh-set-side">
          <h1>Hesap ayarları</h1>
          <div className="sh-set-me">
            <span className="sh-set-ava" aria-hidden="true">
              {initials(user)}
            </span>
            <span>
              <b>{displayName(user)}</b>
              {since && <small>{since}</small>}
            </span>
          </div>
          <nav className="sh-set-nav" aria-label="Hesap ayarları">
            {NAV.map(({ href, label, icon: Icon }) => {
              const on = pathname === href
              return (
                <Link key={href} href={href} className={on ? 'is-on' : undefined} aria-current={on ? 'page' : undefined}>
                  <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                  {label}
                </Link>
              )
            })}
          </nav>
          <button type="button" className="sh-set-logout" onClick={() => void signOut()}>
            <LogOut size={20} strokeWidth={1.6} aria-hidden="true" />
            Çıkış yap
          </button>
        </aside>
        <div className="sh-set-main">{children}</div>
      </div>
    </div>
  )
}
