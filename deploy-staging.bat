@echo off
REM Staging Deployment Script for Invitely Wedding Platform (Windows)
REM Usage: deploy-staging.bat

echo 🚀 Starting staging deployment for Invitely...

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI is not installed. Please install it first:
    echo npm i -g vercel
    pause
    exit /b 1
)

REM Set environment to staging
set NODE_ENV=staging

REM Build the project
echo 📦 Building project for staging...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed. Please fix the issues and try again.
    pause
    exit /b 1
)

echo ✅ Build completed successfully!

REM Deploy to Vercel with staging configuration
echo 🌐 Deploying to Vercel staging environment...
call vercel --local-config vercel.staging.json --prod

if %errorlevel% equ 0 (
    echo ✅ Staging deployment completed successfully!
    echo 🎉 Your staging site should be available at your assigned Vercel URL
    echo 📝 Next steps:
    echo    1. Configure your custom domain stage.4ever.am in Vercel dashboard
    echo    2. Set up environment variables in Vercel dashboard
    echo    3. Test all functionality on staging environment
) else (
    echo ❌ Deployment failed. Check the error messages above.
)

pause