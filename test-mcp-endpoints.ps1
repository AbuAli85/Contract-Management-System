# MCP Endpoints Test Script for Contracts Repo
# Tests contracts/draft and contracts/pdf endpoints

$baseUrl = "http://localhost:3000"  # Default Next.js port
$token = $env:TEST_TOKEN  # Set this in your environment or replace with actual token

Write-Host "=== Testing Contracts MCP Endpoints ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Contracts Draft - Missing Auth (should return 401)
Write-Host "Test 1: Contracts Draft - Missing Auth" -ForegroundColor Yellow
try {
    $response1 = Invoke-WebRequest -Uri "$baseUrl/api/mcp/contracts/draft" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"template_id":"00000000-0000-0000-0000-000000000000","parties":{},"variables":{}}' `
        -ErrorAction Stop
    Write-Host "✗ Expected 401, got $($response1.StatusCode)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ Got 401 as expected" -ForegroundColor Green
        $correlationId = $_.Exception.Response.Headers['X-Correlation-ID']
        if ($correlationId) {
            Write-Host "✓ Correlation ID present: $correlationId" -ForegroundColor Green
        } else {
            Write-Host "✗ Missing X-Correlation-ID header" -ForegroundColor Red
        }
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body:" -ForegroundColor Gray
        $responseBody | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } else {
        Write-Host "✗ Expected 401, got $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 2: Contracts Draft - With Auth (if token provided)
if ($token) {
    Write-Host "Test 2: Contracts Draft - With Auth" -ForegroundColor Yellow
    $correlationId2 = "test-draft-$(Get-Date -Format 'yyyyMMddHHmmss')"
    try {
        # Note: You'll need to provide valid template_id, promoter_id, etc.
        $response2 = Invoke-WebRequest -Uri "$baseUrl/api/mcp/contracts/draft" `
            -Method POST `
            -ContentType "application/json" `
            -Headers @{
                "Authorization" = "Bearer $token"
                "X-Correlation-ID" = $correlationId2
            } `
            -Body '{
                "template_id": "00000000-0000-0000-0000-000000000000",
                "parties": {},
                "variables": {},
                "promoter_id": "00000000-0000-0000-0000-000000000000"
            }'
        
        if ($response2.StatusCode -eq 200) {
            Write-Host "✓ Got 200 OK" -ForegroundColor Green
            $correlationIdHeader = $response2.Headers['X-Correlation-ID']
            if ($correlationIdHeader) {
                Write-Host "✓ Correlation ID present: $correlationIdHeader" -ForegroundColor Green
            } else {
                Write-Host "✗ Missing X-Correlation-ID header" -ForegroundColor Red
            }
            $json = $response2.Content | ConvertFrom-Json
            if ($json.contract -and $json.contract.id -and $json.contract.status -eq "draft" -and $json.contract.template_id) {
                Write-Host "✓ Response has valid contract structure" -ForegroundColor Green
                Write-Host "Response body:" -ForegroundColor Gray
                $json | ConvertTo-Json -Depth 10
            } else {
                Write-Host "✗ Response missing required contract fields" -ForegroundColor Red
                $json | ConvertTo-Json -Depth 10
            }
        } else {
            Write-Host "✗ Expected 200, got $($response2.StatusCode)" -ForegroundColor Red
            $response2.Content
        }
    } catch {
        Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Red
        }
    }
    Write-Host ""
}

# Test 3: Contracts PDF - Missing Auth (should return 401)
Write-Host "Test 3: Contracts PDF - Missing Auth" -ForegroundColor Yellow
try {
    $response3 = Invoke-WebRequest -Uri "$baseUrl/api/mcp/contracts/pdf" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"contract_id":"00000000-0000-0000-0000-000000000000"}' `
        -ErrorAction Stop
    Write-Host "✗ Expected 401, got $($response3.StatusCode)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ Got 401 as expected" -ForegroundColor Green
        $correlationId = $_.Exception.Response.Headers['X-Correlation-ID']
        if ($correlationId) {
            Write-Host "✓ Correlation ID present: $correlationId" -ForegroundColor Green
        } else {
            Write-Host "✗ Missing X-Correlation-ID header" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ Expected 401, got $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Contracts PDF - With Auth (if token provided)
if ($token) {
    Write-Host "Test 4: Contracts PDF - With Auth" -ForegroundColor Yellow
    $correlationId4 = "test-pdf-$(Get-Date -Format 'yyyyMMddHHmmss')"
    try {
        # Note: You'll need to provide valid contract_id
        $response4 = Invoke-WebRequest -Uri "$baseUrl/api/mcp/contracts/pdf" `
            -Method POST `
            -ContentType "application/json" `
            -Headers @{
                "Authorization" = "Bearer $token"
                "X-Correlation-ID" = $correlationId4
            } `
            -Body '{"contract_id":"00000000-0000-0000-0000-000000000000"}'
        
        if ($response4.StatusCode -eq 200) {
            Write-Host "✓ Got 200 OK" -ForegroundColor Green
            $correlationIdHeader = $response4.Headers['X-Correlation-ID']
            if ($correlationIdHeader) {
                Write-Host "✓ Correlation ID present: $correlationIdHeader" -ForegroundColor Green
            } else {
                Write-Host "✗ Missing X-Correlation-ID header" -ForegroundColor Red
            }
            $json = $response4.Content | ConvertFrom-Json
            if ($json.pdf -and $json.pdf.filename -and ($json.pdf.url -or $json.pdf.base64)) {
                Write-Host "✓ Response has valid PDF structure" -ForegroundColor Green
                Write-Host "Response body:" -ForegroundColor Gray
                $json | ConvertTo-Json -Depth 10
            } else {
                Write-Host "✗ Response missing required PDF fields" -ForegroundColor Red
                $json | ConvertTo-Json -Depth 10
            }
        } else {
            Write-Host "✗ Expected 200, got $($response4.StatusCode)" -ForegroundColor Red
            $response4.Content
        }
    } catch {
        Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Red
        }
    }
    Write-Host ""
}

Write-Host "=== Contracts Tests Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To test with auth, set TEST_TOKEN environment variable:" -ForegroundColor Yellow
Write-Host '  $env:TEST_TOKEN = "your-jwt-token-here"' -ForegroundColor Gray
Write-Host "  .\test-mcp-endpoints.ps1" -ForegroundColor Gray
