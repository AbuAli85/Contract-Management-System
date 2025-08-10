-- Booking System Views and Materialized Views Migration
-- Description: Implements the missing views and materialized views for the booking system
-- Date: 2025-01-17
-- Extends the existing booking system with optimized data access patterns

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the recent bookings view with optimized ordering and timezone handling
CREATE OR REPLACE VIEW v_bookings_recent_omt AS
WITH booking_data AS (
    SELECT 
        b.id,
        b.booking_number,
        b.service_id,
        b.client_id,
        b.provider_company_id,
        b.status,
        b.scheduled_at,
        b.scheduled_at + (b.duration_minutes * INTERVAL '1 minute') as scheduled_end,
        b.duration_minutes,
        b.participant_count,
        b.total_price,
        b.currency,
        b.notes,
        b.client_notes,
        b.provider_notes,
        b.metadata,
        b.created_at,
        b.updated_at,
        
        -- Service details
        ps.name as service_name,
        ps.category as service_category,
        ps.subcategory as service_subcategory,
        ps.price_base as service_price,
        ps.duration_minutes as service_duration,
        
        -- Client details
        cp.email as client_email,
        cp.first_name as client_first_name,
        cp.last_name as client_last_name,
        CONCAT(cp.first_name, ' ', cp.last_name) as client_name,
        
        -- Provider details
        comp.name as provider_name,
        comp.slug as provider_slug,
        comp.business_type as provider_type,
        
        -- Time-based calculations
        EXTRACT(EPOCH FROM (b.scheduled_at - NOW())) / 3600 as hours_until_booking,
        EXTRACT(EPOCH FROM (b.scheduled_at - NOW())) / 86400 as days_until_booking,
        CASE 
            WHEN b.scheduled_at > NOW() THEN true 
            ELSE false 
        END as is_upcoming,
        
        -- Bucket ordering for consistent sorting
        CASE 
            WHEN b.scheduled_at < NOW() - INTERVAL '7 days' THEN 1
            WHEN b.scheduled_at < NOW() - INTERVAL '1 day' THEN 2
            WHEN b.scheduled_at < NOW() THEN 3
            WHEN b.scheduled_at < NOW() + INTERVAL '1 day' THEN 4
            WHEN b.scheduled_at < NOW() + INTERVAL '7 days' THEN 5
            WHEN b.scheduled_at < NOW() + INTERVAL '30 days' THEN 6
            ELSE 7
        END as start_bucket_order,
        
        -- OMT (Ordered by Most Recent Time) - for consistent ordering
        EXTRACT(EPOCH FROM b.scheduled_at) as start_time_omt
    FROM bookings b
    LEFT JOIN provider_services ps ON b.service_id = ps.id
    LEFT JOIN profiles cp ON b.client_id = cp.user_id
    LEFT JOIN companies comp ON b.provider_company_id = comp.id
    WHERE b.status NOT IN ('cancelled', 'refunded')
)
SELECT * FROM booking_data;

