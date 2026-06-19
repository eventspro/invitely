// Streaming music upload to R2 (no CORS issues, fast streaming)
import type { Express } from "express";
import { r2Storage } from "../r2Storage.js";
import { storage } from "../storage.js";
import { authenticateUser, requireAdminPanelAccess } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";
import multer from "multer";

// Use memory storage for streaming (do not save music to local disk).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024,
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"), false);
    }
  },
});

function safeDecodeFilename(filename: string): string {
  try {
    return decodeURIComponent(filename);
  } catch {
    return filename;
  }
}

function isSafeStorageFilename(filename: string): boolean {
  return filename.length > 0 && !filename.includes("/") && !filename.includes("\\") && !filename.includes("\0");
}

function filenameFromUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value, "http://localhost");
    const segment = url.pathname.split("/").filter(Boolean).pop();
    return segment ? safeDecodeFilename(segment) : null;
  } catch {
    const segment = value.split("?")[0].split("#")[0].split("/").filter(Boolean).pop();
    return segment ? safeDecodeFilename(segment) : null;
  }
}

function clearMusicConfigForFilename(config: unknown, filename: string) {
  const currentConfig = (config && typeof config === "object" ? config : {}) as Record<string, any>;
  const currentMusic = (currentConfig.music && typeof currentConfig.music === "object" ? currentConfig.music : {}) as Record<string, any>;
  const currentAudioFilename = filenameFromUrl(currentMusic.audioUrl);

  if (currentAudioFilename !== filename) {
    return {
      config: currentConfig,
      clearedFields: [] as string[],
      matchedCurrentMusic: false,
    };
  }

  const nextMusic = { ...currentMusic };
  const clearedFields: string[] = [];

  if ("audioUrl" in nextMusic) {
    delete nextMusic.audioUrl;
    clearedFields.push("music.audioUrl");
  }

  if (nextMusic.enabled !== false) {
    nextMusic.enabled = false;
    clearedFields.push("music.enabled");
  }

  return {
    config: {
      ...currentConfig,
      music: nextMusic,
    },
    clearedFields,
    matchedCurrentMusic: true,
  };
}

function isMissingStorageObjectError(error: unknown): boolean {
  const err = error as {
    name?: string;
    Code?: string;
    code?: string;
    message?: string;
    $metadata?: { httpStatusCode?: number };
  };

  return (
    err?.$metadata?.httpStatusCode === 404 ||
    err?.name === "NoSuchKey" ||
    err?.Code === "NoSuchKey" ||
    err?.code === "NoSuchKey" ||
    /NoSuchKey|not found|404/i.test(err?.message || "")
  );
}

export function registerMusicUploadRoutes(app: Express) {
  console.log("[routes] music upload routes mounted", {
    upload: "/api/templates/:templateId/music/stream-upload",
    legacyUploadAlias: "/api/templates/:templateId/music/upload",
    delete: "/api/templates/:templateId/music/:filename",
  });

  const uploadMusic = async (req: any, res: any) => {
    try {
      const { templateId } = req.params;

      console.log("[music-upload] route hit", { templateId, path: req.path });

      if (!templateId) {
        return res.status(400).json({ error: "Template ID required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No music file uploaded" });
      }

      if (!req.file.mimetype.includes("audio")) {
        return res.status(400).json({ error: "File must be an audio file (MP3)" });
      }

      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      console.log("[music-upload] streaming to R2", {
        templateId,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });

      const result = await r2Storage.uploadImage(
        templateId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "music",
      );

      console.log("[music-upload] uploaded", { templateId, filename: result.filename });

      res.json({
        success: true,
        url: result.url,
        filename: result.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    } catch (error) {
      console.error("[music-upload] error", error);
      res.status(500).json({ error: "Failed to upload music" });
    }
  };

  // Canonical streaming upload to R2.
  app.post(
    "/api/templates/:templateId/music/stream-upload",
    uploadLimiter,
    authenticateUser,
    requireAdminPanelAccess,
    upload.single("music"),
    uploadMusic,
  );

  // Backward-compatible alias. Keep one implementation so /upload and /stream-upload cannot diverge.
  app.post(
    "/api/templates/:templateId/music/upload",
    uploadLimiter,
    authenticateUser,
    requireAdminPanelAccess,
    upload.single("music"),
    uploadMusic,
  );

  app.delete("/api/templates/:templateId/music/:filename", uploadLimiter, authenticateUser, requireAdminPanelAccess, async (req, res) => {
    let storageDeleteAttempted = false;
    let storageDeleteSucceeded = false;
    let storageObjectMissing = false;

    try {
      const { templateId } = req.params;
      const filename = safeDecodeFilename(req.params.filename || "");

      console.log("[music-delete] route hit", { templateId, filename });

      if (!templateId) {
        return res.status(400).json({ error: "Template ID required" });
      }

      if (!isSafeStorageFilename(filename)) {
        return res.status(400).json({ error: "Valid filename required" });
      }

      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      if (r2Storage.isConfigured()) {
        storageDeleteAttempted = true;
        console.log("[music-delete] R2 delete attempted", { templateId, filename, category: "music" });

        try {
          await r2Storage.deleteImage(templateId, filename, "music");
          storageDeleteSucceeded = true;
          console.log("[music-delete] R2 delete succeeded", { templateId, filename });
        } catch (storageError) {
          if (!isMissingStorageObjectError(storageError)) {
            throw storageError;
          }

          storageObjectMissing = true;
          console.log("[music-delete] R2 object already missing", { templateId, filename });
        }
      } else if (process.env.NODE_ENV === "production") {
        console.error("[music-delete] R2 storage is not configured in production", { templateId, filename });
        return res.status(500).json({ error: "Music storage is not configured" });
      } else {
        console.warn("[music-delete] R2 storage is not configured; clearing template config only", { templateId, filename });
      }

      const { config, clearedFields, matchedCurrentMusic } = clearMusicConfigForFilename(template.config, filename);
      if (matchedCurrentMusic) {
        const updatedTemplate = await storage.updateTemplate(templateId, { config });
        if (!updatedTemplate) {
          return res.status(500).json({
            error: "Music storage delete completed, but failed to clear template config",
          });
        }

        console.log("[music-delete] template config cleared", { templateId, filename, clearedFields });
      } else {
        console.log("[music-delete] template config did not reference filename", { templateId, filename });
      }

      res.json({
        success: true,
        message: "Music removed successfully",
        filename,
        storageDeleteAttempted,
        storageDeleteSucceeded,
        storageObjectMissing,
        configCleared: matchedCurrentMusic,
        clearedFields,
      });
    } catch (error) {
      console.error("[music-delete] error", error);
      res.status(500).json({ error: "Failed to delete music" });
    }
  });
}
