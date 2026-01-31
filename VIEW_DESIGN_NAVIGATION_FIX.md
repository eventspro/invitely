# View Design Button Navigation Fix

## Issue
The "View Design" buttons on the pricing plans on the main page were redirecting to non-existent template pages instead of the actual Templates 1-5.

## Root Cause
The `templateRoute` values in `shared/content-config.ts` were using old/incorrect slug paths that didn't match the actual template slugs in the database.

### Old Routes (Incorrect):
- Basic plan: `/michael-sarah-classic`
- Standard plan: `/elegant` ✅ (already correct)
- Premium plan: `/romantic` ✅ (already correct)
- Deluxe plan: `/pro` ✅ (already correct)
- Ultimate plan: `/nature` ✅ (already correct)

### Actual Template Slugs (from database):
Based on `scripts/seed-production-templates.ts`, the actual template slugs are:
1. `/classic` - Classic Wedding Template
2. `/elegant` - Elegant Wedding Template
3. `/romantic` - Romantic Wedding Template
4. `/pro` - Pro Wedding Template
5. `/nature` - Nature Wedding Template

## Solution
Updated `shared/content-config.ts` line 191 to change:
```typescript
templateRoute: "/michael-sarah-classic"  // ❌ Non-existent template
```
to:
```typescript
templateRoute: "/classic"  // ✅ Correct template slug
```

## Files Changed
- `shared/content-config.ts` - Updated basic plan's `templateRoute` from `/michael-sarah-classic` to `/classic`

## Verification
After deployment, all 5 pricing plan "View Design" buttons should now redirect to:
1. Basic (10,000 AMD) → `/classic`
2. Standard (17,000 AMD) → `/elegant`
3. Premium (23,000 AMD) → `/romantic` (popular plan)
4. Deluxe (31,000 AMD) → `/pro`
5. Ultimate (37,000 AMD) → `/nature`

## Deployment
- **Commit**: `dbe8adf` - "Fix 'View Design' button navigation - update template routes to match actual template slugs"
- **Deployed**: 2025-01-XX via Vercel
- **Production URL**: https://invitelyfinal-lsqm09inv-haruts-projects-9810c546.vercel.app

## Testing Instructions
1. Visit production site homepage
2. Scroll to "Wedding Templates & Pricing" section
3. Click each "View Design" button (5 plans)
4. Verify each button navigates to an existing template page
5. Confirm no 404 errors or "Template not found" messages

## Related Files
- `client/src/pages/main.tsx` - Pricing cards component (lines 590-665)
- `shared/content-config.ts` - Central configuration for pricing plans (lines 169-280)
- `scripts/seed-production-templates.ts` - Database seeding with actual template slugs

## Prevention
- Always verify template slugs match database records before updating routes
- Use the `check-template-status.ts` script to list actual templates in database
- Template slugs should be simple and consistent: `/classic`, `/elegant`, `/romantic`, `/pro`, `/nature`
