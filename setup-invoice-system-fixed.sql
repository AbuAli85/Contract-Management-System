-- Invoice System Integration with Bookings and Payments (Fixed Version)
-- This extends your existing system to automatically handle invoices

-- ============================================================================
-- CLEANUP AND PREPARE
-- ============================================================================

-- Drop existing objects if they exist (for clean installation)
DROP TRIGGER IF EXISTS invoice_webhook_trigger ON invoices;
DROP TRIGGER IF EXISTS auto_create_invoice_trigger ON bookings;
DROP FUNCTION IF EXISTS notify_invoice_update();
DROP FUNCTION IF EXISTS auto_create_invoice_on_booking();
DROP FUNCTION IF EXISTS process_payment_success(UUID, DECIMAL, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_invoice_from_booking(UUID, DECIMAL, TEXT);
DROP FUNCTION IF EXISTS get_invoice_details(UUID);
DROP FUNCTION IF EXISTS generate_invoice_number();
DROP TABLE IF EXISTS invoices CASCADE;

-- ============================================================================
-- INVOICES TABLE SETUP  
-- ============================================================================

CREATE TABLE invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
    
    -- Financial details
    subtotal DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    vat_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    currency TEXT NOT NULL DEFAULT 'OMR',
    
    -- Invoice details
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    
    -- Client information (copied from booking for invoice record)
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_address TEXT,
    client_phone TEXT,
    
    -- Provider information
    provider_id UUID NOT NULL,
    
    -- Additional details
    description TEXT,
    notes TEXT,
    
    -- Payment tracking
    payment_method TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints (separate from table creation for better compatibility)
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_booking_id 
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

ALTER TABLE invoices ADD CONSTRAINT fk_invoices_provider_id 
    FOREIGN KEY (provider_id) REFERENCES profiles(id);

-- Create computed columns using triggers (for better compatibility)
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    NEW.vat_amount := NEW.subtotal * NEW.vat_rate / 100;
    NEW.total_amount := NEW.subtotal + (NEW.subtotal * NEW.vat_rate / 100);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_invoice_totals_trigger
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION calculate_invoice_totals();

-- Indexes for performance
CREATE INDEX idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_provider_id ON invoices(provider_id);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE UNIQUE INDEX idx_invoices_number ON invoices(invoice_number);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated at trigger
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PAYMENTS TABLE UPDATES
-- ============================================================================

-- Update payments table to link with invoices (if not already done)
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

-- ============================================================================
-- INVOICE GENERATION FUNCTIONS
-- ============================================================================

-- Function to generate unique invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    invoice_number TEXT;
BEGIN
    -- Get next invoice number (simple incrementing)
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM 'INV(\d+)') AS INTEGER)
    ), 0) + 1
    INTO next_number
    FROM invoices 
    WHERE invoice_number ~ '^INV\d+$';
    
    -- Format as INV000001
    invoice_number := 'INV' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN invoice_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create invoice from booking
CREATE OR REPLACE FUNCTION create_invoice_from_booking(
    p_booking_id UUID,
    p_vat_rate DECIMAL DEFAULT 5.00,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    booking_record RECORD;
    service_record RECORD;
    provider_record RECORD;
    client_record RECORD;
    invoice_id UUID;
    invoice_number TEXT;
    result JSONB;
BEGIN
    -- Get booking details
    SELECT * INTO booking_record
    FROM bookings 
    WHERE id = p_booking_id;
    
    IF booking_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Booking not found'
        );
    END IF;
    
    -- Check if invoice already exists
    IF EXISTS (SELECT 1 FROM invoices WHERE booking_id = p_booking_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invoice already exists for this booking'
        );
    END IF;
    
    -- Get service details
    SELECT * INTO service_record
    FROM services 
    WHERE id = booking_record.service_id;
    
    IF service_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Service not found for booking'
        );
    END IF;
    
    -- Get client details
    SELECT * INTO client_record
    FROM profiles 
    WHERE id = booking_record.client_id;
    
    -- Generate invoice number
    SELECT generate_invoice_number() INTO invoice_number;
    
    -- Create invoice
    INSERT INTO invoices (
        booking_id,
        invoice_number,
        subtotal,
        vat_rate,
        currency,
        client_name,
        client_email,
        client_phone,
        provider_id,
        description,
        status
    ) VALUES (
        p_booking_id,
        invoice_number,
        booking_record.quoted_price,
        p_vat_rate,
        COALESCE(service_record.currency, 'OMR'),
        COALESCE(client_record.full_name, 'N/A'),
        COALESCE(client_record.email, 'N/A'),
        COALESCE(client_record.phone, ''),
        service_record.provider_id,
        COALESCE(p_description, 'Service: ' || service_record.title),
        'pending'
    ) RETURNING id INTO invoice_id;
    
    -- Get the created invoice
    SELECT to_jsonb(i.*) INTO result
    FROM invoices i
    WHERE i.id = invoice_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'invoice', result,
        'invoice_id', invoice_id,
        'invoice_number', invoice_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PAYMENT SUCCESS WEBHOOK HANDLER
