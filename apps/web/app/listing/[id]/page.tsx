import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ListingDetail from '@/components/listing/ListingDetail'
import { fetchBoat, fetchBoats } from '@/lib/api'

type Props = { params: Promise<{ id: string }>; searchParams?: Promise<{ start?: string; end?: string }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const boat = await fetchBoat(id)
  if (!boat) return { title: 'İlan bulunamadı — Ahoy' }
  const title = boat.title ? `${boat.title} — Ahoy` : 'Ahoy — Tekne kiralama'
  return {
    title,
    description: boat.description?.slice(0, 160) ?? `${boat.title ?? 'Tekne'} — Türkiye tekne kiralama`,
  }
}

export default async function ListingIdPage({ params, searchParams }: Props) {
  const { id } = await params
  const { start, end } = (await searchParams) ?? {}
  const [boat, list] = await Promise.all([fetchBoat(id), fetchBoats({ limit: 24 })])
  if (!boat) notFound()

  // Benzer tekneler: önce aynı şehir, sonra aynı tip, sonra diğerleri.
  const city = boat.features.find(f => f.key === 'city')?.value ?? null
  const score = (b: (typeof list.items)[number]) =>
    (city && b.city === city ? 2 : 0) + (b.boatType?.key === boat.boatType?.key ? 1 : 0)
  const similar = list.items
    .filter(b => b.id !== boat.id)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 6)

  return <ListingDetail boat={boat} similar={similar} initialStart={start} initialEnd={end} />
}
