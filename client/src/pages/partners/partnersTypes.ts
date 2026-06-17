export type PartnerIconName =
  | "sparkles"
  | "music"
  | "mic"
  | "camera"
  | "video"
  | "building"
  | "flower"
  | "cake"
  | "party"
  | "more"
  | "heart"
  | "palette";

export type PartnerStatus = "draft" | "published" | "hidden";

export interface PartnersPageSettings {
  eyebrow: string;
  title: string;
  subtitle: string;
  heroImage: string;
  helpPanelTitle: string;
  helpPanelDescription: string;
  contactPhone: string;
  messageLink: string;
  telegramLink: string;
  whatsappLink: string;
  instagramLink: string;
  showExamples: boolean;
  showHelpPanel: boolean;
}

export interface PartnerCategory {
  id: string;
  label: string;
  icon: PartnerIconName;
  enabled: boolean;
  order: number;
}

export interface PartnerPackage {
  id: string;
  name: string;
  price: string;
  description: string;
}

export interface PartnerVendor {
  id: string;
  name: string;
  categoryId: string;
  shortDescription: string;
  fullDescription: string;
  city: string;
  priceFrom: number | null;
  currency: string;
  displayPrice: string;
  rating: number;
  reviewCount: number;
  popularity: number;
  mainImage: string;
  galleryImages: string[];
  phone: string;
  messageLink: string;
  telegramLink: string;
  whatsappLink: string;
  instagramLink: string;
  websiteLink: string;
  packages: PartnerPackage[];
  tags: string[];
  status: PartnerStatus;
  enabled: boolean;
  featured: boolean;
  featuredOrder: number;
  updatedAt: string;
}

export interface PartnerExample {
  id: string;
  title: string;
  categoryId: string;
  linkedVendorId: string;
  image: string;
  enabled: boolean;
  order: number;
}

export interface PartnersContent {
  version: 1;
  page: PartnersPageSettings;
  categories: PartnerCategory[];
  vendors: PartnerVendor[];
  examples: PartnerExample[];
  updatedAt: string;
}

export type PartnersValidationSeverity = "error" | "warning";
export type PartnersValidationScope = "page" | "category" | "vendor" | "example";

export interface PartnersValidationIssue {
  id: string;
  scope: PartnersValidationScope;
  severity: PartnersValidationSeverity;
  message: string;
  targetId?: string;
}
