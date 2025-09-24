# Wedding Platform AI Development Guide

## Architecture Overview

This is a **multi-tenant wedding platform** enabling couples to create customized wedding websites. The architecture is:

- **Backend**: Express.js with Drizzle ORM (PostgreSQL), deployed as Vercel serverless functions
- **Frontend**: React SPA with Wouter routing and TanStack Query for state management  
- **Templates**: Modular wedding template system with shared components and individual configs
- **Database**: Template-scoped data (RSVPs, photos, admin panels) with comprehensive Zod validation schemas

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
# Development server (includes Vite HMR proxy)
npm run dev

# Database operations  
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations + seed default template

# Production build
npm run build        # Builds both client and server
npm run preview      # Test production build locally
```

### API Route Patterns
Routes in `server/routes/` follow RESTful conventions:
- `GET /api/templates/:id/config` - Fetch template configuration
- `POST /api/templates/:id/rsvps` - Submit RSVP (validates with insertRsvpSchema)  
- Template admin routes require authentication middleware
- Platform admin routes (`/api/admin/*`) for multi-tenancy management

### Component Architecture
- **Shadcn/UI components** in `client/src/components/ui/`
- **Path aliases**: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`
- **State management**: TanStack Query for server state, Context for app-level state
- **Styling**: Tailwind with custom CSS variables for wedding themes

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