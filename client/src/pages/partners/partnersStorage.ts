import { DEFAULT_PARTNERS_CONTENT } from "./partnersData";
import type {
  PartnerCategory,
  PartnerExample,
  PartnerPackage,
  PartnerStatus,
  PartnerVendor,
  PartnersContent,
  PartnersPageSettings,
} from "./partnersTypes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizePage(value: unknown): PartnersPageSettings {
  const defaults = DEFAULT_PARTNERS_CONTENT.page;
  const page = isRecord(value) ? value : {};
  return {
    eyebrow: asString(page.eyebrow, defaults.eyebrow),
    title: asString(page.title, defaults.title),
    subtitle: asString(page.subtitle, defaults.subtitle),
    heroImage: asString(page.heroImage, defaults.heroImage),
    helpPanelTitle: asString(page.helpPanelTitle, defaults.helpPanelTitle),
    helpPanelDescription: asString(page.helpPanelDescription, defaults.helpPanelDescription),
    contactPhone: asString(page.contactPhone, defaults.contactPhone),
    messageLink: asString(page.messageLink, defaults.messageLink),
    telegramLink: asString(page.telegramLink, defaults.telegramLink),
    whatsappLink: asString(page.whatsappLink, defaults.whatsappLink),
    instagramLink: asString(page.instagramLink, defaults.instagramLink),
    showExamples: asBoolean(page.showExamples, defaults.showExamples),
    showHelpPanel: asBoolean(page.showHelpPanel, defaults.showHelpPanel),
  };
}

function normalizeCategory(value: unknown, fallback: PartnerCategory): PartnerCategory {
  const category = isRecord(value) ? value : {};
  return {
    id: asString(category.id, fallback.id),
    label: asString(category.label, fallback.label),
    icon: asString(category.icon, fallback.icon) as PartnerCategory["icon"],
    enabled: asBoolean(category.enabled, fallback.enabled),
    order: asNumber(category.order, fallback.order),
  };
}

function normalizePackage(value: unknown, fallbackIndex: number): PartnerPackage {
  const pkg = isRecord(value) ? value : {};
  return {
    id: asString(pkg.id, `package-${fallbackIndex + 1}`),
    name: asString(pkg.name),
    price: asString(pkg.price),
    description: asString(pkg.description),
  };
}

function normalizeVendor(value: unknown, fallback: PartnerVendor): PartnerVendor {
  const vendor = isRecord(value) ? value : {};
  const status = asString(vendor.status, fallback.status);
  return {
    id: asString(vendor.id, fallback.id),
    name: asString(vendor.name, fallback.name),
    categoryId: asString(vendor.categoryId, fallback.categoryId),
    shortDescription: asString(vendor.shortDescription, fallback.shortDescription),
    fullDescription: asString(vendor.fullDescription, fallback.fullDescription),
    city: asString(vendor.city, fallback.city),
    priceFrom: asNullableNumber(vendor.priceFrom),
    currency: asString(vendor.currency, fallback.currency),
    displayPrice: asString(vendor.displayPrice, fallback.displayPrice),
    rating: asNumber(vendor.rating, fallback.rating),
    reviewCount: asNumber(vendor.reviewCount, fallback.reviewCount),
    popularity: asNumber(vendor.popularity, fallback.popularity),
    mainImage: asString(vendor.mainImage, fallback.mainImage),
    galleryImages: asStringArray(vendor.galleryImages),
    phone: asString(vendor.phone),
    messageLink: asString(vendor.messageLink),
    telegramLink: asString(vendor.telegramLink),
    whatsappLink: asString(vendor.whatsappLink),
    instagramLink: asString(vendor.instagramLink),
    websiteLink: asString(vendor.websiteLink),
    packages: Array.isArray(vendor.packages)
      ? vendor.packages.map((item, index) => normalizePackage(item, index))
      : fallback.packages,
    tags: asStringArray(vendor.tags),
    status: (status === "draft" || status === "published" || status === "hidden" ? status : fallback.status) as PartnerStatus,
    enabled: asBoolean(vendor.enabled, fallback.enabled),
    featured: asBoolean(vendor.featured, fallback.featured),
    featuredOrder: asNumber(vendor.featuredOrder, fallback.featuredOrder),
    updatedAt: asString(vendor.updatedAt, fallback.updatedAt),
  };
}

function normalizeExample(value: unknown, fallback: PartnerExample): PartnerExample {
  const example = isRecord(value) ? value : {};
  return {
    id: asString(example.id, fallback.id),
    title: asString(example.title, fallback.title),
    categoryId: asString(example.categoryId, fallback.categoryId),
    linkedVendorId: asString(example.linkedVendorId, fallback.linkedVendorId),
    image: asString(example.image, fallback.image),
    enabled: asBoolean(example.enabled, fallback.enabled),
    order: asNumber(example.order, fallback.order),
  };
}

export function normalizePartnersContent(value: unknown): PartnersContent {
  if (!isRecord(value)) return DEFAULT_PARTNERS_CONTENT;
  const categories = Array.isArray(value.categories)
    ? value.categories.map((item, index) =>
        normalizeCategory(item, DEFAULT_PARTNERS_CONTENT.categories[index] ?? DEFAULT_PARTNERS_CONTENT.categories[0]),
      )
    : DEFAULT_PARTNERS_CONTENT.categories;
  const vendors = Array.isArray(value.vendors)
    ? value.vendors.map((item, index) =>
        normalizeVendor(item, DEFAULT_PARTNERS_CONTENT.vendors[index] ?? DEFAULT_PARTNERS_CONTENT.vendors[0]),
      )
    : DEFAULT_PARTNERS_CONTENT.vendors;
  const examples = Array.isArray(value.examples)
    ? value.examples.map((item, index) =>
        normalizeExample(item, DEFAULT_PARTNERS_CONTENT.examples[index] ?? DEFAULT_PARTNERS_CONTENT.examples[0]),
      )
    : DEFAULT_PARTNERS_CONTENT.examples;

  return {
    version: 1,
    page: normalizePage(value.page),
    categories,
    vendors,
    examples,
    updatedAt: asString(value.updatedAt, DEFAULT_PARTNERS_CONTENT.updatedAt),
  };
}

export async function fetchPublishedPartnersContent(): Promise<PartnersContent | null> {
  try {
    const res = await fetch("/api/partners-content", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: unknown };
    return data.content ? normalizePartnersContent(data.content) : null;
  } catch {
    return null;
  }
}

export async function fetchAdminPartnersContent(token: string): Promise<PartnersContent | null> {
  const res = await fetch("/api/platform-admin/partners-content", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) throw new Error("unauthorized");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load partners content");
  const data = (await res.json()) as { content?: unknown };
  return data.content ? normalizePartnersContent(data.content) : null;
}

export async function publishPartnersContent(content: PartnersContent, token: string): Promise<void> {
  const res = await fetch("/api/platform-admin/partners-content", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(content),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : "Failed to publish partners content");
  }
}

export function exportPartnersContent(content: PartnersContent): void {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `partners-content-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parsePartnersContentJson(json: string): PartnersContent {
  return normalizePartnersContent(JSON.parse(json));
}
