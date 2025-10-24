#!/bin/bash

###############################################################################
# Security Headers Verification Script
# 
# This script verifies that all required security headers are properly
# configured on the production portal.
#
# Usage: ./scripts/verify-security-headers.sh [URL]
# Example: ./scripts/verify-security-headers.sh https://portal.thesmartpro.io
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default URL
URL="${1:-https://portal.thesmartpro.io/en/dashboard}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Security Headers Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Testing URL: ${YELLOW}${URL}${NC}"
echo ""

# Function to check if a header exists and has expected value
check_header() {
    local header_name="$1"
    local expected_pattern="$2"
    local header_value=$(echo "$HEADERS" | grep -i "^${header_name}:" | sed "s/^${header_name}: //i" | tr -d '\r\n')
    
    if [ -z "$header_value" ]; then
        echo -e "${RED}✗${NC} ${header_name}: ${RED}MISSING${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
    
    if [ -n "$expected_pattern" ]; then
        if echo "$header_value" | grep -qi "$expected_pattern"; then
            echo -e "${GREEN}✓${NC} ${header_name}: ${GREEN}OK${NC}"
            echo -e "  ${YELLOW}→${NC} ${header_value}"
            PASSED=$((PASSED + 1))
            return 0
        else
            echo -e "${YELLOW}⚠${NC} ${header_name}: ${YELLOW}PRESENT BUT UNEXPECTED VALUE${NC}"
            echo -e "  ${YELLOW}→${NC} ${header_value}"
            echo -e "  ${YELLOW}Expected pattern:${NC} ${expected_pattern}"
            WARNING=$((WARNING + 1))
            return 2
        fi
    else
        echo -e "${GREEN}✓${NC} ${header_name}: ${GREEN}OK${NC}"
        echo -e "  ${YELLOW}→${NC} ${header_value}"
        PASSED=$((PASSED + 1))
        return 0
    fi
}

# Counters
PASSED=0
FAILED=0
WARNING=0

# Fetch headers
echo -e "${BLUE}Fetching headers...${NC}"
HEADERS=$(curl -s -I "$URL" 2>&1)

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Could not fetch headers from ${URL}${NC}"
    echo -e "${RED}Please check the URL and your internet connection.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Critical Security Headers${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check critical headers
check_header "Strict-Transport-Security" "max-age=63072000"
check_header "Content-Security-Policy" "default-src 'self'"
check_header "X-Frame-Options" "DENY"
check_header "X-Content-Type-Options" "nosniff"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Cross-Origin Isolation Headers${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

check_header "Cross-Origin-Embedder-Policy" ""
check_header "Cross-Origin-Opener-Policy" "same-origin"
check_header "Cross-Origin-Resource-Policy" "same-origin"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Privacy & Permissions Headers${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

check_header "Referrer-Policy" "strict-origin-when-cross-origin"
check_header "Permissions-Policy" ""

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Additional Security Headers${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

check_header "X-DNS-Prefetch-Control" "on"

# Optional but recommended
X_XSS=$(echo "$HEADERS" | grep -i "^X-XSS-Protection:")
if [ -n "$X_XSS" ]; then
    check_header "X-XSS-Protection" "1"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CORS Headers (API Routes)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test API endpoint
API_URL="${URL/\/en\/dashboard//api/contracts}"
echo -e "Testing API URL: ${YELLOW}${API_URL}${NC}"
echo ""

API_HEADERS=$(curl -s -I -H "Origin: https://malicious-site.com" "$API_URL" 2>&1)
CORS_ORIGIN=$(echo "$API_HEADERS" | grep -i "^Access-Control-Allow-Origin:" | sed "s/^Access-Control-Allow-Origin: //i" | tr -d '\r\n')

if [ -z "$CORS_ORIGIN" ]; then
    echo -e "${GREEN}✓${NC} CORS: ${GREEN}No Access-Control-Allow-Origin header (Good - origin blocked)${NC}"
    PASSED=$((PASSED + 1))
elif [ "$CORS_ORIGIN" = "*" ]; then
    echo -e "${RED}✗${NC} CORS: ${RED}Allows all origins (*)${NC}"
    echo -e "  ${RED}This is a security risk!${NC}"
    FAILED=$((FAILED + 1))
else
    echo -e "${YELLOW}⚠${NC} CORS: ${YELLOW}Allows origin: ${CORS_ORIGIN}${NC}"
    echo -e "  ${YELLOW}Verify this is a trusted domain${NC}"
    WARNING=$((WARNING + 1))
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

TOTAL=$((PASSED + FAILED + WARNING))
SCORE=$((PASSED * 100 / TOTAL))

echo -e "Total Checks: ${YELLOW}${TOTAL}${NC}"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo -e "Warnings: ${YELLOW}${WARNING}${NC}"
echo ""

if [ $FAILED -eq 0 ] && [ $WARNING -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}🎉 ALL SECURITY HEADERS CONFIGURED! 🎉${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}Your security posture is excellent!${NC}"
    EXIT_CODE=0
elif [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}⚠️  SOME HEADERS NEED ATTENTION  ⚠️${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Please review the warnings above.${NC}"
    EXIT_CODE=1
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}❌  CRITICAL HEADERS MISSING  ❌${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${RED}Please fix the failed checks above.${NC}"
    EXIT_CODE=2
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Next Steps${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ $FAILED -gt 0 ] || [ $WARNING -gt 0 ]; then
    echo "1. Review failed/warning headers above"
    echo "2. Check next.config.js and vercel.json configuration"
    echo "3. Redeploy to Vercel"
    echo "4. Run this script again to verify"
    echo ""
fi

echo "Run online security scans:"
echo ""
echo "  SecurityHeaders.com:"
echo "  ${YELLOW}https://securityheaders.com/?q=${URL}${NC}"
echo ""
echo "  SSL Labs:"
echo "  ${YELLOW}https://www.ssllabs.com/ssltest/analyze.html?d=${URL/https:\/\//}${NC}"
echo ""
echo "  Mozilla Observatory:"
echo "  ${YELLOW}https://observatory.mozilla.org/analyze/${URL/https:\/\//}${NC}"
echo ""

exit $EXIT_CODE

