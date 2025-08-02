# Test API Status Filtering
Write-Host "Testing API Status Filtering..." -ForegroundColor Green

# Test getting all users
Write-Host "`nTesting GET /api/users (all users)..." -ForegroundColor Yellow
try {
    $allResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method GET -ContentType "application/json"
    Write-Host "All users count: $($allResponse.users.Count)" -ForegroundColor Green
    if ($allResponse.users.Count -gt 0) {
        Write-Host "Sample user statuses: $($allResponse.users | ForEach-Object { $_.status } | Select-Object -Unique)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "All users error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test getting pending users only
Write-Host "`nTesting GET /api/users?status=pending..." -ForegroundColor Yellow
try {
    $pendingResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/users?status=pending" -Method GET -ContentType "application/json"
    Write-Host "Pending users count: $($pendingResponse.users.Count)" -ForegroundColor Green
    if ($pendingResponse.users.Count -gt 0) {
        $pendingResponse.users | ForEach-Object {
            Write-Host "  - $($_.email) ($($_.status))" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "Pending users error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test getting active users only
Write-Host "`nTesting GET /api/users?status=active..." -ForegroundColor Yellow
try {
    $activeResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/users?status=active" -Method GET -ContentType "application/json"
    Write-Host "Active users count: $($activeResponse.users.Count)" -ForegroundColor Green
    if ($activeResponse.users.Count -gt 0) {
        $activeResponse.users | ForEach-Object {
            Write-Host "  - $($_.email) ($($_.status))" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "Active users error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nStatus filtering test completed!" -ForegroundColor Green
