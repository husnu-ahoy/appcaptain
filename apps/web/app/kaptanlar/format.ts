/** Kaptan sayfaları için gösterim yardımcıları (veriyi değiştirmez). */

/** "Kaptan Mehmet Yılmaz" → "Mehmet Yılmaz"; unvan sayfada ayrıca yazılıyor. */
export const displayName = (name: string) => name.replace(/^Kaptan\s+/i, '')

/** 4.97 → "4,97" */
export const fmtRating = (n: number) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })

/** 28500 → "28.500 TL" */
export const fmtPrice = (n: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n)} TL`

export const fmtCount = (n: number) => new Intl.NumberFormat('tr-TR').format(n)

/** Türkçe bulunma eki: Bodrum’da, Göcek’te, Kaş’ta, Fethiye’de. */
export function locative(word: string) {
  const w = word.toLocaleLowerCase('tr')
  const vowels = w.match(/[aıoueiöü]/g)
  const back = 'aıou'.includes(vowels?.at(-1) ?? 'a')
  const hard = /[fstkçşhp]$/.test(w)
  return `${word}’${hard ? 't' : 'd'}${back ? 'a' : 'e'}`
}

/** Unsplash görsellerini gösterilecek boyuta yakın genişlikte iste (kaynak 200px olduğu için büyük portre bulanıklaşıyordu). */
export const photo = (url: string, w: number) =>
  url.includes('images.unsplash.com') ? url.replace(/([?&])w=\d+/, `$1w=${w}`) : url
