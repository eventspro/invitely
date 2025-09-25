# Wedding Platform AI Development Guide

## Architecture Overview

This is a **multi-tenant wedding platform** enabling couples to create customized wedding websites with multi-layered access control:

- **Backend**: Express.js + Drizzle ORM (PostgreSQL) deployed as Vercel serverless functions
- **Frontend**: React SPA with Wouter routing, TanStack Query for server state, and Context for app state  
- **Templates**: Lazy-loaded modular system with JSONB configs stored per template instance
- **Database**: Template-scoped data isolation with comprehensive Zod validation schemas
- **Storage**: Multi-provider object storage abstraction (Google Cloud, AWS S3) with presigned URLs
- **Authentication**: JWT-based auth with separate systems for template admins vs. platform admins

## Key Development Patterns

### Template System Structure
Templates are located in `client/src/templates/` with this pattern:
```
templates/
├── index.ts          # Template registry and lazy loading
├── types.ts          # Shared WeddingConfig interface  
├── pro/
│   ├── ProTemplate.tsx
│   └── config.ts     # defaultConfig export
└── classic/
    ├── ClassicTemplate.tsx  
    └── config.ts
```

**Critical**: When working with templates, always use the `WeddingConfig` type from `templates/types.ts`. Template configs are stored in the database as JSONB and loaded dynamically via `/api/templates/:id/config`.

### Database Schema Key Points
- `templates` table stores template instances with `config` JSONB field
- Template-scoped foreign keys: `rsvps.templateId`, `guestPhotos.templateId`, etc.
- Use Zod schemas from `shared/schema.ts` for all data validation
- Run migrations with `npm run db:migrate` (includes seeding default template)

### Development Workflow
```bash
# Development server (Vite dev server with proxy to Express backend)
npm run dev          # Frontend: localhost:5173, Backend: localhost:5001

# Database operations  
npm run db:push      # Push Drizzle schema changes to database
npm run db:migrate   # Run migrations + seed default template via scripts/migrate-default-template.ts

# Testing
npx playwright test  # E2E tests with auto-start dev server
npm run check        # TypeScript type checking

# Production build
npm run build        # Vite build + esbuild server bundle
npm run vercel-build # Vercel-optimized build (same as npm run build)
npm run preview      # Test production build locally
```

### API Route Patterns
Routes in `server/routes/` follow RESTful conventions with authentication layers:
- `GET /api/templates/:identifier/config` - Fetch by ID or slug (public)
- `POST /api/templates/:id/rsvps` - RSVP submission (validates with insertRsvpSchema, includes duplicate detection)
- `POST /api/templates/:id/images/upload` - Multi-provider image upload with presigned URLs
- Template admin routes (`requireAdminPanelAccess` middleware) - JWT-based auth for Ultimate plan customers
- Platform admin routes (`/api/admin/*`) - Separate auth system for platform management
- File routes (`/uploads/*`, `/attached_assets/*`) - Proper MIME type handling and caching headers

### Component Architecture & Build System
- **Shadcn/UI components** in `client/src/components/ui/` (Radix UI primitives)
- **Path aliases**: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`
- **State management**: TanStack Query for server state, Context for app-level state
- **Styling**: Tailwind with custom CSS variables for wedding themes
- **Build chunking**: Vendor (React), router (Wouter), UI (Radix) chunks for optimal loading
- **Asset handling**: Vercel routes with proper caching headers (31536000s for assets, 86400s for previews)

### Critical Files to Understand
- `shared/schema.ts` - Complete database schema with Zod validation
- `client/src/templates/types.ts` - WeddingConfig interface (200+ lines of config options)
- `server/index.ts` - Express server setup with environment validation and error handling
- `vite.config.ts` - Development proxy, build chunking, and path resolution

### Armenian Localization
This platform specifically supports **Armenian weddings** with:
- Armenian font loading via `ArmenianFontProvider` 
- Bilingual validation messages in Zod schemas
- Armenian date formatting and cultural conventions
- Scripts in `scripts/` for applying Armenian configs to templates

### Testing & Quality Assurance
- **E2E Testing**: Playwright with auto-server startup (`npx playwright test`)
- **Test Coverage**: Template rendering, RSVP validation, admin auth flows, mobile responsiveness
- **Performance**: Page load time limits (<10s), console error detection, network error filtering
- **Validation**: Comprehensive Zod schemas with Armenian bilingual error messages

### Deployment & Environment
- **Vercel deployment** with `vercel.json` configuration for SPA routing
- **Environment variables**: `DATABASE_URL`, `JWT_SECRET`, admin credentials
- **Asset handling**: Static assets in `attached_assets/` served via Vercel routes
- **Monitoring**: Health check at `/health`, request logging middleware

## Common Development Tasks

- **Adding new templates**: Create in `templates/`, register in `templates/index.ts`, add to database
- **Schema changes**: Modify `shared/schema.ts`, run `npm run db:push`, test with validation
- **Template customization**: Use admin panel at `/admin/dashboard` or update config via API
- **Testing**: Focus on template rendering, RSVP validation, and authentication flows

## Important Conventions
- Always validate template configs against `WeddingConfig` type before database storage
- Use `insertRsvpSchema` for RSVP validation (supports Armenian error messages)  
- Template components must handle missing config properties with safe defaults
- Database queries are template-scoped using `templateId` foreign keys