#!/bin/bash
# Test All API Endpoints
# Usage: ./scripts/test-all-apis.sh [production|localhost]

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Determine base URL
if [ "$1" == "production" ]; then
  BASE_URL="https://portal.thesmartpro.io"
else
  BASE_URL="http://localhost:3000"
fi

echo "🧪 Testing all API endpoints"
echo "Base URL: $BASE_URL"
echo ""

# Function to test endpoint
test_endpoint() {
  local endpoint=$1
  local expected_status=$2
  local description=$3
  
  echo -n "Testing $description... "
  
  response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
  status_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$status_code" == "$expected_status" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Status: $status_code)"
  else
    echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
    echo "Response: $body"
  fi
}

# Test protected endpoints (expect 401 if not authenticated, or 200 if authenticated)
echo "📡 Testing Protected Endpoints"
echo "================================"
test_endpoint "/api/contracts" "200" "Contracts API"
test_endpoint "/api/parties" "200" "Parties API"
test_endpoint "/api/promoters" "200" "Promoters API"
test_endpoint "/api/profile" "200" "Profile API"
echo ""

# Test public/health endpoints (expect 200)
echo "🏥 Testing Public Endpoints"
echo "================================"
test_endpoint "/api/health-check" "200" "Health Check"
test_endpoint "/api/dashboard/promoter-metrics" "200" "Promoter Metrics"
echo ""

# Test specific functionality
echo "🔍 Testing Specific Features"
echo "================================"
test_endpoint "/api/contracts?page=1&limit=10" "200" "Contracts with Pagination"
test_endpoint "/api/promoters?page=1&limit=10" "200" "Promoters with Pagination"
echo ""

# Summary
echo "================================"
echo -e "${YELLOW}📊 Test Summary${NC}"
echo "================================"
echo "If all tests show ✅ PASS, your API is fully functional!"
echo ""
echo "Next steps:"
echo "1. Verify metrics are accurate in production dashboard"
echo "2. Check for translation errors in browser console"
echo "3. Run: npm run fix-promoter-orphans -- --dry-run"
echo ""

