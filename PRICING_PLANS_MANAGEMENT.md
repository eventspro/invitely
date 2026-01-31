# Pricing Plans Management Feature

## Overview
Extended the Platform → Translations admin page to support managing pricing plans structure, features, and configuration.

## Architecture

### Frontend Components

**`PricingPlansManager.tsx`** - Main management UI component
- Location: `client/src/components/admin/PricingPlansManager.tsx`
- Features:
  - View all pricing plans in sortable list
  - Create new plans with stable ID keys
  - Edit existing plans (price, badge, description, currency)
  - Enable/disable plans
  - Reorder plans (up/down arrows)
  - Delete plans (with confirmation)
  - Toggle features on/off per plan
  - All display text fetched from translation system

**Integration Point**
- Integrated into `client/src/pages/platform-translations.tsx`
- New "Manage Plans" button in the Pricing section
- Opens as modal dialog
- Separate from translation editing workflow

### Backend API

**Routes** - `server/routes/pricing.ts` (already existed)
- `GET /api/pricing-plans` - Fetch all plans with features
- `GET /api/pricing-plans/:id` - Fetch single plan
- `POST /api/pricing-plans` - Create new plan (authenticated)
- `PATCH /api/pricing-plans/:id` - Update plan (authenticated)
- `DELETE /api/pricing-plans/:id` - Delete plan (authenticated)
- `GET /api/plan-features` - Fetch all available features
- `POST /api/plan-features` - Create new feature (authenticated)
- `POST /api/plan-feature-associations` - Associate feature with plan

**Database Schema** (already existed)
- `pricing_plans` table - Plan metadata
- `plan_features` table - Available features
- `plan_feature_associations` table - Plan-to-feature mappings

### Key Design Decisions

**1. Stable Plan IDs**
- Each plan has a `name` field (stable key like "premium", "basic")
- `displayName` is the human-readable fallback
- Translations reference the stable key, not display name

**2. Translation Integration**
- Plan display names come from translations: `templatePlans.plans.{order}.name`
- Feature names come from translations: `templatePlans.features.{featureName}`
- Manager shows fallback values but translations take precedence

**3. Feature Management**
- Features are managed separately from plans
- Plans reference features via associations
- Each feature has `isIncluded` flag per plan
- Optional `value` field for quantifiable features

**4. Ordering**
- Plans have `displayOrder` field (integer)
- UI provides up/down arrows to swap orders
- Frontend sorts by `displayOrder` before display

**5. Enable/Disable**
- Plans have `isActive` boolean flag
- Inactive plans shown with reduced opacity
- Toggle via Switch component

## Usage Flow

### Creating a New Plan
1. Click "Manage Plans" in Pricing section
2. Click "Add New Plan" button
3. Fill in:
   - Plan ID (stable key, lowercase)
   - Display Name (fallback)
   - Price (numeric)
   - Currency (AMD/USD/EUR)
   - Badge (optional)
   - Description
4. Click "Create Plan"
5. Plan appears in list, features can be toggled

### Editing a Plan
1. Click "Edit" on any plan card
2. Modify:
   - Display name
   - Price & currency
   - Badge text
   - Description
   - Feature toggles
3. Click "Save Changes"

### Reordering Plans
1. Use ↑ and ↓ arrow buttons
2. Swaps `displayOrder` with adjacent plan
3. Changes reflected immediately

### Deleting a Plan
1. Click trash icon
2. Confirm deletion
3. Plan and all associations removed

## Translation Keys Structure

Plans reference these translation keys:
- `templatePlans.plans.{order}.name` - Plan display name
- `templatePlans.plans.{order}.description` - Plan description
- `templatePlansSection.planBadges.{planKey}` - Badge text

Features reference:
- `templatePlans.features.{featureName}` - Feature display name

## Files Modified

1. **client/src/pages/platform-translations.tsx**
   - Added `PricingPlansManager` import
   - Added `showPlansManager` state
   - Updated pricing section header with "Manage Plans" button
   - Render `PricingPlansManager` dialog when open

2. **client/src/components/admin/PricingPlansManager.tsx** (NEW)
   - Complete pricing plans management UI
   - CRUD operations for plans
   - Feature toggle interface
   - Reordering controls

3. **server/routes.ts**
   - Added `pricingRoutes` import
   - Registered pricing routes at `/api`

4. **server/routes/pricing.ts**
   - Added `export default router` for ES module compatibility

## Non-Goals (Explicitly Avoided)

- ❌ Redesigning public pricing UI
- ❌ Creating separate "Pricing Admin" page
- ❌ Embedding translations inside plans manager
- ❌ Hardcoding plan names in UI logic
- ❌ Replacing the existing translation editing workflow

## Future Enhancements

Possible improvements:
- Drag-and-drop reordering (currently using up/down arrows)
- Bulk feature assignment
- Plan duplication
- Import/export plans as JSON
- Feature categories management
- Template route assignment per plan
- Currency conversion support

## Testing

Manual testing steps:
1. Navigate to `/platform/translations`
2. Go to "Pricing" tab
3. Click "Manage Plans"
4. Create a new plan
5. Edit existing plan
6. Reorder plans
7. Toggle features
8. Enable/disable plan
9. Verify changes persist after page reload

## Security

- All mutation endpoints require authentication (`authenticateUser` middleware)
- Plan keys validated with regex pattern
- Input sanitization via Zod schemas
- CSRF protection via credentials: "include"

## Backward Compatibility

- Existing `content-config.ts` still works
- Database schema unchanged (already existed)
- Translation keys remain the same
- Public pricing display unaffected