-- ============================================================================

-- Function to handle payment success and update invoice
CREATE OR REPLACE FUNCTION process_payment_success(
    p_booking_id UUID,
    p_payment_amount DECIMAL,
    p_payment_method TEXT,
    p_payment_reference TEXT DEFAULT NULL,
    p_payment_gateway TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    invoice_record RECORD;
    payment_id UUID;
    result JSONB;
BEGIN
    -- Get or create invoice
    SELECT * INTO invoice_record
    FROM invoices 
    WHERE booking_id = p_booking_id;
    
    -- Create invoice if it doesn't exist
    IF invoice_record IS NULL THEN
        SELECT create_invoice_from_booking(p_booking_id) INTO result;
        
        IF NOT (result->>'success')::boolean THEN
            RETURN result; -- Return error from invoice creation
        END IF;
        
        -- Get the newly created invoice
        SELECT * INTO invoice_record
        FROM invoices 
        WHERE booking_id = p_booking_id;
    END IF;
    
    -- Create/update payment record
    INSERT INTO payments (
        booking_id,
        invoice_id,
        amount,
        currency,
        payment_method,
        payment_reference,
        payment_gateway,
        status,
        processed_at
    ) VALUES (
        p_booking_id,
        invoice_record.id,
        p_payment_amount,
        invoice_record.currency,
        p_payment_method,
        COALESCE(p_payment_reference, 'PAY_' || EXTRACT(EPOCH FROM NOW())::text),
        p_payment_gateway,
        'completed',
        NOW()
    ) 
    ON CONFLICT (booking_id, payment_reference) 
    DO UPDATE SET
        status = 'completed',
        processed_at = NOW(),
        amount = EXCLUDED.amount
    RETURNING id INTO payment_id;
    
    -- Update invoice status to paid
    UPDATE invoices 
    SET 
        status = 'paid',
        payment_method = p_payment_method,
        paid_at = NOW(),
        updated_at = NOW()
    WHERE id = invoice_record.id;
    
    -- Update booking status to completed (optional)
    UPDATE bookings 
    SET 
        status = 'completed',
        updated_at = NOW()
    WHERE id = p_booking_id;
    
    -- Update tracking status if exists
    UPDATE trackings 
    SET 
        status = 'completed',
        notes = 'Payment received - service completed',
        updated_at = NOW()
    WHERE booking_id = p_booking_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'invoice_id', invoice_record.id,
        'payment_id', payment_id,
        'invoice_status', 'paid',
        'booking_status', 'completed',
        'amount_paid', p_payment_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUTOMATIC INVOICE CREATION TRIGGERS
-- ============================================================================

-- Function to auto-create invoice when booking is confirmed
CREATE OR REPLACE FUNCTION auto_create_invoice_on_booking()
RETURNS TRIGGER AS $$
DECLARE
    result JSONB;
BEGIN
    -- Create invoice when booking status changes to 'confirmed'
    IF (OLD IS NULL OR OLD.status != 'confirmed') AND NEW.status = 'confirmed' THEN
        
        -- Create invoice from booking
        SELECT create_invoice_from_booking(NEW.id) INTO result;
        
        IF (result->>'success')::boolean THEN
            RAISE NOTICE 'Invoice created automatically for booking %: %', 
                NEW.id, result->>'invoice_number';
        ELSE
            RAISE WARNING 'Failed to create invoice for booking %: %', 
                NEW.id, result->>'error';
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic invoice creation
CREATE TRIGGER auto_create_invoice_trigger
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW
    WHEN (NEW.status = 'confirmed')
    EXECUTE FUNCTION auto_create_invoice_on_booking();

-- ============================================================================
-- INVOICE WEBHOOK TRIGGERS (Optional - requires webhook setup)
-- ============================================================================

-- Function to create webhook logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_type TEXT NOT NULL,
    payload JSONB,
    status TEXT NOT NULL,
    response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simple webhook function (replace with your actual webhook implementation)
CREATE OR REPLACE FUNCTION safe_webhook_call(webhook_url TEXT, payload JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- This is a placeholder - implement actual HTTP calls using pg_net or similar
    -- For now, just log the webhook attempt
    RAISE NOTICE 'Webhook called: % with payload: %', webhook_url, payload;
    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Webhook call failed: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when invoice is created or updated
CREATE OR REPLACE FUNCTION notify_invoice_update()
RETURNS TRIGGER AS $$
DECLARE
    webhook_payload JSONB;
    booking_data JSONB;
    webhook_success BOOLEAN;
    event_type TEXT;
BEGIN
    -- Determine event type
    IF TG_OP = 'INSERT' THEN
        event_type := 'invoice.created';
    ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
        event_type := 'invoice.status_changed';
    ELSE
        event_type := 'invoice.updated';
    END IF;
    
    -- Get booking data
    SELECT to_jsonb(b.*) INTO booking_data
    FROM bookings b
    WHERE b.id = NEW.booking_id;
    
    -- Build webhook payload
    webhook_payload := jsonb_build_object(
        'event', event_type,
        'invoice_id', NEW.id,
        'invoice_number', NEW.invoice_number,
        'booking_id', NEW.booking_id,
        'status', NEW.status,
        'subtotal', NEW.subtotal,
        'vat_amount', NEW.vat_amount,
        'total_amount', NEW.total_amount,
        'currency', NEW.currency,
        'client_email', NEW.client_email,
        'client_name', NEW.client_name,
        'provider_id', NEW.provider_id,
        'invoice_date', NEW.invoice_date,
        'due_date', NEW.due_date,
        'paid_at', NEW.paid_at,
        'booking', booking_data
    );
    
    -- Add old status if this is a status change
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        webhook_payload := webhook_payload || jsonb_build_object('old_status', OLD.status);
    END IF;
    
    -- Call webhook (replace URL with your actual Make.com webhook)
    SELECT safe_webhook_call(
        'https://hook.eu1.make.com/YOUR_INVOICE_WEBHOOK_ID',
        webhook_payload
    ) INTO webhook_success;
    
    -- Log webhook attempt
    INSERT INTO webhook_logs (
        webhook_type,
        payload,
        status,
        response,
        created_at
    ) VALUES (
        event_type,
        webhook_payload,
        CASE WHEN webhook_success THEN 'success' ELSE 'failed' END,
        jsonb_build_object('webhook_url', 'invoice-webhook', 'success', webhook_success),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create invoice webhook trigger
CREATE TRIGGER invoice_webhook_trigger
    AFTER INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION notify_invoice_update();

-- ============================================================================
-- HELPER FUNCTIONS FOR API
-- ============================================================================

-- Function to get invoice with related data
CREATE OR REPLACE FUNCTION get_invoice_details(p_invoice_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'invoice', to_jsonb(i.*),
        'booking', to_jsonb(b.*),
        'service', to_jsonb(s.*),
        'provider', jsonb_build_object(
            'id', pr.id,
            'full_name', pr.full_name,
            'email', pr.email,
            'company_name', pr.company_name
        ),
        'payments', COALESCE(
            (SELECT jsonb_agg(to_jsonb(p.*)) FROM payments p WHERE p.invoice_id = i.id),
            '[]'::jsonb
        )
    ) INTO result
    FROM invoices i
    JOIN bookings b ON b.id = i.booking_id
    JOIN services s ON s.id = b.service_id
    JOIN profiles pr ON pr.id = i.provider_id
    WHERE i.id = p_invoice_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION AND TEST FUNCTIONS
-- ============================================================================

-- Function to verify invoice system setup
CREATE OR REPLACE FUNCTION verify_invoice_system()
RETURNS JSONB AS $$
DECLARE
    table_exists BOOLEAN;
    trigger_exists BOOLEAN;
    function_exists BOOLEAN;
    result JSONB;
BEGIN
    -- Check if invoices table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'invoices'
    ) INTO table_exists;
    
    -- Check if triggers exist
    SELECT EXISTS (
        SELECT FROM information_schema.triggers 
        WHERE trigger_name = 'auto_create_invoice_trigger'
    ) INTO trigger_exists;
    
    -- Check if functions exist
    SELECT EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_name = 'create_invoice_from_booking'
    ) INTO function_exists;
    
    result := jsonb_build_object(
        'table_exists', table_exists,
        'trigger_exists', trigger_exists,
        'function_exists', function_exists,
        'setup_complete', table_exists AND trigger_exists AND function_exists,
        'timestamp', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CONFIGURATION NOTES AND USAGE
-- ============================================================================

/*
SETUP VERIFICATION:
Run this to verify the setup is complete:
SELECT verify_invoice_system();

USAGE EXAMPLES:

1. Auto-create invoice when booking confirmed:
   UPDATE bookings SET status = 'confirmed' WHERE id = 'booking-uuid';
   -- Invoice automatically created

2. Process payment success:
   SELECT process_payment_success(
     'booking-uuid',
     150.00,
     'credit_card',
     'stripe_pi_abc123',
     'stripe'
   );

3. Manual invoice creation:
   SELECT create_invoice_from_booking('booking-uuid', 5.0, 'Custom description');

4. Get invoice details:
   SELECT get_invoice_details('invoice-uuid');

5. Check system status:
   SELECT verify_invoice_system();

CONFIGURATION:
- Replace 'YOUR_INVOICE_WEBHOOK_ID' in notify_invoice_update() function with your actual Make.com webhook URL
- Adjust VAT rates by changing the default value in the invoices table
- Customize invoice numbering in generate_invoice_number() function

The system will automatically:
- Create invoices when bookings are confirmed
- Update invoice status when payments are received
- Mark bookings as completed when paid
- Send webhooks for all invoice events
- Generate unique invoice numbers
- Calculate VAT automatically
*/

-- Run verification
SELECT verify_invoice_system();
