// Creates a platform-admin management user in the managementUsers table.
// This gives the platform admin (harut) a management-user JWT so that
// endpoints protected by authenticateUser + requireAdminPanelAccess work.
import "dotenv/config";
import { db } from "../server/db.js";
import { managementUsers, orders, userAdminPanels, templates } from "../shared/schema.js";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

const EMAIL = "harut";       // matches loginForm.username sent to /api/auth/template-login
const PASSWORD = "wedding25";

async function run() {
  console.log("🔐 Creating management user for platform admin...");

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // Upsert the management user
  const existing = await db
    .select({ id: managementUsers.id })
    .from(managementUsers)
    .where(eq(managementUsers.email, EMAIL))
    .limit(1);

  let userId: string;

  if (existing.length > 0) {
    userId = existing[0].id;
    // Update password in case it changed
    await db
      .update(managementUsers)
      .set({ passwordHash, status: "active", emailVerified: true, updatedAt: new Date() })
      .where(eq(managementUsers.id, userId));
    console.log(`✔  Management user already exists — password refreshed (id: ${userId})`);
  } else {
    const [user] = await db
      .insert(managementUsers)
      .values({
        email: EMAIL,
        passwordHash,
        firstName: "Harut",
        status: "active",
        emailVerified: true,
      })
      .returning({ id: managementUsers.id });
    userId = user.id;
    console.log(`✔  Management user created (id: ${userId})`);
  }

  // Grant super_admin access to every template that doesn't already have a record
  const allTemplates = await db.select({ id: templates.id, name: templates.name }).from(templates);
  console.log(`📋 Found ${allTemplates.length} template(s) — granting super_admin access...`);

  for (const tpl of allTemplates) {
    // Check for existing userAdminPanel record scoped to THIS template
    const existingPanel = await db
      .select({ id: userAdminPanels.id })
      .from(userAdminPanels)
      .where(
        and(
          eq(userAdminPanels.userId, userId),
          eq(userAdminPanels.templateId, tpl.id)
        )
      )
      .limit(1);

    if (existingPanel.length > 0) {
      // Ensure it's active and has super_admin role
      await db
        .update(userAdminPanels)
        .set({ isActive: true, role: "super_admin", updatedAt: new Date() })
        .where(eq(userAdminPanels.id, existingPanel[0].id));
      console.log(`  ↻  Template "${tpl.name}" — admin panel record updated`);
      continue;
    }

    // Need an order record first (requireAdminPanelAccess joins orders and checks templatePlan='ultimate')
    const orderNumber = `ADMIN-${Date.now()}-${tpl.id.slice(0, 8).toUpperCase()}`;
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId,
        templateId: tpl.id,
        templatePlan: "ultimate",
        amount: "0.00",
        currency: "AMD",
        status: "completed",
        paymentMethod: "admin",
        adminAccessGranted: true,
      })
      .returning({ id: orders.id });

    // Admin panel access — templateSlug must be globally unique; use full id
    const templateSlug = `admin-${tpl.id}`;

    await db.insert(userAdminPanels).values({
      userId,
      templateId: tpl.id,
      templateSlug,
      orderId: order.id,
      isActive: true,
      role: "super_admin",
    });

    console.log(`  ✔  Template "${tpl.name}" — order + admin panel created`);
  }

  console.log("\n🎉 Done!");
  console.log("  Email (login field): harut");
  console.log("  Password:            wedding25");
  console.log("  Role:                super_admin on all templates");
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
