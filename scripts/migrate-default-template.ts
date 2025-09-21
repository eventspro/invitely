// Data migration script to populate default template
// Run this after the database migration to populate the default template with existing config

import "dotenv/config";
import { db } from "../server/db";
import { templates } from "../shared/schema";
import { eq } from "drizzle-orm";

// Import the existing wedding config
import { weddingConfig } from "../client/src/config/wedding-config";

export async function migrateDefaultTemplate() {
  try {
    console.log("🔄 Starting default template migration...");
    
    // Check if default template already exists
    const existingTemplate = await db
      .select()
      .from(templates)
      .where(eq(templates.id, 'default-harut-tatev'))
      .limit(1);
    
    if (existingTemplate.length > 0) {
      console.log("✅ Default template already exists, updating config...");
      
      // Update existing template with current config
      await db
        .update(templates)
        .set({
          config: {
            ...weddingConfig,
            sections: {
              hero: { enabled: true },
              countdown: { enabled: true },
              calendar: { enabled: true },
              locations: { enabled: true },
              timeline: { enabled: true },
              rsvp: { enabled: true },
              photos: { enabled: true },
            },
            theme: {
              colors: {
                primary: "var(--soft-gold)",
                secondary: "var(--sage-green)", 
                accent: "var(--charcoal)",
                background: "var(--cream)",
              },
              fonts: {
                heading: "Playfair Display, serif",
                body: "Inter, sans-serif",
              },
            },
          },
          updatedAt: new Date()
        })
        .where(eq(templates.id, 'default-harut-tatev'));
        
      console.log("✅ Default template config updated successfully");
    } else {
      console.log("❌ Default template not found. Please run the database migration first.");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("❌ Default template migration failed:", error);
    throw error;
  }
}

// Run migration if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  migrateDefaultTemplate()
    .then(() => {
      console.log("🎉 Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}
