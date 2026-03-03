#!/usr/bin/env bash
# scripts/check-auth-security.sh
# Run before every deploy to catch auth bypasses and secret leaks.
# Usage: bash scripts/check-auth-security.sh [BASE_URL]
# BASE_URL defaults to https://4ever.am

set -euo pipefail

BASE_URL="${1:-https://4ever.am}"
FAIL=0

echo ""
echo "═══════════════════════════════════════════"
echo "  Auth Security Pre-Deploy Check"
echo "  Target: $BASE_URL"
echo "═══════════════════════════════════════════"
echo ""

# ── 1. No VERCEL env in auth middleware ─────────────────────────────────────
echo "[1/7] Checking for process.env.VERCEL in auth files..."
if grep -rn "process\.env\.VERCEL" server/middleware/auth.ts server/routes/auth.ts 2>/dev/null; then
  echo "  ❌ FAIL: VERCEL env in auth middleware"
  FAIL=1
else
  echo "  ✅ PASS"
fi

# ── 2. No NOW_REGION in auth middleware ─────────────────────────────────────
echo "[2/7] Checking for process.env.NOW_REGION in auth files..."
if grep -rn "process\.env\.NOW_REGION" server/middleware/auth.ts server/routes/auth.ts 2>/dev/null; then
  echo "  ❌ FAIL: NOW_REGION env in auth middleware"
  FAIL=1
else
  echo "  ✅ PASS"
fi

# ── 3. No NODE_ENV in auth middleware ────────────────────────────────────────
echo "[3/7] Checking for NODE_ENV in server/middleware/auth.ts..."
if grep -n "NODE_ENV" server/middleware/auth.ts 2>/dev/null; then
  echo "  ❌ FAIL: NODE_ENV found in auth middleware (auth must not depend on environment)"
  FAIL=1
else
  echo "  ✅ PASS"
fi

# ── 4. No hardcoded JWT secret ───────────────────────────────────────────────
echo "[4/7] Checking for hardcoded JWT secret..."
if grep -rn "your-super-secret\|change-in-production" server/ 2>/dev/null; then
  echo "  ❌ FAIL: Hardcoded JWT secret found"
  FAIL=1
else
  echo "  ✅ PASS"
fi

# ── 5. JWT_SECRET has no || fallback ─────────────────────────────────────────
echo "[5/7] Checking JWT_SECRET has no fallback..."
if grep -n "JWT_SECRET.*||" server/middleware/auth.ts 2>/dev/null; then
  echo "  ❌ FAIL: JWT_SECRET has a fallback value"
  FAIL=1
else
  echo "  ✅ PASS"
fi

# ── 6. Live: /api/admin-panel returns non-200 unauthenticated ─────────────
echo "[6/7] Live check: unauthenticated /api/admin-panel should NOT return 200..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "${BASE_URL}/api/admin-panel/smoke-test-id/dashboard" 2>/dev/null || echo "000")
if [ "$STATUS" = "200" ]; then
  echo "  ❌ CRITICAL FAIL: Returned 200 without auth token!"
  FAIL=1
else
  echo "  ✅ PASS (returned HTTP $STATUS)"
fi

# ── 7. Live: /health leaks no env info ───────────────────────────────────────
echo "[7/7] Live check: /health must not leak environment info..."
BODY=$(curl -s "${BASE_URL}/health" 2>/dev/null || echo "{}")
if echo "$BODY" | grep -qE "databaseUrl|DATABASE_URL|environment|nodeEnv|version"; then
  echo "  ❌ FAIL: /health response leaks info: $BODY"
  FAIL=1
else
  echo "  ✅ PASS: $BODY"
fi

echo ""
echo "═══════════════════════════════════════════"
if [ "$FAIL" -eq 1 ]; then
  echo "  ❌ SECURITY CHECK FAILED — DO NOT DEPLOY"
  echo "═══════════════════════════════════════════"
  exit 1
else
  echo "  ✅ ALL CHECKS PASSED — SAFE TO DEPLOY"
  echo "═══════════════════════════════════════════"
  exit 0
fi
