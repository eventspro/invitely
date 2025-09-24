import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { templates } from "../shared/schema.js";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function fixForestLilyTemplate() {
  try {
    console.log("🔍 Checking for Forest & Lily Nature Wedding template...");
    
    // First, let's see all templates
    const allTemplates = await db.select().from(templates);
    console.log("All templates:", allTemplates.map(t => ({ name: t.name, slug: t.slug, isMain: t.isMain })));
    
    // Look for the forest-lily template
    const forestLilyTemplate = await db.select()
      .from(templates)
      .where(eq(templates.slug, "forest-lily-nature"));
    
    if (forestLilyTemplate.length === 0) {
      console.log("❌ Forest & Lily template not found in database");
      return;
    }
    
    const template = forestLilyTemplate[0];
    console.log("Found Forest & Lily template:", {
      name: template.name,
      slug: template.slug,
      isMain: template.isMain,
      maintenance: template.maintenance
    });
    
    // If it's not marked as main template, fix it
    if (!template.isMain) {
      console.log("🔧 Marking Forest & Lily template as main template...");
      await db.update(templates)
        .set({ isMain: true })
        .where(eq(templates.slug, "forest-lily-nature"));
      console.log("✅ Template updated to main template");
    } else {
      console.log("✅ Template is already marked as main");
    }
    
    // Check if it's in maintenance mode
    if (template.maintenance) {
      console.log("🔧 Taking template out of maintenance mode...");
      await db.update(templates)
        .set({ maintenance: false })
        .where(eq(templates.slug, "forest-lily-nature"));
      console.log("✅ Template taken out of maintenance mode");
    }
    
  } catch (error) {
    console.error("❌ Error fixing template:", error);
  }
}

fixForestLilyTemplate();