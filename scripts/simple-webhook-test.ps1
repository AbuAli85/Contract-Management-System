# Simple Webhook Test Script
# SECURITY: This script uses environment variables for secrets
# Set MAKE_WEBHOOK_SECRET in your environment before running
Write-Host "Testing Webhook Endpoints..." -ForegroundColor Cyan

$webhookSecret = $env:MAKE_WEBHOOK_SECRET
if (-not $webhookSecret) {
    Write-Host "ERROR: MAKE_WEBHOOK_SECRET environment variable is not set" -ForegroundColor Red
    Write-Host "Set it with: `$env:MAKE_WEBHOOK_SECRET = 'your-secret-here'" -ForegroundColor Yellow
    exit 1
}
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
