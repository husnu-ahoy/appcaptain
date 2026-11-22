import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FaqList } from '@/components/pages/Editorial'
import CashbackCalculator from '@/components/cashback/CashbackCalculator'

export const metadata: Metadata = {
  title: 'Ahoy Cashback — Her rota bir sonrakini ucuzlatır',
  description:
    'Ahoy’da ilk onaylı kiralamanda %5, sonraki kiralamalarında %15’e varan cashback. Ek ücret yok, başvuru gerekmez.',
}

const STEPS = [
  { title: 'Rezervasyonunu yap.', text: 'Tekneni ya da deneyimini seç, rezervasyon talebini Ahoy üzerinden gönder.' },
  {
    title: 'Kiralaman tamamlansın.',
    text: 'Kaptan talebini onaylayıp ödemen tamamlandığında ve iptal süresi geçtiğinde cashback hesaplanır.',
  },
  {
    title: 'Bakiyen sıradaki rotanda düşsün.',
    text: 'Kazandığın tutar Ahoy bakiyene eklenir; bir sonraki uygun rezervasyonunda indirim olarak kullanırsın.',
  },
]

const TERMS = [
  { title: 'Ek ücret yok', text: 'Cashback için fazladan bir şey ödemezsin.' },
  { title: 'Başvuru gerekmez', text: 'Uygun rezervasyonlarda kendiliğinden hesaplanır.' },
  { title: 'Tamamlananlarda geçerli', text: 'Yalnızca geçerli ve tamamlanmış rezervasyonlar için.' },
  { title: 'Oranlar değişebilir', text: 'Kampanya dönemine ve iş ortağına göre güncellenebilir.' },
]

const FAQ = [
  {
    q: 'Cashback ne zaman tanımlanır?',
    a: 'Rezervasyonunun ödemesi tamamlandıktan ve iptal süresi geçtikten sonra, uygun rezervasyonlarda bakiyene eklenir.',
  },
  {
    q: 'Her rezervasyonda aynı oran mı geçerli?',
    a: 'İlk onaylı kiralamanda %5 geçerlidir. İkinci ve sonraki uygun rezervasyonlarında daha yüksek oranlar uygulanabilir; örneğin %15.',
  },
  {
    q: 'İptal veya değişiklikte ne olur?',
    a: 'İptal ve kısmi iade kuralları iş ortağının iptal politikasına göre değişir; cashback yalnızca geçerli ve tamamlanmış rezervasyonlar için hesaplanır.',
  },
  {
    q: 'Bakiyemi nerede kullanırım?',
    a: 'Bakiyeni bir sonraki uygun tekne ya da deneyim rezervasyonunda indirim olarak kullanırsın.',
  },
]

export default function CashbackProgramPage() {
  return (
    <div className="sh-home sh-cb">
      {/* açılış: başlık + dev oranlar + cümle içinde hesaplama */}
      <section className="sh-cb-hero" aria-labelledby="cb-title">
        <div className="sh-container">
          <p className="sh-cb-kicker">Ahoy Cashback</p>
          <h1 id="cb-title" className="sh-cb-title">
            Her rota
            <span>bir sonrakini ucuzlatır.</span>
          </h1>

          <div className="sh-cb-stage">
            <div className="sh-cb-rates">
              <p className="sh-cb-rate sh-cb-rate--first">
                <span className="sh-cb-num">%5</span>
                <span className="sh-cb-cap">ilk kiralamanda</span>
              </p>
              <svg className="sh-cb-arrow" viewBox="0 0 96 16" aria-hidden="true">
                <path d="M0 8h88M81 1.5 88 8l-7 6.5" />
              </svg>
              <p className="sh-cb-rate sh-cb-rate--next">
                <span className="sh-cb-num">
                  %15<small>’e varan</small>
                </span>
                <span className="sh-cb-cap">sonraki kiralamalarında</span>
              </p>
            </div>
            <div className="sh-cb-aside">
              <p>
                Ahoy’da tamamlanan her kiralamada tutarın bir kısmı bakiyene döner; sıradaki rotanda indirim olarak
                kullanırsın. Ek ücret yok, başvuru gerekmez.
              </p>
              <Link href="/tekne-kiralama" className="sh-btn sh-btn--navy">
                Tekne ara <ArrowRight size={18} strokeWidth={1.9} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <CashbackCalculator />
        </div>
      </section>

      {/* nasıl işler + koşullar + sorular */}
      <section className="sh-sect sh-sect--white sh-cb-sect" aria-labelledby="cb-how">
        <div className="sh-container">
          <h2 id="cb-how" className="sh-cb-label">
            Nasıl işler?
          </h2>
          <ol className="sh-cb-steps">
            {STEPS.map(s => (
              <li key={s.title}>
                <p className="sh-cb-step">{s.title}</p>
                <p className="sh-cb-step-note">{s.text}</p>
              </li>
            ))}
          </ol>

          <ul className="sh-cb-terms" aria-label="Kısaca koşullar">
            {TERMS.map(t => (
              <li key={t.title}>
                {t.title}
                <span>{t.text}</span>
              </li>
            ))}
          </ul>

          <div className="sh-cb-faq">
            <h2>Sorular</h2>
            <FaqList items={FAQ} />
          </div>
        </div>
      </section>

      {/* kapanış */}
      <section className="sh-sect sh-sect--cream sh-cb-end" aria-label="Rezervasyona başla">
        <div className="sh-container">
          <p className="sh-cb-end-sub">Sıradaki rotan seni bekliyor.</p>
          <Link href="/tekne-kiralama" className="sh-cb-end-link">
            <span>Tekneleri keşfet</span>
            <ArrowRight size={52} strokeWidth={1.6} aria-hidden="true" />
          </Link>
          <p className="sh-cb-legal">
            Ahoy Cashback oranları ve koşulları kampanya dönemlerine göre değişebilir. Kesin kurallar rezervasyon sırasında ve
            hesap sözleşmende yer alır.
          </p>
        </div>
      </section>
    </div>
  )
}
