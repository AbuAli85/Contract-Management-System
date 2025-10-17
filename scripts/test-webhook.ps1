# Test Webhook Script for Windows PowerShell
# This script tests the Make.com webhook endpoints

Write-Host "🧪 Testing Make.com Webhook Endpoints" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Test data
$webhookSecret = "make_webhook_0b37f95424ac249e6bbdad4e39de6028d09f8ec8b84bd671b36c8905ec93f806"
$testData = @{
    contract_id = "test-001"
    contract_number = "TEST-001"
    contract_type = "full-time-permanent"
    promoter_id = "promoter-123"
    first_party_id = "client-456"
    second_party_id = "employer-789"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-Webhook-Secret" = $webhookSecret
}

Write-Host "`n📋 Test Data:" -ForegroundColor Yellow
Write-Host $testData -ForegroundColor Gray

# Test 1: Debug endpoint
Write-Host "`n🔍 Test 1: Debug Endpoint" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://portal.thesmartpro.io/api/debug/webhook-test" -Method POST -Headers $headers -Body $testData
    Write-Host "✅ Debug endpoint working" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Debug endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Simplified webhook endpoint
Write-Host "`n🔗 Test 2: Simplified Webhook Endpoint" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://portal.thesmartpro.io/api/webhook/makecom-simple" -Method POST -Headers $headers -Body $testData
    Write-Host "✅ Simplified webhook working" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Simplified webhook failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
    }
}

# Test 3: Original webhook endpoint (should fail)
Write-Host "`n🔗 Test 3: Original Webhook Endpoint (Expected to fail)" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://portal.thesmartpro.io/api/webhook/makecom" -Method POST -Headers $headers -Body $testData
    Write-Host "✅ Original webhook working" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Original webhook failed (as expected): $($_.Exception.Message)" -ForegroundColor Yellow
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
    }
}

Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "1. Use /api/webhook/makecom-simple for your Make.com HTTP module" -ForegroundColor Green
Write-Host "2. Keep your current headers and data format" -ForegroundColor Green
Write-Host "3. The simplified endpoint should resolve the 500 error" -ForegroundColor Green

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update your Make.com HTTP module URL to: https://portal.thesmartpro.io/api/webhook/makecom-simple" -ForegroundColor Yellow
Write-Host "2. Test your Make.com scenario" -ForegroundColor Yellow
Write-Host "3. Check the response for success" -ForegroundColor Yellow
