import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRsvpSchema } from "@shared/schema";
import { z } from "zod";
import { sendRsvpNotificationEmails, sendRsvpConfirmationEmail } from "./email";

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

  const httpServer = createServer(app);
  return httpServer;
}

