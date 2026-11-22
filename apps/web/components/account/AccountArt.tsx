/*
 * Hesap sayfalarının boş durum çizimleri: sade, marka renklerinde, metinsiz.
 * Hepsi 200×150 tuvalde; CSS ile boyutlanır.
 */

const NAVY = '#183D85'
const LINE = '#E3E0DB'
const SKELETON = '#ECE9E4'

/** Favoriler: kalpli tekne kartı */
export function FavoritesArt() {
  return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fav-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EAF3FA" />
          <stop offset="1" stopColor="#D3E6F2" />
        </linearGradient>
        <filter id="fav-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#101828" floodOpacity="0.16" />
        </filter>
      </defs>
      <rect x="36" y="12" width="128" height="126" rx="16" fill="#fff" stroke={LINE} strokeWidth="1.5" />
      <rect x="44" y="20" width="112" height="70" rx="10" fill="url(#fav-sky)" />
      <path d="M44 74h112v6c0 5.5-4.5 10-10 10H54c-5.5 0-10-4.5-10-10v-6Z" fill="#BFDCEC" />
      <path d="M95 36v30H78l17-30Z" fill={NAVY} />
      <path d="M99 42v24h13L99 42Z" fill="#fff" stroke={NAVY} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M74 69h44l-5 7H80l-6-7Z" fill={NAVY} />
      <rect x="44" y="100" width="64" height="8" rx="4" fill={SKELETON} />
      <rect x="44" y="114" width="40" height="8" rx="4" fill={SKELETON} opacity="0.7" />
      <rect x="128" y="100" width="28" height="8" rx="4" fill={SKELETON} />
      <g filter="url(#fav-shadow)">
        <circle cx="150" cy="26" r="17" fill="#fff" />
      </g>
      <path
        d="M150 35.5s-8.5-5.1-8.5-10.6a4.8 4.8 0 0 1 8.5-3.1 4.8 4.8 0 0 1 8.5 3.1c0 5.5-8.5 10.6-8.5 10.6Z"
        fill="#E5484D"
      />
    </svg>
  )
}

/** Mesajlar: iki konuşma balonu */
export function MessagesArt() {
  return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M30 34c0-7.7 6.3-14 14-14h78c7.7 0 14 6.3 14 14v34c0 7.7-6.3 14-14 14H62l-17 14v-14h-1c-7.7 0-14-6.3-14-14V34Z"
        fill="#fff"
        stroke={LINE}
        strokeWidth="1.5"
      />
      <rect x="46" y="38" width="62" height="8" rx="4" fill={SKELETON} />
      <rect x="46" y="54" width="44" height="8" rx="4" fill={SKELETON} opacity="0.7" />
      <path
        d="M78 82c0-7.2 5.8-13 13-13h65c7.2 0 13 5.8 13 13v26c0 7.2-5.8 13-13 13h-3v13l-15-13H91c-7.2 0-13-5.8-13-13V82Z"
        fill={NAVY}
      />
      <circle cx="108" cy="95" r="4.5" fill="#fff" />
      <circle cx="123.5" cy="95" r="4.5" fill="#fff" opacity="0.75" />
      <circle cx="139" cy="95" r="4.5" fill="#fff" opacity="0.5" />
    </svg>
  )
}

/** Rezervasyonlar: tarihi işaretli takvim */
export function TripsArt() {
  const cells = Array.from({ length: 12 }, (_, i) => i)
  return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="18" width="120" height="116" rx="16" fill="#fff" stroke={LINE} strokeWidth="1.5" />
      <path d="M40 34c0-8.8 7.2-16 16-16h88c8.8 0 16 7.2 16 16v10H40V34Z" fill={NAVY} />
      <rect x="66" y="10" width="6" height="18" rx="3" fill="#0E2A63" />
      <rect x="128" y="10" width="6" height="18" rx="3" fill="#0E2A63" />
      {cells.map(i => {
        const x = 54 + (i % 4) * 25
        const y = 56 + Math.floor(i / 4) * 24
        return i === 6 ? null : <rect key={i} x={x} y={y} width="17" height="13" rx="4" fill={SKELETON} opacity={i > 8 ? 0.6 : 1} />
      })}
      <circle cx="112.5" cy="86.5" r="13" fill="#55A99D" />
      <path d="m106.5 86.8 4 4 8-8.3" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Hesap: kalkanlı profil kartı */
export function AccountArt() {
  return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="34" y="22" width="132" height="106" rx="16" fill="#fff" stroke={LINE} strokeWidth="1.5" />
      <circle cx="74" cy="64" r="18" fill="#E3EEF8" />
      <circle cx="74" cy="59" r="7" fill={NAVY} />
      <path d="M61 76c2.6-6 7.4-9 13-9s10.4 3 13 9" fill={NAVY} />
      <rect x="102" y="52" width="46" height="8" rx="4" fill={SKELETON} />
      <rect x="102" y="68" width="32" height="8" rx="4" fill={SKELETON} opacity="0.7" />
      <rect x="50" y="98" width="100" height="10" rx="5" fill={SKELETON} opacity="0.6" />
      <path d="M150 92l16 6v11c0 10-7 17-16 20-9-3-16-10-16-20V98l16-6Z" fill="#55A99D" />
      <path d="m143.5 109.5 4.5 4.5 8.5-9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
