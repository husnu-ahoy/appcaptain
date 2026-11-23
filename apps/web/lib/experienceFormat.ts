import {
  CANCELLATION_POLICY_LABELS,
  EXPERIENCE_CATEGORY_LABELS,
  EXPERIENCE_DIFFICULTY_LEVEL_LABELS,
  EXPERIENCE_PRODUCT_TYPE_LABELS,
  type CancellationPolicyType,
  type ExperienceCategory,
  type ExperienceDTO,
  type ExperienceDifficultyLevel,
  type ExperiencePricingType,
  type ExperienceProductType,
  type PublicExperienceListItemDTO,
} from '@ahoy/shared'
import { dayOf } from '@/lib/bookingDisplay'
import { formatMoney } from '@/lib/boatFormat'
import { isSampleExperience } from '@/lib/content/sampleExperiences'

/* Deneyim sayfaları için biçim yardımcıları. Etiketler kaptan panelindeki sihirbazla aynıdır. */

export const categoryLabel = (c: ExperienceCategory | null | undefined) => (c ? EXPERIENCE_CATEGORY_LABELS[c] : null)
export const productTypeLabel = (p: ExperienceProductType | null | undefined) => (p ? EXPERIENCE_PRODUCT_TYPE_LABELS[p] : null)
export const difficultyLabel = (d: ExperienceDifficultyLevel | null | undefined) => (d ? EXPERIENCE_DIFFICULTY_LEVEL_LABELS[d] : null)

const TICKET_LABELS: Record<string, string> = { mobile: 'Mobil bilet', printed: 'Baskılı bilet', both: 'Mobil veya baskılı bilet' }
export const ticketLabel = (t: string | null | undefined) => (t ? TICKET_LABELS[t] ?? null : null)

/** 240 → "4 saat", 90 → "1 saat 30 dk", 2880 → "2 gün" */
export function durationLabel(minutes: number): string {
  if (!minutes || minutes <= 0) return 'Süre belirtilmedi'
  if (minutes >= 1440 && minutes % 1440 === 0) return `${minutes / 1440} gün`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} dk`
  return m ? `${h} saat ${m} dk` : `${h} saat`
}

export const priceUnitLabel = (t: ExperiencePricingType | null | undefined) => (t === 'PER_GROUP' ? 'grup başı' : 'kişi başı')

export const money = (amount: number, currency = 'TRY') => formatMoney(amount, currency)

/** "24 saat önce ücretsiz iptal" — özel politikada kaptanın metni kullanılır. */
export function cancellationTitle(policy: CancellationPolicyType, text?: string | null): string {
  if (policy === 'CUSTOM') return text?.trim() ? 'Kaptanın iptal politikası' : CANCELLATION_POLICY_LABELS.CUSTOM
  return CANCELLATION_POLICY_LABELS[policy]
}

export function cancellationText(policy: CancellationPolicyType, text?: string | null): string {
  switch (policy) {
    case 'FREE_24H':
      return 'Deneyimin başlamasından 24 saat öncesine kadar ücretsiz iptal edebilirsin.'
    case 'FREE_48H':
      return 'Deneyimin başlamasından 48 saat öncesine kadar ücretsiz iptal edebilirsin.'
    case 'NON_REFUNDABLE':
      return 'Bu deneyimde iptal hâlinde ücret iadesi yapılmaz.'
    default:
      return text?.trim() || 'İptal koşulları için kaptana sorabilirsin.'
  }
}

/** { daysBefore: 7, refundPercent: 100 } → "7 gün öncesine kadar" */
export function tierWhen(daysBefore: number): string {
  if (daysBefore <= 0) return 'Son 24 saat içinde'
  if (daysBefore === 1) return '1 gün (24 saat) öncesine kadar'
  return `${daysBefore} gün öncesine kadar`
}

export const isFreeCancellation = (p: CancellationPolicyType | null | undefined) => p === 'FREE_24H' || p === 'FREE_48H'

export function joinTr(list: string[]): string {
  if (list.length <= 1) return list.join('')
  return `${list.slice(0, -1).join(', ')} ve ${list[list.length - 1]}`
}

/** Buluşma noktasından kısa yer adı: "…, Bodrum" → "Bodrum" */
export function placeOf(meetingPoint: string | null | undefined): string | null {
  const parts = (meetingPoint ?? '').split(',').map(s => s.trim()).filter(Boolean)
  return parts.length ? parts[parts.length - 1]! : null
}

/**
 * Kaptanın yazdığı buluşma saati serbest metindir ("10:00", "10:00, 14:30").
 * Saatler ayrı ayrı döner; saat biçimi yoksa metnin kendisi tek seçenek olur.
 */
export function meetingTimes(meetingTime: string | null | undefined): string[] {
  const raw = (meetingTime ?? '').trim()
  if (!raw) return []
  const found = [...raw.matchAll(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/g)].map(m => `${m[1]!.padStart(2, '0')}:${m[2]}`)
  return found.length ? [...new Set(found)] : [raw]
}

const isClock = (t: string | null | undefined) => !!t && /^\d{2}:\d{2}$/.test(t)

/** Seçilen gün + saat → başlangıç anı (saat yoksa günün başı). */
export function startAt(date: Date, time: string | null | undefined): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (isClock(time)) {
    const [h, m] = time!.split(':').map(Number)
    d.setHours(h!, m!, 0, 0)
  }
  return d
}

/**
 * Ücretsiz iptalin son anı: 24/48 saatlik politikalarda başlangıçtan o kadar önce;
 * özel politikada %100 iadeli en erken kademe. İade yoksa null.
 */
export function freeCancelUntil(exp: Pick<ExperienceDTO, 'cancellationPolicy' | 'cancellationTiers'>, start: Date): Date | null {
  const hours =
    exp.cancellationPolicy === 'FREE_24H'
      ? 24
      : exp.cancellationPolicy === 'FREE_48H'
        ? 48
        : exp.cancellationPolicy === 'CUSTOM'
          ? (() => {
              const full = exp.cancellationTiers.filter(t => t.refundPercent >= 100 && t.daysBefore > 0)
              return full.length ? Math.min(...full.map(t => t.daysBefore)) * 24 : null
            })()
          : null
  if (hours == null) return null
  const until = new Date(start.getTime() - hours * 3600 * 1000)
  return until.getTime() > Date.now() ? until : null
}

/** "13 Aralık Cumartesi 16:30" (saat bilinmiyorsa yalnızca gün) */
export function formatDayTime(d: Date, withTime: boolean): string {
  const day = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })
  return withTime ? `${day} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : day
}

