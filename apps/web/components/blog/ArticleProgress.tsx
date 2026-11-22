'use client'

import { useEffect, useState } from 'react'

/** Okuma ilerlemesi: sayfanın en üstünde ince lacivert çizgi. */
export default function ArticleProgress() {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const total = el.scrollHeight - el.clientHeight
      setPct(total > 0 ? Math.min(100, (el.scrollTop / total) * 100) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="sh-ar-progress" aria-hidden="true">
      <span style={{ transform: `scaleX(${pct / 100})` }} />
    </div>
  )
}
