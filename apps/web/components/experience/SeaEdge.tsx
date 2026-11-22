/** Sayfanın altından krem renkli footer'a dalgalı geçiş (deneyim sayfaları). */
export default function SeaEdge() {
  return (
    <div className="sh-x-sea" aria-hidden="true">
      <svg viewBox="0 0 1440 64" preserveAspectRatio="none">
        <path className="sh-x-sea-back" d="M0 34 C 160 8 320 8 480 30 S 800 56 960 34 S 1280 6 1440 26 V64 H0 Z" />
        <path className="sh-x-sea-front" d="M0 44 C 200 62 380 62 560 42 S 900 20 1080 38 S 1340 60 1440 46 V64 H0 Z" />
      </svg>
    </div>
  )
}
