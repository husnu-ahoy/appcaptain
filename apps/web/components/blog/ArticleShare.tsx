'use client'

import { useState } from 'react'
import { Check, Link2 } from 'lucide-react'

/** Yazının sonunda sade paylaşım satırı. */
export default function ArticleShare({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* pano izni yoksa sessizce geç */
    }
  }
  const open = (url: string) => window.open(url, '_blank', 'noopener,noreferrer')
  const here = () => encodeURIComponent(window.location.href)

  return (
    <div className="sh-ar-share">
      <span className="sh-ar-share-label">Paylaş</span>
      <button type="button" onClick={copy}>
        {copied ? <Check size={16} strokeWidth={2.2} aria-hidden="true" /> : <Link2 size={16} strokeWidth={2} aria-hidden="true" />}
        {copied ? 'Kopyalandı' : 'Bağlantıyı kopyala'}
      </button>
      <button type="button" onClick={() => open(`https://wa.me/?text=${encodeURIComponent(title)}%20${here()}`)}>
        WhatsApp
      </button>
      <button type="button" onClick={() => open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${here()}`)}>
        X
      </button>
      <button type="button" onClick={() => open(`https://facebook.com/sharer/sharer.php?u=${here()}`)}>
        Facebook
      </button>
    </div>
  )
}
