# Simple PowerShell script to test the users API
Write-Host "Testing Users API..." -ForegroundColor Green

# Test GET endpoint
Write-Host "`nTesting GET /api/users..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method GET -ContentType "application/json"
    Write-Host "GET Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Green
} catch {
    Write-Host "GET Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Test debug auth endpoint
Write-Host "`nTesting GET /api/debug-auth..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/debug-auth" -Method GET -ContentType "application/json"
    Write-Host "Debug Auth Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Green
} catch {
    Write-Host "Debug Auth Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`nAPI test completed!" -ForegroundColor Green
