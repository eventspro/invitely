import "dotenv/config";
import { storage } from "../../../server/storage";

export default async function handler(req: any, res: any) {
  try {
    const { templateId } = req.query;
    console.log(`📋 Getting template config for: ${templateId}`);
    
    // Try to find template by ID first, then by slug
    let template = await storage.getTemplate(templateId as string);
    if (!template) {
      console.log(`❌ Template not found by ID, trying slug: ${templateId}`);
      template = await storage.getTemplateBySlug(templateId as string);
    }
    
    if (!template) {
      console.log(`❌ Template not found by ID or slug: ${templateId}`);
      return res.status(404).json({ message: "Template not found" });
    }
    
    console.log(`✅ Template found: ${template.name} (${template.id})`);
    
    // Load images for this template and enrich the configuration
    const allImages = await storage.getImages(template.id);
    const heroImages = allImages.filter(img => img.category === 'hero').map(img => img.url);
    const galleryImages = allImages.filter(img => img.category === 'gallery').map(img => img.url);
    
    // Enrich configuration with images
    const config = template.config as any;
    const enrichedConfig = {
      ...config,
      hero: {
        ...config.hero,
        images: heroImages
      },
      photos: {
        ...config.photos,
        images: galleryImages
      }
    };
    
    const templateInfo = {
      templateId: template.id,
      templateKey: template.templateKey,
      config: enrichedConfig,
      maintenance: template.maintenance || false
    };
    
    console.log(`✅ Template info loaded successfully with ${heroImages.length} hero images and ${galleryImages.length} gallery images`);
    res.json(templateInfo);
  } catch (error) {
    console.error("Get template config error:", error);
    res.status(500).json({ message: "Server error" });
  }
}