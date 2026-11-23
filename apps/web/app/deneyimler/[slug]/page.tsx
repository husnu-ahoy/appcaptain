import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ExperienceDetail from '@/components/experience/ExperienceDetail'
import { fetchExperience, fetchExperiences } from '@/lib/api'
import { SAMPLE_EXPERIENCES, sampleExperienceById } from '@/lib/content/sampleExperiences'
import { cardFromDetail, cardFromListItem, categoryLabel, durationLabel, normalizeExperience } from '@/lib/experienceFormat'

// Dynamic rendering — experiences come from the live API, not a static list.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

/** Örnek deneyimler koddan, diğerleri herkese açık API'den (yalnızca yayındakiler). */
async function load(slug: string) {
  const sample = sampleExperienceById(slug)
  if (sample) return { exp: sample, sample: true }
  const dto = await fetchExperience(slug)
  return dto ? { exp: normalizeExperience(dto), sample: false } : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await load(slug)
  if (!data) return { title: 'Deneyim bulunamadı — Ahoy' }
  const { exp, sample } = data
  return {
    title: `${exp.title} — Ahoy`,
    description: exp.shortDescription || `${categoryLabel(exp.category) ?? 'Deneyim'} · ${durationLabel(exp.durationMinutes)}`,
    ...(sample ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function ExperiencePage({ params }: Props) {
  const { slug } = await params
  const [data, list] = await Promise.all([load(slug), fetchExperiences({ limit: 24 })])
  if (!data) notFound()
  // Aynı kategorideki (ana ya da ikincil) deneyimler önce gelir.
  const own = new Set([data.exp.category, ...data.exp.secondaryCategories].filter(Boolean))
  const overlap = (c: ReturnType<typeof cardFromListItem>) => (c.categories.some(x => own.has(x)) ? 1 : 0)
  // Yayında deneyim yokken benzerler de örnek deneyimlerden gelir.
  const pool = list.items.length > 0 ? list.items.map(cardFromListItem) : SAMPLE_EXPERIENCES.map(cardFromDetail)
  const similar = pool.filter(e => e.id !== data.exp.id).sort((a, b) => overlap(b) - overlap(a))
  return <ExperienceDetail exp={data.exp} sample={data.sample} similar={similar} />
}
