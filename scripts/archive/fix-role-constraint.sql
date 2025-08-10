-- ========================================
-- 🔧 Fix User Role Constraint
-- ========================================

-- This script fixes the users table role constraint to allow 'provider' and 'client' roles

-- Step 1: Check current constraint
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users' 
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%role%';

-- Step 2: Drop old constraint if exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_name = 'users_role_check'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
        RAISE NOTICE 'Dropped existing users_role_check constraint';
    END IF;
END $$;

-- Step 3: Add new constraint with all required roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'manager', 'user', 'viewer', 'client', 'provider', 'super_admin'));

-- Step 4: Verify the new constraint
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users' 
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%role%';

SELECT '✅ Role constraint updated successfully! Now you can create provider and client accounts.' as result;