#!/usr/bin/env pwsh
# Deployment script with automatic domain alias assignment

Write-Host "🚀 Starting deployment..." -ForegroundColor Cyan

# Deploy to production
Write-Host "`n📦 Deploying to Vercel..." -ForegroundColor Yellow
$deployOutput = vercel --prod 2>&1 | Out-String
Write-Host $deployOutput

# Extract deployment URL from output
$deploymentUrl = $deployOutput | Select-String -Pattern "https://invitely-[a-z0-9]+-haruts-projects-9810c546\.vercel\.app" | ForEach-Object { $_.Matches.Value } | Select-Object -First 1

if ($deploymentUrl) {
    Write-Host "`n✅ Deployment successful: $deploymentUrl" -ForegroundColor Green
    
    # Set domain aliases
    Write-Host "`n🔗 Setting domain aliases..." -ForegroundColor Yellow
    
    Write-Host "   Setting www.4ever.am..." -ForegroundColor Gray
    vercel alias set $deploymentUrl www.4ever.am | Out-Null
    
    Write-Host "   Setting 4ever.am..." -ForegroundColor Gray
    vercel alias set $deploymentUrl 4ever.am | Out-Null
    
    Write-Host "`n✅ Domain aliases updated successfully!" -ForegroundColor Green
    Write-Host "   🌐 https://www.4ever.am" -ForegroundColor Cyan
    Write-Host "   🌐 https://4ever.am" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Deployment failed or URL not found" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 Deployment complete!" -ForegroundColor Green
