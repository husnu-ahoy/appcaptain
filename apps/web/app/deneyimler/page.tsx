import type { Metadata } from 'next'
import ExperiencesClient from './ExperiencesClient'
import { fetchExperiences } from '@/lib/api'
import { SAMPLE_EXPERIENCES } from '@/lib/content/sampleExperiences'
import { resolveTur } from '@/lib/content/experienceTypes'
import { cardFromDetail, cardFromListItem } from '@/lib/experienceFormat'

// Data comes from the live API — don't try to prerender at build time.
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ tur?: string; q?: string; city?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { group, type } = resolveTur((await searchParams).tur)
  if (type) return { title: `${type.label} — Ahoy`, description: type.desc }
  if (group) return { title: `${group.label} — Ahoy deneyimleri`, description: group.desc }
  return {
    title: 'Deneyimler — Ahoy',
    description: 'Türkiye kıyılarında özel tekne programları, günlük tekne turları, gün batımı, dalış ve su sporları. Kaptanların düzenlediği deneyimleri keşfet.',
  }
}

export default async function DeneyimlerPage({ searchParams }: Props) {
  const { tur, q, city } = await searchParams
  const { items } = await fetchExperiences({ limit: 100 })
  // Yayında deneyim yokken örnek deneyimler gösterilir (rezervasyona kapalı, "Örnek deneyim" etiketli).
  const experiences = items.length > 0 ? items.map(cardFromListItem) : SAMPLE_EXPERIENCES.map(cardFromDetail)
  const { group, type } = resolveTur(tur)
  return (
    <ExperiencesClient
      experiences={experiences}
      initialGroup={group?.slug ?? null}
      initialType={type?.slug ?? null}
      initialQuery={(q ?? city ?? '').trim()}
    />
  )
}
