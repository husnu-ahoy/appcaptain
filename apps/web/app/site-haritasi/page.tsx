import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { fetchBoats, fetchExperiences, fetchLocations } from '@/lib/api'
import { getBlogPosts, isBlogPostPublished } from '@/lib/data'
import { SAMPLE_EXPERIENCES } from '@/lib/content/sampleExperiences'
import { EXPERIENCE_TYPES, typeHref } from '@/lib/content/experienceTypes'
import { CAPTAIN_APP_URL, CAPTAIN_SIGNUP_URL } from '@/lib/siteLinks'
import { cleanText } from '@/lib/boatFormat'
import { CAPTAINS } from '../kaptanlar/data'
import { FIRMS } from '../charter-firmalari/data'

export const metadata: Metadata = {
  title: 'Site haritası — Ahoy',
  description: 'Ahoy Boats sitesindeki tüm sayfalar: tekne kiralama, deneyimler, bölgeler, deniz rehberi, kaptanlar ve hesap sayfaları.',
}

// Tekneler, deneyimler ve bölgeler canlı API'den gelir.
export const dynamic = 'force-dynamic'

interface Item {
  href: string
  label: string
  note?: string
  external?: boolean
}
interface Group {
  id: string
  title: string
  desc?: string
  items: Item[]
}

export default async function SiteHaritasiPage() {
  const [boats, experiences, locations] = await Promise.all([fetchBoats({ limit: 100 }), fetchExperiences({ limit: 100 }), fetchLocations()])
  const expItems: Item[] =
    experiences.items.length > 0
      ? experiences.items.map(e => ({ href: `/deneyimler/${e.id}`, label: e.title }))
      : SAMPLE_EXPERIENCES.map(e => ({ href: `/deneyimler/${e.id}`, label: e.title, note: 'Örnek' }))

  const groups: Group[] = [
    {
      id: 'kesfet',
      title: 'Keşfet',
      items: [
        { href: '/', label: 'Ana sayfa' },
        { href: '/tekne-kiralama', label: 'Tekne kiralama' },
        { href: '/tekne-kiralama?model=weekly_charter', label: 'Mavi yolculuk' },
        { href: '/deneyimler', label: 'Deneyimler' },
        { href: '/#lokasyonlar', label: 'Popüler lokasyonlar' },
        { href: '/#map-section', label: 'Rota haritası' },
      ],
    },
    {
      id: 'bolgeler',
      title: 'Bölgelere göre tekne kiralama',
      items: locations.map(l => ({ href: `/tekne-kiralama?city=${encodeURIComponent(l.city)}`, label: `${cleanText(l.city)} tekne kiralama`, note: `${l.boatCount} tekne` })),
    },
    {
      id: 'tekneler',
      title: 'Tekneler',
      desc: 'Yayındaki tüm tekne ilanları',
      items: boats.items.map(b => ({ href: `/listing/${b.id}`, label: cleanText(b.title ?? 'İsimsiz tekne'), note: b.city ? cleanText(b.city) : undefined })),
    },
    {
      id: 'deneyimler',
      title: 'Deneyimler',
      items: [
        { href: '/deneyimler', label: 'Tüm deneyimler' },
        ...EXPERIENCE_TYPES.filter(t => !t.hideWhenEmpty).map(t => ({ href: typeHref(t), label: t.label })),
        ...expItems,
      ],
    },
    {
      id: 'ahoy',
      title: 'Ahoy',
      items: [
        { href: '/neden-ahoy', label: 'Neden Ahoy' },
        { href: '/hakkimizda', label: 'Hakkımızda' },
        { href: '/hakkimizda#iletisim', label: 'İletişim' },
        { href: '/cashback', label: 'Cashback programı' },
        { href: '/site-haritasi', label: 'Site haritası' },
      ],
    },
    {
      id: 'rehber',
      title: 'Topluluk ve deniz rehberi',
      items: [
        { href: '/forum', label: 'Denizci forumu' },
        { href: '/blog', label: 'Deniz rehberi' },
        ...getBlogPosts()
          .filter(p => isBlogPostPublished(p.slug))
          .map(p => ({ href: `/blog/${p.slug}`, label: p.title })),
      ],
    },
    {
      id: 'kaptanlar',
      title: 'Kaptanlar',
      items: [{ href: '/kaptanlar', label: 'Tüm kaptanlar' }, ...CAPTAINS.map(c => ({ href: `/kaptanlar/${c.slug}`, label: c.name }))],
    },
    {
      id: 'charter',
      title: 'Charter firmaları',
      items: [{ href: '/charter-firmalari', label: 'Tüm charter firmaları' }, ...FIRMS.map(f => ({ href: `/charter-firmalari/${f.slug}`, label: f.name }))],
    },
    {
      id: 'tekne-sahipleri',
      title: 'Tekne sahipleri',
      items: [
        { href: '/partner', label: 'Teknesini Ahoy’da listele' },
        { href: CAPTAIN_SIGNUP_URL, label: 'Kaptan hesabı oluştur', external: true },
        { href: CAPTAIN_APP_URL, label: 'Kaptan Paneli', external: true },
      ],
    },
    {
      id: 'hesabim',
      title: 'Hesabım',
      desc: 'Giriş yaptıktan sonra',
      items: [
        { href: '/favorilerim', label: 'Favoriler' },
        { href: '/mesajlarim', label: 'Mesajlar' },
        { href: '/rezervasyonlarim', label: 'Rezervasyonlarım' },
        { href: '/hesabim', label: 'Kişisel bilgiler' },
        { href: '/hesabim/giris-ve-guvenlik', label: 'Giriş ve güvenlik' },
        { href: '/hesabim/bildirimler', label: 'Bildirimler' },
      ],
    },
  ].filter(g => g.items.length > 0)

  return (
    <div className="sh-home sh-sm-page">
      <section className="sh-pg-hero" aria-labelledby="sm-title">
        <div className="sh-container sh-pg-hero-grid">
          <div>
            <p className="sh-cb-kicker">Site haritası</p>
            <h1 id="sm-title" className="sh-cb-title sh-pg-h1">
              Ahoy’daki her sayfa
              <span>tek yerde.</span>
            </h1>
          </div>
          <nav className="sh-sm-jump" aria-label="Bölümler">
            {groups.map(g => (
              <a key={g.id} href={`#${g.id}`}>
                {g.title}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="sh-sect sh-sect--white sh-pg-sect">
        <div className="sh-container">
          {groups.map(g => (
            <section key={g.id} id={g.id} className="sh-sm-group" aria-labelledby={`sm-${g.id}`}>
              <header>
                <h2 id={`sm-${g.id}`}>{g.title}</h2>
                <p>
                  {g.desc ? `${g.desc} · ` : ''}
                  {g.items.length} sayfa
                </p>
              </header>
              <ul>
                {g.items.map(item => (
                  <li key={`${g.id}-${item.href}`}>
                    {item.external ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer">
                        {item.label}
                        <ArrowUpRight size={15} strokeWidth={2} aria-label="(yeni sekmede açılır)" />
                      </a>
                    ) : (
                      <Link href={item.href}>{item.label}</Link>
                    )}
                    {item.note && <small>{item.note}</small>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}
