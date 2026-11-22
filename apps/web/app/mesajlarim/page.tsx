import type { Metadata } from 'next'
import { Suspense } from 'react'
import InboxClient from '@/components/inbox/InboxClient'

export const metadata: Metadata = {
  title: 'Mesajlar | Ahoy Boats',
  robots: { index: false, follow: false },
}

export default function MesajlarimPage() {
  return (
    <Suspense fallback={<div className="sh-ib-page" />}>
      <InboxClient />
    </Suspense>
  )
}
