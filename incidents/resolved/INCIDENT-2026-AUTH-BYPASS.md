# INCIDENT REPORT — Admin Panel Auth Bypass (Production)

**Severity:** CRITICAL  
**Status:** RESOLVED (code patched — not yet deployed)  
**Date detected:** 2026-03-03  
**Date resolved (code):** 2026-03-03  
**Affected component:** `server/middleware/auth.ts`, `server/routes/admin-panel.ts`, `server/index.ts`, `vercel.json`

---

## Root Cause

`VERCEL=1` is automatically injected by Vercel into **every** deployment environment (production, staging, preview).  
Both `authenticateUser` and `requireAdminPanelAccess` contained bypass conditions that evaluated `process.env.VERCEL === '1'` and immediately returned `next()` with a fake ultimate-plan admin user.  
A third fallback bypass in `requireAdminPanelAccess` also triggered on `NODE_ENV=production` or any Vercel env var, making it impossible to ever reach the real 403 deny on Vercel deployments.

## Impact

- All `/api/admin-panel/*` routes were publicly accessible without a valid JWT token.
- RSVP stats, guest names, and guest emails were returned to any anonymous caller.
- Hardcoded fallback JWT secret (`'your-super-secret-jwt-key-change-in-production'`) was in source and used when `JWT_SECRET` env var was absent.
- Full response bodies (including guestEmail/PII) were logged to Vercel log aggregation.

---

## Changes Applied

### 1. `server/middleware/auth.ts`

#### Fix A — Hard-fail on missing JWT_SECRET
```diff
-const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
+const JWT_SECRET = process.env.JWT_SECRET;
+if (!JWT_SECRET) {
+  throw new Error('JWT_SECRET environment variable is required. The server cannot start without it.');
+}
```

#### Fix B — Narrow Bypass 1 (`authenticateUser`) to local dev only
```diff
-    if (process.env.NODE_ENV === 'development' || process.env.VERCEL === '1') {
-      console.log('🔓 Development/Demo mode: Bypassing user authentication');
+    if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
+      console.log('🔓 Local dev mode: Bypassing user authentication');
```

#### Fix C — Narrow Bypass 2 (`requireAdminPanelAccess` top) to local dev only
```diff
-    if (process.env.NODE_ENV === 'development' || process.env.VERCEL === '1') {
-      console.log('🔓 Development/Demo mode: Bypassing admin panel authentication');
+    if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
+      console.log('🔓 Local dev mode: Bypassing admin panel authentication');
```

#### Fix D — Remove debug log leaking environment variables
```diff
-    console.log('[auth] requireAdminPanelAccess start', {
-      templateId,
-      userId: req.user?.id,
-      env: process.env.NODE_ENV,
-      vercel: process.env.VERCEL,
-      vercelUrl: process.env.VERCEL_URL,
-      nowRegion: process.env.NOW_REGION,
-    });
```

#### Fix E — Delete Bypass 3 entirely (vercel/prod fallback)
```diff
-      // Production bypass to unblock platform-admin initiated uploads...
-      const vercelEnv = process.env.VERCEL || process.env.VERCEL_URL || process.env.NOW_REGION;
-      const prodEnv = process.env.NODE_ENV === 'production';
-      if (vercelEnv || prodEnv) {
-        console.log('🔓 Bypassing admin panel access check (vercel/prod fallback)');
-        req.adminPanel = {
-          id: 'vercel-bypass',
-          userId: req.user?.id || null,
-          templateId,
-          orderId: null,
-          isActive: true,
-          templatePlan: 'ultimate'
-        };
-        return next();
-      }
-
-      console.log('[auth] admin panel access denied');
       return res.status(403).json({ 
         error: 'Admin panel access denied. Ultimate template purchase required.' 
       });
```

---

### 2. `server/routes/admin-panel.ts`

#### Kill-switch middleware added immediately after `const router = express.Router();`
```diff
+// Kill-switch: set DISABLE_ADMIN_PANEL=1 to shut down all admin-panel routes immediately
+router.use((_req, res, next) => {
+  if (process.env.DISABLE_ADMIN_PANEL === '1') {
+    return res.status(503).json({ error: 'Admin panel is temporarily disabled.' });
+  }
+  next();
+});
```

---

### 3. `server/index.ts`

#### Remove databaseUrlPrefix from public endpoints
```diff
 app.get("/api/test", (_req, res) => {
   res.status(200).json({
     message: "Server is running",
     timestamp: new Date().toISOString(),
     environment: env.nodeEnv,
     hasDatabase: !!process.env.DATABASE_URL,
-    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + "...",
   });
 });
```

#### Redact PII paths from response logger
```diff
-      if (capturedJsonResponse) {
-        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
-      }
+      // Redact response body for PII-sensitive endpoints
+      const isSensitivePath = /\/(rsvp|auth|login|register|password|reset|admin-panel)/.test(reqPath);
+      if (capturedJsonResponse && !isSensitivePath) {
+        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
+      }
```

---

### 4. `vercel.json`

#### Security headers added to both SPA catch-all routes (`/` and `/(.*)`)
```diff
-    { "src": "/", "dest": "/index.html" },
-    { "src": "/(.*)", "dest": "/index.html" }
+    {
+      "src": "/",
+      "dest": "/index.html",
+      "headers": {
+        "X-Frame-Options": "DENY",
+        "X-Content-Type-Options": "nosniff",
+        "X-XSS-Protection": "1; mode=block",
+        "Referrer-Policy": "strict-origin-when-cross-origin",
+        "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
+        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
+        "Content-Security-Policy": "default-src 'self'; ..."
+      }
+    },
+    {
+      "src": "/(.*)",
+      "dest": "/index.html",
+      "headers": { ...same headers... }
+    }
```

---

## Verification Checklist (before deploy)

- [ ] `JWT_SECRET` env var is set in Vercel project settings (production + staging)
- [ ] TypeScript compiles without errors: `npm run check`
- [ ] Dev server still works locally: `npm run dev` (bypass should still activate locally)
- [ ] Unauthenticated request to `/api/admin-panel/:id/dashboard` returns **401** on staging
- [ ] Authenticated request with valid JWT returns **200** on staging
- [ ] `/api/admin-panel/*` returns **503** when `DISABLE_ADMIN_PANEL=1` is set in Vercel env

## Prevention Measures

1. **CI guard:** Add a pre-deploy check that greps for `process.env.VERCEL` in auth middleware and fails if found outside of test files.
2. **Secret rotation:** Rotate `JWT_SECRET` in Vercel dashboard immediately after deploy (any tokens issued with the old hardcoded fallback are now invalid once the new code drops the fallback).
3. **Logging policy:** Never log response bodies on sensitive paths — enforced by the `isSensitivePath` regex above.
4. **Kill-switch discipline:** `DISABLE_ADMIN_PANEL=1` can be set in Vercel dashboard instantly without a redeploy to take admin panel offline.
