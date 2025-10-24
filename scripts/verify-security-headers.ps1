#Requires -Version 5.1

<#
.SYNOPSIS
    Security Headers Verification Script for Windows

.DESCRIPTION
    This script verifies that all required security headers are properly
    configured on the production portal.

.PARAMETER Url
    The URL to test. Defaults to https://portal.thesmartpro.io/en/dashboard

.EXAMPLE
    .\scripts\verify-security-headers.ps1

.EXAMPLE
    .\scripts\verify-security-headers.ps1 -Url "https://portal.thesmartpro.io"
#>

param(
    [string]$Url = "https://portal.thesmartpro.io/en/dashboard"
)

# Colors for output
function Write-Success { param($Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Failure { param($Message) Write-Host "✗ $Message" -ForegroundColor Red }
function Write-Warning { param($Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
function Write-Info { param($Message) Write-Host "$Message" -ForegroundColor Cyan }
function Write-Detail { param($Message) Write-Host "  → $Message" -ForegroundColor Gray }

# Counters
$script:Passed = 0
$script:Failed = 0
$script:Warnings = 0

function Check-Header {
    param(
        [hashtable]$Headers,
        [string]$HeaderName,
        [string]$ExpectedPattern = ""
    )

    $headerValue = $Headers[$HeaderName]

    if (-not $headerValue) {
        Write-Failure "$HeaderName`: MISSING"
        $script:Failed++
        return $false
    }

    if ($ExpectedPattern) {
        if ($headerValue -match $ExpectedPattern) {
            Write-Success "$HeaderName`: OK"
            Write-Detail $headerValue
            $script:Passed++
            return $true
        }
        else {
            Write-Warning "$HeaderName`: PRESENT BUT UNEXPECTED VALUE"
            Write-Detail $headerValue
            Write-Host "  Expected pattern: $ExpectedPattern" -ForegroundColor Yellow
            $script:Warnings++
            return $null
        }
    }
    else {
        Write-Success "$HeaderName`: OK"
        Write-Detail $headerValue
        $script:Passed++
        return $true
    }
}

# Main script
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Security Headers Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing URL: " -NoNewline
Write-Host $Url -ForegroundColor Yellow
Write-Host ""

# Fetch headers
Write-Info "Fetching headers..."
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -ErrorAction Stop
    $headers = @{}
    
    foreach ($header in $response.Headers.GetEnumerator()) {
        $headers[$header.Key] = $header.Value -join ", "
    }
}
catch {
    Write-Failure "Error: Could not fetch headers from $Url"
    Write-Failure "Please check the URL and your internet connection."
    Write-Host ""
    Write-Host "Error details: $_" -ForegroundColor Red
    exit 1
}

# Check critical headers
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Critical Security Headers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Check-Header -Headers $headers -HeaderName "Strict-Transport-Security" -ExpectedPattern "max-age=63072000"
Check-Header -Headers $headers -HeaderName "Content-Security-Policy" -ExpectedPattern "default-src 'self'"
Check-Header -Headers $headers -HeaderName "X-Frame-Options" -ExpectedPattern "DENY"
Check-Header -Headers $headers -HeaderName "X-Content-Type-Options" -ExpectedPattern "nosniff"

# Cross-Origin Isolation Headers
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cross-Origin Isolation Headers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Check-Header -Headers $headers -HeaderName "Cross-Origin-Embedder-Policy"
Check-Header -Headers $headers -HeaderName "Cross-Origin-Opener-Policy" -ExpectedPattern "same-origin"
Check-Header -Headers $headers -HeaderName "Cross-Origin-Resource-Policy" -ExpectedPattern "same-origin"

# Privacy & Permissions Headers
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Privacy & Permissions Headers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Check-Header -Headers $headers -HeaderName "Referrer-Policy" -ExpectedPattern "strict-origin-when-cross-origin"
Check-Header -Headers $headers -HeaderName "Permissions-Policy"

# Additional Security Headers
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Additional Security Headers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Check-Header -Headers $headers -HeaderName "X-DNS-Prefetch-Control" -ExpectedPattern "on"

# Optional headers
if ($headers.ContainsKey("X-XSS-Protection")) {
    Check-Header -Headers $headers -HeaderName "X-XSS-Protection" -ExpectedPattern "1"
}

# CORS Headers (API Routes)
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CORS Headers (API Routes)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$apiUrl = $Url -replace '/en/dashboard', '/api/contracts'
Write-Host "Testing API URL: " -NoNewline
Write-Host $apiUrl -ForegroundColor Yellow
Write-Host ""

try {
    $apiHeaders = @{
        "Origin" = "https://malicious-site.com"
    }
    
    $apiResponse = Invoke-WebRequest -Uri $apiUrl -Method Options -Headers $apiHeaders -UseBasicParsing -ErrorAction SilentlyContinue
    
    if ($apiResponse.Headers.ContainsKey("Access-Control-Allow-Origin")) {
        $corsOrigin = $apiResponse.Headers["Access-Control-Allow-Origin"]
        
        if ($corsOrigin -eq "*") {
            Write-Failure "CORS: Allows all origins (*)"
            Write-Host "  This is a security risk!" -ForegroundColor Red
            $script:Failed++
        }
        else {
            Write-Warning "CORS: Allows origin: $corsOrigin"
            Write-Host "  Verify this is a trusted domain" -ForegroundColor Yellow
            $script:Warnings++
        }
    }
    else {
        Write-Success "CORS: No Access-Control-Allow-Origin header (Good - origin blocked)"
        $script:Passed++
    }
}
catch {
    Write-Info "CORS: Could not test (API might require authentication)"
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$total = $script:Passed + $script:Failed + $script:Warnings

if ($total -gt 0) {
    $score = [math]::Round(($script:Passed / $total) * 100)
}
else {
    $score = 0
}

Write-Host "Total Checks: " -NoNewline
Write-Host $total -ForegroundColor Yellow
Write-Host "Passed: " -NoNewline
Write-Host $script:Passed -ForegroundColor Green
Write-Host "Failed: " -NoNewline
Write-Host $script:Failed -ForegroundColor Red
Write-Host "Warnings: " -NoNewline
Write-Host $script:Warnings -ForegroundColor Yellow
Write-Host ""

if ($script:Failed -eq 0 -and $script:Warnings -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "🎉 ALL SECURITY HEADERS CONFIGURED! 🎉" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your security posture is excellent!" -ForegroundColor Green
    $exitCode = 0
}
elseif ($script:Failed -eq 0) {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "⚠️  SOME HEADERS NEED ATTENTION  ⚠️" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please review the warnings above." -ForegroundColor Yellow
    $exitCode = 1
}
else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌  CRITICAL HEADERS MISSING  ❌" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the failed checks above." -ForegroundColor Red
    $exitCode = 2
}

# Next Steps
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($script:Failed -gt 0 -or $script:Warnings -gt 0) {
    Write-Host "1. Review failed/warning headers above"
    Write-Host "2. Check next.config.js and vercel.json configuration"
    Write-Host "3. Redeploy to Vercel"
    Write-Host "4. Run this script again to verify"
    Write-Host ""
}

Write-Host "Run online security scans:"
Write-Host ""
Write-Host "  SecurityHeaders.com:"
Write-Host "  https://securityheaders.com/?q=$Url" -ForegroundColor Yellow
Write-Host ""
Write-Host "  SSL Labs:"
$domain = $Url -replace 'https?://', '' -replace '/.*', ''
Write-Host "  https://www.ssllabs.com/ssltest/analyze.html?d=$domain" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Mozilla Observatory:"
Write-Host "  https://observatory.mozilla.org/analyze/$domain" -ForegroundColor Yellow
Write-Host ""

exit $exitCode

