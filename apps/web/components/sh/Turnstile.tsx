'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Cloudflare Turnstile: sunucuya giden formlarda "gerçek kişi misin" kontrolü.
 *
 * Widget tek başına hiçbir şeyi korumaz; verdiği tek kullanımlık anahtarı (token)
 * sunucu Cloudflare'e doğrulatır:
 *  - rezervasyon talebi ve kaptana ilk mesaj → apps/api (src/lib/turnstile.ts)
 *  - giriş, kayıt ve şifre sıfırlama → Supabase Auth (Bot and Abuse Protection)
 *
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY boşsa hiçbir şey çizilmez, formlar eskisi gibi çalışır.
 */

const SITE_KEY = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '').trim()
export const turnstileEnabled = SITE_KEY !== ''

/**
 * Widget'ın "action" değeri. API, anahtarın hangi form için alındığını kontrol eder
 * (booking, captain_message); Supabase'e giden "auth" için bu kontrolü Supabase yapmaz.
 */
export type TurnstileAction = 'booking' | 'captain_message' | 'auth'

// Cloudflare: api.js her zaman bu adresten yüklenmeli; kopyalamak ya da önbelleğe almak
// sonraki güncellemelerde widget'ı bozar.
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

interface RenderOptions {
  sitekey: string
  action: string
  theme: 'light'
  language: string
  size: 'flexible' | 'compact'
  'response-field': boolean
  callback: (token: string) => void
  'expired-callback': () => void
  'timeout-callback': () => void
  'error-callback': () => void
}

interface TurnstileApi {
  render(container: HTMLElement, options: RenderOptions): string | undefined
  remove(widgetId: string): void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let loading: Promise<TurnstileApi> | null = null

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile missing')))
    script.onerror = () => {
      script.remove()
      reject(new Error('turnstile blocked'))
    }
    document.head.appendChild(script)
  }).catch((err: unknown) => {
    loading = null // bir sonraki açılışta yeniden dene
    throw err
  })
  return loading
}

function TurnstileWidget({
  action,
  onToken,
  onBroken,
  nudge,
}: {
  action: TurnstileAction
  onToken: (token: string | null) => void
  /** Widget çalışamıyor: betik engellendi ya da Cloudflare hata verdi. */
  onBroken: () => void
  nudge: boolean
}) {
  const box = useRef<HTMLDivElement>(null)
  const report = useRef(onToken)
  const broken = useRef(onBroken)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    report.current = onToken
    broken.current = onBroken
  })

  useEffect(() => {
    let widgetId: string | undefined
    let cancelled = false
    loadTurnstile()
      .then(turnstile => {
        const el = box.current
        if (cancelled || !el) return
        widgetId = turnstile.render(el, {
          sitekey: SITE_KEY,
          action,
          theme: 'light',
          language: 'tr',
          // flexible: kapsayıcı kadar geniş ama en az 300px; daha dar ekranlarda compact (150×140)
          size: el.clientWidth >= 300 ? 'flexible' : 'compact',
          'response-field': false, // anahtarı formdan değil, doğrudan istekte gönderiyoruz
          callback: token => report.current(token),
          'expired-callback': () => report.current(null),
          'timeout-callback': () => report.current(null),
          // Widget kendi hata durumunu gösterir ve kendiliğinden yeniden dener.
          'error-callback': () => {
            report.current(null)
            broken.current()
          },
        })
      })
      .catch(() => {
        if (cancelled) return
        setFailed(true)
        broken.current()
      })
    return () => {
      cancelled = true
      if (widgetId !== undefined) window.turnstile?.remove(widgetId)
      report.current(null)
    }
  }, [action])

  return (
    <div className="sh-turnstile">
      <div ref={box} className="sh-turnstile-box" hidden={failed} />
      {failed ? (
        <p className="sh-turnstile-note" role="alert">
          Güvenlik doğrulaması yüklenemedi. Bağlantını kontrol edip sayfayı yenile; reklam engelleyici kullanıyorsan bu site için kapat.
        </p>
      ) : (
        nudge && (
          <p className="sh-turnstile-note" role="alert">
            Göndermek için önce güvenlik doğrulamasını tamamla.
          </p>
        )
      )}
    </div>
  )
}

/**
 * Bir formun Turnstile durumu.
 *  - `widget`: formda gösterilecek öğe (anahtar ayarlı değilse null)
 *  - `check()`: göndermeden önce çağır; doğrulama sürüyorsa false döner ve uyarı gösterir
 *  - `token`: isteğe eklenecek anahtar
 *  - `reset()`: her gönderim denemesinden sonra çağır; anahtar tek kullanımlıktır ve
 *    sunucu isteği reddetse bile harcanmış olabilir
 *
 * Widget hiç çalışamıyorsa (engellendi, alan adı Cloudflare'de tanımlı değil…) form
 * kilitlenmez: istek anahtarsız gider, kararı sunucu verir. Koruma sunucudadır; botlar
 * bu kodu zaten çalıştırmaz.
 */
export function useTurnstile(action: TurnstileAction) {
  const [token, setToken] = useState<string | null>(null)
  const [broken, setBroken] = useState(false)
  const [round, setRound] = useState(0)
  const [nudge, setNudge] = useState(false)

  const onToken = useCallback((next: string | null) => {
    setToken(next)
    if (next) setBroken(false)
  }, [])
  const onBroken = useCallback(() => setBroken(true), [])

  const check = useCallback(() => {
    if (!turnstileEnabled || token || broken) return true
    setNudge(true)
    return false
  }, [token, broken])

  const reset = useCallback(() => {
    setToken(null)
    setBroken(false)
    setNudge(false)
    setRound(r => r + 1)
  }, [])

  const widget = turnstileEnabled ? (
    <TurnstileWidget
      key={`${action}:${round}`}
      action={action}
      onToken={onToken}
      onBroken={onBroken}
      nudge={nudge && !token && !broken}
    />
  ) : null

  return { token, check, reset, widget }
}
