// Template Management API Routes
import type { Express } from "express";
import { storage } from "../storage.js";
import { insertRsvpSchema, updateTemplateSchema } from "../../shared/schema.js";
import { z } from "zod";
import { authenticateUser, requireAdminPanelAccess } from "../middleware/auth.js";
import { rsvpLimiter, uploadLimiter } from "../middleware/rateLimiter.js";
import { sendTemplateRsvpNotificationEmails, sendTemplateRsvpConfirmationEmail } from "../email.js";
import multer from "multer";
import path from "path";
import fs from "fs";

export function registerTemplateRoutes(app: Express) {
  
  // Get template configuration by ID or slug
  app.get("/api/templates/:identifier/config", async (req, res) => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        console.error(`Template config request timeout for: ${req.params.identifier}`);
        res.status(408).json({ message: "Request timeout" });
      }
    }, 8000); // 8 second timeout for serverless

    try {
      const { identifier } = req.params;
      console.log(`🔍 Searching for template with ID: ${identifier}`);
      
      // Try to get template by ID first, then by slug
      let template = await Promise.race([
        storage.getTemplate(identifier),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 5000))
      ]) as any;
      
      if (!template) {
        console.log(`❌ No template found with ID: ${identifier}`);
        console.log(`🔍 Searching for template with slug: ${identifier}`);
        template = await Promise.race([
          storage.getTemplateBySlug(identifier),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 5000))
        ]) as any;
      }
      
      if (!template) {
        clearTimeout(timeoutId);
        return res.status(404).json({ message: "Template not found" });
      }
      
      console.log(`✅ Found template: ${template.name} (ID: ${template.id})`);
      
      // Return the stored config from database
      const response = {
        templateId: template.id,
        templateKey: template.templateKey,
        config: template.config,
        maintenance: template.maintenance
      };
      
      clearTimeout(timeoutId);
      if (!res.headersSent) {
        res.json(response);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Get template config error:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  // Template-scoped RSVP submission (with rate limiting)
  app.post("/api/templates/:templateId/rsvp", rsvpLimiter, async (req, res) => {
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
        templateId: template.id,  // Use the actual template ID, not the slug
        guestEmail: req.body.guestEmail || req.body.email  // Ensure guestEmail is filled from email if not provided
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
      let imageUrl: string = `/api/images/serve/${req.file.filename}`; // Default fallback
      
      // Use R2 storage in production if configured, otherwise use local storage
      let useR2 = false;
      
      if (process.env.VERCEL) {
        try {
          // Only try R2 if all required env vars are present
          if (process.env.CLOUDFLARE_R2_BUCKET_NAME && 
              process.env.CLOUDFLARE_R2_ACCOUNT_ID &&
              process.env.CLOUDFLARE_R2_ACCESS_KEY &&
              process.env.CLOUDFLARE_R2_SECRET_KEY &&
              process.env.CLOUDFLARE_R2_PUBLIC_URL) {
            
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
              useR2 = true;
              
              // Clean up local temp file
              fs.unlinkSync(req.file.path);
            }
          } else {
            console.log('⚠️ R2 environment variables not fully configured, using local storage');
          }
        } catch (r2Error) {
          console.warn('⚠️ R2 upload failed, using local storage:', r2Error);
        }
      }
      
      // Fall back to local storage if R2 wasn't used
      if (!useR2) {
        // Always use the image serve API endpoint for consistency
        imageUrl = `/api/images/serve/${req.file.filename}`;
        console.log(`💾 Using local storage with API serve: ${imageUrl}`);
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
      
      if (req.file && req.file.path) {
        // Clean up uploaded file if there's an error
        try {
          fs.unlinkSync(req.file.path);
          console.log('🧹 Cleaned up uploaded file');
        } catch (cleanupError) {
          console.error('🧹 Failed to cleanup file:', cleanupError);
        }
      }
      
      // Ensure we always return JSON, not HTML
      res.setHeader('Content-Type', 'application/json');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during upload';
      const errorResponse = { 
        success: false,
        error: "Image upload failed", 
        message: errorMessage,
        timestamp: new Date().toISOString()
      };
      
      console.log('📤 Sending error response:', errorResponse);
      res.status(500).json(errorResponse);
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
