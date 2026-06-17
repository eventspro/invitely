/**
 * sale-wheel.ts
 * Spin & Win promotional wheel routes.
 *
 * Public route:
 *   POST /api/sale-wheel/register-or-spin
 *
 * Platform-admin routes (require Bearer JWT):
 *   GET  /api/platform-admin/sale-wheel/spins
 *   PATCH /api/platform-admin/sale-wheel/spins/:id/claimed
 */
import express from "express";
import { db } from "../db.js";
import { platformSettings, saleWheelSpins, insertSaleWheelSpinSchema } from "../../shared/schema.js";
import { eq, or, desc, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { sendTelegramMessage } from "../telegram.js";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Prize {
  key: string;
  label: string;
  weight: number; // out of 1000
}

// ─── Prize table (weights sum to 1000 for easy integer arithmetic) ────────────
const PRIZES: Prize[] = [
  { key: "discount_10",       label: "10% զեղչ",                              weight: 810 },
  { key: "discount_20",       label: "20% զեղչ",                              weight: 70  },
  { key: "admin_panel_free",  label: "Admin Panel անվճար",                    weight: 30  },
  { key: "music_free",        label: "Երաժշտություն անվճար",                  weight: 20  },
  { key: "gallery_free",      label: "Լուսանկարների բաժին",                   weight: 15  },
  { key: "all_features",      label: "Բոլոր հնարավ. ներառված",               weight: 10  },
  { key: "free_template",     label: "Անվճար ձևանմուշ",                       weight: 5   },
  { key: "qr_cards",          label: "QR կոդերի քարտեր",                      weight: 40  },
];
const PRIZE_WEIGHT_TOTAL = PRIZES.reduce((sum, p) => sum + p.weight, 0); // 1000

/** Server-side weighted random prize selection — frontend never decides the prize. */
function selectPrize(): Prize {
  const r = Math.floor(Math.random() * PRIZE_WEIGHT_TOTAL);
  let cumulative = 0;
  for (const prize of PRIZES) {
    cumulative += prize.weight;
    if (r < cumulative) return prize;
  }
  return PRIZES[0]; // fallback (unreachable)
}

/** Normalise a phone number: strip spaces, dashes, parentheses. Keep + prefix. */
function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, "").toLowerCase();
}

/**
 * Validate a normalised phone number.
 * Accepts:
 *   - International format: +<countryCode><digits> e.g. +37491234567
 *   - Local Armenian format: 0XXXXXXXX (10 digits starting with 0)
 *   - Pure digits 8-15 chars (no country code prefix)
 * Rejects anything that doesn't look like a real phone number.
 */
function isValidPhone(normalized: string): boolean {
  // After normalisation only +, digits and lowercase remain
  // International: +[1-3 digit country code][6-12 digits] = 8-15 chars after +
  if (/^\+[1-9]\d{6,14}$/.test(normalized)) return true;
  // Local (no +): 7-15 digits
  if (/^\d{7,15}$/.test(normalized)) return true;
  return false;
}

/** Normalise an email: trim + lowercase. */
function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

type SaleWheelSpinRecord = typeof saleWheelSpins.$inferSelect;
type WheelTelegramPrivacy = "minimal" | "masked";

interface WheelTelegramSettings {
  enabled: boolean;
  chatId: string;
  privacy: WheelTelegramPrivacy;
}

const WHEEL_TELEGRAM_SETTINGS_KEY = "sale_wheel_telegram_notifications";
const DEFAULT_WHEEL_TELEGRAM_SETTINGS: WheelTelegramSettings = {
  enabled: false,
  chatId: "",
  privacy: "masked",
};

const updateWheelTelegramSettingsSchema = z.object({
  enabled: z.boolean(),
  privacy: z.enum(["minimal", "masked"]),
  chatId: z.string().trim().max(40).optional(),
  clearChatId: z.boolean().optional(),
});

