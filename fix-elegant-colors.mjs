// Quick script to fix elegant template theme colors

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { templates } from './shared/schema.js';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function updateElegantTheme() {
  try {
    // Get current config
    const template = await db
      .select()
      .from(templates)
      .where(eq(templates.slug, 'alexander-isabella-elegant'))
      .limit(1);
    
    if (!template[0]) {
      console.log("Template not found");
      return;
    }

    const currentConfig = template[0].config;
    
    // Update theme colors
    const updatedConfig = {
      ...currentConfig,
      theme: {
        ...currentConfig.theme,
        colors: {
          primary: "#1e3a8a",     // Deep navy blue
          secondary: "#475569",   // Slate gray  
          accent: "#94a3b8",      // Silver gray
          background: "#f1f5f9",  // Very light slate
        }
      }
    };

    // Update the database
    await db
      .update(templates)
      .set({ config: updatedConfig })
      .where(eq(templates.slug, 'alexander-isabella-elegant'));

    console.log("✅ Elegant template colors updated successfully!");
    console.log("New primary color:", updatedConfig.theme.colors.primary);
  } catch (error) {
    console.error("❌ Error updating elegant template:", error);
  }
}

updateElegantTheme();