// Fix cloned templates - mark copies as cloned and set proper source template IDs
import { storage } from "../server/storage";

async function fixClonedTemplates() {
  try {
    console.log("🔧 Fixing cloned templates...");
    
    const templates = await storage.getAllTemplates();
    
    // Find templates with "(Copy)" in their names - these should be cloned
    const copyTemplates = templates.filter(t => t.name.includes("(Copy)"));
    
    for (const copyTemplate of copyTemplates) {
      // Find the original template (same name without "(Copy)")
      const originalName = copyTemplate.name.replace(" (Copy)", "");
      const originalTemplate = templates.find(t => t.name === originalName);
      
      if (originalTemplate) {
        console.log(`🔄 Fixing "${copyTemplate.name}"`);
        console.log(`   Original: "${originalTemplate.name}" (ID: ${originalTemplate.id})`);
        
        // Update the copy template to be marked as cloned
        await storage.updateTemplate(copyTemplate.id, {
          ...copyTemplate,
          isMain: false,
          sourceTemplateId: originalTemplate.id
        });
        
        console.log(`✅ Updated "${copyTemplate.name}" to be a clone of "${originalTemplate.name}"`);
      } else {
        console.log(`⚠️  Could not find original template for "${copyTemplate.name}"`);
      }
    }
    
    console.log("✅ Successfully fixed cloned templates");
    
    // Show updated summary
    const updatedTemplates = await storage.getAllTemplates();
    const mainTemplates = updatedTemplates.filter(t => t.isMain);
    const clonedTemplates = updatedTemplates.filter(t => !t.isMain);
    
    console.log("\n📈 Updated Summary:");
    console.log(`   Main Templates: ${mainTemplates.length}`);
    console.log(`   Cloned Templates: ${clonedTemplates.length}`);
    console.log(`   Total Templates: ${updatedTemplates.length}`);
    
  } catch (error) {
    console.error("❌ Error fixing cloned templates:", error);
  }
}

fixClonedTemplates();
