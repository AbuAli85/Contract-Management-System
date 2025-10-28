-- ========================================
-- 🔧 FIX: Duplicate Role Assignments
-- ========================================
-- This script identifies and removes duplicate role assignments
-- Safe to run multiple times (idempotent)

-- ========================================
-- STEP 1: DIAGNOSE THE ISSUE
-- ========================================

-- Check for duplicate user role assignments
SELECT 
    'Duplicate User Role Assignments' as issue_type,
    user_id,
    role_id,
    COUNT(*) as duplicate_count
FROM user_role_assignments
GROUP BY user_id, role_id
HAVING COUNT(*) > 1;

-- Check for duplicate role permissions
SELECT 
    'Duplicate Role Permissions' as issue_type,
    role_id,
    permission_id,
    COUNT(*) as duplicate_count
FROM role_permissions
GROUP BY role_id, permission_id
HAVING COUNT(*) > 1;

-- ========================================
-- STEP 2: BACKUP BEFORE CLEANUP
-- ========================================

-- Create temporary backup table
CREATE TABLE IF NOT EXISTS user_role_assignments_backup AS
SELECT * FROM user_role_assignments;

-- ========================================
-- STEP 3: REMOVE DUPLICATE USER ROLE ASSIGNMENTS
-- ========================================

-- Method A: If table has 'id' column (standard schema)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_role_assignments' 
        AND column_name = 'id'
    ) THEN
        -- Keep only the most recent assignment for each user-role pair
        WITH duplicates AS (
            SELECT 
                id,
                user_id,
                role_id,
                ROW_NUMBER() OVER (
                    PARTITION BY user_id, role_id 
                    ORDER BY created_at DESC, id DESC
                ) as rn
            FROM user_role_assignments
        )
        DELETE FROM user_role_assignments
        WHERE id IN (
            SELECT id FROM duplicates WHERE rn > 1
        );
        
        RAISE NOTICE '✅ Removed duplicates using id column';
    ELSE
        -- Method B: If table uses composite primary key (user_id, role_id)
        -- Just update is_active to ensure only one active assignment per user-role
        UPDATE user_role_assignments ura1
        SET is_active = false
        WHERE EXISTS (
            SELECT 1 
            FROM user_role_assignments ura2
            WHERE ura2.user_id = ura1.user_id
            AND ura2.role_id = ura1.role_id
            AND ura2.created_at > ura1.created_at
        );
        
        RAISE NOTICE '✅ Deactivated older duplicate assignments';
    END IF;
END $$;

-- ========================================
-- STEP 4: ADD UNIQUE CONSTRAINT TO PREVENT FUTURE DUPLICATES
-- ========================================

-- Drop existing constraint if it exists
ALTER TABLE user_role_assignments 
DROP CONSTRAINT IF EXISTS unique_user_role;

-- Add unique constraint on user_id and role_id
ALTER TABLE user_role_assignments 
ADD CONSTRAINT unique_user_role 
UNIQUE (user_id, role_id);

-- ========================================
-- STEP 5: REMOVE DUPLICATE ROLE PERMISSIONS (if any)
-- ========================================

-- Create temporary backup
CREATE TABLE IF NOT EXISTS role_permissions_backup AS
SELECT * FROM role_permissions;

-- Check if role_permissions has duplicates
-- Note: role_permissions typically uses composite primary key (role_id, permission_id)
-- So duplicates shouldn't exist, but let's check
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM (
            SELECT role_id, permission_id, COUNT(*) as cnt
            FROM role_permissions
            GROUP BY role_id, permission_id
            HAVING COUNT(*) > 1
        ) dups
    ) THEN
        RAISE NOTICE '⚠️ Found duplicate role permissions - these should not exist with proper constraints';
        
        -- If duplicates exist, keep only one of each
        DELETE FROM role_permissions rp1
        WHERE EXISTS (
            SELECT 1
            FROM role_permissions rp2
            WHERE rp2.role_id = rp1.role_id
            AND rp2.permission_id = rp1.permission_id
            AND rp2.ctid > rp1.ctid  -- Keep the one with higher ctid (more recent)
        );
        
        RAISE NOTICE '✅ Removed duplicate role permissions';
    ELSE
        RAISE NOTICE '✅ No duplicate role permissions found';
    END IF;
END $$;

-- ========================================
-- STEP 6: VERIFY THE FIX
-- ========================================

-- Verify no more duplicates in user_role_assignments
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No duplicate user role assignments found'
        ELSE '❌ Still have ' || COUNT(*) || ' duplicate user role assignments'
    END as status
FROM (
    SELECT user_id, role_id, COUNT(*) as cnt
    FROM user_role_assignments
    GROUP BY user_id, role_id
    HAVING COUNT(*) > 1
) duplicates;

-- Verify no more duplicates in role_permissions
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No duplicate role permissions found'
        ELSE '❌ Still have ' || COUNT(*) || ' duplicate role permissions'
    END as status
FROM (
    SELECT role_id, permission_id, COUNT(*) as cnt
    FROM role_permissions
    GROUP BY role_id, permission_id
    HAVING COUNT(*) > 1
) perm_duplicates;

-- ========================================
-- STEP 7: SHOW CLEAN USER PERMISSIONS
-- ========================================

-- Show users with their permissions (should be clean now)
SELECT 
    u.email,
    r.name as assigned_role,
    ura.is_active,
    CASE 
        WHEN rp.permission_id IS NOT NULL THEN '✅ Has Permission'
        ELSE '❌ Missing Permission'
    END as permission_status,
    COUNT(*) as record_count
FROM auth.users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.is_active = true
LEFT JOIN roles r ON ura.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.name = 'party:read:own'
GROUP BY u.email, r.name, ura.is_active, rp.permission_id
ORDER BY u.created_at DESC
LIMIT 20;

-- ========================================
-- STEP 8: CLEANUP BACKUP TABLES (OPTIONAL)
-- ========================================

-- Uncomment these lines if you want to remove backup tables after verification
-- DROP TABLE IF EXISTS user_role_assignments_backup;
-- DROP TABLE IF EXISTS role_permissions_backup;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Duplicate cleanup completed!';
    RAISE NOTICE '🔍 Review the verification results above';
    RAISE NOTICE '💾 Backup tables created: user_role_assignments_backup, role_permissions_backup';
    RAISE NOTICE '🗑️  Uncomment DROP statements if you want to remove backups';
END $$;

