import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import helmet from "helmet";

import { registerRoutes } from "./routes.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerMusicUploadRoutes } from "./routes/music-upload.js";
import { registerManifestRoutes } from "./routes/manifest.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

// Structured security event logger — no PII fields
export const securityLog = (
  event: string,
  meta: { userId?: string; route?: string; templateId?: string; ip?: string; status?: number }
) => {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...meta }));
};

// Simple request logger
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

// Helmet — secure HTTP headers for all API responses
app.use("/api", helmet({
  contentSecurityPolicy: false, // CSP set manually below with Report-Only
  crossOriginEmbedderPolicy: false, // Disabled for wedding media embeds
}));

// CSP Report-Only — monitoring mode before enforcement
app.use("/api", (_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy-Report-Only',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https:",
      "media-src 'self' https: blob:",
      "frame-ancestors 'none'",
      `report-uri /api/csp-report`,
    ].join('; ')
  );
  next();
});

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Rate limit API
app.use("/api", apiLimiter);

// CSP violation report endpoint
app.post("/api/csp-report", express.json({ type: 'application/csp-report', limit: '50kb' }), (req, res) => {
  const report = req.body?.['csp-report'] || req.body;
  // Log structured — no PII
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    event: 'csp-violation',
    blockedUri: report?.['blocked-uri'],
    violatedDirective: report?.['violated-directive'],
    documentUri: report?.['document-uri'],
  }));
  res.status(204).end();
});

// Health check — minimal response, no env info
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Test endpoint — minimal response
app.get("/api/test", (_req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// API request logger — never logs request/response bodies on sensitive paths
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  // Determine sensitivity before capturing anything
  const isSensitivePath = /\/(rsvp|auth|login|register|password|reset|admin-panel|export|upload)/.test(reqPath);
  let capturedJsonResponse: Record<string, any> | undefined;

  if (!isSensitivePath) {
    const originalResJson = res.json.bind(res);
    res.json = (bodyJson: any) => {
      capturedJsonResponse = bodyJson;
      return originalResJson(bodyJson);
    };
  }

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
