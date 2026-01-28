import "dotenv/config";
import { db } from "../server/db.js";
import { templates } from "../shared/schema.js";
import { eq } from "drizzle-orm";

// Template configurations
const mainTemplates = [
  {
    id: "default-pro",
    name: "Pro Wedding Template",
    slug: "pro",
    templateKey: "pro",
    isMain: true,
    ownerEmail: null,
    maintenance: false,
    config: {
      theme: {
        colors: {
          primary: "#8B7355",
          secondary: "#C9B8A8",
          accent: "#5A4A3A",
          background: "#FAF9F6"
        },
        fonts: {
          heading: "Playfair Display",
          body: "Inter"
        }
      },
      couple: {
        bride: { name: "Anna", surname: "Smith" },
        groom: { name: "John", surname: "Doe" }
      },
      wedding: {
        date: "2026-06-15",
        venue: "Grand Hotel",
        address: "123 Wedding St, City"
      }
    }
  },
  {
    id: "default-elegant",
    name: "Elegant Wedding Template",
    slug: "elegant",
    templateKey: "elegant",
    isMain: true,
    ownerEmail: null,
    maintenance: false,
    config: {
      theme: {
        colors: {
          primary: "#4A5568",
          secondary: "#CBD5E0",
          accent: "#2D3748",
          background: "#F7FAFC"
        },
        fonts: {
          heading: "Cormorant Garamond",
          body: "Lato"
        }
      },
      couple: {
        bride: { name: "Emma", surname: "Wilson" },
        groom: { name: "Michael", surname: "Brown" }
      },
      wedding: {
        date: "2026-07-20",
        venue: "Luxury Ballroom",
        address: "456 Elegant Ave, City"
      }
    }
  },
  {
    id: "default-romantic",
    name: "Romantic Wedding Template",
    slug: "romantic",
    templateKey: "romantic",
    isMain: true,
    ownerEmail: null,
    maintenance: false,
    config: {
      theme: {
        colors: {
          primary: "#D4A5A5",
          secondary: "#F8E5E5",
          accent: "#9B6B6B",
          background: "#FFFBFB"
        },
        fonts: {
          heading: "Great Vibes",
          body: "Open Sans"
        }
      },
      couple: {
        bride: { name: "Sophia", surname: "Johnson" },
        groom: { name: "James", surname: "Davis" }
      },
      wedding: {
        date: "2026-08-10",
        venue: "Garden Paradise",
        address: "789 Romance Rd, City"
      }
    }
  },
  {
    id: "default-nature",
    name: "Nature Wedding Template",
    slug: "nature",
    templateKey: "nature",
    isMain: true,
    ownerEmail: null,
    maintenance: false,
    config: {
      theme: {
        colors: {
          primary: "#6B8E6B",
          secondary: "#A8C9A8",
          accent: "#4A6B4A",
          background: "#F4F8F4"
        },
        fonts: {
          heading: "Josefin Sans",
          body: "Roboto"
        }
      },
      couple: {
        bride: { name: "Olivia", surname: "Martinez" },
        groom: { name: "William", surname: "Garcia" }
      },
      wedding: {
        date: "2026-09-05",
        venue: "Forest Retreat",
        address: "321 Nature Trail, City"
      }
    }
  },
  {
    id: "default-classic",
    name: "Classic Wedding Template",
    slug: "classic",
    templateKey: "classic",
    isMain: true,
    ownerEmail: null,
    maintenance: false,
    config: {
      theme: {
        colors: {
          primary: "#2C3E50",
          secondary: "#95A5A6",
          accent: "#1A252F",
          background: "#FFFFFF"
        },
        fonts: {
          heading: "Merriweather",
          body: "Source Sans Pro"
        }
      },
      couple: {
        bride: { name: "Isabella", surname: "Rodriguez" },
        groom: { name: "Alexander", surname: "Lee" }
      },
      wedding: {
        date: "2026-10-12",
        venue: "Historic Manor",
        address: "654 Classic Blvd, City"
      }
    }
  }
];

async function seedTemplates() {
  try {
    console.log("🌱 Starting template seeding...");
    console.log(`📊 Seeding ${mainTemplates.length} templates`);

    for (const template of mainTemplates) {
      console.log(`\n🔍 Processing template: ${template.name}`);
      
      // Check if template exists
      const existing = await db
        .select()
        .from(templates)
        .where(eq(templates.id, template.id))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  ✅ Template exists, updating...`);
        await db
          .update(templates)
          .set({
            ...template,
            updatedAt: new Date()
          })
          .where(eq(templates.id, template.id));
        console.log(`  ✅ Updated: ${template.name}`);
      } else {
        console.log(`  ➕ Creating new template...`);
        await db.insert(templates).values({
          ...template,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`  ✅ Created: ${template.name}`);
      }
    }

    console.log("\n✅ All templates seeded successfully!");
    
    // Verify
    const allTemplates = await db.select().from(templates);
    const mainOnly = allTemplates.filter(t => t.isMain === true);
    console.log(`\n📊 Database now contains:`);
    console.log(`   - Total templates: ${allTemplates.length}`);
    console.log(`   - Main templates: ${mainOnly.length}`);
    console.log(`   - Clone templates: ${allTemplates.length - mainOnly.length}`);
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

// Run the seeding
seedTemplates()
  .then(() => {
    console.log("\n🎉 Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });
