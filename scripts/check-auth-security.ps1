# scripts/check-auth-security.ps1
# Windows equivalent of check-auth-security.sh
# Usage: .\scripts\check-auth-security.ps1 [-BaseUrl "https://4ever.am"]

param(
  [string]$BaseUrl = "https://4ever.am"
)

$Fail = $false

Write-Host ""
Write-Host "══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Auth Security Pre-Deploy Check"
Write-Host "  Target: $BaseUrl"
Write-Host "══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Helper
function Test-FilePattern([string]$Pattern, [string[]]$Files) {
  foreach ($f in $Files) {
    if (Test-Path $f) {
      $hits = Select-String -Path $f -Pattern $Pattern -ErrorAction SilentlyContinue
      if ($hits) { return $hits }
    }
  }
  return $null
}

# 1. No VERCEL env in auth middleware
Write-Host "[1/7] Checking for process.env.VERCEL in auth files..."
if (Test-FilePattern "process\.env\.VERCEL" @("server/middleware/auth.ts","server/routes/auth.ts")) {
  Write-Host "  FAIL: VERCEL env found in auth middleware" -ForegroundColor Red ; $Fail = $true
} else { Write-Host "  PASS" -ForegroundColor Green }

# 2. No NOW_REGION in auth middleware
Write-Host "[2/7] Checking for process.env.NOW_REGION in auth files..."
if (Test-FilePattern "process\.env\.NOW_REGION" @("server/middleware/auth.ts","server/routes/auth.ts")) {
  Write-Host "  FAIL: NOW_REGION found in auth middleware" -ForegroundColor Red ; $Fail = $true
} else { Write-Host "  PASS" -ForegroundColor Green }

# 3. No NODE_ENV in auth middleware
Write-Host "[3/7] Checking for NODE_ENV in server/middleware/auth.ts..."
if (Test-FilePattern "NODE_ENV" @("server/middleware/auth.ts")) {
  Write-Host "  FAIL: NODE_ENV found in auth middleware" -ForegroundColor Red ; $Fail = $true
} else { Write-Host "  PASS" -ForegroundColor Green }

# 4. No hardcoded JWT secret
Write-Host "[4/7] Checking for hardcoded JWT secret..."
if (Test-FilePattern "your-super-secret|change-in-production" (Get-ChildItem server -Recurse -Filter *.ts | Select-Object -ExpandProperty FullName)) {
  Write-Host "  FAIL: Hardcoded JWT secret found" -ForegroundColor Red ; $Fail = $true
} else { Write-Host "  PASS" -ForegroundColor Green }

# 5. JWT_SECRET has no || fallback
Write-Host "[5/7] Checking JWT_SECRET has no fallback..."
if (Test-FilePattern "JWT_SECRET.*\|\|" @("server/middleware/auth.ts")) {
  Write-Host "  FAIL: JWT_SECRET has a fallback value" -ForegroundColor Red ; $Fail = $true
} else { Write-Host "  PASS" -ForegroundColor Green }

# 6. Live: /api/admin-panel unauthenticated must return non-200
Write-Host "[6/7] Live check: unauthenticated /api/admin-panel should NOT return 200..."
try {
  $resp = Invoke-WebRequest -Uri "$BaseUrl/api/admin-panel/smoke-test-id/dashboard" -UseBasicParsing -ErrorAction SilentlyContinue
  $status = $resp.StatusCode
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  if (-not $status) { $status = 0 }
}

if ($status -eq 200) {
  Write-Host "  CRITICAL FAIL: Returned 200 without auth token!" -ForegroundColor Red ; $Fail = $true
} else {
  Write-Host "  PASS (returned HTTP $status)" -ForegroundColor Green
}

# 7. Live: /health must not leak env info
Write-Host "[7/7] Live check: /health must not leak environment info..."
try {
  $body = (Invoke-WebRequest -Uri "$BaseUrl/health" -UseBasicParsing).Content
  if ($body -match "databaseUrl|DATABASE_URL|environment|nodeEnv|version") {
    Write-Host "  FAIL: /health leaks info: $body" -ForegroundColor Red ; $Fail = $true
  } else {
    Write-Host "  PASS: $body" -ForegroundColor Green
  }
} catch {
  Write-Host "  WARN: Could not reach $BaseUrl/health" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "══════════════════════════════════════════" -ForegroundColor Cyan
if ($Fail) {
  Write-Host "  SECURITY CHECK FAILED — DO NOT DEPLOY" -ForegroundColor Red
  Write-Host "══════════════════════════════════════════" -ForegroundColor Cyan
  exit 1
} else {
  Write-Host "  ALL CHECKS PASSED — SAFE TO DEPLOY" -ForegroundColor Green
  Write-Host "══════════════════════════════════════════" -ForegroundColor Cyan
  exit 0
}
