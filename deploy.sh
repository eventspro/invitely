#!/bin/bash

# Production Deployment Helper Script
# This script helps prepare and deploy your wedding platform to Vercel

set -e  # Exit on any error

echo "🚀 Wedding Platform Deployment Helper"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    echo "✅ Git repository initialized"
fi

# Build the project
echo "🔨 Building project for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI installed"
fi

# Add all changes to git
echo "📝 Adding changes to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
read -p "Enter commit message (or press Enter for default): " commit_message
if [ -z "$commit_message" ]; then
    commit_message="Deploy to production"
fi
git commit -m "$commit_message" || echo "No changes to commit"

# Check if remote exists
if ! git remote get-url origin &> /dev/null; then
    echo "🔗 Please add your GitHub remote:"
    echo "git remote add origin https://github.com/yourusername/your-repo-name.git"
    read -p "Press Enter when you've added the remote..."
fi

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push -u origin main || git push

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure environment variables in Vercel dashboard"
echo "2. Set up custom domain (optional)"
echo "3. Test your live application"
echo "4. Monitor performance in Vercel dashboard"
echo ""
echo "📚 See DEPLOYMENT_GUIDE.md for detailed instructions"