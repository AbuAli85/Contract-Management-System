-- ========================================
-- Set profiles.role = 'admin' by email
-- ========================================
-- Use this so the user gets "access to all" companies in the company switcher.
-- profiles.id = auth.users.id (no user_id column on profiles).

-- Option A: Match by profiles.email (preferred)
UPDATE profiles
SET role = 'admin'
WHERE email = 'luxsess2001@gmail.com';

-- Option B: If your profiles table has no role column, add it first (see migrations).
-- Option C: Match by auth user id (same as profiles.id)
-- UPDATE profiles
-- SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'luxsess2001@gmail.com' LIMIT 1);

-- Verify (run after the update)
-- SELECT id, email, full_name, role FROM profiles WHERE email = 'luxsess2001@gmail.com';
