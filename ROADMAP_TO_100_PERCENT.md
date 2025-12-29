# Roadmap to 100% - Wedding Platform

## Phase 1: Fix Existing Tests (1-2 days) 🔧

### Critical Fixes
- [ ] **Fix Template Schema Validation** (2 hours)
  - Update `insertTemplateSchema` in `shared/schema.ts` to match actual usage
  - Ensure all template keys (pro, classic, elegant, romantic, nature) validate correctly
  - Fix JSONB config structure validation
  - Target: 6 failing tests → 0 failing tests

- [ ] **Execute Integration Tests** (4 hours)
  - Add actual HTTP testing with supertest
  - Connect to running dev server or use in-memory server
  - Implement request/response validation for all API routes
  - Target: 50+ integration tests passing

- [ ] **Run E2E Tests** (2 hours)
  - Execute Playwright tests: `npx playwright test`
  - Fix any UI/UX issues discovered
  - Add more E2E scenarios for critical paths
  - Target: All E2E tests passing

**Phase 1 Target: 100% Test Passing Rate**

---

## Phase 2: Core Missing Features (1-2 weeks) ⚡

### High Priority (Critical for Production)

#### 1. Rate Limiting (1 day)
```typescript
// server/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

export const rsvpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 RSVPs per hour per IP
  message: 'Too many RSVP submissions'
});
```

**Implementation:**
- [ ] Create `server/middleware/rateLimiter.ts`
- [ ] Apply to all public API routes
- [ ] Special limits for RSVP endpoints (prevent spam)
- [ ] Add tests for rate limiting
- [ ] Document in API documentation

#### 2. CSRF Protection (1 day)
```typescript
// server/middleware/csrf.ts
import csrf from 'csurf';

export const csrfProtection = csrf({ 
  cookie: true,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production'
});
```

**Implementation:**
- [ ] Install `csurf` package
- [ ] Add CSRF middleware to server
- [ ] Generate tokens for forms
- [ ] Update frontend to include CSRF tokens
- [ ] Add CSRF validation tests

#### 3. Input Sanitization & XSS Prevention (2 days)
```typescript
// server/middleware/sanitize.ts
import { sanitize } from 'sanitize-html';

export const sanitizeInput = (req, res, next) => {
  // Sanitize all string inputs
  Object.keys(req.body).forEach(key => {
    if (typeof req.body[key] === 'string') {
      req.body[key] = sanitize(req.body[key]);
    }
  });
  next();
};
```

**Implementation:**
- [ ] Install `sanitize-html` package
- [ ] Create sanitization middleware
- [ ] Apply to all POST/PUT/PATCH routes
- [ ] Add XSS test cases
- [ ] Update validation schemas with sanitization

