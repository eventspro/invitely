import express from "express";
import { db } from "../db.js";
import { homepageLeads } from "../../shared/schema.js";
import { sendEmail } from "../email.js";
import { sendTelegramMessage } from "../telegram.js";

const router = express.Router();

const ADMIN_EMAIL = "harutavetisyan0@gmail.com";
const ADMIN_TELEGRAM_CHAT_ID = process.env.HARUT_TELEGRAM_CHAT_ID ?? "1037811604";

// POST /api/homepage-leads/submit
router.post("/submit", async (req, res) => {
  const { name, email, phone } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
  };

  if (!name?.trim() || !phone?.trim()) {
    return res.status(400).json({ error: "Name and phone are required." });
  }

  const safeName  = name.trim();
  const safePhone = phone.trim();
  const safeEmail = email?.trim() ?? "";

  // ── Save to DB ─────────────────────────────────────────────────────────────
  await db.insert(homepageLeads).values({
    name:   safeName,
    phone:  safePhone,
    email:  safeEmail || null,
    source: "hero",
  });

  // ── Email notification ─────────────────────────────────────────────────────
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#0e2119;padding:24px 28px">
        <h2 style="margin:0;color:#f0cf82;font-size:18px">4ever.am — Նոր դիմում (Applied User)</h2>
      </div>
      <div style="padding:24px 28px;font-size:14px;color:#374151;line-height:1.7">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#9ca3af;width:110px">Անուն</td><td style="padding:6px 0;font-weight:600;color:#111827">${safeName}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af">Հեռախոս</td><td style="padding:6px 0;font-weight:600;color:#111827">${safePhone}</td></tr>
          ${safeEmail ? `<tr><td style="padding:6px 0;color:#9ca3af">Email</td><td style="padding:6px 0;color:#111827">${safeEmail}</td></tr>` : ""}
          <tr><td style="padding:6px 0;color:#9ca3af">Աղբյուր</td><td style="padding:6px 0">Hero CTA</td></tr>
        </table>
      </div>
    </div>`;

  await sendEmail({
    to:         ADMIN_EMAIL,
    from:       "noreply@4ever.am",
    senderName: "4ever.am Leads",
    subject:    `Նոր դիմում — ${safeName}`,
    html,
  });

  // ── Telegram notification ──────────────────────────────────────────────────
  const tgLines = [
    "📩 <b>4ever.am — Նոր դիմում</b>",
    "",
    `👤 <b>Անուն:</b> ${safeName}`,
    `📞 <b>Հեռախոս:</b> ${safePhone}`,
    ...(safeEmail ? [`📧 <b>Email:</b> ${safeEmail}`] : []),
    `🔗 <b>Աղբյուր:</b> Hero CTA`,
  ];

  await sendTelegramMessage(ADMIN_TELEGRAM_CHAT_ID, tgLines.join("\n"));

  return res.json({ ok: true });
});

export default router;
