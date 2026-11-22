import {
  CancellationPolicyType,
  CustomerInfoFieldType,
  ExperienceCategory,
  ExperienceDifficultyLevel,
  ExperiencePricingType,
  ExperienceProductType,
  ExperienceStatus,
  ExperienceStep,
  EXPERIENCE_STEP_ORDER,
  type ExperienceDTO,
} from '@ahoy/shared'

/**
 * Örnek deneyim. Kaptan panelindeki deneyim sihirbazının yedi adımındaki tüm
 * alanlar doludur (kategori, başlık/açıklama, dahil/hariç, lojistik, fiyatlandırma,
 * iptal politikası, medya). Yayında gerçek bir deneyim yokken /deneyimler'de
 * "Örnek" etiketiyle gösterilir ve rezervasyona kapalıdır; veritabanında yer almaz.
 *
 * Fotoğraflar (Unsplash Lisansı): Lucas Salmin (gün batımı), Raelle Cameron (yüzme
 * molası), Marc Snailum (koy), Xena Comanelea (gün batımında yelken) ve eski deneyim
 * sayfasındaki koy fotoğrafı; akşam sofrası karesi sitenin kendi hero görselinden.
 */
export const SAMPLE_EXPERIENCE_ID = 'ornek-gun-batimi-tekne-turu'

export const SAMPLE_EXPERIENCE: ExperienceDTO = {
  id: SAMPLE_EXPERIENCE_ID,
  captainId: 'ornek',
  status: ExperienceStatus.ACTIVE,
  progress: { currentStep: ExperienceStep.MEDIA, completedSteps: [...EXPERIENCE_STEP_ORDER], isReadyForSubmit: true },

  /* 1. Kategori */
  category: ExperienceCategory.SUNSET_CRUISE,
  secondaryCategories: [ExperienceCategory.BOAT_TOUR, ExperienceCategory.DIVING_SNORKELING],
  productType: ExperienceProductType.TOUR,

  /* 2. Başlık ve açıklama */
  title: 'Bodrum koylarında gün batımı tekne turu',
  referenceCode: 'ORNEK-001',
  shortDescription:
    'Ahşap bir gulette, iki koyda yüzme molası verip gün batımını açık denizde izlediğin 4 saatlik küçük grup turu.',
  fullDescription: [
    'Öğleden sonra Bodrum Marina’dan ahşap bir gulette yola çıkıyoruz. İlk durakta berrak suda yüzüp şnorkelle dalıyor, ikinci koyda güvertede meze tabağı ve mevsim meyveleriyle soluklanıyoruz.',
    'Güneş alçalırken açık denize dönüyor, gün batımını teknenin baş tarafından izliyoruz. Grup en fazla 12 kişiyle sınırlı olduğu için güvertede herkese yer var; kaptan ve mürettebat tur boyunca yanında.',
    'Rota rüzgâr ve deniz durumuna göre kaptan tarafından günün koşullarına uygun olarak belirlenir.',
  ].join('\n\n'),
  highlights: [
    'Gün batımını açık denizde, teknenin baş tarafından izle',
    'İki koyda yüzme ve şnorkel molası',
    'En fazla 12 kişilik küçük grup',
    'Güvertede meze tabağı ve mevsim meyveleri',
    'Deneyimli kaptan ve mürettebat eşliğinde',
  ],
  keywords: ['gün batımı', 'bodrum', 'tekne turu', 'gulet', 'yüzme molası'],

  /* 3. Dahil / hariç */
  included: ['Kaptan ve mürettebat', 'Yakıt', 'Şnorkel ekipmanı', 'Meze tabağı ve mevsim meyveleri', 'Su ve meşrubat', 'Can yeleği ve sigorta'],
  notIncluded: ['Alkollü içecekler', 'Otel transferi (isteğe bağlı, ek ücretli)', 'Bahşiş'],
  notAllowed: ['Cam şişe', 'Kapalı alanda sigara', 'Evcil hayvan'],
  toBring: ['Mayo ve havlu', 'Güneş kremi', 'Şapka ve güneş gözlüğü', 'Akşam serinliği için ince bir üst'],
  knowBeforeYouGo: [
    'Kalkıştan 15 dakika önce buluşma noktasında ol.',
    'Rota rüzgâr ve deniz durumuna göre değişebilir.',
    'Deniz tutmasına yatkınsan tura çıkmadan önce önlem al.',
  ],
  emergencyContactPhone: null,
  difficultyLevel: ExperienceDifficultyLevel.EASY,

  /* 4. Lojistik */
  durationMinutes: 240,
  meetingPoint: 'Bodrum Marina girişi, Neyzen Tevfik Caddesi, Bodrum',
  meetingPointLat: 37.0353,
  meetingPointLng: 27.4231,
  meetingTime: '16:30',
  endPoint: '',
  endPointLat: null,
  endPointLng: null,
  isSameEndPoint: true,
  languages: ['Türkçe', 'İngilizce'],
  minParticipants: 2,
  maxParticipants: 12,
  minAge: 6,
  ticketType: 'mobile',
  requiredEquipment: ['Yüzme bilmek önerilir'],
  accessibilityInfo: 'Tekneye iskeleden tek basamakla binilir; mürettebat biniş ve inişte yardımcı olur.',
  accessibilityOptions: ['Yaşlı/hareket kısıtlı uyumlu'],
  pickupOffered: true,
  pickupAreas: 'Bodrum merkez, Gümbet ve Bitez otelleri',
  pickupFee: 250,

  /* 5. Fiyatlandırma */
  basePrice: 1450,
  currency: 'TRY',
  pricingType: ExperiencePricingType.PER_PERSON,
  childDiscountPercent: 30,
  currencyLocked: false,
  displayCurrency: 'EUR',

  /* 6. İptal politikası */
  cancellationPolicy: CancellationPolicyType.FREE_24H,
  cancellationPolicyText: null,
  cancellationTiers: [
    { daysBefore: 1, refundPercent: 100 },
    { daysBefore: 0, refundPercent: 0 },
  ],

  /* 7. Medya */
  coverPhotoUrl: '/deneyimler/ornek/gunbatimi.webp',
  photoUrls: [
    '/deneyimler/ornek/yuzme-molasi.webp',
    '/deneyimler/ornek/koy.webp',
    '/deneyimler/ornek/aksam-sofrasi.webp',
    '/deneyimler/ornek/yelkenli-koy.webp',
    '/deneyimler/ornek/gunbatimi-yelken.webp',
  ],
  videoUrl: null,

  reviewNote: null,
  createdAt: '2026-11-14T00:00:00.000Z',
  updatedAt: '2026-11-14T00:00:00.000Z',
  customerInfoFields: [
    {
      id: 'ornek-otel',
      label: 'Otel adı',
      fieldType: CustomerInfoFieldType.TEXT,
      required: false,
      helpText: 'Otelden alınma istiyorsan alınma saatini bildirebilmemiz için.',
      options: [],
      sortOrder: 0,
    },
    {
      id: 'ornek-yuzme',
      label: 'Yüzme biliyor musun?',
      fieldType: CustomerInfoFieldType.DROPDOWN,
      required: true,
      helpText: null,
      options: ['Evet', 'Hayır'],
      sortOrder: 1,
    },
  ],
  seasonalPricingRules: [{ id: 'ornek-sezon', label: 'Yüksek sezon', startDate: '2027-07-01', endDate: '2027-08-31', price: 1750 }],
}

export function isSampleExperience(id: string): boolean {
  return id === SAMPLE_EXPERIENCE_ID
}
