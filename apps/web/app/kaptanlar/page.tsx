import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import CaptainsClient from './CaptainsClient'
import { CAPTAINS } from './data'

export const metadata: Metadata = {
  title: 'Onaylı Kaptanlar — Ahoy',
  description: 'Ahoy kaptanlarını tanıyın: deneyimleri, uzmanlıkları, tekneleri ve misafir yorumları tek yerde.',
}

export default function CaptainsPage() {
  return (
    <div className="sh-home sh-cp">
      {/* başlık */}
      <section className="sh-pg-hero" aria-labelledby="cp-title">
        <div className="sh-container sh-pg-hero-grid">
          <div>
            <p className="sh-cb-kicker">Onaylı kaptanlar</p>
            <h1 id="cp-title" className="sh-cb-title sh-pg-h1">
              Kaptanını
              <span>tanıyarak seç.</span>
            </h1>
          </div>
          <p className="sh-pg-sub">
            Hangi denizleri bildiğini, hangi teknelerle çıktığını ve misafirlerinin ne dediğini gör; rotanı
            kime emanet edeceğine sen karar ver.
          </p>
        </div>
      </section>

      {/* kaptan listesi */}
      <section className="sh-sect sh-sect--white sh-pg-sect">
        <div className="sh-container">
          <CaptainsClient captains={CAPTAINS} />
        </div>
      </section>

      {/* kapanış */}
      <section className="sh-sect sh-sect--cream sh-cb-end" aria-label="Tekne kiralama">
        <div className="sh-container">
          <p className="sh-cb-end-sub">Sıradaki rotan için</p>
          <Link href="/tekne-kiralama" className="sh-cb-end-link">
            <span>Tekneleri keşfet</span>
            <ArrowRight size={52} strokeWidth={1.6} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
