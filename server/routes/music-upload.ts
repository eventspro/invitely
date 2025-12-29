// Direct-to-storage music upload using presigned URLs
import type { Express } from "express";
import { CloudflareR2Storage } from "../r2Storage.js";
import { authenticateUser, requireAdminPanelAccess } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";
import { randomUUID } from "crypto";

const r2Storage = new CloudflareR2Storage();

export function registerMusicUploadRoutes(app: Express) {
  
  // Step 1: Get presigned URL for direct upload
  app.post("/api/templates/:templateId/music/presigned-url", uploadLimiter, authenticateUser, requireAdminPanelAccess, async (req, res) => {
    try {
      const { templateId } = req.params;
      const { filename, contentType } = req.body;
      
      if (!filename || !contentType) {
        return res.status(400).json({ error: 'Filename and contentType required' });
      }
      
      // Validate audio file type
      if (!contentType.includes('audio')) {
        return res.status(400).json({ error: 'File must be an audio file' });
      }
      
      // Generate unique filename
      const ext = filename.split('.').pop() || 'mp3';
      const uniqueFilename = `${templateId}-music-${Date.now()}-${randomUUID()}.${ext}`;
      
      console.log(`🎵 Generating presigned URL for: ${uniqueFilename}`);
      
      // Get presigned URL from R2
      const { url, fields } = await r2Storage.getPresignedUploadUrl(
        templateId,
        uniqueFilename,
        contentType,
        'music'
      );
      
      res.json({
        uploadUrl: url,
        fields,
        filename: uniqueFilename,
        servingUrl: `/api/audio/serve/${uniqueFilename}`
      });
      
    } catch (error) {
      console.error('Presigned URL error:', error);
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  });
  
  // Step 2: Confirm upload completion (optional - for tracking)
  app.post("/api/templates/:templateId/music/confirm-upload", uploadLimiter, authenticateUser, requireAdminPanelAccess, async (req, res) => {
    try {
      const { templateId } = req.params;
      const { filename } = req.body;
      
      console.log(`✅ Music upload confirmed: ${filename} for template ${templateId}`);
      
      res.json({ 
        success: true,
        servingUrl: `/api/audio/serve/${filename}`
      });
      
    } catch (error) {
      console.error('Upload confirmation error:', error);
      res.status(500).json({ error: 'Failed to confirm upload' });
    }
  });
}
