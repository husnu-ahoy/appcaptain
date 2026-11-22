'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Star } from 'lucide-react'

import { CAPTAIN_REGIONS, type Captain } from './data'
import { displayName, fmtCount, fmtRating, photo } from './format'

type Sort = 'rating' | 'reviews' | 'experience'

const SORTS: { value: Sort; label: string }[] = [
  { value: 'rating', label: 'En yüksek puan' },
  { value: 'reviews', label: 'En çok yorum' },
  { value: 'experience', label: 'En deneyimli' },
]

/** Kaptan listesi: bölge sekmeleri + sıralama; kutu yok, satırlar ince çizgiyle ayrılır. */
export default function CaptainsClient({ captains }: { captains: Captain[] }) {
  const [region, setRegion] = useState<string>('Tümü')
  const [sort, setSort] = useState<Sort>('rating')

  const tabs = useMemo(
    () =>
      CAPTAIN_REGIONS.map(r => ({
        id: r as string,
        count: r === 'Tümü' ? captains.length : captains.filter(c => c.region === r).length,
      })).filter(t => t.count > 0),
    [captains],
  )

  const shown = useMemo(() => {
    const list = region === 'Tümü' ? [...captains] : captains.filter(c => c.region === region)
    if (sort === 'reviews') return list.sort((a, b) => b.reviewCount - a.reviewCount)
    if (sort === 'experience') return list.sort((a, b) => b.yearsExperience - a.yearsExperience)
    return list.sort((a, b) => b.rating - a.rating)
  }, [captains, region, sort])

  return (
    <>
      <div className="sh-bl-bar">
        <h2 className="sh-bl-label" id="cp-list">
          Kaptanlar
        </h2>
        <div className="sh-cp-controls">
          <div className="sh-bl-tabs" role="group" aria-label="Bölgeye göre süz">
            {tabs.map(t => (
              <button key={t.id} type="button" className="sh-bl-tab" aria-pressed={region === t.id} onClick={() => setRegion(t.id)}>
                {t.id}
                <span>{t.count}</span>
              </button>
            ))}
          </div>
          <label className="sh-cp-sort">
            <span>Sırala</span>
            <select value={sort} onChange={e => setSort(e.target.value as Sort)}>
              {SORTS.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {shown.length > 0 ? (
        <ul className="sh-cp-list" aria-labelledby="cp-list">
          {shown.map(c => (
            <li key={c.id} className="sh-cp-row">
              <div className="sh-cp-photo">
                <Image src={photo(c.avatar, 320)} alt="" fill sizes="(max-width: 860px) 72px, (max-width: 1000px) 96px, 128px" />
              </div>
              <div className="sh-cp-main">
                <p className="sh-bl-meta sh-bl-meta--row">
                  <span className="sh-bl-tag">
                    {c.basePort} · {c.region}
                  </span>
                  {c.superCaptain && <span className="sh-cp-super">Süper Kaptan</span>}
                </p>
                <h3 className="sh-cp-name">
                  <Link href={`/kaptanlar/${c.slug}`} className="sh-cp-link">
                    {displayName(c.name)}
                  </Link>
                </h3>
                <p className="sh-cp-role">{c.title}</p>
                <p className="sh-cp-tags">{c.specialties.join(' · ')}</p>
              </div>
              <dl className="sh-cp-facts">
                <div>
                  <dt>Puan</dt>
                  <dd>
                    <Star size={18} strokeWidth={0} fill="currentColor" aria-hidden="true" />
                    {fmtRating(c.rating)}
                  </dd>
                  <dd className="sh-cp-sub">{fmtCount(c.reviewCount)} yorum</dd>
                </div>
                <div>
                  <dt>Deneyim</dt>
                  <dd>{c.yearsExperience} yıl</dd>
                  <dd className="sh-cp-sub">{fmtCount(c.tripCount)}+ sefer</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      ) : (
        <p className="sh-fm-empty">Bu bölgede henüz kaptan yok.</p>
      )}
    </>
  )
}
