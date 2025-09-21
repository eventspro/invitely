// Check template status in database
import { storage } from "../server/storage";

async function checkTemplateStatus() {
  try {
    console.log("🔍 Checking template status in database...");
    
    const templates = await storage.getAllTemplates();
    
    console.log("\n📊 Template Status Report:");
    console.log("=".repeat(50));
    
    for (const template of templates) {
      console.log(`\n📋 Template: ${template.name}`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Slug: ${template.slug}`);
      console.log(`   Template Key: ${template.templateKey}`);
      console.log(`   Source Template ID: ${template.sourceTemplateId || 'null'}`);
      console.log(`   Is Main: ${template.isMain}`);
      console.log(`   Created: ${template.createdAt}`);
    }
    
    const mainTemplates = templates.filter(t => t.isMain);
    const clonedTemplates = templates.filter(t => !t.isMain);
    
    console.log("\n📈 Summary:");
    console.log(`   Main Templates: ${mainTemplates.length}`);
    console.log(`   Cloned Templates: ${clonedTemplates.length}`);
    console.log(`   Total Templates: ${templates.length}`);
    
  } catch (error) {
    console.error("❌ Error checking template status:", error);
  }
}

checkTemplateStatus();
