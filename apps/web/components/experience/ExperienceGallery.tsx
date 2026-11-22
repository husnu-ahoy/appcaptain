'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react'

interface Photo {
  url: string
  alt: string
}

/** Izgara yerleşimi: kapak her zaman ortadaki büyük karede (m), diğerleri yanlarda. */
const AREAS: Record<number, string[]> = { 1: ['m'], 2: ['m', 'b'], 3: ['m', 'b', 'c'], 4: ['m', 'a', 'b', 'c'] }

/**
 * Deneyim galerisi (GetYourGuide düzeni): solda dar dikey kare, ortada büyük kapak,
 * sağda üst üste iki kare; "Tümünü görüntüle" tam ekran galeriyi açar.
 * Mobilde kaydırmalı tek sıra.
 */
export default function ExperienceGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null)
  const [slide, setSlide] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const count = photos.length

  const go = useCallback((d: number) => setOpen(i => (i === null ? i : (i + d + count) % count)), [count])

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, go])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onScroll = () => setSlide(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  if (count === 0) return <div className="sh-xpg sh-xpg--empty">Bu deneyim için henüz fotoğraf eklenmemiş.</div>

  const shown = photos.slice(0, 4)
  const areas = AREAS[shown.length]!

  return (
    <>
      <div className={`sh-xpg sh-xpg--n${shown.length}`}>
        {shown.map((p, i) => (
          <button
            key={p.url + i}
            type="button"
            className={`sh-xpg-cell sh-xpg-cell--${areas[i]}`}
            onClick={() => setOpen(i)}
            aria-label={`Fotoğrafı büyüt (${i + 1} / ${count})`}
          >
            <Image
              src={p.url}
              alt={p.alt || title}
              fill
              priority={i === 0}
              sizes={areas[i] === 'm' ? '(max-width: 1280px) 50vw, 600px' : '(max-width: 1280px) 25vw, 300px'}
            />
          </button>
        ))}
        {count > 1 && (
          <button type="button" className="sh-xpg-all" onClick={() => setOpen(0)}>
            <Images size={17} strokeWidth={1.9} aria-hidden="true" /> Tümünü görüntüle
          </button>
        )}
      </div>

      {/* mobil: kaydırmalı */}
      <div className="sh-xpg-m">
        <div className="sh-xpg-m-track" ref={trackRef}>
          {photos.map((p, i) => (
            <button key={p.url + i} type="button" className="sh-xpg-m-slide" onClick={() => setOpen(i)} aria-label={`Fotoğrafı büyüt (${i + 1} / ${count})`}>
              <Image src={p.url} alt={p.alt || title} fill priority={i === 0} sizes="100vw" />
            </button>
          ))}
        </div>
        {count > 1 && (
          <span className="sh-xpg-m-count" aria-hidden="true">
            {slide + 1} / {count}
          </span>
        )}
      </div>

      {open !== null && (
        <div className="sh-lightbox" role="dialog" aria-modal="true" aria-label="Fotoğraf galerisi" onClick={() => setOpen(null)}>
          <button type="button" className="sh-lb-close" onClick={() => setOpen(null)} aria-label="Kapat">
            <X size={22} />
          </button>
          <span className="sh-lb-count">
            {open + 1} / {count}
          </span>
          <div className="sh-lb-stage" onClick={e => e.stopPropagation()}>
            <Image src={photos[open]!.url} alt={photos[open]!.alt || title} fill sizes="100vw" style={{ objectFit: 'contain' }} />
          </div>
          {count > 1 && (
            <>
              <button
                type="button"
                className="sh-lb-nav sh-lb-prev"
                onClick={e => {
                  e.stopPropagation()
                  go(-1)
                }}
                aria-label="Önceki fotoğraf"
              >
                <ChevronLeft size={26} />
              </button>
              <button
                type="button"
                className="sh-lb-nav sh-lb-next"
                onClick={e => {
                  e.stopPropagation()
                  go(1)
                }}
                aria-label="Sonraki fotoğraf"
              >
                <ChevronRight size={26} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
