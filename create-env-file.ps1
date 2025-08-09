# PowerShell script to create .env.local file

Write-Host "🔧 Creating .env.local file for local development..." -ForegroundColor Green

# Content for .env.local file
$envContent = @"
# Supabase Configuration for Local Development
NEXT_PUBLIC_SUPABASE_URL=https://reootcngcptfogfozlmz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NDQzODIsImV4cCI6MjA2OTAyMDM4Mn0.WQwDpYX2M4pyPaliUqTinwy1xWWFKm4OntN2HUfP6n0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ0NDM4MiwiZXhwIjoyMDY5MDIwMzgyfQ.BTLA-2wwXJgjW6MKoaw2ERbCr_fXF9w4zgLb70_5DAE

# Development Configuration
NODE_ENV=development
"@

# Write to .env.local file
try {
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8 -Force
    Write-Host "✅ .env.local file created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 File contents:" -ForegroundColor Yellow
    Write-Host "   NEXT_PUBLIC_SUPABASE_URL = https://reootcngcptfogfozlmz.supabase.co" -ForegroundColor Cyan
    Write-Host "   NEXT_PUBLIC_SUPABASE_ANON_KEY = [configured]" -ForegroundColor Cyan
    Write-Host "   SUPABASE_SERVICE_ROLE_KEY = [configured]" -ForegroundColor Cyan
    Write-Host "   NODE_ENV = development" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Green
    Write-Host "   1. Restart your development server: npm run dev" -ForegroundColor White
    Write-Host "   2. Clear browser cache/cookies" -ForegroundColor White
    Write-Host "   3. Try login at: http://localhost:3000/en/auth/login" -ForegroundColor White
    Write-Host "   4. Use: provider@test.com / TestPass123!" -ForegroundColor White
} catch {
    Write-Host "❌ Error creating .env.local file: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Manual alternative:" -ForegroundColor Yellow
    Write-Host "   Create a file named '.env.local' in your project root with:" -ForegroundColor White
    Write-Host $envContent -ForegroundColor Cyan
}