import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerMusicUploadRoutes } from "./routes/music-upload.js";
import { registerManifestRoutes } from "./routes/manifest.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import path from "path";

// Simple logging function
const log = (message: string) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

// Environment variable validation
function validateEnvironment() {
  const requiredEnvVars = ['PORT'];
  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}. Using defaults where possible.`);
  }
  
  // Set NODE_ENV default if not provided
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }
  
  return {
    port: parseInt(process.env.PORT || '5001', 10),
    nodeEnv: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === 'production'
  };
}

const app = express();

// Security middleware for production
if (process.env.NODE_ENV === 'production') {
  // Trust proxy for Vercel
  app.set('trust proxy', 1);
  
  // Enhanced HTTPS redirect and SSL-safe headers
  app.use((req, res, next) => {
    // Force HTTPS redirect with proper status code
    const proto = req.header('x-forwarded-proto') || req.protocol || 'http';
    if (proto !== 'https') {
      const httpsUrl = `https://${req.header('host')}${req.originalUrl}`;
      console.log(`🔒 Forcing HTTPS redirect: ${req.originalUrl} -> ${httpsUrl}`);
      return res.redirect(301, httpsUrl);
    }
    
    // Enhanced security headers for SSL compatibility
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    
    // SSL-specific headers
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    
    next();
  });
}

// Add compression middleware for better performance and SSL compatibility  
// Note: Compression is handled by Vercel in production, but adding for local testing

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Apply general API rate limiting (100 requests per 15 minutes)
app.use('/api', apiLimiter);

// Health check endpoint for deployment monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0'
  });
});

// Test endpoint to verify server and database connection
app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasDatabase: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...'
  });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Validate environment variables first
    const env = validateEnvironment();
    
    const server = await registerRoutes(app);
    
    // Register admin routes
    registerAdminRoutes(app);
    
    // Register music upload routes (presigned URLs for fast uploads)
    registerMusicUploadRoutes(app);
    
    // Register manifest routes (dynamic manifest.json generation)
    registerManifestRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error('Server error:', err);
    });

    // Use NODE_ENV directly for better production detection
    if (env.nodeEnv === "development") {
      // Only import vite in development to avoid bundling it in production
      const { setupVite } = await import("./vite.js");
      await setupVite(app, server);
    } else {
      // In production on Vercel, static files are handled by Vercel routing
      // Only set up the catch-all for SPA routing if needed
      
      // Serve static files only if running locally in production mode
      if (!process.env.VERCEL) {
        const staticPath = path.join(process.cwd(), "dist/public");
        app.use(express.static(staticPath));
        
        // Handle SPA routing - serve index.html for non-API routes
        app.get("*", (_req, res) => {
          res.sendFile(path.join(staticPath, "index.html"));
        });
      }
      // On Vercel, routing is handled by vercel.json
    }

    // Export for Vercel serverless or start server for local development
    if (process.env.VERCEL) {
      // On Vercel, just export the app - don't start a server
      log('Running on Vercel - exporting handler');
    } else {
      // Local development - start the server
      const startServer = () => {
        return new Promise<void>((resolve, reject) => {
          const serverInstance = server.listen(env.port, "0.0.0.0", () => {
            log(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
            resolve();
          });
          
          serverInstance.on('error', (error: any) => {
            if (error.code === 'EADDRINUSE') {
              reject(new Error(`Port ${env.port} is already in use`));
            } else {
              reject(error);
            }
          });
          
          // Set timeout for server startup
          const timeoutId = setTimeout(() => {
            reject(new Error('Server startup timeout'));
          }, 15000); // 15 second timeout for serverless
          
          serverInstance.on('listening', () => {
            clearTimeout(timeoutId);
          });
        });
      };
      
      await startServer();
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
})();

// Export the Express app for Vercel
export default app;
