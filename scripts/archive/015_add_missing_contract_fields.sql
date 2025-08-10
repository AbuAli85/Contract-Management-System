-- Add missing contract fields for enhanced contract generation
-- This script adds fields that the contract generation service expects

BEGIN;

-- Add basic_salary field
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS basic_salary NUMERIC(12,2);

-- Add allowances field
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS allowances NUMERIC(12,2);

-- Add special_terms field
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS special_terms TEXT;

-- Add department field if not exists
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS department TEXT;

-- Add contract_type field if not exists
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS contract_type TEXT;

-- Add currency field if not exists
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'OMR';

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_contracts_basic_salary ON contracts(basic_salary);
CREATE INDEX IF NOT EXISTS idx_contracts_allowances ON contracts(allowances);
CREATE INDEX IF NOT EXISTS idx_contracts_department ON contracts(department);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_type ON contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_contracts_currency ON contracts(currency);

-- Add comments for new fields
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'basic_salary') THEN
    EXECUTE 'COMMENT ON COLUMN contracts.basic_salary IS ''Basic salary amount for the contract''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'allowances') THEN
    EXECUTE 'COMMENT ON COLUMN contracts.allowances IS ''Additional allowances for the contract''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'special_terms') THEN
    EXECUTE 'COMMENT ON COLUMN contracts.special_terms IS ''Special terms and conditions for the contract''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'department') THEN
    EXECUTE 'COMMENT ON COLUMN contracts.department IS ''Department or division for the contract''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'contract_type') THEN
    EXECUTE 'COMMENT ON COLUMN contracts.contract_type IS ''Type of contract (full-time, part-time, etc.)''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'currency') THEN
    EXECUTE 'COMMENT ON COLUMN contracts.currency IS ''Currency for salary and allowances''';
  END IF;
END $$;

-- Update existing contracts to have default values
UPDATE contracts 
SET 
  basic_salary = contract_value 
WHERE basic_salary IS NULL AND contract_value IS NOT NULL;

UPDATE contracts 
SET 
  currency = 'OMR' 
WHERE currency IS NULL;

UPDATE contracts 
SET 
  contract_type = 'full-time-permanent' 
WHERE contract_type IS NULL;

-- Display migration results
SELECT 
  'Migration completed successfully!' as message,
  COUNT(*) as total_contracts,
  COUNT(CASE WHEN basic_salary IS NOT NULL THEN 1 END) as contracts_with_salary,
  COUNT(CASE WHEN allowances IS NOT NULL THEN 1 END) as contracts_with_allowances,
  COUNT(CASE WHEN department IS NOT NULL THEN 1 END) as contracts_with_department,
  COUNT(CASE WHEN contract_type IS NOT NULL THEN 1 END) as contracts_with_type,
  COUNT(CASE WHEN currency IS NOT NULL THEN 1 END) as contracts_with_currency
FROM contracts;

COMMIT; 