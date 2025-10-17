# Test Simple Webhook Endpoint
Write-Host "Testing Simple Webhook Endpoint..." -ForegroundColor Cyan

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
