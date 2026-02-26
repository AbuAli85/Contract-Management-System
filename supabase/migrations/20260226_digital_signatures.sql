-- ============================================================================
-- Digital Signatures Table
-- ============================================================================
-- Stores e-signature requests and drawn canvas signatures for contracts.
-- Supports multiple providers: hellosign, docusign, canvas (drawn).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.digital_signatures (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contract_id          UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  signer_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  signer_name          TEXT NOT NULL,
  signer_email         TEXT NOT NULL,
  signer_role          TEXT NOT NULL DEFAULT 'signer',
  provider             TEXT NOT NULL DEFAULT 'canvas'
                         CHECK (provider IN ('hellosign', 'docusign', 'canvas')),
  provider_request_id  TEXT,                    -- External provider's request/envelope ID
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','sent','viewed','signed','declined','expired','cancelled')),
  signature_image_url  TEXT,                    -- For canvas signatures
  signing_url          TEXT,                    -- Embedded signing URL from provider
  ip_address           INET,
  user_agent           TEXT,
  signed_at            TIMESTAMPTZ,
  expires_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_digital_signatures_contract
  ON public.digital_signatures (contract_id);
CREATE INDEX IF NOT EXISTS idx_digital_signatures_company
  ON public.digital_signatures (company_id);
CREATE INDEX IF NOT EXISTS idx_digital_signatures_signer_email
  ON public.digital_signatures (signer_email);
CREATE INDEX IF NOT EXISTS idx_digital_signatures_status
  ON public.digital_signatures (status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_digital_signatures_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_digital_signatures_updated_at ON public.digital_signatures;
CREATE TRIGGER trg_digital_signatures_updated_at
  BEFORE UPDATE ON public.digital_signatures
  FOR EACH ROW EXECUTE FUNCTION update_digital_signatures_updated_at();

-- Row Level Security
ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;

-- Company members can read signatures for their contracts
CREATE POLICY "digital_signatures_select_company_members"
  ON public.digital_signatures FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Admins and managers can insert signature requests
CREATE POLICY "digital_signatures_insert_privileged"
  ON public.digital_signatures FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
        AND is_active = true
    )
    OR auth.role() = 'service_role'
  );

-- Signers can update their own signature record (to mark as signed/declined)
CREATE POLICY "digital_signatures_update_signer"
  ON public.digital_signatures FOR UPDATE
  USING (
    signer_id = auth.uid()
    OR auth.role() = 'service_role'
    OR company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
  );
