import { Anchor, Compass, Fish, GraduationCap, Sailboat, Shell, Ship, Sunset, Waves, type LucideIcon } from 'lucide-react'

/** Deneyim türü ikonları (lib/content/experienceTypes slug'larına göre). */
export const TYPE_ICONS: Record<string, LucideIcon> = {
  tumu: Compass,
  'gunluk-turlar': Sailboat,
  'gun-batimi': Sunset,
  'dalis-snorkel': Shell,
  'su-sporlari': Waves,
  'balik-turlari': Fish,
  'ozel-deneyimler': Ship,
  dersler: GraduationCap,
  diger: Anchor,
}

export const typeIcon = (slug: string | null | undefined): LucideIcon => (slug && TYPE_ICONS[slug]) || Compass
