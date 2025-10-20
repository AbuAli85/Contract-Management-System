-- Add new columns to contracts table for products and locations
-- This migration only adds the missing columns since products and locations tables already exist

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS products_en TEXT,
ADD COLUMN IF NOT EXISTS products_ar TEXT,
ADD COLUMN IF NOT EXISTS location_en TEXT,
ADD COLUMN IF NOT EXISTS location_ar TEXT,
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id),
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- Add comments to the new columns
COMMENT ON COLUMN contracts.products_en IS 'Products/Services in English for Make.com integration';
COMMENT ON COLUMN contracts.products_ar IS 'Products/Services in Arabic for Make.com integration';
COMMENT ON COLUMN contracts.location_en IS 'Location in English for Make.com integration';
COMMENT ON COLUMN contracts.location_ar IS 'Location in Arabic for Make.com integration';
COMMENT ON COLUMN contracts.product_id IS 'Reference to products table';
COMMENT ON COLUMN contracts.location_id IS 'Reference to locations table';
