# PowerShell script to apply security fixes migration
# Date: 2025-10-26
# Purpose: Apply Supabase security linter fixes

$ErrorActionPreference = "Stop"

Write-Host "🔒 Applying Supabase Security Fixes..." -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI is not installed" -ForegroundColor Red
    Write-Host "📦 Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "supabase/migrations/20251026_fix_security_linter_issues.sql")) {
    Write-Host "❌ Migration file not found" -ForegroundColor Red
    Write-Host "Make sure you're in the project root directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Migration file found" -ForegroundColor Green
Write-Host ""

# Ask for confirmation
Write-Host "⚠️  This will apply the following changes:" -ForegroundColor Yellow
Write-Host "   - Recreate 8 views with SECURITY INVOKER"
Write-Host "   - Enable RLS on 4 tables"
Write-Host "   - Create RLS policies for those tables"
Write-Host ""

$confirmation = Read-Host "Do you want to continue? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Migration cancelled" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Applying migration..." -ForegroundColor Cyan
Write-Host ""

# Apply the migration
try {
    supabase db push
    
    Write-Host ""
    Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Running verification checks..." -ForegroundColor Cyan
    Write-Host ""
    
    # Run linter to verify fixes
    try {
        supabase db lint
        
        Write-Host ""
        Write-Host "🎉 All security issues fixed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Test your application to ensure everything works"
        Write-Host "2. Check the SECURITY_FIXES_20251026.md file for details"
        Write-Host "3. Monitor logs for any permission errors"
    } catch {
        Write-Host ""
        Write-Host "⚠️  Some linter issues may still exist" -ForegroundColor Yellow
        Write-Host "Please review the linter output above"
    }
} catch {
    Write-Host ""
    Write-Host "❌ Migration failed" -ForegroundColor Red
    Write-Host "Please check the error messages above" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ Done!" -ForegroundColor Green

