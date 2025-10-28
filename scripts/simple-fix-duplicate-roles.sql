-- ========================================
-- 🚀 SIMPLE FIX: Remove Duplicate Role Assignments
-- ========================================
-- This script works regardless of your table structure
-- No 'id' column required!

-- Step 1: Check for duplicates first
SELECT 
    '⚠️ Found duplicates:' as status,
    user_id,
    role_id,
    COUNT(*) as duplicate_count
FROM user_role_assignments
GROUP BY user_id, role_id
HAVING COUNT(*) > 1;

-- Step 2: Create backup
CREATE TABLE IF NOT EXISTS user_role_assignments_backup AS
SELECT * FROM user_role_assignments;

-- Step 3: Remove duplicates using CTID (physical row identifier)
-- Keep the most recently created one for each user-role pair
DELETE FROM user_role_assignments ura1
WHERE ura1.ctid NOT IN (
    SELECT MAX(ura2.ctid)
    FROM user_role_assignments ura2
    WHERE ura2.user_id = ura1.user_id
    AND ura2.role_id = ura1.role_id
    GROUP BY ura2.user_id, ura2.role_id
);

-- Step 4: Add unique constraint (this will fail if duplicates still exist)
ALTER TABLE user_role_assignments 
DROP CONSTRAINT IF EXISTS unique_user_role;

ALTER TABLE user_role_assignments 
ADD CONSTRAINT unique_user_role 
UNIQUE (user_id, role_id);

-- Step 5: Verify - should return 0 rows
SELECT 
    user_id,
    role_id,
    COUNT(*) as count
FROM user_role_assignments
GROUP BY user_id, role_id
HAVING COUNT(*) > 1;

-- Step 6: Success message
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, role_id
        FROM user_role_assignments
        GROUP BY user_id, role_id
        HAVING COUNT(*) > 1
    ) dups;
    
    IF duplicate_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS! All duplicates removed';
        RAISE NOTICE '✅ Unique constraint added';
        RAISE NOTICE '💾 Backup saved in: user_role_assignments_backup';
    ELSE
        RAISE NOTICE '❌ Still have % duplicate entries', duplicate_count;
    END IF;
END $$;

-- Step 7: Show clean results (each user should appear once per role)
SELECT 
    u.email,
    r.name as role,
    ura.is_active,
    ura.created_at
FROM auth.users u
JOIN user_role_assignments ura ON u.id = ura.user_id
JOIN roles r ON ura.role_id = r.id
WHERE ura.is_active = true
ORDER BY u.email, r.name
LIMIT 20;