const toIso = (d: string | Date) => (typeof d === 'string' ? d : d.toISOString())

/** Seçilen güne göre fiyat: sezon kuralı varsa o, yoksa temel fiyat. */
export function priceOn(exp: Pick<ExperienceDTO, 'basePrice' | 'seasonalPricingRules'>, date: Date | null): { price: number; season: string | null } {
  if (date) {
    for (const r of exp.seasonalPricingRules) {
      if (date >= dayOf(toIso(r.startDate)) && date <= dayOf(toIso(r.endDate))) return { price: r.price, season: r.label }
    }
  }
  return { price: exp.basePrice, season: null }
}

/** Kartın "Başlangıç fiyatı": temel fiyat ve sezon fiyatlarının en düşüğü. */
export function fromPrice(exp: Pick<ExperienceDTO, 'basePrice' | 'seasonalPricingRules'>): number {
  const prices = [exp.basePrice, ...exp.seasonalPricingRules.map(r => r.price)].filter(p => p > 0)
  return prices.length ? Math.min(...prices) : exp.basePrice
}

export interface Party {
  adults: number
  children: number
}

export interface Estimate {
  price: number
  season: string | null
  total: number
  lines: { label: string; amount: number }[]
}

/** Tahmini tutar: kişi başı fiyatta çocuk indirimi uygulanır, grup fiyatı sabittir. */
export function estimate(exp: Pick<ExperienceDTO, 'basePrice' | 'seasonalPricingRules' | 'pricingType' | 'childDiscountPercent' | 'currency'>, party: Party, date: Date | null): Estimate {
  const { price, season } = priceOn(exp, date)
  if (exp.pricingType === 'PER_GROUP') return { price, season, total: price, lines: [{ label: 'Grup fiyatı', amount: price }] }
  const childPrice = exp.childDiscountPercent ? price * (1 - exp.childDiscountPercent / 100) : price
  const lines = [
    { label: `${party.adults} yetişkin × ${money(price, exp.currency)}`, amount: price * party.adults },
    ...(party.children > 0 ? [{ label: `${party.children} çocuk × ${money(childPrice, exp.currency)}`, amount: childPrice * party.children }] : []),
  ]
  return { price, season, total: lines.reduce((s, l) => s + l.amount, 0), lines }
}

