-- Migration: Add Contract PDF Generation Fields
-- Date: 2025-10-26
-- Purpose: Add fields to track PDF generation status and URLs

-- ================================================================
-- PART 1: ADD PDF TRACKING FIELDS TO CONTRACTS
-- ================================================================

-- Add PDF URL field
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add Google Drive URL field
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS google_drive_url TEXT;

-- Add PDF generation timestamp
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;

-- Add PDF status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pdf_status_enum') THEN
    CREATE TYPE pdf_status_enum AS ENUM ('pending', 'generating', 'generated', 'error');
  END IF;
END $$;

-- Add PDF status field
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS pdf_status pdf_status_enum;

-- Add PDF error message field
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS pdf_error_message TEXT;

-- ================================================================
-- PART 2: CREATE INDEXES
-- ================================================================

-- Index for filtering by PDF status
CREATE INDEX IF NOT EXISTS idx_contracts_pdf_status 
ON contracts(pdf_status) 
WHERE pdf_status IS NOT NULL;

-- Index for sorting by generation date
CREATE INDEX IF NOT EXISTS idx_contracts_pdf_generated_at 
ON contracts(pdf_generated_at DESC) 
WHERE pdf_generated_at IS NOT NULL;

-- Composite index for status and date queries
CREATE INDEX IF NOT EXISTS idx_contracts_pdf_status_date 
ON contracts(pdf_status, pdf_generated_at DESC) 
WHERE pdf_status IS NOT NULL;

-- ================================================================
-- PART 3: ADD COMMENTS
-- ================================================================

COMMENT ON COLUMN contracts.pdf_url IS 'Public URL to the generated PDF in Supabase Storage';
COMMENT ON COLUMN contracts.google_drive_url IS 'Google Drive URL for editing the source document';
COMMENT ON COLUMN contracts.pdf_generated_at IS 'Timestamp when PDF was last generated';
COMMENT ON COLUMN contracts.pdf_status IS 'PDF generation status: pending, generating, generated, or error';
COMMENT ON COLUMN contracts.pdf_error_message IS 'Error message if PDF generation failed';

-- ================================================================
-- PART 4: CREATE WEBHOOK LOGS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  status TEXT,
  make_request_id TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for webhook logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_contract_id 
ON webhook_logs(contract_id);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type 
ON webhook_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_received_at 
ON webhook_logs(received_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_make_request_id 
ON webhook_logs(make_request_id) 
WHERE make_request_id IS NOT NULL;

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook logs
CREATE POLICY "Admins can view webhook logs" 
ON webhook_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN roles r ON ura.role_id = r.id
    WHERE ura.user_id = auth.uid()
    AND r.name = 'admin'
    AND ura.is_active = TRUE
  )
);

COMMENT ON TABLE webhook_logs IS 'Audit trail for webhook events from Make.com and other integrations';

-- ================================================================
-- PART 5: CREATE HELPER FUNCTIONS
-- ================================================================

-- Function to get contracts pending PDF generation
CREATE OR REPLACE FUNCTION get_contracts_pending_pdf()
RETURNS TABLE (
  contract_id UUID,
  contract_number TEXT,
  created_at TIMESTAMPTZ,
  days_since_creation INTEGER
)
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.contract_number,
    c.created_at,
    EXTRACT(EPOCH FROM (NOW() - c.created_at))::INTEGER / 86400 as days_since_creation
  FROM contracts c
  WHERE c.pdf_status IS NULL 
    OR c.pdf_status = 'pending'
  AND c.status IN ('approved', 'active')
  ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get PDF generation statistics
CREATE OR REPLACE FUNCTION get_pdf_generation_stats()
RETURNS TABLE (
  total_contracts BIGINT,
  with_pdf BIGINT,
  without_pdf BIGINT,
  generating BIGINT,
  errors BIGINT,
  success_rate NUMERIC
)
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_contracts,
    COUNT(*) FILTER (WHERE pdf_status = 'generated')::BIGINT as with_pdf,
    COUNT(*) FILTER (WHERE pdf_status IS NULL OR pdf_status = 'pending')::BIGINT as without_pdf,
    COUNT(*) FILTER (WHERE pdf_status = 'generating')::BIGINT as generating,
    COUNT(*) FILTER (WHERE pdf_status = 'error')::BIGINT as errors,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE pdf_status = 'generated') / 
      NULLIF(COUNT(*) FILTER (WHERE pdf_status IS NOT NULL), 0),
      2
    ) as success_rate
  FROM contracts
  WHERE status IN ('approved', 'active', 'completed');
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 6: CREATE VIEW FOR CONTRACTS WITH PDF STATUS
-- ================================================================

CREATE OR REPLACE VIEW contracts_with_pdf_status
WITH (security_invoker = true) AS
SELECT 
  c.id,
  c.contract_number,
  c.status as contract_status,
  c.pdf_url,
  c.google_drive_url,
  c.pdf_status,
  c.pdf_generated_at,
  c.pdf_error_message,
  c.created_at,
  CASE 
    WHEN c.pdf_status = 'generated' THEN '✅ Ready'
    WHEN c.pdf_status = 'generating' THEN '⏳ Generating'
    WHEN c.pdf_status = 'error' THEN '❌ Error'
    WHEN c.pdf_status = 'pending' THEN '⏸️ Pending'
    ELSE '⚠️ Not Generated'
  END as pdf_status_display,
  CASE 
    WHEN c.pdf_status = 'generated' AND c.pdf_generated_at IS NOT NULL THEN
      EXTRACT(EPOCH FROM (NOW() - c.pdf_generated_at))::INTEGER / 86400
    ELSE NULL
  END as days_since_generated,
  p.name_en as promoter_name,
  fp.name_en as first_party_name,
  sp.name_en as second_party_name
FROM contracts c
LEFT JOIN promoters p ON c.promoter_id = p.id
LEFT JOIN parties fp ON c.first_party_id = fp.id
LEFT JOIN parties sp ON c.second_party_id = sp.id
WHERE c.status IN ('approved', 'active', 'completed');

COMMENT ON VIEW contracts_with_pdf_status IS 'Contracts with their PDF generation status and related information';

-- Grant permissions
GRANT SELECT ON contracts_with_pdf_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_contracts_pending_pdf() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pdf_generation_stats() TO authenticated;

-- ================================================================
-- VERIFICATION
-- ================================================================

DO $$
DECLARE
  contract_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO contract_count FROM contracts;
  
  RAISE NOTICE '✅ PDF tracking fields added to contracts table';
  RAISE NOTICE '✅ Webhook logs table created';
  RAISE NOTICE '✅ Helper functions created';
  RAISE NOTICE '✅ View created for PDF status monitoring';
  RAISE NOTICE '';
  RAISE NOTICE 'Total contracts in database: %', contract_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Set environment variables: MAKE_CONTRACT_PDF_WEBHOOK_URL, PDF_WEBHOOK_SECRET';
  RAISE NOTICE '2. Deploy API routes: /api/contracts/[id]/generate-pdf';
  RAISE NOTICE '3. Deploy webhook handler: /api/webhook/contract-pdf-ready';
  RAISE NOTICE '4. Test PDF generation with a sample contract';
END $$;

