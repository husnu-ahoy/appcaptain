import type { Metadata } from 'next'
import Image from 'next/image'
import type { CSSProperties } from 'react'
import {
  ArrowRight,
  CalendarCheck,
  ChevronRight,
  ChevronUp,
  Headset,
  MessageCircle,
  Rocket,
  Sailboat,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { Logo } from '@/components/home/Logo'
import { FaqList } from '@/components/pages/Editorial'
import PartnerNav from '@/components/partner/PartnerNav'
import PartnerSteps from '@/components/partner/PartnerSteps'
import { CAPTAIN_APP_URL, CAPTAIN_LOGIN_URL, CAPTAIN_SIGNUP_URL } from '@/lib/siteLinks'

/**
 * Tekne sahipleri için tanıtım sayfası (partner.<alan-adı> → middleware ile buraya).
 * Akış Bókun'un tanıtım sayfasına benzer; renk, yazı tipi ve bileşenler ana sayfanınkiler.
 * Metinler yalnızca kaptan panelinde gerçekten olan özellikleri anlatır; rakamlar da
 * ürünün kendi seçeneklerinden gelir (4 tekne tipi, 3 iptal politikası, ücretsiz hesap).
 */

export const metadata: Metadata = {
  title: 'Tekneni Ahoy’da listele — Ahoy Partner',
  description:
    'Ücretsiz kaptan hesabını oluştur, tekneni Ahoy’da listele; takvimini, rezervasyon taleplerini ve misafir mesajlarını tek panelden yönet.',
}

const PILLARS = [
  { icon: Users, title: 'Misafirlerle buluş', text: 'İlanın, tekne kiralamak isteyen misafirlerin arama sonuçlarında yer alır.' },
  { icon: CalendarCheck, title: 'Daha az iş yükü', text: 'Takvim, talepler ve mesajlar tek panelde; müsaitliğini tek yerden güncellersin.' },
  { icon: Rocket, title: 'Hızlı başla', text: 'Ücretsiz hesabını aç, ilanını adım adım oluştur; ekibimiz inceleyip yayına alsın.' },
]

// Sitedeki arama önerileriyle aynı rotalar (NavWrapper)
const CITIES: { name: string; region: string; x: number; y: number; s: number }[] = [
  { name: 'Göcek', region: 'Muğla', x: 36, y: 0, s: 27 },
  { name: 'Bodrum', region: 'Muğla', x: 67, y: 10, s: 26 },
  { name: 'Marmaris', region: 'Muğla', x: 6, y: 22, s: 26 },
  { name: 'Fethiye', region: 'Muğla', x: 38, y: 33, s: 29 },
  { name: 'Kaş', region: 'Antalya', x: 72, y: 43, s: 25 },
  { name: 'Çeşme', region: 'İzmir', x: 2, y: 56, s: 25 },
  { name: 'Datça', region: 'Muğla', x: 28, y: 68, s: 25 },
  { name: 'Antalya', region: 'Antalya', x: 56, y: 71, s: 27 },
]

const STATS = [
  { icon: Sailboat, value: '4', text: 'tekne tipi listeleyebilirsin: yelkenli, motoryat, gulet ve katamaran.' },
  { icon: ShieldCheck, value: '3', text: 'iptal politikası arasından seçersin: esnek, orta ya da katı.' },
  { icon: Wallet, value: '0 ₺', text: 'kaptan panelinde hesap açma ücreti.' },
]

const KINDS = [
  {
    title: 'Tekne',
    text: 'Yelkenli, motoryat, gulet ya da katamaranını saatlik, günlük, gecelik veya haftalık kiralamaya aç.',
    img: '/home/boat-gulet.webp',
    cta: 'Tekne ilanı oluştur',
  },
  {
    title: 'Deneyim',
    text: 'Tekne turu, dalış ya da balık avı gibi deneyimlerini aynı hesaptan ayrı ilan olarak yayınla.',
    img: '/pages/fishing.webp',
    cta: 'Deneyim ilanı oluştur',
  },
]

const FAQ = [
  {
    q: 'Ahoy’da ilan vermek için neler gerekiyor?',
    a: 'Kaptan panelinde hesabını oluşturman, tekneni fotoğrafları ve bilgileriyle tanıtman ve ruhsat, sigorta gibi belgelerini yüklemen yeterli. İlanın ekibimiz tarafından incelendikten sonra yayına alınır.',
  },
  {
    q: 'Hangi tekneleri listeleyebilirim?',
    a: 'Şu an yelkenli, motoryat, gulet ve katamaran ilanı oluşturabilirsin. Tur ve deneyimlerini de ayrı ilan olarak yayınlayabilirsin.',
  },
  {
    q: 'Fiyatları kim belirliyor?',
    a: 'Sen. Saatlik, günlük, gecelik ve haftalık kiralama seçeneklerinden sana uyanları seçip fiyatlarını belirlersin; dilediğin zaman panelden güncelleyebilirsin.',
  },
  {
    q: 'Rezervasyon talepleri bana nasıl ulaşıyor?',
    a: 'Misafir tarih ve kişi sayısını seçip talep gönderir; talep kaptan panelindeki Rezervasyonlar ekranına düşer. Talebi onaylayabilir ya da istersen gerekçesini yazarak reddedebilirsin.',
  },
  {
    q: 'Müsait olmadığım günleri nasıl kapatırım?',
    a: 'Takvim ekranından tarih aralığı seçip blokaj eklersin. Kapalı tarihler ilanında seçilemez, misafirler bu günler için talep gönderemez.',
  },
  {
    q: 'İptal politikasını ben mi seçiyorum?',
    a: 'Evet. Esnek, orta ve katı iptal politikalarından birini seçersin; seçtiğin politika ilanında misafirlere açıkça gösterilir.',
  },
]

const caret = <ChevronUp size={24} strokeWidth={3} aria-hidden="true" />

export default function PartnerPage() {
  return (
    <div className="sh-home sh-ed sh-pt">
      <PartnerNav />

      {/* ---------- hero ---------- */}
      <section className="sh-pt-hero">
        <div className="sh-container sh-pt-hero-grid">
          <div>
            <h1 className="sh-pt-h1">
              Listele. Yönet.
              <br />
              Rezervasyon al.
            </h1>
            <p className="sh-pt-lede">
              Teknen limanda boş beklemesin. Ahoy’da ilanını oluştur; takvimini, rezervasyon taleplerini ve misafir mesajlarını tek panelden yönet.
            </p>
            <div className="sh-pt-facts">
              <div>
                <b>Ücretsiz hesap</b>
                <p>Kaptan panelinde hesap açmak ücretsizdir.</p>
              </div>
              <div>
                <b>Fiyat sende</b>
                <p>Fiyatlarını ve kurallarını sen belirlersin.</p>
              </div>
            </div>
            <div className="sh-pt-ctas">
              <a href={CAPTAIN_SIGNUP_URL} className="sh-btn sh-btn--navy">
                Tekneni ekle <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
              </a>
              <a href="#nasil" className="sh-link-arrow">
                Nasıl çalışır?
              </a>
            </div>
          </div>

          {/* tekne — Ahoy — misafir: aynı yörüngede */}
          <div className="sh-pt-orbit" aria-hidden="true">
            <svg className="sh-pt-orbit-rings" viewBox="0 0 560 560">
              <circle cx="280" cy="280" r="232" fill="none" stroke="#183D85" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="12 12" />
              <circle cx="280" cy="280" r="176" fill="none" stroke="#50B1D4" strokeWidth="2.5" strokeDasharray="12 12" />
            </svg>
            <span className="sh-pt-orb sh-pt-orb--boat">
              {/* Fotoğraf: Ruhsen Toygun, Pexels (36445086) — Pexels Lisansı */}
              <Image src="/partner/gocek-marina.webp" alt="" fill sizes="300px" />
            </span>
            <span className="sh-pt-orb sh-pt-orb--brand">
              <Logo />
            </span>
            <span className="sh-pt-orb sh-pt-orb--guest">
              <Image src="/home/hero.webp" alt="" fill sizes="260px" />
            </span>
          </div>
        </div>
      </section>

      {/* ---------- lacivert bant ---------- */}
      <section className="sh-sect sh-sect--white sh-pt-sect sh-pt-sect--tight">
        <div className="sh-container">
          <div className="sh-pt-band">
            <h2 className="sh-pt-h2 sh-pt-h2--light">
              Rezervasyonlara merhaba.
              <br />
              Karmaşaya elveda.
            </h2>
            <ul className="sh-pt-pillars">
              {PILLARS.map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <Icon size={56} strokeWidth={2.2} aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- rotalar ---------- */}
      <section className="sh-sect sh-sect--cream sh-pt-sect">
        <div className="sh-container sh-pt-split">
          <div>
            <h2 className="sh-pt-h2">
              Mavi kıyılarda
              <br />
              görünür ol
            </h2>
            <p className="sh-pt-text">Misafirler Ahoy’da lokasyona, tekne tipine ve kişi sayısına göre arama yapar; ilanın bu aramalarda karşılarına çıkar.</p>
            <ul className="sh-pt-checks">
              <li>
                {caret}
                <span>Göcek’ten Çeşme’ye popüler rotalarda listelen</span>
                {/* Partner alt alan adında ana alan adına tam sayfa geçiş gerekir (middleware yönlendirir) */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/tekne-kiralama" className="sh-pt-pill">
                  Tekneleri gör
                </a>
              </li>
              <li>
                {caret}
                <span>Saatlik, günlük, gecelik ya da haftalık kiralama seçenekleri sun</span>
              </li>
              <li>
                {caret}
                <span>Tur ve deneyimlerini de ayrı ilan olarak yayınla</span>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/deneyimler" className="sh-pt-pill">
                  Deneyimleri gör
                </a>
              </li>
            </ul>
            <a href={CAPTAIN_SIGNUP_URL} className="sh-btn sh-btn--navy sh-pt-btn">
              Tekneni ekle
            </a>
          </div>

          <ul className="sh-pt-bubbles" aria-label="Popüler rotalar">
            {CITIES.map(c => (
              <li key={c.name} className="sh-pt-bubble" style={{ '--x': `${c.x}%`, '--y': `${c.y}%`, '--s': `${c.s}%` } as CSSProperties}>
                <b>{c.name}</b>
                <small>{c.region}</small>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- kaptan paneli: gerçek ekran ---------- */}
      <section className="sh-sect sh-sect--white sh-pt-sect" id="panel">
        <div className="sh-pt-showcase">
          <div className="sh-pt-shot">
            {/* Kaptan paneli, Rezervasyonlar ekranı — örnek verilerle */}
            <Image
              src="/partner/panel-bookings.webp"
              alt="Ahoy kaptan panelinde Rezervasyonlar ekranı: bekleyen talepler ve Onayla, Reddet butonları"
              fill
              sizes="(max-width: 860px) 100vw, 800px"
            />
          </div>
          <div>
            <h2 className="sh-pt-h2">
              Her şey
              <br />
              tek panelde
            </h2>
            <p className="sh-pt-text">Rezervasyon taleplerini, takvimini ve misafir mesajlarını aynı yerden yönetirsin.</p>
            <ul className="sh-pt-checks">
              <li>
                {caret}
                <span>Talepleri onayla ya da reddet, durumlarını tek listede takip et</span>
              </li>
              <li>
                {caret}
                <span>Müsait olmadığın tarihleri takvimden kapat</span>
              </li>
              <li>
                {caret}
                <span>Misafirlerinle mesajlaş, kazançlarını ve ödeme durumlarını gör</span>
              </li>
              <li>
                {caret}
                <span>Seçtiğin tarihler için indirim tanımla</span>
              </li>
            </ul>
            <a href={CAPTAIN_APP_URL} className="sh-btn sh-btn--navy sh-pt-btn">
              Kaptan paneline git
            </a>
          </div>
        </div>
      </section>

      {/* ---------- nasıl çalışır ---------- */}
      <section className="sh-sect sh-sect--cream sh-pt-sect" id="nasil">
        <div className="sh-container">
          <div className="sh-pt-head">
            <h2 className="sh-pt-h2">Dört adımda yayındasın</h2>
            <p className="sh-pt-text">Hesap açmaktan ilk talebe kadar her şey kaptan panelinde.</p>
          </div>
          <PartnerSteps />
        </div>
      </section>

      {/* ---------- ürünün kendi rakamları ---------- */}
      <section className="sh-sect sh-sect--white sh-pt-sect">
        <div className="sh-container">
          <h2 className="sh-pt-h2 sh-pt-center">
            Sen denizi bilirsin.
            <br />
            Biz teknolojiyi.
          </h2>
          <ul className="sh-pt-stats">
            {STATS.map(({ icon: Icon, value, text }) => (
              <li key={value}>
                <span className="sh-pt-stat-ico">
                  <Icon size={40} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <b>{value}</b>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- ne listeleyebilirsin ---------- */}
      <section className="sh-sect sh-sect--cream sh-pt-sect">
        <div className="sh-container">
          <div className="sh-pt-head">
            <h2 className="sh-pt-h2">Ne listelemek istersin?</h2>
            <p className="sh-pt-text">Teknelerini ve deneyimlerini aynı hesaptan yönetirsin.</p>
          </div>
          <div className="sh-pt-cards">
            {KINDS.map(k => (
              <article key={k.title} className="sh-pt-card">
                <div className="sh-pt-card-img">
                  <Image src={k.img} alt="" fill sizes="(max-width: 860px) 100vw, 600px" />
                </div>
                <h3>{k.title}</h3>
                <p>{k.text}</p>
                <a href={CAPTAIN_SIGNUP_URL} className="sh-pt-pill">
                  {k.cta} <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- destek ---------- */}
      <section className="sh-sect sh-sect--white sh-pt-sect sh-pt-support">
        <svg className="sh-pt-buoy" viewBox="0 0 200 200" aria-hidden="true">
          {/* can simidi: kalın halka, dört beyaz bant */}
          <circle cx="100" cy="100" r="70" fill="none" stroke="#50B1D4" strokeWidth="44" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="#fff" strokeWidth="44" strokeDasharray="34 76" strokeDashoffset="17" />
          <circle cx="100" cy="100" r="92" fill="none" stroke="#0E2035" strokeWidth="3" />
          <circle cx="100" cy="100" r="48" fill="none" stroke="#0E2035" strokeWidth="3" />
        </svg>
        <div className="sh-container sh-pt-support-inner">
          <h2 className="sh-pt-h2">
            Takıldığın yerde
            <br />
            yanındayız.
          </h2>
          <p className="sh-pt-text">
            İlanını oluştururken, belgelerini yüklerken ya da ilk talebini yanıtlarken aklına takılan her şey için ekibimiz burada. Çağrı merkezimizi ara ya da
            WhatsApp’tan yaz.
          </p>
          <ul className="sh-pt-support-links">
            <li>
              <span className="sh-ed-contact-ico">
                <Headset size={22} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <span>
                <small>Çağrı merkezi</small>
                <a href="tel:08504339070">0850 433 9070</a>
              </span>
            </li>
            <li>
              <span className="sh-ed-contact-ico">
                <MessageCircle size={22} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <span>
                <small>WhatsApp destek hattı</small>
                <a href="https://wa.me/908504339071">0850 433 9071</a>
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* ---------- sık sorulanlar ---------- */}
      <section className="sh-sect sh-sect--cream sh-pt-sect" id="sss">
        <div className="sh-container sh-ed-faq">
          <div>
            <h2 className="sh-pt-h2">Sık sorulan sorular</h2>
            <p className="sh-pt-text">İlan, fiyat ve rezervasyon süreci hakkında merak edilenler.</p>
          </div>
          <FaqList items={FAQ} />
        </div>
      </section>

      {/* ---------- kapanış: lacivert panel ---------- */}
      <section className="sh-sect sh-sect--white sh-pt-sect sh-pt-sect--end">
        <div className="sh-container">
          <div className="sh-pt-final">
            <svg className="sh-pt-sails" viewBox="0 0 320 300" aria-hidden="true">
              {/* iki yelken: ana yelken ve flok */}
              <path d="M150 10 L150 250 L20 250 Z" />
              <path d="M178 40 L300 250 L178 250 Z" />
              <path d="M10 270 H310" strokeWidth="18" strokeLinecap="round" />
            </svg>
            <h2 className="sh-pt-h2">Ahoy’da bugün başla</h2>
            <p>Hesap açmak ücretsiz. İlanını birkaç adımda oluştur; ekibimiz inceleyip yayına alsın.</p>
            <div className="sh-pt-final-ctas">
              <a href={CAPTAIN_SIGNUP_URL} className="sh-btn sh-pt-btn-sky">
                Ücretsiz hesabını oluştur
              </a>
              <a href={CAPTAIN_LOGIN_URL} className="sh-pt-final-login">
                Zaten hesabın var mı? Giriş yap
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
