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
import { saleWheelSpins, insertSaleWheelSpinSchema } from "../../shared/schema.js";
import { eq, or, desc, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Prize {
  key: string;
  label: string;
  weight: number; // out of 1000
}

// ─── Prize table (weights sum to 1000 for easy integer arithmetic) ────────────
const PRIZES: Prize[] = [
  { key: "discount_10",       label: "10% զեղչ",                weight: 850 },
  { key: "discount_20",       label: "20% զեղչ",                weight: 70  },
  { key: "admin_panel_free",  label: "Admin Panel անվճար",       weight: 30  },
  { key: "music_free",        label: "Երաժշտություն անվճար",     weight: 20  },
  { key: "gallery_free",      label: "Ֆոտոպատկերասրահ անվճար",  weight: 15  },
  { key: "all_features",      label: "Բոլոր հնարավ. ներառված",  weight: 10  },
  { key: "free_template",     label: "Անվճար կաղապար",           weight: 5   },
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
