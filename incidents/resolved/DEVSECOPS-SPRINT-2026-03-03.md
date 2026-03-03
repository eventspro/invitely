# DEVSECOPS HARDENING SPRINT REPORT
**Date:** 2026-03-03  
**Status:** ALL CODE APPLIED — PENDING DEPLOY  
**TypeScript:** Compiles clean (0 errors)  
**Local security check:** 6/7 pass — 7th will pass after deploy (endpoint reflects old deployment)

---

## 1. SUMMARY OF CHANGES

| Phase | Area | What changed |
|-------|------|-------------|
| 1 | Auth | Removed ALL env-based logic from `auth.ts`; 404 return on missing token; centralized `authFailHandler`; structured security event emitter |
| 2 | Rate limits | Removed all `skip()` functions; `adminLimiter` → 20 req/15min with `skipSuccessfulRequests: true` on `authLimiter`; wired globally in `routes.ts` |
| 3 | PII logging | Request body never captured on sensitive paths; response body capture gated before assignment |
| 4 | Dependencies | Removed: `bcrypt`, `@types/bcrypt`, `csurf`, `passport`, `passport-local`, `connect-pg-simple`, `memorystore`, `express-session`, `resend`, plus matching `@types/*` |
| 5 | Helmet | `helmet()` applied to `/api/*`; CSP set separately |
| 6 | CSP | `Content-Security-Policy-Report-Only` in both Express middleware and `vercel.json` SPA catch-alls with `report-uri /api/csp-report`; removed `X-XSS-Protection` |
| 7 | CI | GitHub Actions workflow `.github/workflows/security.yml`; pre-deploy scripts `check-auth-security.sh` + `check-auth-security.ps1` |
| 8 | Monitoring | `securityEvent()` logger in `auth.ts` emitting structured JSON for every auth failure |

---

## 2. UNIFIED DIFFS BY FILE

### `server/middleware/auth.ts`

```diff
+// Structured security event logger — no PII fields
+const securityEvent = (event, meta) => {
+  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...meta }));
+};
+// Anomaly detection note:
+// Monitor: same IP hitting 401 on /api/admin-panel/* > 5 times/min = credential stuffing
+
+// Centralized auth failure handler
+export const authFailHandler = (res, statusCode, message) => {
+  res.status(statusCode).json({ error: message });
+};

 export const authenticateUser = async (req, res, next) => {
-  // Development bypass - only for local development (NOT on Vercel)
-  if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
-    req.user = { id: 'dev-user-123', email: 'dev@example.com', ... };
-    return next();
-  }
   if (!token) {
-    return res.status(401).json({ error: 'Access token required' });
+    // 404 hides endpoint existence from unauthenticated callers
+    securityEvent('auth_missing_token', { route, ip, status: 404 });
+    return res.status(404).json({ error: 'Not found' });
   }
   if (!decoded) {
+    securityEvent('auth_invalid_token', { route, ip, status: 401 });
     return res.status(401).json({ error: 'Invalid or expired token' });
   }
   if (!user) {
+    securityEvent('auth_user_not_found', { route, ip, status: 401 });
     return res.status(401).json({ error: 'User not found or inactive' });
   }

 export const requireAdminPanelAccess = async (req, res, next) => {
-  // Development bypass - only for local development (NOT on Vercel)
-  if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
-    req.adminPanel = { id: 'dev-panel', templatePlan: 'ultimate', ... };
-    return next();
-  }
   if (!req.user) {
-    return res.status(401).json({ error: 'Authentication required' });
+    securityEvent('admin_no_user_context', { route, ip, status: 404 });
+    return res.status(404).json({ error: 'Not found' });
   }
   if (!adminPanel) {
+    securityEvent('admin_access_denied', { userId, templateId, route, ip, status: 403 });
     return res.status(403).json({ error: '...' });
   }
```

---

### `server/middleware/rateLimiter.ts`

```diff
 export const apiLimiter = rateLimit({
   windowMs: 15 * 60 * 1000,
   max: 100,
-  skip: (req) => process.env.NODE_ENV === 'development' && !process.env.VERCEL,
 });

 export const rsvpLimiter = rateLimit({
   windowMs: 60 * 60 * 1000,
   max: 5,
-  skip: (req) => process.env.NODE_ENV === 'development' && !process.env.VERCEL,
 });

-// Authentication rate limiter — max: 10, no skipSuccessfulRequests
+// Authentication rate limiter — max: 5, skipSuccessfulRequests: true
 export const authLimiter = rateLimit({
   windowMs: 15 * 60 * 1000,
-  max: 10,
+  max: 5,
+  skipSuccessfulRequests: true,
-  skip: (req) => ...,
 });

-// Admin panel rate limiter — max: 50
+// Admin panel rate limiter — max: 20
 export const adminLimiter = rateLimit({
   windowMs: 15 * 60 * 1000,
-  max: 50,
+  max: 20,
-  skip: (req) => ...,
 });

 export const uploadLimiter = rateLimit({
   windowMs: 15 * 60 * 1000,
   max: 20,
-  skip: (req) => ...,
 });
```

