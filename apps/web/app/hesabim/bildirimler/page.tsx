import type { Metadata } from 'next'
import NotificationPrefs from '@/components/account/NotificationPrefs'

export const metadata: Metadata = { title: 'Bildirimler | Ahoy Boats' }

export default function BildirimlerPage() {
  return <NotificationPrefs />
}
