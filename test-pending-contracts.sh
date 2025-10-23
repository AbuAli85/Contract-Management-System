#!/bin/bash

# Test script for pending contracts functionality
# Run this after applying the fixes

echo "🧪 Testing Pending Contracts Functionality"
echo "=========================================="

# Check if the development server is running
echo "1. Checking if development server is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Development server is running"
else
    echo "❌ Development server is not running. Please start it with: npm run dev"
    exit 1
fi

# Test the API endpoint
echo ""
echo "2. Testing API endpoint..."
response=$(curl -s -w "%{http_code}" http://localhost:3000/api/contracts?status=pending)
http_code="${response: -3}"
response_body="${response%???}"

if [ "$http_code" = "200" ]; then
    echo "✅ API endpoint returns 200"
    echo "Response preview: ${response_body:0:200}..."
else
    echo "❌ API endpoint returned $http_code"
    echo "Response: $response_body"
fi

# Test the pending contracts page
echo ""
echo "3. Testing pending contracts page..."
page_response=$(curl -s -w "%{http_code}" http://localhost:3000/en/contracts/pending)
page_http_code="${page_response: -3}"

if [ "$page_http_code" = "200" ]; then
    echo "✅ Pending contracts page loads successfully"
else
    echo "❌ Pending contracts page returned $page_http_code"
fi

echo ""
echo "🎯 Manual Testing Instructions:"
echo "1. Navigate to http://localhost:3000/en/contracts/pending"
echo "2. Check browser console for any errors"
echo "3. Verify that contracts load or 'No Pending Contracts' message appears"
echo "4. Test the search functionality"
echo "5. Test the refresh button"

echo ""
echo "📋 Expected Behavior:"
echo "- Page should load within 3 seconds"
echo "- Should show skeleton loader during loading"
echo "- Should display contracts or success message"
echo "- Should have working search and refresh functionality"
echo "- Should handle errors gracefully with retry options"
