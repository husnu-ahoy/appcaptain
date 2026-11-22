'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import BoatListCard from '@/components/boats/BoatListCard'
import { fetchBoats, type PublicBoatSummary } from '@/lib/api'
import { useFavorites } from '@/lib/favorites'
import AccountGate, { AccountLoading } from './AccountGate'
import { FavoritesArt } from './AccountArt'

const PAGE_SIZE = 100 // herkese açık liste uç noktasının üst sınırı
const MAX_PAGES = 10

/** Favori ilanları yayındaki tekneler arasında bulur; liste 100'lük sayfalarla taranır. */
async function findBoats(ids: string[]): Promise<Map<string, PublicBoatSummary>> {
  const wanted = new Set(ids)
  const found = new Map<string, PublicBoatSummary>()
  for (let page = 0; page < MAX_PAGES && found.size < wanted.size; page++) {
    const res = await fetchBoats({ limit: PAGE_SIZE, offset: page * PAGE_SIZE })
    for (const boat of res.items) if (wanted.has(boat.id)) found.set(boat.id, boat)
    if (res.items.length < PAGE_SIZE || (page + 1) * PAGE_SIZE >= res.total) break
  }
  return found
}

export default function FavoritesClient() {
  const { user, ready, ids } = useFavorites()
  const [boats, setBoats] = useState<PublicBoatSummary[] | null>(null)
  // Bir kez arananlar: kalpten çıkarınca liste yeniden indirilmez, yalnızca süzülür.
  const cache = useRef(new Map<string, PublicBoatSummary>())
  const searched = useRef(new Set<string>())
  const key = ids.join(',')

  useEffect(() => {
    if (!user) return
    const list = key ? key.split(',') : []
    const pick = () => list.map(id => cache.current.get(id)).filter((b): b is PublicBoatSummary => !!b)
    if (list.every(id => searched.current.has(id))) {
      setBoats(pick())
      return
    }
    let alive = true
    findBoats(list)
      .then(found => {
        found.forEach((boat, id) => cache.current.set(id, boat))
        list.forEach(id => searched.current.add(id))
        if (alive) setBoats(pick())
      })
      .catch(() => alive && setBoats([]))
    return () => {
      alive = false
    }
  }, [key, user])

  if (!ready) return <AccountLoading />
  if (!user) {
    return (
      <div className="sh-acc-page">
        <AccountGate
          art={<FavoritesArt />}
          title="Favoriler"
          text="Beğendiğin tekneleri kaydetmek ve her cihazdan görmek için giriş yap."
        />
      </div>
    )
  }

  const hidden = boats ? ids.length - boats.length : 0

  return (
    <div className="sh-acc-page">
      <div className="sh-container">
        <header className="sh-acc-head">
          <h1>Favoriler</h1>
          {boats && boats.length > 0 && <p>{boats.length} tekne kaydettin</p>}
        </header>

        {boats === null ? (
          <div className="sh-bgrid" aria-busy="true" aria-label="Favoriler yükleniyor">
            {Array.from({ length: Math.min(Math.max(ids.length, 1), 3) }, (_, i) => (
              <div key={i} className="sh-fav-skel" aria-hidden="true">
                <span />
                <i />
                <i />
              </div>
            ))}
          </div>
        ) : boats.length === 0 ? (
          <div className="sh-acc-empty">
            <div className="sh-acc-art" aria-hidden="true">
              <FavoritesArt />
            </div>
            {ids.length > 0 ? (
              <>
                <h2>Kaydettiğin tekneler şu an görüntülenemiyor</h2>
                <p>İlanlar yayından kaldırılmış olabilir. Benzer teknelere göz atıp yenilerini favorilerine ekleyebilirsin.</p>
              </>
            ) : (
              <>
                <h2>Henüz favori teknen yok</h2>
                <p>Beğendiğin teknelerde kalbe dokun; hepsi burada, her cihazında seni bekler.</p>
              </>
            )}
            <Link href="/tekne-kiralama" className="sh-acc-cta">
              Tekneleri keşfet
            </Link>
          </div>
        ) : (
          <>
            <div className="sh-bgrid">
              {boats.map(b => (
                <BoatListCard key={b.id} boat={b} />
              ))}
            </div>
            {hidden > 0 && (
              <p className="sh-fav-note">
                {hidden} favori teknen şu an yayında olmadığı için listede görünmüyor.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
