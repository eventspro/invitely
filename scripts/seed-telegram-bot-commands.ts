// Seed script for default Armenian Telegram bot commands
// Run with: tsx scripts/seed-telegram-bot-commands.ts
// Safe to re-run — uses onConflictDoNothing()

import "dotenv/config";
import { db } from "../server/db";
import { telegramBotCommands, platformSettings } from "../shared/schema";
import { eq } from "drizzle-orm";

const defaultCommands = [
  {
    command: "/start",
    title: "Ողջույն",
    responseText:
      "🎊 Ողջույն! Բարի գալուստ 4ever.am Հարսանյաց հարթակ!\n\n" +
      "Մենք ստեղծում ենք հայկական հարսանիքների անմոռանալի կայքեր 💍\n\n" +
      "Հասանելի հրամաններ տեսնելու համար ուղարկեք /help:",
    orderIndex: 0,
  },
  {
    command: "/help",
    title: "Հրամանների ցուցակ",
    responseText:
      "📋 Հասանելի հրամաններ:\n\n" +
      "/start — Ողջույնի հաղորդագրություն\n" +
      "/about — Հարթակի մասին\n" +
      "/features — Հնարավորություններ\n" +
      "/templates — Հասանելի ձևանմուշներ\n" +
      "/pricing — Գնային ծրագրեր\n" +
      "/contact — Կապ մեզ հետ\n" +
      "/connect — Ձեր կայքը Telegram-ին կցել",
    orderIndex: 1,
  },
  {
    command: "/about",
    title: "Հարթակի մասին",
    responseText:
      "💡 *4ever.am* — Հայկական հարսանյաց կայքերի հարթակ\n\n" +
      "Մենք օգնում ենք հայ զույգերին ստեղծել գեղեցիկ, անհատական հարսանյաց կայքեր:\n\n" +
      "✅ Հյուրերի հրավեր և RSVP հավաքում\n" +
      "✅ Լուսանկարների սրահ\n" +
      "✅ Հարսանեկան ծրագիր\n" +
      "✅ Telegram ծանուցումներ\n" +
      "✅ Բազմալեզու աջակցություն",
    orderIndex: 2,
  },
  {
    command: "/features",
    title: "Հնարավորություններ",
    responseText:
      "🚀 Հարթակի հնարավորություններ:\n\n" +
      "🌐 Անհատական կայք ձեր հարսանյաց կծանուցումների համար\n" +
      "💌 RSVP ձևաթղթեր հյուրերի համար\n" +
      "📸 Լուսանկարների վերբեռնում հյուրերի կողմից\n" +
      "🎵 Ֆոնային երաժշտություն\n" +
      "📊 Ադմինիստրատորի վահանակ\n" +
      "🤖 Telegram Bot ծանուցումներ\n" +
      "🌍 Հայերեն, ռուսերեն, անգլերեն",
    orderIndex: 3,
  },
  {
    command: "/templates",
    title: "Ձևանմուշներ",
    responseText:
      "🎨 Հասանելի ձևանմուշներ:\n\n" +
      "🏛 *Classic* — Կլասիկ ոճ\n" +
      "✨ *Elegant* — Էլեգանտ, կապույտ ոսկե\n" +
      "🌹 *Romantic* — Ռոմանտիկ, վարդագույն\n" +
      "🌿 *Nature* — Բնության, կանաչ\n" +
      "⭐ *Pro* — Պրոֆեսիոնալ, բոլոր հնարավորությունները\n\n" +
      "Ձևանմուշները կարող եք դիտել՝ /pricing հրամանով:",
    orderIndex: 4,
  },
  {
    command: "/pricing",
    title: "Գնային ծրագրեր",
    responseText:
      "💰 Գնային ծրագրեր:\n\n" +
      "📦 Basic (Classic) — 7,000 AMD\n" +
      "📦 Standard (Elegant) — 17,000 AMD\n" +
      "📦 Premium (Romantic) — 23,000 AMD\n" +
      "📦 Advanced (Pro) — 31,000 AMD\n" +
      "📦 Deluxe (Nature) — 37,000 AMD\n\n" +
      "Ավելի մանրամասն տեղեկություններ՝ մեր կայքում:",
    orderIndex: 5,
  },
  {
    command: "/contact",
    title: "Կապ",
    responseText:
      "📬 Կապ մեզ հետ:\n\n" +
      "📧 Էլ. փոստ: info@4ever.am\n" +
      "🌐 Կայք: 4ever.am\n\n" +
      "Մենք ուրախ կլինենք պատասխանել ձեր բոլոր հարցերին!",
    orderIndex: 6,
  },
  {
    command: "/connect",
    title: "Telegram կցում",
    responseText:
      "🔗 Ձեր հարսանյաց կայքը Telegram-ին կցելու համար:\n\n" +
      "1. Մուտք գործեք ձեր ադմինի վահանակ\n" +
      "2. Գտեք «Telegram ծանուցումներ» բաժինը\n" +
      "3. Կտտացրեք «Ստեղծել CONNECT կոդ»\n" +
      "4. Ուղարկեք ստացված կոդը այս բոտին CONNECT {ՁԵՐ_ԿՈԴԸ} ձևաչափով\n\n" +
      "Հաջողությամբ կցելուց հետո RSVP ծանուցումները կստանաք Telegram-ում:",
    orderIndex: 7,
  },
];

const defaultFallbackMessage =
  "Ողջույն! Ես չճանաչեցի ձեր հարցումը։\n\nՕգտագործեք /help հրամանը հասանելի հրամանների ցուցակը տեսնելու համար։";

async function seed() {
  console.log("🌱 Seeding default Telegram bot commands...");

  let inserted = 0;
  let skipped = 0;

  for (const cmd of defaultCommands) {
    const result = await db
      .insert(telegramBotCommands)
      .values({
        command: cmd.command,
        title: cmd.title,
        responseText: cmd.responseText,
        enabled: true,
        orderIndex: cmd.orderIndex,
      })
      .onConflictDoNothing({ target: telegramBotCommands.command });

    // onConflictDoNothing returns empty array if skipped
    const rows = result as unknown as any[];
    if (Array.isArray(rows) && rows.length === 0) {
      skipped++;
      console.log(`  ⏭  Skipped (already exists): ${cmd.command}`);
    } else {
      inserted++;
      console.log(`  ✅ Inserted: ${cmd.command}`);
    }
  }

  // Seed fallback message in platformSettings if not already set
  const existing = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, "telegram_bot_fallback"))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(platformSettings).values({
      key: "telegram_bot_fallback",
      value: defaultFallbackMessage,
    });
    console.log("  ✅ Inserted fallback message in platformSettings");
  } else {
    console.log("  ⏭  Skipped fallback (already exists)");
  }

  console.log(`\n✅ Done! Inserted: ${inserted}, Skipped: ${skipped}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
