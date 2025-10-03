// Platform Admin API Routes
import type { Express } from "express";
import { storage } from "../storage.js";
import { insertTemplateSchema, updateTemplateSchema } from "../../shared/schema.js";
import { z } from "zod";
import jwt from "jsonwebtoken";

// Admin authentication middleware
const authenticateAdmin = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export function registerAdminRoutes(app: Express) {
  
  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Simple admin check (use environment variables in production)
      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      const adminPassword = process.env.ADMIN_PASSWORD || "haruttev2025admin";
      
      if (username !== adminUsername || password !== adminPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { username, role: "admin" },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "24h" }
      );
      
      res.json({ 
        message: "Login successful",
        token,
        admin: { username }
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // List all templates
  app.get("/api/admin/templates", authenticateAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      
      // Include RSVP counts for each template
      const templatesWithStats = await Promise.all(
        templates.map(async (template) => {
          const rsvps = await storage.getAllRsvps(template.id);
          const attendingCount = rsvps.filter(r => r.attendance === "attending").length;
          const notAttendingCount = rsvps.filter(r => r.attendance === "not-attending").length;
          
          return {
            ...template,
            stats: {
              totalRsvps: rsvps.length,
              attending: attendingCount,
              notAttending: notAttendingCount
            }
          };
        })
      );
      
      res.json(templatesWithStats);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create new template (clone from existing or create from base)
  app.post("/api/admin/templates", authenticateAdmin, async (req, res) => {
    try {
      console.log("🔍 Creating template with body:", JSON.stringify(req.body, null, 2));
      
      const { sourceTemplateId, templateKey: requestedTemplateKey, name, slug, ownerEmail } = req.body;
      
      let config = {};
      let templateKey = requestedTemplateKey;
      let isMain = true; // Default to main template
      
      if (sourceTemplateId) {
        console.log("🔄 Cloning from template:", sourceTemplateId);
        isMain = false; // Cloned templates are not main templates
        
        // Clone from existing template
        const sourceTemplate = await storage.getTemplate(sourceTemplateId);
        if (!sourceTemplate) {
          return res.status(404).json({ message: "Source template not found" });
        }
        config = sourceTemplate.config as Record<string, any>;
        // Use source template's templateKey if not provided
        if (!templateKey) {
          templateKey = sourceTemplate.templateKey;
        }
        console.log("📋 Using config from source, templateKey:", templateKey);
      } else if (templateKey) {
        // Create from base template - load complete default config
        try {
          // Dynamic import of template default config
          let templateConfigModule;
          switch (templateKey) {
            case "pro":
              templateConfigModule = await import("../../client/src/templates/pro/config.js");
              break;
            case "classic":
              templateConfigModule = await import("../../client/src/templates/classic/config.js");
              break;
            case "elegant":
              templateConfigModule = await import("../../client/src/templates/elegant/config.js");
              break;
            case "romantic":
              templateConfigModule = await import("../../client/src/templates/romantic/config.js");
              break;
            case "nature":
              templateConfigModule = await import("../../client/src/templates/nature/config.js");
              break;
            default:
              return res.status(400).json({ message: "Unknown template key" });
          }
          
          config = templateConfigModule.defaultConfig;
          console.log(`📋 Loaded complete default config for ${templateKey}:`, Object.keys(config));
        } catch (importError) {
          console.error(`Failed to load template config for ${templateKey}:`, importError);
          
          // Fallback to basic config if import fails
          config = {
            couple: { groomName: "", brideName: "", combinedNames: "" },
            wedding: { date: "", displayDate: "", month: "", day: "" },
            hero: { welcomeMessage: "", musicButton: "Play Music" },
            countdown: {
              subtitle: "Time until our wedding",
              labels: { days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds" }
            },
            calendar: {
              title: "Calendar",
              description: "Join us for our special day",
              monthTitle: "Wedding Month",
              dayLabels: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
            },
            locations: {
              sectionTitle: "Locations",
              church: { title: "Ceremony", name: "Church", description: "Wedding ceremony", mapButton: "Map" },
              restaurant: { title: "Reception", name: "Reception Hall", description: "Celebration", mapButton: "Map" }
            },
            timeline: {
              title: "Timeline",
              events: [
                { time: "16:00", title: "Ceremony", description: "Wedding ceremony" },
                { time: "18:00", title: "Reception", description: "Celebration" },
                { time: "23:00", title: "End", description: "Thank you for celebrating" }
              ],
              afterMessage: { thankYou: "Thank you", notes: "Looking forward to celebrating with you" }
            },
            rsvp: {
              title: "RSVP",
              description: "Please confirm your attendance",
              form: {
                firstName: "First Name", firstNamePlaceholder: "Your first name",
                lastName: "Last Name", lastNamePlaceholder: "Your last name",
                email: "Email", emailPlaceholder: "your@email.com",
                guestCount: "Guest Count", guestCountPlaceholder: "Number of guests",
                guestNames: "Guest Names", guestNamesPlaceholder: "Names of all guests",
                attendance: "Attendance", attendingYes: "Attending", attendingNo: "Not Attending",
                submitButton: "Submit RSVP", submittingButton: "Submitting..."
              },
              guestOptions: [
                { value: "1", label: "1 guest" },
                { value: "2", label: "2 guests" },
                { value: "3", label: "3 guests" }
              ]
            },
            photos: {
              title: "Photos",
              description: "Share your photos with us",
              downloadButton: "Download Photos",
              uploadButton: "Upload Photos",
              comingSoonMessage: "Photos will be available after the wedding"
            },
            navigation: {
              home: "Home", countdown: "Countdown", calendar: "Calendar",
              locations: "Locations", timeline: "Timeline", rsvp: "RSVP"
            },
            footer: { thankYouMessage: "Thank you for celebrating with us" },
            email: { recipients: [] },
            maintenance: {
              enabled: false, password: "", title: "Coming Soon", subtitle: "",
              message: "", countdownText: "Until the wedding", passwordPrompt: "",
              wrongPassword: "Wrong password", enterPassword: "Enter password"
            },
            sections: {
              hero: { enabled: true }, countdown: { enabled: true }, calendar: { enabled: true },
              locations: { enabled: true }, timeline: { enabled: true }, rsvp: { enabled: true },
              photos: { enabled: true }
            },
            theme: {
              colors: {
                primary: "",
                secondary: "", 
                accent: "",
                background: "",
                textColor: ""
              },
              fonts: { heading: "Noto Serif Armenian, serif", body: "Noto Sans Armenian, sans-serif" }
            }
          };
        }
      } else {
        return res.status(400).json({ message: "Either sourceTemplateId or templateKey required" });
      }
      
      const templateData: any = {
        name: name || `New Template`,
        slug: slug || `template-${Date.now()}`,
        templateKey: templateKey || "pro",
        config,
        maintenance: false,
        sourceTemplateId,
        isMain
      };
      
      // Only add ownerEmail if it's provided
      if (ownerEmail) {
        templateData.ownerEmail = ownerEmail;
      }
      
      console.log("📝 Template data to validate:", JSON.stringify(templateData, null, 2));
      
      const validatedData = insertTemplateSchema.parse(templateData);
      const newTemplate = await storage.createTemplate(validatedData);
      
      res.status(201).json(newTemplate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Template creation validation error:", error.errors);
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error("Create template error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update template
  app.put("/api/admin/templates/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = updateTemplateSchema.parse(req.body);
      
      const updatedTemplate = await storage.updateTemplate(id, updates);
      
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(updatedTemplate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error("Update template error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delete template
  app.delete("/api/admin/templates/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const success = await storage.deleteTemplate(id);
      
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Delete template error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Export template RSVPs as CSV
  app.get("/api/admin/templates/:id/export/csv", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      const rsvps = await storage.getAllRsvps(id);
      
      // Generate CSV
      const csvHeader = "First Name,Last Name,Email,Guest Count,Guest Names,Attendance,Submitted At\n";
      const csvRows = rsvps.map(rsvp => 
        `"${rsvp.firstName}","${rsvp.lastName}","${rsvp.email}","${rsvp.guestCount}","${rsvp.guestNames || ''}","${rsvp.attendance}","${rsvp.createdAt}"`
      ).join("\n");
      
      const csv = csvHeader + csvRows;
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${template.slug}-rsvps.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Export CSV error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Enhanced Image Management Routes
  
  // Get all images for a template
  app.get("/api/admin/templates/:id/images", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // TODO: Implement image storage and retrieval
      // For now, return mock data structure
      const images = [
        {
          id: "img-1",
          url: "/api/photos/example1.jpg",
          name: "Hero Image",
          size: 1024000,
          uploadedAt: new Date().toISOString(),
          category: "hero"
        }
      ];
      
      res.json(images);
    } catch (error) {
      console.error("Get template images error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Upload image for a template
  app.post("/api/admin/templates/:id/images", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { imageUrl, name, category } = req.body;
      
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // TODO: Implement image storage logic
      // For now, just return success
      const imageRecord = {
        id: `img-${Date.now()}`,
        url: imageUrl,
        name: name || "Uploaded Image",
        category: category || "gallery",
        templateId: id,
        uploadedAt: new Date().toISOString()
      };
      
      res.status(201).json(imageRecord);
    } catch (error) {
      console.error("Upload template image error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delete image for a template
  app.delete("/api/admin/templates/:id/images/:imageId", authenticateAdmin, async (req, res) => {
    try {
      const { id, imageId } = req.params;
      
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // TODO: Implement image deletion logic
      // For now, just return success
      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("Delete template image error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update template sections configuration
  app.put("/api/admin/templates/:id/sections", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { sections } = req.body;
      
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      const updatedConfig = {
        ...(template.config as any),
        sections: sections
      };
      
      await storage.updateTemplate(id, { config: updatedConfig });
      
      res.json({ 
        message: "Template sections updated successfully",
        sections: sections
      });
    } catch (error) {
      console.error("Update template sections error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
}
