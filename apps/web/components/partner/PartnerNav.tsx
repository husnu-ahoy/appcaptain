import Link from 'next/link'
import { Logo } from '@/components/home/Logo'
import { CAPTAIN_LOGIN_URL, CAPTAIN_SIGNUP_URL } from '@/lib/siteLinks'

const LINKS = [
  { href: '#nasil', label: 'Nasıl çalışır' },
  { href: '#panel', label: 'Kaptan paneli' },
  { href: '#sss', label: 'Sorular' },
]

/** Partner sayfasının üst menüsü — ana menünün görünümünde, tekne sahiplerine göre sade. */
export default function PartnerNav() {
  return (
    <header className="sh-pt-nav">
      <div className="sh-container sh-pt-nav-inner">
        <Link href="/partner" className="sh-pt-brand" aria-label="Ahoy Partner">
          <Logo />
          <span className="sh-pt-tag">Partner</span>
        </Link>
        <nav className="sh-pt-links" aria-label="Sayfa bölümleri">
          {LINKS.map(l => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="sh-pt-actions">
          <a href={CAPTAIN_LOGIN_URL} className="sh-pt-login">
            Giriş yap
          </a>
          <a href={CAPTAIN_SIGNUP_URL} className="sh-btn sh-btn--navy sh-pt-cta">
            Tekneni ekle
          </a>
        </div>
      </div>
    </header>
  )
}
