import { NextResponse, type NextRequest } from 'next/server'

/**
 * Partner alt alan adı: partner.<alan-adı>/ → /partner (tekne sahipleri tanıtım sayfası).
 * Bu alan adında sitenin diğer sayfaları (ör. alt bilgideki bağlantılar) ana alan adına yönlendirilir.
 * Ana alan adında /partner doğrudan da açılır; diğer alan adlarında bu dosya hiçbir şey yapmaz.
 */
const PARTNER_PREFIX = 'partner.'

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').toLowerCase()
  if (!host.startsWith(PARTNER_PREFIX)) return NextResponse.next()

  const { pathname, search } = req.nextUrl
  if (pathname === '/') return NextResponse.rewrite(new URL(`/partner${search}`, req.url))
  // partner.<alan-adı>/partner → kök adres (tek, temiz adres)
  if (pathname === '/partner') return NextResponse.redirect(new URL(`/${search}`, req.url))

  // Geliştirmede istek adresi her zaman localhost:3000 kurulduğu için ana alan adına yönlendirme
  // göreli adrese dönüşüp döngüye girer; yerelde diğer sayfalar partner alan adında doğrudan açılır.
  if (process.env.NODE_ENV !== 'production') return NextResponse.next()

  const main = new URL(`${pathname}${search}`, req.url)
  main.host = host.slice(PARTNER_PREFIX.length)
  return NextResponse.redirect(main)
}

export const config = {
  // Next iç yolları ve uzantılı statik dosyalar (görseller, ikonlar) hariç tüm sayfalar
  matcher: ['/((?!_next/|.*\\.[a-zA-Z0-9]+$).*)'],
}
