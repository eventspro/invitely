import { PARTNER_ICON_OPTIONS } from "./partnersData";
import type {
  PartnerCategory,
  PartnerVendor,
  PartnersContent,
  PartnersValidationIssue,
} from "./partnersTypes";

const SAFE_CONTACT_PROTOCOLS = new Set(["https:", "tel:", "mailto:", "tg:", "whatsapp:"]);
const SAFE_IMAGE_PROTOCOLS = new Set(["https:"]);
const LOCAL_IMAGE_PREFIXES = [
  "/attached_assets/",
  "/template_previews/",
  "/api/images/serve/",
  "/assets/",
  "/images/",
  "/Logo",
  "/Favicon",
  "/favicon",
];
const UNSAFE_PROTOCOL_RE = /^\s*(javascript|data|vbscript):/i;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PHONE_RE = /^\+?[\d\s().-]{4,32}$/;
const ICON_NAMES = new Set(PARTNER_ICON_OPTIONS.map((option) => option.value));

export function slugifyPartnerId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

export function isSafeText(value: string): boolean {
  return !/[<>]/.test(value);
}

export function isSafePhone(value: string): boolean {
  if (!value.trim()) return true;
  const digits = value.replace(/\D/g, "");
  return PHONE_RE.test(value.trim()) && digits.length >= 4;
}

