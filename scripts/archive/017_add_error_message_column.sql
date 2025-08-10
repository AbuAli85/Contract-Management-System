-- Add error_message column to contracts table
-- This column is needed for storing error messages during contract generation

DO $$
BEGIN
  -- Add error_message column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='error_message') THEN
    ALTER TABLE contracts ADD COLUMN error_message TEXT;
    
    -- Add index for performance
    CREATE INDEX IF NOT EXISTS idx_contracts_error_message ON contracts(error_message);
    
    -- Add comment for documentation
    COMMENT ON COLUMN contracts.error_message IS 'Error message from contract generation process';
    
    RAISE NOTICE 'Added error_message column to contracts table';
  ELSE
    RAISE NOTICE 'error_message column already exists in contracts table';
  END IF;
END $$;

-- Also add any other missing columns that might be needed
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS google_drive_url TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS makecom_webhook_response TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS generation_attempts INTEGER DEFAULT 0;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS last_generation_attempt TIMESTAMPTZ;

-- Add comments for new columns
COMMENT ON COLUMN contracts.google_drive_url IS 'URL to the contract PDF stored in Google Drive';
COMMENT ON COLUMN contracts.makecom_webhook_response IS 'Response from Make.com webhook during contract generation';
COMMENT ON COLUMN contracts.generation_attempts IS 'Number of times contract generation has been attempted';
COMMENT ON COLUMN contracts.last_generation_attempt IS 'Timestamp of the last generation attempt';

-- Update the status constraint to include 'failed' status
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
  
  -- Add new constraint with 'failed' status included
  ALTER TABLE contracts ADD CONSTRAINT contracts_status_check 
    CHECK (status IN ('draft', 'pending', 'processing', 'active', 'expired', 'generated', 'soon-to-expire', 'approved', 'rejected', 'failed'));
    
  RAISE NOTICE 'Updated contracts status constraint to include failed status';
END $$; 