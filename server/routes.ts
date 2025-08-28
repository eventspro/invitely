import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRsvpSchema } from "@shared/schema";
import { z } from "zod";
import { sendRsvpNotificationEmails, sendRsvpConfirmationEmail, testEmailService } from "./email";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // RSVP submission endpoint
  app.post("/api/rsvp", async (req, res) => {
    try {
      const validatedData = insertRsvpSchema.parse(req.body);
      
      // Check if email already exists
      const existingRsvp = await storage.getRsvpByEmail(validatedData.email);
      if (existingRsvp) {
        return res.status(400).json({ 
          message: "Այս էլ․ հասցեով արդեն ուղարկվել է հաստատում" 
        });
      }

      const rsvp = await storage.createRsvp(validatedData);
      
      // Send email notifications
      try {
        await Promise.all([
          sendRsvpNotificationEmails(rsvp),
          sendRsvpConfirmationEmail(rsvp)
        ]);
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
      const status = await storage.getMaintenanceStatus();
      res.json({ enabled: status });
    } catch (error) {
      console.error("Get maintenance status error:", error);
      res.status(500).json({ message: "Server error" });
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

  // Photo upload endpoints
  
  // Serve public objects (photos)
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve uploaded photos
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get upload URL for photo
  app.post("/api/photos/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Set photo as uploaded (public visibility)
  app.put("/api/photos", async (req, res) => {
    if (!req.body.photoURL) {
      return res.status(400).json({ error: "photoURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.photoURL,
        {
          owner: "guest", // Generic owner for guest uploads
          visibility: "public", // Make photos publicly accessible
        },
      );

      res.status(200).json({
        objectPath: objectPath,
        message: "Photo uploaded successfully"
      });
    } catch (error) {
      console.error("Error setting photo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

