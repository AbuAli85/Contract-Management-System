# Make.com Webhook Secret Generator for Windows
# Run this script in PowerShell to generate and set up your webhook secret

Write-Host "🔐 Make.com Webhook Secret Generator" -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Cyan

# Step 1: Generate secret
Write-Host "`n📋 Step 1: Generating secure webhook secret" -ForegroundColor Cyan
$secret = "make_webhook_" + [System.Guid]::NewGuid().ToString().Replace("-", "")
Write-Host "✅ Generated webhook secret: $secret" -ForegroundColor Green

# Step 2: Update .env.local
Write-Host "`n📝 Step 2: Updating .env.local file" -ForegroundColor Cyan
$envPath = Join-Path $PWD ".env.local"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    if ($envContent -match "MAKE_WEBHOOK_SECRET=") {
        # Update existing entry
        $envContent = $envContent -replace "MAKE_WEBHOOK_SECRET=.*", "MAKE_WEBHOOK_SECRET=$secret"
    } else {
        # Add new entry
        $envContent += "`n# Make.com Webhook Secret`nMAKE_WEBHOOK_SECRET=$secret`n"
    }
    
    Set-Content -Path $envPath -Value $envContent
    Write-Host "✅ Updated $envPath" -ForegroundColor Green
} else {
    # Create new .env.local file
    $envContent = @"
# Make.com Webhook Secret
MAKE_WEBHOOK_SECRET=$secret
"@
    Set-Content -Path $envPath -Value $envContent
    Write-Host "✅ Created $envPath" -ForegroundColor Green
}

# Step 3: Instructions for Make.com
Write-Host "`n🔧 Step 3: Set up in Make.com" -ForegroundColor Cyan
Write-Host "ℹ️  1. Go to https://www.make.com/" -ForegroundColor Blue
Write-Host "ℹ️  2. Click on your organization name (top right)" -ForegroundColor Blue
Write-Host "ℹ️  3. Select 'Organization settings'" -ForegroundColor Blue
Write-Host "ℹ️  4. Go to 'Variables' tab" -ForegroundColor Blue
Write-Host "ℹ️  5. Click 'Add variable'" -ForegroundColor Blue
Write-Host "ℹ️  6. Set:" -ForegroundColor Blue
Write-Host "   Name: MAKE_WEBHOOK_SECRET" -ForegroundColor Yellow
Write-Host "   Value: $secret" -ForegroundColor Yellow
Write-Host "   Type: Text" -ForegroundColor Yellow
Write-Host "ℹ️  7. Save the variable" -ForegroundColor Blue

# Step 4: Test instructions
Write-Host "`n🧪 Step 4: Test your webhook" -ForegroundColor Cyan
Write-Host "ℹ️  You can test with this curl command:" -ForegroundColor Blue
Write-Host "curl -X POST https://portal.thesmartpro.io/api/webhook/makecom \" -ForegroundColor Yellow
Write-Host "  -H `"Content-Type: application/json`" \" -ForegroundColor Yellow
Write-Host "  -H `"X-Webhook-Secret: $secret`" \" -ForegroundColor Yellow
Write-Host "  -d '{`"contract_id`": `"test-001`", `"contract_number`": `"TEST-001`"}'" -ForegroundColor Yellow

# Step 5: Security reminder
Write-Host "`n🔒 Step 5: Security reminder" -ForegroundColor Cyan
Write-Host "⚠️  Keep this secret secure and never commit it to version control!" -ForegroundColor Yellow
Write-Host "ℹ️  The secret has been added to your .env.local file" -ForegroundColor Blue
Write-Host "ℹ️  Make sure .env.local is in your .gitignore file" -ForegroundColor Blue

Write-Host ""
Write-Host "✅ Webhook secret setup completed!" -ForegroundColor Green
Write-Host "ℹ️  Your Make.com HTTP module can now use: {{var.organization.MAKE_WEBHOOK_SECRET}}" -ForegroundColor Blue
