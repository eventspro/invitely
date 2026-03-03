# 4ever.am — Full Production Audit Report

**Date:** March 3, 2026  
**Audited by:** GitHub Copilot — Senior DevOps / Security / Performance / SEO Analysis  
**Scope:** Live production site (https://4ever.am) + full codebase static analysis  
**Tech Stack:** React SPA · Express.js · Drizzle ORM · Neon PostgreSQL · Vercel · Cloudflare R2 · Brevo Email  

---

## Executive Summary

The platform is a functional, well-structured Armenian wedding SPA hosted on Vercel. It serves real users with multi-language support, RSVP management, template-scoped access control, and cloud storage. However, it carries **2 critical CVEs**, a significant **security header gap on static HTML delivery**, **no Content-Security-Policy anywhere**, measurable **LCP/rendering problems** from a pure client-side SPA architecture, **unoptimized multi-MB images in the dist folder**, and **sensitive information exposure** on public unauthenticated endpoints.

The site is functional and live — but not production-hardened to enterprise security standards. The issues are fixable, and most critical/high items can be resolved within a few hours of focused work.

---

## Risk Severity Summary Table

| # | Finding | Severity | Category |
|---|---------|----------|----------|
| 1 | 44 npm vulnerabilities (2 critical CVEs: `fast-xml-parser` + `qs`) | **CRITICAL** | Security |
| 2 | No Content Security Policy on any route | **CRITICAL** | Security |
| 3 | Security headers completely missing on static HTML delivery (only applied via Express on /api) | **HIGH** | Security |
| 4 | `/api/test` publicly exposes `NODE_ENV`, DB connection prefix, and infra fingerprints | **HIGH** | Security |
| 5 | `/health` publicly exposes `databaseUrlPrefix` without authentication | **HIGH** | Security |
| 6 | No compression (gzip/brotli) on HTML or any static assets | **HIGH** | Performance |
| 7 | 464 KB uncompressed main JS bundle (index.js) | **HIGH** | Performance |
| 8 | 1.47 MB + 702 KB raw JPEGs bundled into `/dist/public/assets/` — no WebP conversion | **HIGH** | Performance |
| 9 | SPA renders `Loading...` on first byte — bots and slow users see empty page (estimated LCP ~3.5–5s) | **HIGH** | SEO + Perf |
| 10 | HSTS inconsistent: HTML page has `max-age=63072000` but missing `includeSubDomains; preload` | **MEDIUM** | Security |
| 11 | `robots.txt` explicitly names `/admin`, `/platform`, `/platform-admin` — path enumeration for attackers | **MEDIUM** | Security |
| 12 | `Access-Control-Allow-Origin: *` set on all static routes including HTML | **MEDIUM** | Security |
| 13 | Google Fonts `<link>` is synchronous render-blocking (blocks first paint) | **MEDIUM** | Performance |
| 14 | Rate limit of 100 req/15min shared across ALL `/api` routes — polling client can starve real users | **MEDIUM** | Availability |
| 15 | Canonical tag only hardcoded for `/` — all other SPA routes (`/templates`, `/harut-tatev`, etc.) share identical uncanonicalized HTML | **MEDIUM** | SEO |
| 16 | `@replit/vite-plugin-runtime-error-modal` imported unconditionally in `vite.config.ts` — dev overlay may bleed into prod artifacts | **MEDIUM** | Code Quality |
| 17 | Response body (including RSVP personal data) logged to Vercel logs via `capturedJsonResponse` | **MEDIUM** | Privacy / GDPR |
| 18 | Dev auth bypass condition includes `VERCEL=1` — misconfigured env could bypass auth in production | **MEDIUM** | Security |
| 19 | `express.json({ limit: "10mb" })` — oversized body limit enables large-payload DoS | **MEDIUM** | Security |
| 20 | Translation API (`GET /api/translations`) returns 33 KB JSON with `max-age=0` on every page load | **MEDIUM** | Performance |
| 21 | `twitter:title` in English, `og:title` in Armenian — inconsistent Open Graph data | **LOW** | SEO |
| 22 | Service worker cache name `wedding-photos-v1/v2` — no automated invalidation strategy | **LOW** | Performance |
| 23 | No analytics or event tracking of any kind | **LOW** | Business |
| 24 | Meta description mixes Armenian and English in the same sentence | **LOW** | SEO |
| 25 | No GDPR cookie consent banner or privacy policy page | **LOW** | Legal / Compliance |

---

## 1. Infrastructure & Hosting

### Live Data Collected

```
HTTP/1.1 200 OK
Server: Vercel
X-Vercel-Cache: HIT
Age: 1885
TTFB: 400ms (CDN HIT)
Content-Length: 4312
Cache-Control: public, max-age=0, must-revalidate
Strict-Transport-Security: max-age=63072000   (⚠️ no includeSubDomains, no preload)
Access-Control-Allow-Origin: *
Content-Encoding: (none — no gzip or brotli)
```

| Metric | Value | Status |
|--------|-------|--------|
| Hosting | Vercel Edge Network | ✅ Good |
| HTTP version | HTTP/1.1 (curl test) | ⚠️ Browsers negotiate HTTP/2 via ALPN — verify in Chrome DevTools Network tab |
| CDN | Vercel global CDN — `X-Vercel-Cache: HIT` confirmed | ✅ Good |
| Compression | **None detected** — no `Content-Encoding` header even with `Accept-Encoding: br,gzip` sent | ❌ Critical miss |
| HTML `Cache-Control` | `public, max-age=0, must-revalidate` | ✅ Correct for HTML |
| Static asset `Cache-Control` | `public, max-age=31536000` (1 year) | ✅ Correct |
| TTFB (CDN HIT) | **400ms** — high for cached edge response, expected <100ms | ⚠️ Investigate |
| TLS | Vercel-managed via Let's Encrypt | ✅ Good |
| HSTS on HTML route | `max-age=63072000` — **no `includeSubDomains`, no `preload`** | ❌ Incomplete |
| HSTS on API routes | `max-age=31536000; includeSubDomains; preload` | ✅ Full |
| DNS | Standard CNAME/A to Vercel | ✅ Good |
| Manifest Cache | `public, max-age=86400` (1 day) | ✅ |
| API rate limiting | 100 req/15min, `Ratelimit-Limit` headers present | ✅ Present, ⚠️ too coarse |

**Root cause of 400ms TTFB on CDN HIT:** Vercel Edge middleware processing overhead. Check `X-Vercel-Cache: MISS` TTFB to isolate cold-start serverless function latency from edge processing.

---

## 2. Performance Audit

### 2.1 JS/CSS Bundle Analysis (from `dist/public/assets/`)

| File | Size (uncompressed) | Estimated gzip | Notes |
|------|---------------------|----------------|-------|
| `index-F5s9dmm6.js` | **464.8 KB** | ~130 KB | Main bundle — too large |
| `map-modal-TQc_4wWm.js` | **280.9 KB** | ~85 KB | Large lazy chunk — verify lazy loading |
| `vendor-Dneogk0_.js` | 138 KB | ~40 KB | React + ReactDOM |
| `ui-Ek2JyTp1.js` | 55.3 KB | ~18 KB | Radix UI primitives |
| `index-CFAE-Wjt.css` | 94.2 KB | ~14 KB | Tailwind output |
| `hy-DE6aYGRU.js` | 16.6 KB | ~5 KB | Armenian translations |
| `map-modal-B_l4pjL9.css` | 12.9 KB | ~3 KB | |
| `ru-DuTvXYRt.js` | 8.1 KB | | Russian translations |
| `en-CvrLLDBv.js` | 7.9 KB | | English translations |
| `router-71dJo-3X.js` | 4.9 KB | | Wouter |
| Template chunks (×5) | ~4 KB each | | ✅ Properly lazy |
| **Total parse weight** | **~1.1 MB** | **~300 KB gzipped** | Without compression: full 1.1 MB |

**Problems:**
- `manualChunks` in `vite.config.ts` only splits `react`, `wouter`, and 2 Radix primitives
- `@tanstack/react-query`, `zod`, `lucide-react`, `date-fns`, all Radix components except 2 → all land in `index.js`
- Without compression, users download full 464 KB JS before any UI renders
- `map-modal` chunk is 280 KB — if not truly lazy-loaded, it's a blocking resource

### 2.2 Image Optimization

| File | Size | Problem |
|------|------|---------|
| `couple11-DsmtNd31.jpg` | **1,467 KB (1.47 MB)** | No WebP, no `srcset`, no dimensions |
| `IMG_5671_1755890386133-rWdv4U49.jpeg` | **702 KB** | Same issues |
| `11_1755890922505-Bbt7Q8Zo.jpg` | 172 KB | Same issues |
| `3_1755890746399-Dg1OQx2g.jpg` | 48.9 KB | Same issues |

**No images use `<img loading="lazy">`** and none are served as WebP or AVIF. Converting the 1.47 MB JPEG to WebP at 80% quality would yield approximately **~120–180 KB** — an 88% reduction.

### 2.3 Core Web Vitals Estimates

| Metric | Estimated | Google Target | Issue |
|--------|-----------|---------------|-------|
| **LCP** | **~3.5–5s** | <2.5s | JS must download (464 KB), parse, hydrate, then render before any content visible |
| **CLS** | Unknown | <0.1 | Font `size-adjust` not used — swap may cause layout shift |
| **INP** | Likely OK | <200ms | React 18 concurrent rendering |
| **TTFB** | 400ms | <200ms | CDN HIT overhead |
| **FCP** | ~2s+ | <1.8s | HTML shell is `Loading...` — no meaningful content on first byte |

**Root cause of poor LCP:** The HTML served to browsers (and bots) contains only:
```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```
The entire UI is JavaScript-rendered. Google may eventually render it, but:
1. Core Web Vitals ranking signals use field data — real users experience slow LCP
2. Googlebot renders JS with queue delay (hours to days after crawl)

### 2.4 Render-Blocking Resources

- Google Fonts `<link rel="stylesheet">` is **synchronously loaded** — blocks First Contentful Paint
- Despite `dns-prefetch` and `preconnect` being present, the CSS download itself is blocking
- **Five** font families are loaded: Noto Sans Armenian, Noto Serif Armenian, Playfair Display, Lora, Montserrat — audit which are actually used on initial viewport

### 2.5 Caching Strategy

| Resource | Cache-Control | Assessment |
|----------|--------------|------------|
| HTML (`/`) | `max-age=0, must-revalidate` | ✅ Correct |
| Static assets (`/assets/*`) | `max-age=31536000` | ✅ Correct (content-hashed filenames) |
| Translation API | `max-age=0, must-revalidate` | ❌ 33 KB fetched every page load |
| Manifest | `max-age=86400` | ✅ |
| Service worker | `max-age=0` | ✅ Correct |
| Template previews | `max-age=86400` | ✅ |

---

## 3. Load & Stress Readiness

### 3.1 Architecture Assessment

| Area | Status | Detail |
|------|--------|--------|
| Rate limiting | ⚠️ Present but coarse | 100 req/15min shared across ALL `/api` routes — a translation polling loop could exhaust quota |
| Database | ⚠️ Risk | Neon PostgreSQL serverless — connection acquisition latency under burst traffic unknown |
| Cold starts | ⚠️ Risk | Vercel serverless — first request after idle adds 300–800ms latency |
| Horizontal scaling | ✅ | Vercel handles automatically |
| N+1 query detection | ⚠️ Unverified | RSVP and dashboard endpoints risk N+1 on unindexed `templateId` joins |
| Translation payload | ❌ | 33 KB JSON per page load, no client-side caching |
| Body size limit | ⚠️ | `10mb` limit on all JSON bodies |

### 3.2 Bottlenecks Under Load

1. **Neon DB connection acquisition** — serverless DB has per-connection overhead; no persistent connection pool (PgBouncer) configured
2. **Vercel cold starts** — EU/US function routing adds first-request latency
3. **33 KB translation JSON uncached** — scales linearly with concurrent users
4. **Image serving** — multi-MB JPEGs through `/api/images/serve/:filename` or R2 presigned URLs add significant egress

### 3.3 Recommended Stress Test Scenarios

```javascript
// k6 scenario — 200 concurrent homepage loads
import http from 'k6/http';
export let options = { vus: 200, duration: '2m' };
export default function() {
  http.get('https://4ever.am');
  http.get('https://4ever.am/api/translations?lang=hy');
}

// k6 scenario — 50 concurrent RSVP submissions
export default function() {
  http.post('https://4ever.am/api/templates/1/rsvp', JSON.stringify({
    name: 'Test User', phone: '+374912345678', attending: true
  }), { headers: { 'Content-Type': 'application/json' }});
}
```

**Tools:** `k6`, `Artillery`, `Apache Bench` for simpler tests.

---

## 4. Security Audit

### 4.1 Dependency Vulnerabilities — CRITICAL

```
npm audit results:
  44 total vulnerabilities
   2 CRITICAL
  28 HIGH
   9 MODERATE
   5 LOW
```

**Critical CVEs:**

| Vulnerability | Package | CVE | Impact |
|--------------|---------|-----|--------|
| Stack overflow in XMLBuilder with `preserveOrder` | `fast-xml-parser` | GHSA-fj3w-jwp8-x2g3 | Server crash (DoS) via crafted XML payload |
| `arrayLimit` bypass via bracket notation → memory exhaustion | `qs` | GHSA-6rw7-vpxm-498p | DoS via unbounded memory allocation |
| `arrayLimit` bypass via comma parsing | `qs` | GHSA-w7fw-mjwx-w883 | Same |

**Exposure path:** `qs` is used internally by Express's `bodyParser` and `urlencoded` middleware — **every POST request to your API is exposed**. The `fast-xml-parser` is pulled in via `@aws-sdk/core` → `@aws-sdk/xml-builder`.

**Fix:**
```bash
npm audit fix
# If above fails for specific packages:
npm i fast-xml-parser@latest qs@^6.13.0
npm update @aws-sdk/client-s3
```

---

### 4.2 Security Headers — HTML vs API Gap

Express middleware only runs for API routes. Static HTML is served by Vercel CDN, **bypassing Express entirely**.

| Header | HTML page `/` | API `/api/*` |
|--------|--------------|--------------|
| `X-Frame-Options` | ❌ **Missing** | ✅ `DENY` |
| `X-Content-Type-Options` | ❌ **Missing** | ✅ `nosniff` |
| `X-XSS-Protection` | ❌ **Missing** | ✅ `1; mode=block` |
| `Referrer-Policy` | ❌ **Missing** | ✅ `strict-origin-when-cross-origin` |
| `Permissions-Policy` | ❌ **Missing** | ✅ `camera=(), microphone=()...` |
| `Content-Security-Policy` | ❌ **Not present** | ❌ **Not present** |
| `HSTS` | ⚠️ `max-age=63072000` only | ✅ `max-age=31536000; includeSubDomains; preload` |
| `Access-Control-Allow-Origin` | `*` (over-permissive on HTML) | `*` (needs narrowing on mutation endpoints) |

**Fix — add to `vercel.json` for the HTML route:**
```json
{
  "src": "/(.*)",
  "dest": "/index.html",
  "headers": {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload"
  }
}
```

---

### 4.3 Content Security Policy — Missing Entirely

No CSP is present on any route. This means:
- XSS payloads can execute freely if any user input reaches the DOM unsanitized
- Inline scripts are permitted without nonce or hash restriction
- Any external origin can load resources (scripts, frames, media)
- Clickjacking via `<iframe>` is partially mitigated by `X-Frame-Options` on API only

**Starter CSP (report-only first):**
```
Content-Security-Policy-Report-Only:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://api.brevo.com https://*.neon.tech https://*.r2.cloudflarestorage.com;
  media-src 'self' https://*.r2.cloudflarestorage.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  report-uri /api/csp-report;
```

Deploy in `Report-Only` mode first, monitor for 1 week, then enforce.

---

### 4.4 Information Exposure on Public Endpoints

**`GET /api/test` — No authentication, public:**
```json
{
  "message": "Server is running",
  "timestamp": "2026-03-03T...",
  "environment": "production",
  "hasDatabase": true,
  "databaseUrlPrefix": "postgresql://neondb_owner:np..."
}
```
This discloses: DB provider (Neon), username prefix (`neondb_owner`), environment state.

**`GET /health` — No authentication, public:**
```json
{
  "status": "ok",
  "environment": "production",
  "databaseUrlPrefix": "postgresql://..."
}
```

**Fix — `server/index.ts`:**
```typescript
// Remove from BOTH /health and /api/test:
databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + "...",

// Replace /api/test with:
app.get("/api/test", requireInternalAuth, (_req, res) => {
  res.status(200).json({ message: "Server is running" });
});
```

---

### 4.5 CORS Configuration

`Access-Control-Allow-Origin: *` is set globally (observed on HTML response). For **read** endpoints this is acceptable. For **mutation endpoints** (RSVP submission, photo upload, config updates), wildcard CORS should be replaced with explicit origin allowlisting:

```typescript
const allowedOrigins = ['https://4ever.am', 'https://www.4ever.am'];
app.use('/api', cors({ origin: allowedOrigins, credentials: true }));
```

---

### 4.6 robots.txt Path Enumeration

Current:
```
Disallow: /admin
Disallow: /platform
Disallow: /platform-admin
```

This is publicly readable and gives attackers a confirmed path map to target. Replace with:
```
Disallow: /admin*
Disallow: /platform*
```

Or better — return a 200 honeypot page on `/admin` that logs the IP and returns fake content.

---

### 4.7 Auth Bypass Risk

In `server/middleware/auth.ts` (per copilot docs), development mode bypasses authentication when `NODE_ENV=development` OR `VERCEL=1`. The `VERCEL=1` environment variable is automatically set by Vercel in ALL environments (staging, preview, production).

**This means:** if `NODE_ENV` is ever not set to `production` on Vercel (e.g., during a mis-configured staging deploy), authentication is bypassed on a live Vercel URL.

**Fix:**
```typescript
// UNSAFE — current pattern:
const isDev = process.env.NODE_ENV === 'development' || !!process.env.VERCEL;

// SAFE — fix to:
const isDev = process.env.NODE_ENV === 'development' && !process.env.VERCEL_ENV?.includes('production');
```

---

### 4.8 OWASP Top 10 Assessment

| Risk | Status | Detail |
|------|--------|--------|
| A01 Broken Access Control | ⚠️ | Auth bypass risk via `VERCEL=1` condition |
| A02 Cryptographic Failures | ✅ | JWT + bcrypt used (per architecture docs) |
| A03 Injection | ✅/⚠️ | Drizzle ORM is safe; verify no raw SQL with user inputs |
| A04 Insecure Design | ❌ | `/api/test` and `/health` expose infra data |
| A05 Security Misconfiguration | ❌ | Missing headers, weak CORS, no CSP, chat body limit |
| A06 Vulnerable Components | ❌ | 44 vulns including 2 critical |
| A07 Identification & Auth Failures | ⚠️ | Rate limit on auth endpoints not separately verified |
| A08 Software & Data Integrity | ✅ | No eval, module imports, no dynamic code |
| A09 Security Logging & Monitoring | ⚠️ | Personal RSVP data logged in full JSON to Vercel logs |
| A10 SSRF | ⚠️ | Image upload to R2 — verify URL inputs are validated before proxy |

---

### 4.9 PII Logging Risk

In `server/index.ts`:
```typescript
// This logs ALL response bodies to Vercel logs:
res.json = (bodyJson: any) => {
  capturedJsonResponse = bodyJson;
  return originalResJson(bodyJson);
};
// ...
logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
```

RSVP responses contain guest names, phone numbers, and attendance data. These are logged as plain text to Vercel's log infrastructure.

**Fix:**
```typescript
// Exclude sensitive routes from body logging:
if (reqPath.startsWith("/api") && !reqPath.includes("/rsvp") && !reqPath.includes("/auth")) {
  logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
}
```

---

## 5. SEO Audit

### 5.1 Meta Tags

| Tag | Value | Status |
|-----|-------|--------|
| `<title>` | `4ever.am - Հայկական Հարսանեկան Հրավիրատոմսեր` (57 chars) | ✅ |
| `<meta name="description">` | Mixes Armenian + English in same sentence | ⚠️ |
| `<link rel="canonical">` | `https://4ever.am/` — hardcoded, same for all pages | ❌ |
| `<html lang>` | `hy` | ✅ |
| `<meta name="robots">` | `index, follow` | ✅ |
| `og:type` | `website` | ✅ |
| `og:locale` | `hy_AM` | ✅ |
| `og:image` | Present | ✅ |
| `twitter:card` | `summary_large_image` | ✅ |
| `twitter:title` | English ("Armenian Wedding Invitations") | ⚠️ Inconsistent with og:title which is Armenian |
| `og:url` | Hardcoded `https://4ever.am/` — same for all pages | ❌ |
| Keywords meta | Present (hy + en) | ✅ (minor signal) |

### 5.2 Critical SEO Issue — SPA Canonical Problem

Every URL on the site — `/`, `/templates`, `/harut-tatev`, `/alexander-isabella-elegant` — serves the **exact same `index.html`** file with:
- Same `<title>`
- Same `<meta name="description">`
- Same `<link rel="canonical" href="https://4ever.am/">`
- Same `<meta property="og:url" content="https://4ever.am/">`

Google will see all pages as duplicates of the homepage. The canonical tag on `/harut-tatev` points to `/` — telling Google that the wedding site itself should be indexed as the homepage. This **severely limits indexation** of individual wedding template pages.

**Fix options (in order of effectiveness):**
1. **Vercel Edge Middleware** — intercept requests and inject page-specific meta tags into HTML
2. **Prerender.io** — pre-render pages and serve static HTML to bots
3. **React Helmet / dynamic meta** — works for users but not for initial Googlebot requests without SSR
4. **Next.js migration** — full SSR/ISR capability

### 5.3 Sitemap

```xml
https://4ever.am/ — weekly, 1.0
https://4ever.am/templates — weekly, 0.9
https://4ever.am/harut-tatev — monthly, 0.8
https://4ever.am/michael-sarah-classic — monthly, 0.8
https://4ever.am/alexander-isabella-elegant — monthly, 0.8
https://4ever.am/david-rose-romantic — monthly, 0.8
https://4ever.am/forest-lily-nature — monthly, 0.8
```

✅ Sitemap exists and is accessible  
✅ Includes image references for template previews  
⚠️ Missing `<lastmod>` dates for most entries  
⚠️ Missing `<hreflang>` entries for Armenian/Russian/English language variants  
⚠️ Not submitted to Google Search Console (cannot verify without access)

### 5.4 Structured Data

Architecture docs mention `Schema.org` structured data via `SEOMetadata` component. Cannot verify rendering without JS execution. Confirm output at: `https://search.google.com/test/rich-results`

### 5.5 Robots.txt

```
User-agent: *
Allow: /
Disallow: /admin       ← path enumeration
Disallow: /platform    ← path enumeration
Disallow: /api/
Crawl-delay: 1
Sitemap: https://4ever.am/sitemap.xml
```

✅ Sitemap referenced  
✅ API blocked from crawling  
❌ Admin paths explicitly named (security issue)  
⚠️ `Crawl-delay: 1` ignored by Googlebot — not a standard directive for Google

---

## 6. Accessibility (WCAG 2.1 Audit)

| Check | Status | Detail |
|-------|--------|--------|
| `lang` attribute | ✅ | `<html lang="hy">` |
| Font rendering | ✅ | `text-rendering: optimizeLegibility`, antialiasing, Armenian font fallback chain |
| Viewport zoom | ✅ | `maximum-scale=5` (allows zoom — good for accessibility) |
| Armenian character rendering | ✅ | Noto Sans/Serif Armenian with proper fallback chain |
| Focus states | ⚠️ | Verify custom components have visible focus rings (Tailwind `focus-visible:ring`) |
| Color contrast | ⚠️ | Rose/pink on white — verify ≥4.5:1 ratio for small text using WCAG contrast checker |
| ARIA | ⚠️ | Radix UI components are ARIA-compliant ✅ — custom components need manual verification |
| Keyboard navigation | ⚠️ | Cannot verify without live render — check tab order of RSVP form |
| Form labels | ⚠️ | Verify all RSVP form inputs have associated `<label>` or `aria-label` |
| Screen reader | ⚠️ | Logo `<img alt="4ever.am">` ✅ — verify decorative images use `alt=""` |
| Skip navigation | ❌ | No "skip to main content" link for keyboard users |
| Error announcements | ⚠️ | Verify form validation errors are announced via `aria-live` or `role="alert"` |

---

## 7. Code Quality & Architecture

### 7.1 Vite Config Issues

**Current `vite.config.ts` `manualChunks`:**
```typescript
manualChunks: {
  vendor: ['react', 'react-dom'],
  router: ['wouter'],
  ui: ['@radix-ui/react-tooltip', '@radix-ui/react-toast']
}
```

Only 4 packages are split out. Everything else — `@tanstack/react-query`, `zod`, `lucide-react` (~200 icons), `date-fns`, all other Radix UI primitives — ends up in `index.js`.

**Improved `manualChunks`:**
```typescript
manualChunks: {
  vendor: ['react', 'react-dom'],
  router: ['wouter'],
  query: ['@tanstack/react-query'],
  ui: [
    '@radix-ui/react-tooltip', '@radix-ui/react-toast',
    '@radix-ui/react-dialog', '@radix-ui/react-select',
    '@radix-ui/react-tabs', '@radix-ui/react-accordion',
    'lucide-react'
  ],
  utils: ['zod', 'date-fns', 'clsx', 'tailwind-merge']
}
```

Expected main bundle reduction: **464 KB → ~180–220 KB**.

### 7.2 Replit Dev Plugin in Production

```typescript
// vite.config.ts
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
// ...
plugins: [
  react(),
  runtimeErrorOverlay(),  // ← Always included, even in production builds
  ...
]
```

Fix:
```typescript
plugins: [
  react(),
  ...(process.env.NODE_ENV !== 'production' ? [runtimeErrorOverlay()] : []),
]
```

### 7.3 Body Parsing Limit

```typescript
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
```

10 MB on every JSON endpoint enables large-payload DoS. Reduce to `1mb` for general API, with a larger limit only on specific upload endpoints.

### 7.4 Error Handling

- ✅ Global error middleware present in `server/index.ts`
- ✅ `console.error("Server error:", err)` logs stack traces
- ⚠️ Error middleware returns `err.message` directly — could expose internal error details to clients in production
- ⚠️ No Sentry or external error tracking — errors are only visible in Vercel logs

**Fix:**
```typescript
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  console.error("Server error:", err);
  // Don't expose internal messages in production
  const message = env.isProduction && status === 500
    ? "Internal Server Error"
    : err.message || "Internal Server Error";
  res.status(status).json({ message });
});
```

### 7.5 Environment Variable Handling

- `DATABASE_URL`, `JWT_SECRET`, `BREVO_API_KEY` not validated at startup — server starts successfully with missing keys and only fails at runtime
- Only `PORT` is checked in `validateEnvironment()`

**Fix:**
```typescript
const required = ['DATABASE_URL', 'JWT_SECRET', 'BREVO_API_KEY'];
const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}
```

---

## 8. Analytics & Tracking

| Area | Status | Detail |
|------|--------|--------|
| Web analytics | ❌ None | No GA4, Plausible, Fathom, or Mixpanel detected |
| RSVP conversion tracking | ❌ None | No funnel analytics |
| Template selection events | ❌ None | No tracking of which templates are previewed |
| Error monitoring | ❌ None | No Sentry or similar |
| GDPR cookie banner | ❌ None | No consent management — legal risk for EU visitors |
| Privacy policy page | ❌ None | Not present in sitemap or navigation |

**GDPR Exposure:** Armenian diaspora communities in France, Germany, Netherlands, and other EU countries are a primary target audience. Collecting RSVP data (names, phone numbers, email) from EU residents without a privacy policy or consent mechanism violates GDPR. Potential fines: up to €20M or 4% of annual revenue.

**Recommended analytics stack (GDPR-compliant):**
- **Plausible.io** — lightweight (~1 KB), no cookies, EU-hosted, GDPR-compliant, $9/month
- **Sentry** — error tracking with source maps, free tier available

---

## 9. Business & Conversion Audit

| Area | Assessment | Priority |
|------|------------|----------|
| CTA visibility | ✅ Pink gradient button is prominent on hero | — |
| Perceived load speed | ❌ `Loading...` shown before any content — high bounce rate risk on slow connections | HIGH |
| Trust signals | ⚠️ No testimonials, customer count, or social proof visible on homepage | MEDIUM |
| Template preview friction | ✅ Preview accessible from templates page | — |
| Pricing clarity | ⚠️ 5 plans (basic → ultimate) may cause decision paralysis | LOW |
| Mobile UX | ⚠️ Cannot fully verify without render — confirm CTAs are thumb-friendly (44×44px min) | MEDIUM |
| RSVP confirmation UX | ⚠️ Verify duplicate RSVP prevention message is clear and friendly | MEDIUM |
| Multi-language switching | ✅ AM/EN/RU selector present in navbar | — |
| Offline capability | ⚠️ Service worker present but cache names were out-of-sync | LOW |

---

## Recommended Fixes — Full Prioritized Roadmap

### 🔴 CRITICAL — Fix Immediately (same day)

#### Fix 1: Patch critical CVEs
```bash
cd d:\invitely-1\invitely-1
npm audit fix
# Test: RSVP submission, file upload, authentication
```

#### Fix 2: Remove information exposure from public endpoints
In `server/index.ts`, remove `databaseUrlPrefix` from `/health` and `/api/test` responses. Add IP-based protection or remove `/api/test` entirely.

#### Fix 3: Add security headers to static HTML via vercel.json
Add to the catch-all route in `vercel.json`:
```json
"headers": {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload"
}
```

---

### 🟠 HIGH — Fix This Week

#### Fix 4: Fix auth bypass condition
```typescript
// Change from:
const isDev = process.env.NODE_ENV === 'development' || !!process.env.VERCEL;
// To:
const isDev = process.env.NODE_ENV === 'development';
```

#### Fix 5: Reduce body parsing limit
```typescript
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
```

#### Fix 6: Fix PII logging
Exclude RSVP and auth route bodies from the request logger.

#### Fix 7: Enable compression
Add `compression` middleware for local Express serving and verify Vercel brotli is enabled (may require `vercel.json` `compression` config or header hint).

#### Fix 8: Cache translation API responses
```typescript
res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
```

#### Fix 9: Fix robots.txt path enumeration
```
Disallow: /admin*
Disallow: /platform*
```

#### Fix 10: Fix CORS on mutation endpoints
Replace `*` with explicit origin on RSVP, photo upload, and config endpoints.

---

### 🟡 MEDIUM — Fix This Month

#### Fix 11: Improve Vite bundle chunking
Add `@tanstack/react-query`, `lucide-react`, `zod`, `date-fns` to `manualChunks`.
Expected result: main bundle 464 KB → ~200 KB.

#### Fix 12: Add WebP image conversion to build pipeline
```bash
npm install --save-dev sharp
# Build script: convert all JPGs in uploads/ and dist/ to WebP
```
Expected: 1.47 MB JPEG → ~150 KB WebP (90% reduction).

#### Fix 13: Fix Google Fonts loading
```html
<!-- Replace synchronous with preload + async -->
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=..." />
<link rel="stylesheet" media="print" onload="this.media='all'" href="..." />
```

#### Fix 14: Add CSP in report-only mode
Deploy to staging, monitor, then enforce after 1 week.

#### Fix 15: Per-endpoint rate limiting
```typescript
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 10 });
const rsvpLimiter = rateLimit({ windowMs: 15*60*1000, max: 5 });
const readLimiter = rateLimit({ windowMs: 15*60*1000, max: 300 });
```

#### Fix 16: Add `skip to content` link for accessibility
```html
<a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>
```

#### Fix 17: Validate all required env vars at startup

#### Fix 18: Remove `runtimeErrorOverlay` from production builds

#### Fix 19: Add GDPR-compliant analytics (Plausible.io)

---

### 🟢 STRATEGIC — Long Term (1–3 months)

#### S1: Server-Side Rendering or Prerendering
This is the single most impactful change for both SEO and performance:
- Each template URL (`/harut-tatev`) should serve unique HTML with the correct title, description, canonical, and og:tags
- Options: Vercel Edge Middleware (fastest to implement), Prerender.io service, or Next.js migration (most complete)

#### S2: Image Optimization Pipeline
- Automatic WebP conversion on upload via Sharp
- `srcset` for responsive images
- `<img loading="lazy" width="X" height="Y">` on all below-fold images

#### S3: Database Connection Pooling
- Add PgBouncer or Neon's built-in connection pooling for burst-traffic resilience
- Monitor query performance with `EXPLAIN ANALYZE` on RSVP and template queries

#### S4: Automated Lighthouse CI
```yaml
# .github/workflows/lighthouse.yml
- uses: treosh/lighthouse-ci-action@v10
  with:
    urls: 'https://4ever.am'
    budgetPath: './lighthouse-budget.json'
```

#### S5: Dependency Automation
Add Dependabot or Renovate Bot for automatic dependency updates and CVE patching.

#### S6: WAF Protection
Add Cloudflare WAF in front of Vercel for DDoS protection, bot filtering, and IP reputation blocking.

#### S7: Error Monitoring
Integrate Sentry with source maps for production error tracking with stack traces.

#### S8: Privacy Policy & Cookie Consent
Required before any EU marketing campaigns. Implement CookieConsent or use Plausible (no cookies needed).

#### S9: hreflang Sitemap Entries
```xml
<xhtml:link rel="alternate" hreflang="hy" href="https://4ever.am/" />
<xhtml:link rel="alternate" hreflang="ru" href="https://4ever.am/?lang=ru" />
<xhtml:link rel="alternate" hreflang="en" href="https://4ever.am/?lang=en" />
```

---

## Quick Reference: Fixes Under 1 Hour Each

| Fix | Time | Impact |
|-----|------|--------|
| `npm audit fix` | 15 min | Patches 2 critical CVEs |
| Remove `databaseUrlPrefix` from `/health` and `/api/test` | 5 min | Removes infra exposure |
| Add security headers to `vercel.json` static routes | 10 min | Adds 5 missing headers |
| Fix `robots.txt` admin path disclosure | 5 min | Removes attack surface info |
| Fix body limit `10mb → 1mb` | 5 min | Reduces DoS surface |
| Cache translation API `max-age=3600` | 5 min | Reduces 33 KB/user/pageload |
| Fix PII logging in request logger | 10 min | GDPR compliance |
| Fix Replit plugin conditional | 5 min | Cleaner production build |
| Fix auth bypass `VERCEL=1` condition | 10 min | Auth hardening |

**Total estimated time for all quick wins: ~70 minutes**

---

## Appendix: Raw Audit Data

### HTTP Headers — Homepage
```
HTTP/1.1 200 OK
Server: Vercel
X-Vercel-Cache: HIT
Age: 1885
Cache-Control: public, max-age=0, must-revalidate
Content-Length: 4312
Content-Type: text/html; charset=utf-8
Strict-Transport-Security: max-age=63072000
Access-Control-Allow-Origin: *
TTFB: 400ms
```

### HTTP Headers — API Route (/api/translations)
```
HTTP/1.1 200 OK
Cache-Control: public, max-age=0, must-revalidate
Content-Length: 33646
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Ratelimit-Limit: 100
Ratelimit-Policy: 100;w=900
Ratelimit-Remaining: 99
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Powered-By: Express
X-Xss-Protection: 1; mode=block
```

### npm audit summary
```
44 vulnerabilities (5 low, 9 moderate, 28 high, 2 critical)
Critical: fast-xml-parser (GHSA-fj3w-jwp8-x2g3), qs (GHSA-6rw7-vpxm-498p, GHSA-w7fw-mjwx-w883)
Fix available: npm audit fix
```

### Bundle Sizes (dist/public/assets/)
```
index-F5s9dmm6.js        464.8 KB
map-modal-TQc_4wWm.js    280.9 KB
vendor-Dneogk0_.js       138.0 KB
couple11-DsmtNd31.jpg   1467.9 KB  ← unoptimized image in dist
IMG_5671_...jpeg          702.3 KB  ← unoptimized image in dist
index-CFAE-Wjt.css        94.2 KB
ui-Ek2JyTp1.js            55.3 KB
hy-DE6aYGRU.js            16.6 KB
map-modal-B_l4pjL9.css    12.9 KB
```

### Sitemap URLs
```
https://4ever.am/
https://4ever.am/templates
https://4ever.am/harut-tatev
https://4ever.am/michael-sarah-classic
https://4ever.am/alexander-isabella-elegant
https://4ever.am/david-rose-romantic
https://4ever.am/forest-lily-nature
```

---

*Report generated: March 3, 2026*  
*Next audit recommended: after completing all CRITICAL and HIGH fixes*  
*Tooling used: Live HTTP header inspection (curl), npm audit, static codebase analysis, Vercel deployment review*