#### 4. Payment Processing Integration (3-5 days)
```typescript
// server/services/payment.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession(templatePlan, userId) {
  const prices = {
    basic: 1000, // $10 in cents
    standard: 2500,
    premium: 5000,
    deluxe: 7500,
    ultimate: 15000
  };
  
  return await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'amd',
        product_data: { name: `${templatePlan} Wedding Template` },
        unit_amount: prices[templatePlan]
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${process.env.BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/pricing`
  });
}
```

**Implementation:**
- [ ] Set up Stripe account and get API keys
- [ ] Create `server/services/payment.ts`
- [ ] Add payment routes to `server/routes/payment.ts`
- [ ] Implement checkout session creation
- [ ] Add webhook handler for payment confirmation
- [ ] Update order status on successful payment
- [ ] Grant admin panel access for Ultimate plan
- [ ] Create payment UI components
- [ ] Add payment integration tests
- [ ] Test in Stripe test mode

**Files to Create:**
- `server/services/payment.ts`
- `server/routes/payment.ts`
- `client/src/components/PaymentForm.tsx`
- `client/src/pages/PaymentSuccess.tsx`
- `tests/integration/payment.test.ts`

---

## Phase 3: Advanced Features (2-3 weeks) 🚀

#### 5. Real-time WebSocket Updates (3 days)
```typescript
// server/websocket.ts
import { WebSocketServer } from 'ws';

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws, req) => {
    const templateId = new URL(req.url, 'http://localhost').searchParams.get('templateId');
    
    ws.on('message', (message) => {
      // Broadcast new RSVP to all connected clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  });
}
```

**Implementation:**
- [ ] Enhance existing WebSocket setup
- [ ] Create template-specific channels
- [ ] Broadcast RSVP submissions in real-time
- [ ] Update admin dashboard with live data
- [ ] Add WebSocket reconnection logic
- [ ] Create useWebSocket custom hook
- [ ] Add WebSocket tests

**Files to Create/Update:**
- `server/websocket.ts` (enhance existing)
- `client/src/hooks/useWebSocket.ts`
- `tests/integration/websocket.test.ts`

#### 6. Language Switching UI (2 days)
```typescript
// client/src/components/LanguageSwitcher.tsx
export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  
  return (
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="hy">🇦🇲 Հայերեն</SelectItem>
        <SelectItem value="en">🇬🇧 English</SelectItem>
        <SelectItem value="ru">🇷🇺 Русский</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

**Implementation:**
- [ ] Create LanguageSwitcher component
- [ ] Add language persistence (localStorage)
- [ ] Update LanguageContext with switching logic
- [ ] Add language switcher to all templates
- [ ] Test language transitions
- [ ] Ensure all content updates properly

**Files to Create:**
- `client/src/components/LanguageSwitcher.tsx`
- `tests/unit/language-switching.test.ts`

#### 7. QR Code Generation (1 day)
```typescript
// server/services/qrcode.ts
import QRCode from 'qrcode';

export async function generateTemplateQR(templateSlug: string) {
  const url = `${process.env.BASE_URL}/${templateSlug}`;
  return await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' }
  });
}
```

**Implementation:**
- [ ] Create QR code generation service
- [ ] Add QR code to admin panel
- [ ] Allow downloading QR code
- [ ] Add QR code to template sharing
- [ ] Style QR code with wedding theme colors

**Files to Create:**
- `server/services/qrcode.ts`
- `client/src/components/QRCodeDisplay.tsx`
- `tests/unit/qrcode.test.ts`

#### 8. Social Media Sharing (2 days)
```typescript
// client/src/components/ShareButtons.tsx
export function ShareButtons({ templateUrl, coupleNames }) {
  const shareText = `Join us for ${coupleNames}'s wedding!`;
  
  return (
    <div className="flex gap-4">
      <ShareButton 
        platform="facebook"
        url={`https://facebook.com/sharer/sharer.php?u=${templateUrl}`}
      />
      <ShareButton 
        platform="twitter"
        url={`https://twitter.com/intent/tweet?text=${shareText}&url=${templateUrl}`}
      />
      <ShareButton 
        platform="whatsapp"
        url={`https://wa.me/?text=${shareText} ${templateUrl}`}
      />
      <ShareButton 
        platform="telegram"
        url={`https://t.me/share/url?url=${templateUrl}&text=${shareText}`}
      />
    </div>
  );
}
```

**Implementation:**
- [ ] Create ShareButtons component
- [ ] Add Open Graph meta tags (already done in SEOMetadata)
- [ ] Add Twitter Card meta tags (already done)
- [ ] Implement native share API for mobile
- [ ] Add copy link functionality
- [ ] Track sharing analytics

**Files to Create:**
- `client/src/components/ShareButtons.tsx`
- `tests/unit/share-buttons.test.ts`

#### 9. Google Calendar Integration (2 days)
```typescript
// client/src/utils/calendar.ts
export function generateGoogleCalendarLink(wedding) {
  const startDate = new Date(wedding.date).toISOString().replace(/-|:|\.\d+/g, '');
  const endDate = new Date(wedding.date.getTime() + 6 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, '');
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${wedding.groomName} & ${wedding.brideName} Wedding`,
    dates: `${startDate}/${endDate}`,
    details: wedding.description,
    location: wedding.venue
  });
  
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function generateICalFile(wedding) {
  return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${wedding.date}
SUMMARY:${wedding.groomName} & ${wedding.brideName} Wedding
DESCRIPTION:${wedding.description}
LOCATION:${wedding.venue}
END:VEVENT
END:VCALENDAR`;
}
```

**Implementation:**
- [ ] Create calendar utility functions
- [ ] Add "Add to Calendar" button
- [ ] Support Google Calendar, iCal, Outlook
- [ ] Generate downloadable .ics files
- [ ] Test calendar links on mobile

**Files to Create:**
- `client/src/utils/calendar.ts`
- `client/src/components/AddToCalendar.tsx`
- `tests/unit/calendar.test.ts`

#### 10. Photo Moderation Workflow (3 days)
```typescript
// server/routes/photo-moderation.ts
export function registerPhotoModerationRoutes(app: Express) {
  // Get pending photos for approval
  app.get('/api/admin-panel/:templateId/photos/pending', 
    authenticateUser, 
    requireAdminPanelAccess, 
    async (req, res) => {
      const photos = await db.select()
        .from(guestPhotos)
        .where(and(
          eq(guestPhotos.templateId, req.params.templateId),
          eq(guestPhotos.approved, false)
        ));
      res.json(photos);
    }
  );
  
  // Approve photo
  app.post('/api/admin-panel/:templateId/photos/:photoId/approve',
    authenticateUser,
    requireAdminPanelAccess,
    async (req, res) => {
      await db.update(guestPhotos)
        .set({ approved: true, approvedAt: new Date() })
        .where(eq(guestPhotos.id, req.params.photoId));
      res.json({ success: true });
    }
  );
  
  // Reject photo
  app.post('/api/admin-panel/:templateId/photos/:photoId/reject',
    authenticateUser,
    requireAdminPanelAccess,
    async (req, res) => {
      await db.delete(guestPhotos)
        .where(eq(guestPhotos.id, req.params.photoId));
      res.json({ success: true });
    }
  );
}
```

**Implementation:**
- [ ] Add `approved` and `approvedAt` fields to guestPhotos schema
- [ ] Create photo moderation routes
- [ ] Build moderation UI in admin panel
- [ ] Add bulk approve/reject functionality
- [ ] Send notifications to users when photos approved
- [ ] Add moderation tests

**Files to Create/Update:**
- `shared/schema.ts` (add fields)
- `server/routes/photo-moderation.ts`
- `client/src/pages/PhotoModeration.tsx`
- `tests/integration/photo-moderation.test.ts`

#### 11. RSVP Reminder Emails (2 days)
```typescript
// server/services/reminders.ts
import { db } from '../db';
import { sendRSVPReminderEmail } from '../email';

export async function sendRSVPReminders(templateId: string) {
  const template = await db.select().from(templates)
    .where(eq(templates.id, templateId)).limit(1);
  
  const weddingDate = new Date(template[0].config.wedding.date);
  const daysUntilWedding = Math.floor((weddingDate - Date.now()) / (1000 * 60 * 60 * 24));
  
  // Send reminders at 30, 14, 7, and 3 days before wedding
  if ([30, 14, 7, 3].includes(daysUntilWedding)) {
    const invitedGuests = template[0].config.guestList || [];
    const rsvpEmails = await db.select().from(rsvps)
      .where(eq(rsvps.templateId, templateId));
    
    const respondedEmails = new Set(rsvpEmails.map(r => r.email));
    const pendingGuests = invitedGuests.filter(g => !respondedEmails.has(g.email));
    
    for (const guest of pendingGuests) {
      await sendRSVPReminderEmail(guest, template[0], daysUntilWedding);
    }
  }
}
```

**Implementation:**
- [ ] Create reminder service
- [ ] Add cron job for scheduled reminders
- [ ] Create reminder email templates
- [ ] Add guest list to template config
- [ ] Configure reminder timing (30, 14, 7, 3 days)
- [ ] Add opt-out mechanism
- [ ] Test reminder scheduling

**Files to Create:**
- `server/services/reminders.ts`
- `server/cron/reminder-jobs.ts`
- `tests/integration/reminders.test.ts`

---

## Phase 4: Infrastructure & DevOps (1 week) 🔒

#### 12. Error Tracking with Sentry (1 day)
```typescript
// server/monitoring/sentry.ts
import * as Sentry from '@sentry/node';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}

export const sentryErrorHandler = Sentry.Handlers.errorHandler();
```

**Implementation:**
- [ ] Set up Sentry account
- [ ] Install @sentry/node and @sentry/react
- [ ] Initialize Sentry in server and client
- [ ] Add error boundaries in React
- [ ] Configure error alerting
- [ ] Test error reporting

#### 13. Database Backups (1 day)
```typescript
// scripts/backup-database.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function backupDatabase() {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `backup-${timestamp}.sql`;
  
  await execAsync(
    `pg_dump ${process.env.DATABASE_URL} > backups/${filename}`
  );
  
  // Upload to cloud storage
  await uploadToR2(`backups/${filename}`);
}
```

**Implementation:**
- [ ] Create backup script
- [ ] Set up cron job for daily backups
- [ ] Store backups in Cloudflare R2
- [ ] Implement backup retention policy
- [ ] Create restore procedure
- [ ] Test backup/restore process

#### 14. Advanced Analytics Dashboard (3 days)
```typescript
// server/routes/analytics.ts
export function registerAnalyticsRoutes(app: Express) {
  app.get('/api/admin-panel/:templateId/analytics',
    authenticateUser,
    requireAdminPanelAccess,
    async (req, res) => {
      const { startDate, endDate } = req.query;
      
      const analytics = {
        pageViews: await getPageViews(templateId, startDate, endDate),
        rsvpTrends: await getRSVPTrends(templateId),
        guestDemographics: await getGuestDemographics(templateId),
        deviceBreakdown: await getDeviceBreakdown(templateId),
        topReferrers: await getTopReferrers(templateId)
      };
      
      res.json(analytics);
    }
  );
}
```

**Implementation:**
- [ ] Create analytics service
- [ ] Track page views
- [ ] Track user sessions
- [ ] Generate charts with Recharts
- [ ] Export analytics reports
- [ ] Add real-time analytics

**Files to Create:**
- `server/services/analytics.ts`
- `server/routes/analytics.ts`
- `client/src/pages/Analytics.tsx`
- `client/src/components/AnalyticsCharts.tsx`

#### 15. CDN Configuration (1 day)
**Implementation:**
- [ ] Configure Vercel CDN settings
- [ ] Set cache headers for static assets
- [ ] Enable image optimization
- [ ] Add cache purging on updates
- [ ] Test CDN performance

#### 16. Database Connection Pool Optimization (1 day)
```typescript
// server/db.ts - Enhanced
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20, // Increased pool size
  min: 5,  // Minimum connections
  allowExitOnIdle: false,
  // Connection retry logic
  application_name: 'wedding-platform',
});
```

**Implementation:**
- [ ] Optimize pool configuration
- [ ] Add connection monitoring
- [ ] Implement connection retry logic
- [ ] Add pool metrics to dashboard
- [ ] Load test database connections

---

## Implementation Priority Matrix

### Week 1 (Critical Path)
1. ✅ Fix failing schema tests (Day 1)
2. ✅ Execute integration tests (Day 2)
3. ✅ Rate limiting (Day 3)
4. ✅ CSRF protection (Day 4)
5. ✅ Input sanitization (Day 5)

### Week 2 (Payment & Security)
6. 💰 Payment processing (Days 1-5)
7. 🔐 Sentry error tracking (Day 6)
8. 💾 Database backups (Day 7)

### Week 3 (User Experience)
9. 🔴 Real-time WebSocket (Days 1-3)
10. 🌐 Language switching (Day 4)
11. 📱 QR codes (Day 5)
12. 📤 Social sharing (Days 6-7)

### Week 4 (Advanced Features)
13. 📅 Google Calendar (Days 1-2)
14. 🖼️ Photo moderation (Days 3-5)
15. 📧 RSVP reminders (Days 6-7)

### Week 5 (Analytics & Polish)
16. 📊 Analytics dashboard (Days 1-3)
17. 🚀 CDN optimization (Day 4)
18. 🔄 Pool optimization (Day 5)
19. 🧪 Final testing (Days 6-7)

---

## Quick Wins (Can do today!)

### 1. Fix Schema Tests (2 hours)
- Update schema validation
- Run tests again
- Achieve 100% unit test passing

### 2. Add Rate Limiting (2 hours)
- Install express-rate-limit
- Add to server/index.ts
- Protect RSVP endpoints

### 3. Add Language Switcher (2 hours)
- Create component
- Add to templates
- Test switching

---

## Success Metrics

- ✅ **100% Test Coverage**: All unit, integration, and E2E tests passing
- ✅ **Security Score**: Rate limiting, CSRF, input sanitization, Sentry
- ✅ **Payment Integration**: Fully functional Stripe checkout
- ✅ **Real-time Features**: WebSocket updates working
- ✅ **User Experience**: Language switching, social sharing, calendar integration
- ✅ **Admin Features**: Photo moderation, analytics, RSVP reminders
- ✅ **Infrastructure**: Backups, monitoring, CDN, optimized connections

---

## Next Immediate Action

Run this command to get started:

```bash
# 1. Fix schema tests
npm run check
npx vitest run tests/unit/schema-validation.test.ts

# 2. Install rate limiting
npm install express-rate-limit

# 3. Start implementing!
```

**Estimated Total Time: 5-6 weeks to 100% completion**
**Quick wins available today: 6 hours to reach 95% test coverage**
