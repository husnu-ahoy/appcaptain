import type { Metadata } from 'next'
import ExperiencesClient from './ExperiencesClient'
import { fetchExperiences } from '@/lib/api'
import { SAMPLE_EXPERIENCE } from '@/lib/content/defaultExperience'
import { typeBySlug } from '@/lib/content/experienceTypes'
import { cardFromDetail, cardFromListItem } from '@/lib/experienceFormat'

// Data comes from the live API — don't try to prerender at build time.
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ tur?: string; q?: string; city?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const type = typeBySlug((await searchParams).tur)
  if (type) return { title: `${type.label} — Ahoy`, description: type.desc }
  return {
    title: 'Deneyimler — Ahoy',
    description: 'Türkiye kıyılarında günlük tekne turları, gün batımı, dalış, su sporları ve daha fazlası. Kaptanların düzenlediği deneyimleri keşfet.',
  }
}

export default async function DeneyimlerPage({ searchParams }: Props) {
  const { tur, q, city } = await searchParams
  const { items } = await fetchExperiences({ limit: 100 })
  // Yayında deneyim yokken örnek deneyim gösterilir (rezervasyona kapalı, "Örnek" etiketli).
  const experiences = items.length > 0 ? items.map(cardFromListItem) : [cardFromDetail(SAMPLE_EXPERIENCE)]
  return <ExperiencesClient experiences={experiences} initialType={typeBySlug(tur)?.slug ?? null} initialQuery={(q ?? city ?? '').trim()} />
}
