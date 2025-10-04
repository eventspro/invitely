#!/bin/bash

# Staging Deployment Script for Invitely Wedding Platform
# Usage: ./deploy-staging.sh

echo "🚀 Starting staging deployment for Invitely..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

# Set environment to staging
export NODE_ENV=staging

# Build the project
echo "📦 Building project for staging..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the issues and try again."
    exit 1
fi

echo "✅ Build completed successfully!"

# Deploy to Vercel with staging configuration
echo "🌐 Deploying to Vercel staging environment..."
vercel --local-config vercel.staging.json --prod

if [ $? -eq 0 ]; then
    echo "✅ Staging deployment completed successfully!"
    echo "🎉 Your staging site should be available at your assigned Vercel URL"
    echo "📝 Next steps:"
    echo "   1. Configure your custom domain stage.4ever.am in Vercel dashboard"
    echo "   2. Set up environment variables in Vercel dashboard"
    echo "   3. Test all functionality on staging environment"
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi