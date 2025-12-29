# Test SSL Image Endpoint Fixes
# Run this in PowerShell to validate SSL/TLS fixes

Write-Host "🔍 Testing SSL-safe image serving endpoints..." -ForegroundColor Cyan

$baseUrl = "https://invitelyfinal-bdjsjw34t-haruts-projects-9810c546.vercel.app"

# Test 1: Direct HTTPS access
Write-Host "`n1️⃣ Testing direct HTTPS image access..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/images/serve/image_1758763443476.png" -Method HEAD -Headers @{
        'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        'DNT' = '1'  # Simulate incognito mode
    }
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "✅ Content-Length: $($response.Headers['Content-Length'])" -ForegroundColor Green
    Write-Host "✅ Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Green
    Write-Host "✅ Strict-Transport-Security: $($response.Headers['Strict-Transport-Security'])" -ForegroundColor Green
} catch {
    Write-Host "❌ HTTPS test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: HTTP redirect to HTTPS
Write-Host "`n2️⃣ Testing HTTP → HTTPS redirect..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://invitelyfinal-bdjsjw34t-haruts-projects-9810c546.vercel.app/api/images/serve/image_1758763443476.png" -Method HEAD -MaximumRedirection 0
    Write-Host "❌ HTTP should redirect to HTTPS" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 301) {
        $location = $_.Exception.Response.Headers['Location']
        Write-Host "✅ HTTP redirects to HTTPS: $location" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected redirect behavior: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: Invalid file handling
Write-Host "`n3️⃣ Testing invalid file handling..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/images/serve/nonexistent.jpg" -Method GET
    Write-Host "❌ Should return 404 for nonexistent file" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✅ Returns 404 for nonexistent files" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# Test 4: CORS headers
Write-Host "`n4️⃣ Testing CORS headers..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/images/serve/image_1758763443476.png" -Method HEAD -Headers @{
        'Origin' = 'https://example.com'
    }
    $corsOrigin = $response.Headers['Access-Control-Allow-Origin']
    if ($corsOrigin -eq '*') {
        Write-Host "✅ CORS headers present: $corsOrigin" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing CORS headers" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ CORS test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Security headers check
Write-Host "`n5️⃣ Testing security headers..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/images/serve/image_1758763443476.png" -Method HEAD
    
    $securityHeaders = @{
        'X-Content-Type-Options' = $response.Headers['X-Content-Type-Options']
        'X-Frame-Options' = $response.Headers['X-Frame-Options']
        'Strict-Transport-Security' = $response.Headers['Strict-Transport-Security']
    }
    
    foreach ($header in $securityHeaders.GetEnumerator()) {
        if ($header.Value) {
            Write-Host "✅ $($header.Key): $($header.Value)" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Missing $($header.Key)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Security headers test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 SSL endpoint testing complete!" -ForegroundColor Magenta
Write-Host "   The comprehensive SSL/TLS fixes should resolve incognito mode errors." -ForegroundColor Cyan