/** Liste kartı ve filtreler için ortak model: tam deneyim (örnek) ya da liste öğesinden. */
export interface ExperienceCard {
  id: string
  title: string
  shortDescription: string
  category: ExperienceCategory | null
  /** Ana + ikincil kategoriler; tür çipleri bunlara göre süzer. */
  categories: ExperienceCategory[]
  /** Tur / aktivite…: ana kategorisi "Diğer" olan deneyimin ana başlığını belirler. */
  productType: ExperienceProductType | null
  photo: string | null
  durationMinutes: number
  maxParticipants: number
  basePrice: number
  currency: string
  pricingType: ExperiencePricingType | null
  place: string | null
  languages: string[]
  freeCancellation: boolean
  pickup: boolean
  minAge: number | null
  sample: boolean
}

const uniq = <T,>(list: (T | null | undefined)[]) => [...new Set(list.filter((v): v is T => v != null))]

export function cardFromDetail(e: ExperienceDTO): ExperienceCard {
  return {
    id: e.id,
    title: e.title,
    shortDescription: e.shortDescription,
    category: e.category,
    categories: uniq([e.category, ...e.secondaryCategories]),
    productType: e.productType ?? null,
    photo: e.coverPhotoUrl || e.photoUrls[0] || null,
    durationMinutes: e.durationMinutes,
    maxParticipants: e.maxParticipants,
    basePrice: fromPrice(e),
    currency: e.currency,
    pricingType: e.pricingType,
    place: placeOf(e.meetingPoint),
    languages: e.languages,
    freeCancellation: isFreeCancellation(e.cancellationPolicy),
    pickup: e.pickupOffered,
    minAge: e.minAge,
    sample: isSampleExperience(e.id),
  }
}

/** Herkese açık liste öğesi; API'nin eski sürümlerinde olmayan alanlar boş kalır. */
export function cardFromListItem(e: PublicExperienceListItemDTO): ExperienceCard {
  return {
    id: e.id,
    title: e.title,
    shortDescription: e.shortDescription,
    category: e.category,
    categories: uniq([e.category, ...(e.secondaryCategories ?? [])]),
    productType: e.productType ?? null,
    photo: e.coverPhotoUrl || null,
    durationMinutes: e.durationMinutes,
    maxParticipants: e.maxParticipants,
    basePrice: e.basePrice,
    currency: e.currency,
    pricingType: e.pricingType ?? null,
    place: placeOf(e.meetingPoint),
    languages: e.languages ?? [],
    freeCancellation: isFreeCancellation(e.cancellationPolicy),
    pickup: e.pickupOffered ?? false,
    minAge: e.minAge ?? null,
    sample: false,
  }
}

/** API'nin eski sürümleri bazı alanları döndürmeyebilir: listeler boş dizi, metinler boş olur. */
export function normalizeExperience(e: ExperienceDTO): ExperienceDTO {
  const list = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : [])
  return {
    ...e,
    secondaryCategories: list(e.secondaryCategories),
    highlights: list(e.highlights),
    keywords: list(e.keywords),
    included: list(e.included),
    notIncluded: list(e.notIncluded),
    notAllowed: list(e.notAllowed),
    toBring: list(e.toBring),
    knowBeforeYouGo: list(e.knowBeforeYouGo),
    languages: list(e.languages),
    requiredEquipment: list(e.requiredEquipment),
    accessibilityOptions: list(e.accessibilityOptions),
    cancellationTiers: list(e.cancellationTiers),
    photoUrls: list(e.photoUrls),
    customerInfoFields: list(e.customerInfoFields),
    seasonalPricingRules: list(e.seasonalPricingRules),
    meetingPoint: e.meetingPoint ?? '',
    meetingTime: e.meetingTime ?? '',
    endPoint: e.endPoint ?? '',
    shortDescription: e.shortDescription ?? '',
    fullDescription: e.fullDescription ?? '',
  }
}
