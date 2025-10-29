-- Migration: Create Metrics History Table
-- Date: October 29, 2025
-- Purpose: Store historical snapshots of key metrics for trend analysis

-- Create metrics history table
CREATE TABLE IF NOT EXISTS metrics_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metric identification
  metric_type VARCHAR(50) NOT NULL, -- 'promoters', 'contracts', 'compliance', etc.
  metric_name VARCHAR(100) NOT NULL, -- 'total_promoters', 'active_workforce', etc.
  metric_value NUMERIC NOT NULL,
  
  -- Metadata
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  snapshot_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Optional breakdown (JSON for flexibility)
  breakdown JSONB, -- e.g., {"by_status": {"active": 50, "inactive": 10}}
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Indexes for fast lookups
  CONSTRAINT metrics_history_unique_snapshot 
    UNIQUE (metric_type, metric_name, snapshot_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_metrics_history_type_date 
  ON metrics_history(metric_type, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_history_name_date 
  ON metrics_history(metric_name, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_history_date 
  ON metrics_history(snapshot_date DESC);

-- Create a function to insert daily snapshots
CREATE OR REPLACE FUNCTION record_daily_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_promoters INTEGER;
  v_active_promoters INTEGER;
  v_critical_documents INTEGER;
  v_compliance_rate NUMERIC;
  v_total_contracts INTEGER;
  v_active_contracts INTEGER;
BEGIN
  -- Get current metrics
  SELECT COUNT(*) INTO v_total_promoters FROM promoters;
  SELECT COUNT(*) INTO v_active_promoters FROM promoters WHERE status = 'active';
  SELECT COUNT(*) INTO v_total_contracts FROM contracts;
  SELECT COUNT(*) INTO v_active_contracts FROM contracts WHERE status = 'active';
  
  -- Calculate critical documents
  SELECT COUNT(*) INTO v_critical_documents
  FROM promoters
  WHERE id_card_expiry_date < CURRENT_DATE
     OR passport_expiry_date < CURRENT_DATE;
  
  -- Calculate compliance rate
  SELECT CASE 
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND((COUNT(*) FILTER (
      WHERE id_card_expiry_date > CURRENT_DATE 
        AND passport_expiry_date > CURRENT_DATE
    )::NUMERIC / COUNT(*)) * 100, 2)
  END INTO v_compliance_rate
  FROM promoters;
  
  -- Insert metrics (using ON CONFLICT to update if snapshot already exists today)
  INSERT INTO metrics_history (metric_type, metric_name, metric_value, snapshot_date)
  VALUES 
    ('promoters', 'total', v_total_promoters, CURRENT_DATE),
    ('promoters', 'active', v_active_promoters, CURRENT_DATE),
    ('promoters', 'critical_documents', v_critical_documents, CURRENT_DATE),
    ('promoters', 'compliance_rate', v_compliance_rate, CURRENT_DATE),
    ('contracts', 'total', v_total_contracts, CURRENT_DATE),
    ('contracts', 'active', v_active_contracts, CURRENT_DATE)
  ON CONFLICT (metric_type, metric_name, snapshot_date)
  DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    snapshot_time = NOW();
    
  RAISE NOTICE 'Daily metrics recorded successfully';
END;
$$;

-- Create a function to get metric trend (compare with previous period)
CREATE OR REPLACE FUNCTION get_metric_trend(
  p_metric_type VARCHAR,
  p_metric_name VARCHAR,
  p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  current_value NUMERIC,
  previous_value NUMERIC,
  change_value NUMERIC,
  change_percent NUMERIC,
  trend VARCHAR -- 'up', 'down', 'stable'
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current NUMERIC;
  v_previous NUMERIC;
  v_change NUMERIC;
  v_change_pct NUMERIC;
  v_trend VARCHAR;
BEGIN
  -- Get current value (most recent)
  SELECT metric_value INTO v_current
  FROM metrics_history
  WHERE metric_type = p_metric_type
    AND metric_name = p_metric_name
  ORDER BY snapshot_date DESC
  LIMIT 1;
  
  -- Get previous value (N days ago)
  SELECT metric_value INTO v_previous
  FROM metrics_history
  WHERE metric_type = p_metric_type
    AND metric_name = p_metric_name
    AND snapshot_date <= CURRENT_DATE - p_days_back
  ORDER BY snapshot_date DESC
  LIMIT 1;
  
  -- Calculate change
  IF v_current IS NOT NULL AND v_previous IS NOT NULL THEN
    v_change := v_current - v_previous;
    
    -- Calculate percentage change (handle division by zero)
    IF v_previous = 0 THEN
      v_change_pct := CASE WHEN v_current > 0 THEN 100 ELSE 0 END;
    ELSE
      v_change_pct := ROUND((v_change / v_previous) * 100, 2);
    END IF;
    
    -- Determine trend
    IF ABS(v_change_pct) < 1 THEN
      v_trend := 'stable';
    ELSIF v_change > 0 THEN
      v_trend := 'up';
    ELSE
      v_trend := 'down';
    END IF;
  ELSE
    -- Not enough data
    v_change := 0;
    v_change_pct := 0;
    v_trend := 'unknown';
  END IF;
  
  RETURN QUERY SELECT v_current, v_previous, v_change, v_change_pct, v_trend;
END;
$$;

-- Add RLS policies
ALTER TABLE metrics_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read metrics history
CREATE POLICY "Allow authenticated users to read metrics history"
  ON metrics_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to insert metrics
CREATE POLICY "Allow service role to insert metrics"
  ON metrics_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON TABLE metrics_history IS 'Historical snapshots of key system metrics for trend analysis';
COMMENT ON COLUMN metrics_history.metric_type IS 'Category of metric: promoters, contracts, compliance, etc.';
COMMENT ON COLUMN metrics_history.metric_name IS 'Specific metric name: total, active, compliance_rate, etc.';
COMMENT ON COLUMN metrics_history.metric_value IS 'Numeric value of the metric at snapshot time';
COMMENT ON COLUMN metrics_history.breakdown IS 'Optional JSON breakdown of the metric for detailed analysis';
COMMENT ON FUNCTION record_daily_metrics() IS 'Records daily snapshots of all key metrics';
COMMENT ON FUNCTION get_metric_trend(VARCHAR, VARCHAR, INTEGER) IS 'Calculates trend for a specific metric comparing current vs N days ago';

