# Staging Environment Setup Guide

## Overview
This guide will help you set up a staging environment for your Invitely wedding platform at `stage.4ever.am` or `stg.4ever.am`.

## Prerequisites
- Vercel CLI installed: `npm i -g vercel`
- Access to your domain registrar (for DNS configuration)
- Staging database (recommended: separate from production)

## Step 1: Create Staging Project on Vercel

### Option A: Via Vercel CLI (Recommended)
```bash
# Login to Vercel if not already logged in
vercel login

# Deploy to create new staging project
vercel --config vercel.staging.json

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your personal account or team
# - Link to existing project? No
# - Project name: invitely-staging
# - Deploy? Yes
```

### Option B: Via Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository again
4. Set project name to `invitely-staging`
5. Configure build settings (same as production)

## Step 2: Configure Environment Variables

Go to your staging project dashboard → Settings → Environment Variables

Add all variables from `.env.staging.example`:

### Required Variables:
```bash
DATABASE_URL=your_staging_database_url
JWT_SECRET=different_jwt_secret_for_staging
NODE_ENV=staging
ADMIN_USERNAME=staging_admin
ADMIN_PASSWORD=staging_wedding2025
BREVO_API_KEY=your_staging_brevo_key
```

### Optional (for full functionality):
```bash
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY=staging_access_key
CLOUDFLARE_R2_SECRET_KEY=staging_secret_key
CLOUDFLARE_R2_BUCKET_NAME=staging_bucket_name
CLOUDFLARE_R2_PUBLIC_URL=staging_bucket_url
```

## Step 3: Set Up Staging Database

### Option A: Separate Neon Database (Recommended)
1. Go to [neon.tech](https://neon.tech)
2. Create new project: `invitely-staging`
3. Copy connection string to `DATABASE_URL`

### Option B: Same Database with Different Schema
```sql
-- Create staging schema in existing database
CREATE SCHEMA staging;
-- Update your DATABASE_URL to use the staging schema
```

## Step 4: Configure Custom Domain

### In Vercel Dashboard:
1. Go to Project Settings → Domains
2. Add custom domain: `stage.4ever.am` or `stg.4ever.am`
3. Vercel will provide DNS configuration

### DNS Configuration (at your registrar):
Add CNAME record:
- **Type**: CNAME
- **Name**: `stage` (or `stg`)
- **Value**: `cname.vercel-dns.com`
- **TTL**: 300 (or default)

## Step 5: Deploy Staging Environment

### Windows:
```cmd
.\deploy-staging.bat
```

### macOS/Linux:
```bash
chmod +x deploy-staging.sh
./deploy-staging.sh
```

### Manual Deployment:
```bash
npm run build
vercel --config vercel.staging.json --prod
```

## Step 6: Verify Deployment

1. **Health Check**: Visit `https://stage.4ever.am/health`
2. **Admin Panel**: Visit `https://stage.4ever.am/admin`
3. **Template Preview**: Test template creation and customization
4. **RSVP System**: Test RSVP submissions
5. **File Uploads**: Test image upload functionality

## Staging Workflow

### Recommended Branch Strategy:
```bash
main → production (4ever.am)
staging → staging environment (stage.4ever.am)
develop → local development
```

### Deploy to Staging:
```bash
# Switch to staging branch
git checkout staging

# Merge latest changes
git merge develop

# Deploy
./deploy-staging.bat
```

## Environment Differences

| Feature | Production | Staging |
|---------|------------|---------|
| Domain | 4ever.am | stage.4ever.am |
| Database | Production DB | Staging DB |
| Storage | Production bucket | Staging bucket |
| Analytics | Production tracking | Test/disabled |
| Admin Creds | Secure production | Staging credentials |
| Debug Mode | Disabled | Enabled |

## Security Considerations

1. **Different Credentials**: Use different admin passwords
2. **Separate Database**: Avoid mixing test data with production
3. **Limited Access**: Consider IP restrictions for staging
4. **Test Data**: Use fake/test data for RSVPs and uploads

## Troubleshooting

### Common Issues:

1. **DNS Not Resolving**:
   - Wait 24-48 hours for propagation
   - Check DNS with: `nslookup stage.4ever.am`

2. **Environment Variables Missing**:
   - Verify in Vercel dashboard → Settings → Environment Variables
   - Redeploy after adding variables

3. **Database Connection Issues**:
   - Ensure staging database URL is correct
   - Check SSL settings in connection string

4. **Build Failures**:
   - Check Node.js version compatibility
   - Ensure all dependencies are in package.json

### Support Commands:
```bash
# Check deployment logs
vercel logs

# View project info
vercel project ls

# Remove staging deployment (if needed)
vercel remove invitely-staging
```

## Next Steps After Setup

1. **Automate Deployments**: Set up GitHub Actions for automatic staging deployments
2. **Testing Suite**: Run automated tests against staging environment
3. **Performance Monitoring**: Set up monitoring for staging environment
4. **Backup Strategy**: Configure staging database backups

## Maintenance

- **Weekly**: Deploy latest changes to staging
- **Monthly**: Clean up test data in staging database
- **Quarterly**: Review and update staging credentials
- **Before Major Releases**: Full testing on staging environment

---

**Need Help?** 
- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Neon Database: [neon.tech/docs](https://neon.tech/docs)
- Domain DNS Help: Contact your registrar support