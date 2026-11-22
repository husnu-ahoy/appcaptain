import type { Firm } from './data'

/** Firma monogramı: logo dosyası olmayan firmalar için Ahoy paletinden bir ton ve serif harfler. */
export default function FirmMark({ firm, size = 'md' }: { firm: Pick<Firm, 'logoText' | 'logoTone'>; size?: 'md' | 'lg' }) {
  return (
    <span className={`sh-cf-mark sh-cf-mark--${firm.logoTone}${size === 'lg' ? ' sh-cf-mark--lg' : ''}`} aria-hidden="true">
      {firm.logoText}
    </span>
  )
}
