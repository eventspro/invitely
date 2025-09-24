import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertRsvpSchema } from "../shared/schema.js";
import { z } from "zod";
import { sendRsvpNotificationEmails, sendRsvpConfirmationEmail, testEmailService } from "./email.js";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import path from "path";
import fs from "fs";
import multer from "multer";

// Import new route modules
import authRoutes from './routes/auth.js';
import adminPanelRoutes from './routes/admin-panel.js';
import platformAdminRoutes from './routes/platform-admin.js';
import { registerTemplateRoutes } from './routes/templates.js';

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, uploadsDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Register authentication routes
  app.use('/api/auth', authRoutes);
  
  // Register admin panel routes (for Ultimate template customers)
  app.use('/api/admin-panel', adminPanelRoutes);
  
  // Register platform admin routes (for platform owner)
  app.use('/api/platform-admin', platformAdminRoutes);
  
  // Register template routes (for template-specific endpoints)
  registerTemplateRoutes(app);
  
  // Legacy RSVP endpoint - redirect to template-scoped endpoint
  app.post("/api/rsvp", async (req, res) => {
    try {
      // Try to determine the template ID from the request or use default
      const templateId = req.body.templateId || 'default-harut-tatev';
      
      // Redirect to template-scoped endpoint
      return res.status(301).json({ 
        message: "Please use template-specific RSVP endpoint",
        redirectTo: `/api/templates/${templateId}/rsvp`
      });
    } catch (error) {
      console.error("Legacy RSVP endpoint error:", error);
      res.status(500).json({ message: "Սերվերի սխալ" });
    }
  });

  // Get all RSVPs (admin endpoint)
  app.get("/api/rsvps", async (req, res) => {
    try {
      const rsvps = await storage.getAllRsvps();
      res.json(rsvps);
    } catch (error) {
      console.error("Get RSVPs error:", error);
      res.status(500).json({ message: "Սերվերի սխալ" });
    }
  });

  // Test email endpoint
  app.get("/api/test-email", async (req, res) => {
    try {
      console.log("🧪 Testing email service...");
      await testEmailService();
      res.json({ message: "Email test initiated. Check logs for results." });
    } catch (error) {
      console.error("Email test error:", error);
      res.status(500).json({ message: "Email test failed" });
    }
  });

  // Maintenance mode endpoints
  app.get("/api/maintenance", async (req, res) => {
    try {
      console.log(`🔧 Checking maintenance status - DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
      
      const status = await storage.getMaintenanceStatus();
      console.log(`✅ Maintenance status retrieved: ${status}`);
      res.json({ enabled: status });
    } catch (error) {
      console.error("❌ Get maintenance status error details:", error);
      console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack available');
      console.error("❌ Database URL available:", !!process.env.DATABASE_URL);
      res.status(500).json({ 
        message: "Server error",
        error: error instanceof Error ? error.message : 'Unknown error',
        hasDatabase: !!process.env.DATABASE_URL
      });
    }
  });

  app.post("/api/maintenance", async (req, res) => {
    try {
      const { enabled, password } = req.body;
      
      // Simple password check for admin access
      if (password !== "haruttev2025admin") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      await storage.setMaintenanceStatus(enabled);
      res.json({ 
        message: enabled ? "Maintenance mode enabled" : "Maintenance mode disabled",
        enabled 
      });
    } catch (error) {
      console.error("Set maintenance status error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Image upload endpoints

  // Upload image for a specific template
  app.post("/api/images/upload", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const { templateId, category = 'gallery' } = req.body;
        
      if (!templateId) {
        return res.status(400).json({ error: 'Template ID is required' });
      }
        
      // Create image record in database
      const imageUrl = `/api/images/serve/${req.file.filename}`;
      
      const imageRecord = await storage.createImage({
        templateId,
        url: imageUrl,
        name: req.file.originalname,
        category,
        size: req.file.size.toString(),
        mimeType: req.file.mimetype,
        order: "0"
      });
      
      console.log(`📸 Image uploaded successfully: ${req.file.filename} for template ${templateId}`);
      
      res.json({
        id: imageRecord.id,
        url: imageUrl,
        name: req.file.originalname,
        size: req.file.size,
        category
      });
      
    } catch (error) {
      console.error('Image upload error:', error);
      if (req.file) {
        // Clean up uploaded file if there's an error
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  // Serve uploaded images
  app.get("/api/images/serve/:filename", (req, res) => {
    try {
      const { filename } = req.params;
      
      // Check if this is a template-scoped image (new format: templateId-image-timestamp-random.ext)
      const templateMatch = filename.match(/^([a-f0-9-]{36})-/);
      let filePath: string;
      
      if (templateMatch) {
        // Template-scoped image: look in uploads/templateId/filename
        const templateId = templateMatch[1];
        filePath = path.join(process.cwd(), 'uploads', templateId, filename);
      } else {
        // Legacy image: look in uploads/filename
        filePath = path.join(process.cwd(), 'uploads', filename);
      }
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      // Determine content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif'
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).json({ error: "Failed to serve image" });
    }
  });

  // Get images for a template (query parameter version for frontend compatibility)
  app.get("/api/images", async (req, res) => {
    try {
      const { templateId, category } = req.query;
      
      if (!templateId) {
        return res.status(400).json({ error: "Template ID is required" });
      }
      
      console.log(`📸 Getting images for template: ${templateId}, category: ${category || 'all'}`);
      
      const images = await storage.getImages(templateId as string, category as string);
      
      console.log(`📊 Found ${images.length} images`);
      res.json(images);
    } catch (error) {
      console.error("❌ Failed to get images:", error);
      res.status(500).json({ error: "Failed to get images" });
    }
  });

  // Get images for a template
  app.get("/api/images/:templateId", async (req, res) => {
    try {
      const { templateId } = req.params;
      const { category } = req.query;
      
      console.log(`📸 Getting images for template: ${templateId}, category: ${category || 'all'}`);
      
      const images = await storage.getImages(templateId, category as string);
      
      console.log(`📊 Found ${images.length} images`);
      res.json(images);
    } catch (error) {
      console.error("❌ Failed to get images:", error);
      res.status(500).json({ error: "Failed to get images" });
    }
  });

  // Delete an image
  app.delete("/api/images", async (req, res) => {
    try {
      const { id, templateId } = req.body;
      
      if (!id || !templateId) {
        return res.status(400).json({ error: "Image ID and template ID are required" });
      }
      
      console.log(`🗑️ Deleting image: ${id} for template ${templateId}`);
      
      // Get image record to find the file
      const images = await storage.getImages(templateId);
      const imageRecord = images.find(img => img.id === id);
      
      if (imageRecord) {
        // Delete from database
        await storage.deleteImage(imageRecord.id);
        
        // Delete physical file
        const filename = imageRecord.url.split('/').pop();
        if (filename) {
          const filePath = path.join(process.cwd(), 'uploads', filename);
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted file: ${filename}`);
          }
        }
        
        res.json({ message: "Image deleted successfully" });
      } else {
        res.status(404).json({ error: "Image not found" });
      }
      
    } catch (error) {
      console.error("❌ Failed to delete image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  // Serve template preview images
  app.get("/api/images/template-preview-:id.jpg", async (req, res) => {
    try {
      const { id } = req.params;
      
      const filename = `template-preview-${id}.jpg`;
      const filePath = path.join(process.cwd(), 'attached_assets', 'template_previews', filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Template preview image not found" });
      }
      
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      
    } catch (error) {
      console.error("Error serving template preview image:", error);
      res.status(500).json({ error: "Failed to serve template preview image" });
    }
  });

  // Serve images from attached_assets folder for development
  app.get("/api/assets/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      
      const filePath = path.join(process.cwd(), 'attached_assets', filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      // Determine content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif'
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).json({ error: "Failed to serve image" });
    }
  });

  // Template endpoints
  app.get("/api/templates", async (req, res) => {
    try {
      console.log(`📋 Getting all templates`);
      
      const templates = await storage.getAllTemplates();
      
      console.log(`📊 Found ${templates.length} templates`);
      res.json(templates);
    } catch (error) {
      console.error("❌ Failed to get templates:", error);
      res.status(500).json({ error: "Failed to get templates" });
    }
  });

  // Template configuration endpoints
  app.get("/api/templates/:identifier/config", async (req, res) => {
    try {
      const { identifier } = req.params;
      console.log(`📋 Getting template config for: ${identifier}`);
      
      // Sanitize identifier to prevent injection
      const sanitizedIdentifier = identifier.replace(/[^a-zA-Z0-9-_]/g, '');
      if (!sanitizedIdentifier) {
        return res.status(400).json({ message: "Invalid template identifier" });
      }
      
      // Try to find template by ID first, then by slug
      let template = await storage.getTemplate(sanitizedIdentifier);
      if (!template) {
        console.log(`📋 Template not found by ID, trying slug: ${sanitizedIdentifier}`);
        template = await storage.getTemplateBySlug(sanitizedIdentifier);
      }
      
      if (!template) {
        console.log(`❌ Template not found: ${sanitizedIdentifier}`);
        return res.status(404).json({ 
          message: "Template not found",
          identifier: sanitizedIdentifier
        });
      }
      
      // Check if template is in maintenance mode
      if (template.maintenance) {
        const maintenanceConfig = (template.config as any).maintenance || {};
        return res.json({
          templateId: template.id,
          templateKey: template.templateKey,
          maintenance: true,
          maintenanceConfig: {
            title: maintenanceConfig.title || 'Site Under Maintenance',
            message: maintenanceConfig.message || 'We will be back soon',
            enabled: true
          }
        });
      }
      
      console.log(`✅ Template found: ${template.name} (${template.id})`);
      
      // Load images for this template and enrich the configuration
      let allImages = [];
      try {
        allImages = await storage.getImages(template.id);
      } catch (imageError) {
        console.warn(`⚠️ Could not load images for template ${template.id}:`, imageError);
        // Continue without images
      }
      
      const heroImages = allImages.filter(img => img.category === 'hero').map(img => img.url);
      const galleryImages = allImages.filter(img => img.category === 'gallery').map(img => img.url);
      
      // Enrich configuration with images
      const config = template.config as any;
      const enrichedConfig = {
        ...config,
        hero: {
          ...config.hero,
          images: heroImages.length > 0 ? heroImages : config.hero?.images || []
        },
        photos: {
          ...config.photos,
          images: galleryImages.length > 0 ? galleryImages : config.photos?.images || []
        }
      };
      
      const templateInfo = {
        templateId: template.id,
        templateKey: template.templateKey,
        slug: template.slug,
        config: enrichedConfig,
        maintenance: false
      };
      
      // Set cache headers for better performance
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
      
      console.log(`✅ Template config loaded: ${heroImages.length} hero, ${galleryImages.length} gallery images`);
      res.json(templateInfo);
    } catch (error) {
      console.error("❌ Get template config error:", error);
      res.status(500).json({ 
        message: "Server error",
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
      });
    }
  });

  app.put("/api/templates/:templateId/config", async (req, res) => {
    try {
      const { templateId } = req.params;
      const config = req.body;
      
      console.log(`💾 Saving template config for: ${templateId}`);
      console.log(`💾 Config data:`, JSON.stringify(config, null, 2));
      
      // Try to find template by ID first, then by slug to get the actual ID
      let template = await storage.getTemplate(templateId);
      if (!template) {
        console.log(`❌ Template not found by ID, trying slug: ${templateId}`);
        template = await storage.getTemplateBySlug(templateId);
      }
      
      if (!template) {
        console.log(`❌ Template not found by ID or slug: ${templateId}`);
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Use the actual template ID for the update
      const updatedTemplate = await storage.updateTemplate(template.id, { config });
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      console.log(`✅ Template config saved successfully`);
      res.json(updatedTemplate.config);
    } catch (error) {
      console.error("Save template config error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Template RSVPs endpoint
  app.get("/api/templates/:templateId/rsvps", async (req, res) => {
    try {
      const { templateId } = req.params;
      console.log(`📋 Getting RSVPs for template: ${templateId}`);
      
      // Try to find template by ID first, then by slug to get the actual ID
      let template = await storage.getTemplate(templateId);
      if (!template) {
        console.log(`❌ Template not found by ID, trying slug: ${templateId}`);
        template = await storage.getTemplateBySlug(templateId);
      }
      
      if (!template) {
        console.log(`❌ Template not found by ID or slug: ${templateId}`);
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Use the actual template ID for the RSVPs query
      const rsvps = await storage.getAllRsvps(template.id);
      
      console.log(`📊 Found ${rsvps.length} RSVPs for template`);
      res.json(rsvps);
    } catch (error) {
      console.error("❌ Failed to get RSVPs:", error);
      res.status(500).json({ error: "Failed to get RSVPs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

