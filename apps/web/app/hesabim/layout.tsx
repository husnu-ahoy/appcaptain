import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import AccountSettingsShell from '@/components/account/AccountSettingsShell'

export const metadata: Metadata = {
  title: 'Hesap ayarları | Ahoy Boats',
  robots: { index: false, follow: false },
}

export default function HesabimLayout({ children }: { children: ReactNode }) {
  return <AccountSettingsShell>{children}</AccountSettingsShell>
}
