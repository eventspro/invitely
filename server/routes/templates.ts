// Template Management API Routes
import type { Express } from "express";
import { storage } from "../storage.js";
import { insertRsvpSchema, updateTemplateSchema } from "../../shared/schema.js";
import { z } from "zod";
import { authenticateUser, requireAdminPanelAccess } from "../middleware/auth.js";
import { sendTemplateRsvpNotificationEmails, sendTemplateRsvpConfirmationEmail } from "../email.js";
import multer from "multer";
import path from "path";
import fs from "fs";

export function registerTemplateRoutes(app: Express) {
  
  // Get template configuration by ID or slug
  app.get("/api/templates/:identifier/config", async (req, res) => {
    try {
      const { identifier } = req.params;
      
      // Try to get template by ID first, then by slug
      let template = await storage.getTemplate(identifier);
      if (!template) {
        template = await storage.getTemplateBySlug(identifier);
      }
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Return the stored config from database
      res.json({
        templateId: template.id,
        templateKey: template.templateKey,
        config: template.config,
        maintenance: template.maintenance
      });
    } catch (error) {
      console.error("Get template config error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Template-scoped RSVP submission
  app.post("/api/templates/:templateId/rsvp", async (req, res) => {
    try {
      const { templateId } = req.params;
      
      // Verify template exists - try by ID first, then by slug
      let template = await storage.getTemplate(templateId);
      if (!template) {
        template = await storage.getTemplateBySlug(templateId);
      }
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Check template maintenance mode
      if (template.maintenance) {
        return res.status(503).json({ message: "Template is in maintenance mode" });
      }
      
      const validatedData = insertRsvpSchema.parse({
        ...req.body,
        templateId: template.id  // Use the actual template ID, not the slug
      });
      
      // Check if email already exists for this template (check both possible email fields)
      const emailToCheck = validatedData.guestEmail || validatedData.email;
      const existingRsvp = await storage.getRsvpByEmail(emailToCheck, template.id);
      if (existingRsvp) {
        return res.status(400).json({ 
          message: "Այս էլ․ հասցեով արդեն ուղարկվել է հաստատում" 
        });
      }

      const rsvp = await storage.createRsvp(validatedData);
      
      // Send email notifications (using template config)
      try {
        const config = template.config as any;
        if (config.email?.recipients || config.couple) {
          await Promise.all([
            sendTemplateRsvpNotificationEmails(rsvp, template),
            sendTemplateRsvpConfirmationEmail(rsvp, template)
          ]);
        }
      } catch (emailError) {
        console.error("Email notification error:", emailError);
        // Continue with success response even if emails fail
      }
      
      res.json({ 
        message: "Շնորհակալություն! Ձեր հաստատումը ստացվել է:",
        rsvp: {
          id: rsvp.id,
          firstName: rsvp.firstName,
          lastName: rsvp.lastName,
          attendance: rsvp.attendance
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Տվյալները ճիշտ չեն լրացված",
          errors: error.errors 
        });
      }
      console.error("RSVP submission error:", error);
      res.status(500).json({ message: "Սերվերի սխալ" });
    }
  });

  // Get template RSVPs (admin-protected)
  app.get("/api/templates/:templateId/rsvps", authenticateUser, requireAdminPanelAccess, async (req, res) => {
    try {
      const { templateId } = req.params;
      
      // Try to get template by ID first, then by slug
      let template = await storage.getTemplate(templateId);
      if (!template) {
        template = await storage.getTemplateBySlug(templateId);
      }
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      const rsvps = await storage.getAllRsvps(template.id);
      res.json(rsvps);
    } catch (error) {
      console.error("Get template RSVPs error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Configure multer for template-scoped photo uploads
  const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const templateUpload = multer({ 
    storage: multer.diskStorage({
      destination: (req: any, file: any, cb: any) => {
        const { templateId } = req.params;
        const templateUploadsDir = path.join(uploadsDir, templateId);
        if (!fs.existsSync(templateUploadsDir)) {
          fs.mkdirSync(templateUploadsDir, { recursive: true });
        }
        cb(null, templateUploadsDir);
      },
      filename: (req: any, file: any, cb: any) => {
        const { templateId } = req.params;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${templateId}-${file.fieldname}-${uniqueSuffix}${ext}`);
      }
    }),
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req: any, file: any, cb: any) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    }
  });

  // Template-scoped photo upload endpoints
  app.post("/api/templates/:templateId/photos/upload", authenticateUser, requireAdminPanelAccess, templateUpload.single('image'), async (req, res) => {
    try {
      console.log('🔧 Photo upload endpoint hit, templateId:', req.params.templateId);
      console.log('🔧 File received:', !!req.file);
      console.log('🔧 Body:', req.body);
      
      const { templateId } = req.params;
      
      if (!req.file) {
        console.log('❌ No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      console.log('📁 File details:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      });
      
      const template = await storage.getTemplate(templateId);
      if (!template) {
        console.log('❌ Template not found:', templateId);
        return res.status(404).json({ message: "Template not found" });
      }
      
      console.log('✅ Template found:', template.name);
      
      const { category = 'gallery' } = req.body;
      
      // Create image record in database with template scope
      let imageUrl: string;
      
      // Use R2 storage in production, local storage in development
      if (process.env.VERCEL && process.env.CLOUDFLARE_R2_BUCKET_NAME) {
        try {
          const { r2Storage } = await import('../r2Storage.js');
          if (r2Storage.isConfigured()) {
            const fileBuffer = fs.readFileSync(req.file.path);
            const r2Result = await r2Storage.uploadImage(
              templateId,
              fileBuffer,
              req.file.originalname,
              req.file.mimetype,
              category
            );
            imageUrl = r2Result.url;
            console.log(`☁️ Image uploaded to R2: ${r2Result.url}`);
            
            // Clean up local temp file
            fs.unlinkSync(req.file.path);
          } else {
            imageUrl = `/api/images/serve/${req.file.filename}`;
          }
        } catch (r2Error) {
          console.warn('⚠️ R2 upload failed, using local storage:', r2Error);
          imageUrl = `/api/images/serve/${req.file.filename}`;
        }
      } else {
        imageUrl = `/api/images/serve/${req.file.filename}`;
      }
      
      console.log('💾 Creating image record in database...');
      const imageRecord = await storage.createImage({
        templateId,
        url: imageUrl,
        name: req.file.originalname,
        category,
        size: req.file.size.toString(),
        mimeType: req.file.mimetype,
        order: "0"
      });
      
      console.log(`📸 Template-scoped image uploaded: ${req.file.filename} for template ${templateId}`);
      
      const response = {
        id: imageRecord.id,
        url: imageUrl,
        name: req.file.originalname,
        size: req.file.size,
        category,
        templateId
      };
      
      console.log('📤 Sending response:', response);
      res.json(response);
      
    } catch (error) {
      console.error("💥 Template photo upload error:", error);
      console.error("💥 Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      if (req.file) {
        // Clean up uploaded file if there's an error
        try {
          fs.unlinkSync(req.file.path);
          console.log('🧹 Cleaned up uploaded file');
        } catch (cleanupError) {
          console.error('🧹 Failed to cleanup file:', cleanupError);
        }
      }
      res.status(500).json({ error: "Server error", message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Template maintenance toggle
  app.post("/api/templates/:templateId/maintenance", authenticateUser, requireAdminPanelAccess, async (req, res) => {
    try {
      const { templateId } = req.params;
      const { enabled } = req.body;
      
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      await storage.setMaintenanceStatus(enabled, templateId);
      
      res.json({ 
        message: enabled ? "Template maintenance enabled" : "Template maintenance disabled",
        enabled,
        templateId
      });
    } catch (error) {
      console.error("Template maintenance toggle error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Template-scoped image listing endpoint
  app.get("/api/templates/:templateId/images", authenticateUser, requireAdminPanelAccess, async (req, res) => {
    try {
      const { templateId } = req.params;
      const { category } = req.query;
      
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Get images for this template
      const images = await storage.getImages(templateId, category as string);
      
      console.log(`📷 Retrieved ${images.length} images for template ${templateId}${category ? ` (category: ${category})` : ''}`);
      
      res.json(images);
    } catch (error) {
      console.error("Template images listing error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Template-scoped image deletion endpoint
  app.delete("/api/templates/:templateId/images/:imageId", authenticateUser, requireAdminPanelAccess, async (req, res) => {
    try {
      const { templateId, imageId } = req.params;
      
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Delete the image record from database
      const success = await storage.deleteImage(imageId);
      if (success) {
        console.log(`🗑️ Deleted image ${imageId} for template ${templateId}`);
        res.json({ success: true, message: "Image deleted successfully" });
      } else {
        res.status(404).json({ message: "Image not found" });
      }
    } catch (error) {
      console.error("Template image deletion error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
}
