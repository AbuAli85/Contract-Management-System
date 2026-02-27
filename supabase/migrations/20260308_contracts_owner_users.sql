-- ============================================================================
-- Contracts: owner / legal reviewer user routing
-- ============================================================================
-- Adds direct user references used for workflow approval routing:
--   - owner_user_id              — primary business owner of the contract
--   - legal_reviewer_user_id     — legal approver for legal-related states
-- ============================================================================

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS legal_reviewer_user_id UUID REFERENCES auth.users(id);

-- Index to speed up lookups by owner_user_id; company_id is indexed separately
CREATE INDEX IF NOT EXISTS idx_contracts_owner_user
  ON public.contracts (owner_user_id);

