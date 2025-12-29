# Wedding Platform AI Development Guide

## Architecture Overview

This is a **multi-tenant Armenian wedding platform** enabling couples to create customized wedding websites with multi-layered access control:

- **Backend**: Express.js + Drizzle ORM (PostgreSQL) deployed as Vercel serverless functions
- **Frontend**: React SPA with Wouter routing, TanStack Query for server state, and Context for app state  
- **Templates**: Lazy-loaded modular system with JSONB configs stored per template instance
- **Database**: Template-scoped data isolation with comprehensive Zod validation schemas
- **Storage**: Multi-provider object storage abstraction (Cloudflare R2, Google Cloud, AWS S3) with presigned URLs
- **Email Service**: Brevo integration for RSVP notifications with template-scoped routing
- **Authentication**: JWT-based auth with separate systems for template admins vs. platform admins
- **SSL/TLS Security**: Enterprise-grade SSL-safe media serving with HTTP 206 range request support
- **SEO Integration**: Schema.org structured data, multilingual sitemap, and dynamic meta tags

## Key Development Patterns

### Template System Structure
Templates are located in `client/src/templates/` with this pattern:
```
templates/
├── index.ts          # Template registry and lazy loading
├── types.ts          # Shared WeddingConfig interface (200+ lines)
├── pro/
│   ├── ProTemplate.tsx
│   └── config.ts     # defaultConfig export
├── classic/
│   ├── ClassicTemplate.tsx  
│   └── config.ts
├── elegant/          # Blue & gold themed pro variant
├── romantic/         # Pink & rose themed pro variant  
└── nature/           # Green & earth tone themed pro variant
```

**Critical Template Patterns:**
- Always use the `WeddingConfig` type from `templates/types.ts` - it defines 200+ configuration options
- Template configs stored in database as JSONB, loaded via `/api/templates/:id/config`
- Lazy loading: Templates registered in `index.ts` with `React.lazy()` for code splitting
- Template variants: Multiple templates can extend base layouts with different themes
- Dynamic config loading: `loadTemplateConfig()` function imports configs based on template key

### Database Schema Key Points
- `templates` table stores template instances with `config` JSONB field
- Template-scoped foreign keys: `rsvps.templateId`, `guestPhotos.templateId`, etc.
- Use Zod schemas from `shared/schema.ts` for all data validation
- Run migrations with `npm run db:migrate` (includes seeding default template)

### Development Workflow
```bash
# Development server (Express server with Vite integration)
npm run dev          # Runs Express server on localhost:5001 (serves both API + frontend)

# Database operations  
npm run db:push      # Push Drizzle schema changes to database
npm run db:migrate   # Run migrations + seed default template via scripts/migrate-default-template.ts
npm run db:generate  # Generate migration files from schema changes

# Testing
npx playwright test  # E2E tests with auto-start dev server
npm run check        # TypeScript type checking across entire project

# Production build
npm run build        # Vite build + esbuild server bundle
npm run vercel-build # Vercel-optimized build (same as npm run build)
npm run preview      # Test production build locally

# Template management scripts (PowerShell-compatible)
tsx scripts/create-{template}-template.ts    # Create new template instances
tsx scripts/apply-armenian-to-all-templates.ts  # Apply Armenian localization
tsx scripts/check-template-status.ts         # Verify template health
tsx scripts/migrate-default-template.ts      # Initial template seeding
```

### API Route Patterns & Authentication
Routes in `server/routes/` follow RESTful conventions with multi-layered authentication:

**Public Routes:**
- `GET /api/templates/:identifier/config` - Fetch by ID or slug (public access)
- `POST /api/templates/:templateId/rsvp` - RSVP submission with email routing (validates with insertRsvpSchema, includes duplicate detection)

**Template Admin Routes** (require Ultimate plan purchase):
- `GET /api/templates/:templateId/rsvps` - Get all RSVPs for template
- `POST /api/templates/:templateId/photos/upload` - Multi-provider image upload with presigned URLs
- `GET /api/templates/:templateId/images` - List template-scoped images
- `DELETE /api/templates/:templateId/images/:imageId` - Delete template image
- `POST /api/templates/:templateId/maintenance` - Toggle maintenance mode
- Protected by `requireAdminPanelAccess` middleware - JWT-based auth linking to orders table

**Platform Admin Routes:**
- `/api/admin/*` - Separate management system authentication
- User management, order processing, template creation

**Development Auth Bypass:**
- Development mode automatically bypasses authentication (`NODE_ENV=development` or `VERCEL=1`)
- Creates mock users for testing admin functionality locally

**SSL-Safe Media Serving:**
- `/api/images/serve/:filename` - SSL-safe image serving with proper Content-Length headers
- `/api/audio/serve/:filename` - HTTP 206 range request support for audio streaming, incognito mode compatible
- Enhanced CORS headers, HSTS enforcement, and comprehensive security headers
- Incognito mode detection: `req.get('DNT') === '1' || req.get('Sec-GPC') === '1'`

**File Handling:**
- `/uploads/*`, `/attached_assets/*` - Proper MIME type handling and caching headers
- Multi-provider storage abstraction (Cloudflare R2 primary, Google Cloud/AWS S3 fallback) with presigned URLs

**Email Service Integration:**
- Template-scoped RSVP notifications using Brevo API
- 3-tier email recipient priority: `template.ownerEmail` → `config.email.recipients` → fallback couple emails
- Functions: `sendTemplateRsvpNotificationEmails()`, `sendTemplateRsvpConfirmationEmail()`

