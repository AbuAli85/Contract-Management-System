-- ============================================================================
-- FIX ORPHANED PROMOTER ASSIGNMENTS - DETAILED ANALYSIS & REPAIR
-- ============================================================================
-- This script identifies and fixes promoters with employer_id but no contracts
-- Run in Supabase SQL Editor
-- ============================================================================

-- STEP 1: DIAGNOSTIC - Find all orphaned promoters
-- ============================================================================
DO $$
DECLARE
    orphan_count INTEGER;
    total_active INTEGER;
BEGIN
    -- Count orphaned promoters (promoters with employer_id but no contracts)
    SELECT COUNT(*) INTO orphan_count
    FROM (
        SELECT p.id
        FROM promoters p
        LEFT JOIN contracts c ON c.promoter_id = p.id
        WHERE p.status = 'active'
          AND p.employer_id IS NOT NULL
        GROUP BY p.id
        HAVING COUNT(c.id) = 0
    ) orphans;
    
    -- Count total active promoters
    SELECT COUNT(*) INTO total_active
    FROM promoters
    WHERE status = 'active';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ORPHANED PROMOTER ANALYSIS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total Active Promoters: %', total_active;
    RAISE NOTICE 'Orphaned Promoters: %', COALESCE(orphan_count, 0);
    RAISE NOTICE 'Percentage Orphaned: %', 
        ROUND((COALESCE(orphan_count, 0)::NUMERIC / NULLIF(total_active, 0) * 100), 2);
    RAISE NOTICE '========================================';
END $$;

-- STEP 2: DETAILED LIST - Show all orphaned promoters
-- ============================================================================
SELECT 
    '📋 ORPHANED PROMOTERS REPORT' AS report_type,
    p.id,
    p.name_en,
    p.name_ar,
    p.status,
    employer.name_en as current_employer,
    p.job_title,
    p.id_card_number,
    COUNT(c.id) as contract_count,
    p.created_at::DATE as created_date,
    CASE 
        WHEN p.created_at > NOW() - INTERVAL '30 days' THEN '🆕 New (< 30 days)'
        WHEN p.created_at > NOW() - INTERVAL '90 days' THEN '📅 Recent (< 90 days)'
        ELSE '⏳ Old (> 90 days)'
    END as age_category
FROM promoters p
LEFT JOIN parties employer ON employer.id = p.employer_id
LEFT JOIN contracts c ON c.promoter_id = p.id
WHERE p.status = 'active'
  AND p.employer_id IS NOT NULL
GROUP BY p.id, p.name_en, p.name_ar, p.status, employer.name_en, p.job_title, p.id_card_number, p.created_at
HAVING COUNT(c.id) = 0
ORDER BY p.created_at DESC;

-- STEP 3: EMPLOYER DISTRIBUTION - See which employers have orphaned promoters
-- ============================================================================
WITH orphaned_promoters AS (
  SELECT 
    p.id,
    p.name_en,
    p.employer_id
  FROM promoters p
  LEFT JOIN contracts c ON c.promoter_id = p.id
  WHERE p.status = 'active'
    AND p.employer_id IS NOT NULL
  GROUP BY p.id, p.name_en, p.employer_id
  HAVING COUNT(c.id) = 0
)
SELECT 
    '📊 EMPLOYER DISTRIBUTION' AS report_type,
    employer.name_en as employer_name,
    employer.name_ar as employer_name_ar,
    COUNT(op.id) as orphaned_promoters_count,
    STRING_AGG(op.name_en, ', ') as promoter_names
FROM orphaned_promoters op
LEFT JOIN parties employer ON employer.id = op.employer_id
GROUP BY employer.name_en, employer.name_ar
ORDER BY orphaned_promoters_count DESC;

-- STEP 4: SOLUTION OPTIONS
-- ============================================================================
-- Choose ONE of the following options:

