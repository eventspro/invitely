// Simple database test and template population
import "dotenv/config";
import { db } from "../server/db.js";
import { templates } from "../shared/schema.js";
import { eq } from "drizzle-orm";

async function testAndPopulate() {
  try {
    console.log("🔍 Testing database connection...");
    
    // Test connection
    const result = await db.select().from(templates).limit(1);
    console.log("✅ Database connection successful!");
    console.log("📊 Existing templates:", result.length);
    
    // Check if default template exists
    const existingDefault = await db
      .select()
      .from(templates)
      .where(eq(templates.id, 'default-harut-tatev'));
    
    if (existingDefault.length > 0) {
      console.log("✅ Default template already exists!");
      console.log("Template:", existingDefault[0]);
    } else {
      console.log("🆕 Creating default template...");
      
      const newTemplate = await db
        .insert(templates)
        .values({
          id: 'default-harut-tatev',
          name: 'Harut & Tatev Wedding',
          slug: 'harut-tatev',
          templateKey: 'pro',
          ownerEmail: 'harut@example.com',
          config: {
            couple: {
              groomName: "Harut",
              brideName: "Tatev",
              combinedNames: "Harut & Tatev"
            },
            sections: {
              hero: { enabled: true },
              countdown: { enabled: true },
              calendar: { enabled: true },
              locations: { enabled: true },
              timeline: { enabled: true },
              rsvp: { enabled: true },
              photos: { enabled: true }
            },
            theme: {
              colors: {
                primary: "var(--soft-gold)",
                secondary: "var(--sage-green)",
                accent: "var(--charcoal)",
                background: "var(--cream)"
              }
            }
          },
          maintenance: false
        })
        .returning();
      
      console.log("🎉 Default template created successfully!");
      console.log("Template ID:", newTemplate[0].id);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testAndPopulate();
