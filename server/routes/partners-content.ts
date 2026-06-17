import { Router, type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { platformSettings } from "../../shared/schema.js";

const SETTINGS_KEY = "partners_content_v1";
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
const ICON_NAMES = new Set([
  "sparkles",
  "music",
  "mic",
  "camera",
  "video",
  "building",
  "flower",
  "cake",
  "party",
  "more",
  "heart",
  "palette",
]);
const STATUSES = new Set(["draft", "published", "hidden"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasUnsafeMarkup(value: unknown): boolean {
  return typeof value === "string" && /[<>]/.test(value);
}

function isSafePhone(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (!value.trim()) return true;
  const digits = value.replace(/\D/g, "");
  return PHONE_RE.test(value.trim()) && digits.length >= 4;
}

function isSafeContactUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
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

function isSafeImageReference(value: unknown): boolean {
  if (typeof value !== "string") return false;
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

function validateString(errors: string[], value: unknown, path: string, maxLength: number, required = false) {
  if (typeof value !== "string") {
    errors.push(`${path} must be a string.`);
    return;
  }
  if (required && !value.trim()) errors.push(`${path} is required.`);
  if (value.length > maxLength) errors.push(`${path} is too long.`);
  if (hasUnsafeMarkup(value)) errors.push(`${path} cannot contain raw HTML brackets.`);
}

function validateNumber(errors: string[], value: unknown, path: string, min: number, max?: number, integer = false) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(`${path} must be a number.`);
    return;
  }
  if (integer && !Number.isInteger(value)) errors.push(`${path} must be an integer.`);
  if (value < min) errors.push(`${path} must be at least ${min}.`);
  if (max !== undefined && value > max) errors.push(`${path} must be at most ${max}.`);
}

function validatePage(errors: string[], page: unknown) {
  if (!isRecord(page)) {
    errors.push("page must be an object.");
    return;
  }
  validateString(errors, page.eyebrow, "page.eyebrow", 80);
  validateString(errors, page.title, "page.title", 120, true);
  validateString(errors, page.subtitle, "page.subtitle", 500);
  validateString(errors, page.heroImage, "page.heroImage", 500);
  if (!isSafeImageReference(page.heroImage)) errors.push("page.heroImage must be a safe media reference.");
}

function validateCategories(errors: string[], categories: unknown): Set<string> {
  const ids = new Set<string>();
  if (!Array.isArray(categories)) {
    errors.push("categories must be an array.");
    return ids;
  }
  if (categories.length > 50) errors.push("categories cannot contain more than 50 items.");

  categories.forEach((item, index) => {
    const path = `categories[${index}]`;
    if (!isRecord(item)) {
      errors.push(`${path} must be an object.`);
      return;
    }
    validateString(errors, item.id, `${path}.id`, 80, true);
    validateString(errors, item.label, `${path}.label`, 120, true);
    if (typeof item.id === "string") {
      if (!SLUG_RE.test(item.id)) errors.push(`${path}.id must be a lowercase slug.`);
      if (ids.has(item.id)) errors.push(`${path}.id is duplicated.`);
      ids.add(item.id);
    }
    if (typeof item.icon !== "string" || !ICON_NAMES.has(item.icon)) errors.push(`${path}.icon is not allowed.`);
    if (typeof item.enabled !== "boolean") errors.push(`${path}.enabled must be a boolean.`);
    validateNumber(errors, item.order, `${path}.order`, 0);
  });

  return ids;
}

function validatePackages(errors: string[], packages: unknown, vendorPath: string) {
  if (!Array.isArray(packages)) {
    errors.push(`${vendorPath}.packages must be an array.`);
    return;
  }
  if (packages.length > 20) errors.push(`${vendorPath}.packages cannot contain more than 20 items.`);
  packages.forEach((item, index) => {
    const path = `${vendorPath}.packages[${index}]`;
    if (!isRecord(item)) {
      errors.push(`${path} must be an object.`);
      return;
    }
    validateString(errors, item.id, `${path}.id`, 80, true);
    validateString(errors, item.name, `${path}.name`, 120);
    validateString(errors, item.price, `${path}.price`, 80);
    validateString(errors, item.description, `${path}.description`, 400);
  });
}

function validateVendors(errors: string[], vendors: unknown, categoryIds: Set<string>): Set<string> {
  const ids = new Set<string>();
  if (!Array.isArray(vendors)) {
    errors.push("vendors must be an array.");
    return ids;
  }
  if (vendors.length > 200) errors.push("vendors cannot contain more than 200 items.");

  vendors.forEach((item, index) => {
    const path = `vendors[${index}]`;
    if (!isRecord(item)) {
      errors.push(`${path} must be an object.`);
      return;
    }
    validateString(errors, item.id, `${path}.id`, 100, true);
    validateString(errors, item.name, `${path}.name`, 160, true);
    validateString(errors, item.categoryId, `${path}.categoryId`, 80, true);
    validateString(errors, item.shortDescription, `${path}.shortDescription`, 300);
    validateString(errors, item.fullDescription, `${path}.fullDescription`, 1400);
    validateString(errors, item.city, `${path}.city`, 120);
    validateString(errors, item.currency, `${path}.currency`, 16);
    validateString(errors, item.displayPrice, `${path}.displayPrice`, 120);
    validateString(errors, item.mainImage, `${path}.mainImage`, 500);

    if (typeof item.id === "string") {
      if (ids.has(item.id)) errors.push(`${path}.id is duplicated.`);
      ids.add(item.id);
    }
    if (typeof item.categoryId === "string" && !categoryIds.has(item.categoryId)) errors.push(`${path}.categoryId must reference an existing category.`);
    if (item.priceFrom !== null) validateNumber(errors, item.priceFrom, `${path}.priceFrom`, 0);
    validateNumber(errors, item.rating, `${path}.rating`, 0, 5);
    validateNumber(errors, item.reviewCount, `${path}.reviewCount`, 0, undefined, true);
    validateNumber(errors, item.popularity, `${path}.popularity`, 0);
    validateNumber(errors, item.featuredOrder, `${path}.featuredOrder`, 0);
    if (!isSafeImageReference(item.mainImage)) errors.push(`${path}.mainImage must be a safe media reference.`);
    if (!isSafePhone(item.phone)) errors.push(`${path}.phone must be a safe phone format.`);
    for (const key of ["messageLink", "telegramLink", "whatsappLink", "instagramLink", "websiteLink"]) {
      if (!isSafeContactUrl(item[key])) errors.push(`${path}.${key} must use an allowed URL protocol.`);
    }
    if (!Array.isArray(item.galleryImages)) {
      errors.push(`${path}.galleryImages must be an array.`);
    } else {
      if (item.galleryImages.length > 20) errors.push(`${path}.galleryImages cannot contain more than 20 items.`);
      item.galleryImages.forEach((image, imageIndex) => {
        if (!isSafeImageReference(image)) errors.push(`${path}.galleryImages[${imageIndex}] must be a safe media reference.`);
      });
    }
    if (!Array.isArray(item.tags)) {
      errors.push(`${path}.tags must be an array.`);
    } else {
      item.tags.forEach((tag, tagIndex) => validateString(errors, tag, `${path}.tags[${tagIndex}]`, 60));
    }
    if (typeof item.status !== "string" || !STATUSES.has(item.status)) errors.push(`${path}.status is invalid.`);
    if (typeof item.enabled !== "boolean") errors.push(`${path}.enabled must be a boolean.`);
    if (typeof item.featured !== "boolean") errors.push(`${path}.featured must be a boolean.`);
    validateString(errors, item.updatedAt, `${path}.updatedAt`, 80);
    validatePackages(errors, item.packages, path);
  });

  return ids;
}

function validatePartnersContentPayload(value: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return ["Request body must be the partners content object."];
  if (value.version !== 1) errors.push("version must be 1.");
  validatePage(errors, value.page);
  const categoryIds = validateCategories(errors, value.categories);
  validateVendors(errors, value.vendors, categoryIds);
  validateString(errors, value.updatedAt, "updatedAt", 80);
  return errors.slice(0, 50);
}

function authenticatePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as { role?: string };
    if (decoded.role !== "admin") return res.status(403).json({ error: "Platform admin access required" });
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export const publicPartnersContentRouter = Router();
export const platformAdminPartnersContentRouter = Router();

async function readPartnersContent() {
  const [row] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, SETTINGS_KEY))
    .limit(1);
  return row?.value ?? null;
}