const TELEGRAM_CHAT_ID_PATTERN = /^-?\d{5,30}$/;

function readWheelTelegramSettings(value: unknown): WheelTelegramSettings {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const privacy = raw.privacy === "minimal" || raw.privacy === "masked" ? raw.privacy : "masked";
  const chatId = typeof raw.chatId === "string" ? raw.chatId.trim() : "";
  return {
    enabled: raw.enabled === true,
    chatId,
    privacy,
  };
}

async function getWheelTelegramSettings(): Promise<WheelTelegramSettings> {
  const [row] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, WHEEL_TELEGRAM_SETTINGS_KEY))
    .limit(1);

  if (!row) return DEFAULT_WHEEL_TELEGRAM_SETTINGS;
  return readWheelTelegramSettings(row.value);
}

async function saveWheelTelegramSettings(settings: WheelTelegramSettings): Promise<void> {
  const value = {
    enabled: settings.enabled,
    chatId: settings.chatId,
    privacy: settings.privacy,
  };

  const [existing] = await db
    .select({ key: platformSettings.key })
    .from(platformSettings)
    .where(eq(platformSettings.key, WHEEL_TELEGRAM_SETTINGS_KEY))
    .limit(1);

  if (existing) {
    await db
      .update(platformSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(platformSettings.key, WHEEL_TELEGRAM_SETTINGS_KEY));
    return;
  }

  await db.insert(platformSettings).values({
    key: WHEEL_TELEGRAM_SETTINGS_KEY,
    value,
    description: "Platform-admin Telegram notifications for new sale wheel spins",
  });
}

function maskTelegramChatId(chatId: string): string | null {
  if (!chatId) return null;
  const prefix = chatId.startsWith("-") ? "-" : "";
  const digits = chatId.replace(/^-/, "");
  if (digits.length <= 4) return `${prefix}****`;
  const start = digits.slice(0, Math.min(3, digits.length - 2));
  const end = digits.slice(-4);
  return `${prefix}${start}****${end}`;
}

function escapeTelegramHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function maskPhone(phone: string | null): string {
  if (!phone) return "Not provided";
  const cleaned = phone.trim();
  const digits = cleaned.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  if (!last4) return "Hidden";
  const last = last4.length === 4 ? `${last4.slice(0, 2)} ${last4.slice(2)}` : last4;
  if (cleaned.startsWith("+374")) return `+374 ** ** ${last}`;
  if (cleaned.startsWith("0")) return `0** ** ${last}`;
  return `** ** ${last}`;
}

function firstNameOnly(name: string | null): string {
  const first = (name ?? "").trim().split(/\s+/).filter(Boolean)[0];
  return first || "Hidden";
}

