# Quick Fix Script for Supabase Client Not Initialized

Write-Host "=== Fixing Supabase Environment Variables ===" -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.local"

# Check if .env.local exists
if (Test-Path $envFile) {
    Write-Host "✅ .env.local exists" -ForegroundColor Green
    
    # Check contents
    $content = Get-Content $envFile
    $hasUrl = $false
    $hasKey = $false
    
    foreach ($line in $content) {
        $trimmed = $line.Trim()
        if ($trimmed -match '^NEXT_PUBLIC_SUPABASE_URL=') {
            $hasUrl = $true
            Write-Host "✅ NEXT_PUBLIC_SUPABASE_URL found" -ForegroundColor Green
        }
        if ($trimmed -match '^NEXT_PUBLIC_SUPABASE_ANON_KEY=') {
            $hasKey = $true
            Write-Host "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY found" -ForegroundColor Green
        }
    }
    
    if (-not $hasUrl -or -not $hasKey) {
        Write-Host "⚠️  Missing variables in .env.local" -ForegroundColor Yellow
        Write-Host "Updating .env.local..." -ForegroundColor Yellow
        
        @"
NEXT_PUBLIC_SUPABASE_URL=https://reootcngcptfogfozlmz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NDQzODIsImV4cCI6MjA2OTAyMDM4Mn0.WQwDpYX2M4pyPaliUqTinwy1xWWFKm4OntN2HUfP6n0
"@ | Out-File -FilePath $envFile -Encoding utf8 -NoNewline
        
        Write-Host "✅ Updated .env.local" -ForegroundColor Green
    }
} else {
    Write-Host "❌ .env.local not found!" -ForegroundColor Red
    Write-Host "Creating .env.local..." -ForegroundColor Yellow
    
    @"
NEXT_PUBLIC_SUPABASE_URL=https://reootcngcptfogfozlmz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NDQzODIsImV4cCI6MjA2OTAyMDM4Mn0.WQwDpYX2M4pyPaliUqTinwy1xWWFKm4OntN2HUfP6n0
"@ | Out-File -FilePath $envFile -Encoding utf8 -NoNewline
    
    Write-Host "✅ Created .env.local" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: You MUST restart your dev server!" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Stop your current dev server (press Ctrl+C)" -ForegroundColor Gray
Write-Host "2. Clear Next.js cache (optional but recommended):" -ForegroundColor Gray
Write-Host "   Remove-Item -Recurse -Force .next" -ForegroundColor DarkGray
Write-Host "3. Start the dev server:" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor DarkGray
Write-Host ""
Write-Host "After restarting, the error should be gone!" -ForegroundColor Green
