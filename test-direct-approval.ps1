# Test the direct approval endpoint
Write-Host "Testing Direct Approval Endpoint..." -ForegroundColor Green

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-approval" -Method POST -ContentType "application/json"
    Write-Host "✅ Response received:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
    }
}
