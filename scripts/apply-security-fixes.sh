#!/bin/bash

# Script to apply security fixes migration
# Date: 2025-10-26
# Purpose: Apply Supabase security linter fixes

set -e

echo "🔒 Applying Supabase Security Fixes..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "📦 Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/migrations/20251026_fix_security_linter_issues.sql" ]; then
    echo "❌ Migration file not found"
    echo "Make sure you're in the project root directory"
    exit 1
fi

echo "📋 Migration file found"
echo ""

# Ask for confirmation
echo "⚠️  This will apply the following changes:"
echo "   - Recreate 8 views with SECURITY INVOKER"
echo "   - Enable RLS on 4 tables"
echo "   - Create RLS policies for those tables"
echo ""
read -p "Do you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 1
fi

echo ""
echo "🚀 Applying migration..."
echo ""

# Apply the migration
if supabase db push; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📊 Running verification checks..."
    echo ""
    
    # Run linter to verify fixes
    if supabase db lint; then
        echo ""
        echo "🎉 All security issues fixed!"
        echo ""
        echo "Next steps:"
        echo "1. Test your application to ensure everything works"
        echo "2. Check the SECURITY_FIXES_20251026.md file for details"
        echo "3. Monitor logs for any permission errors"
    else
        echo ""
        echo "⚠️  Some linter issues may still exist"
        echo "Please review the linter output above"
    fi
else
    echo ""
    echo "❌ Migration failed"
    echo "Please check the error messages above"
    exit 1
fi

echo ""
echo "✅ Done!"

