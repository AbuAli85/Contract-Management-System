-- Webhook Integration Testing Script
-- Run this after setting up the webhook triggers to validate everything works

-- ============================================================================
-- TEST 1: Check HTTP Extension and Permissions
-- ============================================================================

-- Verify HTTP extension is enabled
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
        RAISE NOTICE '✅ HTTP extension is enabled';
    ELSE
        RAISE NOTICE '❌ HTTP extension is NOT enabled - run: CREATE EXTENSION IF NOT EXISTS http;';
    END IF;
END
$$;

-- Test basic HTTP functionality
SELECT 
    CASE 
        WHEN net.http_post IS NOT NULL THEN '✅ HTTP functions available'
        ELSE '❌ HTTP functions not available'
    END as http_status;

-- ============================================================================
-- TEST 2: Verify Trigger Functions Exist
-- ============================================================================

SELECT 
    proname as function_name,
    '✅ Function exists' as status
FROM pg_proc 
WHERE proname IN (
    'safe_webhook_call',
    'notify_booking_created',
    'notify_booking_status_changed', 
    'notify_payment_processed',
    'notify_user_registered',
    'notify_service_created'
)
ORDER BY proname;

-- ============================================================================
-- TEST 3: Verify Triggers Are Active
-- ============================================================================

SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    '✅ Trigger active' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'on_booking_created',
    'on_booking_status_changed',
    'on_payment_processed', 
    'on_user_registered',
    'on_service_created'
  )
ORDER BY trigger_name;

-- ============================================================================
-- TEST 4: Test Safe Webhook Call Function
-- ============================================================================

-- Test webhook call with a dummy URL (this will fail but should not error)
SELECT 
    safe_webhook_call(
        'https://httpbin.org/post',
        '{"test": "webhook integration test", "timestamp": "' || NOW()::TEXT || '"}'::jsonb
    ) as webhook_test_result;

-- ============================================================================
-- TEST 5: Create Test Data to Trigger Webhooks
-- ============================================================================

-- Create a test service first (if you have a provider profile)
DO $$
DECLARE
    provider_id UUID;
    service_id UUID;
    booking_id UUID;
BEGIN
    -- Get a provider ID (adjust this query based on your data)
    SELECT id INTO provider_id 
    FROM profiles 
    WHERE role = 'provider' 
    LIMIT 1;
    
    IF provider_id IS NOT NULL THEN
        RAISE NOTICE '✅ Found provider ID: %', provider_id;
        
        -- Create test service
        INSERT INTO services (
            provider_id,
            title,
            description,
            category,
            subcategory,
            base_price,
            currency,
            location_type,
            status
        ) VALUES (
            provider_id,
            'Test Webhook Service',
            'A test service to validate webhook integration',
            'consulting',
            'business',
            100.00,
            'USD',
            'online',
            'active'
        ) RETURNING id INTO service_id;
        
        RAISE NOTICE '✅ Created test service: %', service_id;
        
        -- Create test booking (this should trigger webhook)
        INSERT INTO bookings (
            service_id,
            client_name,
            client_email,
            client_phone,
            scheduled_start,
            scheduled_end,
            quoted_price,
            status,
            booking_number
        ) VALUES (
            service_id,
            'Test Webhook Client',
            'webhook-test@example.com',
            '+1-555-0123',
            NOW() + INTERVAL '1 day',
            NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
            100.00,
            'pending',
            'TEST' || EXTRACT(epoch FROM NOW())::TEXT
        ) RETURNING id INTO booking_id;
        
        RAISE NOTICE '✅ Created test booking: %', booking_id;
        
        -- Wait a moment then update status (this should trigger status change webhook)
        PERFORM pg_sleep(2);
        
        UPDATE bookings 
        SET status = 'confirmed'
        WHERE id = booking_id;
        
        RAISE NOTICE '✅ Updated booking status to confirmed';
        
    ELSE
        RAISE NOTICE '❌ No provider found - create a provider profile first';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error during test: %', SQLERRM;
