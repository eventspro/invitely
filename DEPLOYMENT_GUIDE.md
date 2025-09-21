# 🚀 Vercel Deployment Guide for Wedding Platform

## Prerequisites
- ✅ GitHub account
- ✅ Vercel account (free at vercel.com)
- ✅ Your code pushed to GitHub repository

## Step-by-Step Deployment

### 1. Prepare Your GitHub Repository
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit your changes
git commit -m "Prepare for Vercel deployment"

# Add your GitHub remote
git remote add origin https://github.com/yourusername/your-repo-name.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (run from project root)
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: wedding-platform
# - Directory: ./
# - Override settings? No
```

#### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub
4. Select your repository
5. Configure:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist/public`

### 3. Configure Environment Variables

In Vercel Dashboard > Project Settings > Environment Variables, add:

```
DATABASE_URL=postgresql://neondb_owner:npg_iE2wuqaHgO6c@ep-summer-wave-abtfvjyj-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=5c9532fc21a0e0db70f172b75db86d02fd479bfd7109a0c3e0cff87f938e2f6ec11800d491bfa137169462e566d3046d
NODE_ENV=production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=wedding2025
```

### 4. Configure Custom Domain (Optional)
1. Go to Project Settings > Domains
2. Add your domain (e.g., yourweddingplatform.com)
3. Update DNS records as instructed
4. SSL certificate is automatically provided

### 5. Test Your Deployment
- Frontend: https://your-project.vercel.app
- Health Check: https://your-project.vercel.app/health
- API: https://your-project.vercel.app/api/templates
- Admin: https://your-project.vercel.app/admin

## Automatic Deployments
- Every push to `main` branch triggers automatic deployment
- Preview deployments for pull requests
- Rollback capability in Vercel dashboard

## Monitoring & Performance
- Built-in analytics in Vercel dashboard
- Function logs and error tracking
- Performance metrics and optimization suggestions

## Cost Estimation
**Free Tier Includes:**
- 100GB bandwidth/month
- 10 serverless functions
- Unlimited static hosting
- Custom domains
- SSL certificates

**Typical Monthly Usage:**
- Small business (< 1000 visitors): $0 (free tier)
- Growing business (1000-10000 visitors): $20-50
- Established business (10000+ visitors): $50-200

## Support & Troubleshooting
- Vercel docs: https://vercel.com/docs
- Function logs: Vercel Dashboard > Functions tab
- Real-time logs: `vercel logs --follow`