-- OPTION A: Create placeholder contracts for all orphaned promoters
-- This maintains data integrity and allows you to fill in details later
-- ============================================================================
/*
DO $$
DECLARE
    promoter_record RECORD;
    new_contract_id UUID;
    contracts_created INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CREATING PLACEHOLDER CONTRACTS';
    RAISE NOTICE '========================================';
    
    FOR promoter_record IN 
        SELECT DISTINCT
            p.id as promoter_id,
            p.name_en,
            p.employer_id,
            employer.name_en as employer_name
        FROM promoters p
        LEFT JOIN parties employer ON employer.id = p.employer_id
        LEFT JOIN contracts c ON c.promoter_id = p.id
        WHERE p.status = 'active'
          AND p.employer_id IS NOT NULL
        GROUP BY p.id, p.name_en, p.employer_id, employer.name_en
        HAVING COUNT(c.id) = 0
    LOOP
        -- Generate a unique contract number
        new_contract_id := gen_random_uuid();
        
        -- Create placeholder contract
        INSERT INTO contracts (
            id,
            contract_number,
            title,
            contract_type,
            status,
            promoter_id,
            first_party_id,
            second_party_id,
            start_date,
            end_date,
            description,
            created_at,
            updated_at
        ) VALUES (
            new_contract_id,
            'PLACEHOLDER-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(promoter_record.promoter_id::TEXT, 1, 8),
            'Employment Contract - ' || promoter_record.name_en,
            'employment',
            'pending',  -- Use 'pending' status to indicate this needs review
            promoter_record.promoter_id,
            promoter_record.employer_id,  -- Employer as first party
            promoter_record.employer_id,  -- Employer as second party (adjust as needed)
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '1 year',  -- Set end date to 1 year from now
            'Auto-generated placeholder contract. Please review and update with actual contract details.',
            NOW(),
            NOW()
        );
        
        contracts_created := contracts_created + 1;
        RAISE NOTICE 'Created contract for: % (ID: %)', promoter_record.name_en, promoter_record.promoter_id;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created % placeholder contracts', contracts_created;
    RAISE NOTICE '========================================';
END $$;
*/

-- OPTION B: Remove employer assignments for promoters without contracts
-- Use this if the assignments were mistakes or the promoters are no longer employed
-- ============================================================================
/*
UPDATE promoters p
SET 
    employer_id = NULL,
    status = 'inactive',
    notes = COALESCE(notes || ' | ', '') || 'Employer assignment removed on ' || NOW()::DATE || ' - no contract found',
    updated_at = NOW()
WHERE p.id IN (
    SELECT p2.id
    FROM promoters p2
    LEFT JOIN contracts c ON c.promoter_id = p2.id
    WHERE p2.status = 'active'
      AND p2.employer_id IS NOT NULL
    GROUP BY p2.id
    HAVING COUNT(c.id) = 0
)
RETURNING 
    id,
    name_en,
    'Employer assignment removed' as action;
*/

