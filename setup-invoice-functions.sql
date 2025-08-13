-- Invoice Functions for PostgreSQL
-- Run this after the basic table setup

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

-- Function to handle payment success
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
    
    -- Update booking status to completed
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

-- Function to get invoice details
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

-- Test the functions
SELECT 'Invoice functions created successfully!' as status;
