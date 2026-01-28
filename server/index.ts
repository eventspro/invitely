import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import path from "path";

import { registerRoutes } from "./routes.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerMusicUploadRoutes } from "./routes/music-upload.js";
import { registerManifestRoutes } from "./routes/manifest.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

// Simple logging function
const log = (message: string) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

// Environment variable validation
function validateEnvironment() {
  const requiredEnvVars = ["PORT"];
  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    console.warn(
      `Warning: Missing environment variables: ${missingVars.join(
        ", ",
      )}. Using defaults where possible.`,
    );
  }

  // Default to development if not provided (safer locally)
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "development";
  }

  return {
    port: parseInt(process.env.PORT || "5001", 10),
    nodeEnv: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === "production",
  };
}

const env = validateEnvironment();
const app = express();

// Detect Vercel correctly
const isVercel = !!process.env.VERCEL;

// ✅ Only apply HTTPS redirect + proxy trust on Vercel production
if (env.isProduction && isVercel) {
  // Vercel sits behind a proxy
  app.set("trust proxy", 1);

  app.use((req, res, next) => {
    const xfProto = req.header("x-forwarded-proto");
    if (xfProto && xfProto !== "https") {
      const host = req.header("host");
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }

    // Security headers are fine on Vercel (HTTPS is real there)
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=()",
    );

    next();
  });
}

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Rate limit API
app.use("/api", apiLimiter);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    version: "1.0.0",
  });
});

// Test endpoint
app.get("/api/test", (_req, res) => {
  res.status(200).json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    hasDatabase: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + "...",
  });
});

// API request logger
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json.bind(res);
  res.json = (bodyJson: any) => {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 160) logLine = logLine.slice(0, 159) + "…";
      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    registerAdminRoutes(app);
    registerMusicUploadRoutes(app);
    registerManifestRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Server error:", err);
      res.status(status).json({ message });
    });

    if (env.nodeEnv === "development") {
      const { setupVite } = await import("./vite.js");
      await setupVite(app, server);
    } else {
      // Local production mode (NOT vercel): serve built frontend
      if (!isVercel) {
        const staticPath = path.join(process.cwd(), "dist/public");
        app.use(express.static(staticPath));
        app.get("*", (_req, res) => {
          res.sendFile(path.join(staticPath, "index.html"));
        });
      }
    }

    await new Promise<void>((resolve, reject) => {
      const serverInstance = server.listen(env.port, "0.0.0.0", () => {
        log(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
        resolve();
      });

      serverInstance.on("error", (error: any) => {
        if (error.code === "EADDRINUSE") {
          reject(new Error(`Port ${env.port} is already in use`));
        } else {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
