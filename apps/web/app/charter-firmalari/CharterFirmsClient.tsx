'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, MapPin, RotateCcw, Sailboat, Search, X } from 'lucide-react'

import { COUNTRIES, FIRMS } from './data'
import FirmMark from './FirmMark'

/** Charter firmaları: ülke → şehir filtresi, isimle arama ve ince çizgilerle ayrılan firma listesi. */
export default function CharterFirmsClient() {
  const [country, setCountry] = useState<string | null>(null)
  const [city, setCity] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  // yalnızca firması olan ülkeler, firma sayısıyla
  const countries = useMemo(
    () =>
      COUNTRIES.map(c => ({ ...c, count: FIRMS.filter(f => f.countryId === c.id).length })).filter(c => c.count > 0),
    [],
  )

  const cities = useMemo(() => {
    if (!country) return []
    const counts = new Map<string, number>()
    for (const f of FIRMS) if (f.countryId === country) counts.set(f.city, (counts.get(f.city) ?? 0) + 1)
    return [...counts].map(([name, count]) => ({ name, count }))
  }, [country])

  const q = query.trim().toLocaleLowerCase('tr')
  const firms = useMemo(
    () =>
      FIRMS.filter(
        f =>
          (!country || f.countryId === country) &&
          (!city || f.city === city) &&
          (!q || f.name.toLocaleLowerCase('tr').includes(q)),
      ),
    [country, city, q],
  )

  const filtered = Boolean(country || city || q)
  const reset = () => {
    setCountry(null)
    setCity(null)
    setQuery('')
  }
  const pickCountry = (id: string | null) => {
    setCountry(id)
    setCity(null)
  }

  return (
    <div className="sh-home sh-rl-page sh-cf-page">
      <div className="sh-container">
        <nav className="sh-crumbs" aria-label="Sayfa yolu">
          <Link href="/">Ana sayfa</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Charter firmaları</span>
        </nav>
        <header className="sh-rl-head sh-cf-head">
          <h1 className="sh-rl-title">
            Charter firmaları
            <span className="sh-cf-serif">tek bir yerde.</span>
          </h1>
          <p className="sh-rl-sub">
            Sıradaki tekne kiralama ya da deneyim planın için Ahoy’daki charter firmalarını keşfet; rotalarını, filolarını
            ve kampanyalarını karşılaştır.
          </p>
        </header>
      </div>

      {/* beyaz tabaka: filtreler + liste */}
      <div className="sh-rl-sheet">
        <div className="sh-container">
          <div className="sh-cf-tools">
            <div className="sh-cf-filters">
              <div className="sh-cf-chips" role="group" aria-label="Ülkeye göre filtrele">
                <button type="button" className="sh-chip" aria-pressed={!country} onClick={() => pickCountry(null)}>
                  Tümü <span>{FIRMS.length}</span>
                </button>
                {countries.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className="sh-chip"
                    aria-pressed={country === c.id}
                    onClick={() => pickCountry(country === c.id ? null : c.id)}
                  >
                    {c.label} <span>{c.count}</span>
                  </button>
                ))}
              </div>
              {cities.length > 1 && (
                <div className="sh-cf-chips sh-cf-chips--sm" role="group" aria-label="Şehre göre filtrele">
                  <button type="button" className="sh-chip" aria-pressed={!city} onClick={() => setCity(null)}>
                    Tüm şehirler
                  </button>
                  {cities.map(c => (
                    <button
                      key={c.name}
                      type="button"
                      className="sh-chip"
                      aria-pressed={city === c.name}
                      onClick={() => setCity(city === c.name ? null : c.name)}
                    >
                      {c.name} <span>{c.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="sh-cf-search" role="search">
              <Search size={18} strokeWidth={2} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Firma ara"
                aria-label="Firma ara"
                autoComplete="off"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Aramayı temizle">
                  <X size={15} strokeWidth={2.4} />
                </button>
              )}
            </div>
          </div>

          <div className="sh-cf-count">
            <h2 id="cf-count">{firms.length > 0 ? `${firms.length} charter firması` : 'Firma bulunamadı'}</h2>
            {filtered && (
              <button type="button" className="sh-link-btn" onClick={reset}>
                Temizle
              </button>
            )}
          </div>

          {firms.length > 0 ? (
            <ul className="sh-cf-list" aria-labelledby="cf-count">
              {firms.map(f => (
                <li key={f.id} className="sh-cf-row">
                  <FirmMark firm={f} />
                  <div className="sh-cf-main">
                    <h3 className="sh-cf-name">
                      {/* satırın tamamı tıklanır (::after), ekran okuyucu yalnızca firma adını okur */}
                      <Link href={`/charter-firmalari/${f.slug}`} className="sh-cf-link">
                        {f.name}
                      </Link>
                    </h3>
                    <p className="sh-cf-loc">
                      <MapPin size={15} strokeWidth={2} aria-hidden="true" /> {f.city}, {f.countryLabel}
                    </p>
                    <p className="sh-cf-sum">{f.summary}</p>
                  </div>
                  <div className="sh-cf-mini">
                    <p className="sh-cf-label">Popüler rotalar</p>
                    <ul>
                      {f.routes.map(r => (
                        <li key={`${r.from}-${r.to}`}>
                          {r.from} <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" /> {r.to}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <span className="sh-cf-go" aria-hidden="true">
                    İncele <ArrowRight size={17} strokeWidth={2.2} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="sh-empty">
              <span className="sh-empty-ico">
                <Search size={28} strokeWidth={1.8} />
              </span>
              <h3>Aramana uygun firma bulunamadı</h3>
              <p>Farklı bir ülke seçmeyi ya da aramayı temizlemeyi dene.</p>
              <button type="button" className="sh-btn sh-btn--navy" onClick={reset}>
                <RotateCcw size={16} aria-hidden="true" /> Filtreleri temizle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* krem bant: firmalar için partner çağrısı */}
      <div className="sh-rl-band sh-cf-band">
        <div className="sh-container">
          <aside className="sh-deal sh-cf-cta" aria-label="Charter firmaları için">
            <span className="sh-cf-cta-ico" aria-hidden="true">
              <Sailboat size={28} strokeWidth={1.8} />
            </span>
            <div className="sh-deal-text">
              <p className="sh-deal-title">Charter firman mı var?</p>
              <p className="sh-deal-sub">Teknelerini Ahoy’da listele, rezervasyon taleplerini tek panelden yönet.</p>
            </div>
            <Link href="/partner" className="sh-btn sh-btn--white">
              Partner ol
            </Link>
          </aside>
        </div>
      </div>
    </div>
  )
}
