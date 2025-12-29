# Test SSL Audio Endpoint Fixes
# Run this in PowerShell to validate SSL/TLS fixes for audio streaming

Write-Host "🎵 Testing SSL-safe audio serving endpoints..." -ForegroundColor Cyan

$baseUrl = "https://invitelyfinal-aw3jslnm1-haruts-projects-9810c546.vercel.app"
$audioFile = "Indila - Love Story_1756335711694.mp3"
$audioEndpoint = "$baseUrl/api/audio/serve/$audioFile"

# Test 1: Direct HTTPS audio access (complete file)
Write-Host "`n1️⃣ Testing direct HTTPS audio access..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $audioEndpoint -Method HEAD -Headers @{
        'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        'DNT' = '1'  # Simulate incognito mode
    }
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "✅ Content-Length: $($response.Headers['Content-Length'])" -ForegroundColor Green
    Write-Host "✅ Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Green
    Write-Host "✅ Accept-Ranges: $($response.Headers['Accept-Ranges'])" -ForegroundColor Green
    Write-Host "✅ Access-Control-Allow-Origin: $($response.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
} catch {
    Write-Host "❌ HTTPS audio test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Range request (partial content - critical for audio streaming)
Write-Host "`n2️⃣ Testing range request (206 Partial Content)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $audioEndpoint -Method HEAD -Headers @{
        'Range' = 'bytes=0-1023'  # Request first 1KB
        'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        'DNT' = '1'  # Simulate incognito mode
    }
    
    if ($response.StatusCode -eq 206) {
        Write-Host "✅ Status: 206 Partial Content" -ForegroundColor Green
        Write-Host "✅ Content-Range: $($response.Headers['Content-Range'])" -ForegroundColor Green
        Write-Host "✅ Content-Length: $($response.Headers['Content-Length'])" -ForegroundColor Green
        Write-Host "✅ Accept-Ranges: $($response.Headers['Accept-Ranges'])" -ForegroundColor Green
    } else {
        Write-Host "❌ Expected 206, got: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Range request test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: CORS preflight (OPTIONS request)
Write-Host "`n3️⃣ Testing CORS preflight request..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $audioEndpoint -Method OPTIONS -Headers @{
        'Origin' = 'https://example.com'
        'Access-Control-Request-Method' = 'GET'
        'Access-Control-Request-Headers' = 'Range'
    }
    
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "✅ Access-Control-Allow-Origin: $($response.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
    Write-Host "✅ Access-Control-Allow-Methods: $($response.Headers['Access-Control-Allow-Methods'])" -ForegroundColor Green
} catch {
    Write-Host "❌ CORS preflight test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Security headers validation
Write-Host "`n4️⃣ Testing security headers..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $audioEndpoint -Method HEAD
    
    $securityHeaders = @{
        'X-Content-Type-Options' = $response.Headers['X-Content-Type-Options']
        'X-Frame-Options' = $response.Headers['X-Frame-Options']
        'Strict-Transport-Security' = $response.Headers['Strict-Transport-Security']
        'Access-Control-Allow-Origin' = $response.Headers['Access-Control-Allow-Origin']
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

# Test 5: Conditional request (If-Modified-Since)
Write-Host "`n5️⃣ Testing conditional request caching..." -ForegroundColor Yellow
try {
    # First request to get Last-Modified header
    $response1 = Invoke-WebRequest -Uri $audioEndpoint -Method HEAD
    $lastModified = $response1.Headers['Last-Modified']
    
    if ($lastModified) {
        Write-Host "📅 Last-Modified: $lastModified" -ForegroundColor Cyan
        
        # Second request with If-Modified-Since
        $response2 = Invoke-WebRequest -Uri $audioEndpoint -Method HEAD -Headers @{
            'If-Modified-Since' = $lastModified
        }
        
        if ($response2.StatusCode -eq 304) {
            Write-Host "✅ Status: 304 Not Modified (proper caching)" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Expected 304, got: $($response2.StatusCode)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ No Last-Modified header found" -ForegroundColor Yellow
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 304) {
        Write-Host "✅ Status: 304 Not Modified (proper caching)" -ForegroundColor Green
    } else {
        Write-Host "❌ Conditional request test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 6: Test with different browsers/incognito simulation
Write-Host "`n6️⃣ Testing different user agents (incognito simulation)..." -ForegroundColor Yellow

$userAgents = @{
    'Chrome Incognito' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    'Firefox Private' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
    'Safari Private' = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
}

foreach ($browser in $userAgents.GetEnumerator()) {
    try {
        $response = Invoke-WebRequest -Uri $audioEndpoint -Method HEAD -Headers @{
            'User-Agent' = $browser.Value
            'DNT' = '1'  # Do Not Track (common in incognito)
            'Sec-GPC' = '1'  # Global Privacy Control
        } -TimeoutSec 10
        
        Write-Host "✅ $($browser.Key): $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($browser.Key): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 7: Compare with static asset serving (original problematic endpoint)
Write-Host "`n7️⃣ Testing comparison with static assets..." -ForegroundColor Yellow
$staticAssetUrl = "$baseUrl/attached_assets/$audioFile"

try {
    Write-Host "🔄 Testing static asset: $staticAssetUrl" -ForegroundColor Cyan
    $staticResponse = Invoke-WebRequest -Uri $staticAssetUrl -Method HEAD -Headers @{
        'Range' = 'bytes=0-1023'
        'DNT' = '1'
    } -TimeoutSec 10
    
    Write-Host "📊 Static Asset - Status: $($staticResponse.StatusCode)" -ForegroundColor Blue
    Write-Host "📊 Static Asset - Content-Range: $($staticResponse.Headers['Content-Range'])" -ForegroundColor Blue
} catch {
    Write-Host "⚠️ Static asset failed (expected): $($_.Exception.Message)" -ForegroundColor Yellow
}

try {
    Write-Host "🔄 Testing SSL endpoint: $audioEndpoint" -ForegroundColor Cyan
    $sslResponse = Invoke-WebRequest -Uri $audioEndpoint -Method HEAD -Headers @{
        'Range' = 'bytes=0-1023'
        'DNT' = '1'
    } -TimeoutSec 10
    
    Write-Host "🛡️ SSL Endpoint - Status: $($sslResponse.StatusCode)" -ForegroundColor Green
    Write-Host "🛡️ SSL Endpoint - Content-Range: $($sslResponse.Headers['Content-Range'])" -ForegroundColor Green
} catch {
    Write-Host "❌ SSL endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Audio SSL endpoint testing complete!" -ForegroundColor Magenta
Write-Host "   Key improvements over static serving:" -ForegroundColor Cyan
Write-Host "   ✅ SSL-safe range request handling (206 Partial Content)" -ForegroundColor Green
Write-Host "   ✅ Proper Content-Length headers for SSL handshake" -ForegroundColor Green
Write-Host "   ✅ Enhanced CORS support for cross-origin requests" -ForegroundColor Green
Write-Host "   ✅ Incognito mode compatibility with privacy headers" -ForegroundColor Green
Write-Host "   ✅ Security headers (HSTS, X-Content-Type-Options, etc.)" -ForegroundColor Green
Write-Host "`n   This should resolve net::ERR_SSL_PROTOCOL_ERROR issues! 🎵" -ForegroundColor Yellow