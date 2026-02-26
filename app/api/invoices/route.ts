// app/api/invoices/route.ts - Invoice creation and listing API
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { canCreateInvoices, canViewInvoices } from '@/lib/acl';

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

const createInvoiceSchema = z.object({
  booking_id: z.string().uuid(),
  invoice_number: z.string().min(3).optional(), // Auto-generated if not provided
  subtotal: z.number().nonnegative(),
  vat_rate: z.number().min(0).max(100).default(5),
  currency: z.string().default('OMR'),
  description: z.string().optional(),
  client_name: z.string().optional(),
  client_email: z.string().email().optional(),
  client_phone: z.string().optional(),
  due_date: z.string().optional(), // ISO date string
});

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const payload = await req.json();
    const body = createInvoiceSchema.parse(payload);

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      );
    }

    // Get user profile and check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !canCreateInvoices(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403 }
      );
    }

    // Verify booking exists and user has access
    const { data: booking } = await supabase
      .from('bookings')
      .select(
        `
        *,
        service:services(provider_id, title, currency),
        client:profiles!bookings_client_id_fkey(full_name, email, phone)
      `
      )
      .eq('id', body.booking_id)
      .single();

    if (!booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
      });
    }

    // Check if user can create invoice for this booking
    const isProvider = booking.service.provider_id === user.id;
    const isAdmin = ['admin', 'manager'].includes(profile.role);

    if (!isProvider && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Cannot create invoice for this booking' }),
        { status: 403 }
      );
    }

    // Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('booking_id', body.booking_id)
      .single();

    if (existingInvoice) {
      return new Response(
        JSON.stringify({ error: 'Invoice already exists for this booking' }),
        { status: 400 }
      );
    }

    // Generate invoice number if not provided
    let invoiceNumber = body.invoice_number;
    if (!invoiceNumber) {
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const nextNumber = lastInvoice?.invoice_number
        ? parseInt(lastInvoice.invoice_number.replace('INV', '')) + 1
        : 1;

      invoiceNumber = `INV${nextNumber.toString().padStart(6, '0')}`;
    }

    // Prepare invoice data
    const invoiceData = {
      booking_id: body.booking_id,
      invoice_number: invoiceNumber,
      subtotal: body.subtotal,
      vat_rate: body.vat_rate,
      currency: body.currency || booking.service.currency || 'OMR',
      client_name: body.client_name || booking.client?.full_name || 'N/A',
      client_email: body.client_email || booking.client?.email || 'N/A',
      client_phone: body.client_phone || booking.client?.phone || '',
      provider_id: booking.service.provider_id,
      description: body.description || `Service: ${booking.service.title}`,
      status: 'pending',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date:
        body.due_date ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
    };

    // Create invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select(
        `
        *,
        booking:bookings(*),
        provider:profiles!invoices_provider_id_fkey(full_name, email, company_name)
      `
      )
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return Response.json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: error.errors }),
        { status: 400 }
      );
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(req.url);

    // Query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const status = searchParams.get('status');
    const providerId = searchParams.get('provider_id');
    const _clientId = searchParams.get('client_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      );
    }

    // Get user profile and check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !canViewInvoices(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403 }
      );
    }

    // Build query based on user role
    let query = supabase.from('invoices').select(
      `
        *,
        booking:bookings(*),
        provider:profiles!invoices_provider_id_fkey(full_name, email, company_name),
        payments(id, amount, status, payment_method, processed_at)
      `,
      { count: 'exact' }
    );

    // Apply role-based filtering
    if (profile.role === 'provider') {
      query = query.eq('provider_id', user.id);
    } else if (profile.role === 'client') {
      // Get booking IDs for this client first
      const { data: userBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('client_id', user.id);

      const bookingIds = userBookings?.map(b => b.id) || [];
      if (bookingIds.length > 0) {
        query = query.in('booking_id', bookingIds);
      } else {
        // No bookings, return empty result
        return Response.json({
          data: [],
          pagination: { page, limit, total: 0, pages: 0 },
        });
      }
    }

    // Apply filters
    if (status) query = query.eq('status', status);
    if (providerId && ['admin', 'manager'].includes(profile.role)) {
      query = query.eq('provider_id', providerId);
    }
    if (startDate) query = query.gte('invoice_date', startDate);
    if (endDate) query = query.lte('invoice_date', endDate);

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data: invoices, error, count } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return Response.json({
      data: invoices,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}
