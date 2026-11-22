export type Country = {
  id: string
  label: string
}

export type Firm = {
  id: string
  slug: string
  name: string
  countryId: string
  countryLabel: string
  city: string
  logoText: string
  logoTone: 'blue' | 'teal' | 'navy' | 'gold' | 'coral'
  summary: string
  luggagePolicy: string
  routes: Array<{ from: string; to: string }>
  discounts: string[]
  fleetHighlights: string[]
}

export const COUNTRIES: Country[] = [
  { id: 'tr', label: 'Türkiye' },
  { id: 'gr', label: 'Yunanistan' },
  { id: 'it', label: 'İtalya' },
  { id: 'hr', label: 'Hırvatistan' },
  { id: 'es', label: 'İspanya' },
  { id: 'fr', label: 'Fransa' },
  { id: 'me', label: 'Karadağ' },
  { id: 'ae', label: 'BAE' },
]

export const FIRMS: Firm[] = [
  {
    id: 'f1',
    slug: 'blue-horizon-charter',
    name: 'Blue Horizon Charter',
    countryId: 'tr',
    countryLabel: 'Türkiye',
    city: 'Bodrum',
    logoText: 'BHC',
    logoTone: 'blue',
    summary: 'Blue Horizon Charter ile gulet, motoryat ve yelkenli seçeneklerini tek panelden karşılaştırabilirsiniz.',
    luggagePolicy: 'Standart rezervasyonlarda kişi başı bir orta boy valiz ve bir kişisel çanta kabul edilir.',
    routes: [
      { from: 'Bodrum', to: 'Datça' },
      { from: 'Marmaris', to: 'Bozburun' },
    ],
    discounts: ['Erken rezervasyonda %10', '7 gece ve üzeri kiralamada ekstra %5'],
    fleetHighlights: ['12–24 metre motoryatlar', 'Kaptanlı ve kaptansız seçenekler', 'Aile dostu tekne profili'],
  },
  {
    id: 'f2',
    slug: 'mavi-rota-yachting',
    name: 'Mavi Rota Yachting',
    countryId: 'tr',
    countryLabel: 'Türkiye',
    city: 'Bodrum',
    logoText: 'MR',
    logoTone: 'teal',
    summary: 'Mavi Rota Yachting, özellikle kısa süreli hafta sonu charter paketlerinde hızlı onay süreci sunar.',
    luggagePolicy: 'Ek spor ekipmanları (paddle, dalış çantası) uygun tekne tiplerinde önceden bildirimle kabul edilir.',
    routes: [
      { from: 'Göcek', to: '12 Adalar' },
      { from: 'Fethiye', to: 'Ölüdeniz' },
    ],
    discounts: ['Hafta içi çıkışlarda özel fiyat', 'Tekrar rezervasyonda sadakat indirimi'],
    fleetHighlights: ['Yeni model katamaranlar', 'Su oyuncakları dahil paketler', 'Göcek çıkışlı rota uzmanlığı'],
  },
  {
    id: 'f3',
    slug: 'aegean-sky-boats',
    name: 'Aegean Sky Boats',
    countryId: 'gr',
    countryLabel: 'Yunanistan',
    city: 'Mykonos',
    logoText: 'AS',
    logoTone: 'navy',
    summary: 'Aegean Sky Boats, Kiklad adaları arasında premium servis seviyesi ve esnek check-in seçenekleriyle öne çıkar.',
    luggagePolicy: 'Yolculuk uzunluğuna göre bagaj limitleri değişir; online rezervasyonda tekne bazlı detaylar gösterilir.',
    routes: [
      { from: 'Mykonos', to: 'Naxos' },
      { from: 'Santorini', to: 'Ios' },
    ],
    discounts: ['Dönüş rotasında eşleşmeli indirim', 'Grup rezervasyonlarında özel teklif'],
    fleetHighlights: ['Premium skipper havuzu', 'Hızlı check-in belgeleri', 'Kiklad odaklı rota paketleri'],
  },
  {
    id: 'f4',
    slug: 'cyclades-charter-co',
    name: 'Cyclades Charter Co.',
    countryId: 'gr',
    countryLabel: 'Yunanistan',
    city: 'Paros',
    logoText: 'CC',
    logoTone: 'blue',
    summary: 'Cyclades Charter Co., sezonsal etkinliklere uygun özel gezi rotalarıyla öne çıkan bir operatördür.',
    luggagePolicy: 'Kabin sayısına göre bagaj kapasitesi değişir; fazla bagaj için destek ekibi ön onay verir.',
    routes: [
      { from: 'Paros', to: 'Milos' },
      { from: 'Atina', to: 'Hydra' },
    ],
    discounts: ['Erken rezervasyonda ücretsiz tarih değişikliği', 'Kampanya dönemlerinde yakıt paketi'],
    fleetHighlights: ['Etkinlik charter seçenekleri', 'Geniş rota ağı', 'Dönemsel fiyat kampanyaları'],
  },
]

export function getFirmBySlug(slug: string): Firm | undefined {
  return FIRMS.find(firm => firm.slug === slug)
}
