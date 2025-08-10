-- Add missing promoter fields that are referenced in the UI
-- This migration adds all the fields that were removed or never added to the promoters table

DO $$
BEGIN
    -- Add missing personal information fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='date_of_birth') THEN
        ALTER TABLE promoters ADD COLUMN date_of_birth DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='gender') THEN
        ALTER TABLE promoters ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'other'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='marital_status') THEN
        ALTER TABLE promoters ADD COLUMN marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='city') THEN
        ALTER TABLE promoters ADD COLUMN city TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='state') THEN
        ALTER TABLE promoters ADD COLUMN state TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='country') THEN
        ALTER TABLE promoters ADD COLUMN country TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='postal_code') THEN
        ALTER TABLE promoters ADD COLUMN postal_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='emergency_contact') THEN
        ALTER TABLE promoters ADD COLUMN emergency_contact TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='emergency_phone') THEN
        ALTER TABLE promoters ADD COLUMN emergency_phone TEXT;
    END IF;

    -- Add missing document fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='visa_number') THEN
        ALTER TABLE promoters ADD COLUMN visa_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='visa_expiry_date') THEN
        ALTER TABLE promoters ADD COLUMN visa_expiry_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='work_permit_number') THEN
        ALTER TABLE promoters ADD COLUMN work_permit_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='work_permit_expiry_date') THEN
        ALTER TABLE promoters ADD COLUMN work_permit_expiry_date DATE;
    END IF;

    -- Add missing professional fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='company') THEN
        ALTER TABLE promoters ADD COLUMN company TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='department') THEN
        ALTER TABLE promoters ADD COLUMN department TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='specialization') THEN
        ALTER TABLE promoters ADD COLUMN specialization TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='experience_years') THEN
        ALTER TABLE promoters ADD COLUMN experience_years INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='education_level') THEN
        ALTER TABLE promoters ADD COLUMN education_level TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='university') THEN
        ALTER TABLE promoters ADD COLUMN university TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='graduation_year') THEN
        ALTER TABLE promoters ADD COLUMN graduation_year INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='skills') THEN
        ALTER TABLE promoters ADD COLUMN skills TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='certifications') THEN
        ALTER TABLE promoters ADD COLUMN certifications TEXT;
    END IF;

    -- Add missing financial fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='bank_name') THEN
        ALTER TABLE promoters ADD COLUMN bank_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='account_number') THEN
        ALTER TABLE promoters ADD COLUMN account_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='iban') THEN
        ALTER TABLE promoters ADD COLUMN iban TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='swift_code') THEN
        ALTER TABLE promoters ADD COLUMN swift_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='tax_id') THEN
        ALTER TABLE promoters ADD COLUMN tax_id TEXT;
    END IF;

    -- Add missing preference fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='rating') THEN
        ALTER TABLE promoters ADD COLUMN rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='availability') THEN
        ALTER TABLE promoters ADD COLUMN availability TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='preferred_language') THEN
        ALTER TABLE promoters ADD COLUMN preferred_language TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='timezone') THEN
        ALTER TABLE promoters ADD COLUMN timezone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='special_requirements') THEN
        ALTER TABLE promoters ADD COLUMN special_requirements TEXT;
    END IF;

    -- Add missing address fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='address') THEN
        ALTER TABLE promoters ADD COLUMN address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='national_id') THEN
        ALTER TABLE promoters ADD COLUMN national_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='crn') THEN
        ALTER TABLE promoters ADD COLUMN crn TEXT;
    END IF;

END $$;

-- Add comments for documentation
COMMENT ON COLUMN promoters.date_of_birth IS 'Date of birth of the promoter';
COMMENT ON COLUMN promoters.gender IS 'Gender of the promoter (male, female, other)';
COMMENT ON COLUMN promoters.marital_status IS 'Marital status of the promoter';
COMMENT ON COLUMN promoters.city IS 'City of residence';
COMMENT ON COLUMN promoters.state IS 'State or province of residence';
COMMENT ON COLUMN promoters.country IS 'Country of residence';
COMMENT ON COLUMN promoters.postal_code IS 'Postal code';
COMMENT ON COLUMN promoters.emergency_contact IS 'Emergency contact person name';
COMMENT ON COLUMN promoters.emergency_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN promoters.visa_number IS 'Visa number if applicable';
COMMENT ON COLUMN promoters.visa_expiry_date IS 'Visa expiry date';
COMMENT ON COLUMN promoters.work_permit_number IS 'Work permit number if applicable';
COMMENT ON COLUMN promoters.work_permit_expiry_date IS 'Work permit expiry date';
COMMENT ON COLUMN promoters.company IS 'Current or previous company';
COMMENT ON COLUMN promoters.department IS 'Department within the company';
COMMENT ON COLUMN promoters.specialization IS 'Professional specialization';
COMMENT ON COLUMN promoters.experience_years IS 'Years of professional experience';
COMMENT ON COLUMN promoters.education_level IS 'Highest education level achieved';
COMMENT ON COLUMN promoters.university IS 'University or institution name';
COMMENT ON COLUMN promoters.graduation_year IS 'Year of graduation';
COMMENT ON COLUMN promoters.skills IS 'Professional skills (comma-separated)';
COMMENT ON COLUMN promoters.certifications IS 'Professional certifications (comma-separated)';
COMMENT ON COLUMN promoters.bank_name IS 'Bank name for payments';
COMMENT ON COLUMN promoters.account_number IS 'Bank account number';
COMMENT ON COLUMN promoters.iban IS 'International Bank Account Number';
COMMENT ON COLUMN promoters.swift_code IS 'SWIFT/BIC code';
COMMENT ON COLUMN promoters.tax_id IS 'Tax identification number';
COMMENT ON COLUMN promoters.rating IS 'Performance rating (0-5)';
COMMENT ON COLUMN promoters.availability IS 'Availability status';
COMMENT ON COLUMN promoters.preferred_language IS 'Preferred language for communication';
COMMENT ON COLUMN promoters.timezone IS 'Timezone for scheduling';
COMMENT ON COLUMN promoters.special_requirements IS 'Special requirements or accommodations';
COMMENT ON COLUMN promoters.address IS 'Full address';
COMMENT ON COLUMN promoters.national_id IS 'National ID number';
COMMENT ON COLUMN promoters.crn IS 'Commercial Registration Number'; 