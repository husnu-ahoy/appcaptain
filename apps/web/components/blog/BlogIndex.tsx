'use client'

import { useMemo, useState } from 'react'
import type { BlogCategory, BlogPost } from '@/types/content'
import BlogRow from './BlogRow'

type Item = BlogPost & { published: boolean }

/** Kategoriye göre süzülen yazı listesi; sayılar listedeki yazılardan hesaplanır. */
export default function BlogIndex({ posts, categories }: { posts: Item[]; categories: BlogCategory[] }) {
  const [active, setActive] = useState('all')

  const tabs = useMemo(
    () =>
      categories
        .map(c => ({ ...c, count: c.id === 'all' ? posts.length : posts.filter(p => p.categoryId === c.id).length }))
        .filter(c => c.count > 0),
    [categories, posts],
  )
  const shown = active === 'all' ? posts : posts.filter(p => p.categoryId === active)

  return (
    <>
      <div className="sh-bl-bar">
        <h2 className="sh-bl-label" id="bl-list">
          Tüm yazılar
        </h2>
        <div className="sh-bl-tabs" role="group" aria-label="Kategoriye göre süz">
          {tabs.map(t => (
            <button key={t.id} type="button" className="sh-bl-tab" aria-pressed={active === t.id} onClick={() => setActive(t.id)}>
              {t.label}
              <span>{t.count}</span>
            </button>
          ))}
        </div>
      </div>
      <ul className="sh-bl-list" aria-labelledby="bl-list">
        {shown.map(p => (
          <BlogRow key={p.id} post={p} published={p.published} />
        ))}
      </ul>
    </>
  )
}
