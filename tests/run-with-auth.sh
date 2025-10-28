#!/bin/bash
# Quick Test Runner with Authentication
# 
# This script makes it easy to run validation tests with authentication
# without manually managing tokens.
#
# Usage:
#   ./tests/run-with-auth.sh                    # Run against localhost
#   ./tests/run-with-auth.sh production         # Run against production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TARGET=${1:-local}

if [ "$TARGET" = "production" ] || [ "$TARGET" = "prod" ]; then
    export API_BASE_URL="https://portal.thesmartpro.io"
    echo -e "${BLUE}🌐 Testing against PRODUCTION${NC}"
else
    export API_BASE_URL="http://localhost:3000"
    echo -e "${BLUE}🏠 Testing against LOCALHOST${NC}"
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local file not found${NC}"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

# Load .env.local
set -a
source .env.local
set +a

# Check required environment variables
REQUIRED_VARS=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "TEST_USER_EMAIL" "TEST_USER_PASSWORD")
MISSING_VARS=()

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        MISSING_VARS+=("$VAR")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    for VAR in "${MISSING_VARS[@]}"; do
        echo -e "   ${YELLOW}- $VAR${NC}"
    done
    echo ""
    echo "Add these to your .env.local file:"
    echo "  TEST_USER_EMAIL=\"your-test-user@example.com\""
    echo "  TEST_USER_PASSWORD=\"your-test-password\""
    exit 1
fi

# Get authentication token
echo -e "${BLUE}🔐 Getting authentication token...${NC}"
AUTH_TOKEN=$(node tests/get-auth-token.js 2>/dev/null)

if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}❌ Failed to get authentication token${NC}"
    echo "Run this to see error details:"
    echo "  node tests/get-auth-token.js"
    exit 1
fi

echo -e "${GREEN}✅ Authentication successful${NC}"
echo ""

# Run validation tests
echo -e "${BLUE}🧪 Running validation tests...${NC}"
echo ""
export SUPABASE_AUTH_TOKEN="$AUTH_TOKEN"
node tests/performance-validation.js

# Capture exit code
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed${NC}"
fi

exit $EXIT_CODE

