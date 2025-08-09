# PowerShell script to set up environment variables and start the development server

Write-Host "🔧 Setting up Contract Management System environment..." -ForegroundColor Green

# Set environment variables for Supabase
$env:NEXT_PUBLIC_SUPABASE_URL = "https://reootcngcptfogfozlmz.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NDQzODIsImV4cCI6MjA2OTAyMDM4Mn0.WQwDpYX2M4pyPaliUqTinwy1xWWFKm4OntN2HUfP6n0"
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ0NDM4MiwiZXhwIjoyMDY5MDIwMzgyfQ.BTLA-2wwXJgjW6MKoaw2ERbCr_fXF9w4zgLb70_5DAE"
$env:NODE_ENV = "development"

Write-Host "✅ Environment variables set:" -ForegroundColor Green
Write-Host "   NEXT_PUBLIC_SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Yellow
Write-Host "   NEXT_PUBLIC_SUPABASE_ANON_KEY = $($env:NEXT_PUBLIC_SUPABASE_ANON_KEY.Substring(0,50))..." -ForegroundColor Yellow
Write-Host "   NODE_ENV = $env:NODE_ENV" -ForegroundColor Yellow

Write-Host ""
Write-Host "🚀 Starting development server..." -ForegroundColor Green
Write-Host "   Server will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Login page: http://localhost:3000/en/auth/login" -ForegroundColor Cyan
Write-Host ""

# Start the development server
npm run dev