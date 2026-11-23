import { ExperienceCategory, ExperienceProductType } from '@ahoy/shared'

/**
 * Deneyim türleri: her tür, kaptan panelindeki deneyim sihirbazının bir
 * kategorisine karşılık gelir. /deneyimler sayfasında ana başlıkların
 * (EXPERIENCE_GROUPS) altında çip olarak çıkar; bir deneyim ana kategorisinin
 * yanı sıra seçtiği ikincil kategorilerin çiplerinde de görünür.
 */
export interface ExperienceType {
  slug: string
  label: string
  desc: string
  categories: ExperienceCategory[]
  /** Site haritasında listelenmez (yalnızca deneyimi olduğunda çip olarak çıkar). */
  hideWhenEmpty?: boolean
}

/**
 * Ana başlık kartlarının fotoğrafları /public/deneyimler/basliklar altında:
 * tumu, ozel-tekne ve geziler örnek deneyimin fotoğraflarından (tumu, tekne
 * yazının altında kalmasın diye yatay aynalı), aktiviteler sitenin kendi ana
 * sayfa görsellerinden.
 */
export const ALL_EXPERIENCES = {
  slug: 'tumu',
  label: 'Tüm deneyimler',
  desc: 'Kaptanların düzenlediği turlar, aktiviteler ve dersler bir arada.',
  image: '/deneyimler/basliklar/tumu.webp',
}

export const EXPERIENCE_TYPES: ExperienceType[] = [
  {
    slug: 'gunluk-turlar',
    label: 'Günlük tekne turları',
    desc: 'Koy koy gezip yüzme molası verdiğin günübirlik tekne turları.',
    categories: [ExperienceCategory.BOAT_TOUR],
  },
  {
    slug: 'gun-batimi',
    label: 'Gün batımı turları',
    desc: 'Güneşi açık denizde, teknenin güvertesinden uğurladığın akşam turları.',
    categories: [ExperienceCategory.SUNSET_CRUISE],
  },
  {
    slug: 'dalis-snorkel',
    label: 'Dalış ve şnorkel',
    desc: 'Berrak koylarda şnorkel turları ve rehber eşliğinde dalışlar.',
    categories: [ExperienceCategory.DIVING_SNORKELING],
  },
  {
    slug: 'su-sporlari',
    label: 'Su sporları',
    desc: 'Jet ski, SUP, kano gibi denizde hareketli aktiviteler.',
    categories: [ExperienceCategory.WATER_SPORTS],
  },
  {
    slug: 'balik-turlari',
    label: 'Balık turları',
    desc: 'Kaptanla açık denizde olta ve balıkçılık deneyimleri.',
    categories: [ExperienceCategory.FISHING],
  },
  {
    slug: 'ozel-deneyimler',
    label: 'Özel tekne deneyimleri',
    desc: 'Tekneyi yalnızca sana ve grubuna ayıran özel programlar.',
    categories: [ExperienceCategory.PRIVATE_CHARTER_EXPERIENCE],
  },
  {
    slug: 'dersler',
    label: 'Dersler ve atölyeler',
    desc: 'Yelken, dalış ya da balıkçılık öğrenebileceğin eğitimler.',
    categories: [ExperienceCategory.WORKSHOP_CLASS],
  },
  {
    slug: 'diger',
    label: 'Diğer deneyimler',
    desc: 'Bu türlerin dışında kalan deniz deneyimleri.',
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

/**
 * /deneyimler sayfasının ana başlıkları: "Tüm deneyimler" ve aşağıdaki üç grup.
 * Deneyim, ana kategorisinin grubunda listelenir; ikincil kategoriler grubu
 * değiştirmez, yalnızca grup içindeki tür çiplerinde sayılır. Ana kategorisi
 * "Diğer" olan deneyim, kaptanın seçtiği ürün türüne (tur / aktivite) göre yerleşir.
 */
export interface ExperienceGroup {
  slug: string
  label: string
  desc: string
  /** Başlık kartının fotoğrafı */
  image: string
  /** Grubun alt türleri (EXPERIENCE_TYPES slug'ları); sayfada çip olarak çıkar. */
  types: string[]
  /** Ana kategorisi "Diğer" olan deneyimler bu ürün türlerinde bu gruba girer. */
  productTypes?: ExperienceProductType[]
}

export const EXPERIENCE_GROUPS: ExperienceGroup[] = [
  {
    slug: 'ozel-tekne',
    label: 'Özel tekne',
    desc: 'Tekneyi yalnızca sana ve grubuna ayıran, kaptanlı özel programlar.',
    image: '/deneyimler/basliklar/ozel-tekne.webp',
    types: ['ozel-deneyimler'],
  },
  {
    slug: 'geziler',
    label: 'Geziler',
    desc: 'Günübirlik tekne turları, gün batımı ve balık turları.',
    image: '/deneyimler/basliklar/geziler.webp',
    types: ['gunluk-turlar', 'gun-batimi', 'balik-turlari'],
    productTypes: [ExperienceProductType.TOUR],
  },
  {
    slug: 'aktiviteler',
    label: 'Aktiviteler',
    desc: 'Dalış, şnorkel, su sporları, dersler ve atölyeler.',
    image: '/deneyimler/basliklar/aktiviteler.webp',
    types: ['dalis-snorkel', 'su-sporlari', 'dersler'],
    productTypes: [ExperienceProductType.ACTIVITY],
  },
]

export const groupBySlug = (slug: string | null | undefined): ExperienceGroup | null =>
  (slug && EXPERIENCE_GROUPS.find(g => g.slug === slug)) || null

export const groupOfType = (typeSlug: string | null | undefined): ExperienceGroup | null =>
  (typeSlug && EXPERIENCE_GROUPS.find(g => g.types.includes(typeSlug))) || null

/** Deneyimin ana başlığı: ana kategorisinin grubu; kategori "Diğer" ise ürün türüne göre. */
export function groupOf(e: { category: ExperienceCategory | null; productType?: ExperienceProductType | null }): ExperienceGroup | null {
  const byCategory = groupOfType(typeOfCategory(e.category)?.slug)
  if (byCategory) return byCategory
  const product = e.productType
  return (product && EXPERIENCE_GROUPS.find(g => g.productTypes?.includes(product))) || null
}

/**
 * ?tur= değeri bir ana başlık (geziler) ya da eski bağlantılardaki bir tür
 * (gun-batimi) olabilir. Tür, kendi grubunun altında seçili çip olarak açılır;
 * tek türlü grupta (Özel tekne) çip gösterilmez.
 */
export function resolveTur(tur: string | null | undefined): { group: ExperienceGroup | null; type: ExperienceType | null } {
  const group = groupBySlug(tur)
  if (group) return { group, type: null }
  const type = typeBySlug(tur)
  if (!type) return { group: null, type: null }
  const owner = groupOfType(type.slug)
  if (!owner) return { group: null, type }
  return { group: owner, type: owner.types.length > 1 ? type : null }
}
