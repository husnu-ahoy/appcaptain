import {
  ExperienceCategory,
  ExperiencePricingType,
  ExperienceStatus,
  ExperienceStep,
  CancellationPolicyType,
  ExperienceProductType,
  ExperienceDifficultyLevel,
  CustomerInfoFieldType,
} from "../enums";

export interface ExperienceProgressDTO {
  currentStep: ExperienceStep;
  completedSteps: ExperienceStep[];
  isReadyForSubmit: boolean;
}

export interface ExperienceListItemDTO {
  id: string;
  status: ExperienceStatus;
  category: ExperienceCategory | null;
  title: string;
  shortDescription: string;
  coverPhotoUrl: string;
  durationMinutes: number;
  maxParticipants: number;
  basePrice: number;
  currency: string;
  /** Sihirbaz tamamlanma yüzdesi (0-100), taslak kartlarında gösterilir. */
  completionPercent: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Herkese açık liste (GET /public/experiences) öğesi: liste kartları ve filtreler
 * için birkaç ek alan taşır. Hepsi detay ucunda zaten herkese açıktır. API'nin
 * eski sürümleri bu alanları döndürmeyebileceği için isteğe bağlıdır.
 */
export interface PublicExperienceListItemDTO extends ExperienceListItemDTO {
  secondaryCategories?: ExperienceCategory[];
  productType?: ExperienceProductType | null;
  meetingPoint?: string;
  languages?: string[];
  minAge?: number | null;
  pickupOffered?: boolean;
  pricingType?: ExperiencePricingType;
  cancellationPolicy?: CancellationPolicyType;
  childDiscountPercent?: number | null;
}

export interface ExperienceCustomerInfoFieldDTO {
  id: string;
  label: string;
  fieldType: CustomerInfoFieldType;
  required: boolean;
  helpText: string | null;
  options: string[];
  sortOrder: number;
}

export interface ExperienceSeasonalPricingRuleDTO {
  id: string;
  label: string;
  startDate: string | Date;
  endDate: string | Date;
  price: number;
}

export interface ExperienceDTO {
  id: string;
  captainId: string;
  status: ExperienceStatus;
  progress: ExperienceProgressDTO;
  category: ExperienceCategory | null;
  secondaryCategories: ExperienceCategory[];
  productType: ExperienceProductType | null;
  title: string;
  referenceCode: string | null;
  shortDescription: string;
  fullDescription: string;
  highlights: string[];
  keywords: string[];
  included: string[];
  notIncluded: string[];
  notAllowed: string[];
  toBring: string[];
  knowBeforeYouGo: string[];
  emergencyContactPhone: string | null;
  difficultyLevel: ExperienceDifficultyLevel | null;
  durationMinutes: number;
  meetingPoint: string;
  meetingPointLat: number | null;
  meetingPointLng: number | null;
  meetingTime: string;
  endPoint: string;
  endPointLat: number | null;
  endPointLng: number | null;
  isSameEndPoint: boolean;
  languages: string[];
  minParticipants: number;
  maxParticipants: number;
  minAge: number | null;
  ticketType: string | null;
  requiredEquipment: string[];
  accessibilityInfo: string | null;
  accessibilityOptions: string[];
  pickupOffered: boolean;
  pickupAreas: string | null;
  pickupFee: number | null;
  basePrice: number;
  currency: string;
  pricingType: ExperiencePricingType;
  childDiscountPercent: number | null;
  currencyLocked: boolean;
  displayCurrency: string | null;
  cancellationPolicy: CancellationPolicyType;
  cancellationPolicyText: string | null;
  cancellationTiers: { daysBefore: number; refundPercent: number }[];
  coverPhotoUrl: string;
  photoUrls: string[];
  videoUrl: string | null;
  reviewNote: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  customerInfoFields: ExperienceCustomerInfoFieldDTO[];
  seasonalPricingRules: ExperienceSeasonalPricingRuleDTO[];
}

export interface ExperienceAdminListItemDTO extends ExperienceListItemDTO {
  captainName: string | null;
  captainEmail: string | null;
}
