import express from "express";
import { db, pool } from "../db.js";
import { homepageLeads, insertHomepageLeadSchema } from "../../shared/schema.js";
import { sendEmail } from "../email.js";
import { sendTelegramMessage } from "../telegram.js";

const router = express.Router();

const ADMIN_EMAIL = "harutavetisyan0@gmail.com";
const ADMIN_TELEGRAM_CHAT_ID = process.env.HARUT_TELEGRAM_CHAT_ID ?? "1037811604";

/** Escape characters that are special in HTML — prevents XSS in email bodies. */
function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape characters that are special in Telegram HTML parse mode. */
function escTg(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// POST /api/homepage-leads/submit
router.post("/submit", async (req, res) => {
  // ── Validate with Zod schema ───────────────────────────────────────────────
  const parsed = insertHomepageLeadSchema.safeParse({
    name:   req.body.name,
    phone:  req.body.phone,
    email:  req.body.email || undefined,
    source: "hero",
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
    return res.status(400).json({ error: firstError });
  }

  const { name, phone, email } = parsed.data;
  const safeName  = name.trim();
  const safePhone = phone.trim();
  const safeEmail = (email ?? "").trim();

  // ── Save to DB ─────────────────────────────────────────────────────────────
  // Ensure table exists (guards against cold-start migration timeout)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS homepage_leads (
        id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT NOT NULL,
        email       TEXT,
        phone       TEXT NOT NULL,
        source      TEXT DEFAULT 'hero',
        created_at  TIMESTAMP DEFAULT now()
      )
    `);
    await db.insert(homepageLeads).values({
      name:   safeName,
      phone:  safePhone,
      email:  safeEmail || null,
      source: "hero",
    });
  } catch (dbErr) {
    console.error('[homepage-leads] DB save failed (non-fatal, notifications will still fire):', dbErr);
  }

  // ── Respond immediately so the client is never left hanging ──────────────
  res.json({ ok: true });

  // ── Fire notifications asynchronously (fire-and-forget) ───────────────────
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#0e2119;padding:24px 28px">
        <h2 style="margin:0;color:#f0cf82;font-size:18px">4ever.am — Նոր դիմում (Applied User)</h2>
      </div>
      <div style="padding:24px 28px;font-size:14px;color:#374151;line-height:1.7">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#9ca3af;width:110px">Անուն</td><td style="padding:6px 0;font-weight:600;color:#111827">${escHtml(safeName)}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af">Հեռախոս</td><td style="padding:6px 0;font-weight:600;color:#111827">${escHtml(safePhone)}</td></tr>
          ${safeEmail ? `<tr><td style="padding:6px 0;color:#9ca3af">Email</td><td style="padding:6px 0;color:#111827">${escHtml(safeEmail)}</td></tr>` : ""}
          <tr><td style="padding:6px 0;color:#9ca3af">Աղբյուր</td><td style="padding:6px 0">Hero CTA</td></tr>
        </table>
      </div>
    </div>`;

  const tgLines = [
    "📩 <b>4ever.am — Նոր դիմում</b>",
    "",
    `👤 <b>Անուն:</b> ${escTg(safeName)}`,
    `📞 <b>Հեռախոս:</b> ${escTg(safePhone)}`,
    ...(safeEmail ? [`📧 <b>Email:</b> ${escTg(safeEmail)}`] : []),
    `🔗 <b>Աղբյուր:</b> Hero CTA`,
  ];

  sendEmail({
    to:         ADMIN_EMAIL,
    from:       "noreply@4ever.am",
    senderName: "4ever.am Leads",
    subject:    `Նոր դիմում — ${safeName}`,
    html,
  }).catch(err => console.error('[homepage-leads] email failed:', err));

  sendTelegramMessage(ADMIN_TELEGRAM_CHAT_ID, tgLines.join("\n"))
    .catch(err => console.error('[homepage-leads] telegram failed:', err));
});

export default router;