function formatWheelSpinTime(value: Date | string | null): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  try {
    return date.toLocaleString("en-GB", {
      timeZone: "Asia/Yerevan",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date.toISOString();
  }
}

function getPlatformAdminWheelUrl(req: any): string {
  const configuredBase =
    process.env.FRONTEND_URL ||
    process.env.PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    "";
  const origin = configuredBase
    ? configuredBase.replace(/\/+$/, "")
    : `${req.protocol}://${req.get("host")}`;
  return `${origin}/platform-admin`;
}

function formatWheelSpinTelegramMessage(
  spin: SaleWheelSpinRecord,
  privacy: WheelTelegramPrivacy,
  adminUrl: string,
): string {
  const lines = [
    "<b>New wheel spin</b>",
    "",
    `Prize: ${escapeTelegramHtml(spin.prizeLabel)}`,
  ];

  if (privacy === "masked") {
    lines.push(`Name: ${escapeTelegramHtml(firstNameOnly(spin.name))}`);
    lines.push(`Phone: ${escapeTelegramHtml(maskPhone(spin.phone))}`);
  }

  lines.push(`Time: ${escapeTelegramHtml(formatWheelSpinTime(spin.createdAt))}`);
  lines.push("");
  lines.push(`Open admin: ${escapeTelegramHtml(adminUrl)}`);
  return lines.join("\n");
}

async function notifyAdminsAboutWheelSpin(
  spin: SaleWheelSpinRecord,
  adminUrl: string,
): Promise<void> {
  try {
    const settings = await getWheelTelegramSettings();
    if (!settings.enabled || !settings.chatId) return;

    const message = formatWheelSpinTelegramMessage(spin, settings.privacy, adminUrl);
    const sent = await sendTelegramMessage(settings.chatId, message, "HTML");
    if (!sent) {
      console.error("[SaleWheel] Telegram notification was not sent");
    }
  } catch {
    console.error("[SaleWheel] Telegram notification failed");
  }
}

// ─── Owner test-mode secret ─────────────────────────────────────────────────
// Set SALE_WHEEL_TEST_KEY in Vercel env vars to your chosen secret.
// Navigate to 4ever.am/?swtest=<your-secret> to activate test mode.
// Test spins bypass all duplicate checks and are NOT saved to the database.
const TEST_KEY = process.env.SALE_WHEEL_TEST_KEY || "harut4ever-sw-test-2026";

// ─── Spin rate limiter — 2 attempts per IP per 15 minutes ───────────────────
const spinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2,
  // Skip rate-limit entirely for owner test mode
  skip: (req: any) => req.body?.testKey === TEST_KEY,
  message: { error: "Չափազանց շատ փորձ: Խնդրում ենք փորձել 15 րոպե անց:" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Platform-admin auth middleware ──────────────────────────────────────────
function authenticatePlatformAdmin(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ─── Public router ────────────────────────────────────────────────────────────
export const saleWheelPublicRouter = express.Router();

// POST /api/sale-wheel/register-or-spin
saleWheelPublicRouter.post(
  "/register-or-spin",
  spinLimiter,
  async (req: any, res: any) => {
    try {
      // 1. Validate input
      const bodySchema = z.object({
        name: z.string().min(2, "Անուն պարտադիր է").max(100).transform((v) => v.trim()),
        phone: z.string().min(8, "Հեռախոսահամார պարտադիր է").max(30),
        email: z
          .string()
          .max(200)
          .optional()
          .transform((v) => (v ? v.trim() : v)),
        weddingDate: z
          .string()
          .max(50)
          .optional()
          .transform((v) => (v ? v.trim() : v)),
      });

      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Մուտքագրված տվյալները սխալ են", details: parsed.error.flatten() });
      }

      const { name, weddingDate } = parsed.data;
      const phone = normalizePhone(parsed.data.phone);

      // ── Owner test mode: bypass all checks, do not persist ───────────────
      const isTestMode = req.body?.testKey === TEST_KEY;
      if (isTestMode) {
        const prize = selectPrize();
        return res.json({
          alreadyParticipated: false,
          prizeKey: prize.key,
          prizeLabel: prize.label,
          testMode: true,
        });
      }
      // ─────────────────────────────────────────────────────────────────────

      // Validate phone format after normalisation
      if (!isValidPhone(phone)) {
        return res.status(400).json({ error: "Անվավեր հեռախոսահամար: Օրինակ՝ +37491234567" });
      }
      const email =
        parsed.data.email && parsed.data.email.length > 0
          ? normalizeEmail(parsed.data.email)
          : null;

      // Validate email format if provided
      if (email) {
        const emailCheck = z.string().email().safeParse(email);
        if (!emailCheck.success) {
          return res.status(400).json({ error: "Անվավեր էլ. հասցե" });
        }
      }

      // 2. Capture IP early so we can use it in duplicate checks
      const ipAddress =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.ip ||
        null;
      const normalizedIp = ipAddress?.slice(0, 100) ?? null;

      // 3. Duplicate check — IP (one spin per IP)
      if (normalizedIp) {
        const [existingByIp] = await db
          .select()
          .from(saleWheelSpins)
          .where(eq(saleWheelSpins.ipAddress, normalizedIp))
          .limit(1);

        if (existingByIp) {
          return res.json({
            alreadyParticipated: true,
            prizeKey: existingByIp.prizeKey,
            prizeLabel: existingByIp.prizeLabel,
            message: "Դուք արդեն մասնակցել եք խաղարկությանը:",
          });
        }
      }

      // 4. Duplicate check — phone
      const [existingByPhone] = await db
        .select()
        .from(saleWheelSpins)
        .where(eq(saleWheelSpins.phone, phone))
        .limit(1);

      if (existingByPhone) {
        return res.json({
          alreadyParticipated: true,
          prizeKey: existingByPhone.prizeKey,
          prizeLabel: existingByPhone.prizeLabel,
          message: "Դուք արդեն մասնակցել եք խաղարկությանը:",
        });
      }

      // 5. Duplicate check — email (if provided)
      if (email) {
        const [existingByEmail] = await db
          .select()
          .from(saleWheelSpins)
          .where(eq(saleWheelSpins.email, email))
          .limit(1);

        if (existingByEmail) {
          return res.json({
            alreadyParticipated: true,
            prizeKey: existingByEmail.prizeKey,
            prizeLabel: existingByEmail.prizeLabel,
            message: "Դուք արդեն մասնակցել եք խաղարկությանը:",
          });
        }
      }

      // 6. Server-side prize selection
      const prize = selectPrize();

      // (IP already captured above)
      const userAgent = (req.headers["user-agent"] as string) || null;

      // 7. Save lead + result
      const [saved] = await db
        .insert(saleWheelSpins)
        .values({
          name,
          phone,
          email: email ?? undefined,
          weddingDate: weddingDate ?? undefined,
          prizeKey: prize.key,
          prizeLabel: prize.label,
          ipAddress: normalizedIp ?? undefined,
          userAgent: userAgent?.slice(0, 300) ?? undefined,
        })
        .returning();

      const adminUrl = getPlatformAdminWheelUrl(req);
      void notifyAdminsAboutWheelSpin(saved, adminUrl);

      return res.status(201).json({
        alreadyParticipated: false,
        prizeKey: saved.prizeKey,
        prizeLabel: saved.prizeLabel,
        spinId: saved.id,
      });
    } catch (err) {
      console.error("[SaleWheel] register-or-spin error:", err);
      return res.status(500).json({ error: "Սերվերի սխալ: Խնդրում ենք կրկին փորձել:" });
    }
  }
);

// ─── Platform-admin router ────────────────────────────────────────────────────
export const saleWheelAdminRouter = express.Router();
saleWheelAdminRouter.use(authenticatePlatformAdmin);

// GET /api/platform-admin/sale-wheel/notification-settings
saleWheelAdminRouter.get("/notification-settings", async (_req: any, res: any) => {
  try {
    const settings = await getWheelTelegramSettings();
    return res.json({
      enabled: settings.enabled,
      privacy: settings.privacy,
      hasChatId: !!settings.chatId,
      chatIdMasked: maskTelegramChatId(settings.chatId),
    });
  } catch {
    console.error("[SaleWheel] notification settings load failed");
    return res.status(500).json({ error: "Failed to load notification settings" });
  }
});

// PUT /api/platform-admin/sale-wheel/notification-settings
saleWheelAdminRouter.put("/notification-settings", async (req: any, res: any) => {
  try {
    const parsed = updateWheelTelegramSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }

    const current = await getWheelTelegramSettings();
    const nextChatId = parsed.data.clearChatId
      ? ""
      : parsed.data.chatId
      ? parsed.data.chatId.trim()
      : current.chatId;

    if (nextChatId && !TELEGRAM_CHAT_ID_PATTERN.test(nextChatId)) {
      return res.status(400).json({ error: "Telegram chat ID format is invalid" });
    }

    if (parsed.data.enabled && !nextChatId) {
      return res.status(400).json({ error: "Set a Telegram chat ID before enabling notifications" });
    }

    const settings: WheelTelegramSettings = {
      enabled: parsed.data.enabled,
      privacy: parsed.data.privacy,
      chatId: nextChatId,
    };

    await saveWheelTelegramSettings(settings);

    return res.json({
      success: true,
      enabled: settings.enabled,
      privacy: settings.privacy,
      hasChatId: !!settings.chatId,
      chatIdMasked: maskTelegramChatId(settings.chatId),
    });
  } catch {
    console.error("[SaleWheel] notification settings save failed");
    return res.status(500).json({ error: "Failed to save notification settings" });
  }
});

// POST /api/platform-admin/sale-wheel/notification-settings/test
saleWheelAdminRouter.post("/notification-settings/test", async (_req: any, res: any) => {
  try {
    const settings = await getWheelTelegramSettings();
    if (!settings.chatId) {
      return res.status(400).json({ error: "Set a Telegram chat ID before sending a test" });
    }

    const sent = await sendTelegramMessage(
      settings.chatId,
      [
        "<b>Wheel spin Telegram notifications</b>",
        "",
        "Test notification from platform admin.",
        `Time: ${escapeTelegramHtml(formatWheelSpinTime(new Date()))}`,
      ].join("\n"),
      "HTML",
    );

    if (!sent) {
      console.error("[SaleWheel] Telegram test notification was not sent");
      return res.status(502).json({ error: "Failed to send test notification" });
    }

    return res.json({ success: true });
  } catch {
    console.error("[SaleWheel] Telegram test notification failed");
    return res.status(500).json({ error: "Failed to send test notification" });
  }
});

// GET /api/platform-admin/sale-wheel/spins
saleWheelAdminRouter.get("/spins", async (req: any, res: any) => {
  try {
    const { search, claimed } = req.query as Record<string, string>;

    let query = db.select().from(saleWheelSpins).$dynamic();

    // Filter by claimed status if specified
    if (claimed === "true") {
      query = query.where(eq(saleWheelSpins.claimed, true));
    } else if (claimed === "false") {
      query = query.where(eq(saleWheelSpins.claimed, false));
    }

    // Search by name/phone/email
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.where(
        or(
          ilike(saleWheelSpins.name, term),
          ilike(saleWheelSpins.phone, term),
          ilike(saleWheelSpins.email ?? sql`''`, term)
        )
      );
    }

    const spins = await query.orderBy(desc(saleWheelSpins.createdAt));

    // Prize distribution summary
    const distribution: Record<string, number> = {};
    for (const s of spins) {
      distribution[s.prizeKey] = (distribution[s.prizeKey] ?? 0) + 1;
    }

    const claimedCount = spins.filter((s) => s.claimed).length;

    return res.json({
      total: spins.length,
      claimed: claimedCount,
      unclaimed: spins.length - claimedCount,
      distribution,
      spins,
    });
  } catch (err) {
    console.error("[SaleWheel] GET spins error:", err);
    return res.status(500).json({ error: "Failed to fetch spins" });
  }
});

// PATCH /api/platform-admin/sale-wheel/spins/:id/claimed
saleWheelAdminRouter.patch("/spins/:id/claimed", async (req: any, res: any) => {
  try {
    const { claimed } = req.body;
    if (typeof claimed !== "boolean") {
      return res.status(400).json({ error: "claimed must be a boolean" });
    }

    const [updated] = await db
      .update(saleWheelSpins)
      .set({ claimed, updatedAt: new Date() })
      .where(eq(saleWheelSpins.id, req.params.id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Spin not found" });
    }

    return res.json(updated);
  } catch (err) {
    console.error("[SaleWheel] PATCH claimed error:", err);
    return res.status(500).json({ error: "Failed to update claim status" });
  }
});
