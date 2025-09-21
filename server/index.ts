import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerAdminRoutes } from "./routes/admin";
import { setupVite, serveStatic, log } from "./vite";

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
  
  // Security headers
  app.use((req, res, next) => {
    // HTTPS redirect (handled by Vercel, but good to have)
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
      return;
    }
    
    // Security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    next();
  });
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

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

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error('Server error:', err);
    });

    // Use NODE_ENV directly for better production detection
    if (env.nodeEnv === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Simplified server.listen call with timeout handling
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
        setTimeout(() => {
          reject(new Error('Server startup timeout'));
        }, 30000); // 30 second timeout
      });
    };
    
    await startServer();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