export function isSafeContactUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (UNSAFE_PROTOCOL_RE.test(trimmed)) return false;

  try {
    const parsed = new URL(trimmed);
    return SAFE_CONTACT_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

export function isSafeImageReference(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (UNSAFE_PROTOCOL_RE.test(trimmed)) return false;
  if (trimmed.includes("\\") || trimmed.includes("..") || /[\s<>"']/.test(trimmed)) return false;

  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//")) return false;
    return LOCAL_IMAGE_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
  }

  try {
    const parsed = new URL(trimmed);
    return SAFE_IMAGE_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

export function sanitizeContactHref(value: string): string | undefined {
  const trimmed = value.trim();
  return isSafeContactUrl(trimmed) ? trimmed || undefined : undefined;
}

export function sanitizeImageSrc(value: string): string {
  return isSafeImageReference(value) && value.trim() ? value.trim() : "/template_previews/img1.webp";
}

function issue(
  issues: PartnersValidationIssue[],
  scope: PartnersValidationIssue["scope"],
  severity: PartnersValidationIssue["severity"],
  message: string,
  targetId?: string,
) {
  issues.push({
    id: `${scope}-${targetId ?? "page"}-${issues.length}`,
    scope,
    severity,
    message,
    targetId,
  });
}

function validateTextFields(
  issues: PartnersValidationIssue[],
  scope: PartnersValidationIssue["scope"],
  targetId: string | undefined,
  values: Record<string, string>,
) {
  for (const [label, value] of Object.entries(values)) {
    if (!isSafeText(value)) {
      issue(issues, scope, "error", `${label} cannot contain raw HTML brackets.`, targetId);
    }
  }
}

function validateCategory(
  category: PartnerCategory,
  issues: PartnersValidationIssue[],
  ids: Set<string>,
  index: number,
) {
  if (!category.id || !SLUG_RE.test(category.id)) {
    issue(issues, "category", "error", "Category id must be a lowercase slug with letters, numbers, and hyphens.", category.id || `category-${index}`);
  }
  if (ids.has(category.id)) {
    issue(issues, "category", "error", `Category id "${category.id}" is duplicated.`, category.id);
  }
  ids.add(category.id);

  if (!category.label.trim()) {
    issue(issues, "category", "error", "Category label is required.", category.id);
  }
  if (!ICON_NAMES.has(category.icon)) {
    issue(issues, "category", "error", "Category icon must use the predefined icon set.", category.id);
  }
  validateTextFields(issues, "category", category.id, { "Category label": category.label });
}

function validateVendor(
  vendor: PartnerVendor,
  issues: PartnersValidationIssue[],
  categoryIds: Set<string>,
) {
  if (!vendor.name.trim()) issue(issues, "vendor", "error", "Vendor name is required.", vendor.id);
  if (!vendor.categoryId || !categoryIds.has(vendor.categoryId)) {
    issue(issues, "vendor", "error", "Vendor category is required and must exist.", vendor.id);
  }
  if (vendor.priceFrom !== null && (!Number.isFinite(vendor.priceFrom) || vendor.priceFrom < 0)) {
    issue(issues, "vendor", "error", "Starting price must be a non-negative number or empty.", vendor.id);
  }
  if (!Number.isFinite(vendor.rating) || vendor.rating < 0 || vendor.rating > 5) {
    issue(issues, "vendor", "error", "Rating must be between 0 and 5.", vendor.id);
  }
  if (!Number.isInteger(vendor.reviewCount) || vendor.reviewCount < 0) {
    issue(issues, "vendor", "error", "Review count must be a non-negative integer.", vendor.id);
  }
  if (!Number.isFinite(vendor.popularity) || vendor.popularity < 0) {
    issue(issues, "vendor", "error", "Popularity score must be a non-negative number.", vendor.id);
  }
  if (!isSafePhone(vendor.phone)) issue(issues, "vendor", "error", "Phone must use a safe phone format.", vendor.id);

  const contactFields: Record<string, string> = {
    "Message link": vendor.messageLink,
    "Telegram link": vendor.telegramLink,
    "WhatsApp link": vendor.whatsappLink,
    "Instagram link": vendor.instagramLink,
    "Website link": vendor.websiteLink,
  };
  for (const [label, value] of Object.entries(contactFields)) {
    if (!isSafeContactUrl(value)) issue(issues, "vendor", "error", `${label} has an unsafe or malformed URL.`, vendor.id);
  }

  if (!isSafeImageReference(vendor.mainImage)) {
    issue(issues, "vendor", "error", "Main image must be a safe local media path or HTTPS image URL.", vendor.id);
  }
  vendor.galleryImages.forEach((image, index) => {
    if (!isSafeImageReference(image)) {
      issue(issues, "vendor", "error", `Gallery image ${index + 1} is not a safe media reference.`, vendor.id);
    }
  });

  validateTextFields(issues, "vendor", vendor.id, {
    "Vendor name": vendor.name,
    "Short description": vendor.shortDescription,
    "Full description": vendor.fullDescription,
    City: vendor.city,
    "Display price": vendor.displayPrice,
  });
  vendor.packages.forEach((pkg, index) => {
    validateTextFields(issues, "vendor", vendor.id, {
      [`Package ${index + 1} name`]: pkg.name,
      [`Package ${index + 1} price`]: pkg.price,
      [`Package ${index + 1} description`]: pkg.description,
    });
  });
  vendor.tags.forEach((tag, index) => {
    if (!isSafeText(tag)) issue(issues, "vendor", "error", `Tag ${index + 1} cannot contain raw HTML brackets.`, vendor.id);
  });

  if (vendor.status === "published" && (!vendor.enabled || !vendor.name.trim())) {
    issue(issues, "vendor", "warning", "Published vendors should be enabled and named to appear publicly.", vendor.id);
  }
}

export function validatePartnersContent(content: PartnersContent): PartnersValidationIssue[] {
  const issues: PartnersValidationIssue[] = [];

  validateTextFields(issues, "page", undefined, {
    Eyebrow: content.page.eyebrow,
    Title: content.page.title,
    Subtitle: content.page.subtitle,
  });

  if (!content.page.title.trim()) issue(issues, "page", "error", "Main title is required.");
  if (!isSafeImageReference(content.page.heroImage)) issue(issues, "page", "error", "Hero image must be a safe local media path or HTTPS image URL.");

  const categoryIds = new Set<string>();
  content.categories.forEach((category, index) => validateCategory(category, issues, categoryIds, index));

  const vendorIds = new Set<string>();
  content.vendors.forEach((vendor) => {
    if (vendorIds.has(vendor.id)) issue(issues, "vendor", "error", `Vendor id "${vendor.id}" is duplicated.`, vendor.id);
    vendorIds.add(vendor.id);
    validateVendor(vendor, issues, categoryIds);
  });

  return issues;
}

export function hasBlockingValidationErrors(content: PartnersContent): boolean {
  return validatePartnersContent(content).some((validationIssue) => validationIssue.severity === "error");
}
