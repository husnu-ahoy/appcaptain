'use client'

import { useState } from 'react'

export type BoardCategory = { id: string; title: string; description: string }
export type BoardThread = {
  id: string
  categoryId: string
  categoryLabel: string
  title: string
  excerpt: string
  isPinned: boolean
  author: { name: string; location: string }
}

const initials = (name: string) =>
  name
    .replace(/\./g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toLocaleUpperCase('tr'))
    .join('')

/** Forum: solda konular (ince çizgili satırlar), sağda kategoriler (süzgeç). */
export default function ForumBoard({ categories, threads }: { categories: BoardCategory[]; threads: BoardThread[] }) {
  const [active, setActive] = useState<string | null>(null)
  const shown = active ? threads.filter(t => t.categoryId === active) : threads
  const activeTitle = categories.find(c => c.id === active)?.title

  return (
    <div className="sh-fm-board">
      <div className="sh-bl-bar sh-fm-bar">
        <h2 className="sh-bl-label" id="fm-list">
          {activeTitle ?? 'Tüm konular'}
        </h2>
      </div>
      {shown.length > 0 ? (
        <ul className="sh-bl-list sh-fm-list" aria-labelledby="fm-list">
          {shown.map(t => (
            <li key={t.id} className="sh-fm-row">
              <p className="sh-bl-meta sh-bl-meta--row">
                <span className="sh-bl-tag">{t.categoryLabel}</span>
                {t.isPinned && <span className="sh-bl-soon">Sabit</span>}
              </p>
              <h3 className="sh-fm-title">{t.title}</h3>
              <p className="sh-fm-excerpt">{t.excerpt}</p>
              <p className="sh-fm-by">
                <span className="sh-fm-initials" aria-hidden="true">
                  {initials(t.author.name)}
                </span>
                <b>{t.author.name}</b>
                <span>{t.author.location}</span>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="sh-fm-list sh-fm-empty">Bu kategoride henüz konu yok.</p>
      )}

      <nav className="sh-fm-side" aria-label="Kategoriler">
        <p className="sh-toc-title">Kategoriler</p>
        <ul className="sh-fm-cats">
          <li>
            <button type="button" aria-pressed={active === null} onClick={() => setActive(null)}>
              <b>Tüm konular</b>
            </button>
          </li>
          {categories.map(c => (
            <li key={c.id}>
              <button type="button" aria-pressed={active === c.id} onClick={() => setActive(active === c.id ? null : c.id)}>
                <b>{c.title}</b>
                <span>{c.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
