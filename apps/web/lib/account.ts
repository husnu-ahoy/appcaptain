import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/*
 * Müşteri hesabı yardımcıları. Profil bilgileri ayrı bir tabloda değil, Supabase
 * hesabının user_metadata alanında tutulur (favoriler gibi):
 *   first_name, last_name, full_name → API ve rezervasyon formu full_name'i okur
 *   phone                            → rezervasyon formunu doldurur
 *   marketing                        → kampanya izinleri { email, sms, updatedAt }
 * Bu alan oturum anahtarına da girer; kimlik numarası gibi hassas veriler buraya yazılmaz.
 */

/** Destek kanalları: sitenin alt bilgisi ve Hakkımızda sayfasıyla aynı. */
export const SUPPORT = {
  phone: { label: '0850 433 9070', href: 'tel:08504339070' },
  whatsapp: { label: '0850 433 9071', href: 'https://wa.me/908504339071' },
}

const text = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '')

export interface Profile {
  firstName: string
  lastName: string
  phone: string
}

export function readProfile(user: User | null): Profile {
  const m = user?.user_metadata ?? {}
  let firstName = text(m.first_name)
  let lastName = text(m.last_name)
  if (!firstName && !lastName) {
    // Yalnızca tam ad varsa (eski kayıtlar, sosyal giriş): son kelime soyad sayılır.
    const parts = (text(m.full_name) || text(m.name)).split(' ').filter(Boolean)
    lastName = parts.length > 1 ? parts.pop()! : ''
    firstName = parts.join(' ')
  }
  return { firstName, lastName, phone: text(m.phone) }
}

export function fullName(user: User | null): string {
  const { firstName, lastName } = readProfile(user)
  return `${firstName} ${lastName}`.trim()
}

const emailName = (user: User | null) => user?.email?.split('@')[0] ?? ''

/** Ad soyad; yoksa e-postanın @ öncesi. */
export function displayName(user: User | null): string {
  return fullName(user) || emailName(user) || 'Misafir'
}

/** Selamlama için ilk ad. */
export function greetingName(user: User | null): string {
  return readProfile(user).firstName.split(' ')[0] || emailName(user)
}

export function initials(user: User | null): string {
  const { firstName, lastName } = readProfile(user)
  const letters = (firstName.charAt(0) + lastName.charAt(0)).trim() || emailName(user).charAt(0) || '?'
  return letters.toLocaleUpperCase('tr')
}

/** Yıl sonrasındaki "-den/-dan/-ten/-tan" eki: son okunan kelimeye göre. */
function ablative(n: number): string {
  const ones = ['', 'den', 'den', 'ten', 'ten', 'ten', 'dan', 'den', 'den', 'dan']
  const tens = ['', 'dan', 'den', 'dan', 'tan', 'den', 'tan', 'ten', 'den', 'dan']
  if (n % 10) return ones[n % 10] ?? 'den'
  if (Math.floor(n / 10) % 10) return tens[Math.floor(n / 10) % 10] ?? 'den'
  return 'den' // yüz, bin
}

/** "Kasım 2026’dan beri üye" */
export function memberSince(user: User | null): string | null {
  if (!user?.created_at) return null
  const d = new Date(user.created_at)
  if (Number.isNaN(d.getTime())) return null
  const month = d.toLocaleDateString('tr-TR', { month: 'long' })
  const year = d.getFullYear()
  return `${month.charAt(0).toLocaleUpperCase('tr')}${month.slice(1)} ${year}’${ablative(year)} beri üye`
}

/** Hesabın giriş yöntemleri: "email", "google"… */
export function loginProviders(user: User | null): string[] {
  const list = user?.app_metadata?.providers
  if (Array.isArray(list)) return list.filter((p): p is string => typeof p === 'string')
  const one = user?.app_metadata?.provider
  return typeof one === 'string' ? [one] : []
}

export interface MarketingPrefs {
  email: boolean
  sms: boolean
  updatedAt: string | null
}

export function readMarketing(user: User | null): MarketingPrefs {
  const raw = user?.user_metadata?.marketing as Record<string, unknown> | undefined
  return {
    email: raw?.email === true,
    sms: raw?.sms === true,
    updatedAt: typeof raw?.updatedAt === 'string' ? raw.updatedAt : null,
  }
}

