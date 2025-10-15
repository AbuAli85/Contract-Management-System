# 🚀 Quick Environment Setup Script
# This script helps you create .env.local file with Supabase credentials

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Contract Management System - Environment Setup        ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local already exists
if (Test-Path ".env.local") {
    Write-Host "⚠️  .env.local already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Setup cancelled." -ForegroundColor Red
        exit
    }
    
    # Backup existing file
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    Copy-Item ".env.local" ".env.local.backup_$timestamp"
    Write-Host "✅ Backed up existing file to .env.local.backup_$timestamp" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Please provide your Supabase credentials" -ForegroundColor Cyan
Write-Host "   Get them from: https://supabase.com/dashboard → Your Project → Settings → API" -ForegroundColor Gray
Write-Host ""

# Prompt for Supabase URL
Write-Host "1️⃣  Supabase Project URL" -ForegroundColor Yellow
Write-Host "   Example: https://abcdefghij.supabase.co" -ForegroundColor Gray
$supabaseUrl = Read-Host "   Enter URL"

# Validate URL
if ($supabaseUrl -notmatch "^https://.*\.supabase\.co$") {
    Write-Host "❌ Invalid URL format. Should be like: https://your-project.supabase.co" -ForegroundColor Red
    exit
}

Write-Host ""

# Prompt for Anon Key
Write-Host "2️⃣  Supabase Anon/Public Key" -ForegroundColor Yellow
Write-Host "   This is the 'anon' or 'public' key (starts with 'eyJ...')" -ForegroundColor Gray
$anonKey = Read-Host "   Enter Anon Key"

# Validate key
if ($anonKey -notmatch "^eyJ") {
    Write-Host "❌ Invalid key format. Should start with 'eyJ'" -ForegroundColor Red
    exit
}

Write-Host ""

# Prompt for Service Role Key
Write-Host "3️⃣  Supabase Service Role Key" -ForegroundColor Yellow
Write-Host "   ⚠️  Keep this secret! Never commit to Git!" -ForegroundColor Red
Write-Host "   This is the 'service_role' key (starts with 'eyJ...')" -ForegroundColor Gray
$serviceKey = Read-Host "   Enter Service Role Key"

# Validate key
if ($serviceKey -notmatch "^eyJ") {
    Write-Host "❌ Invalid key format. Should start with 'eyJ'" -ForegroundColor Red
    exit
}

Write-Host ""

# Create .env.local file
$envContent = @"
# ========================================
# 🔑 SUPABASE CONFIGURATION
# ========================================
# Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ⚠️ NEVER commit this file to Git!

# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl

# Supabase Anon/Public Key (safe for client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey

# Supabase Service Role Key (⚠️ KEEP SECRET - server-side only!)
SUPABASE_SERVICE_ROLE_KEY=$serviceKey

# ========================================
# 📝 OPTIONAL SETTINGS
# ========================================

# Auth Redirect URL
NEXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback

# Application Environment
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Debug Mode (optional - set to true for detailed logs)
DEBUG_API=true
"@

try {
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✅ Successfully created .env.local file!" -ForegroundColor Green
    Write-Host ""
    
    # Show file location
    $fullPath = (Get-Item ".env.local").FullName
    Write-Host "📁 File location: $fullPath" -ForegroundColor Cyan
    Write-Host ""
    
    # Next steps
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║   🎉 Setup Complete! Next Steps:                        ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. Restart your development server:" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Test the diagnostic endpoint:" -ForegroundColor Yellow
    Write-Host "   http://localhost:3000/api/promoters/debug" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Check the API:" -ForegroundColor Yellow
    Write-Host "   http://localhost:3000/api/promoters" -ForegroundColor White
    Write-Host ""
    Write-Host "4. View your promoters page:" -ForegroundColor Yellow
    Write-Host "   http://localhost:3000/en/promoters" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 For troubleshooting, see: PROMOTERS_FIX_SUMMARY.md" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "❌ Error creating .env.local file: $_" -ForegroundColor Red
    exit 1
}

# Security reminder
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║   ⚠️  SECURITY REMINDER                                  ║" -ForegroundColor Red
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""
Write-Host "• .env.local contains sensitive keys - NEVER commit to Git" -ForegroundColor Yellow
Write-Host "• .env.local is already in .gitignore (safe)" -ForegroundColor Green
Write-Host "• Service Role Key bypasses all security - keep it secret!" -ForegroundColor Yellow
Write-Host ""

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

