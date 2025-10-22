-- Migration: Add comprehensive currency support
-- Date: 2025-10-23
-- Description: Adds exchange rates table, currency enum, and user preferences for currency

-- Create currency enum for supported currencies
CREATE TYPE currency_code AS ENUM ('USD', 'OMR', 'SAR', 'AED', 'EUR', 'GBP');

-- Create exchange_rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency currency_code NOT NULL,
    to_currency currency_code NOT NULL,
    rate DECIMAL(18,8) NOT NULL CHECK (rate > 0),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT DEFAULT 'manual', -- Source of exchange rate (manual, api, bank, etc.)
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Ensure unique currency pair per effective date
    CONSTRAINT unique_currency_pair_date UNIQUE (from_currency, to_currency, effective_date),
    -- Prevent same currency exchange
    CONSTRAINT different_currencies CHECK (from_currency != to_currency)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies 
    ON exchange_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_effective_date 
    ON exchange_rates(effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_active 
    ON exchange_rates(is_active) WHERE is_active = TRUE;

-- Add currency preference to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_currency currency_code DEFAULT 'USD';

-- Update contracts table to use currency enum (if not already constrained)
-- First, update any invalid currency codes to USD
UPDATE contracts 
SET currency = 'USD' 
WHERE currency IS NULL OR currency NOT IN ('USD', 'OMR', 'SAR', 'AED', 'EUR', 'GBP');

-- Add constraint to ensure only valid currencies
ALTER TABLE contracts
DROP CONSTRAINT IF EXISTS contracts_currency_check;

ALTER TABLE contracts
ADD CONSTRAINT contracts_currency_check 
CHECK (currency IN ('USD', 'OMR', 'SAR', 'AED', 'EUR', 'GBP'));

-- Insert initial exchange rates (as of Oct 2025)
-- Base currency: USD
INSERT INTO exchange_rates (from_currency, to_currency, rate, source, effective_date)
VALUES 
    -- USD to other currencies
    ('USD', 'OMR', 0.385, 'central_bank', CURRENT_DATE),
    ('USD', 'SAR', 3.75, 'central_bank', CURRENT_DATE),
    ('USD', 'AED', 3.673, 'central_bank', CURRENT_DATE),
    ('USD', 'EUR', 0.92, 'market', CURRENT_DATE),
    ('USD', 'GBP', 0.79, 'market', CURRENT_DATE),
    
    -- OMR to other currencies
    ('OMR', 'USD', 2.597, 'central_bank', CURRENT_DATE),
    ('OMR', 'SAR', 9.74, 'calculated', CURRENT_DATE),
    ('OMR', 'AED', 9.539, 'calculated', CURRENT_DATE),
    ('OMR', 'EUR', 2.389, 'calculated', CURRENT_DATE),
    ('OMR', 'GBP', 2.052, 'calculated', CURRENT_DATE),
    
    -- SAR to other currencies
    ('SAR', 'USD', 0.267, 'central_bank', CURRENT_DATE),
    ('SAR', 'OMR', 0.103, 'calculated', CURRENT_DATE),
    ('SAR', 'AED', 0.979, 'calculated', CURRENT_DATE),
    ('SAR', 'EUR', 0.245, 'calculated', CURRENT_DATE),
    ('SAR', 'GBP', 0.211, 'calculated', CURRENT_DATE),
    
    -- AED to other currencies
    ('AED', 'USD', 0.272, 'central_bank', CURRENT_DATE),
    ('AED', 'OMR', 0.105, 'calculated', CURRENT_DATE),
    ('AED', 'SAR', 1.021, 'calculated', CURRENT_DATE),
    ('AED', 'EUR', 0.251, 'calculated', CURRENT_DATE),
    ('AED', 'GBP', 0.215, 'calculated', CURRENT_DATE),
    
    -- EUR to other currencies
    ('EUR', 'USD', 1.087, 'market', CURRENT_DATE),
    ('EUR', 'OMR', 0.419, 'calculated', CURRENT_DATE),
    ('EUR', 'SAR', 4.076, 'calculated', CURRENT_DATE),
    ('EUR', 'AED', 3.993, 'calculated', CURRENT_DATE),
    ('EUR', 'GBP', 0.859, 'market', CURRENT_DATE),
    
    -- GBP to other currencies
    ('GBP', 'USD', 1.266, 'market', CURRENT_DATE),
    ('GBP', 'OMR', 0.487, 'calculated', CURRENT_DATE),
    ('GBP', 'SAR', 4.748, 'calculated', CURRENT_DATE),
    ('GBP', 'AED', 4.650, 'calculated', CURRENT_DATE),
    ('GBP', 'EUR', 1.164, 'market', CURRENT_DATE)
ON CONFLICT (from_currency, to_currency, effective_date) 
DO UPDATE SET 
    rate = EXCLUDED.rate,
    updated_at = NOW(),
    source = EXCLUDED.source;

-- Create function to get latest exchange rate
CREATE OR REPLACE FUNCTION get_exchange_rate(
    p_from_currency currency_code,
    p_to_currency currency_code,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(18,8) AS $$
DECLARE
    v_rate DECIMAL(18,8);
BEGIN
    -- If same currency, return 1
    IF p_from_currency = p_to_currency THEN
        RETURN 1.0;
    END IF;
    
    -- Get the most recent rate on or before the specified date
    SELECT rate INTO v_rate
    FROM exchange_rates
    WHERE from_currency = p_from_currency
        AND to_currency = p_to_currency
        AND effective_date <= p_date
        AND is_active = TRUE
    ORDER BY effective_date DESC
    LIMIT 1;
    
    -- If no rate found, return NULL
    RETURN v_rate;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to convert currency amounts
CREATE OR REPLACE FUNCTION convert_currency(
    p_amount DECIMAL(15,2),
    p_from_currency currency_code,
    p_to_currency currency_code,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    v_rate DECIMAL(18,8);
BEGIN
    -- If same currency, return original amount
    IF p_from_currency = p_to_currency THEN
        RETURN p_amount;
    END IF;
    
    -- Get exchange rate
    v_rate := get_exchange_rate(p_from_currency, p_to_currency, p_date);
    
    -- If no rate found, return NULL
    IF v_rate IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Convert and round to 2 decimal places
    RETURN ROUND(p_amount * v_rate, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Create view for contract values in multiple currencies
CREATE OR REPLACE VIEW contracts_with_converted_values AS
SELECT 
    c.*,
    c.value as original_value,
    c.currency as original_currency,
    convert_currency(c.value, c.currency::currency_code, 'USD'::currency_code) as value_usd,
    convert_currency(c.value, c.currency::currency_code, 'OMR'::currency_code) as value_omr,
    convert_currency(c.value, c.currency::currency_code, 'SAR'::currency_code) as value_sar,
    convert_currency(c.value, c.currency::currency_code, 'AED'::currency_code) as value_aed
FROM contracts c;

-- Add trigger to update exchange_rates updated_at
CREATE OR REPLACE FUNCTION trigger_set_exchange_rates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_exchange_rates_updated_at ON exchange_rates;
CREATE TRIGGER set_exchange_rates_updated_at
BEFORE UPDATE ON exchange_rates
FOR EACH ROW
EXECUTE FUNCTION trigger_set_exchange_rates_timestamp();

-- Add comments
COMMENT ON TABLE exchange_rates IS 'Stores currency exchange rates with historical tracking';
COMMENT ON COLUMN exchange_rates.from_currency IS 'Source currency code';
COMMENT ON COLUMN exchange_rates.to_currency IS 'Target currency code';
COMMENT ON COLUMN exchange_rates.rate IS 'Exchange rate from source to target currency';
COMMENT ON COLUMN exchange_rates.effective_date IS 'Date from which this rate is effective';
COMMENT ON COLUMN exchange_rates.source IS 'Source of the exchange rate (manual, api, central_bank, etc.)';
COMMENT ON COLUMN exchange_rates.is_active IS 'Whether this rate is currently active';
COMMENT ON COLUMN profiles.preferred_currency IS 'User preferred currency for displaying amounts';

-- Grant permissions (adjust as needed for your RLS policies)
-- GRANT SELECT ON exchange_rates TO authenticated;
-- GRANT SELECT ON contracts_with_converted_values TO authenticated;