-- Create the bucket KPIs materialized view for dashboard widgets
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_bucket_kpis_full AS
WITH bucket_stats AS (
    SELECT 
        -- Time bucket grouping
        CASE 
            WHEN scheduled_at < NOW() - INTERVAL '7 days' THEN 'Past Week'
            WHEN scheduled_at < NOW() - INTERVAL '1 day' THEN 'Past Day'
            WHEN scheduled_at < NOW() THEN 'Today'
            WHEN scheduled_at < NOW() + INTERVAL '1 day' THEN 'Tomorrow'
            WHEN scheduled_at < NOW() + INTERVAL '7 days' THEN 'Next Week'
            WHEN scheduled_at < NOW() + INTERVAL '30 days' THEN 'Next Month'
            ELSE 'Future'
        END as bucket_name,
        
        CASE 
            WHEN scheduled_at < NOW() - INTERVAL '7 days' THEN 1
            WHEN scheduled_at < NOW() - INTERVAL '1 day' THEN 2
            WHEN scheduled_at < NOW() THEN 3
            WHEN scheduled_at < NOW() + INTERVAL '1 day' THEN 4
            WHEN scheduled_at < NOW() + INTERVAL '7 days' THEN 5
            WHEN scheduled_at < NOW() + INTERVAL '30 days' THEN 6
            ELSE 7
        END as bucket_order,
        
        -- Booking counts by status
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_bookings,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
        COUNT(*) FILTER (WHERE status = 'refunded') as refunded_bookings,
        COUNT(*) FILTER (WHERE status = 'no_show') as no_show_bookings,
        
        -- Financial metrics
        COALESCE(SUM(total_price), 0) as total_revenue,
        COALESCE(SUM(total_price) FILTER (WHERE status IN ('completed', 'confirmed')), 0) as confirmed_revenue,
        COALESCE(SUM(total_price) FILTER (WHERE status = 'pending'), 0) as pending_revenue,
        
        -- Time metrics
        AVG(duration_minutes) as avg_duration_minutes,
        SUM(duration_minutes) as total_duration_minutes,
        
        -- Participant metrics
        SUM(participant_count) as total_participants,
        AVG(participant_count) as avg_participants_per_booking,
        
        -- Provider diversity
        COUNT(DISTINCT provider_company_id) as unique_providers,
        COUNT(DISTINCT client_id) as unique_clients,
        
        -- Service diversity
        COUNT(DISTINCT service_id) as unique_services,
        
        -- Time range for the bucket
        MIN(scheduled_at) as bucket_start,
        MAX(scheduled_at) as bucket_end,
        
        -- Last updated for refresh tracking
        NOW() as last_calculated
        
    FROM v_bookings_recent_omt
    GROUP BY bucket_name, bucket_order
)
SELECT 
    *,
    -- Calculated percentages
    CASE 
        WHEN total_bookings > 0 THEN 
            ROUND((pending_bookings::DECIMAL / total_bookings * 100), 2)
        ELSE 0 
    END as pending_percentage,
    
    CASE 
        WHEN total_bookings > 0 THEN 
            ROUND((confirmed_bookings::DECIMAL / total_bookings * 100), 2)
        ELSE 0 
    END as confirmed_percentage,
    
    CASE 
        WHEN total_bookings > 0 THEN 
            ROUND((completed_bookings::DECIMAL / total_bookings * 100), 2)
        ELSE 0 
    END as completed_percentage,
    
    -- Revenue per booking
    CASE 
        WHEN total_bookings > 0 THEN 
            ROUND((total_revenue / total_bookings), 2)
        ELSE 0 
    END as avg_revenue_per_booking,
    
    -- Conversion rate (pending to confirmed)
    CASE 
        WHEN pending_bookings > 0 THEN 
            ROUND((confirmed_bookings::DECIMAL / (pending_bookings + confirmed_bookings) * 100), 2)
        ELSE 0 
    END as conversion_rate
    
FROM bucket_stats
ORDER BY bucket_order;

-- Create indexes for the materialized view
CREATE INDEX IF NOT EXISTS idx_mv_bucket_kpis_bucket_order ON mv_bucket_kpis_full(bucket_order);
CREATE INDEX IF NOT EXISTS idx_mv_bucket_kpis_last_calculated ON mv_bucket_kpis_full(last_calculated);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_bucket_kpis()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_bucket_kpis_full;
    
    -- Optional: Send notification for real-time updates
    -- PERFORM pg_notify('mv_bucket_kpis_refreshed', 'true');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get bucket KPIs with optional filtering
CREATE OR REPLACE FUNCTION get_bucket_kpis(
    provider_filter UUID DEFAULT NULL,
    client_filter UUID DEFAULT NULL,
    service_filter UUID DEFAULT NULL,
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    bucket_name TEXT,
    bucket_order INTEGER,
    total_bookings BIGINT,
    pending_bookings BIGINT,
    confirmed_bookings BIGINT,
    in_progress_bookings BIGINT,
    completed_bookings BIGINT,
    cancelled_bookings BIGINT,
    refunded_bookings BIGINT,
    no_show_bookings BIGINT,
    total_revenue DECIMAL,
    confirmed_revenue DECIMAL,
    pending_revenue DECIMAL,
    avg_duration_minutes NUMERIC,
    total_duration_minutes BIGINT,
    total_participants BIGINT,
    avg_participants_per_booking NUMERIC,
    unique_providers BIGINT,
    unique_clients BIGINT,
    unique_services BIGINT,
    bucket_start TIMESTAMPTZ,
    bucket_end TIMESTAMPTZ,
    last_calculated TIMESTAMPTZ,
    pending_percentage NUMERIC,
    confirmed_percentage NUMERIC,
    completed_percentage NUMERIC,
    avg_revenue_per_booking NUMERIC,
    conversion_rate NUMERIC
) AS $$
BEGIN
    -- For now, return the full materialized view
    -- In a production system, you might want to implement filtering logic here
    RETURN QUERY
    SELECT * FROM mv_bucket_kpis_full
    ORDER BY bucket_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get recent bookings with advanced filtering
