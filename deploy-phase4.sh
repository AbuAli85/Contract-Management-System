#!/bin/bash

# =====================================================
# Phase 4 Database Migration Deployment Script
# Contract Management System - Advanced Features
# =====================================================

echo "🚀 Starting Phase 4 Database Migration..."
echo "========================================"

# Check if database URL is provided
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set your database URL: export DATABASE_URL='your-database-url'"
    exit 1
fi

# Backup current database (optional but recommended)
echo "📁 Creating database backup..."
BACKUP_FILE="backup_before_phase4_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database backup created: $BACKUP_FILE"
else
    echo "⚠️  Warning: Could not create backup, continuing anyway..."
fi

# Run the migration
echo "🔧 Running Phase 4 migration..."
psql "$DATABASE_URL" -f "database/migrations/004_advanced_professional_system.sql"

if [ $? -eq 0 ]; then
    echo "✅ Phase 4 migration completed successfully!"
    echo ""
    echo "🎉 Advanced Professional System Features:"
    echo "   ✓ Booking System (Resources, Scheduling, Conflicts)"
    echo "   ✓ Tracking Dashboard (Projects, Deliveries, Events)"
    echo "   ✓ Notification Center (User Notifications, Announcements)"
    echo "   ✓ Advanced Analytics (Metrics, Activity Logs)"
    echo "   ✓ Enhanced Security (RLS Policies, Audit Trails)"
    echo ""
    echo "🚀 Your Contract Management System is now ready with Phase 4 features!"
else
    echo "❌ Migration failed! Check the error messages above."
    echo "📁 You can restore from backup using:"
    echo "   psql \$DATABASE_URL < $BACKUP_FILE"
    exit 1
fi

# Verify tables were created
echo "🔍 Verifying table creation..."
psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('booking_resources', 'bookings', 'tracking_entities', 'tracking_events', 'user_notifications');"

echo ""
echo "🎯 Next Steps:"
echo "1. Update your application code to use the new Phase 4 components"
echo "2. Test the booking system functionality"
echo "3. Configure notification preferences"
echo "4. Set up tracking for your projects and deliveries"
echo ""
echo "📚 See PHASE_4_INTEGRATION_GUIDE.md for detailed implementation instructions"
