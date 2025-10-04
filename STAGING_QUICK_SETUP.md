# Staging Environment Quick Setup Guide

## Current Status ✅
Your staging deployment is working at: `https://invitelyfinal-klzwlm409-haruts-projects-9810c546.vercel.app`

## Next Steps to Get `stage.4ever.am`:

### Step 1: Create Separate Staging Project (Recommended)

```powershell
# Create a new directory for staging (optional but cleaner)
mkdir invitely-staging
cd invitely-staging

# Initialize new staging project
vercel init

# Choose "Other" -> Create new project -> Name: "invitely-staging"

# Then copy your code:
cp -r ../invitely/* .
# (or use robocopy on Windows)

# Deploy with staging config
vercel --local-config vercel.staging.json --prod
```

### Step 2: Configure DNS for stage.4ever.am

**Go to your domain registrar** and add:
- **Type**: CNAME  
- **Name**: `stage`
- **Value**: `cname.vercel-dns.com`

### Step 3: Add Custom Domain in Vercel

1. Go to your staging project in Vercel dashboard
2. Settings → Domains → Add Domain
3. Enter: `stage.4ever.am`
4. Vercel will verify DNS automatically

### Step 4: Set Environment Variables

In Vercel Dashboard → Staging Project → Settings → Environment Variables:

```bash
DATABASE_URL=your_staging_database_url
JWT_SECRET=staging_jwt_secret_different_from_prod
NODE_ENV=staging  
ADMIN_USERNAME=staging_admin
ADMIN_PASSWORD=staging_wedding2025
```

## Alternative: Use Current Setup

If you want to use the current deployment, you can add `stage.4ever.am` as a custom domain to your existing project:

1. Go to https://vercel.com/haruts-projects-9810c546/invitelyfinal
2. Settings → Domains → Add Domain
3. Enter: `stage.4ever.am`

## Quick Deploy Commands

```powershell
# Deploy staging
npm run deploy:staging

# Or manually
vercel --local-config vercel.staging.json --prod
```

## Current Deployment URLs:
- **Preview**: https://invitelyfinal-8sbz8bbeg-haruts-projects-9810c546.vercel.app
- **Staging Production**: https://invitelyfinal-klzwlm409-haruts-projects-9810c546.vercel.app

Ready to set up DNS for stage.4ever.am?