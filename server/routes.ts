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
import https from "https";
import { URL } from "url";

// Import new route modules
import authRoutes from './routes/auth.js';
import adminPanelRoutes from './routes/admin-panel.js';
import platformAdminRoutes from './routes/platform-admin.js';
import { registerTemplateRoutes } from './routes/templates.js';
import { registerTranslationsRoutes } from './routes/translations.js';
import { registerPricingRoutes } from './routes/pricing.js';
import { registerTranslationKeysRoutes } from './routes/translation-keys.js';
import { registerPlatformSettingsRoutes } from './routes/platform-settings.js';

// Configure multer for file uploads
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
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
  
  // Test route to verify Express is working
  app.get('/api/test-static', (req, res) => {
    console.log('🔧 Test static route accessed');
    res.json({ message: 'Express static route working', timestamp: new Date().toISOString() });
  });
  
  // Static files that should NEVER require authentication
  // These routes handle cases where Vercel routing doesn't work as expected
  app.get('/manifest.json', (req, res) => {
    console.log('🔧 Manifest.json requested - serving directly from Express');
    try {
      const manifestPath = path.join(process.cwd(), 'dist/public/manifest.json');
      console.log(`📁 Looking for manifest at: ${manifestPath}`);
      if (fs.existsSync(manifestPath)) {
        console.log('✅ Manifest found, serving file');
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.sendFile(manifestPath);
      } else {
        console.log('❌ Manifest not found at path');
        res.status(404).json({ error: 'Manifest not found' });
      }
    } catch (error) {
      console.error('💥 Error serving manifest:', error);
      res.status(500).json({ error: 'Failed to serve manifest' });
    }
  });
  
  app.get('/favicon.png', (req, res) => {
    try {
      const faviconPath = path.join(process.cwd(), 'dist/public/favicon.png');
      if (fs.existsSync(faviconPath)) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.sendFile(faviconPath);
      } else {
        res.status(404).send('Favicon not found');
      }
    } catch (error) {
      res.status(500).send('Failed to serve favicon');
    }
  });
  
  // Register authentication routes
  app.use('/api/auth', authRoutes);
  
  // Register admin panel routes (for Ultimate template customers)
  app.use('/api/admin-panel', adminPanelRoutes);
  
  // Register platform admin routes (for platform owner)
  app.use('/api/platform-admin', platformAdminRoutes);
  
  // Register template routes (for template-specific endpoints)
  registerTemplateRoutes(app);
  
  // Register translations routes
  registerTranslationsRoutes(app);
  
  // Register pricing routes
  registerPricingRoutes(app);
  
  // Register translation keys routes
  registerTranslationKeysRoutes(app);
  
  // Register platform settings routes
  registerPlatformSettingsRoutes(app);
  
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
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        console.error('Maintenance status request timeout');
        res.status(408).json({ message: "Request timeout", enabled: false });
      }
    }, 5000); // 5 second timeout

    try {
      console.log(`🔧 Checking maintenance status - DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
      
      const status = await Promise.race([
        storage.getMaintenanceStatus(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 3000))
      ]) as boolean;
      
      console.log(`✅ Maintenance status retrieved: ${status}`);
      clearTimeout(timeoutId);
      if (!res.headersSent) {
        res.json({ enabled: status });
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("❌ Get maintenance status error details:", error);
      console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack available');
      console.error("❌ Database URL available:", !!process.env.DATABASE_URL);
      
      if (!res.headersSent) {
        // Return a safe fallback instead of 500 error
        res.json({ 
          enabled: false, // Safe default
          warning: "Database unavailable, using fallback"
        });
      }
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

  // Gallery/Love Story photo upload endpoint (R2-enabled)
  app.post("/api/photos/upload", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const { templateId, category = 'gallery' } = req.body;
        
      if (!templateId) {
        return res.status(400).json({ error: 'Template ID is required' });
      }

      console.log('📸 Gallery photo upload started:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        templateId,
        category
      });

      let imageUrl = `/api/images/serve/${req.file.filename}`; // Default fallback
      let useR2 = false;
      
      // Try R2 upload in production if configured
      if (process.env.VERCEL) {
        try {
          if (process.env.CLOUDFLARE_R2_BUCKET_NAME && 
              process.env.CLOUDFLARE_R2_ACCOUNT_ID &&
              process.env.CLOUDFLARE_R2_ACCESS_KEY &&
              process.env.CLOUDFLARE_R2_SECRET_KEY &&
              process.env.CLOUDFLARE_R2_PUBLIC_URL) {
            
            const { r2Storage } = await import('./r2Storage.js');
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
              console.log(`☁️ Gallery image uploaded to R2: ${r2Result.url}`);
              useR2 = true;
              
              // Clean up local temp file
              fs.unlinkSync(req.file.path);
            }
          } else {
            console.log('⚠️ R2 environment variables not configured for gallery upload');
          }
        } catch (r2Error) {
          console.warn('⚠️ R2 gallery upload failed, using local storage:', r2Error);
        }
      }
      
      // Create image record in database
      const imageRecord = await storage.createImage({
        templateId,
        url: imageUrl,
        name: req.file.originalname,
        category,
        size: req.file.size.toString(),
        mimeType: req.file.mimetype,
        order: "0"
      });
      
      console.log(`✅ Gallery image upload complete: ${req.file.filename} for template ${templateId}, R2: ${useR2}`);
      
      res.json({
        id: imageRecord.id,
        url: imageUrl,
        name: req.file.originalname,
        size: req.file.size,
        category,
        templateId
      });
      
    } catch (error) {
      console.error('💥 Gallery photo upload error:', error);
      console.error("💥 Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('🧹 Cleaned up gallery upload file');
        } catch (cleanupError) {
          console.error('🧹 Failed to cleanup gallery file:', cleanupError);
        }
      }
      
      // Ensure JSON response
      res.setHeader('Content-Type', 'application/json');
      const errorResponse = { 
        success: false,
        error: "Gallery photo upload failed", 
        message: error instanceof Error ? error.message : 'Unknown error during gallery upload',
        timestamp: new Date().toISOString()
      };
      
      console.log('📤 Sending gallery error response:', errorResponse);
      res.status(500).json(errorResponse);
    }
  });

  // Upload image for a specific template (legacy endpoint)
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
      console.error('💥 Legacy image upload error:', error);
      console.error("💥 Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('🧹 Cleaned up legacy upload file');
        } catch (cleanupError) {
          console.error('🧹 Failed to cleanup legacy file:', cleanupError);
        }
      }
      
      // Ensure JSON response
      res.setHeader('Content-Type', 'application/json');
      const errorResponse = { 
        success: false,
        error: "Image upload failed", 
        message: error instanceof Error ? error.message : 'Unknown error during image upload',
        timestamp: new Date().toISOString()
      };
      
      console.log('📤 Sending legacy error response:', errorResponse);
      res.status(500).json(errorResponse);
    }
  });

  // Serve uploaded images with SSL/TLS safety
  app.get("/api/images/serve/:filename", (req, res) => {
    const startTime = Date.now();
    const { filename } = req.params;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const isIncognito = req.get('DNT') === '1' || req.get('Sec-GPC') === '1' || 
                       userAgent.includes('HeadlessChrome') || 
                       !req.get('Accept-Language');
    
    console.log(`🖼️ Image request: ${filename} from ${clientIP} (incognito: ${isIncognito})`);
    
    try {
      // HTTPS enforcement - critical for SSL issues
      if (process.env.NODE_ENV === 'production' && req.get('x-forwarded-proto') !== 'https') {
        const httpsUrl = `https://${req.get('host')}${req.originalUrl}`;
        console.log(`🔒 Redirecting HTTP to HTTPS: ${httpsUrl}`);
        return res.redirect(301, httpsUrl);
      }
      
      // Validate filename to prevent directory traversal
      if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        console.log(`❌ Invalid filename: ${filename}`);
        return res.status(400).json({ error: 'Invalid filename' });
      }
      
      // Check if this is a template-scoped image (new format: templateId-image-timestamp-random.ext)
      const templateMatch = filename.match(/^([a-f0-9-]{36})-/);
      let filePath: string;
      
      if (templateMatch) {
        // Template-scoped image: look in uploads/templateId/filename
        const templateId = templateMatch[1];
        const baseUploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
        filePath = path.join(baseUploadsDir, templateId, filename);
      } else {
        // Legacy image: look in uploads/filename
        const baseUploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
        filePath = path.join(baseUploadsDir, filename);
      }
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Image not found at ${filePath}, serving placeholder`);
        
        // For demo purposes, serve a default image from attached_assets
        // Check multiple possible locations for the placeholder
        const possiblePaths = [
          path.join(process.cwd(), 'attached_assets', 'default-wedding-couple.jpg'),
          path.join(process.cwd(), 'dist', 'attached_assets', 'default-wedding-couple.jpg'),
          path.join(process.cwd(), 'dist/attached_assets/default-wedding-couple.jpg')
        ];
        
        let placeholderPath = null;
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            placeholderPath = possiblePath;
            console.log(`✅ Found placeholder at: ${possiblePath}`);
            break;
          } else {
            console.log(`❌ No placeholder at: ${possiblePath}`);
          }
        }
        
        if (placeholderPath) {
          return serveImageFile(req, res, placeholderPath, 'default-wedding-couple.jpg', startTime, isIncognito);
        }
        
        console.log(`❌ SSL Error - Image not found: ${filename} from ${clientIP}`);
        return res.status(404).json({ error: "Image not found and no placeholder available" });
      }
      
      return serveImageFile(req, res, filePath, filename, startTime, isIncognito);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ SSL Error serving image ${filename}: ${error instanceof Error ? error.message : String(error)} (${duration}ms, incognito: ${isIncognito})`);
      
      // Set proper error headers to prevent SSL issues
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'close'); // Important for SSL error recovery
      
      res.status(500).json({ 
        error: "Failed to serve image", 
        timestamp: new Date().toISOString(),
        requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });
    }
  });
  
  // Helper function to serve image files with SSL-safe headers
  function serveImageFile(req: any, res: any, filePath: string, filename: string, startTime: number, isIncognito: boolean) {
    try {
      // Get file stats for Content-Length (important for SSL)
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      
      // Determine content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.bmp': 'image/bmp',
        '.tiff': 'image/tiff',
        '.tif': 'image/tiff'
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      // Set SSL-safe headers BEFORE sending data
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', fileSize.toString()); // Critical for SSL
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      res.setHeader('Last-Modified', stats.mtime.toUTCString());
      res.setHeader('ETag', `"${stats.mtime.getTime()}-${fileSize}"`);
      
      // CORS headers for cross-origin requests
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control');
      
      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      
      // Compression headers (let middleware handle actual compression)
      res.setHeader('Vary', 'Accept-Encoding');
      
      // Handle conditional requests
      const ifModifiedSince = req.get('If-Modified-Since');
      const ifNoneMatch = req.get('If-None-Match');
      
      if (ifModifiedSince && new Date(ifModifiedSince) >= stats.mtime) {
        res.status(304).end();
        const duration = Date.now() - startTime;
        console.log(`✅ 304 Not Modified: ${filename} (${duration}ms, incognito: ${isIncognito})`);
        return;
      }
      
      if (ifNoneMatch && ifNoneMatch === `"${stats.mtime.getTime()}-${fileSize}"`) {
        res.status(304).end();
        const duration = Date.now() - startTime;
        console.log(`✅ 304 Not Modified (ETag): ${filename} (${duration}ms, incognito: ${isIncognito})`);
        return;
      }
      
      // Create read stream with error handling
      const stream = fs.createReadStream(filePath);
      
      stream.on('error', (streamError) => {
        const duration = Date.now() - startTime;
        console.error(`❌ Stream error for ${filename}: ${streamError.message} (${duration}ms, incognito: ${isIncognito})`);
        
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to read image file' });
        }
      });
      
      stream.on('end', () => {
        const duration = Date.now() - startTime;
        console.log(`✅ Image served: ${filename} (${fileSize} bytes, ${duration}ms, incognito: ${isIncognito})`);
      });
      
      // Pipe the stream to response
      stream.pipe(res);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Error in serveImageFile for ${filename}: ${error instanceof Error ? error.message : String(error)} (${duration}ms, incognito: ${isIncognito})`);
      
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to serve image file' });
      }
    }
  }

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
          const baseUploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
          const filePath = path.join(baseUploadsDir, filename);
          
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
      
      // Try multiple possible locations for the asset
      const possiblePaths = [
        path.join(process.cwd(), 'client', 'public', 'attached_assets', filename),
        path.join(process.cwd(), 'attached_assets', filename),
        path.join(process.cwd(), 'dist', 'client', 'public', 'attached_assets', filename),
      ];
      
      let filePath: string | null = null;
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          filePath = possiblePath;
          break;
        }
      }
      
      if (!filePath) {
        console.log(`❌ Asset not found: ${filename}`);
        console.log('Searched paths:', possiblePaths);
        return res.status(404).json({ error: "Image not found" });
      }
      
      // Determine content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
      };
      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      console.log(`✅ Serving asset: ${filename} from ${filePath}`);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).json({ error: "Failed to serve image" });
    }
  });

  // Template endpoints
  app.get("/api/templates", async (req, res) => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        console.error('Templates list request timeout');
        res.status(408).json({ error: "Request timeout" });
      }
    }, 6000); // 6 second timeout

    try {
      console.log(`📋 Getting all templates`);
      console.log(`📋 Database URL set: ${!!process.env.DATABASE_URL}`);
      console.log(`📋 Environment: ${process.env.NODE_ENV}`);
      
      const allTemplates = await Promise.race([
        storage.getAllTemplates(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 4000))
      ]) as any[];
      
      console.log(`📊 Raw templates count: ${allTemplates?.length || 0}`);
      
      // Filter to show only main templates (exclude clones)
      const mainTemplates = allTemplates.filter(template => template.isMain === true);
      
      console.log(`📊 Found ${allTemplates.length} total templates, ${mainTemplates.length} main templates`);
      clearTimeout(timeoutId);
      if (!res.headersSent) {
        res.json(mainTemplates);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("❌ Failed to get templates:", error);
      console.error("❌ Error stack:", error?.stack);
      console.error("❌ Error message:", error?.message);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: "Failed to get templates",
          message: error?.message || 'Unknown error',
          details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        });
      }
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
      let allImages: any[] = [];
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

  // SSL-Safe Audio Serving Endpoint with Range Request Support (Proxy Method)
  async function serveAudioFile(filename: string, req: any, res: any) {
    const startTime = Date.now();
    const userAgent = req.get('User-Agent') || 'unknown';
    const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';
    
    // Enhanced incognito mode detection for audio requests
    const isIncognito = req.get('DNT') === '1' || req.get('Sec-GPC') === '1' || 
                       userAgent.includes('HeadlessChrome') || 
                       !req.get('Accept-Language') ||
                       userAgent.includes('Private');

    console.log(`🎵 Audio request: ${filename} from ${clientIP} (incognito: ${isIncognito}, UA: ${userAgent})`);

    try {
      // Validate filename to prevent directory traversal
      if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        console.log(`❌ Invalid audio filename: ${filename}`);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'close');
        return res.status(400).json({ error: 'Invalid filename' });
      }

      // Use Vercel's internal static serving but proxy through our endpoint for SSL-safe headers
      const staticAssetUrl = `/attached_assets/${filename}`;
      console.log(`🎵 Proxying static asset: ${staticAssetUrl}`);
      
      // Check if we can access the file locally first (for development)
      // Include uploads directory for user-uploaded music files
      const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'attached_assets', filename),
        path.join(process.cwd(), 'public', 'audio', filename),
        path.join(process.cwd(), 'attached_assets', filename),
        // Check in uploads directory (including subdirectories)
        path.join(uploadsDir, filename)
      ];

      // Also check in template-specific upload directories
      if (fs.existsSync(uploadsDir)) {
        const subdirs = fs.readdirSync(uploadsDir).filter(item => {
          const itemPath = path.join(uploadsDir, item);
          return fs.statSync(itemPath).isDirectory();
        });
        subdirs.forEach(subdir => {
          possiblePaths.push(path.join(uploadsDir, subdir, filename));
        });
      }

      let filePath;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          filePath = testPath;
          break;
        }
      }

      if (!filePath) {
        console.log(`❌ Audio file not found: ${filename} (checked ${possiblePaths.length} locations)`);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'close');
        return res.status(404).json({ error: 'Audio file not found' });
      }

      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      
      // Get content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'audio/mpeg'; // Default for MP3
      if (ext === '.mp4') contentType = 'audio/mp4';
      else if (ext === '.wav') contentType = 'audio/wav';
      else if (ext === '.ogg') contentType = 'audio/ogg';
      else if (ext === '.m4a') contentType = 'audio/mp4';
      else if (ext === '.flac') contentType = 'audio/flac';

      // Parse range header for partial content requests (critical for audio streaming)
      const range = req.headers.range;
      console.log(`🎵 Range header: ${range || 'none'} for ${filename}`);

      if (range) {
        // Handle range requests (HTTP 206 Partial Content)
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;

        console.log(`🎵 Serving range: ${start}-${end}/${fileSize} (${chunksize} bytes) for ${filename}`);

        // Critical SSL headers for range requests - set BEFORE any data transmission
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunksize.toString()); // CRITICAL for SSL
        res.setHeader('Content-Type', contentType);
        
        // Enhanced SSL-safe headers for audio streaming
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Last-Modified', stats.mtime.toUTCString());
        res.setHeader('ETag', `"${stats.mtime.getTime()}-${fileSize}"`);
        
        // Security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        
        // CORS headers for cross-origin audio access
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Cache-Control');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
        
        // Additional headers for audio streaming reliability
        res.setHeader('Vary', 'Accept-Encoding, Range');
        
        // Handle conditional requests
        const ifModifiedSince = req.get('If-Modified-Since');
        const ifNoneMatch = req.get('If-None-Match');
        
        if (ifModifiedSince && new Date(ifModifiedSince) >= stats.mtime) {
          res.status(304).end();
          return;
        }
        
        if (ifNoneMatch && ifNoneMatch === `"${stats.mtime.getTime()}-${fileSize}"`) {
          res.status(304).end();
          return;
        }

        // Set status to 206 Partial Content
        res.status(206);

        // Create read stream for the requested range
        const stream = fs.createReadStream(filePath, { start, end });
        
        stream.on('error', (streamError) => {
          console.error(`❌ Audio stream error for ${filename}: ${streamError.message} (incognito: ${isIncognito})`);
          if (!res.headersSent) {
            res.setHeader('Connection', 'close');
            res.status(500).json({ error: 'Failed to stream audio file' });
          }
        });

        stream.on('end', () => {
          const duration = Date.now() - startTime;
          console.log(`✅ Audio range served: ${filename} (${chunksize} bytes, ${duration}ms, incognito: ${isIncognito})`);
        });

        // Pipe the stream to response
        stream.pipe(res);

      } else {
        // Serve complete file (no range header)
        console.log(`🎵 Serving complete audio file: ${filename} (${fileSize} bytes)`);

        // Critical SSL headers for complete file - set BEFORE any data transmission
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', fileSize.toString()); // CRITICAL for SSL
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Last-Modified', stats.mtime.toUTCString());
        res.setHeader('ETag', `"${stats.mtime.getTime()}-${fileSize}"`);

        // CORS headers for cross-origin audio access
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Cache-Control');
        res.setHeader('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Length');

        // Security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('Vary', 'Accept-Encoding');

        // Handle conditional requests for caching efficiency
        const ifModifiedSince = req.get('If-Modified-Since');
        const ifNoneMatch = req.get('If-None-Match');

        if (ifModifiedSince && new Date(ifModifiedSince) >= stats.mtime) {
          res.status(304).end();
          return;
        }

        if (ifNoneMatch && ifNoneMatch === `"${stats.mtime.getTime()}-${fileSize}"`) {
          res.status(304).end();
          return;
        }

        // Create read stream for complete file
        const stream = fs.createReadStream(filePath);

        stream.on('error', (streamError) => {
          console.error(`❌ Audio stream error for ${filename}: ${streamError.message} (incognito: ${isIncognito})`);
          if (!res.headersSent) {
            res.setHeader('Connection', 'close');
            res.status(500).json({ error: 'Failed to read audio file' });
          }
        });

        stream.on('end', () => {
          const duration = Date.now() - startTime;
          console.log(`✅ Complete audio served: ${filename} (${fileSize} bytes, ${duration}ms, incognito: ${isIncognito})`);
        });

        // Pipe the stream to response
        stream.pipe(res);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ SSL Error serving audio ${filename}: ${errorMessage} (incognito: ${isIncognito})`);
      
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'close'); // Important for SSL error recovery
        res.status(500).json({ 
          error: 'Failed to serve audio file',
          message: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
        });
      }
    }
  }

  // Test audio endpoint to verify route registration
  app.get("/api/audio/test", (req, res) => {
    console.log("🎵 Audio test endpoint hit");
    res.json({ message: "Audio endpoint is working", timestamp: new Date().toISOString() });
  });

  // Debug endpoint to list available files
  app.get("/api/audio/list", (req, res) => {
    console.log("🎵 Audio list endpoint hit");
    try {
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'attached_assets'),
        path.join(process.cwd(), 'public', 'audio'),
        path.join(process.cwd(), 'attached_assets')
      ];
      
      const files: any[] = [];
      for (const dir of possiblePaths) {
        if (fs.existsSync(dir)) {
          const dirFiles = fs.readdirSync(dir).filter(f => f.endsWith('.mp3'));
          files.push({ path: dir, files: dirFiles, exists: true });
        } else {
          files.push({ path: dir, files: [], exists: false });
        }
      }
      
      res.json({ 
        message: "Audio files scan", 
        timestamp: new Date().toISOString(),
        directories: files,
        cwd: process.cwd()
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Register translations routes
  registerTranslationsRoutes(app);

  // Audio serving endpoint with SSL-safe range request support
  app.get("/api/audio/serve/:filename", (req, res) => {
    console.log(`🎵 Audio serve endpoint hit for file: ${req.params.filename}`);
    console.log(`🎵 Full URL: ${req.originalUrl}`);
    console.log(`🎵 Method: ${req.method}`);
    const { filename } = req.params;
    serveAudioFile(filename, req, res);
  });

  // Handle OPTIONS preflight requests for CORS
  app.options("/api/audio/serve/:filename", (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Cache-Control');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(200).end();
  });

  const httpServer = createServer(app);
  return httpServer;
}
