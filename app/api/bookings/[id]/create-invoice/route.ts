// app/api/bookings/[id]/create-invoice/route.ts - Create invoice from booking
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { canCreateInvoices } from '@/lib/acl';

// Create Supabase client helper
function createClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

const createInvoiceFromBookingSchema = z.object({
  vat_rate: z.number().min(0).max(100).default(5),
  description: z.string().optional(),
  due_days: z.number().min(1).max(365).default(30),
  currency: z.string().optional()
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const bookingId = params.id;
    const payload = await req.json();
    const body = createInvoiceFromBookingSchema.parse(payload);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    // Get user profile and check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !canCreateInvoices(profile.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403 });
    }

    // Get booking with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(
          provider_id,
          title,
          currency
        ),
        client:profiles!bookings_client_id_fkey(
          full_name,
          email,
          phone
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404 });
    }

    // Check if user can create invoice for this booking
    const isProvider = booking.service.provider_id === user.id;
    const isAdmin = ['admin', 'manager'].includes(profile.role);
    
    if (!isProvider && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Cannot create invoice for this booking' }), { status: 403 });
    }

    // Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id, invoice_number, status')
      .eq('booking_id', bookingId)
      .single();

    if (existingInvoice) {
      return new Response(JSON.stringify({ 
        error: 'Invoice already exists for this booking',
        existing_invoice: existingInvoice
      }), { status: 400 });
    }

    // Generate invoice number
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const nextNumber = lastInvoice?.invoice_number 
      ? parseInt(lastInvoice.invoice_number.replace('INV', '')) + 1 
      : 1;
    
    const invoiceNumber = `INV${nextNumber.toString().padStart(6, '0')}`;

    // Prepare invoice data
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + body.due_days);

    const invoiceData = {
      booking_id: bookingId,
      invoice_number: invoiceNumber,
      subtotal: booking.quoted_price,
      vat_rate: body.vat_rate,
      currency: body.currency || booking.service.currency || 'OMR',
      client_name: booking.client?.full_name || 'N/A',
      client_email: booking.client?.email || 'N/A',
      client_phone: booking.client?.phone || '',
      provider_id: booking.service.provider_id,
      description: body.description || `Service: ${booking.service.title}`,
      status: 'pending',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0]
    };

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select(`
        *,
        booking:bookings(*),
        provider:profiles!invoices_provider_id_fkey(full_name, email, company_name)
      `)
      .single();

    if (invoiceError) {
      console.error('Invoice creation error:', invoiceError);
      return new Response(JSON.stringify({ error: invoiceError.message }), { status: 400 });
    }

    // Calculate totals for response
    const vatAmount = (invoice.subtotal * invoice.vat_rate) / 100;
    const totalAmount = invoice.subtotal + vatAmount;

    const invoiceWithTotals = {
      ...invoice,
      vat_amount: vatAmount,
      total_amount: totalAmount
    };

    return Response.json({ 
      success: true,
      data: invoiceWithTotals,
      message: 'Invoice created successfully'
    });

  } catch (error) {
    console.error('Create invoice from booking API error:', error);
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: error.errors }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
