'use client'

import Image from 'next/image'
import { useState, type KeyboardEvent } from 'react'

/** Görseller kaptan panelinin gerçek ekranlarıdır (örnek verilerle). */
const STEPS = [
  {
    tab: 'Hesabını oluştur',
    title: 'Hesabını oluştur',
    text: 'Kaptan panelinde adın, e-postan ve bir şifreyle birkaç dakikada ücretsiz hesap açarsın. Ardından iletişim bilgilerini tamamlayıp ilk ilanına geçersin.',
    img: '/partner/step-signup.webp',
    alt: 'Kaptan panelinde “Ahoy kaptanı ol” kayıt formu',
  },
  {
    tab: 'Tekneni tanıt',
    title: 'Tekneni tanıt',
    text: 'İlan sihirbazı seni adım adım yönlendirir: kiralama modeli, tekne tipi, donanımlar, konum, fotoğraflar ve fiyatlar. Bilgilerin her adımda kaydedilir; istediğin zaman kaldığın yerden devam edersin.',
    img: '/partner/step-wizard.webp',
    alt: 'İlan sihirbazının dört aşaması: tekne bilgileri, donanımlar, fotoğraf ve fiyatlar, belgeler',
  },
  {
    tab: 'Belgelerini yükle',
    title: 'Belgelerini yükle',
    text: 'Ruhsat ve sigorta gibi belgeleri yükleyip ilanını incelemeye gönderirsin. Ekibimiz kontrol eder; onaylandığında ilanın yayına girer, durumunu Teknelerim ekranında görürsün.',
    img: '/partner/step-review.webp',
    alt: 'Teknelerim ekranında “İncelemede” ve “Yayında” durumundaki iki ilan',
  },
  {
    tab: 'Talepleri yanıtla',
    title: 'Talepleri yanıtla',
    text: 'Misafir talebi Rezervasyonlar ekranına düşer; tarihleri, kişi sayısını ve fiyatı görüp tek tıkla onaylar ya da reddedersin. Misafirlerinle mesajlaşır, takvimini güncel tutarsın.',
    img: '/partner/step-requests.webp',
    alt: 'Rezervasyonlar ekranında bekleyen bir talep ve Onayla, Reddet butonları',
  },
]

/** "Nasıl çalışır?" — sekmeli kart (Bókun'daki sağlayıcı sekmeleri gibi), Ahoy renkleriyle. */
export default function PartnerSteps() {
  const [active, setActive] = useState(0)
  const step = STEPS[active]!

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = (active + (e.key === 'ArrowRight' ? 1 : STEPS.length - 1)) % STEPS.length
    setActive(next)
    document.getElementById(`pt-step-tab-${next}`)?.focus()
  }

  return (
    <div className="sh-pt-tabs">
      <div className="sh-pt-tabbar" role="tablist" aria-label="Adımlar" onKeyDown={onKey}>
        {STEPS.map((s, i) => (
          <button
            key={s.tab}
            id={`pt-step-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls="pt-step-panel"
            tabIndex={i === active ? 0 : -1}
            className={i === active ? 'is-active' : undefined}
            onClick={() => setActive(i)}
          >
            <span className="sh-pt-tab-no">{String(i + 1).padStart(2, '0')}</span>
            {s.tab}
          </button>
        ))}
      </div>
      <div className="sh-pt-tabpanel" id="pt-step-panel" role="tabpanel" aria-labelledby={`pt-step-tab-${active}`}>
        <div className="sh-pt-tabcopy" key={active}>
          <p className="sh-pt-tabcount">
            Adım {active + 1} / {STEPS.length}
          </p>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </div>
        {/* dört görsel üst üste; seçili olan görünür — sekme değişince yeniden yükleme beklenmez */}
        <div className="sh-pt-tabshot">
          {STEPS.map((s, i) => (
            <Image
              key={s.img}
              src={s.img}
              alt={i === active ? s.alt : ''}
              aria-hidden={i !== active}
              fill
              sizes="(max-width: 860px) 100vw, 640px"
              className={i === active ? 'is-on' : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
