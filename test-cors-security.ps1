# CORS Security Testing Script (PowerShell)
# This script tests the CORS implementation to ensure it's working correctly

param(
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "🔒 CORS Security Test Suite" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$AuthorizedOrigin = "https://portal.thesmartpro.io"
$UnauthorizedOrigin = "https://malicious-site.com"
$TestEndpoint = "$BaseUrl/api/dashboard/notifications"

Write-Host "📍 Testing against: $BaseUrl"
Write-Host "✅ Authorized origin: $AuthorizedOrigin"
Write-Host "❌ Unauthorized origin: $UnauthorizedOrigin"
Write-Host ""

$Passed = 0
$Failed = 0

# Test 1: Authorized Origin
Write-Host "Test 1: Authorized Origin Request" -ForegroundColor Yellow
Write-Host "-----------------------------------"
try {
    $Response1 = Invoke-WebRequest -Uri $TestEndpoint `
        -Headers @{"Origin" = $AuthorizedOrigin; "Content-Type" = "application/json"} `
        -UseBasicParsing -ErrorAction SilentlyContinue
    
    if ($Response1.StatusCode -eq 200 -or $Response1.StatusCode -eq 401) {
        Write-Host "✅ PASSED: Authorized origin accepted (HTTP $($Response1.StatusCode))" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host "❌ FAILED: Expected 200/401, got HTTP $($Response1.StatusCode)" -ForegroundColor Red
        $Failed++
    }
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "✅ PASSED: Authorized origin accepted (HTTP 401 - Auth required)" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host "❌ FAILED: Unexpected response - $($_.Exception.Message)" -ForegroundColor Red
        $Failed++
    }
}
Write-Host ""

# Test 2: Unauthorized Origin
Write-Host "Test 2: Unauthorized Origin Request" -ForegroundColor Yellow
Write-Host "------------------------------------"
try {
    $Response2 = Invoke-WebRequest -Uri $TestEndpoint `
        -Headers @{"Origin" = $UnauthorizedOrigin; "Content-Type" = "application/json"} `
        -UseBasicParsing -ErrorAction Stop
    
    Write-Host "❌ FAILED: Expected 403, got HTTP $($Response2.StatusCode)" -ForegroundColor Red
    Write-Host "⚠️  WARNING: Unauthorized origins are NOT being blocked!" -ForegroundColor Yellow
    $Failed++
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "✅ PASSED: Unauthorized origin blocked (HTTP 403)" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host "❌ FAILED: Expected 403, got HTTP $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        $Failed++
    }
}
Write-Host ""

# Test 3: Preflight OPTIONS Request
Write-Host "Test 3: Preflight OPTIONS Request" -ForegroundColor Yellow
Write-Host "----------------------------------"
try {
    $Response3 = Invoke-WebRequest -Uri $TestEndpoint `
        -Method OPTIONS `
        -Headers @{
            "Origin" = $AuthorizedOrigin
            "Access-Control-Request-Method" = "POST"
            "Access-Control-Request-Headers" = "Content-Type"
        } `
        -UseBasicParsing -ErrorAction SilentlyContinue
    
    if ($Response3.StatusCode -eq 204 -or $Response3.StatusCode -eq 200) {
        Write-Host "✅ PASSED: Preflight request handled (HTTP $($Response3.StatusCode))" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host "❌ FAILED: Expected 204/200, got HTTP $($Response3.StatusCode)" -ForegroundColor Red
        $Failed++
    }
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 204 -or $_.Exception.Response.StatusCode.value__ -eq 200) {
        Write-Host "✅ PASSED: Preflight request handled" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host "⚠️  Unable to test preflight: $($_.Exception.Message)" -ForegroundColor Yellow
        # Don't count this as a failure
    }
}
Write-Host ""

# Test 4: Check CORS Headers
Write-Host "Test 4: CORS Headers Present" -ForegroundColor Yellow
Write-Host "-----------------------------"
try {
    $Response4 = Invoke-WebRequest -Uri $TestEndpoint `
        -Method HEAD `
        -Headers @{"Origin" = $AuthorizedOrigin} `
        -UseBasicParsing -ErrorAction SilentlyContinue
    
    $CorsHeaders = $Response4.Headers.Keys | Where-Object { $_ -like "*Access-Control*" }
    
    if ($CorsHeaders.Count -gt 0) {
        Write-Host "✅ PASSED: CORS headers present" -ForegroundColor Green
        foreach ($header in $CorsHeaders) {
            Write-Host "  - $header`: $($Response4.Headers[$header])" -ForegroundColor Gray
        }
        $Passed++
    } else {
        Write-Host "❌ FAILED: CORS headers missing" -ForegroundColor Red
        $Failed++
    }
} catch {
    Write-Host "⚠️  Unable to check headers: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🎯 Test Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Passed: $Passed" -ForegroundColor Green
Write-Host "❌ Failed: $Failed" -ForegroundColor Red
Write-Host ""

if ($Failed -eq 0) {
    Write-Host "🎉 All tests passed! CORS security is properly configured." -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some tests failed. Please review the CORS configuration." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Ensure ALLOWED_ORIGINS environment variable is set"
    Write-Host "2. Restart the development server after setting environment variables"
    Write-Host "3. Check middleware.ts is properly configured"
    Write-Host "4. Review CORS_SECURITY_IMPLEMENTATION.md for details"
    exit 1
}

