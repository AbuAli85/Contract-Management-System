-- Migration: Add promoter validation and helper functions
-- Date: 2025-10-23
-- Purpose: Improve data quality for promoter assignments in contracts

-- ============================================
-- 1. Create helper table for promoter suggestions
-- ============================================

CREATE TABLE IF NOT EXISTS promoter_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE NOT NULL,
    suggested_promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE NOT NULL,
    confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    suggestion_reason TEXT,
    is_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    applied_at TIMESTAMPTZ,
    applied_by UUID,
    UNIQUE(contract_id, suggested_promoter_id)
);

CREATE INDEX idx_promoter_suggestions_contract ON promoter_suggestions(contract_id);
CREATE INDEX idx_promoter_suggestions_promoter ON promoter_suggestions(suggested_promoter_id);
CREATE INDEX idx_promoter_suggestions_applied ON promoter_suggestions(is_applied);

COMMENT ON TABLE promoter_suggestions IS 'Stores AI/rule-based suggestions for assigning promoters to contracts';
COMMENT ON COLUMN promoter_suggestions.confidence_score IS 'Confidence score (0-100) for the suggestion';
COMMENT ON COLUMN promoter_suggestions.suggestion_reason IS 'Explanation of why this promoter was suggested';

-- ============================================
-- 2. Create audit log for promoter assignments
-- ============================================

CREATE TABLE IF NOT EXISTS contract_promoter_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE NOT NULL,
    old_promoter_id UUID REFERENCES promoters(id) ON DELETE SET NULL,
    new_promoter_id UUID REFERENCES promoters(id) ON DELETE SET NULL,
    changed_by UUID,
    change_reason TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contract_promoter_audit_contract ON contract_promoter_audit(contract_id);
CREATE INDEX idx_contract_promoter_audit_date ON contract_promoter_audit(changed_at);

COMMENT ON TABLE contract_promoter_audit IS 'Audit trail for all promoter assignment changes';

-- ============================================
-- 3. Function: Get contracts without promoters
-- ============================================

