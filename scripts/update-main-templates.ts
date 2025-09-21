// Update existing templates to mark them as main templates
import { storage } from "../server/storage";

async function updateExistingTemplates() {
  try {
    console.log("🔄 Updating existing templates to mark as main templates...");
    
    // Get all templates
    const templates = await storage.getAllTemplates();
    
    for (const template of templates) {
      // Templates without sourceTemplateId should be main templates
      if (!template.sourceTemplateId) {
        // Update the template to mark it as main
        await storage.updateTemplate(template.id, {
          ...template,
          isMain: true
        });
        console.log(`✅ Updated template "${template.name}" to main template`);
      }
    }
    
    console.log("✅ Successfully updated all existing templates");
  } catch (error) {
    console.error("❌ Error updating templates:", error);
  }
}

updateExistingTemplates();
