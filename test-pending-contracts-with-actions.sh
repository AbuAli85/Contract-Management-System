#!/bin/bash

# Test script for pending contracts page with actions
# Run this after applying the fixes

echo "🧪 Testing Pending Contracts Page with Actions"
echo "=============================================="

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
echo "2. Testing contracts API endpoint..."
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

# Test the actions API endpoint
echo ""
echo "3. Testing actions API endpoint..."
actions_response=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/api/contracts/actions \
  -H "Content-Type: application/json" \
  -d '{"contractId":"test","action":"approve"}')
actions_http_code="${actions_response: -3}"

if [ "$actions_http_code" = "401" ] || [ "$actions_http_code" = "400" ]; then
    echo "✅ Actions API endpoint exists (returns expected auth/validation error)"
else
    echo "❌ Actions API endpoint returned $actions_http_code"
fi

# Test the pending contracts page
echo ""
echo "4. Testing pending contracts page..."
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
echo "3. Verify that contracts load with checkboxes"
echo "4. Test individual contract actions (Approve, Reject, etc.)"
echo "5. Test bulk actions by selecting multiple contracts"
echo "6. Test the action dialogs and reason inputs"
echo "7. Verify that actions update contract status"

echo ""
echo "📋 Expected Behavior:"
echo "- Page should load within 3 seconds"
echo "- Should show contracts with checkboxes for selection"
echo "- Each contract should have action menu (three dots)"
echo "- Bulk actions should appear when contracts are selected"
echo "- Action dialogs should open with proper forms"
echo "- Actions should update contract status and refresh the list"
echo "- Should handle errors gracefully with toast notifications"

echo ""
echo "🔧 New Features Added:"
echo "- ✅ Individual contract actions (Approve, Reject, Request Changes, Send to Legal/HR)"
echo "- ✅ Bulk actions for multiple contracts"
echo "- ✅ Action dialogs with reason inputs"
echo "- ✅ Contract selection with checkboxes"
echo "- ✅ Select all functionality"
echo "- ✅ Toast notifications for success/error"
echo "- ✅ Activity logging for audit trail"
echo "- ✅ Permission-based access control"
