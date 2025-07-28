# 🔧 Environment Variables Setup Script for Vercel

Write-Host "🔧 Setting up environment variables for Vercel deployment..." -ForegroundColor Green

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✅ Found .env.local file" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with your environment variables" -ForegroundColor Yellow
    exit 1
}

# Read environment variables from .env.local
$envVars = Get-Content ".env.local" | Where-Object { $_ -match "^[^#]" -and $_ -match "=" }

Write-Host "`n📋 Found environment variables:" -ForegroundColor Cyan
$envVars | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

Write-Host "`n🚀 Choose setup method:" -ForegroundColor Cyan
Write-Host "1. Vercel Dashboard (Recommended)" -ForegroundColor White
Write-Host "2. Vercel CLI (Command line)" -ForegroundColor White
Write-Host "3. Show instructions only" -ForegroundColor White

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`n🌐 Vercel Dashboard Instructions:" -ForegroundColor Green
        Write-Host "1. Go to https://vercel.com/dashboard" -ForegroundColor White
        Write-Host "2. Click on your project: contract-management-system" -ForegroundColor White
        Write-Host "3. Go to Settings > Environment Variables" -ForegroundColor White
        Write-Host "4. Add each variable from the list above" -ForegroundColor White
        Write-Host "5. Select Production and Preview environments" -ForegroundColor White
        Write-Host "6. Click Save" -ForegroundColor White
        
        Write-Host "`n📋 Environment Variables to add:" -ForegroundColor Yellow
        $envVars | ForEach-Object {
            $parts = $_ -split "=", 2
            if ($parts.Length -eq 2) {
                Write-Host "Name: $($parts[0])" -ForegroundColor Cyan
                Write-Host "Value: $($parts[1])" -ForegroundColor Gray
                Write-Host "---" -ForegroundColor DarkGray
            }
        }
    }
    "2" {
        Write-Host "`n💻 Setting up via Vercel CLI..." -ForegroundColor Green
        Write-Host "This will prompt you for each variable value." -ForegroundColor Yellow
        Write-Host "You can copy from the list below:" -ForegroundColor Yellow
        
        Write-Host "`n📋 Environment Variables:" -ForegroundColor Cyan
        $envVars | ForEach-Object {
            $parts = $_ -split "=", 2
            if ($parts.Length -eq 2) {
                Write-Host "$($parts[0])=$($parts[1])" -ForegroundColor Gray
            }
        }
        
        $continue = Read-Host "`nContinue with CLI setup? (y/n)"
        if ($continue -eq 'y' -or $continue -eq 'Y') {
            $envVars | ForEach-Object {
                $parts = $_ -split "=", 2
                if ($parts.Length -eq 2) {
                    Write-Host "Setting up $($parts[0])..." -ForegroundColor Blue
                    $result = npx vercel env add $parts[0]
                    Write-Host "Result: $result" -ForegroundColor Gray
                }
            }
        }
    }
    "3" {
        Write-Host "`n📖 Manual Setup Instructions:" -ForegroundColor Green
        Write-Host "1. Go to Vercel Dashboard" -ForegroundColor White
        Write-Host "2. Navigate to your project settings" -ForegroundColor White
        Write-Host "3. Add environment variables manually" -ForegroundColor White
        Write-Host "4. Deploy again with: npx vercel --prod" -ForegroundColor White
    }
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host "`n✅ Environment variables setup completed!" -ForegroundColor Green
Write-Host "Next step: Run 'npx vercel --prod' to deploy" -ForegroundColor Cyan 