END
$$;

-- ============================================================================
-- TEST 6: Check Webhook Logs
-- ============================================================================

-- Check if webhook logs were created
SELECT 
    webhook_type,
    status,
    created_at,
    CASE 
        WHEN status = 'success' THEN '✅ Success'
        WHEN status = 'failed' THEN '❌ Failed'
        ELSE '⏳ ' || status
    END as result,
    error_message
FROM webhook_logs 
WHERE created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;

-- ============================================================================
-- TEST 7: Webhook Statistics
-- ============================================================================

-- Get overall webhook statistics
SELECT * FROM get_webhook_stats(1); -- Last 1 day

-- ============================================================================
-- TEST 8: Clean Up Test Data
-- ============================================================================

-- Uncomment to clean up test data
/*
DELETE FROM bookings WHERE client_email = 'webhook-test@example.com';
DELETE FROM services WHERE title = 'Test Webhook Service';
DELETE FROM webhook_logs WHERE webhook_type LIKE '%test%';
*/

-- ============================================================================
-- VALIDATION CHECKLIST
-- ============================================================================

/*
EXPECTED RESULTS:

1. ✅ HTTP extension enabled
2. ✅ All trigger functions exist  
3. ✅ All triggers are active
4. ✅ Safe webhook call function works
5. ✅ Test booking created successfully
6. ✅ Webhook logs show successful calls
7. ✅ Statistics show webhook activity

IF ANY TEST FAILS:

1. Check Supabase logs for errors
2. Verify Make.com webhook URLs are correct
3. Ensure HTTP extension has proper permissions
4. Check network connectivity from Supabase to Make.com
5. Verify webhook URLs are accessible

MANUAL VERIFICATION:

1. Check Make.com scenarios for webhook activity
2. Verify emails/notifications were sent
3. Check calendar events were created
4. Confirm Slack messages were posted
*/

-- ============================================================================
-- PERFORMANCE MONITORING QUERIES
-- ============================================================================

-- Webhook call frequency over time
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    webhook_type,
    COUNT(*) as calls,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM webhook_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), webhook_type
ORDER BY hour DESC, webhook_type;

-- Failed webhooks that need attention
SELECT 
    webhook_type,
    payload->>'booking_number' as booking_number,
    payload->>'client_email' as client_email,
    error_message,
    retry_count,
    created_at
FROM webhook_logs 
WHERE status = 'failed' 
  AND retry_count < 3
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- ============================================================================
-- FINAL STATUS CHECK
-- ============================================================================

DO $$
DECLARE
    total_webhooks INTEGER;
    successful_webhooks INTEGER;
    success_rate NUMERIC;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN status = 'success' THEN 1 END)
    INTO total_webhooks, successful_webhooks
    FROM webhook_logs 
    WHERE created_at >= NOW() - INTERVAL '1 hour';
    
    IF total_webhooks > 0 THEN
        success_rate := (successful_webhooks::NUMERIC / total_webhooks::NUMERIC) * 100;
        
        RAISE NOTICE '';
        RAISE NOTICE '🎉 WEBHOOK INTEGRATION TEST COMPLETE';
        RAISE NOTICE '=======================================';
        RAISE NOTICE 'Total webhooks (last hour): %', total_webhooks;
        RAISE NOTICE 'Successful webhooks: %', successful_webhooks;
        RAISE NOTICE 'Success rate: %% ', ROUND(success_rate, 2);
        RAISE NOTICE '';
        
        IF success_rate >= 90 THEN
            RAISE NOTICE '✅ Webhook integration is working excellently!';
        ELSIF success_rate >= 70 THEN
            RAISE NOTICE '⚠️  Webhook integration is working but may need optimization';
        ELSE
            RAISE NOTICE '❌ Webhook integration needs attention - check failed webhooks';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  No webhook activity detected in the last hour';
        RAISE NOTICE 'Create some test bookings to validate the integration';
    END IF;
END
$$;
