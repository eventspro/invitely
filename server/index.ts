import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerMusicUploadRoutes } from "./routes/music-upload.js";
import { registerManifestRoutes } from "./routes/manifest.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import path from "path";

/* -------------------------------------------------------------------------- */
/* Helpers */
/* -------------------------------------------------------------------------- */

const log = (message: string) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

function validateEnvironment() {
  const requiredEnvVars = ["PORT"];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.warn(
      `Warning: Missing environment variables: ${missingVars.join(", ")}`
    );
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "production";
  }

  return {
    port: parseInt(process.env.PORT || "5001", 10),
    nodeEnv: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === "production",
    isVercel: !!process.env.VERCEL,
  };
}

/* -------------------------------------------------------------------------- */
/* App setup */
/* -------------------------------------------------------------------------- */

const app = express();
const env = validateEnvironment();

/* -------------------------------------------------------------------------- */
/* HTTPS enforcement — VERCEL ONLY */
/* -------------------------------------------------------------------------- */
/**
 * IMPORTANT:
 * - Vercel terminates SSL and sets `x-forwarded-proto=https`
 * - Local production does NOT have SSL
 * - Therefore HTTPS redirects must NEVER run locally
 */
if (env.isProduction && env.isVercel) {
  app.set("trust proxy", 1);

  app.use((req, res, next) => {
    const proto = req.header("x-forwarded-proto");
    if (proto !== "https") {
      const httpsUrl = `https://${req.headers.host}${req.originalUrl}`;
      log(`🔒 HTTPS redirect (Vercel): ${req.originalUrl}`);
      return res.redirect(301, httpsUrl);
    }
    next();
  });
}

/* -------------------------------------------------------------------------- */
/* Middleware */
/* -------------------------------------------------------------------------- */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

app.use("/api", apiLimiter);

/* -------------------------------------------------------------------------- */
/* Health & test */
/* -------------------------------------------------------------------------- */

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    environment: env.nodeEnv,
    vercel: env.isVercel,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/test", (_req, res) => {
  res.json({
    message: "Server is running",
    environment: env.nodeEnv,
    hasDatabase: !!process.env.DATABASE_URL,
  });
});

/* -------------------------------------------------------------------------- */
/* API logging */
/* -------------------------------------------------------------------------- */

app.use((req, res, next) => {
  const start = Date.now();
  let capturedJson: any;

  const originalJson = res.json;
  res.json = function (body, ...args) {
    capturedJson = body;
    return originalJson.call(this, body, ...args);
  };

  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const duration = Date.now() - start;
      log(
        `${req.method} ${req.path} ${res.statusCode} in ${duration}ms${
          capturedJson ? " :: " + JSON.stringify(capturedJson) : ""
        }`
      );
    }
  });

  next();
});

/* -------------------------------------------------------------------------- */
/* Bootstrap */
/* -------------------------------------------------------------------------- */

(async () => {
  try {
    const server = await registerRoutes(app);

    registerAdminRoutes(app);
    registerMusicUploadRoutes(app);
    registerManifestRoutes(app);

    app.use(
      (err: any, _req: Request, res: Response, _next: NextFunction) => {
        console.error("Server error:", err);
        res.status(err.status || 500).json({
          message: err.message || "Internal Server Error",
        });
      }
    );

    /* ---------------------------------------------------------------------- */
    /* Frontend handling */
    /* ---------------------------------------------------------------------- */

    if (env.nodeEnv === "development") {
      const { setupVite } = await import("./vite.js");
      await setupVite(app, server);
    } else {
      /**
       * Production local (NOT Vercel):
       * - Serve built assets
       * - SPA fallback
       */
      if (!env.isVercel) {
        const staticPath = path.join(process.cwd(), "dist/public");
        app.use(express.static(staticPath));

        app.get("*", (_req, res) => {
          res.sendFile(path.join(staticPath, "index.html"));
        });
      }
    }

    /* ---------------------------------------------------------------------- */
    /* Start server */
    /* ---------------------------------------------------------------------- */

    await new Promise<void>((resolve, reject) => {
      const instance = server.listen(env.port, "0.0.0.0", () => {
        log(
          `Server running on port ${env.port} (${env.nodeEnv}, vercel=${env.isVercel})`
        );
        resolve();
      });

      instance.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          reject(new Error(`Port ${env.port} is already in use`));
        } else {
          reject(err);
        }
      });
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
