import type { Metadata } from 'next'
import LoginSecurity from '@/components/account/LoginSecurity'

export const metadata: Metadata = { title: 'Giriş ve güvenlik | Ahoy Boats' }

export default function GirisVeGuvenlikPage() {
  return <LoginSecurity />
}
