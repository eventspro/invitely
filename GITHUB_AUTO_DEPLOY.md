# GitHub Auto-Deploy Setup Instructions

## 🚀 Automatic Deployment Configuration

This repository is configured for automatic deployment to Vercel whenever you push to the `main` branch.

### ✅ **Current Setup**

1. **GitHub Actions Workflow**: `.github/workflows/vercel-deploy.yml`
2. **Vercel Configuration**: `vercel.json`
3. **Project Details**:
   - **Project ID**: `prj_5878W1XnPDZmwtqE2xe44ZiMflMq`
   - **Organization ID**: `team_iYC5E2xig78ZFNdysPsVmntj`
   - **Production URL**: https://invitelyfinal.vercel.app

### 🔧 **Required GitHub Secrets**

To complete the auto-deployment setup, add these secrets to your GitHub repository:

1. Go to: https://github.com/eventspro/invitely/settings/secrets/actions
2. Click "New repository secret" and add:

```
Name: VERCEL_TOKEN
Value: [Your Vercel API Token - get from https://vercel.com/account/tokens]

Name: VERCEL_ORG_ID  
Value: team_iYC5E2xig78ZFNdysPsVmntj

Name: VERCEL_PROJECT_ID
Value: prj_5878W1XnPDZmwtqE2xe44ZiMflMq
```

### 🎯 **How It Works**

1. **Push to main** → Triggers GitHub Actions workflow
2. **Build process** → Runs `npm ci`, `npm run build`  
3. **Deploy to Vercel** → Uses Vercel CLI for production deployment
4. **Automatic updates** → Your site updates within minutes

### 📋 **Manual Deployment Alternatives**

If you need to deploy manually:

#### Option 1: GitHub Integration (Recommended)
- Vercel automatically deploys from GitHub when connected
- Go to [Vercel Dashboard](https://vercel.com/haruts-projects-9810c546/invitelyfinal)
- Ensure "Git Integration" is enabled

#### Option 2: Vercel CLI (when network allows)
```bash
npm run build
npx vercel --prod
```

#### Option 3: Vercel Dashboard
- Upload `dist/` folder manually via Vercel Dashboard
- Use for emergency deployments

### 🔍 **Monitoring Deployments**

- **GitHub Actions**: Check workflow status at https://github.com/eventspro/invitely/actions
- **Vercel Dashboard**: Monitor deployments at https://vercel.com/haruts-projects-9810c546/invitelyfinal
- **Production Site**: https://invitelyfinal.vercel.app

### 🐛 **Troubleshooting**

**If auto-deployment fails:**
1. Check GitHub Actions logs for build errors
2. Verify all secrets are correctly set
3. Ensure Vercel project is connected to GitHub repository
4. Check build passes locally with `npm run build`

**Network issues with Vercel CLI:**
- Use GitHub integration instead of CLI
- Check firewall/proxy settings
- Try different network or VPN

### 🎉 **Next Steps**

1. **Add the required GitHub secrets** (see above)
2. **Push any change** to test auto-deployment
3. **Verify deployment** on production site
4. **Monitor** first deployment in GitHub Actions

Your Armenian wedding platform will now deploy automatically! 🚀