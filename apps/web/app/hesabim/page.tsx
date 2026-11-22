import type { Metadata } from 'next'
import PersonalInfo from '@/components/account/PersonalInfo'

export const metadata: Metadata = { title: 'Kişisel bilgiler | Ahoy Boats' }

export default function HesabimPage() {
  return <PersonalInfo />
}
