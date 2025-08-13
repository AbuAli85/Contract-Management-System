# Invoice System Setup Guide - Step by Step

## 🚨 **URGENT FIX: Column "provider_id" does not exist**

The error you encountered means the invoices table wasn't created properly. Follow these steps to fix it:

## Step 1: Run Basic Table Setup
Execute this file first to create the invoices table and basic structure:
```bash
psql your_database_url -f setup-invoices-basic.sql
```

## Step 2: Run Invoice Functions
Execute this file to create the invoice processing functions:
```bash
psql your_database_url -f setup-invoice-functions.sql
```

## Step 3: Run Invoice Triggers
Execute this file to create the automatic triggers:
```bash
psql your_database_url -f setup-invoice-triggers.sql
```

## Alternative: Manual Execution

If you can't run files directly, copy and paste these commands one by one into your PostgreSQL console:

### 1. Check Current State
```sql
-- Check if invoices table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'invoices';

-- If it exists, check its structure
\d invoices;
```

### 2. Drop and Recreate if Broken
```sql
-- Only run this if the table exists but is broken
DROP TABLE IF EXISTS invoices CASCADE;
```

### 3. Create Invoices Table
```sql
CREATE TABLE invoices (
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
```

### 4. Add Foreign Key Constraints
```sql
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_booking_id 
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

ALTER TABLE invoices ADD CONSTRAINT fk_invoices_provider_id 
    FOREIGN KEY (provider_id) REFERENCES profiles(id);
```

### 5. Add Indexes
```sql
CREATE INDEX idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_provider_id ON invoices(provider_id);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
```

### 6. Enable RLS
```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

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
```

### 7. Verify Setup
```sql
-- Verify the table was created correctly
\d invoices;

-- Check that provider_id column exists
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'invoices' AND column_name = 'provider_id';
```

## Quick Test

Once the table is created, test it with a simple insert:

```sql
-- Test invoice creation (replace UUIDs with actual values from your database)
INSERT INTO invoices (
    booking_id,
    invoice_number,
    subtotal,
    client_name,
    client_email,
    provider_id,
    description
) VALUES (
    'your-booking-uuid-here',
    'INV000001',
    150.00,
    'Test Client',
    'test@example.com',
    'your-provider-uuid-here',
    'Test invoice'
);

-- Verify it was created
SELECT * FROM invoices LIMIT 1;
```

## Common Issues and Solutions

### Issue 1: "relation bookings does not exist"
- Make sure your bookings table exists first
- Check the exact table name: `SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%booking%';`

### Issue 2: "relation profiles does not exist"
- Make sure your profiles table exists first
- Check the exact table name: `SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%profile%';`

### Issue 3: "column provider_id does not exist"
- This means the table creation failed
- Drop and recreate the table using the steps above

### Issue 4: Permission denied
- Make sure you're connected as a user with CREATE TABLE permissions
- If using Supabase, use the service role key

## Environment Variables Needed

Add these to your `.env.local` after the database setup:

```env
# Payment webhook verification
PAYMENT_WEBHOOK_SECRET=your_payment_provider_webhook_secret
WEBHOOK_VERIFY_TOKEN=your_verification_token

# Supabase service role (for webhook operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Make.com webhook URL for invoice notifications
INVOICE_WEBHOOK_URL=https://hook.eu1.make.com/YOUR_INVOICE_WEBHOOK_ID
```

## Next Steps After Setup

1. **Test the API endpoints** using the Invoice API routes I created
2. **Configure your payment provider** to send webhooks to `/api/webhooks/payment-success`
3. **Set up Make.com webhook** URL in the trigger function
4. **Test the complete flow** with a booking confirmation

## Troubleshooting Commands

```sql
-- Check if table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'invoices';

-- Check table structure
\d invoices;

-- Check foreign key constraints
SELECT constraint_name, table_name FROM information_schema.table_constraints 
WHERE table_name = 'invoices' AND constraint_type = 'FOREIGN KEY';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'invoices';

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%invoice%';
```

Run these commands step by step and let me know if you encounter any errors!
