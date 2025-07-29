-- Migration: Create materialized view for promoter analytics
-- Date: 2025-07-29
-- Description: Add materialized view for promoter analytics to improve query performance

-- Create materialized view for promoter analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS promoter_analytics_summary AS
SELECT 
    p.id,
    p.name_en,
    p.name_ar,
    p.status,
    p.created_at,
    p.id_card_expiry_date,
    p.passport_expiry_date,
    p.work_location,
    p.job_title,
    -- Contract statistics
    COALESCE(contract_stats.active_contracts, 0) as active_contracts_count,
    COALESCE(contract_stats.total_contracts, 0) as total_contracts_count,
    COALESCE(contract_stats.total_contract_value, 0) as total_contract_value,
    -- Document status
    CASE 
        WHEN p.id_card_expiry_date IS NULL THEN 'missing'
        WHEN p.id_card_expiry_date < CURRENT_DATE THEN 'expired'
        WHEN p.id_card_expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring'
        ELSE 'valid'
    END as id_card_status,
    CASE 
        WHEN p.passport_expiry_date IS NULL THEN 'missing'
        WHEN p.passport_expiry_date < CURRENT_DATE THEN 'expired'
        WHEN p.passport_expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring'
        ELSE 'valid'
    END as passport_status,
    -- Overall status
    CASE 
        WHEN p.status = 'inactive' THEN 'inactive'
        WHEN p.id_card_expiry_date < CURRENT_DATE OR p.passport_expiry_date < CURRENT_DATE THEN 'critical'
        WHEN p.id_card_expiry_date <= CURRENT_DATE + INTERVAL '30 days' OR p.passport_expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
        ELSE 'active'
    END as overall_status,
    -- Days until expiry
    CASE 
        WHEN p.id_card_expiry_date IS NOT NULL THEN 
            EXTRACT(DAY FROM (p.id_card_expiry_date - CURRENT_DATE))
        ELSE NULL
    END as days_until_id_expiry,
    CASE 
        WHEN p.passport_expiry_date IS NOT NULL THEN 
            EXTRACT(DAY FROM (p.passport_expiry_date - CURRENT_DATE))
        ELSE NULL
    END as days_until_passport_expiry,
    -- Last activity
    COALESCE(contract_stats.last_contract_date, p.created_at) as last_activity_date,
    -- Performance metrics
    COALESCE(performance_metrics.avg_contract_duration, 0) as avg_contract_duration_days,
    COALESCE(performance_metrics.contract_completion_rate, 0) as contract_completion_rate,
    COALESCE(performance_metrics.total_earnings, 0) as total_earnings
FROM promoters p
LEFT JOIN (
    SELECT 
        promoter_id,
        COUNT(*) FILTER (WHERE status = 'active') as active_contracts,
        COUNT(*) as total_contracts,
        SUM(contract_value) as total_contract_value,
        MAX(created_at) as last_contract_date
    FROM contracts 
    GROUP BY promoter_id
) contract_stats ON p.id = contract_stats.promoter_id
LEFT JOIN (
    SELECT 
        promoter_id,
        AVG(EXTRACT(DAY FROM (contract_end_date - contract_start_date))) as avg_contract_duration,
        (COUNT(*) FILTER (WHERE status = 'completed'))::DECIMAL / NULLIF(COUNT(*), 0) * 100 as contract_completion_rate,
        SUM(contract_value) as total_earnings
    FROM contracts 
    WHERE status IN ('active', 'completed', 'terminated')
    GROUP BY promoter_id
) performance_metrics ON p.id = performance_metrics.promoter_id;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promoter_analytics_status ON promoter_analytics_summary(status);
CREATE INDEX IF NOT EXISTS idx_promoter_analytics_overall_status ON promoter_analytics_summary(overall_status);
CREATE INDEX IF NOT EXISTS idx_promoter_analytics_created_at ON promoter_analytics_summary(created_at);
CREATE INDEX IF NOT EXISTS idx_promoter_analytics_id_expiry ON promoter_analytics_summary(id_card_expiry_date);
CREATE INDEX IF NOT EXISTS idx_promoter_analytics_passport_expiry ON promoter_analytics_summary(passport_expiry_date);
CREATE INDEX IF NOT EXISTS idx_promoter_analytics_work_location ON promoter_analytics_summary(work_location);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_promoter_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY promoter_analytics_summary;
END;
$$ LANGUAGE plpgsql;

-- Create function to get promoter analytics with pagination
CREATE OR REPLACE FUNCTION get_promoter_analytics_paginated(
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 25,
    p_search TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_overall_status TEXT DEFAULT NULL,
    p_work_location TEXT DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'name_en',
    p_sort_order TEXT DEFAULT 'asc'
)
RETURNS TABLE (
    data JSONB,
    total_count BIGINT,
    page INTEGER,
    limit INTEGER,
    total_pages INTEGER
) AS $$
DECLARE
    v_offset INTEGER;
    v_total_count BIGINT;
    v_total_pages INTEGER;
    v_query TEXT;
    v_where_conditions TEXT := '';
    v_order_clause TEXT;
