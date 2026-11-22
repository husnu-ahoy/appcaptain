import type { Metadata } from 'next'
import RentalClient from './RentalClient'
import { fetchBoats } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Tekne Kiralama — Ahoy',
  description: 'Türkiye\'nin en güzel koylarında yelkenli, motor yat, katamaran ve daha fazlasını kiralayın.',
}

// Data comes from the live API — don't try to prerender at build time.
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ city?: string; type?: string; model?: string; start?: string; end?: string; cabins?: string }>
}

export default async function TekneKiralamaPage({ searchParams }: Props) {
  const { city, type, model, start, end, cabins } = await searchParams
  // Tüm aktif ilanlar tek seferde çekilir; şehir/tip/kişi filtreleri tarayıcıda anında uygulanır.
  const { items } = await fetchBoats({ limit: 200 })
  const cabinCount = Number(cabins)
  return (
    <RentalClient
      boats={items}
      initialCity={city ?? ''}
      initialType={type ?? ''}
      initialModel={model ?? ''}
      initialStart={start ?? ''}
      initialEnd={end ?? ''}
      initialCabins={Number.isInteger(cabinCount) && cabinCount > 0 && cabinCount <= 20 ? cabinCount : 0}
    />
  )
}
