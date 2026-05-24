/**
 * types.ts — Content config types for the homepage translations prototype.
 * Every user-visible string is a LocaleString (LS) with hy/en/ru keys.
 */

// ─── Locale ──────────────────────────────────────────────────────────────────
export type Locale = "hy" | "en" | "ru";

/** A translatable string stored per-locale */
export interface LS { hy: string; en: string; ru: string; }

// ─── Navigation ──────────────────────────────────────────────────────────────
export interface NavItem {
  id: string;
  label: LS;
  href: string;
  visible: boolean;
}

export interface Navigation {
  items: NavItem[];
  loginLabel: LS;
  loginHref: string;
  startLabel: LS;
}

// ─── Hero ────────────────────────────────────────────────────────────────────
export interface CtaButton {
  label: LS;
  href: string;
  visible: boolean;
}

export interface Chip {
  id: string;
  label: LS;
  visible: boolean;
}

export interface HeroConfig {
  eyebrow: LS;
  title: LS;
  titleHighlight: LS;
  titleSuffix: LS;
  subtitle: LS;
  primaryCta: CtaButton;
  secondaryCta: CtaButton;
  chips: Chip[];
  backgroundImage: string;
  phonePreviewUrl: string;
}

// ─── Templates ───────────────────────────────────────────────────────────────
export interface TemplateCard {
  id: string;
  name: LS;
  description: LS;
  tag: LS;
  price: LS;
  image: string;
  href: string;
  buttonLabel: LS;
  visible: boolean;
}

export interface TemplatesSection {
  eyebrow: LS;
  title: LS;
  items: TemplateCard[];
}

// ─── How It Works ─────────────────────────────────────────────────────────────
export interface HowItWorksStep {
  id: string;
  number: string;
  icon: string;
  title: LS;
  text: LS;
  visible: boolean;
}

export interface HowItWorksSection {
  eyebrow: LS;
  title: LS;
  steps: HowItWorksStep[];
}

// ─── Features (guest features) ───────────────────────────────────────────────
export interface FeatureItem {
  id: string;
  icon: string;
  title: LS;
  visible: boolean;
}

export interface FeaturesSection {
  eyebrow: LS;
  title: LS;
  items: FeatureItem[];
}

// ─── Benefits (hero micro-badges) ────────────────────────────────────────────
export interface BenefitItem {
  id: string;
  icon: string;
  title: LS;
  text: LS;
  visible: boolean;
}

// ─── Mobile Experience ───────────────────────────────────────────────────────
export interface ActionChip {
  id: string;
  icon: string;
  label: LS;
  visible: boolean;
}

export interface MobileExperienceSection {
  eyebrow: LS;
  title: LS;
  subtitle: LS;
  actions: ActionChip[];
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
export interface FaqItem {
  id: string;
  question: LS;
  answer: LS;
  visible: boolean;
}

export interface FaqSection {
  eyebrow: LS;
  title: LS;
  items: FaqItem[];
}

// ─── Contact ─────────────────────────────────────────────────────────────────
export interface ContactButton {
  id: string;
  label: LS;
  href: string;
  icon: string;
  visible: boolean;
}

export interface ContactSection {
  eyebrow: LS;
  title: LS;
  subtitle: LS;
  buttons: ContactButton[];
}

// ─── Footer ──────────────────────────────────────────────────────────────────
export interface TrustItem {
  id: string;
  icon: string;
  title: LS;
  text: LS;
  visible: boolean;
}

export interface FooterSection {
  email: string;
  phone: string;
  copyright: LS;
  trustItems: TrustItem[];
}

// ─── Root config ─────────────────────────────────────────────────────────────
export interface HomepageContent {
  navigation: Navigation;
  hero: HeroConfig;
  templates: TemplatesSection;
  howItWorks: HowItWorksSection;
  features: FeaturesSection;
  benefits: BenefitItem[];
  mobileExperience: MobileExperienceSection;
  faq: FaqSection;
  contact: ContactSection;
  footer: FooterSection;
}

// ─── Validation ──────────────────────────────────────────────────────────────
export interface ValidationWarning {
  field: string;
  message: string;
  severity: "error" | "warning";
}

// ─── Icon keys (predefined set) ───────────────────────────────────────────────
export type IconKey =
  | "heart" | "calendar" | "map" | "camera" | "message" | "phone"
  | "instagram" | "facebook" | "telegram" | "gift" | "lock"
  | "star" | "users" | "check" | "smartphone" | "share" | "edit"
  | "sparkles" | "clock" | "palette" | "send" | "arrow";
