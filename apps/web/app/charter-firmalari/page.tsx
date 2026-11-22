import type { Metadata } from 'next'
import CharterFirmsClient from './CharterFirmsClient'

export const metadata: Metadata = {
  title: 'Charter firmaları — Ahoy',
  description: 'Ahoy’daki charter firmalarını ülke ve şehre göre keşfet; rotalarını, filolarını ve kampanyalarını karşılaştır.',
}

export default function CharterFirmsPage() {
  return <CharterFirmsClient />
}
