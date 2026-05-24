import express from "express";
import { sendEmail } from "../email.js";
import { sendTelegramMessage } from "../telegram.js";

const router = express.Router();

const ADMIN_EMAIL = "harutavetisyan0@gmail.com";
const ADMIN_TELEGRAM_CHAT_ID = process.env.HARUT_TELEGRAM_CHAT_ID ?? "1037811604";

const FEATURE_LABELS: Record<string, string> = {
  guests: "Guests limit (5 reached)",
  tables: "Tables limit (2 reached)",
  budget: "Budget items limit (5 reached)",
  seats:  "Seat assignment (premium feature)",
  more:   "Full access (from More tab)",
};

router.post("/contact", async (req, res) => {
  const { name, phone, message, callbackRequested, feature } = req.body as {
    name?: string;
    phone?: string;
    message?: string;
    callbackRequested?: boolean;
    feature?: string;
  };

  if (!name?.trim() || !phone?.trim()) {
    return res.status(400).json({ error: "Name and phone are required." });
  }

  const featureLabel = FEATURE_LABELS[feature ?? ""] ?? "General inquiry";
  const safeName     = name.trim();
  const safePhone    = phone.trim();
  const safeMessage  = message?.trim() ?? "";

  // ── Email ─────────────────────────────────────────────────────────────────
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#0e2119;padding:24px 28px">
        <h2 style="margin:0;color:#f0cf82;font-size:18px">Planner Demo — Contact Request</h2>
      </div>
      <div style="padding:24px 28px;font-size:14px;color:#374151;line-height:1.7">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#9ca3af;width:110px">Name</td><td style="padding:6px 0;font-weight:600;color:#111827">${safeName}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af">Phone</td><td style="padding:6px 0;font-weight:600;color:#111827">${safePhone}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af">Triggered by</td><td style="padding:6px 0">${featureLabel}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af">Callback</td><td style="padding:6px 0">${callbackRequested ? "✅ Yes — please call back" : "No"}</td></tr>
          ${safeMessage ? `<tr><td style="padding:6px 0;color:#9ca3af;vertical-align:top">Message</td><td style="padding:6px 0">${safeMessage}</td></tr>` : ""}
        </table>
      </div>
    </div>`;

  await sendEmail({
    to: ADMIN_EMAIL,
    from: "noreply@4ever.am",
    senderName: "4ever.am Planner Demo",
    subject: `Planner Demo Request — ${safeName}`,
    html,
  });

  // ── Telegram ──────────────────────────────────────────────────────────────
  const tgLines = [
    "📋 <b>Planner Demo — Contact Request</b>",
    "",
    `👤 <b>Name:</b> ${safeName}`,
    `📞 <b>Phone:</b> ${safePhone}`,
    `🔒 <b>Triggered by:</b> ${featureLabel}`,
    `📲 <b>Callback:</b> ${callbackRequested ? "✅ Yes" : "No"}`,
    ...(safeMessage ? [`💬 <b>Message:</b> ${safeMessage}`] : []),
  ];

  await sendTelegramMessage(ADMIN_TELEGRAM_CHAT_ID, tgLines.join("\n"));

  return res.json({ ok: true });
});

export default router;
