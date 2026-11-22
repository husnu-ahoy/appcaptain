import type { Metadata } from 'next'
import FavoritesClient from '@/components/account/FavoritesClient'

export const metadata: Metadata = {
  title: 'Favoriler | Ahoy Boats',
  robots: { index: false, follow: false },
}

export default function FavorilerimPage() {
  return <FavoritesClient />
}