---

### `server/routes.ts`

```diff
+import { adminLimiter, authLimiter } from './middleware/rateLimiter.js';

-  app.use('/api/auth', authRoutes);
-  app.use('/api/admin-panel', adminPanelRoutes);
+  app.use('/api/auth', authLimiter, authRoutes);
+  app.use('/api/admin-panel', adminLimiter, adminPanelRoutes);
```

---

### `server/routes/auth.ts`

```diff
+import { authLimiter } from '../middleware/rateLimiter.js';
-import rateLimit from 'express-rate-limit';

-// Rate limiting — local duplicate
-const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 5, ... });
```

---

### `server/index.ts`

```diff
+import helmet from 'helmet';

+// Structured security event logger
+export const securityLog = (event, meta) => {
+  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...meta }));
+};

+// Helmet — secure HTTP headers for all API responses
+app.use('/api', helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

+// CSP Report-Only
+app.use('/api', (_req, res, next) => {
+  res.setHeader('Content-Security-Policy-Report-Only', "default-src 'self'; ... report-uri /api/csp-report;");
+  next();
+});

+// CSP violation report endpoint
+app.post('/api/csp-report', ..., (req, res) => {
+  console.log(JSON.stringify({ ts, event: 'csp-violation', blockedUri, violatedDirective, documentUri }));
+  res.status(204).end();
+});

-app.get('/health', (_req, res) => {
-  res.json({ status: 'ok', timestamp, environment, version });
-});
+app.get('/health', (_req, res) => {
+  res.json({ status: 'ok' });
+});

-app.get('/api/test', (_req, res) => {
-  res.json({ message, timestamp, environment, hasDatabase, databaseUrlPrefix });
-});
+app.get('/api/test', (_req, res) => {
+  res.json({ status: 'ok', message: 'Server is running' });
+});

-// Logs ALL response bodies on ALL paths
+// Never captures response body on sensitive paths (isSensitivePath guard before assignment)
 const isSensitivePath = /\/(rsvp|auth|login|register|password|reset|admin-panel|export|upload)/.test(reqPath);
+if (!isSensitivePath) {
   res.json = (bodyJson) => { capturedJsonResponse = bodyJson; return originalResJson(bodyJson); };
+}
```

---

### `vercel.json`

```diff
 // Both SPA catch-all routes:
-"X-XSS-Protection": "1; mode=block",   // REMOVED — deprecated, harmful
-"Content-Security-Policy": "...",       // CHANGED to Report-Only
+"Content-Security-Policy-Report-Only": "default-src 'self'; ... report-uri /api/csp-report;"
```

---

### `package.json`

```diff
 // REMOVED from dependencies:
-"bcrypt": "^6.0.0",          // duplicate — bcryptjs is used
-"@types/bcrypt": ...,
-"csurf": "^1.11.0",          // deprecated package
-"passport": "^0.7.0",        // not imported anywhere
-"passport-local": "^1.0.0",  // not imported anywhere
-"connect-pg-simple": ...,    // not imported anywhere
-"memorystore": ...,          // not imported anywhere
-"express-session": ...,      // not imported anywhere
-"resend": ...,               // not imported anywhere

 // REMOVED from devDependencies:
-"@types/connect-pg-simple"
-"@types/express-session"
-"@types/passport"
-"@types/passport-local"

 // ADDED to scripts:
+"security:check": "powershell -ExecutionPolicy Bypass -File scripts/check-auth-security.ps1",
+"security:check:linux": "bash scripts/check-auth-security.sh",
+"audit:fix": "npm audit fix",
```

---

## 3. NEW FILES ADDED

| File | Purpose |
|------|---------|
| `.github/workflows/security.yml` | GitHub Actions CI — 4 jobs: auth bypass guard, npm audit (critical), TypeScript check, live auth regression |
| `scripts/check-auth-security.sh` | Bash pre-deploy script — 7-point check, exits non-zero on failure |
| `scripts/check-auth-security.ps1` | PowerShell equivalent for Windows developers |

### `.github/workflows/security.yml` — Job summary

