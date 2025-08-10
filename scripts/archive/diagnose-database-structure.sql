-- ========================================
-- 🔍 Database Structure Diagnostic
-- ========================================

-- This script helps identify table structure issues

-- Step 1: Check if essential tables exist
-- ========================================

SELECT 
  'Table Existence Check' as check_type,
  table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = t.table_name
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
  VALUES 
    ('users'),
    ('companies'),
    ('provider_services'),
    ('services'),
    ('bookings'),
    ('service_reviews')
) as t(table_name);

-- Step 2: Check users table structure
-- ========================================

SELECT 
  'Users Table Structure' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Step 3: Check users table constraints
-- ========================================

SELECT 
  'Users Table Constraints' as info,
  tc.constraint_name, 
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users';

-- Step 4: Check provider_services table structure (if exists)
-- ========================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_services') THEN
    RAISE NOTICE '=== PROVIDER_SERVICES TABLE STRUCTURE ===';
    FOR rec IN 
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'provider_services' 
      ORDER BY ordinal_position
    LOOP
      RAISE NOTICE '  %: % (nullable: %, default: %)', 
        rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
    END LOOP;
  ELSE
    RAISE NOTICE 'provider_services table DOES NOT EXIST';
  END IF;
END $$;

-- Step 5: Check services table structure (alternative)
-- ========================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
    RAISE NOTICE '=== SERVICES TABLE STRUCTURE ===';
    FOR rec IN 
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'services' 
      ORDER BY ordinal_position
    LOOP
      RAISE NOTICE '  %: % (nullable: %, default: %)', 
        rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
    END LOOP;
  ELSE
    RAISE NOTICE 'services table does not exist';
  END IF;
END $$;

-- Step 6: Check migration status
-- ========================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations') THEN
    RAISE NOTICE '=== MIGRATION STATUS ===';
    FOR rec IN 
      SELECT version, dirty FROM schema_migrations ORDER BY version DESC LIMIT 10
    LOOP
      RAISE NOTICE '  Migration %: %', rec.version, CASE WHEN rec.dirty THEN 'DIRTY' ELSE 'CLEAN' END;
    END LOOP;
  ELSE
    RAISE NOTICE 'schema_migrations table does not exist - migrations may not be set up';
  END IF;
END $$;

-- Step 7: Show available enums
-- ========================================

SELECT 
  'Available Enums' as info,
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typtype = 'e'
ORDER BY t.typname, e.enumsortorder;

-- Step 8: Summary and Recommendations
-- ========================================

SELECT '🎯 NEXT STEPS BASED ON RESULTS:' as recommendations
UNION ALL
SELECT '1. If provider_services is missing: Run enhanced migration (20250117_enhance_client_provider_system.sql)'
UNION ALL
SELECT '2. If role constraint fails: Run role constraint fix (fix-role-constraint.sql)'
UNION ALL
SELECT '3. If services table exists instead: Update scripts to use "services" table'
UNION ALL
SELECT '4. Check Supabase dashboard for any failed migrations'
UNION ALL
SELECT '5. Verify environment variables are correctly set';

SELECT '✅ Diagnostic complete! Check the output above for issues.' as result;