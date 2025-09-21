// Template Management API Routes
import type { Express } from "express";
import { storage } from "../storage";
import { insertRsvpSchema, updateTemplateSchema } from "@shared/schema";
import { z } from "zod";
import { authenticateUser, requireAdminPanelAccess } from "../middleware/auth";
import { sendTemplateRsvpNotificationEmails, sendTemplateRsvpConfirmationEmail } from "../email";
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
      
      // Verify template exists
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Check template maintenance mode
      if (template.maintenance) {
        return res.status(503).json({ message: "Template is in maintenance mode" });
      }
      
      const validatedData = insertRsvpSchema.parse({
        ...req.body,
        templateId
      });
      
      // Check if email already exists for this template
      const existingRsvp = await storage.getRsvpByEmail(validatedData.email, templateId);
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
      
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      const rsvps = await storage.getAllRsvps(templateId);
      res.json(rsvps);
    } catch (error) {
      console.error("Get template RSVPs error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Configure multer for template-scoped photo uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');
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
      const { templateId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      const { category = 'gallery' } = req.body;
      
      // Create image record in database with template scope
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
      
      console.log(`📸 Template-scoped image uploaded: ${req.file.filename} for template ${templateId}`);
      
      res.json({
        id: imageRecord.id,
        url: imageUrl,
        name: req.file.originalname,
        size: req.file.size,
        category,
        templateId
      });
      
    } catch (error) {
      console.error("Template photo upload error:", error);
      if (req.file) {
        // Clean up uploaded file if there's an error
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Server error" });
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
}
