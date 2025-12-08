# Test Simple Webhook Endpoint
# SECURITY: This script uses environment variables for secrets
# Set MAKE_WEBHOOK_SECRET in your environment before running
Write-Host "Testing Simple Webhook Endpoint..." -ForegroundColor Cyan

$webhookSecret = $env:MAKE_WEBHOOK_SECRET
if (-not $webhookSecret) {
    Write-Host "ERROR: MAKE_WEBHOOK_SECRET environment variable is not set" -ForegroundColor Red
    Write-Host "Set it with: `$env:MAKE_WEBHOOK_SECRET = 'your-secret-here'" -ForegroundColor Yellow
    exit 1
}
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

Write-Host "Test Data:" -ForegroundColor Yellow
Write-Host $testData -ForegroundColor Gray

Write-Host "`nTesting POST request..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "https://portal.thesmartpro.io/api/webhook/makecom-simple" -Method POST -Headers $headers -Body $testData
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor Gray
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
        
        # Try to get response body
        try {
            $responseStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
        } catch {
            Write-Host "Could not read response body" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nTest completed." -ForegroundColor Cyan
