-- ========================================
-- 🔄 CLEAR ALL SESSIONS - FORCE RE-LOGIN
-- ========================================
-- This will sign out all users and force them to log back in
-- This ensures fresh permissions are loaded
-- ========================================

-- Option 1: Clear sessions for specific user (RECOMMENDED)
-- Uncomment and replace with your email:
/*
DELETE FROM auth.sessions 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com'
);
*/

-- Option 2: Clear ALL sessions (will log everyone out)
-- Uncomment to use:
/*
DELETE FROM auth.sessions;
*/

-- After running this, everyone will need to log in again
-- and their permissions will be freshly loaded

-- Verify sessions cleared
SELECT 
    '✅ Remaining Sessions' as status,
    COUNT(*) as session_count
FROM auth.sessions;

