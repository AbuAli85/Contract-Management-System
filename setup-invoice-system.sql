-- Invoice System Integration with Bookings and Payments
-- This extends your existing system to automatically handle invoices

-- ============================================================================
-- INVOICES TABLE SETUP  
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
    
    -- Financial details
    subtotal DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00, -- Default 5% VAT for Oman
    vat_amount DECIMAL(10,2) GENERATED ALWAYS AS (subtotal * vat_rate / 100) STORED,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (subtotal + (subtotal * vat_rate / 100)) STORED,
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
    provider_id UUID NOT NULL REFERENCES profiles(id),
    
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_provider_id ON invoices(provider_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

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

-- Updated at trigger
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PAYMENTS TABLE UPDATES
-- ============================================================================

-- Update payments table to link with invoices (if not already done)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);

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
    invoice_id UUID;
    invoice_number TEXT;
    result JSONB;
BEGIN
    -- Get booking details
    SELECT b.*, p.full_name as client_name, p.email as client_email, p.phone as client_phone
    INTO booking_record
    FROM bookings b
    LEFT JOIN profiles p ON p.id = b.client_id
    WHERE b.id = p_booking_id;
    
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
    
    -- Get provider details
    SELECT * INTO provider_record
    FROM profiles 
    WHERE id = service_record.provider_id;
    
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
        COALESCE(booking_record.client_name, 'N/A'),
        COALESCE(booking_record.client_email, 'N/A'),
        booking_record.client_phone,
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
        p_payment_reference,
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
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
        
        -- Create invoice from booking
        SELECT create_invoice_from_booking(NEW.id) INTO result;
        
        IF (result->>'success')::boolean THEN
            RAISE LOG 'Invoice created automatically for booking %: %', 
                NEW.booking_number, result->>'invoice_number';
        ELSE
            RAISE WARNING 'Failed to create invoice for booking %: %', 
                NEW.booking_number, result->>'error';
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic invoice creation
DROP TRIGGER IF EXISTS auto_create_invoice_trigger ON bookings;
CREATE TRIGGER auto_create_invoice_trigger
    AFTER UPDATE ON bookings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'confirmed')
    EXECUTE FUNCTION auto_create_invoice_on_booking();

-- ============================================================================
-- INVOICE WEBHOOK TRIGGERS
-- ============================================================================

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
    
    -- Call Make.com webhook
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
DROP TRIGGER IF EXISTS invoice_webhook_trigger ON invoices;
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
-- CONFIGURATION NOTES
-- ============================================================================

/*
TO USE THIS INVOICE SYSTEM:

1. Replace webhook URL in notify_invoice_update() function:
   'https://hook.eu1.make.com/YOUR_INVOICE_WEBHOOK_ID'

2. Auto-create invoice when booking confirmed:
   UPDATE bookings SET status = 'confirmed' WHERE id = 'booking-uuid';
   -- Invoice automatically created

3. Process payment success:
   SELECT process_payment_success(
     'booking-uuid',
     150.00,
     'credit_card',
     'stripe_pi_abc123',
     'stripe'
   );

4. Manual invoice creation:
   SELECT create_invoice_from_booking('booking-uuid', 5.0, 'Custom description');

5. Get invoice details:
   SELECT get_invoice_details('invoice-uuid');

The system will automatically:
- Create invoices when bookings are confirmed
- Update invoice status when payments are received
- Mark bookings as completed when paid
- Send webhooks for all invoice events
- Generate unique invoice numbers
- Calculate VAT automatically
*/
