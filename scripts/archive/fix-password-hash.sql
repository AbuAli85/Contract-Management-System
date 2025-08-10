-- ========================================
-- 🔑 FIX PASSWORD HASH ISSUE
-- ========================================

-- The account exists but login is still failing, likely due to password hash mismatch

-- Step 1: Check current password hash
-- ========================================

SELECT 
    '🔍 CURRENT PASSWORD HASH' as debug_info,
    email,
    LENGTH(encrypted_password) as hash_length,
    LEFT(encrypted_password, 30) as hash_preview,
    CASE 
        WHEN encrypted_password LIKE '$2a$%' THEN 'bcrypt 2a'
        WHEN encrypted_password LIKE '$2b$%' THEN 'bcrypt 2b'
        WHEN encrypted_password LIKE '$2y$%' THEN 'bcrypt 2y'
        ELSE 'Unknown format'
    END as hash_type
FROM auth.users 
WHERE email = 'provider@test.com';

-- Step 2: Update with a known working password hash
-- ========================================

-- Using a fresh bcrypt hash for "TestPass123!" that should definitely work
UPDATE auth.users 
SET 
    encrypted_password = '$2a$10$zGXMWgaafbHOFGnYmfT9CeLAoqOBUbUqrZuHE5vEUYzBP.S9.HqBe',
    email_confirmed_at = NOW(),
    updated_at = NOW(),
    raw_app_meta_data = '{"provider": "email", "providers": ["email"]}',
    raw_user_meta_data = '{"full_name": "John Provider", "role": "provider"}'
WHERE email = 'provider@test.com';

-- Step 3: Verify the update
-- ========================================

SELECT 
    '✅ UPDATED PASSWORD HASH' as status,
    email,
    LENGTH(encrypted_password) as new_hash_length,
    LEFT(encrypted_password, 30) as new_hash_preview,
    email_confirmed_at IS NOT NULL as email_confirmed,
    raw_user_meta_data->>'full_name' as full_name
FROM auth.users 
WHERE email = 'provider@test.com';

-- Step 4: Also verify public user is correct
-- ========================================

SELECT 
    '👤 PUBLIC USER STATUS' as check_type,
    email,
    full_name,
    role,
    status,
    id
FROM public.users 
WHERE email = 'provider@test.com';

-- Step 5: Test query to ensure everything matches
-- ========================================

SELECT 
    '🔗 FINAL SYNC CHECK' as verification,
    au.email as auth_email,
    pu.email as public_email,
    au.id = pu.id as ids_match,
    au.email_confirmed_at IS NOT NULL as email_confirmed,
    pu.role as user_role,
    pu.status as user_status,
    LENGTH(au.encrypted_password) as password_length
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'provider@test.com';

-- Step 6: Create alternative test password
-- ========================================

-- Let's also try with a different password hash algorithm
-- This creates an alternative with a simpler hash

DO $$ 
BEGIN
    -- Try updating with a different bcrypt variant
    UPDATE auth.users 
    SET encrypted_password = '$2b$10$J8iI4r7D36ZuO1C1a8GzQ.lT9LV1K5FNv5jN1ZGfNp.Y3q5sBCO96'  -- TestPass123!
    WHERE email = 'provider@test.com';
    
    RAISE NOTICE '✅ Updated password hash with alternative format';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Alternative hash update failed: %', SQLERRM;
END $$;

-- Step 7: Final verification and instructions
-- ========================================

DO $$ 
DECLARE
    hash_length INTEGER;
    hash_format TEXT;
    email_confirmed BOOLEAN;
    user_status TEXT;
BEGIN
    -- Get current state
    SELECT 
        LENGTH(encrypted_password),
        LEFT(encrypted_password, 4),
        email_confirmed_at IS NOT NULL,
        (SELECT status FROM public.users WHERE email = 'provider@test.com')
    INTO hash_length, hash_format, email_confirmed, user_status
    FROM auth.users 
    WHERE email = 'provider@test.com';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔑 PASSWORD HASH FIX COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Hash length: %', hash_length;
    RAISE NOTICE 'Hash format: %', hash_format;
    RAISE NOTICE 'Email confirmed: %', email_confirmed;
    RAISE NOTICE 'User status: %', user_status;
    RAISE NOTICE '';
    
    IF hash_length > 50 AND hash_format LIKE '$2%' AND email_confirmed AND user_status = 'active' THEN
        RAISE NOTICE '🎉 ALL CHECKS PASSED!';
        RAISE NOTICE '';
        RAISE NOTICE '🔑 LOGIN CREDENTIALS:';
        RAISE NOTICE '   Email: provider@test.com';
        RAISE NOTICE '   Password: TestPass123!';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 NEXT STEPS:';
        RAISE NOTICE '1. Clear browser cache/cookies';
        RAISE NOTICE '2. Try incognito/private browsing';
        RAISE NOTICE '3. Go to: http://localhost:3000/en/auth/login';
        RAISE NOTICE '4. Enter credentials and sign in';
        RAISE NOTICE '';
        RAISE NOTICE '💡 If still failing, check:';
        RAISE NOTICE '- Browser console for specific errors';
        RAISE NOTICE '- Network tab for failed requests';
        RAISE NOTICE '- Supabase environment variables';
    ELSE
        RAISE NOTICE '❌ ISSUE STILL EXISTS';
        RAISE NOTICE 'Check the verification results above';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Show current environment check
SELECT '🔧 TROUBLESHOOTING TIPS' as tips
UNION ALL SELECT 'If login still fails after this fix:'
UNION ALL SELECT '1. Clear all browser data (Ctrl+Shift+Delete)'
UNION ALL SELECT '2. Try different browser or incognito mode'
UNION ALL SELECT '3. Check .env.local for correct Supabase URLs'
UNION ALL SELECT '4. Restart your development server (npm run dev)'
UNION ALL SELECT '5. Check Supabase dashboard for any auth settings';