### Component Architecture & Build System
- **Shadcn/UI components** in `client/src/components/ui/` (Radix UI primitives)
- **Path aliases**: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `public/attached_assets/`
- **State management**: TanStack Query for server state, Context for app-level state
- **Styling**: Tailwind with custom CSS variables for wedding themes
- **Build chunking**: Vendor (React), router (Wouter), UI (Radix) chunks for optimal loading
- **Asset handling**: Vercel routes with proper caching headers (31536000s for assets, 86400s for previews)
- **Development**: Vite dev server with proxy to Express backend, Replit error overlay for debugging

### Critical Files to Understand
- `shared/schema.ts` - Complete database schema with Zod validation (275+ lines)
- `client/src/templates/types.ts` - WeddingConfig interface (200+ lines of config options)
- `server/index.ts` - Express server setup with environment validation and error handling
- `server/email.ts` - Brevo email service with template-scoped routing and Armenian localization
- `server/routes/templates.ts` - Template management, RSVP processing, and admin endpoints
- `vite.config.ts` - Development proxy, build chunking, and path resolution
- `vercel.json` - Serverless deployment configuration with asset routing

### Armenian Localization
This platform specifically supports **Armenian weddings** with:
- Armenian font loading via `ArmenianFontProvider` 
- Bilingual validation messages in Zod schemas
- Armenian date formatting and cultural conventions
- Scripts in `scripts/` for applying Armenian configs to templates

### Testing & Quality Assurance
- **E2E Testing**: Playwright with auto-server startup (`npx playwright test`)
- **SSL Protocol Testing**: PowerShell scripts (`test-ssl-audio-fixes.ps1`, `test-ssl-fixes.ps1`) + Node.js (`test-ssl-image-endpoint.js`)
- **RSVP Testing**: PowerShell scripts for duplicate prevention and validation (`tests/rsvp-test.ps1`)
- **SSL Validation**: Range request (HTTP 206), CORS headers, incognito mode compatibility, security headers
- **Performance**: Page load time limits (<10s), console error detection, network error filtering
- **Validation**: Comprehensive Zod schemas with Armenian bilingual error messages

### SSL/TLS Critical Patterns
**Media Serving Must-Haves:**
```typescript
// Critical SSL headers for audio/image serving
res.setHeader('Content-Length', fileSize.toString()); // CRITICAL for SSL handshake
res.setHeader('Accept-Ranges', 'bytes');
res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
res.setHeader('Access-Control-Allow-Origin', '*');
```

**Range Request Handler:**
```typescript
const range = req.headers.range;
if (range) {
  const parts = range.replace(/bytes=/, "").split("-");
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  res.status(206); // Partial Content
  res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
}
```

### Deployment & Environment
- **Vercel deployment** with `vercel.json` configuration for SPA routing
- **Environment variables**: `DATABASE_URL`, `JWT_SECRET`, `BREVO_API_KEY`, admin credentials
- **Asset handling**: Static assets in `attached_assets/` served via Vercel routes with API route priority
- **Storage providers**: Cloudflare R2 (primary), Google Cloud Storage, AWS S3 (fallback)
- **SSL Configuration**: Production database requires SSL with proper certificate validation
- **Monitoring**: Health check at `/health`, request logging middleware
- **SEO**: `robots.txt`, `sitemap.xml`, and `SEOMetadata` component with Schema.org structured data

### Incident Management & Documentation
- **Incident Reports**: Structured reports in `incidents/resolved/` with root cause analysis
- **Daily Summaries**: `incidents/YYYY/incident-summary-YYYY-MM-DD.md` for tracking fixes
- **Technical Documentation**: Comprehensive SSL/TLS fixes documented in `SSL_*_ENDPOINT_FIXES.md`
- **Prevention Measures**: Proactive monitoring patterns and testing automation guidelines

## Common Development Tasks

- **Adding new templates**: Create in `templates/`, register in `templates/index.ts`, add to database
- **Schema changes**: Modify `shared/schema.ts`, run `npm run db:push`, test with validation
- **Template customization**: Use admin panel at `/admin/dashboard` or update config via API
- **Testing**: Focus on template rendering, RSVP validation, and authentication flows
- **SSL Media Issues**: Use PowerShell test scripts to validate SSL headers and range requests
- **Incident Documentation**: Create structured reports following `incidents/INCIDENT_TEMPLATE.md`

## Critical SSL/TLS Development Patterns
When working with media serving endpoints:
1. **Always set Content-Length** before streaming data (critical for SSL handshake)
2. **Handle range requests** properly with HTTP 206 Partial Content for audio/video
3. **Include CORS headers** for cross-origin access and incognito mode compatibility
4. **Test with PowerShell scripts** in `test-ssl-*-fixes.ps1` for comprehensive validation
5. **Use Vercel route prioritization** - API routes before static serving for SSL-safe handling

## Important Conventions
- Always validate template configs against `WeddingConfig` type before database storage
- Use `insertRsvpSchema` for RSVP validation (supports Armenian error messages)  
- Template components must handle missing config properties with safe defaults
- Database queries are template-scoped using `templateId` foreign keys

## Development Environment Notes
- **Database**: PostgreSQL with Drizzle ORM, no MongoDB (despite MCP tools availability)
- **Authentication**: Development mode bypasses auth - uses mock users for testing
- **File uploads**: Multi-provider abstraction supports Cloudflare R2, Google Cloud Storage and AWS S3
- **Build system**: Vite with manual chunks for vendor, router, and UI components
- **Error handling**: Development runtime error overlay via Replit plugin
- **SSL Testing**: Use PowerShell for Windows (`test-ssl-*.ps1`) or Node.js (`test-ssl-*.js`) for cross-platform
- **Staging Environment**: `npm run deploy:staging` with `vercel.staging.json` configuration