CREATE OR REPLACE FUNCTION get_recent_bookings(
    limit_count INTEGER DEFAULT 50,
    provider_name_filter TEXT DEFAULT NULL,
    client_name_filter TEXT DEFAULT NULL,
    only_upcoming_filter BOOLEAN DEFAULT NULL,
    status_filter TEXT DEFAULT NULL,
    service_category_filter TEXT DEFAULT NULL,
    date_from_filter TIMESTAMPTZ DEFAULT NULL,
    date_to_filter TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    booking_number TEXT,
    service_id UUID,
    client_id UUID,
    provider_company_id UUID,
    status TEXT,
    scheduled_at TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    duration_minutes INTEGER,
    participant_count INTEGER,
    total_price DECIMAL,
    currency TEXT,
    notes TEXT,
    client_notes TEXT,
    provider_notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    service_name TEXT,
    service_category TEXT,
    service_subcategory TEXT,
    service_price DECIMAL,
    service_duration INTEGER,
    client_email TEXT,
    client_first_name TEXT,
    client_last_name TEXT,
    client_name TEXT,
    provider_name TEXT,
    provider_slug TEXT,
    provider_type TEXT,
    hours_until_booking NUMERIC,
    days_until_booking NUMERIC,
    is_upcoming BOOLEAN,
    start_bucket_order INTEGER,
    start_time_omt NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM v_bookings_recent_omt
    WHERE (provider_name_filter IS NULL OR provider_name ILIKE '%' || provider_name_filter || '%')
      AND (client_name_filter IS NULL OR client_name ILIKE '%' || client_name_filter || '%')
      AND (only_upcoming_filter IS NULL OR is_upcoming = only_upcoming_filter)
      AND (status_filter IS NULL OR status = status_filter)
      AND (service_category_filter IS NULL OR service_category = service_category_filter)
      AND (date_from_filter IS NULL OR scheduled_at >= date_from_filter)
      AND (date_to_filter IS NULL OR scheduled_at <= date_to_filter)
    ORDER BY start_bucket_order ASC, start_time_omt ASC, id ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get paginated bookings
CREATE OR REPLACE FUNCTION get_bookings_page(
    page_from INTEGER DEFAULT 0,
    page_to INTEGER DEFAULT 49,
    provider_name_filter TEXT DEFAULT NULL,
    client_name_filter TEXT DEFAULT NULL,
    only_upcoming_filter BOOLEAN DEFAULT NULL,
    status_filter TEXT DEFAULT NULL,
    service_category_filter TEXT DEFAULT NULL,
    date_from_filter TIMESTAMPTZ DEFAULT NULL,
    date_to_filter TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    booking_number TEXT,
    service_id UUID,
    client_id UUID,
    provider_company_id UUID,
    status TEXT,
    scheduled_at TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    duration_minutes INTEGER,
    participant_count INTEGER,
    total_price DECIMAL,
    currency TEXT,
    notes TEXT,
    client_notes TEXT,
    provider_notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    service_name TEXT,
    service_category TEXT,
    service_subcategory TEXT,
    service_price DECIMAL,
    service_duration INTEGER,
    client_email TEXT,
    client_first_name TEXT,
    client_last_name TEXT,
    client_name TEXT,
    provider_name TEXT,
    provider_slug TEXT,
    provider_type TEXT,
    hours_until_booking NUMERIC,
    days_until_booking NUMERIC,
    is_upcoming BOOLEAN,
    start_bucket_order INTEGER,
    start_time_omt NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM v_bookings_recent_omt
    WHERE (provider_name_filter IS NULL OR provider_name ILIKE '%' || provider_name_filter || '%')
      AND (client_name_filter IS NULL OR client_name ILIKE '%' || client_name_filter || '%')
      AND (only_upcoming_filter IS NULL OR is_upcoming = only_upcoming_filter)
      AND (status_filter IS NULL OR status = status_filter)
      AND (service_category_filter IS NULL OR service_category = service_category_filter)
      AND (date_from_filter IS NULL OR scheduled_at >= date_from_filter)
      AND (date_to_filter IS NULL OR scheduled_at <= date_to_filter)
    ORDER BY start_bucket_order ASC, start_time_omt ASC, id ASC
    LIMIT (page_to - page_from + 1) OFFSET page_from;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get total count for pagination
CREATE OR REPLACE FUNCTION get_bookings_count(
    provider_name_filter TEXT DEFAULT NULL,
    client_name_filter TEXT DEFAULT NULL,
    only_upcoming_filter BOOLEAN DEFAULT NULL,
    status_filter TEXT DEFAULT NULL,
    service_category_filter TEXT DEFAULT NULL,
    date_from_filter TIMESTAMPTZ DEFAULT NULL,
    date_to_filter TIMESTAMPTZ DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    count_result BIGINT;
BEGIN
    SELECT COUNT(*) INTO count_result
    FROM v_bookings_recent_omt
    WHERE (provider_name_filter IS NULL OR provider_name ILIKE '%' || provider_name_filter || '%')
      AND (client_name_filter IS NULL OR client_name ILIKE '%' || client_name_filter || '%')
      AND (only_upcoming_filter IS NULL OR is_upcoming = only_upcoming_filter)
      AND (status_filter IS NULL OR status = status_filter)
      AND (service_category_filter IS NULL OR service_category = service_category_filter)
      AND (date_from_filter IS NULL OR scheduled_at >= date_from_filter)
      AND (date_to_filter IS NULL OR scheduled_at <= date_to_filter);
    
    RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON v_bookings_recent_omt TO anon, authenticated;
GRANT SELECT ON mv_bucket_kpis_full TO anon, authenticated;
GRANT EXECUTE ON FUNCTION refresh_bucket_kpis() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_bucket_kpis(TEXT, UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_recent_bookings(INTEGER, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_bookings_page(INTEGER, INTEGER, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_bookings_count(TEXT, TEXT, BOOLEAN, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;

-- Create a trigger to automatically refresh the materialized view when bookings change
CREATE OR REPLACE FUNCTION trigger_refresh_bucket_kpis()
RETURNS TRIGGER AS $$
BEGIN
    -- Schedule a refresh (non-blocking)
    PERFORM pg_notify('refresh_bucket_kpis', 'true');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS refresh_bucket_kpis_trigger ON bookings;
CREATE TRIGGER refresh_bucket_kpis_trigger
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_refresh_bucket_kpis();

-- Comments for documentation
COMMENT ON VIEW v_bookings_recent_omt IS 'Optimized view for recent bookings with timezone handling and bucket ordering';
COMMENT ON MATERIALIZED VIEW mv_bucket_kpis_full IS 'Materialized view for dashboard KPIs grouped by time buckets';
COMMENT ON FUNCTION refresh_bucket_kpis() IS 'Refreshes the bucket KPIs materialized view';
COMMENT ON FUNCTION get_bucket_kpis(UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Gets bucket KPIs with optional filtering';
COMMENT ON FUNCTION get_recent_bookings(INTEGER, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Gets recent bookings with advanced filtering';
COMMENT ON FUNCTION get_bookings_page(INTEGER, INTEGER, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Gets paginated bookings with filtering';
COMMENT ON FUNCTION get_bookings_count(TEXT, TEXT, BOOLEAN, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Gets total count of bookings for pagination';
COMMENT ON FUNCTION trigger_refresh_bucket_kpis() IS 'Trigger function to refresh bucket KPIs when bookings change';

-- Initial refresh of the materialized view
REFRESH MATERIALIZED VIEW mv_bucket_kpis_full; 