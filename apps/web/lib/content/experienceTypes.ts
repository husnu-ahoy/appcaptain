import { ExperienceCategory } from '@ahoy/shared'

/**
 * /deneyimler sayfasındaki deneyim türü kartları (sekmeler). Her tür, kaptan
 * panelindeki deneyim sihirbazının bir kategorisine karşılık gelir; bir deneyim
 * ana kategorisinin yanı sıra seçtiği ikincil kategorilerin sekmelerinde de görünür.
 *
 * Görseller /public/deneyimler/turler altında:
 * - su-sporlari: Sam Badmaeva, balik-turlari: Ben Koorengevel (Unsplash Lisansı)
 * - tumu, gunluk-turlar, gun-batimi, ozel-deneyimler, diger: örnek deneyimin fotoğraflarından
 * - dalis-snorkel, dersler: sitenin kendi ana sayfa görsellerinden
 */
export interface ExperienceType {
  slug: string
  label: string
  desc: string
  image: string
  /** Manşette dönen kelime: "Denizde ___ seni bekliyor" (yalnızca deneyimi olan türler). */
  word?: string
  categories: ExperienceCategory[]
  /** Bu türde hiç deneyim yoksa kart gösterilmez. */
  hideWhenEmpty?: boolean
}

export const ALL_EXPERIENCES = {
  slug: 'tumu',
  label: 'Tüm deneyimler',
  desc: 'Kaptanların düzenlediği turlar, aktiviteler ve dersler bir arada.',
  image: '/deneyimler/turler/tumu.webp',
}

export const EXPERIENCE_TYPES: ExperienceType[] = [
  {
    slug: 'gunluk-turlar',
    label: 'Günlük tekne turları',
    desc: 'Koy koy gezip yüzme molası verdiğin günübirlik tekne turları.',
    image: '/deneyimler/turler/gunluk-turlar.webp',
    word: 'koy turu',
    categories: [ExperienceCategory.BOAT_TOUR],
  },
  {
    slug: 'gun-batimi',
    label: 'Gün batımı turları',
    desc: 'Güneşi açık denizde, teknenin güvertesinden uğurladığın akşam turları.',
    image: '/deneyimler/turler/gun-batimi.webp',
    word: 'gün batımı',
    categories: [ExperienceCategory.SUNSET_CRUISE],
  },
  {
    slug: 'dalis-snorkel',
    label: 'Dalış ve şnorkel',
    desc: 'Berrak koylarda şnorkel turları ve rehber eşliğinde dalışlar.',
    image: '/deneyimler/turler/dalis-snorkel.webp',
    word: 'şnorkel',
    categories: [ExperienceCategory.DIVING_SNORKELING],
  },
  {
    slug: 'su-sporlari',
    label: 'Su sporları',
    desc: 'Jet ski, SUP, kano gibi denizde hareketli aktiviteler.',
    image: '/deneyimler/turler/su-sporlari.webp',
    word: 'jet ski',
    categories: [ExperienceCategory.WATER_SPORTS],
  },
  {
    slug: 'balik-turlari',
    label: 'Balık turları',
    desc: 'Kaptanla açık denizde olta ve balıkçılık deneyimleri.',
    image: '/deneyimler/turler/balik-turlari.webp',
    word: 'balık turu',
    categories: [ExperienceCategory.FISHING],
  },
  {
    slug: 'ozel-deneyimler',
    label: 'Özel tekne deneyimleri',
    desc: 'Tekneyi yalnızca sana ve grubuna ayıran özel programlar.',
    image: '/deneyimler/turler/ozel-deneyimler.webp',
    word: 'özel bir tekne',
    categories: [ExperienceCategory.PRIVATE_CHARTER_EXPERIENCE],
  },
  {
    slug: 'dersler',
    label: 'Dersler ve atölyeler',
    desc: 'Yelken, dalış ya da balıkçılık öğrenebileceğin eğitimler.',
    image: '/deneyimler/turler/dersler.webp',
    word: 'yelken dersi',
    categories: [ExperienceCategory.WORKSHOP_CLASS],
  },
  {
    slug: 'diger',
    label: 'Diğer deneyimler',
    desc: 'Bu türlerin dışında kalan deniz deneyimleri.',
    image: '/deneyimler/turler/diger.webp',
    categories: [ExperienceCategory.OTHER],
    hideWhenEmpty: true,
  },
]

export const typeBySlug = (slug: string | null | undefined): ExperienceType | null =>
  (slug && EXPERIENCE_TYPES.find(t => t.slug === slug)) || null

/** Ana kategorinin türü — sayfa yolu (breadcrumb) ve "benzer deneyimler" için. */
export const typeOfCategory = (category: ExperienceCategory | null | undefined): ExperienceType | null =>
  (category && EXPERIENCE_TYPES.find(t => t.categories.includes(category))) || null

export const typeHref = (t: { slug: string } | null) => (t && t.slug !== ALL_EXPERIENCES.slug ? `/deneyimler?tur=${t.slug}` : '/deneyimler')
