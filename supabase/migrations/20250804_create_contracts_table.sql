-- Migration: Create contracts table with foreign key relationships to parties
-- Date: 2025-08-04

CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE NOT NULL,
    employer_id UUID CONSTRAINT contracts_employer_id_fkey REFERENCES parties(id) ON DELETE SET NULL, -- Party acting as Employer
    client_id UUID CONSTRAINT contracts_client_id_fkey REFERENCES parties(id) ON DELETE SET NULL,   -- Party acting as Client
    contract_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    contract_type TEXT NOT NULL CHECK (contract_type IN ('employment', 'service', 'consultancy', 'partnership')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'completed', 'terminated', 'expired')),
    start_date DATE,
    end_date DATE,
    value DECIMAL(15,2),
    currency TEXT DEFAULT 'USD',
    terms TEXT,
    notify_days_before_contract_expiry INTEGER DEFAULT 30,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_contracts_promoter_id ON contracts(promoter_id);
CREATE INDEX IF NOT EXISTS idx_contracts_employer_id ON contracts(employer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_is_current ON contracts(promoter_id, is_current DESC);

-- Trigger to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_contracts_updated_at ON contracts;
CREATE TRIGGER set_contracts_updated_at
BEFORE UPDATE ON contracts
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

COMMENT ON TABLE contracts IS 'Stores job assignments and contract details for promoters.';
COMMENT ON COLUMN contracts.promoter_id IS 'Foreign key to the promoter involved in this contract.';
COMMENT ON COLUMN contracts.employer_id IS 'Foreign key to the party acting as the employer for this contract.';
COMMENT ON COLUMN contracts.client_id IS 'Foreign key to the party acting as the client for this contract.';
