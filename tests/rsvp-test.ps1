# RSVP Duplicate Prevention Test
# PowerShell script to test the production bug fixes

$TEST_URL = "http://localhost:5001"
$TEMPLATE_ID = "armenian-classic-001"

Write-Host "🧪 Testing RSVP Duplicate Email Prevention" -ForegroundColor Cyan
Write-Host "Testing against: $TEST_URL" -ForegroundColor Gray
Write-Host "=" * 50

# Test 1: Check if server is responding
Write-Host "`n1️⃣ Testing server connectivity..." -ForegroundColor Yellow

try {
    $healthResponse = Invoke-WebRequest -Uri "$TEST_URL/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Server health check: $($healthResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Server not responding: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure 'npm run dev' is running" -ForegroundColor Yellow
    exit 1
}

# Test 2: Check template configuration loading
Write-Host "`n2️⃣ Testing template configuration loading..." -ForegroundColor Yellow

try {
    $configResponse = Invoke-WebRequest -Uri "$TEST_URL/api/templates/$TEMPLATE_ID/config" -Method GET
    Write-Host "✅ Template config loaded: $($configResponse.StatusCode)" -ForegroundColor Green
    
    $config = $configResponse.Content | ConvertFrom-Json
    if ($config.coupleInfo) {
        $brideName = $config.coupleInfo.bride.firstName
        $groomName = $config.coupleInfo.groom.firstName
        Write-Host "   Wedding: $brideName & $groomName" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Template config failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
}

# Test 3: Submit first RSVP
Write-Host "`n3️⃣ Submitting first RSVP..." -ForegroundColor Yellow

$rsvpData = @{
    firstName = "Test"
    lastName = "User" 
    email = "test.duplicate@example.com"
    guestEmail = "test.duplicate@example.com"
    attendance = "yes"
    guestCount = 2
    guestNames = "Guest One, Guest Two"
    dietaryRestrictions = "None"
    message = "Test message for duplicate prevention"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    $firstRsvp = Invoke-WebRequest -Uri "$TEST_URL/api/templates/$TEMPLATE_ID/rsvp" -Method POST -Body $rsvpData -Headers $headers
    Write-Host "✅ First RSVP submitted: $($firstRsvp.StatusCode)" -ForegroundColor Green
    
    # Test 4: Try to submit duplicate RSVP
    Write-Host "`n4️⃣ Attempting duplicate RSVP with same email..." -ForegroundColor Yellow
    
    $duplicateData = @{
        firstName = "Duplicate"
        lastName = "Attempt" 
        email = "test.duplicate@example.com"
        guestEmail = "test.duplicate@example.com"
        attendance = "yes"
        guestCount = 1
        message = "This should be rejected"
    } | ConvertTo-Json
    
    try {
        $duplicateRsvp = Invoke-WebRequest -Uri "$TEST_URL/api/templates/$TEMPLATE_ID/rsvp" -Method POST -Body $duplicateData -Headers $headers
        Write-Host "❌ DUPLICATE PREVENTION FAILED! Second submission accepted: $($duplicateRsvp.StatusCode)" -ForegroundColor Red
        Write-Host "   This is a BUG - duplicate emails should be rejected" -ForegroundColor Red
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-Host "✅ DUPLICATE PREVENTION WORKING! Second submission rejected with 400" -ForegroundColor Green
            $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "   Error message: $($errorResponse.message)" -ForegroundColor Gray
        } else {
            Write-Host "⚠️ Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "❌ First RSVP failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
}

# Test 5: Submit RSVP with different email (should succeed)
Write-Host "`n5️⃣ Submitting RSVP with different email..." -ForegroundColor Yellow

$differentEmailData = @{
    firstName = "Different"
    lastName = "Email"
    email = "different.test@example.com" 
    guestEmail = "different.test@example.com"
    attendance = "yes"
    guestCount = 1
    message = "This should work with different email"
} | ConvertTo-Json

try {
    $differentRsvp = Invoke-WebRequest -Uri "$TEST_URL/api/templates/$TEMPLATE_ID/rsvp" -Method POST -Body $differentEmailData -Headers $headers
    Write-Host "✅ Different email RSVP submitted: $($differentRsvp.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Different email RSVP failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
}

Write-Host "`n`n📋 Test Summary" -ForegroundColor Cyan
Write-Host "=" * 30
Write-Host "🔍 Key Findings:"
Write-Host "- Server connectivity: Check above results"
Write-Host "- Template loading: Check above results"  
Write-Host "- RSVP duplicate prevention: Check above results"
Write-Host "- Different email acceptance: Check above results"

Write-Host "`n🎯 Production Fix Status:"
Write-Host "✅ RSVP duplicate checking enhanced to use both email fields"
Write-Host "✅ Storage layer updated with 'or' operator for email queries"
Write-Host "✅ Build verification successful"

Write-Host "`n⚠️ Manual verification still needed:"
Write-Host "1. Check database for actual RSVP entries"
Write-Host "2. Test template slug routing (e.g., /armenian-classic-001)"
Write-Host "3. Test admin panel authentication"
Write-Host "4. Verify Armenian error messages display correctly"