/** user_metadata'ya yazar (anahtar bazında birleşir; null anahtarı siler). */
export async function saveMetadata(data: Record<string, unknown>): Promise<User> {
  const { data: res, error } = await supabase.auth.updateUser({ data })
  if (error) throw new Error(authErrorText(error.message))
  return res.user
}

/**
 * Ad değişince API'nin göreceği oturum anahtarını da yeniler: API müşterinin adını
 * anahtarın içinden okur, yenilenmezse eski ad bir saate kadar görünmeye devam eder.
 */
export async function refreshSessionQuietly(): Promise<void> {
  try {
    await supabase.auth.refreshSession()
  } catch {
    /* bir sonraki otomatik yenilemede güncellenir */
  }
}

export function authErrorText(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('should be different')) return 'Yeni şifren eskisinden farklı olmalı.'
  if (m.includes('at least')) return 'Şifre çok kısa. Daha uzun bir şifre seç.'
  if (m.includes('weak') || m.includes('easy to guess') || m.includes('pwned')) return 'Bu şifre kolay tahmin edilebilir. Daha güçlü bir şifre seç.'
  if (m.includes('reauthentication') || m.includes('nonce')) return 'REAUTH'
  if (m.includes('rate limit') || m.includes('too many')) return 'Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar dene.'
  if (m.includes('captcha')) return 'Güvenlik doğrulaması geçmedi. Doğrulamayı tamamlayıp tekrar dene.'
  if (m.includes('session') && (m.includes('missing') || m.includes('expired'))) return 'Oturumunun süresi dolmuş. Lütfen yeniden giriş yap.'
  if (m.includes('fetch') || m.includes('network')) return 'Bağlantı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.'
  return 'Değişiklik kaydedilemedi. Lütfen tekrar dene.'
}

/* ---------- telefon ---------- */

export const DIAL_CODES: { code: string; country: string }[] = [
  { code: '+90', country: 'Türkiye' },
  { code: '+49', country: 'Almanya' },
  { code: '+44', country: 'Birleşik Krallık' },
  { code: '+31', country: 'Hollanda' },
  { code: '+33', country: 'Fransa' },
  { code: '+39', country: 'İtalya' },
  { code: '+41', country: 'İsviçre' },
  { code: '+43', country: 'Avusturya' },
  { code: '+32', country: 'Belçika' },
  { code: '+46', country: 'İsveç' },
  { code: '+30', country: 'Yunanistan' },
  { code: '+7', country: 'Rusya' },
  { code: '+380', country: 'Ukrayna' },
  { code: '+971', country: 'Birleşik Arap Emirlikleri' },
  { code: '+1', country: 'ABD / Kanada' },
]

/** "+90 532 123 45 67" → { dial: "+90", number: "532 123 45 67" } */
export function splitPhone(phone: string): { dial: string; number: string } {
  const value = phone.trim()
  if (!value.startsWith('+')) return { dial: '+90', number: value.replace(/^0+/, '') }
  // Kod boşlukla ayrılmışsa ("+90 532 …") yerel kısmın yazılışı korunur.
  const spaced = value.match(/^(\+\d{1,4})\s+(.+)$/)
  if (spaced && DIAL_CODES.some(d => d.code === spaced[1])) return { dial: spaced[1]!, number: spaced[2]! }
  const compact = value.replace(/\s+/g, '')
  const match = [...DIAL_CODES].sort((a, b) => b.code.length - a.code.length).find(d => compact.startsWith(d.code))
  if (!match) return { dial: '+90', number: value.slice(1) }
  return { dial: match.code, number: compact.slice(match.code.length) }
}

export const phoneDigits = (number: string) => number.replace(/\D/g, '')

export function isValidPhone(number: string): boolean {
  const digits = phoneDigits(number)
  return digits.length >= 6 && digits.length <= 14
}

/** Türkiye cep numaralarını "532 123 45 67" biçiminde, diğerlerini rakam olarak yazar. */
export function formatPhone(dial: string, number: string): string {
  const d = phoneDigits(number).replace(/^0+/, '')
  const local = dial === '+90' && d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}` : d
  return `${dial} ${local}`
}
