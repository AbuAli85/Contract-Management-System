#!/bin/bash

# CORS Security Testing Script
# This script tests the CORS implementation to ensure it's working correctly

echo "🔒 CORS Security Test Suite"
echo "======================================"
echo ""

# Configuration
BASE_URL="${1:-http://localhost:3000}"
AUTHORIZED_ORIGIN="https://portal.thesmartpro.io"
UNAUTHORIZED_ORIGIN="https://malicious-site.com"
TEST_ENDPOINT="${BASE_URL}/api/dashboard/notifications"

echo "📍 Testing against: $BASE_URL"
echo "✅ Authorized origin: $AUTHORIZED_ORIGIN"
echo "❌ Unauthorized origin: $UNAUTHORIZED_ORIGIN"
echo ""

# Test 1: Authorized Origin
echo "Test 1: Authorized Origin Request"
echo "-----------------------------------"
RESPONSE_1=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Origin: $AUTHORIZED_ORIGIN" \
  -H "Content-Type: application/json" \
  "$TEST_ENDPOINT")

HTTP_CODE_1=$(echo "$RESPONSE_1" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE_1" == "200" ] || [ "$HTTP_CODE_1" == "401" ]; then
  echo "✅ PASSED: Authorized origin accepted (HTTP $HTTP_CODE_1)"
else
  echo "❌ FAILED: Expected 200/401, got HTTP $HTTP_CODE_1"
fi
echo ""

# Test 2: Unauthorized Origin
echo "Test 2: Unauthorized Origin Request"
echo "------------------------------------"
RESPONSE_2=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Origin: $UNAUTHORIZED_ORIGIN" \
  -H "Content-Type: application/json" \
  "$TEST_ENDPOINT")

HTTP_CODE_2=$(echo "$RESPONSE_2" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE_2" == "403" ]; then
  echo "✅ PASSED: Unauthorized origin blocked (HTTP 403)"
else
  echo "❌ FAILED: Expected 403, got HTTP $HTTP_CODE_2"
  echo "⚠️  WARNING: Unauthorized origins are NOT being blocked!"
fi
echo ""

# Test 3: Preflight OPTIONS Request
echo "Test 3: Preflight OPTIONS Request"
echo "----------------------------------"
RESPONSE_3=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X OPTIONS \
  -H "Origin: $AUTHORIZED_ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  "$TEST_ENDPOINT")

HTTP_CODE_3=$(echo "$RESPONSE_3" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE_3" == "204" ] || [ "$HTTP_CODE_3" == "200" ]; then
  echo "✅ PASSED: Preflight request handled (HTTP $HTTP_CODE_3)"
else
  echo "❌ FAILED: Expected 204/200, got HTTP $HTTP_CODE_3"
fi
echo ""

# Test 4: Check CORS Headers
echo "Test 4: CORS Headers Present"
echo "-----------------------------"
CORS_HEADERS=$(curl -s -I \
  -H "Origin: $AUTHORIZED_ORIGIN" \
  "$TEST_ENDPOINT" | grep -i "access-control")

if [ -n "$CORS_HEADERS" ]; then
  echo "✅ PASSED: CORS headers present"
  echo "$CORS_HEADERS"
else
  echo "❌ FAILED: CORS headers missing"
fi
echo ""

# Summary
echo "======================================"
echo "🎯 Test Summary"
echo "======================================"
echo ""

PASSED=0
FAILED=0

if [ "$HTTP_CODE_1" == "200" ] || [ "$HTTP_CODE_1" == "401" ]; then
  ((PASSED++))
else
  ((FAILED++))
fi

if [ "$HTTP_CODE_2" == "403" ]; then
  ((PASSED++))
else
  ((FAILED++))
fi

if [ "$HTTP_CODE_3" == "204" ] || [ "$HTTP_CODE_3" == "200" ]; then
  ((PASSED++))
else
  ((FAILED++))
fi

if [ -n "$CORS_HEADERS" ]; then
  ((PASSED++))
else
  ((FAILED++))
fi

echo "✅ Passed: $PASSED/4"
echo "❌ Failed: $FAILED/4"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 All tests passed! CORS security is properly configured."
  exit 0
else
  echo "⚠️  Some tests failed. Please review the CORS configuration."
  exit 1
fi

