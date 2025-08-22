# Wedding Invitation Website

## Overview

This is a modern wedding invitation website built for Harutyun & Tatev's wedding. The application features an elegant, Armenian-language interface designed to provide guests with all necessary wedding information including event details, venue locations, timeline, and RSVP functionality. The website emphasizes a minimalistic design with cream, gold, and sage green color palette to create a romantic and sophisticated user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 and TypeScript, using a component-based architecture with modern React patterns:

- **UI Framework**: React with TypeScript for type safety
- **Styling**: Tailwind CSS with custom wedding color variables and responsive design
- **Component Library**: Radix UI primitives with shadcn/ui components for consistent, accessible interfaces
- **State Management**: React Hook Form for form handling, TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
The backend follows a REST API pattern with Express.js:

- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Data Validation**: Zod schemas for runtime type checking and validation
- **Session Management**: PostgreSQL session store (connect-pg-simple)
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development

### Database Design
The database schema includes:

- **Users Table**: Basic user authentication (currently unused but prepared)
- **RSVPs Table**: Guest responses with fields for names, email, guest count, guest names, attendance status, and creation timestamp
- **Schema Validation**: Zod schemas ensure data integrity with Armenian language error messages

### Component Architecture
The application is structured with reusable, purpose-specific components:

- **Layout Components**: Navigation, hero section, footer with scroll-to-top functionality
- **Feature Components**: Countdown timer, calendar widget, location cards, timeline display
- **Interactive Components**: RSVP form with validation, map modal for venue locations
- **UI Components**: Comprehensive shadcn/ui component library with custom theming

### Styling and Theming
Custom CSS variables define the wedding color palette:
- Cream background (#F8F6F1)
- Soft gold accents (#DAA520)
- Sage green highlights
- Warm beige and charcoal text colors
- Custom font loading for Playfair Display (serif) and Inter (sans-serif)

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL database hosting via @neondatabase/serverless
- **Drizzle Kit**: Database migrations and schema management

### UI and Styling
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Google Fonts**: Custom typography (Playfair Display, Inter)

### Form and Validation
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime schema validation with Armenian error messages
- **@hookform/resolvers**: Zod integration for React Hook Form

### Development Tools
- **Vite**: Build tool with React plugin and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production
- **Replit Integration**: Development environment plugins

### Planned Integrations
- **Email Service**: RSVP notification system (not yet implemented)
- **Google Maps API**: Interactive venue location maps (placeholder implementation)
- **Background Music**: Audio playback for wedding atmosphere (placeholder)
- **Photo Gallery**: External storage for wedding photos (Yandex Disk/Google Drive integration planned)