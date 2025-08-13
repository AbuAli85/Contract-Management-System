-- Invoice System Setup for PostgreSQL
-- Run this step by step to avoid errors

-- Step 1: Create the invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
    subtotal DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    vat_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    currency TEXT NOT NULL DEFAULT 'OMR',
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_address TEXT,
    client_phone TEXT,
    provider_id UUID NOT NULL,
    description TEXT,
    notes TEXT,
    payment_method TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add foreign key constraints
DO $$ 
BEGIN
    -- Check if foreign key constraint already exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_invoices_booking_id'
    ) THEN
        ALTER TABLE invoices ADD CONSTRAINT fk_invoices_booking_id 
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_invoices_provider_id'
    ) THEN
        ALTER TABLE invoices ADD CONSTRAINT fk_invoices_provider_id 
            FOREIGN KEY (provider_id) REFERENCES profiles(id);
    END IF;
END $$;

-- Step 3: Add indexes
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_provider_id ON invoices(provider_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Step 4: Add invoice_id column to payments table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'invoice_id'
    ) THEN
        ALTER TABLE payments ADD COLUMN invoice_id UUID;
        ALTER TABLE payments ADD CONSTRAINT fk_payments_invoice_id 
            FOREIGN KEY (invoice_id) REFERENCES invoices(id);
        CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
    END IF;
END $$;

-- Step 5: Create function to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    NEW.vat_amount := NEW.subtotal * NEW.vat_rate / 100;
    NEW.total_amount := NEW.subtotal + (NEW.subtotal * NEW.vat_rate / 100);
    NEW.due_date := COALESCE(NEW.due_date, NEW.invoice_date + INTERVAL '30 days');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for invoice totals calculation
DROP TRIGGER IF EXISTS calculate_invoice_totals_trigger ON invoices;
CREATE TRIGGER calculate_invoice_totals_trigger
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION calculate_invoice_totals();

-- Step 7: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create updated_at trigger
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Enable RLS and create policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
DROP POLICY IF EXISTS "Providers and admins can update invoices" ON invoices;
DROP POLICY IF EXISTS "System can insert invoices" ON invoices;

-- Create RLS policies
CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (
        provider_id = auth.uid() OR
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'manager')
        ) OR
        auth.uid() IN (
            SELECT b.client_id FROM bookings b WHERE b.id = booking_id
        )
    );

CREATE POLICY "Providers and admins can update invoices" ON invoices
    FOR UPDATE USING (
        provider_id = auth.uid() OR
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'manager')
        )
    );

CREATE POLICY "System can insert invoices" ON invoices
    FOR INSERT WITH CHECK (true);

-- Step 10: Test the table creation
SELECT 'Invoice system setup completed successfully!' as status;

-- Verify the table structure
\d invoices;
