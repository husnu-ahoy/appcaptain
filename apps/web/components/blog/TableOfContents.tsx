'use client'

import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  text: string
  num: number
}

/** İçindekiler: okunan bölüm vurgulanır; tıklayınca o başlığa kayar. */
export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const els = items.map(item => document.getElementById(item.id)).filter(Boolean) as HTMLElement[]
    const onScroll = () => {
      const y = window.scrollY + 140
      let current: string | null = null
      for (const el of els) if (el.getBoundingClientRect().top + window.scrollY <= y) current = el.id
      setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [items])

  return (
    <nav className="sh-toc" aria-label="İçindekiler">
      <p className="sh-toc-title">İçindekiler</p>
      <ol>
        {items.map(item => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={active === item.id ? 'is-active' : undefined}
              aria-current={active === item.id ? 'location' : undefined}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
