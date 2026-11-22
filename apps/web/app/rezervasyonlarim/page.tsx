import type { Metadata } from 'next'
import TripsClient from '@/components/account/TripsClient'

export const metadata: Metadata = {
  title: 'Rezervasyonlarım | Ahoy Boats',
  robots: { index: false, follow: false },
}

export default function RezervasyonlarimPage() {
  return <TripsClient />
}