CREATE OR REPLACE FUNCTION get_contracts_without_promoters(
    p_status TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    contract_id UUID,
    contract_number TEXT,
    title TEXT,
    status TEXT,
    contract_type TEXT,
    first_party_name TEXT,
    second_party_name TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ,
    days_since_creation INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.contract_number,
        c.title,
        c.status,
        c.contract_type,
        COALESCE(p1.name_en, p1.name_ar) as first_party_name,
        COALESCE(p2.name_en, p2.name_ar) as second_party_name,
        c.start_date,
        c.end_date,
        c.created_at,
        EXTRACT(DAY FROM NOW() - c.created_at)::INTEGER as days_since_creation
    FROM contracts c
    LEFT JOIN parties p1 ON (
        (c.first_party_id IS NOT NULL AND c.first_party_id::TEXT = p1.id::TEXT) OR 
        (c.employer_id IS NOT NULL AND c.employer_id::TEXT = p1.id::TEXT)
    )
    LEFT JOIN parties p2 ON (
        (c.second_party_id IS NOT NULL AND c.second_party_id::TEXT = p2.id::TEXT) OR 
        (c.client_id IS NOT NULL AND c.client_id::TEXT = p2.id::TEXT)
    )
    WHERE c.promoter_id IS NULL
        AND (p_status IS NULL OR c.status = p_status)
    ORDER BY c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_contracts_without_promoters IS 'Returns all contracts that do not have an assigned promoter';

-- ============================================
-- 4. Function: Suggest promoters for a contract
-- ============================================

CREATE OR REPLACE FUNCTION suggest_promoters_for_contract(
    p_contract_id UUID,
    p_max_suggestions INTEGER DEFAULT 5
)
RETURNS TABLE (
    promoter_id UUID,
    promoter_name_en TEXT,
    promoter_name_ar TEXT,
    confidence_score INTEGER,
    reason TEXT
) AS $$
DECLARE
    v_contract RECORD;
    v_promoter RECORD;
BEGIN
    -- Get contract details
    SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contract not found: %', p_contract_id;
    END IF;

    -- Strategy 1: Promoters who worked with same parties in similar time period
    RETURN QUERY
    SELECT 
        p.id,
        p.name_en,
        p.name_ar,
        85 as confidence_score,
        'Previously worked with same party in similar period' as reason
    FROM promoters p
    INNER JOIN contracts c ON c.promoter_id::TEXT = p.id::TEXT
    WHERE p.status = 'active'
        AND (
            (c.first_party_id IS NOT NULL AND c.first_party_id::TEXT = v_contract.first_party_id::TEXT) OR
            (c.second_party_id IS NOT NULL AND c.second_party_id::TEXT = v_contract.second_party_id::TEXT) OR
            (c.employer_id IS NOT NULL AND c.employer_id::TEXT = v_contract.employer_id::TEXT) OR
            (c.client_id IS NOT NULL AND c.client_id::TEXT = v_contract.client_id::TEXT)
        )
        AND c.id != p_contract_id
        AND c.start_date IS NOT NULL 
        AND v_contract.start_date IS NOT NULL
        AND ABS(c.start_date - v_contract.start_date) < 180 -- Within 6 months (DATE subtraction returns integer days)
    GROUP BY p.id, p.name_en, p.name_ar
    ORDER BY COUNT(*) DESC
    LIMIT p_max_suggestions;

    -- Strategy 2: Active promoters without current assignments (if no results from strategy 1)
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            p.id,
            p.name_en,
            p.name_ar,
            60 as confidence_score,
            'Active promoter available for assignment' as reason
        FROM promoters p
        LEFT JOIN contracts c ON c.promoter_id::TEXT = p.id::TEXT AND c.status IN ('active', 'pending')
        WHERE p.status = 'active'
        GROUP BY p.id, p.name_en, p.name_ar
        HAVING COUNT(c.id) = 0
        ORDER BY p.created_at DESC
        LIMIT p_max_suggestions;
    END IF;

    -- Strategy 3: All active promoters (fallback)
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            p.id,
            p.name_en,
            p.name_ar,
            40 as confidence_score,
            'Active promoter in system' as reason
        FROM promoters p
        WHERE p.status = 'active'
        ORDER BY p.name_en
        LIMIT p_max_suggestions;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION suggest_promoters_for_contract IS 'Suggests suitable promoters for a contract based on various criteria';

-- ============================================
-- 5. Function: Bulk assign promoters
-- ============================================

CREATE OR REPLACE FUNCTION bulk_assign_promoters(
    p_assignments JSONB,
    p_assigned_by UUID DEFAULT NULL
)
RETURNS TABLE (
    contract_id UUID,
    success BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_assignment JSONB;
    v_contract_id UUID;
    v_promoter_id UUID;
    v_old_promoter_id UUID;
BEGIN
    -- Loop through each assignment
    FOR v_assignment IN SELECT * FROM jsonb_array_elements(p_assignments)
    LOOP
        BEGIN
            v_contract_id := (v_assignment->>'contract_id')::UUID;
            v_promoter_id := (v_assignment->>'promoter_id')::UUID;
            
            -- Get old promoter_id for audit
            SELECT contracts.promoter_id INTO v_old_promoter_id 
            FROM contracts 
            WHERE contracts.id = v_contract_id;
            
            -- Update contract
            UPDATE contracts 
            SET 
                promoter_id = v_promoter_id,
                updated_at = NOW()
            WHERE id = v_contract_id;
            
            -- Create audit log entry
            INSERT INTO contract_promoter_audit (
                contract_id,
                old_promoter_id,
                new_promoter_id,
                changed_by,
                change_reason
            ) VALUES (
                v_contract_id,
                v_old_promoter_id,
                v_promoter_id,
                p_assigned_by,
                'Bulk assignment via admin interface'
            );
            
            -- Mark suggestion as applied if it exists
            UPDATE promoter_suggestions
            SET 
                is_applied = TRUE,
                applied_at = NOW(),
                applied_by = p_assigned_by
            WHERE contract_id = v_contract_id 
                AND suggested_promoter_id = v_promoter_id;
            
            -- Return success
            RETURN QUERY SELECT v_contract_id, TRUE, NULL::TEXT;
            
        EXCEPTION WHEN OTHERS THEN
            -- Return error
            RETURN QUERY SELECT v_contract_id, FALSE, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION bulk_assign_promoters IS 'Assigns promoters to multiple contracts in a single transaction';

-- ============================================
-- 6. Trigger: Audit promoter changes
-- ============================================

CREATE OR REPLACE FUNCTION audit_promoter_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.promoter_id IS DISTINCT FROM NEW.promoter_id THEN
        INSERT INTO contract_promoter_audit (
            contract_id,
            old_promoter_id,
            new_promoter_id,
            change_reason
        ) VALUES (
            NEW.id,
            OLD.promoter_id,
            NEW.promoter_id,
            'Automatic audit: promoter changed'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audit_promoter_change ON contracts;
CREATE TRIGGER trigger_audit_promoter_change
AFTER UPDATE ON contracts
FOR EACH ROW
WHEN (OLD.promoter_id IS DISTINCT FROM NEW.promoter_id)
EXECUTE FUNCTION audit_promoter_change();

-- ============================================
-- 7. Add constraint (WARNING: This will fail if NULL promoters exist)
-- ============================================

-- Uncomment this ONLY after fixing all existing contracts with NULL promoters
-- ALTER TABLE contracts 
-- ALTER COLUMN promoter_id SET NOT NULL;

-- OR use a CHECK constraint that allows exceptions for certain contract types
-- ALTER TABLE contracts
-- ADD CONSTRAINT check_promoter_required 
-- CHECK (
--     promoter_id IS NOT NULL 
--     OR contract_type IN ('partnership', 'consultancy')
--     OR status = 'draft'
-- );

-- ============================================
-- 8. Create view for contracts needing attention
-- ============================================

CREATE OR REPLACE VIEW contracts_needing_promoters AS
SELECT 
    c.id,
    c.contract_number,
    c.title,
    c.status,
    c.contract_type,
    c.created_at,
    EXTRACT(DAY FROM NOW() - c.created_at)::INTEGER as days_without_promoter,
    COALESCE(p1.name_en, p1.name_ar, 'Unknown') as first_party_name,
    COALESCE(p2.name_en, p2.name_ar, 'Unknown') as second_party_name,
    CASE 
        WHEN c.status IN ('active', 'pending') THEN 'high'
        WHEN c.status = 'draft' AND EXTRACT(DAY FROM NOW() - c.created_at) > 7 THEN 'medium'
        ELSE 'low'
    END as priority
FROM contracts c
LEFT JOIN parties p1 ON (
    (c.first_party_id IS NOT NULL AND c.first_party_id::TEXT = p1.id::TEXT) OR 
    (c.employer_id IS NOT NULL AND c.employer_id::TEXT = p1.id::TEXT)
)
LEFT JOIN parties p2 ON (
    (c.second_party_id IS NOT NULL AND c.second_party_id::TEXT = p2.id::TEXT) OR 
    (c.client_id IS NOT NULL AND c.client_id::TEXT = p2.id::TEXT)
)
WHERE c.promoter_id IS NULL
ORDER BY 
    CASE 
        WHEN c.status IN ('active', 'pending') THEN 1
        WHEN c.status = 'draft' AND EXTRACT(DAY FROM NOW() - c.created_at) > 7 THEN 2
        ELSE 3
    END,
    c.created_at DESC;

COMMENT ON VIEW contracts_needing_promoters IS 'Lists all contracts without promoters, prioritized by urgency';

-- ============================================
-- 9. Grant permissions (adjust as needed)
-- ============================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_contracts_without_promoters TO authenticated;
GRANT EXECUTE ON FUNCTION suggest_promoters_for_contract TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_assign_promoters TO authenticated;

-- Grant access to new tables
GRANT SELECT ON promoter_suggestions TO authenticated;
GRANT SELECT ON contract_promoter_audit TO authenticated;
GRANT SELECT ON contracts_needing_promoters TO authenticated;

-- ============================================
-- 10. Generate initial suggestions for existing contracts
-- ============================================

-- Generate suggestions for contracts without promoters
DO $$
DECLARE
    v_contract RECORD;
    v_suggestion RECORD;
BEGIN
    FOR v_contract IN 
        SELECT id FROM contracts WHERE promoter_id IS NULL LIMIT 100
    LOOP
        -- Get suggestions for this contract
        FOR v_suggestion IN 
            SELECT * FROM suggest_promoters_for_contract(v_contract.id, 3)
        LOOP
            -- Insert suggestion
            INSERT INTO promoter_suggestions (
                contract_id,
                suggested_promoter_id,
                confidence_score,
                suggestion_reason
            ) VALUES (
                v_contract.id,
                v_suggestion.promoter_id,
                v_suggestion.confidence_score,
                v_suggestion.reason
            ) ON CONFLICT (contract_id, suggested_promoter_id) DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$;

-- ============================================
-- 11. Create statistics function
-- ============================================

CREATE OR REPLACE FUNCTION get_promoter_assignment_stats()
RETURNS TABLE (
    total_contracts BIGINT,
    contracts_with_promoter BIGINT,
    contracts_without_promoter BIGINT,
    percentage_complete NUMERIC,
    high_priority_missing BIGINT,
    medium_priority_missing BIGINT,
    low_priority_missing BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_contracts,
        COUNT(promoter_id)::BIGINT as contracts_with_promoter,
        (COUNT(*) - COUNT(promoter_id))::BIGINT as contracts_without_promoter,
        ROUND(100.0 * COUNT(promoter_id) / NULLIF(COUNT(*), 0), 2) as percentage_complete,
        COUNT(*) FILTER (WHERE promoter_id IS NULL AND status IN ('active', 'pending'))::BIGINT as high_priority,
        COUNT(*) FILTER (WHERE promoter_id IS NULL AND status = 'draft' AND created_at < NOW() - INTERVAL '7 days')::BIGINT as medium_priority,
        COUNT(*) FILTER (WHERE promoter_id IS NULL AND status = 'draft' AND created_at >= NOW() - INTERVAL '7 days')::BIGINT as low_priority
    FROM contracts;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_promoter_assignment_stats IS 'Returns statistics about promoter assignments across all contracts';

-- ============================================
-- Migration complete!
-- ============================================

-- To make promoter_id required in the future, run:
-- ALTER TABLE contracts ALTER COLUMN promoter_id SET NOT NULL;
-- (Only after fixing all existing contracts)