-- OPTION C: Hybrid approach - Keep recent assignments, remove old ones
-- This assumes recent assignments are valid but old ones without contracts are errors
-- ============================================================================
/*
DO $$
DECLARE
    recent_threshold INTERVAL := INTERVAL '30 days';
    promoter_record RECORD;
    new_contract_id UUID;
    contracts_created INTEGER := 0;
    assignments_removed INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'HYBRID FIX: Create contracts for recent, remove old';
    RAISE NOTICE '========================================';
    
    -- For recent promoters (< 30 days), create placeholder contracts
    FOR promoter_record IN 
        SELECT DISTINCT
            p.id as promoter_id,
            p.name_en,
            p.employer_id,
            employer.name_en as employer_name,
            p.created_at
        FROM promoters p
        LEFT JOIN parties employer ON employer.id = p.employer_id
        LEFT JOIN contracts c ON c.promoter_id = p.id
        WHERE p.status = 'active'
          AND p.employer_id IS NOT NULL
          AND p.created_at > NOW() - recent_threshold
        GROUP BY p.id, p.name_en, p.employer_id, employer.name_en, p.created_at
        HAVING COUNT(c.id) = 0
    LOOP
        new_contract_id := gen_random_uuid();
        
        INSERT INTO contracts (
            id,
            contract_number,
            title,
            contract_type,
            status,
            promoter_id,
            first_party_id,
            second_party_id,
            start_date,
            end_date,
            description,
            created_at,
            updated_at
        ) VALUES (
            new_contract_id,
            'AUTO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(promoter_record.promoter_id::TEXT, 1, 8),
            'Employment Contract - ' || promoter_record.name_en,
            'employment',
            'pending',
            promoter_record.promoter_id,
            promoter_record.employer_id,
            promoter_record.employer_id,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '1 year',  -- Set end date to 1 year from now
            'Auto-generated for recent assignment. Please review and update.',
            NOW(),
            NOW()
        );
        
        contracts_created := contracts_created + 1;
        RAISE NOTICE '✅ Created contract for recent: %', promoter_record.name_en;
    END LOOP;
    
    -- For old promoters (> 30 days), remove employer assignment
    UPDATE promoters p
    SET 
        employer_id = NULL,
        notes = COALESCE(notes || ' | ', '') || 'Employer assignment removed ' || NOW()::DATE || ' - no contract found',
        updated_at = NOW()
    WHERE p.id IN (
        SELECT p2.id
        FROM promoters p2
        LEFT JOIN contracts c ON c.promoter_id = p2.id
        WHERE p2.status = 'active'
          AND p2.employer_id IS NOT NULL
          AND p2.created_at <= NOW() - recent_threshold
        GROUP BY p2.id
        HAVING COUNT(c.id) = 0
    );
    
    GET DIAGNOSTICS assignments_removed = ROW_COUNT;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created % contracts for recent promoters', contracts_created;
    RAISE NOTICE 'Removed % old employer assignments', assignments_removed;
    RAISE NOTICE '========================================';
END $$;
*/

-- STEP 5: PREVENTION - Add validation trigger
-- ============================================================================
-- This trigger warns when a promoter is assigned without a contract
CREATE OR REPLACE FUNCTION validate_promoter_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.employer_id IS NOT NULL AND NEW.status = 'active' THEN
        -- Check if promoter has at least one contract
        IF NOT EXISTS (
            SELECT 1 FROM contracts 
            WHERE promoter_id = NEW.id 
            AND status IN ('active', 'pending', 'draft')
        ) THEN
            RAISE WARNING '⚠️  Promoter % (%) assigned to employer but has no active contracts. Consider creating a contract.', 
                NEW.name_en, NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS check_promoter_assignment ON promoters;

CREATE TRIGGER check_promoter_assignment
    AFTER INSERT OR UPDATE ON promoters
    FOR EACH ROW
    EXECUTE FUNCTION validate_promoter_assignment();

-- STEP 6: VERIFICATION - Verify the fix worked
-- ============================================================================
SELECT 
    '✅ VERIFICATION REPORT' AS report_type,
    COUNT(*) as remaining_orphans,
    CASE 
        WHEN COUNT(*) = 0 THEN '🎉 All orphaned assignments fixed!'
        ELSE '⚠️  Still have orphaned promoters - review needed'
    END as status
FROM (
    SELECT p.id
    FROM promoters p
    LEFT JOIN contracts c ON c.promoter_id = p.id
    WHERE p.status = 'active'
      AND p.employer_id IS NOT NULL
    GROUP BY p.id
    HAVING COUNT(c.id) = 0
) orphans;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Review the diagnostic output first
-- 2. Uncomment ONLY ONE of the solution options (A, B, or C)
-- 3. Run the script
-- 4. Verify the results
-- 5. The prevention trigger will warn about future orphaned assignments
-- ============================================================================