BEGIN
    -- Calculate offset
    v_offset := (p_page - 1) * p_limit;
    
    -- Build WHERE conditions
    IF p_search IS NOT NULL AND p_search != '' THEN
        v_where_conditions := v_where_conditions || ' AND (name_en ILIKE ''%' || p_search || '%'' OR name_ar ILIKE ''%' || p_search || '%'')';
    END IF;
    
    IF p_status IS NOT NULL AND p_status != 'all' THEN
        v_where_conditions := v_where_conditions || ' AND status = ''' || p_status || '''';
    END IF;
    
    IF p_overall_status IS NOT NULL AND p_overall_status != 'all' THEN
        v_where_conditions := v_where_conditions || ' AND overall_status = ''' || p_overall_status || '''';
    END IF;
    
    IF p_work_location IS NOT NULL AND p_work_location != 'all' THEN
        v_where_conditions := v_where_conditions || ' AND work_location = ''' || p_work_location || '''';
    END IF;
    
    -- Build ORDER BY clause
    CASE p_sort_by
        WHEN 'name_en' THEN v_order_clause := 'name_en ' || p_sort_order;
        WHEN 'status' THEN v_order_clause := 'status ' || p_sort_order;
        WHEN 'overall_status' THEN v_order_clause := 'overall_status ' || p_sort_order;
        WHEN 'active_contracts_count' THEN v_order_clause := 'active_contracts_count ' || p_sort_order;
        WHEN 'created_at' THEN v_order_clause := 'created_at ' || p_sort_order;
        WHEN 'id_card_expiry_date' THEN v_order_clause := 'id_card_expiry_date ' || p_sort_order;
        WHEN 'passport_expiry_date' THEN v_order_clause := 'passport_expiry_date ' || p_sort_order;
        ELSE v_order_clause := 'name_en ' || p_sort_order;
    END CASE;
    
    -- Get total count
    EXECUTE 'SELECT COUNT(*) FROM promoter_analytics_summary WHERE 1=1' || v_where_conditions INTO v_total_count;
    
    -- Calculate total pages
    v_total_pages := CEIL(v_total_count::DECIMAL / p_limit);
    
    -- Build and execute the main query
    v_query := 'SELECT 
        jsonb_agg(
            jsonb_build_object(
                ''id'', id,
                ''name_en'', name_en,
                ''name_ar'', name_ar,
                ''status'', status,
                ''overall_status'', overall_status,
                ''active_contracts_count'', active_contracts_count,
                ''total_contracts_count'', total_contracts_count,
                ''id_card_status'', id_card_status,
                ''passport_status'', passport_status,
                ''days_until_id_expiry'', days_until_id_expiry,
                ''days_until_passport_expiry'', days_until_passport_expiry,
                ''work_location'', work_location,
                ''job_title'', job_title,
                ''created_at'', created_at,
                ''last_activity_date'', last_activity_date,
                ''avg_contract_duration_days'', avg_contract_duration_days,
                ''contract_completion_rate'', contract_completion_rate,
                ''total_earnings'', total_earnings
            )
        ) as data,
        ' || v_total_count || ' as total_count,
        ' || p_page || ' as page,
        ' || p_limit || ' as limit,
        ' || v_total_pages || ' as total_pages
    FROM (
        SELECT * FROM promoter_analytics_summary 
        WHERE 1=1' || v_where_conditions || '
        ORDER BY ' || v_order_clause || '
        LIMIT ' || p_limit || ' OFFSET ' || v_offset || '
    ) subquery';
    
    RETURN QUERY EXECUTE v_query;
END;
$$ LANGUAGE plpgsql;

-- Create function to get promoter performance statistics
CREATE OR REPLACE FUNCTION get_promoter_performance_stats()
RETURNS TABLE (
    total_promoters BIGINT,
    active_promoters BIGINT,
    inactive_promoters BIGINT,
    critical_status_count BIGINT,
    warning_status_count BIGINT,
    total_contracts BIGINT,
    total_contract_value DECIMAL,
    avg_contract_duration DECIMAL,
    avg_completion_rate DECIMAL,
    expiring_documents_count BIGINT,
    expired_documents_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_promoters,
        COUNT(*) FILTER (WHERE overall_status = 'active') as active_promoters,
        COUNT(*) FILTER (WHERE overall_status = 'inactive') as inactive_promoters,
        COUNT(*) FILTER (WHERE overall_status = 'critical') as critical_status_count,
        COUNT(*) FILTER (WHERE overall_status = 'warning') as warning_status_count,
        SUM(active_contracts_count) as total_contracts,
        SUM(total_contract_value) as total_contract_value,
        AVG(avg_contract_duration_days) as avg_contract_duration,
        AVG(contract_completion_rate) as avg_completion_rate,
        COUNT(*) FILTER (WHERE id_card_status = 'expiring' OR passport_status = 'expiring') as expiring_documents_count,
        COUNT(*) FILTER (WHERE id_card_status = 'expired' OR passport_status = 'expired') as expired_documents_count
    FROM promoter_analytics_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic refresh of materialized view (every hour)
SELECT cron.schedule(
    'refresh-promoter-analytics',
    '0 * * * *', -- Every hour
    'SELECT refresh_promoter_analytics();'
);

-- Add comments for documentation
COMMENT ON MATERIALIZED VIEW promoter_analytics_summary IS 'Materialized view for promoter analytics with performance metrics';
COMMENT ON FUNCTION refresh_promoter_analytics() IS 'Function to refresh the promoter analytics materialized view';
COMMENT ON FUNCTION get_promoter_analytics_paginated() IS 'Function to get paginated promoter analytics with filtering and sorting';
COMMENT ON FUNCTION get_promoter_performance_stats() IS 'Function to get overall promoter performance statistics';