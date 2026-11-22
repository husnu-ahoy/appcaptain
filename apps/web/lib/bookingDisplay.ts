/*
 * Rezervasyon durumları ve tarih biçimleri: Mesajlar ve Rezervasyonlarım ortak kullanır.
 * Metinler rezervasyon formundaki akışla aynı: ödeme onaydan sonra, ekip iletişime geçerek alınır.
 */

export type StatusTone = 'pending' | 'ok' | 'bad' | 'muted' | 'done'

interface StatusCopy {
  label: string
  tone: StatusTone
  title: string
  text: string
}

export const BOOKING_STATUS: Record<string, StatusCopy> = {
  PENDING: {
    label: 'Onay bekliyor',
    tone: 'pending',
    title: 'Kaptanın yanıtı bekleniyor',
    text: 'Talebin kaptana iletildi. Kaptan onayladığında ödeme adımı için seninle iletişime geçilir.',
  },
  APPROVED: {
    label: 'Onaylandı',
    tone: 'ok',
    title: 'Talebin onaylandı',
    text: 'Kaptan tarihlerini onayladı. Ödeme adımı için seninle iletişime geçilecek.',
  },
  REJECTED: {
    label: 'Onaylanmadı',
    tone: 'bad',
    title: 'Talebin onaylanmadı',
    text: 'Kaptan bu tarihler için talebini kabul edemedi. Farklı tarihler ya da benzer tekneler için yeniden talep gönderebilirsin.',
  },
  CANCELLED: {
    label: 'İptal edildi',
    tone: 'muted',
    title: 'Rezervasyon iptal edildi',
    text: 'Bu rezervasyon iptal edildi.',
  },
  COMPLETED: {
    label: 'Tamamlandı',
    tone: 'done',
    title: 'Yolculuk tamamlandı',
    text: 'Bu rezervasyon tamamlandı.',
  },
}

export function bookingStatus(status: string | null | undefined): StatusCopy {
  return (status && BOOKING_STATUS[status]) || { label: status ?? 'Durum bilinmiyor', tone: 'muted', title: status ?? 'Durum bilinmiyor', text: '' }
}

export const RENTAL_TYPE_LABEL: Record<string, string> = {
  HOURLY: 'Saatlik',
  DAILY: 'Günlük',
  WEEKLY: 'Haftalık',
  STAY: 'Konaklamalı',
}

/**
 * Rezervasyon tarihleri gün bazındadır (gece yarısı UTC olarak saklanır). Tarayıcının
 * saat dilimi günü kaydırmasın diye ISO metnin tarih kısmından yerel tarih kurulur.
 */
export function dayOf(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return y && m && d ? new Date(y, m - 1, d) : new Date(iso)
}

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('tr-TR', opts)

export function isSameDay(startIso: string, endIso: string): boolean {
  return dayOf(startIso).getTime() === dayOf(endIso).getTime()
}

/** "29 Kas – 3 Ara", aynı ay: "21–23 Ara", aynı gün: "29 Kas"; withYear ile sona yıl eklenir. */
function range(startIso: string, endIso: string, withYear: boolean): string {
  const s = dayOf(startIso)
  const e = dayOf(endIso)
  const year = withYear ? { year: 'numeric' as const } : {}
  if (s.getTime() === e.getTime()) return fmt(s, { day: 'numeric', month: 'short', ...year })
  const end = fmt(e, { day: 'numeric', month: 'short', ...year })
  if (s.getFullYear() !== e.getFullYear()) return `${fmt(s, { day: 'numeric', month: 'short', year: 'numeric' })} – ${end}`
  if (s.getMonth() === e.getMonth()) return `${s.getDate()}–${end}`
  return `${fmt(s, { day: 'numeric', month: 'short' })} – ${end}`
}

/** "29 Kas – 3 Ara 2026", "21–23 Ara 2026", "29 Kas 2026" */
export function formatRange(startIso: string, endIso: string): string {
  return range(startIso, endIso, true)
}

/** Bu yılın tarihlerinde yıl yazılmaz: "29 Kas – 3 Ara" */
export function formatRangeShort(startIso: string, endIso: string): string {
  const thisYear = new Date().getFullYear()
  const inThisYear = dayOf(startIso).getFullYear() === thisYear && dayOf(endIso).getFullYear() === thisYear
  return range(startIso, endIso, !inThisYear)
}

/** "29 Kasım 2026 Pazar" */
export function formatDayLong(iso: string): string {
  return fmt(dayOf(iso), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** Bugün ya da sonrasında biten rezervasyon "yaklaşan" sayılır. */
export function isUpcoming(endIso: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return dayOf(endIso).getTime() >= today.getTime()
}
