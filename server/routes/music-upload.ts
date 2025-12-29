// Streaming music upload to R2 (no CORS issues, fast streaming)
import type { Express } from "express";
import { r2Storage } from "../r2Storage.js";
import { authenticateUser, requireAdminPanelAccess } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";
import { randomUUID } from "crypto";
import multer from "multer";
import { Readable } from "stream";

// Use memory storage for streaming (don't save to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024 // 4MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

export function registerMusicUploadRoutes(app: Express) {
  
  // Streaming upload to R2 (bypasses CORS, uses server as proxy)
  app.post("/api/templates/:templateId/music/stream-upload", uploadLimiter, authenticateUser, requireAdminPanelAccess, upload.single('music'), async (req, res) => {
    try {
      const { templateId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ error: 'No music file uploaded' });
      }
      
      // Validate audio file type
      if (!req.file.mimetype.includes('audio')) {
        return res.status(400).json({ error: 'File must be an audio file (MP3)' });
      }
      
      // Generate unique filename
      const ext = req.file.originalname.split('.').pop() || 'mp3';
      const uniqueFilename = `${templateId}-music-${Date.now()}-${randomUUID()}.${ext}`;
      
      console.log(`🎵 Streaming music to R2: ${uniqueFilename} (${req.file.size} bytes)`);
      
      // Upload to R2 storage
      const result = await r2Storage.uploadImage(
        templateId,
        req.file.buffer,
        uniqueFilename,
        req.file.mimetype,
        'music'
      );
      
      console.log(`✅ Music uploaded to R2: ${result.url}`);
      
      res.json({
        success: true,
        url: result.url, // Use R2 public URL directly
        filename: result.filename,
        size: req.file.size
      });
      
    } catch (error) {
      console.error('Music upload error:', error);
      res.status(500).json({ error: 'Failed to upload music' });
    }
  });
  
  // Delete music from R2 storage
  app.delete("/api/templates/:templateId/music/:filename", uploadLimiter, authenticateUser, requireAdminPanelAccess, async (req, res) => {
    try {
      const { templateId, filename } = req.params;
      
      console.log(`🗑️ Deleting music from R2: ${filename}`);
      
      // Delete from R2 storage
      await r2Storage.deleteImage(templateId, filename, 'music');
      
      console.log(`✅ Music deleted from R2: ${filename}`);
      
      res.json({
        success: true,
        message: 'Music deleted successfully'
      });
      
    } catch (error) {
      console.error('Music deletion error:', error);
      res.status(500).json({ error: 'Failed to delete music' });
    }
  });
}
