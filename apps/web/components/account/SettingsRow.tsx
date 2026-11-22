'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'

interface Props {
  id: string
  label: string
  value?: ReactNode
  /** Değerin altında soluk açıklama (düzenleme kapalıyken). */
  hint?: ReactNode
  /** "Düzenle", "Ekle", "Güncelle"… Yoksa satır yalnızca okunur. */
  action?: string
  /** Açık düzenleme satırının kimliği; bir satır açıkken diğerleri soluklaşır. */
  editing: string | null
  onEdit: (id: string | null) => void
  /** Düzenleme açıkken başlığın altındaki açıklama. */
  description?: ReactNode
  children?: ReactNode
}

/** Airbnb tarzı ayar satırı: başlık + değer + sağda "Düzenle"; tıklayınca form satırın içinde açılır. */
export default function SettingsRow({ id, label, value, hint, action, editing, onEdit, description, children }: Props) {
  const open = editing === id
  const dim = editing !== null && !open

  return (
    <div className={`sh-set-row${open ? ' is-open' : ''}${dim ? ' is-dim' : ''}`}>
      <div className="sh-set-row-top">
        <div className="sh-set-row-text">
          <h3>{label}</h3>
          {open ? (
            description && <p className="sh-set-row-desc">{description}</p>
          ) : (
            <>
              {value !== undefined && <div className="sh-set-row-value">{value}</div>}
              {hint && <p className="sh-set-row-hint">{hint}</p>}
            </>
          )}
        </div>
        {action && (
          <button
            type="button"
            className="sh-set-row-btn"
            onClick={() => onEdit(open ? null : id)}
            disabled={dim}
            aria-expanded={open}
            aria-controls={`set-${id}`}
          >
            {open ? 'Vazgeç' : action}
          </button>
        )}
      </div>
      {open && (
        <div className="sh-set-row-form" id={`set-${id}`}>
          {children}
        </div>
      )}
    </div>
  )
}

/** Soluk "Eklenmedi" değeri. */
export function Unset({ children = 'Eklenmedi' }: { children?: ReactNode }) {
  return <span className="sh-set-unset">{children}</span>
}

/** Kaydetme sonrası kısa onay ("Adın güncellendi"). */
export function useFlash() {
  const [text, setText] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const show = useCallback((message: string) => {
    window.clearTimeout(timer.current)
    setText(message)
    timer.current = window.setTimeout(() => setText(null), 3200)
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const node = (
    <p className={`sh-set-flash${text ? ' is-on' : ''}`} role="status" aria-live="polite">
      {text && (
        <>
          <Check size={16} strokeWidth={2.6} aria-hidden="true" />
          {text}
        </>
      )}
    </p>
  )
  return { show, node }
}
