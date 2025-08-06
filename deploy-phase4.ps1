# =====================================================
# Phase 4 Database Migration Deployment Script (PowerShell)
# Contract Management System - Advanced Features
# =====================================================

Write-Host "🚀 Starting Phase 4 Database Migration..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if database URL is provided
$DATABASE_URL = $env:DATABASE_URL
if ([string]::IsNullOrEmpty($DATABASE_URL)) {
    Write-Host "❌ Error: DATABASE_URL environment variable is not set" -ForegroundColor Red
    Write-Host "Please set your database URL: `$env:DATABASE_URL = 'your-database-url'" -ForegroundColor Yellow
    exit 1
}

# Create backup
Write-Host "📁 Creating database backup..." -ForegroundColor Cyan
$BackupFile = "backup_before_phase4_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

try {
    & pg_dump $DATABASE_URL > $BackupFile
    Write-Host "✅ Database backup created: $BackupFile" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Could not create backup, continuing anyway..." -ForegroundColor Yellow
}

# Run the migration
Write-Host "🔧 Running Phase 4 migration..." -ForegroundColor Cyan

try {
    & psql $DATABASE_URL -f "database/migrations/004_advanced_professional_system.sql"
    
    Write-Host "✅ Phase 4 migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Advanced Professional System Features:" -ForegroundColor Magenta
    Write-Host "   ✓ Booking System (Resources, Scheduling, Conflicts)" -ForegroundColor Green
    Write-Host "   ✓ Tracking Dashboard (Projects, Deliveries, Events)" -ForegroundColor Green
    Write-Host "   ✓ Notification Center (User Notifications, Announcements)" -ForegroundColor Green
    Write-Host "   ✓ Advanced Analytics (Metrics, Activity Logs)" -ForegroundColor Green
    Write-Host "   ✓ Enhanced Security (RLS Policies, Audit Trails)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Your Contract Management System is now ready with Phase 4 features!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Migration failed! Check the error messages above." -ForegroundColor Red
    Write-Host "📁 You can restore from backup using:" -ForegroundColor Yellow
    Write-Host "   psql `$env:DATABASE_URL -f $BackupFile" -ForegroundColor Yellow
    exit 1
}

# Verify tables were created
Write-Host "🔍 Verifying table creation..." -ForegroundColor Cyan
& psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('booking_resources', 'bookings', 'tracking_entities', 'tracking_events', 'user_notifications');"

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Magenta
Write-Host "1. Update your application code to use the new Phase 4 components" -ForegroundColor White
Write-Host "2. Test the booking system functionality" -ForegroundColor White
Write-Host "3. Configure notification preferences" -ForegroundColor White
Write-Host "4. Set up tracking for your projects and deliveries" -ForegroundColor White
Write-Host ""
Write-Host "📚 See PHASE_4_INTEGRATION_GUIDE.md for detailed implementation instructions" -ForegroundColor Cyan