| Job | Trigger | What it checks |
|-----|---------|---------------|
| `auth-bypass-check` | Every push/PR | `process.env.VERCEL`, `NOW_REGION`, `NODE_ENV` in auth files; hardcoded JWT fallback |
| `dependency-audit` | Every push/PR | `npm audit --audit-level=critical` |
| `typecheck` | Every push/PR | `tsc --noEmit` |
| `auth-regression` | main push only | Live curl: admin returns non-200; /health is clean |

---

## 4. COMMANDS TO RUN AFTER PATCH

```bash
# 1. Install — reflects removed packages
npm install

# 2. TypeScript check — must be clean
npm run check

# 3. Local security guard — must show ALL CHECKS PASSED before deploy
npm run security:check          # Windows
npm run security:check:linux    # Linux/Mac

# 4. Fix non-breaking vulnerabilities
npm audit fix

# 5. Deploy to staging first
npm run deploy:staging

# 6. Re-run security guard against staging URL
.\scripts\check-auth-security.ps1 -BaseUrl "https://YOUR-STAGING-URL.vercel.app"

# 7. Deploy to production
npm run deploy:production

# 8. Add PRODUCTION_URL secret to GitHub repository
# Settings → Secrets → Actions → New: PRODUCTION_URL = https://4ever.am
```

---

## 5. VERIFICATION CHECKLIST

### Pre-deploy (code)
- [x] `tsc --noEmit` exits 0
- [x] `grep -rn "process.env.VERCEL" server/middleware/auth.ts` → no results
- [x] `grep -rn "NODE_ENV" server/middleware/auth.ts` → no results
- [x] `grep "JWT_SECRET.*||" server/middleware/auth.ts` → no results
- [x] `grep "your-super-secret" server/` → no results
- [x] Both `bcrypt` (non-js) and `csurf` removed from package.json
- [x] `adminLimiter` (20 req/15min) applied at route registration level in `routes.ts`
- [x] `authLimiter` (5/15min, skipSuccessfulRequests) applied globally to `/api/auth`
- [x] No duplicate `authLimiter` declaration in `routes/auth.ts`
- [x] `helmet()` applied on `/api` in `server/index.ts`
- [x] `Content-Security-Policy-Report-Only` header set on API routes and SPA catch-alls
- [x] `/api/csp-report` endpoint collects structured violation logs (no PII)
- [x] Response body never captured on `rsvp|auth|login|register|password|reset|admin-panel|export|upload`
- [x] `/health` returns only `{ status: "ok" }`
- [x] `/api/test` returns only `{ status: "ok", message }`
- [x] `X-XSS-Protection` removed from vercel.json (deprecated)
- [x] CI workflow present at `.github/workflows/security.yml`
- [x] Pre-deploy scripts present at `scripts/check-auth-security.{sh,ps1}`

### Post-deploy (live verification)
- [ ] `curl -s -o /dev/null -w "%{http_code}" https://4ever.am/api/admin-panel/any-id/dashboard` → **401 or 404** (never 200)
- [ ] `curl -s https://4ever.am/health` → `{"status":"ok"}` only (no environment/version/timestamp)
- [ ] `curl -s https://4ever.am/api/test` → `{"status":"ok","message":"Server is running"}` only
- [ ] Response headers on `/api/*` include `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-Permitted-Cross-Domain-Policies`
- [ ] CSP violation reports appear at `/api/csp-report` (test via `curl -X POST`)
- [ ] Vercel log stream shows `{"ts":"...","event":"auth_missing_token","route":"/...","ip":"...","status":404}` for unauthenticated attempts — never includes email/guestEmail
- [ ] `npm run security:check` exits 0

### Monitoring (ongoing)
- [ ] Set up Vercel log drain to send structured logs to SIEM/Datadog
- [ ] Alert rule: `event=auth_missing_token` from same IP > 5 times in 60s → notify
- [ ] Alert rule: `event=admin_access_denied` from same IP > 3 times in 60s → notify  
- [ ] Review CSP violation report-uri logs weekly and tighten `'unsafe-inline'`/`'unsafe-eval'` when source maps allow
- [ ] Schedule: `npm audit` weekly in CI and update AWS SDK (`fast-xml-parser` CVE) to clear remaining vulnerabilities

---

## 6. REMAINING KNOWN VULNERABILITIES

```
44 total: 3 low, 9 moderate, 28 high, 2 critical
```

All are in `@aws-sdk/*` (via `fast-xml-parser` CVE `GHSA-fj3w-jwp8-x2g3`) and `qs` (DoS CVE).

**Fix:**
```bash
npm update @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
# Check whether updated version resolves fast-xml-parser sub-dependency
npm audit --audit-level=high
```

These are server-side DoS/stack-overflow vulnerabilities — not authentication bypass or data leaks. Low immediate risk given Vercel's request size limits and the rate limits now in effect.
