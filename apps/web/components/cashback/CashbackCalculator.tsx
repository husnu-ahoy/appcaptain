'use client'

import { useId, useState, type CSSProperties } from 'react'

const MIN = 5000
const MAX = 200000
const STEP = 1000
const FIRST_RATE = 0.05
const NEXT_RATE = 0.15

// "TL'lik" / "TL'ye" ekleri her tutarda doğru okunsun diye para birimi "TL" olarak yazılır
const tl = (n: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n)} TL`

/** Cümle içinde örnek hesaplama: tutar kaydırılınca rakamlar cümlenin içinde değişir. */
export default function CashbackCalculator() {
  const [amount, setAmount] = useState(40000)
  const id = useId()
  const pct = ((amount - MIN) / (MAX - MIN)) * 100

  return (
    <div className="sh-cb-calc">
      <p className="sh-cb-sentence" aria-live="polite">
        <span className="sh-cb-amount">{tl(amount)}</span>’lik bir kiralamada ilk seferinde{' '}
        <b>{tl(Math.round(amount * FIRST_RATE))}</b>, sonraki kiralamalarında <b>{tl(Math.round(amount * NEXT_RATE))}</b>’ye
        kadar bakiyene geri döner.
      </p>
      <div className="sh-cb-slider">
        <label htmlFor={id} className="sh-cb-sr">
          Rezervasyon tutarı
        </label>
        <input
          id={id}
          type="range"
          className="sh-cb-range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          aria-valuetext={tl(amount)}
          style={{ '--p': `${pct}%` } as CSSProperties}
        />
        <div className="sh-cb-range-ends" aria-hidden="true">
          <span>{tl(MIN)}</span>
          <span>Tutarı kaydır</span>
          <span>{tl(MAX)}</span>
        </div>
      </div>
      <p className="sh-cb-note">Örnek bir hesaplamadır. Kesin oran ve koşullar rezervasyon sırasında ve hesap sözleşmende yer alır.</p>
    </div>
  )
}
