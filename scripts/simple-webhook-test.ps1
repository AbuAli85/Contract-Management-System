# Simple Webhook Test Script
Write-Host "Testing Webhook Endpoints..." -ForegroundColor Cyan

$webhookSecret = "make_webhook_0b37f95424ac249e6bbdad4e39de6028d09f8ec8b84bd671b36c8905ec93f806"
$testData = '{"contract_id": "test-001", "contract_number": "TEST-001", "contract_type": "full-time-permanent"}'

$headers = @{
    "Content-Type" = "application/json"
    "X-Webhook-Secret" = $webhookSecret
}

Write-Host "Testing simplified webhook endpoint..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "https://portal.thesmartpro.io/api/webhook/makecom-simple" -Method POST -Headers $headers -Body $testData
    Write-Host "SUCCESS: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Test completed." -ForegroundColor Cyan
