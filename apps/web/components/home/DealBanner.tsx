import Link from 'next/link'
import { DEAL } from './content'

/** Kampanya bandı — Figma: ana sayfada tanıtım kartlarının altındaki lacivert şerit. Metin: content.ts → DEAL */
export default function DealBanner() {
  return (
    <div className="sh-container">
      <aside className="sh-deal" aria-label="Kampanya">
        <DealIcon />
        <div className="sh-deal-text">
          <p className="sh-deal-title">{DEAL.title}</p>
          <p className="sh-deal-sub">{DEAL.text}</p>
        </div>
        <Link href={DEAL.href} className="sh-btn sh-btn--white">
          {DEAL.cta}
        </Link>
      </aside>
    </div>
  )
}

/** Yüzde işaretli etiket ve parıltı çizgileri (tasarımdaki ikon). */
function DealIcon() {
  return (
    <svg className="sh-deal-ico" viewBox="0 0 48 50" aria-hidden="true">
      <g fill="none" stroke="#7CF98D" strokeWidth="2.3" strokeLinecap="round">
        <path d="M13.6 1.2 14.6 3.9M6.4 4.9l2 2M2.7 12.1l2.6.8M43.6 36.4l2.6.7M40.3 42.1l2 2M34.5 45.4l.8 2.6" />
      </g>
      <path d="M4.7 26.4 24.5 6.6H40v15.2L20 41.7Z" fill="#50B1D4" stroke="#50B1D4" strokeWidth="6" strokeLinejoin="round" />
      <g fill="none" stroke="#183D85" strokeLinecap="round">
        <circle cx="34.2" cy="12.4" r="4.4" fill="#183D85" stroke="none" />
        <path d="M36.2 9.4c.6-2.8 2.2-4.2 4.4-4.8" strokeWidth="2.4" />
        <circle cx="19.9" cy="20.5" r="2.1" strokeWidth="1.6" />
        <circle cx="20.5" cy="31.8" r="2.1" strokeWidth="1.6" />
        <path d="M11.8 27.6 29.2 25.5" strokeWidth="1.7" />
      </g>
    </svg>
  )
}