publicPartnersContentRouter.get("/", async (_req, res) => {
  try {
    const content = await readPartnersContent();
    if (!content) return res.status(404).json({ content: null });
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.json({ content });
  } catch (error) {
    console.error("partners-content public GET error:", error);
    return res.status(500).json({ error: "Failed to load partners content" });
  }
});

platformAdminPartnersContentRouter.use(authenticatePlatformAdmin);

platformAdminPartnersContentRouter.get("/", async (_req, res) => {
  try {
    const content = await readPartnersContent();
    if (!content) return res.status(404).json({ content: null });
    res.setHeader("Cache-Control", "no-store");
    return res.json({ content });
  } catch (error) {
    console.error("partners-content admin GET error:", error);
    return res.status(500).json({ error: "Failed to load partners content" });
  }
});

platformAdminPartnersContentRouter.put("/", async (req, res) => {
  try {
    const validationErrors = validatePartnersContentPayload(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: "Validation failed", details: validationErrors });
    }

    const content = {
      ...(req.body as Record<string, unknown>),
      updatedAt: new Date().toISOString(),
    };

    const [existing] = await db
      .select({ key: platformSettings.key })
      .from(platformSettings)
      .where(eq(platformSettings.key, SETTINGS_KEY))
      .limit(1);

    if (existing) {
      await db
        .update(platformSettings)
        .set({ value: content, updatedAt: new Date() })
        .where(eq(platformSettings.key, SETTINGS_KEY));
    } else {
      await db.insert(platformSettings).values({
        key: SETTINGS_KEY,
        value: content,
        description: "Public partners marketplace content managed via /admin/partners-builder",
      });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("partners-content admin PUT error:", error);
    return res.status(500).json({ error: "Failed to save partners content" });
  }
});
