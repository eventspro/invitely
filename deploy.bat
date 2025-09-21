@echo off
REM Production Deployment Helper Script for Windows
REM This script helps prepare and deploy your wedding platform to Vercel

echo 🚀 Wedding Platform Deployment Helper
echo ======================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Run this script from the project root directory
    exit /b 1
)

REM Check if git is initialized
if not exist ".git" (
    echo 📦 Initializing git repository...
    git init
    echo ✅ Git repository initialized
)

REM Build the project
echo 🔨 Building project for production...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed. Please fix errors before deploying.
    exit /b 1
)
echo ✅ Build successful

REM Check if vercel CLI is installed
vercel --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 📦 Installing Vercel CLI...
    call npm install -g vercel
    echo ✅ Vercel CLI installed
)

REM Add all changes to git
echo 📝 Adding changes to git...
git add .

REM Commit changes
echo 💾 Committing changes...
set /p commit_message="Enter commit message (or press Enter for default): "
if "%commit_message%"=="" set commit_message=Deploy to production
git commit -m "%commit_message%" || echo No changes to commit

REM Check if remote exists
git remote get-url origin >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 🔗 Please add your GitHub remote:
    echo git remote add origin https://github.com/yourusername/your-repo-name.git
    pause
)

REM Push to GitHub
echo ⬆️ Pushing to GitHub...
git push -u origin main || git push

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
call vercel --prod

echo.
echo 🎉 Deployment complete!
echo.
echo 📋 Next Steps:
echo 1. Configure environment variables in Vercel dashboard
echo 2. Set up custom domain (optional)
echo 3. Test your live application
echo 4. Monitor performance in Vercel dashboard
echo.
echo 📚 See DEPLOYMENT_GUIDE.md for detailed instructions
pause